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

export function formatOwnerApprovalConsumed(issueNumber, targetSha) {
  return [
    "**POOL_OWNER_APPROVAL_CONSUMED_V1**",
    "",
    "- Issue: " + issueNumber,
    "- Target SHA: " + targetSha
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


export function hasWorkerDispatchAuthority({ actor, comments, expected, repositoryOwner }) {
  const owner = String(repositoryOwner || "").toLowerCase();
  if (String(actor || "").toLowerCase() !== BOT_LOGIN || !owner || !Array.isArray(comments)) return false;
  const ordered = [...comments].sort((a, b) => Date.parse(a.created_at || 0) - Date.parse(b.created_at || 0));
  let approved = false;
  let consumed = false;
  let claimed = false;
  let terminal = false;
  for (const comment of ordered) {
    if (comment?.user?.login !== BOT_LOGIN) continue;
    const body = String(comment.body || "");
    const issue = body.match(/^- Issue: (\d+)$/m)?.[1];
    if (issue !== String(expected.issueNumber)) continue;
    if (body.startsWith("**POOL_OWNER_APPROVAL_REVOKED_V1**")) {
      approved = false; consumed = false; claimed = false; terminal = false;
      continue;
    }
    if (body.startsWith("**POOL_OWNER_APPROVAL_V1**")) {
      const approvalActor = body.match(/^- Approved by: ([^\r\n]+)$/m)?.[1]?.toLowerCase();
      const approvalSha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
      const approvalProfile = body.match(/^- Worker profile: ([^\r\n]+)$/m)?.[1];
      if (approvalActor === owner && approvalSha === expected.targetSha &&
          approvalProfile === expected.profile) {
        approved = true; consumed = false; claimed = false; terminal = false;
      }
      continue;
    }
    if (body.startsWith("**POOL_OWNER_APPROVAL_CONSUMED_V1**")) {
      const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
      if (approved && sha === expected.targetSha) {
        consumed = true; claimed = false; terminal = false;
      }
      continue;
    }
    if (body.startsWith("**POOL_TASK_CLAIMED**")) {
      const supervisorRun = body.match(/^- Supervisor run: (\d+)$/m)?.[1];
      const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
      const profile = body.match(/^- Profile: ([^\r\n]+)$/m)?.[1];
      if (approved && consumed && supervisorRun && sha === expected.targetSha &&
          profile === "dsh-headless-probe" && expected.profile === "DSH headless probe") claimed = true;
      continue;
    }
    if (body.startsWith("**POOL_DSH_PROBE_COMPLETE**") ||
        body.startsWith("**POOL_DSH_PROBE_NEEDS_REVIEW**")) {
      if (claimed) terminal = true;
    }
  }
  return approved && consumed && claimed && !terminal;
}
