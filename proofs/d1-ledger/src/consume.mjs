const ALLOWED_PROFILES = new Set(["dsh-headless-probe"]);
const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMERIC_ID = /^[0-9]+$/;

function validBinding(binding, now) {
  return Boolean(
    binding &&
    typeof binding.approvalId === "string" &&
    binding.approvalId.length > 0 &&
    binding.approvalId.length <= 128 &&
    typeof binding.ownerNumericId === "string" &&
    NUMERIC_ID.test(binding.ownerNumericId) &&
    typeof binding.repositoryId === "string" &&
    NUMERIC_ID.test(binding.repositoryId) &&
    Number.isSafeInteger(binding.issueNumber) &&
    binding.issueNumber > 0 &&
    typeof binding.targetSha === "string" &&
    SHA40.test(binding.targetSha) &&
    typeof binding.profile === "string" &&
    ALLOWED_PROFILES.has(binding.profile) &&
    typeof binding.envelopeDigest === "string" &&
    SHA256.test(binding.envelopeDigest) &&
    Number.isSafeInteger(now) &&
    now > 0
  );
}

function deny(reason) {
  return {
    decision: "DENY",
    state: "needs-review",
    dispatch: false,
    reason
  };
}

/**
 * Atomically consumes one pre-existing owner approval in D1.
 *
 * This module intentionally has no Worker entrypoint, GitHub client,
 * dispatch capability, provider client, or secret access. It is a local
 * proof adapter only and must not be mounted in the production Hono Worker.
 */
export async function consumeApproval(db, binding, now) {
  if (!validBinding(binding, now)) return deny("INVALID_APPROVAL_BINDING");
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");

  try {
    const result = await db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed',
             consumed_at = ?
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
      now,
      binding.approvalId,
      binding.ownerNumericId,
      binding.repositoryId,
      binding.issueNumber,
      binding.targetSha,
      binding.profile,
      binding.envelopeDigest,
      now
    ).run();

    if (result?.success === true && result?.meta?.changes > 0) {
      return {
        decision: "ALLOW_ONCE",
        state: "consumed",
        dispatch: false,
        reason: "FIRST_CONSUME_CONFIRMED"
      };
    }

    return deny("NO_MATCH_OR_ALREADY_CONSUMED");
  } catch {
    // A failed or ambiguous storage response must never authorize a retry.
    return deny("STORAGE_OUTCOME_AMBIGUOUS");
  }
}
