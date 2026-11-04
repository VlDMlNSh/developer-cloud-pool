const TARGET_SHA = /^[0-9a-f]{40}$/;
const ALLOWED_PROFILE = "DSH headless probe";
const MAX_TASKS = 20;

function extractEnvelope(body) {
  const source = String(body || "");
  const targetSha = source.match(/^### Target SHA\\s*\\r?\\n+([0-9a-f]{40})\\s*$/im)?.[1] || null;
  const profile = source.match(/^### Worker profile\\s*\\r?\\n+([^\\r\\n]+)\\s*$/im)?.[1]?.trim() || null;
  if (!targetSha || !TARGET_SHA.test(targetSha) || profile !== ALLOWED_PROFILE) return null;
  return { targetSha, profile };
}

/**
 * Build a bounded, deterministic matrix from issue records and independently
 * verified owner-approval envelopes. This function performs no I/O and does
 * not dispatch workflows. The caller must obtain approval via pool-approval.mjs.
 */
export function buildTaskMatrix(candidates, { maxTasks = MAX_TASKS } = {}) {
  if (!Array.isArray(candidates)) throw new TypeError("Task candidates must be an array.");
  if (!Number.isInteger(maxTasks) || maxTasks < 1 || maxTasks > MAX_TASKS) {
    throw new RangeError("maxTasks must be an integer between 1 and 20.");
  }
  if (candidates.length > maxTasks) {
    throw new RangeError("Candidate count exceeds the configured task matrix bound.");
  }

  const seen = new Set();
  const include = [];
  for (const candidate of candidates) {
    const issue = candidate?.issue;
    const approval = candidate?.approval;
    if (!issue || !Number.isSafeInteger(issue.number) || issue.number < 1) {
      throw new TypeError("Every candidate must contain a valid issue number.");
    }
    if (seen.has(issue.number)) throw new Error("Duplicate task issue #" + issue.number + ".");
    seen.add(issue.number);
    if (issue.pull_request || issue.state !== "open") {
      throw new Error("Task issue #" + issue.number + " is not an open issue.");
    }
    const labels = (issue.labels || []).map((label) => typeof label === "string" ? label : label?.name);
    if (!labels.includes("pool:ready")) {
      throw new Error("Task issue #" + issue.number + " is not marked pool:ready.");
    }
    const envelope = extractEnvelope(issue.body);
    if (!envelope) throw new Error("Task issue #" + issue.number + " has an invalid task envelope.");
    if (!approval || approval.issueNumber !== issue.number ||
        approval.targetSha !== envelope.targetSha || approval.profile !== envelope.profile) {
      throw new Error("Task issue #" + issue.number + " lacks a matching verified owner approval.");
    }
    include.push({
      task_issue: String(issue.number),
      target_sha: envelope.targetSha,
      profile: "dsh-headless-probe"
    });
  }
  return { include };
}
