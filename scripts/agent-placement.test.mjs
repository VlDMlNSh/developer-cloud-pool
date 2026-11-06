import test from "node:test";
import assert from "node:assert/strict";
import { planAgentPlacement } from "./agent-placement.mjs";

const targetSha = "a".repeat(40);
const runtimeDigest = "sha256:" + "b".repeat(64);
const template = {
  platform: "linux",
  architecture: "x64",
  capacity: { cpuMillicores: 2000, memoryMiB: 4096, diskMiB: 4096 },
  capabilities: ["node", "python", "browser"],
  allowedNetworkClasses: ["provider-gateway", "no-egress"],
  capacityEvidence: {
    status: "verified",
    source: "synthetic-runner-probe",
    observedAt: 1799999000,
    validUntil: 1800003600,
    evidenceRef: "fixture-runner-capacity"
  }
};
function workload(id, overrides = {}) {
  return {
    id,
    taskId: "task-001",
    targetSha,
    trustDomainId: "task-001-trusted",
    isolationClass: "sandboxed-agent-v1",
    platform: "linux",
    architecture: "x64",
    networkClass: "provider-gateway",
    workspaceIsolation: "separate",
    coLocationAllowed: true,
    exclusive: false,
    credentialMode: "gateway_scoped",
    gatewayScopeId: "gateway-scope-" + id,
    functions: ["research"],
    requiredCapabilities: ["node"],
    resources: { cpuMillicores: 250, memoryMiB: 512, scratchDiskMiB: 64 },
    resourceEvidence: {
      status: "verified",
      source: "synthetic-profile-benchmark",
      observedAt: 1799999000,
      validUntil: 1800003600,
      evidenceRef: "fixture-agent-" + id
    },
    runtimeBundle: { digest: runtimeDigest, diskMiB: 256 },
    ...overrides
  };
}

test("many lightweight API-backed agents share one runner when measured resources fit", () => {
  const workloads = Array.from({ length: 6 }, (_, index) => workload("agent-" + index));
  const plan = planAgentPlacement({ workloads, slotTemplate: template });
  assert.equal(plan.admitted, true);
  assert.equal(plan.runnerSlotCount, 1);
  assert.equal(plan.coLocatedWorkloadCount, 5);
  assert.equal(plan.slots[0].usage.cpuMillicores, 1500);
  assert.equal(plan.slots[0].usage.memoryMiB, 3072);
  assert.equal(plan.slots[0].usage.scratchDiskMiB, 384);
  assert.equal(plan.slots[0].usage.runtimeImageMiB, 256);
  assert.equal(plan.slots[0].usage.diskMiB, 640);
});

test("multiple functions on one agent consume one workload reservation", () => {
  const plan = planAgentPlacement({ now: 1800000000, workloads: [workload("multi-function", { functions: ["research", "triage", "summarize", "review"] })],
    slotTemplate: template
  });
  assert.deepEqual(plan.assignments[0].functions, ["research", "triage", "summarize", "review"]);
  assert.equal(plan.workloadCount, 1);
});

test("shared immutable runtime bundle disk is counted once per runner", () => {
  const plan = planAgentPlacement({ now: 1800000000, workloads: [workload("agent-a"), workload("agent-b")],
    slotTemplate: template
  });
  assert.equal(plan.slots[0].usage.runtimeBundleCount, 1);
  assert.equal(plan.slots[0].usage.runtimeImageMiB, 256);
  assert.equal(plan.slots[0].usage.scratchDiskMiB, 128);
});

test("different task or target SHA are not co-located", () => {
  const plan = planAgentPlacement({ now: 1800000000, workloads: [
      workload("task-a"),
      workload("task-b", { taskId: "task-002", trustDomainId: "task-002-trusted" }),
      workload("target-b", { targetSha: "c".repeat(40) })
    ],
    slotTemplate: template
  });
  assert.equal(plan.runnerSlotCount, 3);
  assert.equal(plan.coLocatedWorkloadCount, 0);
});

test("independent reviewers can be marked exclusive and receive separate runner slots", () => {
  const plan = planAgentPlacement({ now: 1800000000, workloads: [
      workload("implementation"),
      workload("independent-review", { functions: ["independent-review"], isolationClass: "independent-review-v1" })
    ],
    slotTemplate: template
  });
  assert.equal(plan.runnerSlotCount, 2);
  assert.equal(plan.coLocatedWorkloadCount, 0);
});

