import { consumeApproval } from "./consume.mjs";

const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMERIC_ID = /^[0-9]+$/;
const ALLOWED_PROFILES = new Set(["dsh-headless-probe"]);

function deny(reason) {
  return { decision: "DENY", state: "needs-review", dispatch: false, reason };
}

function validInput(binding, now) {
  return Boolean(
    binding &&
    typeof binding.approvalId === "string" &&
    binding.approvalId.length > 0 &&
    binding.approvalId.length <= 128 &&
    typeof binding.ownerNumericId === "string" && NUMERIC_ID.test(binding.ownerNumericId) &&
    typeof binding.repositoryId === "string" && NUMERIC_ID.test(binding.repositoryId) &&
    Number.isSafeInteger(binding.issueNumber) && binding.issueNumber > 0 &&
    typeof binding.targetSha === "string" && SHA40.test(binding.targetSha) &&
    typeof binding.profile === "string" && ALLOWED_PROFILES.has(binding.profile) &&
    typeof binding.envelopeDigest === "string" && SHA256.test(binding.envelopeDigest) &&
    Number.isSafeInteger(now) && now > 0
  );
}

/**
 * Atomically consumes the approval and creates exactly one durable claim plus
 * outbox event in a single D1 batch transaction. This is a local proof only.
 *
 * The approval ID is the deterministic claim idempotency key. Every statement
 * after the conditional consume is guarded by the exact consumed approval and
 * timestamp. D1 batch rollback prevents a partial claim/outbox commit.
 */
export async function claimAndEnqueue(db, binding, now) {
  if (!validInput(binding, now)) return deny("INVALID_CLAIM_BINDING");
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    return deny("STORAGE_UNAVAILABLE");
  }

  const claimId = binding.approvalId;
  const outboxId = `pool-task:${binding.approvalId}`;

  try {
    const results = await db.batch([
      db.prepare(`
        UPDATE pool_approval_ledger
           SET state = 'consumed', consumed_at = ?
         WHERE approval_id = ?
           AND owner_numeric_id = ?
           AND repository_id = ?
           AND issue_number = ?
           AND target_sha = ?
           AND profile = ?
           AND envelope_digest = ?
           AND state = 'ready'
           AND consumed_at IS NULL
           AND expires_at > ?
      `).bind(
        now, binding.approvalId, binding.ownerNumericId, binding.repositoryId,
        binding.issueNumber, binding.targetSha, binding.profile, binding.envelopeDigest, now
      ),
      db.prepare(`
        INSERT INTO pool_task_claims (
          approval_id, claim_id, envelope_digest, status, created_at
        )
        SELECT approval_id, ?, envelope_digest, 'pending', ?
          FROM pool_approval_ledger
         WHERE approval_id = ? AND state = 'consumed' AND consumed_at = ?
        ON CONFLICT(approval_id) DO NOTHING
      `).bind(claimId, now, binding.approvalId, now),
      db.prepare(`
        INSERT INTO pool_task_outbox (
          outbox_id, approval_id, event_type, envelope_digest, status, created_at
        )
        SELECT ?, approval_id, 'pool.task.claimed', envelope_digest, 'pending', ?
          FROM pool_task_claims
         WHERE approval_id = ? AND claim_id = ?
        ON CONFLICT(approval_id) DO NOTHING
      `).bind(outboxId, now, binding.approvalId, claimId)
    ]);

    if (results?.[0]?.success === true &&
        results[0]?.meta?.changes === 1 &&
        results?.[1]?.success === true &&
        results[1]?.meta?.changes === 1 &&
        results?.[2]?.success === true &&
        results[2]?.meta?.changes === 1) {
      return {
        decision: "CLAIMED_ONCE",
        state: "pending",
        claimId,
        outboxId,
        dispatch: false,
        reason: "ATOMIC_CLAIM_AND_OUTBOX_COMMITTED"
      };
    }

    // An ambiguous retry may observe the already committed transaction.
    const existing = await db.prepare(`
      SELECT c.claim_id, c.envelope_digest, c.status, o.outbox_id, o.status AS outbox_status
        FROM pool_task_claims c
        JOIN pool_task_outbox o ON o.approval_id = c.approval_id
       WHERE c.approval_id = ?
    `).bind(binding.approvalId).first();

    if (existing?.claim_id === claimId &&
        existing?.outbox_id === outboxId &&
        existing?.envelope_digest === binding.envelopeDigest) {
      return {
        decision: "ALREADY_ENQUEUED",
        state: existing.status,
        claimId,
        outboxId,
        outboxState: existing.outbox_status,
        dispatch: false,
        reason: "IDEMPOTENT_RETRY_CONFIRMED"
      };
    }

    return deny("CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED");
  } catch {
    return deny("CLAIM_TRANSACTION_AMBIGUOUS");
  }
}

/** Explicitly retained for parity checks against the original consume proof. */
export { consumeApproval };
