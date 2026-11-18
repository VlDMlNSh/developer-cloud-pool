import { verifyWorkflowRunAttempt } from "./verifier.mjs";

const unresolved = (reason) => Object.freeze({
  decision: "UNRESOLVED",
  dispatch: false,
  reason
});

/**
 * Composition boundary for one attempt-specific evidence check.
 *
 * owner/repo/repositoryId are pinned by trusted deployment configuration.
 * clock must be supplied by the trusted host composition root; it is never
 * accepted from a workflow event or per-call argument. This module cannot
 * establish the clock provider's provenance by itself.
 */
export function createWorkflowRunEvidenceCheck({
  owner,
  repo,
  repositoryId,
  reader,
  clock,
  maxObservationAgeMs = 30_000
}) {
  if (typeof owner !== "string" || !/^[A-Za-z0-9-]+$/.test(owner) ||
      typeof repo !== "string" || !/^[A-Za-z0-9_.-]+$/.test(repo) ||
      !Number.isSafeInteger(repositoryId) || repositoryId <= 0 ||
      typeof reader !== "function" || typeof clock !== "function" ||
      !Number.isSafeInteger(maxObservationAgeMs) || maxObservationAgeMs <= 0) {
    throw new TypeError("Invalid trusted evidence-check configuration");
  }

  return async function checkWorkflowRunAttempt(binding) {
    if (!binding || typeof binding !== "object" ||
        binding.repositoryId !== repositoryId ||
        !Number.isSafeInteger(binding.runId) || binding.runId <= 0 ||
        !Number.isSafeInteger(binding.runAttempt) || binding.runAttempt <= 0) {
      return unresolved("INVALID_EXPECTED_BINDING");
    }

    let result;
    try {
      result = await reader({
        owner,
        repo,
        runId: binding.runId,
        runAttempt: binding.runAttempt
      });
    } catch {
      return unresolved("TRANSPORT_FAILURE");
    }

    // The two samples come only from the injected trusted host clock.
    // Capture after transport completion; a backwards/future clock is rejected
    // by the pure verifier rather than repaired or replaced with local time.
    let observedAtMs;
    let nowMs;
    try {
      observedAtMs = clock();
      nowMs = clock();
    } catch {
      return unresolved("TRUSTED_CLOCK_FAILURE");
    }

    return verifyWorkflowRunAttempt({
      httpStatus: result?.httpStatus,
      response: result?.response,
      binding,
      observedAtMs,
      nowMs,
      maxObservationAgeMs
    });
  };
}
