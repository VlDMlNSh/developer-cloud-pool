import { describe, expect, it } from "vitest";
import { evaluateA0Admission } from "../src/a0-admission-contract.mjs";

const binding = {
  taskId: "task-001",
  attemptId: "attempt-001",
  targetSha: "a".repeat(40),
  profile: "dsh-headless-probe",
  tenantId: "tenant-001"
};

function makeAuthority(overrides = {}) {
  const consumed = new Set();
  return {
    verifyOwnerApproval: async (_capability, expected) => ({
      valid: true,
      singleUse: true,
      capabilityId: "owner-capability-001",
      binding: expected
    }),
    consumeSingleUseCapability: async (id) => {
      if (consumed.has(id)) return { consumed: false };
      consumed.add(id);
      return { consumed: true };
    },
    verifyQuotaEvidence: async (cost) => ({
      verified: true,
      quotaDomainId: cost.quotaDomainId,
      remaining: true
    }),
    ...overrides
  };
}

const localRequest = (overrides = {}) => ({
  ...binding,
  capability: { opaque: "not-interpreted-by-this-contract" },
  cost: { costClass: "local", routeId: "ollama-local" },
  dispatchEnabled: false,
  ...overrides
});

describe("A0 fail-closed admission contract (isolated; not production wiring)", () => {
  it("queues an approved local task without dispatch", async () => {
    const result = await evaluateA0Admission(localRequest(), makeAuthority());
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED",
      dispatch: false,
      reason: "DISPATCH_DISABLED_QUEUE_ONLY"
    });
  });

  it("denies missing owner-approval verifier or single-use consumer", async () => {
    const result = await evaluateA0Admission(localRequest(), {});
    expect(result).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "TRUSTED_APPROVAL_AUTHORITY_UNAVAILABLE"
    });
  });

  it("denies approval provenance that is not bound to the exact task attempt", async () => {
    const authority = makeAuthority({
      verifyOwnerApproval: async (_capability, expected) => ({
        valid: true,
        singleUse: true,
        capabilityId: "owner-capability-001",
        binding: { ...expected, targetSha: "b".repeat(40) }
      })
    });
    const result = await evaluateA0Admission(localRequest(), authority);
    expect(result).toMatchObject({ decision: "DENY", reason: "OWNER_APPROVAL_PROVENANCE_INVALID" });
  });

  it("rejects replay of a single-use capability", async () => {
    const authority = makeAuthority();
    const first = await evaluateA0Admission(localRequest(), authority);
    const replay = await evaluateA0Admission(localRequest(), authority);
    expect(first.decision).toBe("ADMITTED_QUEUED");
    expect(replay).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CAPABILITY_REPLAY_OR_ALREADY_CONSUMED"
    });
  });

  it.each(["paid", "unknown", "unmetered"])("denies non-allowlisted cost class %s", async (costClass) => {
    const result = await evaluateA0Admission(localRequest({
      cost: { costClass, routeId: "some-provider" }
    }), makeAuthority());
    expect(result).toMatchObject({ decision: "DENY", reason: "COST_CLASS_NOT_ALLOWED" });
  });

  it.each(["anthropic-api", "openai-api", "paid-provider-api"])(
    "denies forbidden provider route %s", async (routeId) => {
      const result = await evaluateA0Admission(localRequest({
        cost: { costClass: "free_quota", routeId, quotaDomainId: "quota-domain-1" }
      }), makeAuthority());
      expect(result).toMatchObject({ decision: "DENY", reason: "PROVIDER_ROUTE_FORBIDDEN" });
    }
  );

  it("denies free-quota admission without quota-domain evidence", async () => {
    const result = await evaluateA0Admission(localRequest({
      cost: { costClass: "free_quota", routeId: "gemini-free" }
    }), makeAuthority());
    expect(result).toMatchObject({ decision: "DENY", reason: "QUOTA_DOMAIN_EVIDENCE_MISSING" });
  });

  it("denies free-quota admission when evidence does not verify remaining quota", async () => {
    const authority = makeAuthority({
      verifyQuotaEvidence: async () => ({
        verified: true, quotaDomainId: "quota-domain-1", remaining: false
      })
    });
    const result = await evaluateA0Admission(localRequest({
      cost: { costClass: "free_quota", routeId: "gemini-free", quotaDomainId: "quota-domain-1" }
    }), authority);
    expect(result).toMatchObject({ decision: "DENY", reason: "QUOTA_DOMAIN_NOT_VERIFIED" });
  });

  it("denies malformed or mutable task identity before consulting authority", async () => {
    let called = false;
    const authority = makeAuthority({
      verifyOwnerApproval: async () => { called = true; return {}; }
    });
    const result = await evaluateA0Admission(localRequest({ targetSha: "mutable" }), authority);
    expect(result).toMatchObject({ decision: "DENY", reason: "INVALID_IMMUTABLE_TASK_BINDING" });
    expect(called).toBe(false);
  });

  it("never dispatches even if a caller sets dispatchEnabled true", async () => {
    const result = await evaluateA0Admission(localRequest({ dispatchEnabled: true }), makeAuthority());
    expect(result).toMatchObject({
      decision: "ADMITTED_DISPATCH_BLOCKED",
      dispatch: false,
      reason: "DISPATCH_REQUIRES_SEPARATE_OWNER_AUTHORIZATION"
    });
  });
});
