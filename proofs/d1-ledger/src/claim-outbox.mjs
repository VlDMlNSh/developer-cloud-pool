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

async function logicalTaskKey(binding) {
  const canonical = JSON.stringify([
    "pool-task-v1",
    binding.repositoryId,
    binding.issueNumber,
    binding.targetSha,
    binding.profile,
    1
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Local-only proof: multiple independently consumed approvals can attach to
 * one canonical logical task. The migration trigger creates one task and one
 * task-level outbox row transactionally with ready -> consumed.
 * No dispatch capability is exposed.
 */
export async function claimLogicalTask(db, binding, now) {
  if (!validInput(binding, now)) return deny("INVALID_CLAIM_BINDING");
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");

  try {
    const taskKey = await logicalTaskKey(binding);
    const prior = await db.prepare(
      "SELECT repository_id, issue_number, target_sha, profile FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();

    if (prior && (
      prior.repository_id !== binding.repositoryId ||
      prior.issue_number !== binding.issueNumber ||
      prior.target_sha !== binding.targetSha ||
      prior.profile !== binding.profile
    )) return deny("TASK_KEY_BINDING_CONFLICT");

    const changed = await db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?
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
      now, taskKey, binding.approvalId, binding.ownerNumericId,
      binding.repositoryId, binding.issueNumber, binding.targetSha,
      binding.profile, binding.envelopeDigest, now
    ).run();

    const attached = await db.prepare(`
      SELECT t.task_key, t.state, t.lease_generation,
             o.outbox_id, o.status AS outbox_status,
             a.envelope_digest
        FROM pool_tasks t
        JOIN pool_task_approvals a ON a.task_key = t.task_key
        JOIN pool_task_delivery_outbox o ON o.task_key = t.task_key
       WHERE t.task_key = ? AND a.approval_id = ?
    `).bind(taskKey, binding.approvalId).first();

    if (!attached || attached.envelope_digest !== binding.envelopeDigest) {
      return deny(changed?.success && changed?.meta?.changes > 0
        ? "TASK_ATTACH_OR_OUTBOX_INCOMPLETE"
        : "APPROVAL_NOT_CONSUMED_OR_ALREADY_ATTACHED");
    }

    const first = changed?.success === true && changed?.meta?.changes > 0;
    return {
      decision: first ? "TASK_CREATED_OR_ATTACHED" : "TASK_ALREADY_ATTACHED",
      taskKey: attached.task_key,
      taskState: attached.state,
      generation: attached.lease_generation,
      outboxId: attached.outbox_id,
      outboxState: attached.outbox_status,
      dispatch: false,
      reason: first ? "APPROVAL_CONSUMED_AND_TASK_ATTACHED" : "IDEMPOTENT_TASK_ATTACHMENT"
    };
  } catch {
    return deny("TASK_CLAIM_OUTCOME_AMBIGUOUS");
  }
}

/** Existing per-approval proof retained for historical parity. */
export async function claimAndEnqueue(db, binding, now) {
  if (!validInput(binding, now)) return deny("INVALID_CLAIM_BINDING");
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");

  const claimId = binding.approvalId;
  const outboxId = `pool-task:${binding.approvalId}`;

  try {
    const result = await db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?
       WHERE approval_id = ? AND owner_numeric_id = ? AND repository_id = ?
         AND issue_number = ? AND target_sha = ? AND profile = ?
         AND envelope_digest = ? AND state = 'ready'
         AND consumed_at IS NULL AND expires_at > ?
    `).bind(
      now, binding.approvalId, binding.ownerNumericId, binding.repositoryId,
      binding.issueNumber, binding.targetSha, binding.profile, binding.envelopeDigest, now
    ).run();

    const existing = await db.prepare(`
      SELECT c.claim_id, c.envelope_digest, c.status, o.outbox_id,
             o.status AS outbox_status, a.owner_numeric_id, a.repository_id,
             a.issue_number, a.target_sha, a.profile
        FROM pool_task_claims c
        JOIN pool_task_outbox o ON o.approval_id = c.approval_id
        JOIN pool_approval_ledger a ON a.approval_id = c.approval_id
       WHERE c.approval_id = ?
    `).bind(binding.approvalId).first();

    if (existing?.claim_id !== claimId || existing?.outbox_id !== outboxId ||
        existing?.envelope_digest !== binding.envelopeDigest ||
        existing?.owner_numeric_id !== binding.ownerNumericId ||
        existing?.repository_id !== binding.repositoryId ||
        existing?.issue_number !== binding.issueNumber ||
        existing?.target_sha !== binding.targetSha || existing?.profile !== binding.profile) {
      return deny(result?.success === true && result?.meta?.changes > 0
        ? "CLAIM_TRIGGER_DID_NOT_CREATE_COMPLETE_PAIR"
        : "CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED");
    }

    return {
      decision: result?.success === true && result?.meta?.changes > 0 ? "CLAIMED_ONCE" : "ALREADY_ENQUEUED",
      state: existing.status, claimId, outboxId, outboxState: existing.outbox_status,
      dispatch: false, reason: "LOCAL_PER_APPROVAL_PROOF"
    };
  } catch {
    return deny("CLAIM_TRANSACTION_AMBIGUOUS");
  }
}

export { consumeApproval };
