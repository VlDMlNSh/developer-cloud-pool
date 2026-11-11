import { buildFinalizationPlan } from "./pool-finalizer.mjs";

const e = process.env;
const required = [
  "GITHUB_REPOSITORY", "GITHUB_TOKEN", "TASK_ISSUE", "TARGET_SHA",
  "WORKER_RESULT", "SUPERVISOR_RUN_ID", "SUPERVISOR_RUN_ATTEMPT",
  "CLAIM_GENERATION", "ENVELOPE_DIGEST"
];
for (const key of required) {
  if (!e[key]) throw new Error("Missing finalizer input: " + key);
}
if (!/^\d+$/.test(e.TASK_ISSUE)) throw new Error("Invalid task issue number.");
if (!/^[0-9a-f]{40}$/.test(e.TARGET_SHA)) throw new Error("Invalid target SHA.");
if (!/^[0-9]+$/.test(e.SUPERVISOR_RUN_ID) || !/^[0-9]+$/.test(e.SUPERVISOR_RUN_ATTEMPT)) {
  throw new Error("Invalid Supervisor run/attempt identity.");
}
const expectedGeneration = "pool:claim-" + e.SUPERVISOR_RUN_ID + "-" + e.SUPERVISOR_RUN_ATTEMPT;
if (e.CLAIM_GENERATION !== expectedGeneration) throw new Error("Claim generation input does not match this run.");
if (!/^[0-9a-f]{64}$/.test(e.ENVELOPE_DIGEST)) throw new Error("Invalid immutable envelope digest.");

const base = "https://api.github.com/repos/" + e.GITHUB_REPOSITORY + "/issues/" + e.TASK_ISSUE;
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: "Bearer " + e.GITHUB_TOKEN,
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json"
};
async function readIssue() {
  const response = await fetch(base, { headers });
  if (!response.ok) throw new Error("Cannot read task: HTTP " + response.status);
  return response.json();
}
async function writeLabels(labels) {
  const response = await fetch(base, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ labels })
  });
  if (!response.ok) throw new Error("Cannot set terminal state: HTTP " + response.status);
  return response.json();
}

const expected = {
  issueNumber: Number(e.TASK_ISSUE),
  envelopeDigest: e.ENVELOPE_DIGEST,\n  targetSha: e.TARGET_SHA,
  runId: e.SUPERVISOR_RUN_ID,
  runAttempt: e.SUPERVISOR_RUN_ATTEMPT,
  workerResult: e.WORKER_RESULT
};

// Re-read immediately before mutation. GitHub's issue-label PATCH endpoint
// does not provide an atomic compare-and-swap, so a race window remains.
const initial = await readIssue();
buildFinalizationPlan(initial, expected);
const current = await readIssue();
const plan = buildFinalizationPlan(current, expected);
const updated = await writeLabels(plan.labels);
const updatedLabels = (updated.labels || []).map(label => label.name);
if (!updatedLabels.includes(plan.terminalLabel) ||
    updatedLabels.includes("pool:claimed") ||
    updatedLabels.includes("pool:ready") ||
    updatedLabels.includes(e.CLAIM_GENERATION)) {
  throw new Error("Terminal write response mismatch; manual review required.");
}

const readback = await readIssue();
const readbackLabels = (readback.labels || []).map(label => label.name);
if (readback.state !== "open" ||
    readback.body !== current.body ||
    !readbackLabels.includes(plan.terminalLabel) ||
    readbackLabels.includes("pool:claimed") ||
    readbackLabels.includes("pool:ready") ||
    readbackLabels.includes(e.CLAIM_GENERATION)) {
  throw new Error("Terminal state read-back mismatch; manual review required.");
}

const body = [
  "**" + plan.auditMarker + "**",
  "",
  "- Supervisor run: " + e.SUPERVISOR_RUN_ID,
  "- Supervisor attempt: " + e.SUPERVISOR_RUN_ATTEMPT,
  "- Claim generation: " + e.CLAIM_GENERATION,
  "- Envelope SHA-256: " + e.ENVELOPE_DIGEST,
  "- Target SHA: " + e.TARGET_SHA,
  "- Worker reusable workflow result: " + e.WORKER_RESULT,
  "- Provider credentials: none",
  "- Production qualification: NOT CLAIMED"
].join("\n");
const posted = await fetch(base + "/comments", {
  method: "POST",
  headers,
  body: JSON.stringify({ body })
});
if (!posted.ok) throw new Error("Cannot append audit comment: HTTP " + posted.status);
console.log("Task #" + e.TASK_ISSUE + " finalized as " + plan.terminalLabel + " for " + e.CLAIM_GENERATION + ".");
