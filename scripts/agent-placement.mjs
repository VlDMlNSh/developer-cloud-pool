const HARD_MAX_RUNNER_SLOTS = 20;
const SENSITIVE_PROPERTY = /^(api[_-]?key|secret(?:value)?|token|password|private[_-]?key|authorization|credential(?:value)?|environment|env)$/i;

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}
function assertNoCredentialMaterial(value, path = "workload") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!SENSITIVE_PROPERTY.test(key), path + " contains forbidden credential-bearing property: " + key);
    assertNoCredentialMaterial(child, path + "." + key);
  }
}
function positiveInteger(value, field, allowZero = false) {
  assert(Number.isInteger(value) && (allowZero ? value >= 0 : value > 0),
    field + " must be an " + (allowZero ? "non-negative" : "positive") + " integer");
  return value;
}
function nonEmptyString(value, field) {
  assert(typeof value === "string" && value.trim().length > 0, field + " must be a non-empty string");
  return value;
}
function normalizeEvidence(evidence, field, now) {
  assert(evidence && typeof evidence === "object", field + " is required");
  assert(evidence.status === "verified", field + " must be verified");
  const source = nonEmptyString(evidence.source, field + ".source");
  const evidenceRef = nonEmptyString(evidence.evidenceRef, field + ".evidenceRef");
  assert(Number.isFinite(evidence.observedAt) && evidence.observedAt >= 0 && evidence.observedAt <= now,
    field + ".observedAt must be a valid timestamp not later than the planning time");
  assert(Number.isFinite(evidence.validUntil) && evidence.validUntil > now,
    field + ".validUntil must be later than the planning time");
  return { status: "verified", source, evidenceRef, observedAt: evidence.observedAt, validUntil: evidence.validUntil };
}
function normalizeWorkload(workload, now) {
  assert(workload && typeof workload === "object" && !Array.isArray(workload), "each workload must be an object");
  assertNoCredentialMaterial(workload);
  const id = nonEmptyString(workload.id, "workload.id");
  const taskId = nonEmptyString(workload.taskId, "workload.taskId");
  const targetSha = nonEmptyString(workload.targetSha, "workload.targetSha");
  assert(/^[a-f0-9]{40,64}$/i.test(targetSha), "workload.targetSha must be an immutable Git SHA");
  const trustDomainId = nonEmptyString(workload.trustDomainId, "workload.trustDomainId");
  const isolationClass = nonEmptyString(workload.isolationClass, "workload.isolationClass");
  const platform = nonEmptyString(workload.platform, "workload.platform");
  const architecture = nonEmptyString(workload.architecture, "workload.architecture");
  const networkClass = nonEmptyString(workload.networkClass, "workload.networkClass");
  const workspaceIsolation = nonEmptyString(workload.workspaceIsolation, "workload.workspaceIsolation");
  assert(workspaceIsolation === "separate", "workload.workspaceIsolation must be separate");
  assert(workload.coLocationAllowed === true, "workload must explicitly allow co-location");
  assert(workload.exclusive === undefined || typeof workload.exclusive === "boolean", "workload.exclusive must be boolean");
  assert(["none", "gateway_scoped"].includes(workload.credentialMode),
    "credentialMode must be none or gateway_scoped; raw credentials are forbidden");
  const gatewayScopeId = workload.credentialMode === "gateway_scoped"
    ? nonEmptyString(workload.gatewayScopeId, "workload.gatewayScopeId") : null;
  assert(Array.isArray(workload.functions) && workload.functions.length > 0
    && workload.functions.every((item) => typeof item === "string" && item.trim().length > 0),
  "workload.functions must contain one or more names");
  assert(new Set(workload.functions).size === workload.functions.length, "workload.functions must be unique");
  assert(Array.isArray(workload.requiredCapabilities)
    && workload.requiredCapabilities.every((item) => typeof item === "string" && item.trim().length > 0),
  "workload.requiredCapabilities must be an array of non-empty strings");
  const resources = workload.resources;
  assert(resources && typeof resources === "object", "workload.resources is required");
  const functions = [...workload.functions];
  const requiresExclusivePlacement = functions.some((name) =>
    ["independent-review", "security-audit", "security-auditor"].includes(name.toLowerCase().replace(/_/g, "-"))
  );
  const exclusive = workload.exclusive === true || requiresExclusivePlacement;
  const normalizedResources = {
    cpuMillicores: positiveInteger(resources.cpuMillicores, "resources.cpuMillicores"),
    memoryMiB: positiveInteger(resources.memoryMiB, "resources.memoryMiB"),
    scratchDiskMiB: positiveInteger(resources.scratchDiskMiB, "resources.scratchDiskMiB", true)
  };
  const runtimeBundle = workload.runtimeBundle;
  assert(runtimeBundle && typeof runtimeBundle === "object", "workload.runtimeBundle is required");
  const digest = nonEmptyString(runtimeBundle.digest, "runtimeBundle.digest");
  assert(/^sha256:[a-f0-9]{64}$/i.test(digest), "runtimeBundle.digest must be a pinned sha256 digest");
  const runtimeDiskMiB = positiveInteger(runtimeBundle.diskMiB, "runtimeBundle.diskMiB");
  const resourceEvidence = normalizeEvidence(workload.resourceEvidence, "workload.resourceEvidence", now);
  return {
    id, taskId, targetSha, trustDomainId, isolationClass, platform, architecture,
    networkClass, workspaceIsolation, coLocationAllowed: true,
    exclusive,
    credentialMode: workload.credentialMode,
    gatewayScopeId,
    functions,
    requiredCapabilities: [...new Set(workload.requiredCapabilities)],
    resources: normalizedResources,
    resourceEvidence,
    runtimeBundle: { digest, diskMiB: runtimeDiskMiB }
  };
}
function normalizeTemplate(template, now) {
  assert(template && typeof template === "object", "slotTemplate is required");
  const capacity = template.capacity;
  assert(capacity && typeof capacity === "object", "slotTemplate.capacity is required");
  const normalizedCapacity = {
    cpuMillicores: positiveInteger(capacity.cpuMillicores, "capacity.cpuMillicores"),
    memoryMiB: positiveInteger(capacity.memoryMiB, "capacity.memoryMiB"),
    diskMiB: positiveInteger(capacity.diskMiB, "capacity.diskMiB")
  };
  const capacityEvidence = normalizeEvidence(template.capacityEvidence, "slotTemplate.capacityEvidence", now);
  assert(Array.isArray(template.capabilities), "slotTemplate.capabilities must be an array");
  assert(Array.isArray(template.allowedNetworkClasses), "slotTemplate.allowedNetworkClasses must be an array");
  return {
    platform: nonEmptyString(template.platform, "slotTemplate.platform"),
    architecture: nonEmptyString(template.architecture, "slotTemplate.architecture"),
    capacity: normalizedCapacity,
    capacityEvidence,
    capabilities: new Set(template.capabilities),
    allowedNetworkClasses: new Set(template.allowedNetworkClasses)
  };
}
function resourceUsage(workloads) {
  let cpuMillicores = 0;
  let memoryMiB = 0;
  let scratchDiskMiB = 0;
  const bundles = new Map();
  for (const workload of workloads) {
    cpuMillicores += workload.resources.cpuMillicores;
    memoryMiB += workload.resources.memoryMiB;
    scratchDiskMiB += workload.resources.scratchDiskMiB;
    const existingSize = bundles.get(workload.runtimeBundle.digest);
    assert(existingSize === undefined || existingSize === workload.runtimeBundle.diskMiB,
      "one runtime bundle digest cannot have conflicting disk sizes");
    bundles.set(workload.runtimeBundle.digest, workload.runtimeBundle.diskMiB);
  }
  const runtimeImageMiB = [...bundles.values()].reduce((total, size) => total + size, 0);
  return {
    cpuMillicores, memoryMiB, scratchDiskMiB, runtimeImageMiB,
    diskMiB: scratchDiskMiB + runtimeImageMiB,
    runtimeBundleCount: bundles.size
  };
}
function compatible(slot, workload, template) {
  if (slot.workloads.length === 0) return true;
  if (workload.exclusive || slot.workloads.some((item) => item.exclusive)) return false;
  const first = slot.workloads[0];
  return workload.coLocationAllowed
    && workload.taskId === first.taskId
    && workload.targetSha === first.targetSha
    && workload.trustDomainId === first.trustDomainId
    && workload.isolationClass === first.isolationClass
    && workload.platform === first.platform
    && workload.architecture === first.architecture
    && workload.networkClass === first.networkClass
    && workload.workspaceIsolation === first.workspaceIsolation
    && template.allowedNetworkClasses.has(workload.networkClass);
}
function projectedUsage(slot, workload) {
  return resourceUsage([...slot.workloads, workload]);
}
function fits(usage, capacity) {
  return usage.cpuMillicores <= capacity.cpuMillicores
    && usage.memoryMiB <= capacity.memoryMiB
    && usage.diskMiB <= capacity.diskMiB;
}
function fitScore(usage, capacity) {
  const cpu = usage.cpuMillicores / capacity.cpuMillicores;
  const memory = usage.memoryMiB / capacity.memoryMiB;
  const disk = usage.diskMiB / capacity.diskMiB;
  return (cpu * 0.35) + (memory * 0.4) + (disk * 0.25) + (Math.max(cpu, memory, disk) * 0.1);
}

