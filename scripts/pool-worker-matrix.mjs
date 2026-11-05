const PROFILE_LABEL = "DSH headless probe";
const PROFILE_ID = "dsh-headless-probe";
const MAX_BATCH_SIZE = 20;

function targetShaFromBody(body) {
  const match = String(body || "").match(/^### Target SHA\\s*\\r?\\n+([0-9a-f]{40})\\s*$/im);
  return match?.[1] ?? null;
}

function profileFromBody(body) {
  const match = String(body || "").match(/^### Worker profile\\s*\\r?\\n+([^\\r\\n]+)\\s*$/im);
  return match?.[1]?.trim() ?? null;
}

/**
 * Build a bounded GitHub Actions matrix from a trusted, already-fetched issue
 * snapshot. This function performs no GitHub mutations and grants no authority:
 * the caller must independently verify owner approval, consume a single-use
 * approval marker, and claim each issue before exposing the matrix as a job output.
 */
export function planWorkerMatrix(issues, { maxDispatch = MAX_BATCH_SIZE } = {}) {
  if (!Array.isArray(issues)) throw new TypeError("issues must be an array");
  if (!Number.isSafeInteger(maxDispatch) || maxDispatch < 1 || maxDispatch > MAX_BATCH_SIZE) {
    throw new RangeError("maxDispatch must be an integer from 1 through 20");
  }

  const seen = new Set();
  const include = [];
  const rejected = [];

  for (const issue of issues) {
    const number = issue?.number;
    if (!Number.isSafeInteger(number) || number <= 0) {
      rejected.push({ issue: null, reason: "invalid-issue-number" });
      continue;
    }
    if (seen.has(number)) throw new Error("duplicate issue number: " + number);
    seen.add(number);

    if (issue.pull_request) {
      rejected.push({ issue: number, reason: "pull-request-is-not-a-task" });
      continue;
    }
    if (issue.state !== "open") {
      rejected.push({ issue: number, reason: "task-issue-is-not-open" });
      continue;
    }

    const labels = Array.isArray(issue.labels)
      ? issue.labels.map(label => typeof label === "string" ? label : label?.name)
      : [];
    if (!labels.includes("pool:ready")) {
      rejected.push({ issue: number, reason: "task-is-not-ready" });
      continue;
    }

    const targetSha = targetShaFromBody(issue.body);
    if (!targetSha) {
      rejected.push({ issue: number, reason: "target-sha-invalid-or-missing" });
      continue;
    }
    if (profileFromBody(issue.body) !== PROFILE_LABEL) {
      rejected.push({ issue: number, reason: "worker-profile-not-allowlisted" });
      continue;
    }

    if (include.length >= maxDispatch) {
      rejected.push({ issue: number, reason: "batch-capacity-exceeded" });
      continue;
    }
    include.push({ task_issue: String(number), target_sha: targetSha, profile: PROFILE_ID });
  }

  return {
    matrix: { include },
    rejected,
    count: include.length
  };
}
