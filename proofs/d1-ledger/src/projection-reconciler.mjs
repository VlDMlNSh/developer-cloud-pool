const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_LABELS = new Set([
  "pool:probe-complete",
  "pool:needs-review",
  "pool:completed",
  "pool:failed"
]);

function retry(reason) {
  return { decision: "RETRYABLE", dispatch: false, projection_verified: false, reason };
}
function deny(reason, extra = {}) {
  return { decision: "DENY", dispatch: false, projection_verified: false, reason, ...extra };
}
function validateEnvelope(e) {
  return Boolean(e && SAFE_ID.test(e.eventId || "") &&
    SHA256.test(e.payloadDigest || "") &&
    Number.isSafeInteger(e.repositoryId) && e.repositoryId > 0 &&
    Number.isSafeInteger(e.issueNumber) && e.issueNumber > 0 &&
    SHA1.test(e.targetSha || "") &&
    Number.isSafeInteger(e.claimGeneration) && e.claimGeneration > 0 &&
    ["succeeded", "failed", "abandoned"].includes(e.terminalOutcome) &&
    Array.isArray(e.managedLabels) && e.managedLabels.length >= 1 &&
    e.managedLabels.length <= 3 &&
    e.managedLabels.every(label => ALLOWED_LABELS.has(label)) &&
    new Set(e.managedLabels).size === e.managedLabels.length);
}
function markerFor(e) {
  return "<!-- pool-projection:" + e.eventId + ":" + e.payloadDigest + " -->";
}
async function readAndVerifyComment(api, e) {
  const comments = await api.listComments(e.repositoryId, e.issueNumber);
  if (!Array.isArray(comments)) return deny("INVALID_COMMENT_READBACK");
  const prefix = "<!-- pool-projection:" + e.eventId + ":";
  const occurrences = [];
  for (const comment of comments) {
    if (typeof comment?.body !== "string") continue;
    let offset = 0;
    while ((offset = comment.body.indexOf(prefix, offset)) !== -1) {
      const start = offset + prefix.length;
      const end = comment.body.indexOf(" -->", start);
      occurrences.push(end < 0 ? null : comment.body.slice(start, end));
      offset = start;
    }
  }
  if (occurrences.length > 1) return deny("DUPLICATE_EVENT_MARKERS", { markerCount: occurrences.length });
  if (occurrences.length === 0) return retry("EVENT_MARKER_NOT_VISIBLE");
  const digest = occurrences[0];
  if (digest !== e.payloadDigest) return deny("EVENT_MARKER_DIGEST_CONFLICT");
  return { decision: "COMMENT_VERIFIED", dispatch: false, projection_verified: false };
}

/**
 * Local-only GitHub projection protocol proof. The injected API is a fake
 * boundary in tests; this module has no network client or credentials.
 * allowPost=false is mandatory for reconciliation-only passes after an
 * ambiguous POST. A new POST requires an explicit bounded retry decision.
 */
export async function reconcileTerminalProjection(api, envelope, { allowPost = false } = {}) {
  if (!validateEnvelope(envelope)) return deny("INVALID_PROJECTION_ENVELOPE");
  if (!api || typeof api.listComments !== "function" ||
      typeof api.createComment !== "function" || typeof api.listLabels !== "function" ||
      typeof api.addLabels !== "function" || typeof api.removeLabel !== "function" ||
      typeof allowPost !== "boolean") return deny("INVALID_PROJECTION_API");

  let commentState;
  try {
    commentState = await readAndVerifyComment(api, envelope);
  } catch {
    return retry("COMMENT_READ_AMBIGUOUS");
  }
  if (commentState.decision === "DENY") return commentState;
  if (commentState.decision === "RETRYABLE") {
    if (!allowPost) return commentState;
    try {
      const body = "Pool terminal projection: " + envelope.terminalOutcome +
        "; target " + envelope.targetSha + "; generation " + envelope.claimGeneration +
        ".\n\n" + markerFor(envelope);
      await api.createComment(envelope.repositoryId, envelope.issueNumber, body);
    } catch {
      // A timeout can hide a successful POST. Do not issue a second POST here.
    }
    try {
      commentState = await readAndVerifyComment(api, envelope);
    } catch {
      return retry("COMMENT_POST_RESPONSE_AMBIGUOUS");
    }
    if (commentState.decision !== "COMMENT_VERIFIED") {
      return commentState.decision === "DENY" ? commentState : retry("COMMENT_POST_NOT_YET_VISIBLE");
    }
  }

  let currentLabels;
  try {
    currentLabels = await api.listLabels(envelope.repositoryId, envelope.issueNumber);
  } catch {
    return retry("LABEL_READ_AMBIGUOUS");
  }
  if (!Array.isArray(currentLabels) || currentLabels.some(x => typeof x !== "string")) {
    return deny("INVALID_LABEL_READBACK");
  }
  const currentManaged = new Set(currentLabels.filter(x => x.startsWith("pool:")));
  const desired = new Set(envelope.managedLabels);
  const add = [...desired].filter(x => !currentManaged.has(x));
  const remove = [...currentManaged].filter(x => !desired.has(x));
  try {
    if (add.length) await api.addLabels(envelope.repositoryId, envelope.issueNumber, add);
    for (const label of remove) await api.removeLabel(envelope.repositoryId, envelope.issueNumber, label);
  } catch {
    return retry("LABEL_MUTATION_AMBIGUOUS");
  }

  let finalLabels;
  try {
    finalLabels = await api.listLabels(envelope.repositoryId, envelope.issueNumber);
  } catch {
    return retry("LABEL_READBACK_AMBIGUOUS");
  }
  if (!Array.isArray(finalLabels) || finalLabels.some(x => typeof x !== "string")) {
    return deny("INVALID_LABEL_READBACK");
  }
  const finalManaged = new Set(finalLabels.filter(x => x.startsWith("pool:")));
  if (finalManaged.size !== desired.size || [...desired].some(x => !finalManaged.has(x))) {
    return retry("MANAGED_LABEL_READBACK_MISMATCH");
  }
  return {
    decision: "PROJECTION_VERIFIED",
    dispatch: false,
    projection_verified: true,
    eventId: envelope.eventId,
    payloadDigest: envelope.payloadDigest,
    commentDelivery: "AT_LEAST_ONCE_WITH_MARKER_RECONCILIATION",
    managedLabels: [...finalManaged].sort()
  };
}
