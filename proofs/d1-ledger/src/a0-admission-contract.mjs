const SHA40 = /^[a-f0-9]{40}$/;
const SAFE = /^[A-Za-z0-9._:-]{1,128}$/;
const ALLOWED_PROFILES = new Set(["dsh-headless-probe"]);
const ALLOWED_COST_CLASSES = new Set(["local", "free_quota"]);
const FORBIDDEN_ROUTES = new Set(["anthropic-api", "openai-api", "paid-provider-api"]);

const deny = (reason) => ({ decision: "DENY", dispatch: false, reason });

function sameBinding(actual, expected) {
  return actual && actual.taskId === expected.taskId &&
    actual.attemptId === expected.attemptId &&
    actual.targetSha === expected.targetSha &&
    actual.profile === expected.profile &&
    actual.tenantId === expected.tenantId;
}

/**
 * A0 admission contract only. This module is deliberately not wired to the
 * Supervisor or Worker. Cryptographic verification and atomic capability
 * consumption must be supplied by separately qualified authority adapters.
 */
export async function evaluateA0Admission(request, authority = {}) {
  if (!request || typeof request !== "object") return deny("INVALID_REQUEST");
  if (request.dispatchEnabled !== false) return deny("DISPATCH_MUST_REMAIN_DISABLED");
  const { taskId, attemptId, targetSha, profile, tenantId } = request;
  if (!SAFE.test(taskId || "") || !SAFE.test(attemptId || "") ||
      !SHA40.test(targetSha || "") || !ALLOWED_PROFILES.has(profile) ||
      !SAFE.test(tenantId || "")) return deny("INVALID_IMMUTABLE_TASK_BINDING");

  const cost = request.cost;
  if (!cost || !ALLOWED_COST_CLASSES.has(cost.costClass)) return deny("COST_CLASS_NOT_ALLOWED");
  if (FORBIDDEN_ROUTES.has(cost.routeId)) return deny("PROVIDER_ROUTE_FORBIDDEN");
  if (cost.costClass === "local" && cost.routeId !== "ollama-local") {
    return deny("LOCAL_ROUTE_NOT_QUALIFIED");
  }
  if (cost.costClass === "free_quota") {
    if (!cost.quotaDomainId || !SAFE.test(cost.quotaDomainId) ||
        typeof authority.verifyQuotaEvidence !== "function") {
      return deny("QUOTA_DOMAIN_EVIDENCE_MISSING");
    }
    let quota;
    try {
      quota = await authority.verifyQuotaEvidence(cost, request);
    } catch {
      return deny("QUOTA_EVIDENCE_VERIFICATION_FAILED");
    }
    if (quota?.verified !== true || quota.quotaDomainId !== cost.quotaDomainId ||
        quota.remaining !== true) return deny("QUOTA_DOMAIN_NOT_VERIFIED");
  }

  if (typeof authority.verifyOwnerApproval !== "function" ||
      typeof authority.consumeSingleUseCapability !== "function") {
    return deny("TRUSTED_APPROVAL_AUTHORITY_UNAVAILABLE");
  }

  const expected = { taskId, attemptId, targetSha, profile, tenantId };
  let approval;
  try {
    approval = await authority.verifyOwnerApproval(request.capability, expected);
  } catch {
    return deny("OWNER_APPROVAL_VERIFICATION_FAILED");
  }
  if (approval?.valid !== true || approval?.singleUse !== true ||
      !sameBinding(approval.binding, expected) ||
      !SAFE.test(approval.capabilityId || "")) {
    return deny("OWNER_APPROVAL_PROVENANCE_INVALID");
  }

  let consumed;
  try {
    consumed = await authority.consumeSingleUseCapability(approval.capabilityId, expected);
  } catch {
    return deny("CAPABILITY_CONSUMPTION_AMBIGUOUS");
  }
  if (consumed?.consumed !== true) return deny("CAPABILITY_REPLAY_OR_ALREADY_CONSUMED");

  return {
    decision: "ADMITTED_QUEUED",
    taskId, attemptId, approvalId: approval.capabilityId,
    dispatch: false,
    reason: "DISPATCH_DISABLED_QUEUE_ONLY"
  };
}
