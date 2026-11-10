const ALLOWED_STATUSES = new Set([
  "queued", "in_progress", "completed", "waiting", "requested", "pending"
]);
const ALLOWED_CONCLUSIONS = new Set([
  "success", "failure", "cancelled", "skipped", "neutral",
  "timed_out", "action_required", "stale", "startup_failure"
]);

const unresolved = (reason) => Object.freeze({
  decision: "UNRESOLVED",
  dispatch: false,
  reason
});

const validPositiveInt = (value) => Number.isSafeInteger(value) && value > 0;
const validSha = (value) => typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
const normalizeReferencedWorkflows = (items) => {
  if (!Array.isArray(items)) return null;
  const normalized = [];
  for (const item of items) {
    if (!item || typeof item.path !== "string" || !item.path ||
        !validSha(item.sha) || typeof item.ref !== "string" || !item.ref) return null;
    normalized.push(Object.freeze({
      path: item.path,
      sha: item.sha.toLowerCase(),
      ref: item.ref
    }));
  }
  return Object.freeze(normalized);
};

/**
 * Pure verifier for a single GitHub Actions attempt-specific run response.
 * The transport must call the fixed GitHub API origin and attempt-specific
 * endpoint using an Actions-read-only identity. This function performs no I/O.
 *
 * observedAtMs and nowMs must come from the adapter's trusted clock boundary,
 * not from the event payload or caller-controlled workflow inputs.
 */
export function verifyWorkflowRunAttempt({
  httpStatus,
  response,
  binding,
  observedAtMs,
  nowMs,
  maxObservationAgeMs = 30_000
}) {
  if (httpStatus !== 200) return unresolved("API_RESPONSE_NOT_AUTHORITATIVE");
  if (!response || typeof response !== "object" ||
      !binding || typeof binding !== "object") return unresolved("MISSING_RESPONSE_OR_BINDING");

  if (!validPositiveInt(binding.repositoryId) ||
      !validPositiveInt(binding.runId) ||
      !validPositiveInt(binding.runAttempt) ||
      !validPositiveInt(binding.workflowId) ||
      typeof binding.workflowPath !== "string" || (!binding.workflowPath.startsWith(".github/workflows/") || !binding.workflowPath.includes("@")) ||
      typeof binding.event !== "string" || !binding.event ||
      !validSha(binding.headSha) ||
      !Array.isArray(binding.referencedWorkflows)) return unresolved("INVALID_EXPECTED_BINDING");
  const expectedReferencedWorkflows = normalizeReferencedWorkflows(binding.referencedWorkflows);
  if (!expectedReferencedWorkflows) return unresolved("INVALID_EXPECTED_REFERENCED_WORKFLOWS");

  if (!Number.isFinite(observedAtMs) || !Number.isFinite(nowMs) ||
      !Number.isSafeInteger(maxObservationAgeMs) || maxObservationAgeMs <= 0 ||
      observedAtMs > nowMs || nowMs - observedAtMs > maxObservationAgeMs) {
    return unresolved("OBSERVATION_TIME_INVALID_OR_STALE");
  }

  const repository = response.repository;
  if (!validPositiveInt(response.id) ||
      !validPositiveInt(response.run_attempt) ||
      !validPositiveInt(response.workflow_id) ||
      !repository || !validPositiveInt(repository.id) ||
      typeof response.path !== "string" ||
      typeof response.event !== "string" ||
      !validSha(response.head_sha) ||
      typeof response.status !== "string" ||
      !Array.isArray(response.referenced_workflows)) return unresolved("INCOMPLETE_RUN_METADATA");
  const actualReferencedWorkflows = normalizeReferencedWorkflows(response.referenced_workflows);
  if (!actualReferencedWorkflows) return unresolved("INVALID_REFERENCED_WORKFLOWS");

  if (response.id !== binding.runId) return unresolved("RUN_ID_MISMATCH");
  if (response.run_attempt !== binding.runAttempt) return unresolved("RUN_ATTEMPT_MISMATCH");
  if (repository.id !== binding.repositoryId) return unresolved("REPOSITORY_ID_MISMATCH");
  if (response.workflow_id !== binding.workflowId) return unresolved("WORKFLOW_ID_MISMATCH");
  if (response.path !== binding.workflowPath) return unresolved("WORKFLOW_PATH_MISMATCH");
  if (response.event !== binding.event) return unresolved("EVENT_MISMATCH");
  if (response.head_sha.toLowerCase() !== binding.headSha.toLowerCase()) return unresolved("HEAD_SHA_MISMATCH");
  if (JSON.stringify(actualReferencedWorkflows) !== JSON.stringify(expectedReferencedWorkflows)) {
    return unresolved("REFERENCED_WORKFLOWS_MISMATCH");
  }

  if (!ALLOWED_STATUSES.has(response.status)) return unresolved("UNKNOWN_RUN_STATUS");

  const evidence = Object.freeze({
    repositoryId: repository.id,
    runId: response.id,
    runAttempt: response.run_attempt,
    workflowId: response.workflow_id,
    workflowPath: response.path,
    event: response.event,
    headSha: response.head_sha.toLowerCase(),
    status: response.status,
    observedAtMs
  });

  if (response.status !== "completed") {
    return Object.freeze({
      decision: "STILL_ACTIVE",
      dispatch: false,
      evidence
    });
  }

  if (!ALLOWED_CONCLUSIONS.has(response.conclusion)) {
    return unresolved("UNKNOWN_OR_MISSING_RUN_CONCLUSION");
  }

  // Terminal lifecycle evidence is deliberately not effect evidence.
  return Object.freeze({
    decision: "TERMINAL_EXECUTOR_ONLY",
    dispatch: false,
    conclusion: response.conclusion,
    sideEffects: "UNKNOWN",
    retryAuthorized: false,
    evidence
  });
}
