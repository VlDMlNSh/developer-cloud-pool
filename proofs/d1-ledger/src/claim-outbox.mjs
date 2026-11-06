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
 * The approval's conditional ready -> consumed UPDATE is the sole write.
 * A SQLite AFTER UPDATE trigger creates the durable claim and outbox event in
 * the same transaction. The trigger fires only for the transaction that
 * actually changes the state, eliminating timestamp-based attribution.
 *
 * This remains a local proof adapter. It never dispatches work.
 */
export async function claimAndEnqueue(db, binding, now) {
  if (!validInput(binding, now)) return deny("INVALID_CLAIM_BINDING");
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");

  const claimId = binding.approvalId;
  const outboxId = `pool-task:${binding.approvalId}`;

  try {
    const result = await db.prepare(`
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
    ).run();

    const existing = await db.prepare(`
      SELECT c.claim_id, c.envelope_digest, c.status, o.outbox_id, o.status AS outbox_status
        FROM pool_task_claims c
        JOIN pool_task_outbox o ON o.approval_id = c.approval_id
       WHERE c.approval_id = ?
    `).bind(binding.approvalId).first();

    if (existing?.claim_id !== claimId ||
        existing?.outbox_id !== outboxId ||
        existing?.envelope_digest !== binding.envelopeDigest) {
      return deny(result?.success === true && result?.meta?.changes === 1
        ? "CLAIM_TRIGGER_DID_NOT_CREATE_COMPLETE_PAIR"
        : "CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED");
    }

    if (result?.success === true && result?.meta?.changes === 1) {
      return {
        decision: "CLAIMED_ONCE",
        state: existing.status,
        claimId,
        outboxId,
        outboxState: existing.outbox_status,
        dispatch: false,
        reason: "ATOMIC_STATE_TRANSITION_TRIGGER_COMMITTED"
      };
    }

    return {
      decision: "ALREADY_ENQUEUED",
      state: existing.status,
      claimId,
      outboxId,
      outboxState: existing.outbox_status,
      dispatch: false,
      reason: "IDEMPOTENT_RETRY_CONFIRMED"
    };
  } catch {
    return deny("CLAIM_TRANSACTION_AMBIGUOUS");
  }
}

/** Explicitly retained for parity checks against the original consume proof. */
export { consumeApproval };
