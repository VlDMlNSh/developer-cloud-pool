const REPOSITORY = "VlDMlNSh/developer-cloud-pool";
const SUPERVISOR_WORKFLOW_REF =
  "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-supervisor.yml@refs/heads/Основной";
const WORKER_WORKFLOW_PATH = ".github/workflows/pool-worker.yml";

export function validateWorkerCallerContext(context) {
  const failures = [];
  const required = [
    "githubRepository",
    "githubWorkflowRef",
    "githubWorkflowSha",
    "jobWorkflowRepository",
    "jobWorkflowFilePath",
    "jobWorkflowSha"
  ];

  for (const key of required) {
    if (typeof context?.[key] !== "string" || context[key].length === 0) {
      failures.push(key + " is missing");
    }
  }

  if (failures.length) return { authorized: false, failures };

  if (context.githubRepository !== REPOSITORY) {
    failures.push("caller repository mismatch");
  }
  if (context.githubWorkflowRef !== SUPERVISOR_WORKFLOW_REF) {
    failures.push("caller workflow ref mismatch");
  }
  if (context.jobWorkflowRepository !== REPOSITORY) {
    failures.push("reusable Worker repository mismatch");
  }
  if (context.jobWorkflowFilePath !== WORKER_WORKFLOW_PATH) {
    failures.push("reusable Worker path mismatch");
  }
  if (!/^[0-9a-f]{40}$/.test(context.githubWorkflowSha)) {
    failures.push("caller workflow SHA is malformed");
  }
  if (!/^[0-9a-f]{40}$/.test(context.jobWorkflowSha)) {
    failures.push("reusable Worker workflow SHA is malformed");
  }
  if (
    /^[0-9a-f]{40}$/.test(context.githubWorkflowSha) &&
    /^[0-9a-f]{40}$/.test(context.jobWorkflowSha) &&
    context.githubWorkflowSha !== context.jobWorkflowSha
  ) {
    failures.push("caller and reusable Worker workflow SHAs differ");
  }

  return { authorized: failures.length === 0, failures };
}
