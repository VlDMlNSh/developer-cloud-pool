import { finalizeWithTransport } from "./pool-finalizer-protocol.mjs";

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
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error("GitHub API " + response.status);
  return data;
}
const api = {
  readIssue: () => request(""),
  replaceLabels: labels => request("", {
    method: "PATCH",
    body: JSON.stringify({ labels })
  }),
  listComments: () => request("/comments?per_page=100"),
  createComment: body => request("/comments", {
    method: "POST",
    body: JSON.stringify({ body })
  })
};
const expected = {
  issueNumber: Number(e.TASK_ISSUE),
  envelopeDigest: e.ENVELOPE_DIGEST,
  targetSha: e.TARGET_SHA,
  runId: e.SUPERVISOR_RUN_ID,
  runAttempt: e.SUPERVISOR_RUN_ATTEMPT,
  workerResult: e.WORKER_RESULT
};
const result = await finalizeWithTransport(api, expected);
if (!result.finalized) {
  throw new Error("Finalizer did not verify terminal state: " + result.decision + "/" + result.reason);
}
console.log("Task #" + e.TASK_ISSUE + " finalizer result: " + result.decision + " (" + result.terminalLabel + ").");
