const positiveSafeInteger = (value) => Number.isSafeInteger(value) && value > 0;
const validSha = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);

/**
 * Derive immutable evidence binding from the runner-provided native
 * workflow_run webhook payload. The composition root MUST source eventName
 * and eventPayload from GitHub's GITHUB_EVENT_NAME/GITHUB_EVENT_PATH, not
 * workflow inputs, issue text, artifacts, or caller-supplied JSON.
 *
 * expected is deployment-pinned configuration, never event-controlled.
 * This helper does not authenticate the runner or establish event-file
 * provenance; those remain responsibilities of the trusted host boundary.
 */
export function deriveCompletedWorkflowRunBinding({
  eventName,
  eventPayload,
  expected
}) {
  if (eventName !== "workflow_run" ||
      !eventPayload || typeof eventPayload !== "object" ||
      !expected || typeof expected !== "object") return null;

  const run = eventPayload.workflow_run;
  if (eventPayload.action !== "completed" ||
      !run || typeof run !== "object" ||
      run.status !== "completed") return null;

  const repositoryId = expected.repositoryId;
  const workflowId = expected.workflowId;
  const workflowPath = expected.workflowPath;
  const workflowEvent = expected.workflowEvent;

  if (!positiveSafeInteger(repositoryId) ||
      !positiveSafeInteger(workflowId) ||
      typeof workflowPath !== "string" || !workflowPath.startsWith(".github/workflows/") ||
      typeof workflowEvent !== "string" || !workflowEvent) return null;

  if (!eventPayload.repository || eventPayload.repository.id !== repositoryId ||
      !run.repository || run.repository.id !== repositoryId ||
      !run.head_repository || run.head_repository.id !== repositoryId ||
      run.workflow_id !== workflowId ||
      run.path !== workflowPath ||
      run.event !== workflowEvent ||
      !positiveSafeInteger(run.id) ||
      !positiveSafeInteger(run.run_attempt) ||
      !validSha(run.head_sha) ||
      !Array.isArray(run.referenced_workflows)) return null;

  return Object.freeze({
    repositoryId,
    runId: run.id,
    runAttempt: run.run_attempt,
    workflowId,
    workflowPath,
    event: workflowEvent,
    headSha: run.head_sha.toLowerCase(),
    referencedWorkflows: run.referenced_workflows
  });
}
