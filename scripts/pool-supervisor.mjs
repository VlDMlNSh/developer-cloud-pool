import fs from "node:fs";
import { getOwnerApproval, formatOwnerApproval, formatOwnerApprovalConsumed, formatOwnerApprovalRevoked, hasOwnerApproval } from "./pool-approval.mjs";

const ownerRepo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const api = "https://api.github.com";
const defaultBranch = process.env.POOL_DEFAULT_BRANCH || process.env.GITHUB_REF_NAME;
const eventName = process.env.GITHUB_EVENT_NAME;
const repositoryOwner = (ownerRepo || "").split("/")[0];
let eventPayload = {};
try {
  if (process.env.GITHUB_EVENT_PATH) eventPayload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
} catch {
  throw new Error("Cannot parse the GitHub event payload; refusing pool reconciliation.");
}
const maxDispatch = Number(process.env.POOL_MAX_DISPATCH || "20");
const dispatchEnabled = process.env.POOL_DISPATCH_ENABLED === "true";

if (!ownerRepo || !token || !defaultBranch) throw new Error("Missing required GitHub runtime context.");
if (!dispatchEnabled) {
  console.log("Pool Supervisor heartbeat only: dispatch is disabled pending default-branch governance and owner approval.");
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "Pool Supervisor heartbeat only; dispatch disabled.\n");
  process.exit(0);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: "Bearer " + token,
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const response = await fetch(api + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === "object" && data ? (data.message || response.statusText) : response.statusText;
    throw new Error("GitHub API " + response.status + ": " + message);
  }
  return data;
}

function log(message) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + "\n");
}

async function ensureLabel(name, color, description) {
  try {
    await request("/repos/" + ownerRepo + "/labels/" + encodeURIComponent(name));
  } catch (error) {
    if (!String(error.message).includes("404")) throw error;
    await request("/repos/" + ownerRepo + "/labels", {
      method: "POST",
      body: JSON.stringify({ name, color, description })
    });
  }
}

async function replaceIssueLabels(issue, removeNames, addNames) {
  const existing = (issue.labels || []).map(label => typeof label === "string" ? label : label.name);
  const next = [...new Set([...existing.filter(name => !removeNames.includes(name)), ...addNames])];
  await request("/repos/" + ownerRepo + "/issues/" + issue.number, {
    method: "PATCH",
    body: JSON.stringify({ labels: next })
  });
}

async function comment(issueNumber, body) {
  await request("/repos/" + ownerRepo + "/issues/" + issueNumber + "/comments", {
    method: "POST",
    body: JSON.stringify({ body })
  });
}