test("resource reservations are never overcommitted and overflow creates another runner", () => {
  const workloads = Array.from({ length: 10 }, (_, index) =>
    workload("agent-" + index, { resources: { cpuMillicores: 500, memoryMiB: 1024, scratchDiskMiB: 128 } })
  );
  const plan = planAgentPlacement({ workloads, slotTemplate: template });
  assert.equal(plan.runnerSlotCount, 3);
  for (const slot of plan.slots) {
    assert.ok(slot.usage.cpuMillicores <= slot.capacity.cpuMillicores);
    assert.ok(slot.usage.memoryMiB <= slot.capacity.memoryMiB);
    assert.ok(slot.usage.diskMiB <= slot.capacity.diskMiB);
  }
});

test("missing or unmeasured resource envelopes fail closed", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("unknown", { resources: { cpuMillicores: 100, memoryMiB: 100 } })],
    slotTemplate: template
  }), /scratchDiskMiB/);
});

test("resource evidence must be verified and not expired", () => {
  assert.throws(() => planAgentPlacement({
    now: 1800000000,
    workloads: [workload("unverified", { resourceEvidence: { status: "unknown", source: "fixture", observedAt: 1799999000, validUntil: 1800003600, evidenceRef: "fixture" } })],
    slotTemplate: template
  }), /workload.resourceEvidence must be verified/);
  assert.throws(() => planAgentPlacement({
    now: 1800000000,
    workloads: [workload("expired", { resourceEvidence: { status: "verified", source: "fixture", observedAt: 1799000000, validUntil: 1799999999, evidenceRef: "fixture" } })],
    slotTemplate: template
  }), /validUntil must be later than the planning time/);
});

test("runner capacity must have a fresh verified probe", () => {
  const staleTemplate = { ...template, capacityEvidence: { ...template.capacityEvidence, validUntil: 1799999999 } };
  assert.throws(() => planAgentPlacement({
    now: 1800000000, workloads: [workload("agent")], slotTemplate: staleTemplate
  }), /slotTemplate.capacityEvidence.validUntil/);
});

test("gateway capability scope identifiers are unique per workload", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [
      workload("agent-a"),
      workload("agent-b", { gatewayScopeId: "gateway-scope-agent-a" })
    ],
    slotTemplate: template
  }), /gatewayScopeId must be unique per workload/);
});

test("raw credential fields and raw-secret delivery are rejected", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("unsafe", { apiKey: "never-accepted" })],
    slotTemplate: template
  }), /forbidden credential-bearing property/);
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("unsafe-mode", { credentialMode: "raw_secret" })],
    slotTemplate: template
  }), /credentialMode must be none or gateway_scoped/);
});

test("workspace isolation, network class and capabilities are enforced", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("shared-workspace", { workspaceIsolation: "shared" })],
    slotTemplate: template
  }), /workspaceIsolation must be separate/);
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("wrong-network", { networkClass: "open-internet" })],
    slotTemplate: template
  }), /networkClass is not allowed/);
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("missing-capability", { requiredCapabilities: ["gpu"] })],
    slotTemplate: template
  }), /missing required capability/);
});

test("runner slot cap cannot exceed the pool hard ceiling of 20", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [],
    slotTemplate: template,
    maxRunnerSlots: 21
  }), /hard limit of 20/);
});

test("workloads that do not fit alone are rejected rather than overcommitted", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [workload("too-large", { resources: { cpuMillicores: 3000, memoryMiB: 512, scratchDiskMiB: 10 } })],
    slotTemplate: template
  }), /exceeds single-runner resource capacity/);
});

test("same runtime digest cannot claim conflicting disk footprints", () => {
  assert.throws(() => planAgentPlacement({ now: 1800000000, workloads: [
      workload("image-a"),
      workload("image-b", { runtimeBundle: { digest: runtimeDigest, diskMiB: 999 } })
    ],
    slotTemplate: template
  }), /conflicting disk sizes/);
});

test("planner reports queue overflow without silently dropping work", () => {
  const plan = planAgentPlacement({ now: 1800000000, workloads: [
      workload("a"),
      workload("b", { taskId: "task-2", trustDomainId: "task-2" }),
      workload("c", { taskId: "task-3", trustDomainId: "task-3" })
    ],
    slotTemplate: template,
    maxRunnerSlots: 2
  });
  assert.equal(plan.admitted, false);
  assert.equal(plan.unplaced.length, 1);
  assert.equal(plan.unplaced[0].reason, "runner_slot_limit_reached");
});
