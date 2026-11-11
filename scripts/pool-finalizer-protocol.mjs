import { buildFinalizationPlan, envelopeDigest, extractTargetSha } from "./pool-finalizer.mjs";

function retry(reason) {
  return { decision: "RETRYABLE", dispatch: false, finalized: false, reason };
}
function deny(reason) {
  return { decision: "DENY", dispatch: false, finalized: false, reason };
}
function labelsOf(issue) {
  return (issue.labels || []).map(label => typeof label === "string" ? label : label.name);
}
function markerFor(expected) {
  return "<!-- pool-finalizer:" + expected.runId + ":" + expected.runAttempt + ":" +
    expected.envelopeDigest + " -->";
}
function inspectMarker(comments, expected) {
  if (!Array.isArray(comments)) return deny("INVALID_COMMENT_READBACK");
  const prefix = "<!-- pool-finalizer:" + expected.runId + ":" + expected.runAttempt + ":";
  const bodies = comments.map(comment => comment?.body).filter(body => typeof body === "string");
  const digests = [];
  for (const body of bodies) {
    let offset = 0;
    while ((offset = body.indexOf(prefix, offset)) !== -1) {
      const start = offset + prefix.length;
      const end = body.indexOf(" -->", start);
      digests.push(end < 0 ? null : body.slice(start, end));
      offset = start;
    }
  }
  if (digests.length > 1) return deny("DUPLICATE_FINALIZER_MARKERS");
  if (digests.length === 0) return { decision: "MISSING" };
  if (digests[0] !== expected.envelopeDigest) return deny("FINALIZER_MARKER_DIGEST_CONFLICT");
  return { decision: "VERIFIED" };
}
function validateEnvelope(issue, expected) {
  if (!issue || Number(issue.number) !== Number(expected.issueNumber)) throw new Error("Task issue identity mismatch.");
  if (issue.pull_request || issue.state !== "open") throw new Error("Task issue must remain open during finalization.");
  if (envelopeDigest(String(issue.body || "")) !== expected.envelopeDigest) throw new Error("Immutable task envelope digest mismatch.");
  if (extractTargetSha(String(issue.body || "")) !== expected.targetSha) throw new Error("Target SHA does not match the immutable task envelope.");
}
function isAlreadyFinalized(issue, expected) {
  const labels = labelsOf(issue);
  const terminal = expected.workerResult === "success" ? "pool:probe-complete" : "pool:needs-review";
  const states = labels.filter(label => [
    "pool:ready", "pool:claimed", "pool:probe-complete", "pool:needs-review", "pool:invalid"
  ].includes(label));
  const generations = labels.filter(label => /^pool:claim-[0-9]+-[0-9]+$/.test(label));
  return states.length === 1 && states[0] === terminal && generations.length === 0;
}
function expectedHumanLabels(issue) {
  return labelsOf(issue).filter(label =>
    !["pool:ready", "pool:claimed", "pool:probe-complete", "pool:needs-review", "pool:invalid"].includes(label) &&
    !/^pool:claim-[0-9]+-[0-9]+$/.test(label)
  ).sort();
}
function terminalReadback(issue, expected, plan, humanLabels) {
  try {
    validateEnvelope(issue, expected);
  } catch (error) {
    return deny(error.message);
  }
  const labels = labelsOf(issue);
  const generations = labels.filter(label => /^pool:claim-[0-9]+-[0-9]+$/.test(label));
  if (issue.state !== "open" || !labels.includes(plan.terminalLabel) ||
      labels.includes("pool:claimed") || labels.includes("pool:ready") || generations.length !== 0) {
    return retry("TERMINAL_STATE_READBACK_MISMATCH");
  }
  const actualHuman = expectedHumanLabels(issue);
  if (JSON.stringify(actualHuman) !== JSON.stringify([...humanLabels].sort())) {
    return retry("CONCURRENT_LABEL_CHANGE_DETECTED_AFTER_NON_CAS_PATCH");
  }
  return {
    decision: "FINALIZED",
    dispatch: false,
    finalized: true,
    terminalLabel: plan.terminalLabel,
    auditMarker: markerFor(expected)
  };
}