/**
 * Deterministic, secret-free best-fit placement planner.
 * It only proposes co-location; it does not start runners, agents or containers,
 * acquire leases, persist state, or deliver credentials.
 * Runtime bundle bytes are counted once per pinned digest per runner slot.
 * Every workload retains its own CPU/RAM reservation and scratch disk.
 */
export function planAgentPlacement({ workloads, slotTemplate, now, maxRunnerSlots = HARD_MAX_RUNNER_SLOTS }) {
  assert(Array.isArray(workloads), "workloads must be an array");
  assert(Number.isFinite(now) && now >= 0, "now must be a non-negative planning timestamp");
  assert(Number.isInteger(maxRunnerSlots) && maxRunnerSlots >= 1 && maxRunnerSlots <= HARD_MAX_RUNNER_SLOTS,
    "maxRunnerSlots must be between 1 and the hard limit of 20");
  const template = normalizeTemplate(slotTemplate, now);
  const normalized = workloads.map((workload) => normalizeWorkload(workload, now));
  const ids = normalized.map((item) => item.id);
  assert(new Set(ids).size === ids.length, "workload IDs must be unique");
  const gatewayScopeIds = normalized.map((item) => item.gatewayScopeId).filter(Boolean);
  assert(new Set(gatewayScopeIds).size === gatewayScopeIds.length,
    "gatewayScopeId must be unique per workload; credential capabilities cannot be shared");

  for (const workload of normalized) {
    assert(workload.platform === template.platform, "all workloads must match the selected runner platform");
    assert(workload.architecture === template.architecture, "all workloads must match the selected runner architecture");
    assert(template.allowedNetworkClasses.has(workload.networkClass), "workload networkClass is not allowed by the runner template");
    for (const capability of workload.requiredCapabilities) {
      assert(template.capabilities.has(capability), "runner template is missing required capability: " + capability);
    }
    assert(fits(resourceUsage([workload]), template.capacity),
      "workload exceeds single-runner resource capacity: " + workload.id);
  }

  const dominantShare = (workload) => Math.max(
    workload.resources.cpuMillicores / template.capacity.cpuMillicores,
    workload.resources.memoryMiB / template.capacity.memoryMiB,
    (workload.resources.scratchDiskMiB + workload.runtimeBundle.diskMiB) / template.capacity.diskMiB
  );
  const ordered = [...normalized].sort((a, b) =>
    dominantShare(b) - dominantShare(a) || a.id.localeCompare(b.id)
  );
  const slots = [];
  const unplaced = [];

  for (const workload of ordered) {
    const candidates = slots
      .filter((slot) => compatible(slot, workload, template))
      .map((slot) => ({ slot, usage: projectedUsage(slot, workload) }))
      .filter((candidate) => fits(candidate.usage, template.capacity))
      .sort((a, b) => fitScore(b.usage, template.capacity) - fitScore(a.usage, template.capacity)
        || a.slot.slotId.localeCompare(b.slot.slotId));

    if (candidates.length > 0) {
      candidates[0].slot.workloads.push(workload);
      candidates[0].slot.usage = candidates[0].usage;
      continue;
    }
    if (slots.length >= maxRunnerSlots) {
      unplaced.push({ workloadId: workload.id, reason: "runner_slot_limit_reached" });
      continue;
    }
    slots.push({
      slotId: "runner-" + String(slots.length + 1).padStart(2, "0"),
      platform: template.platform,
      architecture: template.architecture,
      workloads: [workload],
      usage: resourceUsage([workload])
    });
  }

  const assignments = slots.flatMap((slot) => slot.workloads.map((workload) => ({
    workloadId: workload.id, slotId: slot.slotId, functions: workload.functions
  }))).sort((a, b) => a.workloadId.localeCompare(b.workloadId));

  return {
    admitted: unplaced.length === 0,
    strategy: "best-fit-decreasing-multidimensional",
    runnerSlotCount: slots.length,
    workloadCount: normalized.length,
    coLocatedWorkloadCount: slots.reduce((total, slot) => total + Math.max(0, slot.workloads.length - 1), 0),
    assignments,
    slots: slots.map((slot) => ({
      slotId: slot.slotId,
      platform: slot.platform,
      architecture: slot.architecture,
      workloadIds: slot.workloads.map((workload) => workload.id),
      usage: slot.usage,
      capacity: template.capacity,
      utilization: {
        cpu: Number((slot.usage.cpuMillicores / template.capacity.cpuMillicores).toFixed(4)),
        memory: Number((slot.usage.memoryMiB / template.capacity.memoryMiB).toFixed(4)),
        disk: Number((slot.usage.diskMiB / template.capacity.diskMiB).toFixed(4))
      }
    })),
    unplaced
  };
}
export const MAX_RUNNER_SLOTS = HARD_MAX_RUNNER_SLOTS;
