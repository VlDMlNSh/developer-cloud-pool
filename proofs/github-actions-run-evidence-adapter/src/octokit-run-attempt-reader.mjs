const ROUTE = "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}";

const positiveSafeInteger = (value) => Number.isSafeInteger(value) && value > 0;

/**
 * Narrow read-only transport adapter. The Octokit instance must be constructed
 * by the trusted composition root; this adapter accepts no URL, fetch, auth
 * token, or arbitrary request options from the caller.
 */
export function createWorkflowRunAttemptReader(octokit) {
  if (!octokit || typeof octokit.request !== "function") {
    throw new TypeError("A configured Octokit request client is required");
  }

  return async function readWorkflowRunAttempt({ owner, repo, runId, runAttempt }) {
    if (typeof owner !== "string" || !/^[A-Za-z0-9-]+$/.test(owner) ||
        typeof repo !== "string" || !/^[A-Za-z0-9_.-]+$/.test(repo) ||
        !positiveSafeInteger(runId) || !positiveSafeInteger(runAttempt)) {
      throw new TypeError("Invalid immutable workflow run identity");
    }

    try {
      const result = await octokit.request(ROUTE, {
        owner,
        repo,
        run_id: runId,
        attempt_number: runAttempt,
        headers: { "X-GitHub-Api-Version": "2022-11-28" }
      });
      return Object.freeze({
        httpStatus: result.status,
        response: result.data
      });
    } catch (error) {
      // Preserve authoritative HTTP failures as evidence for the pure verifier.
      // Network/transport failures have no status and are rethrown; callers
      // must map them to UNRESOLVED and must not retry or dispatch.
      if (Number.isSafeInteger(error?.status)) {
        return Object.freeze({
          httpStatus: error.status,
          response: error.response?.data ?? null
        });
      }
      throw error;
    }
  };
}
