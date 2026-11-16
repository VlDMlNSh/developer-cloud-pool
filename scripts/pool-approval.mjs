const TARGET_SHA = /^[0-9a-f]{40}$/;
const ALLOWED_PROFILE = "DSH headless probe";
const BOT_LOGIN = "github-actions[bot]";

export function extractTaskEnvelope(body) {
  const source = String(body || "");
  const sha = source.match(/^### Target SHA\s*\r?\n+([0-9a-f]{40})\s*$/im)?.[1] || null;
  const profile = source.match(/^### Worker profile\s*\r?\n+([^\r\n]+)\s*$/im)?.[1]?.trim() || null;
  if (!sha || !TARGET_SHA.test(sha) || profile !== ALLOWED_PROFILE) return null;
  return { targetSha: sha, profile };
}

export function getOwnerApproval(payload, repositoryOwner) {
  if (!payload || payload.action !== "labeled" || payload.label?.name !== "pool:ready") return null;
  const issue = payload.issue;
  const sender = payload.sender?.login;
  const owner = String(repositoryOwner || "");
  if (!issue || issue.pull_request || issue.state !== "open" || !Number.isInteger(issue.number)) return null;
  if (!sender || !owner || sender.toLowerCase() !== owner.toLowerCase()) return null;
  const envelope = extractTaskEnvelope(issue.body);
  if (!envelope) return null;
  return {
    issueNumber: issue.number,
    actor: owner,
    targetSha: envelope.targetSha,
    profile: envelope.profile
  };
}

export function formatOwnerApproval(approval) {
  return [
    "**POOL_OWNER_APPROVAL_V1**",
    "",
    "- Issue: " + approval.issueNumber,
    "- Approved by: " + approval.actor,
    "- Target SHA: " + approval.targetSha,
    "- Worker profile: " + approval.profile
  ].join("\n");
}

export function formatOwnerApprovalConsumed(issueNumber, targetSha, supervisorRunId) {
  return [
    "**POOL_OWNER_APPROVAL_CONSUMED_V1**",
    "",
    "- Issue: " + issueNumber,
    "- Target SHA: " + targetSha,
    "- Supervisor run: " + supervisorRunId
  ].join("\n");
}

export function formatOwnerApprovalRevoked(issueNumber) {
  return [
    "**POOL_OWNER_APPROVAL_REVOKED_V1**",
    "",
    "- Issue: " + issueNumber
  ].join("\n");
}

export function hasOwnerApproval(comments, expected, repositoryOwner) {
  const owner = String(repositoryOwner || "").toLowerCase();
  if (!owner || !Array.isArray(comments)) return false;
  const ordered = [...comments].sort((a, b) => Date.parse(a.created_at || 0) - Date.parse(b.created_at || 0));
  let approved = false;
  for (const comment of ordered) {
    if (comment?.user?.login !== BOT_LOGIN) continue;
    const body = String(comment.body || "");
    const issue = body.match(/^- Issue: (\d+)$/m)?.[1];
    if (issue !== String(expected.issueNumber)) continue;
    if (body.startsWith("**POOL_OWNER_APPROVAL_REVOKED_V1**") ||
        body.startsWith("**POOL_OWNER_APPROVAL_CONSUMED_V1**")) {
      approved = false;
      continue;
    }
    if (!body.startsWith("**POOL_OWNER_APPROVAL_V1**")) continue;
    const actor = body.match(/^- Approved by: ([^\r\n]+)$/m)?.[1]?.toLowerCase();
    const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
    const profile = body.match(/^- Worker profile: ([^\r\n]+)$/m)?.[1];
    if (actor === owner && sha === expected.targetSha && profile === expected.profile) approved = true;
  }
  return approved;
}


const MANAGED_TASK_LABELS = new Set([
  "pool:ready", "pool:claimed", "pool:probe-complete", "pool:needs-review", "pool:invalid"
]);

export function hasConsumedOwnerApproval(comments, expected, repositoryOwner, supervisorRunId) {
  const owner = String(repositoryOwner || "").toLowerCase();
  const runId = String(supervisorRunId || "");
  if (!owner || !/^\d+$/.test(runId) || !Array.isArray(comments)) return false;
  const ordered = [...comments].sort((a, b) =>
    (Date.parse(a.created_at || "") || 0) - (Date.parse(b.created_at || "") || 0)
  );
  let state = null;
  for (const comment of ordered) {
    if (comment?.user?.login !== BOT_LOGIN) continue;
    const body = String(comment.body || "");
    const issue = body.match(/^- Issue: (\d+)$/m)?.[1];
    if (issue !== String(expected.issueNumber)) continue;
    if (body.startsWith("**POOL_OWNER_APPROVAL_REVOKED_V1**")) {
      state = null;
      continue;
    }
    if (body.startsWith("**POOL_OWNER_APPROVAL_V1**")) {
      const actor = body.match(/^- Approved by: ([^\r\n]+)$/m)?.[1]?.toLowerCase();
      const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
      const profile = body.match(/^- Worker profile: ([^\r\n]+)$/m)?.[1];
      state = actor === owner && sha === expected.targetSha && profile === expected.profile
        ? { consumedBy: null }
        : null;
      continue;
    }
    if (body.startsWith("**POOL_OWNER_APPROVAL_CONSUMED_V1**") && state) {
      const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
      const consumedBy = body.match(/^- Supervisor run: (\d+)$/m)?.[1];
      if (sha === expected.targetSha && consumedBy) state = { consumedBy };
    }
  }
  return state?.consumedBy === runId;
}

export function hasSupervisorClaimComment(comments, expected, supervisorRunId) {
  const runId = String(supervisorRunId || "");
  if (!/^\d+$/.test(runId) || !Array.isArray(comments)) return false;
  return comments.some(comment => {
    if (comment?.user?.login !== BOT_LOGIN) return false;
    const body = String(comment.body || "");
    return body.startsWith("**POOL_TASK_CLAIMED**") &&
      body.includes("- Supervisor run: " + runId) &&
      body.includes("- Target SHA: " + expected.targetSha) &&
      body.includes("- Profile: dsh-headless-probe");
  });
}

export function hasOwnerReadyEvent(events, repositoryOwner, supervisorRunCreatedAt) {
  const owner = String(repositoryOwner || "").toLowerCase();
  const runTime = Date.parse(supervisorRunCreatedAt || "");
  if (!owner || !Number.isFinite(runTime) || !Array.isArray(events)) return false;
  return events.some(event => {
    if (event?.event !== "labeled" || event?.label?.name !== "pool:ready") return false;
    if (String(event?.actor?.login || "").toLowerCase() !== owner) return false;
    const eventTime = Date.parse(event.created_at || "");
    return Number.isFinite(eventTime) && eventTime <= runTime;
  });
}

export function hasCurrentBotClaimEvent(events, supervisorRunCreatedAt) {
  if (!Array.isArray(events)) return false;
  const relevant = events
    .filter(event => {
      const name = event?.label?.name;
      return (event?.event === "labeled" || event?.event === "unlabeled") && MANAGED_TASK_LABELS.has(name);
    })
    .sort((a, b) => (Date.parse(a.created_at || "") || 0) - (Date.parse(b.created_at || "") || 0));
  const latest = relevant.at(-1);
  const runTime = Date.parse(supervisorRunCreatedAt || "");
  return Boolean(latest &&
    latest.event === "labeled" &&
    latest.label?.name === "pool:claimed" &&
    latest.actor?.login === BOT_LOGIN &&
    Number.isFinite(runTime) &&
    (Date.parse(latest.created_at || "") || 0) >= runTime
  );
}

export function isTrustedSupervisorRun(run, expected) {
  if (!run || String(run.id) !== String(expected.supervisorRunId)) return false;
  if (String(run.workflow_id) !== String(expected.workflowId)) return false;
  if (run.event !== "issues") return false;
  if (String(run.actor?.login || "").toLowerCase() !== String(expected.repositoryOwner || "").toLowerCase()) return false;
  if (run.head_branch !== expected.defaultBranch) return false;
  if (run.status !== "in_progress" && !(run.status === "completed" && run.conclusion === "success")) return false;
  const createdAt = Date.parse(run.created_at || "");
  return Number.isFinite(createdAt) && createdAt <= Date.now();
}

export function hasPriorWorkerRun(runs, currentRunId, issueNumber, supervisorRunCreatedAt) {
  if (!Array.isArray(runs)) return true;
  const supervisorTime = Date.parse(supervisorRunCreatedAt || "");
  if (!Number.isFinite(supervisorTime)) return true;
  return runs.some(run => {
    if (String(run.id) === String(currentRunId)) return false;
    const title = String(run.display_title || run.run_name || "");
    const createdAt = Date.parse(run.created_at || "");
    return title.includes("Pool task #" + issueNumber + " (") &&
      Number.isFinite(createdAt) && createdAt >= supervisorTime;
  });
}
