import { createHash } from "node:crypto";

export const MANAGED_STATE_LABELS = [
  "pool:ready",
  "pool:claimed",
  "pool:probe-complete",
  "pool:needs-review",
  "pool:invalid"
];

const CLAIM_LABEL_PREFIX = "pool:claim-";
const CLAIM_LABEL_PATTERN = /^pool:claim-([0-9]+)-([0-9]+)$/;

export function claimGenerationLabel(runId, runAttempt) {
  if (!/^[0-9]+$/.test(String(runId)) || !/^[0-9]+$/.test(String(runAttempt))) {
    throw new Error("Invalid Supervisor run/attempt identity.");
  }
  return CLAIM_LABEL_PREFIX + String(runId) + "-" + String(runAttempt);
}

export function extractTargetSha(body) {
  if (typeof body !== "string") throw new Error("Task envelope body is missing.");
  const matches = [...body.matchAll(/^### Target SHA\s*\r?\n+([^\r\n]+)$/gim)];
  if (matches.length !== 1) throw new Error("Task envelope must contain exactly one Target SHA field.");
  const value = matches[0][1].trim();
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error("Task envelope Target SHA is invalid.");
  return value;
}

export function envelopeDigest(body) {
  if (typeof body !== "string") throw new Error("Task envelope body is missing.");
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function labelsOf(issue) {
  return (issue.labels || []).map(label => typeof label === "string" ? label : label.name);
}

export function buildFinalizationPlan(issue, expected) {
  if (!issue || Number(issue.number) !== Number(expected.issueNumber)) {
    throw new Error("Task issue identity mismatch.");
  }
  if (issue.pull_request || issue.state !== "open") {
    throw new Error("Task issue must remain open during finalization.");
  }
  if (!/^[0-9a-f]{64}$/.test(String(expected.envelopeDigest || ""))) {
    throw new Error("Expected envelope digest is invalid.");
  }
  if (envelopeDigest(String(issue.body || "")) !== expected.envelopeDigest) {
    throw new Error("Immutable task envelope digest mismatch.");
  }
  if (!/^[0-9a-f]{40}$/.test(String(expected.targetSha || "")) ||
      extractTargetSha(String(issue.body || "")) !== expected.targetSha) {
    throw new Error("Target SHA does not match the immutable task envelope.");
  }

  const expectedGeneration = claimGenerationLabel(expected.runId, expected.runAttempt);
  const labels = labelsOf(issue);
  const generations = labels.filter(label => CLAIM_LABEL_PATTERN.test(label));
  if (generations.length !== 1 || generations[0] !== expectedGeneration) {
    throw new Error("Claim generation mismatch or ambiguity.");
  }

  const states = labels.filter(label => MANAGED_STATE_LABELS.includes(label));
  if (states.length !== 1 || states[0] !== "pool:claimed") {
    throw new Error("Task is not in the unique claimed state.");
  }

  const success = expected.workerResult === "success";
  const terminalLabel = success ? "pool:probe-complete" : "pool:needs-review";
  const retained = labels.filter(label =>
    !MANAGED_STATE_LABELS.includes(label) && !CLAIM_LABEL_PATTERN.test(label)
  );
  return {
    terminalLabel,
    labels: [...new Set([...retained, terminalLabel])],
    auditMarker: success ? "POOL_WORKER_COMPLETE" : "POOL_WORKER_NEEDS_REVIEW"
  };
}
