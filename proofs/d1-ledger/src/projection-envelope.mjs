const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

/**
 * Maps one committed pool_attempt_projection_outbox row to the projection
 * protocol envelope. This is a pure adapter: it performs no I/O and grants
 * no dispatch or task/attempt mutation authority.
 */
export function projectionEnvelopeFromOutbox(row) {
  if (!row || typeof row !== "object") return { decision: "DENY", reason: "INVALID_OUTBOX_ROW", dispatch: false };
  const repositoryId = Number(row.repository_id);
  const issueNumber = Number(row.issue_number);
  const claimGeneration = Number(row.lease_generation);
  const eventId = row.outbox_id;
  const payloadDigest = row.event_digest;
  const terminalOutcome = row.terminal_status;
  const targetSha = row.target_sha;
  const profile = row.profile;
  if (!SAFE_ID.test(eventId || "") || !SHA256.test(payloadDigest || "") ||
      !Number.isSafeInteger(repositoryId) || repositoryId <= 0 ||
      !Number.isSafeInteger(issueNumber) || issueNumber <= 0 ||
      !Number.isSafeInteger(claimGeneration) || claimGeneration <= 0 ||
      !SHA1.test(targetSha || "") ||
      typeof profile !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(profile) ||
      !["succeeded", "failed", "abandoned"].includes(terminalOutcome)) {
    return { decision: "DENY", reason: "INVALID_OUTBOX_ROW", dispatch: false };
  }
  const managedLabels = terminalOutcome === "succeeded"
    ? ["pool:probe-complete"]
    : ["pool:needs-review"];
  return {
    decision: "PROJECTION_ENVELOPE_READY",
    dispatch: false,
    envelope: {
      eventId, payloadDigest, repositoryId, issueNumber, targetSha,
      claimGeneration, terminalOutcome, profile, managedLabels
    }
  };
}
