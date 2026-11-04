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

export function hasOwnerApproval(comments, expected, repositoryOwner) {
  const owner = String(repositoryOwner || "").toLowerCase();
  if (!owner || !Array.isArray(comments)) return false;
  return comments.some((comment) => {
    if (comment?.user?.login !== BOT_LOGIN) return false;
    const body = String(comment.body || "");
    if (!body.startsWith("**POOL_OWNER_APPROVAL_V1**")) return false;
    const issue = body.match(/^- Issue: (\d+)$/m)?.[1];
    const actor = body.match(/^- Approved by: ([^\r\n]+)$/m)?.[1]?.toLowerCase();
    const sha = body.match(/^- Target SHA: ([0-9a-f]{40})$/m)?.[1];
    const profile = body.match(/^- Worker profile: ([^\r\n]+)$/m)?.[1];
    return issue === String(expected.issueNumber) &&
      actor === owner &&
      sha === expected.targetSha &&
      profile === expected.profile;
  });
}
