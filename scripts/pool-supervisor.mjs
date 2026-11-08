import fs from "node:fs";
import { createHash } from "node:crypto";

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const dispatchEnabled = process.env.POOL_DISPATCH_ENABLED === "true";
const authorizationAccepted = process.env.POOL_AUTHORIZATION_CONTRACT_ACCEPTED === "true";
const protectedDefaultRef = process.env.GITHUB_REF === "refs/heads/Основной";
if (!repo || !token) throw new Error("Missing GitHub runtime context.");

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: "Bearer " + token,
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json"
};
function log(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + "\n");
}
function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, name + "=" + value + "\n");
}
async function request(path, options = {}) {
  const response = await fetch("https://api.github.com" + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error("GitHub API " + response.status + ": " + (data && data.message ? data.message : response.statusText));
  }
  return data;
}
async function ensureLabel(name, color, description) {
  try {
    await request("/repos/" + repo + "/labels/" + encodeURIComponent(name));
  } catch (error) {
    if (!String(error.message).includes("404")) throw error;
    await request("/repos/" + repo + "/labels", {
      method: "POST",
      body: JSON.stringify({ name, color, description })
    });
  }
}
async function replaceLabels(issue, removeNames, addNames) {
  const existing = (issue.labels || []).map(label => typeof label === "string" ? label : label.name);
  const next = [...new Set([...existing.filter(name => !removeNames.includes(name)), ...addNames])];
  await request("/repos/" + repo + "/issues/" + issue.number, {
    method: "PATCH",
    body: JSON.stringify({ labels: next })
  });
}
function extract(body, heading, pattern) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(body || "").match(new RegExp("^### " + escaped + "\\s*\\r?\\n+([^\\r\\n]+)", "im"));
  if (!match) return null;
  const value = match[1].trim();
  const checked = value.match(pattern);
  return checked ? checked[0] : null;
}

for (const [name, color, description] of [
  ["pool:ready", "0e8a16", "Owner-approved task ready for cloud dispatch"],
  ["pool:claimed", "1d76db", "Task claimed by the cloud supervisor"],
  ["pool:probe-complete", "0e8a16", "Allowlisted runtime probe completed"],
  ["pool:needs-review", "d93f0b", "Task requires owner review"],
  ["pool:invalid", "b60205", "Task intake failed schema validation"]
]) {
  await ensureLabel(name, color, description);
}

if (!protectedDefaultRef || !dispatchEnabled || !authorizationAccepted) {
  log("Pool Supervisor heartbeat only: dispatch or authorization acceptance gate is absent. No task was claimed or executed.");
} else {
  const issues = await request("/repos/" + repo + "/issues?state=open&labels=" +
    encodeURIComponent("pool:ready") + "&sort=created&direction=asc&per_page=100");
  const candidates = issues.filter(issue => !issue.pull_request);
  if (candidates.length === 0) {
    log("Pool supervisor idle: no owner-approved tasks with pool:ready label.");
  } else {
    const issue = candidates[0];
    const targetSha = extract(issue.body, "Target SHA", /^[0-9a-f]{40}$/);
    const profile = extract(issue.body, "Worker profile", /^DSH headless probe$/);
    if (!targetSha || !profile) {
      await replaceLabels(issue, ["pool:ready"], ["pool:invalid"]);
      log("Rejected task #" + issue.number + ": invalid target SHA or unsupported profile.");
    } else {
      const runId = process.env.GITHUB_RUN_ID;
      const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
      if (!/^[0-9]+$/.test(runId || "") || !/^[0-9]+$/.test(runAttempt || "")) {
        throw new Error("Supervisor run/attempt identity is unavailable; refusing claim.");
      }
      const claimGeneration = "pool:claim-" + runId + "-" + runAttempt;
      await ensureLabel(claimGeneration, "5319e7", "Fenced claim generation for one Supervisor attempt");
      const digest = createHash("sha256").update(String(issue.body || ""), "utf8").digest("hex");
      await replaceLabels(issue, ["pool:ready"], ["pool:claimed", claimGeneration]);
      const readback = await request("/repos/" + repo + "/issues/" + issue.number);
      const labels = (readback.labels || []).map(label => label.name);
      const generations = labels.filter(label => /^pool:claim-[0-9]+-[0-9]+$/.test(label));
      if (!labels.includes("pool:claimed") || labels.includes("pool:ready") ||
          generations.length !== 1 || generations[0] !== claimGeneration ||
          createHash("sha256").update(String(readback.body || ""), "utf8").digest("hex") !== digest ||
          extract(readback.body, "Target SHA", /^[0-9a-f]{40}$/) !== targetSha ||
          extract(readback.body, "Worker profile", /^DSH headless probe$/) !== profile ||
          readback.state !== "open") {
        throw new Error("Claim read-back was ambiguous; reusable Worker will not be called.");
      }
      setOutput("task_issue", String(issue.number));
      setOutput("target_sha", targetSha);
      setOutput("profile", "dsh-headless-probe");
      setOutput("envelope_digest", digest);
      setOutput("claim_generation", claimGeneration);
      setOutput("run_id", runId);
      setOutput("run_attempt", runAttempt);
      log("Claimed one task #" + issue.number + " with fenced generation after exact read-back; awaiting reusable Worker.");
    }
  }
}
