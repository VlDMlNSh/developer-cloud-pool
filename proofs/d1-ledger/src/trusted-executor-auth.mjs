import { resolveTrustedExecutorAssignment } from "./trusted-executor-registry.mjs";
import { verifyGitHubActionsExecutorIdentity } from "./github-actions-oidc-verifier.mjs";

const deny = (reason) => Object.freeze({
  decision: "DENY",
  executionAuthorized: false,
  dispatch: false,
  reason
});

/**
 * Resolve owner-approved executor assignment, then authenticate the GitHub
 * Actions workflow principal against the OIDC binding in that same registry
 * snapshot. This does not attest the executable/process inside the job.
 */
export async function authenticateRegisteredExecutorWorkflow({
  executorId,
  profile,
  oidcToken,
  fetchImpl = globalThis.fetch,
  cryptoImpl = globalThis.crypto,
  nowSeconds
} = {}) {
  const assignment = await resolveTrustedExecutorAssignment({
    executorId, profile, fetchImpl
  });
  if (assignment.decision !== "TRUSTED_ASSIGNMENT") return assignment;
  if (!assignment.oidcBinding) return deny("EXECUTOR_OIDC_BINDING_MISSING");

  const identity = await verifyGitHubActionsExecutorIdentity({
    token: oidcToken,
    expected: assignment.oidcBinding,
    fetchImpl,
    cryptoImpl,
    nowSeconds
  });
  if (identity.decision !== "GITHUB_ACTIONS_WORKFLOW_AUTHENTICATED") return identity;

  return Object.freeze({
    decision: "REGISTERED_EXECUTOR_WORKFLOW_AUTHENTICATED",
    executorId: assignment.executorId,
    profile: assignment.profile,
    trustedDefaultHeadSha: assignment.trustedDefaultHeadSha,
    registryBlobSha: assignment.registryBlobSha,
    workflowSubject: identity.subject,
    workflowRef: identity.workflowRef,
    executorProcessAttested: false,
    executionAuthorized: false,
    dispatch: false
  });
}