async function recordOwnerApproval() {
  if (eventName !== "issues") return;
  const issueNumber = eventPayload.issue?.number;
  if (!Number.isInteger(issueNumber) || eventPayload.issue?.pull_request) return;

  if (eventPayload.action === "unlabeled" && eventPayload.label?.name === "pool:ready") {
    await comment(issueNumber, formatOwnerApprovalRevoked(issueNumber));
    log("Revoked prior owner approval for issue #" + issueNumber + " after pool:ready was removed.");
    return;
  }

  if (eventPayload.action !== "labeled" || eventPayload.label?.name !== "pool:ready") return;
  const approval = getOwnerApproval(eventPayload, repositoryOwner);
  if (!approval) {
    const current = await request("/repos/" + ownerRepo + "/issues/" + issueNumber);
    await replaceIssueLabels(current, ["pool:ready"], ["pool:needs-review"]);
    await comment(issueNumber,
      "**POOL_OWNER_APPROVAL_REJECTED**\n\nThe `pool:ready` label was not applied by the repository owner to an open issue with the exact allowlisted task envelope. No worker was dispatched.");
    await comment(issueNumber, formatOwnerApprovalRevoked(issueNumber));
    log("Rejected pool:ready label event for issue #" + issueNumber + ": owner approval or task envelope invalid.");
    return;
  }

  const comments = await request("/repos/" + ownerRepo + "/issues/" + issueNumber + "/comments?per_page=100");
  const expected = { issueNumber: approval.issueNumber, targetSha: approval.targetSha, profile: approval.profile };
  if (!hasOwnerApproval(comments, expected, repositoryOwner)) {
    await comment(issueNumber, formatOwnerApproval(approval));
    log("Recorded owner approval marker for issue #" + issueNumber + " at immutable SHA " + approval.targetSha + ".");
  }
}
function extractTargetSha(body) {
  const match = String(body || "").match(/^### Target SHA\s*\r?\n+([0-9a-f]{40})\s*$/im);
  return match ? match[1] : null;
}

function extractProfile(body) {
  const match = String(body || "").match(/^### Worker profile\s*\r?\n+([^\r\n]+)\s*$/im);
  return match ? match[1].trim() : null;
}

async function ensureLabels() {
  const labels = [
    ["pool:ready", "0e8a16", "Owner-approved task ready for cloud dispatch"],
    ["pool:claimed", "1d76db", "Task claimed by the cloud supervisor"],
    ["pool:probe-complete", "0e8a16", "Allowlisted runtime probe completed"],
    ["pool:needs-review", "d93f0b", "Task requires owner review"],
    ["pool:invalid", "b60205", "Task intake failed schema validation"]
  ];
  for (const item of labels) await ensureLabel(item[0], item[1], item[2]);
}

async function recoverFailedWorkflowRun() {
  const title = process.env.POOL_RUN_TITLE || "";
  const conclusion = process.env.POOL_RUN_CONCLUSION || "";
  const match = title.match(/Pool task #(\d+)/);
  if (!match || conclusion === "success") return;
  const issueNumber = Number(match[1]);
  const issue = await request("/repos/" + ownerRepo + "/issues/" + issueNumber);
  const labels = (issue.labels || []).map(label => typeof label === "string" ? label : label.name);
  if (!labels.includes("pool:claimed")) return;
  await replaceIssueLabels(issue, ["pool:claimed"], ["pool:needs-review"]);
  await comment(issueNumber,
    "**POOL_WORKER_TERMINAL_FAILURE**\n\n- Workflow run: " + (process.env.POOL_RUN_ID || "unknown") +
    "\n- Conclusion: " + conclusion +
    "\n- Target SHA: " + (process.env.POOL_RUN_SHA || "unknown") +
    "\n- Automatic retry: disabled; owner review is required.");
  log("Marked task #" + issueNumber + " as needs-review after worker conclusion " + conclusion + ".");
}

async function recoverStaleClaims() {
  const [issues, runData] = await Promise.all([
    request("/repos/" + ownerRepo + "/issues?state=open&labels=" + encodeURIComponent("pool:claimed") + "&per_page=100"),
    request("/repos/" + ownerRepo + "/actions/workflows/pool-worker.yml/runs?per_page=100")
  ]);
  const runs = runData.workflow_runs || [];
  for (const issue of issues.filter(item => !item.pull_request)) {
    const updatedAt = Date.parse(issue.updated_at || "");
    const matchingRun = runs
      .filter(run => {
        const title = run.display_title || run.run_name || "";
        return title.includes("Pool task #" + issue.number + " (") &&
          Date.parse(run.created_at || "") >= updatedAt - 120000;
      })
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

    if (matchingRun && matchingRun.status !== "completed") {
      log("Task #" + issue.number + " has worker run " + matchingRun.id + " in state " + matchingRun.status + ".");
      continue;
    }
    if (matchingRun && matchingRun.status === "completed") {
      await replaceIssueLabels(issue, ["pool:claimed"], ["pool:needs-review"]);
      await comment(issue.number,
        "**POOL_STALE_TERMINAL_RUN**\n\n- Worker run: " + matchingRun.id +
        "\n- Conclusion: " + (matchingRun.conclusion || "unknown") +
        "\n- Automatic retry: disabled; owner review is required.");
      log("Task #" + issue.number + " moved to needs-review after terminal worker run " + matchingRun.id + ".");
      continue;
    }

    const ageMs = Date.now() - updatedAt;
    if (Number.isFinite(ageMs) && ageMs > 15 * 60 * 1000) {
      await replaceIssueLabels(issue, ["pool:claimed"], ["pool:ready"]);
      await comment(issue.number,
        "**POOL_CLAIM_LEASE_EXPIRED**\n\nNo matching worker workflow run appeared within 15 minutes. The task was returned to pool:ready for a later reconciliation. No automatic execution retry occurred.");
      log("Recovered stale claim for task #" + issue.number + " after no worker run appeared.");
    }
  }
}

async function dispatchReadyTasks() {
  const issues = await request("/repos/" + ownerRepo + "/issues?state=open&labels=" +
    encodeURIComponent("pool:ready") + "&sort=created&direction=asc&per_page=100");
  const candidates = issues.filter(issue => !issue.pull_request).slice(0, maxDispatch);
  if (candidates.length === 0) {
    log("Pool supervisor idle: no owner-approved tasks with pool:ready label.");
    return;
  }

  let dispatched = 0;
  for (const issue of candidates) {
    const targetSha = extractTargetSha(issue.body);
    const profile = extractProfile(issue.body);
    if (!targetSha || profile !== "DSH headless probe") {
      await replaceIssueLabels(issue, ["pool:ready"], ["pool:invalid"]);
      await comment(issue.number,
        "**POOL_TASK_REJECTED**\n\nThe task must include a 40-character hexadecimal Target SHA and the currently allowlisted Worker profile DSH headless probe. No worker was dispatched.");
      log("Rejected task #" + issue.number + ": invalid target SHA or unsupported profile.");
      continue;
    }

    const approvalComments = await request("/repos/" + ownerRepo + "/issues/" + issue.number + "/comments?per_page=100");
    if (!hasOwnerApproval(approvalComments, {
      issueNumber: issue.number,
      targetSha,
      profile
    }, repositoryOwner)) {
      await replaceIssueLabels(issue, ["pool:ready"], ["pool:needs-review"]);
      await comment(issue.number,
        "**POOL_TASK_APPROVAL_MISSING**\n\nNo bot-issued owner approval marker matches this issue, target SHA and worker profile. The task was not dispatched. The repository owner must re-apply `pool:ready` after reviewing the task.");
      log("Skipped task #" + issue.number + ": no matching owner approval marker.");
      continue;
    }

    await comment(issue.number, formatOwnerApprovalConsumed(issue.number, targetSha));
    await replaceIssueLabels(issue, ["pool:ready"], ["pool:claimed"]);
    await comment(issue.number,
      "**POOL_TASK_CLAIMED**\n\n- Supervisor run: " + process.env.GITHUB_RUN_ID +
      "\n- Target SHA: " + targetSha +
      "\n- Profile: dsh-headless-probe" +
      "\n- Dispatch ref: " + defaultBranch +
      "\n- State: CLAIMED; awaiting worker.");
    try {
      await request("/repos/" + ownerRepo + "/actions/workflows/pool-worker.yml/dispatches", {
        method: "POST",
        body: JSON.stringify({
          ref: defaultBranch,
          inputs: {
            task_issue: String(issue.number),
            target_sha: targetSha,
            profile: "dsh-headless-probe"
          }
        })
      });
      dispatched += 1;
      log("Dispatched task #" + issue.number + " at immutable SHA " + targetSha + ".");
    } catch (error) {
      const current = await request("/repos/" + ownerRepo + "/issues/" + issue.number);
      await replaceIssueLabels(current, ["pool:claimed"], ["pool:ready"]);
      await comment(issue.number,
        "**POOL_DISPATCH_FAILED**\n\n- Supervisor run: " + process.env.GITHUB_RUN_ID +
        "\n- Failure: " + String(error.message).slice(0, 300) +
        "\n- State restored to pool:ready. No credential material is recorded.");
      log("Dispatch failed for task #" + issue.number + "; task returned to ready queue.");
    }
  }
  log("Supervisor cycle complete: " + dispatched + " worker workflow(s) dispatched.");
}

await ensureLabels();
await recordOwnerApproval();
if (eventName === "workflow_run") await recoverFailedWorkflowRun();
await recoverStaleClaims();
await dispatchReadyTasks();