/**
 * Injectable finalizer protocol. Comments are written and read back BEFORE
 * terminal label mutation, so a terminal label cannot be committed by this
 * protocol without a visible deterministic audit marker.
 *
 * GitHub's issue-label PATCH endpoint does not provide an atomic compare-and-swap.
 * A concurrent label mutation
 * between read and PATCH may be overwritten; read-back can detect but cannot
 * atomically prevent or roll back that race.
 */
export async function finalizeWithTransport(api, expected) {
  if (!api || typeof api.readIssue !== "function" ||
      typeof api.replaceLabels !== "function" ||
      typeof api.listComments !== "function" ||
      typeof api.createComment !== "function") return deny("INVALID_FINALIZER_TRANSPORT");

  let issue;
  try {
    issue = await api.readIssue();
    validateEnvelope(issue, expected);
  } catch (error) {
    return deny(error.message || "TASK_READ_FAILED");
  }

  const marker = markerFor(expected);
  const terminalLabel = expected.workerResult === "success" ? "pool:probe-complete" : "pool:needs-review";
  if (isAlreadyFinalized(issue, expected)) {
    let markerState;
    try {
      markerState = inspectMarker(await api.listComments(), expected);
    } catch {
      return retry("FINALIZED_COMMENT_READ_AMBIGUOUS");
    }
    if (markerState.decision === "DENY") return markerState;
    if (markerState.decision !== "VERIFIED") return retry("FINALIZED_WITHOUT_AUDIT_MARKER");
    return {
      decision: "ALREADY_FINALIZED",
      dispatch: false,
      finalized: true,
      terminalLabel,
      auditMarker: marker
    };
  }

  let plan;
  try {
    plan = buildFinalizationPlan(issue, expected);
  } catch (error) {
    return deny(error.message);
  }
  const humanLabels = expectedHumanLabels(issue);

  let markerState;
  try {
    markerState = inspectMarker(await api.listComments(), expected);
  } catch {
    return retry("AUDIT_MARKER_READ_AMBIGUOUS");
  }
  if (markerState.decision === "DENY") return markerState;
  if (markerState.decision !== "VERIFIED") {
    const body = [
      "**" + plan.auditMarker + "**",
      "",
      "- Supervisor run: " + expected.runId,
      "- Supervisor attempt: " + expected.runAttempt,
      "- Claim generation: " + expected.runId + "-" + expected.runAttempt,
      "- Envelope SHA-256: " + expected.envelopeDigest,
      "- Target SHA: " + expected.targetSha,
      "- Worker reusable workflow result: " + expected.workerResult,
      "- Event semantics: terminalization intent; terminal labels are applied only after marker read-back",
      "- Production qualification: NOT CLAIMED",
      "",
      marker
    ].join("\n");
    try {
      await api.createComment(body);
    } catch {
      // A lost response may hide a successful POST; reconcile by marker read-back.
    }
    try {
      markerState = inspectMarker(await api.listComments(), expected);
    } catch {
      return retry("AUDIT_MARKER_POST_RESPONSE_AMBIGUOUS");
    }
    if (markerState.decision === "DENY") return markerState;
    if (markerState.decision !== "VERIFIED") return retry("AUDIT_MARKER_NOT_VISIBLE");
  }

  // Re-read after the audit marker is durable and immediately before PATCH.
  try {
    issue = await api.readIssue();
    validateEnvelope(issue, expected);
    plan = buildFinalizationPlan(issue, expected);
  } catch (error) {
    return deny(error.message || "TASK_CHANGED_BEFORE_TERMINAL_PATCH");
  }

  try {
    await api.replaceLabels(plan.labels);
  } catch {
    // PATCH may have committed despite a lost response. Only read-back decides.
  }

  let readback;
  try {
    readback = await api.readIssue();
  } catch {
    return retry("TERMINAL_PATCH_RESPONSE_AMBIGUOUS");
  }
  return terminalReadback(readback, expected, plan, humanLabels);
}
