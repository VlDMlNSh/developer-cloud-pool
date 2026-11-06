const SENSITIVE_PROPERTY = /^(api[_-]?key|secret(?:value)?|token|password|private[_-]?key|authorization|credential(?:value)?|environment|env)$/i;

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}
function assertNoSecrets(value, path = "snapshot") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!SENSITIVE_PROPERTY.test(key), path + " contains forbidden property: " + key);
    assertNoSecrets(child, path + "." + key);
  }
}
function positive(value, field) {
  assert(Number.isInteger(value) && value > 0, field + " must be a positive integer");
  return value;
}

/**
 * Converts a read-only runner probe into a conservative capacity candidate.
 * A single sample is deliberately NOT promoted to verified/qualified evidence.
 */
export function buildRunnerCapacityCandidate(snapshot, {
  now,
  reserveCpuMillicores = 500,
  reserveMemoryMiB = 2048,
  reserveDiskMiB = 2048
} = {}) {
  assert(snapshot && typeof snapshot === "object" && !Array.isArray(snapshot), "snapshot must be an object");
  assertNoSecrets(snapshot);
  assert(snapshot.schema === "developer-cloud-pool.runner-capacity-probe.v1", "unsupported probe schema");
  assert(snapshot.qualificationStatus === "not_qualified", "probe snapshot must remain not_qualified");
  assert(Number.isFinite(now) && now >= 0, "now must be a non-negative timestamp");
  assert(Number.isInteger(snapshot.observedAt) && snapshot.observedAt <= now, "observedAt must not be in the future");
  assert(Number.isInteger(snapshot.validUntil) && snapshot.validUntil > now, "probe evidence is expired or invalid");
  assert(typeof snapshot.repository === "string" && snapshot.repository.length > 0, "repository is required");
  assert(typeof snapshot.commitSha === "string" && /^[a-f0-9]{40,64}$/i.test(snapshot.commitSha), "commitSha must be immutable");
  assert(typeof snapshot.runId === "string" && /^\\d+$/.test(snapshot.runId), "runId is required");
  assert(typeof snapshot.runAttempt === "string" && /^\\d+$/.test(snapshot.runAttempt), "runAttempt is required");
  assert(snapshot.runner && typeof snapshot.runner === "object", "runner metadata is required");
  const raw = snapshot.raw;
  assert(raw && typeof raw === "object", "raw resource measurements are required");
  const cpu = positive(raw.cpuLogical, "raw.cpuLogical") * 1000 - positive(reserveCpuMillicores, "reserveCpuMillicores");
  const memory = positive(raw.memoryAvailableMiB, "raw.memoryAvailableMiB") - positive(reserveMemoryMiB, "reserveMemoryMiB");
  const disk = positive(raw.workspaceDiskAvailableMiB, "raw.workspaceDiskAvailableMiB") - positive(reserveDiskMiB, "reserveDiskMiB");
  assert(cpu > 0 && memory > 0 && disk > 0, "reserves leave no usable runner capacity");
  return {
    schema: "developer-cloud-pool.runner-capacity-candidate.v1",
    qualificationStatus: "not_qualified",
    platform: String(snapshot.runner.os).toLowerCase(),
    architecture: String(snapshot.runner.architecture).toLowerCase(),
    capacity: { cpuMillicores: cpu, memoryMiB: memory, diskMiB: disk },
    capacityEvidence: {
      status: "observed",
      source: "github-actions-runner-resource-probe",
      evidenceRef: "github-actions://" + snapshot.repository + "/runs/" + snapshot.runId + "/attempts/" + snapshot.runAttempt,
      observedAt: snapshot.observedAt,
      validUntil: snapshot.validUntil
    },
    raw: {
      cpuLogical: raw.cpuLogical,
      memoryTotalMiB: raw.memoryTotalMiB,
      memoryAvailableMiB: raw.memoryAvailableMiB,
      workspaceDiskTotalMiB: raw.workspaceDiskTotalMiB,
      workspaceDiskAvailableMiB: raw.workspaceDiskAvailableMiB
    },
    provenance: {
      repository: snapshot.repository,
      ref: snapshot.ref,
      commitSha: snapshot.commitSha,
      runId: snapshot.runId,
      runAttempt: snapshot.runAttempt,
      imageOs: snapshot.runner.imageOs,
      imageVersion: snapshot.runner.imageVersion
    }
  };
}
