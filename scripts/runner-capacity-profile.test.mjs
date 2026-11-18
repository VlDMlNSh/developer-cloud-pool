import test from "node:test";
import assert from "node:assert/strict";
import { buildRunnerCapacityCandidate } from "./runner-capacity-profile.mjs";

const now = 1800000000;
const snapshot = {
  schema: "developer-cloud-pool.runner-capacity-probe.v1",
  source: "github-actions-runner-resource-probe",
  repository: "owner/repo",
  ref: "refs/heads/test",
  commitSha: "a".repeat(40),
  runId: "123456",
  runAttempt: "1",
  runner: { os: "Linux", architecture: "X64", imageOs: "ubuntu24", imageVersion: "2026.11" },
  observedAt: now - 60,
  validUntil: now + 3600,
  raw: {
    cpuLogical: 4,
    memoryTotalMiB: 16000,
    memoryAvailableMiB: 12000,
    workspaceDiskTotalMiB: 14000,
    workspaceDiskAvailableMiB: 10000
  },
  qualificationStatus: "not_qualified"
};

test("candidate reserves host overhead and preserves observation-only status", () => {
  const candidate = buildRunnerCapacityCandidate(snapshot, { now });
  assert.deepEqual(candidate.capacity, {
    cpuMillicores: 3500,
    memoryMiB: 9952,
    diskMiB: 7952
  });
  assert.equal(candidate.qualificationStatus, "not_qualified");
  assert.equal(candidate.capacityEvidence.status, "observed");
  assert.equal(candidate.provenance.runId, "123456");
});

test("expired and future observations are rejected", () => {
  assert.throws(() => buildRunnerCapacityCandidate({ ...snapshot, validUntil: now }, { now }), /expired or invalid/);
  assert.throws(() => buildRunnerCapacityCandidate({ ...snapshot, observedAt: now + 1 }, { now }), /not be in the future/);
});

test("invalid provenance and insufficient resources are rejected", () => {
  assert.throws(() => buildRunnerCapacityCandidate({ ...snapshot, commitSha: "main" }, { now }), /immutable/);
  assert.throws(() => buildRunnerCapacityCandidate(snapshot, { now, reserveDiskMiB: 11000 }), /no usable runner capacity/);
});

test("secret-bearing fields are rejected", () => {
  assert.throws(() => buildRunnerCapacityCandidate({ ...snapshot, apiKey: "never-accepted" }, { now }), /forbidden property/);
});
