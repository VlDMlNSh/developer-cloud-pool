import { describe, expect, it } from "vitest";
import { planArtifactOrphanReconciliation } from "../src/artifact-reconcile.mjs";

const taskKey = "a".repeat(64);
const uploadId = "upload_reconcile_000001";
const key = `ingest/${taskKey}/${uploadId}`;
const cutoffEpochMs = Date.parse("2026-11-18T12:00:00.000Z");
const retentionMs = 7 * 24 * 60 * 60 * 1000;

function object(overrides = {}) {
  return {
    key, version: "r2-version-1",
    uploaded: new Date(cutoffEpochMs - retentionMs - 1000),
    customMetadata: { taskKey, uploadId },
    ...overrides
  };
}
function input(overrides = {}) {
  return {
    objects: [object()],
    resultReferences: [],
    outboxReferences: [],
    tasks: [{ taskKey, state: "dead" }],
    cutoffEpochMs, retentionMs,
    objectListingComplete: true,
    referenceSnapshotComplete: true,
    crossStoreSnapshotConsistent: true,
    ...overrides
  };
}

describe("R2 artifact orphan reconciliation planner", () => {
  it("reports only old objects belonging to dead tasks with no result/outbox reference", () => {
    const report = planArtifactOrphanReconciliation(input());
    expect(report).toMatchObject({
      decision: "REPORT_READY", mode: "DRY_RUN_ONLY", deletionPerformed: false,
      candidateCount: 1, retainedCount: 0
    });
    expect(report.candidates[0]).toMatchObject({
      key, version: "r2-version-1", classification: "UNREFERENCED_DEAD_TASK_PAST_RETENTION",
      deletionEligible: false, requiresIndependentApproval: true
    });
  });

  it("preserves an object referenced by a result", () => {
    const report = planArtifactOrphanReconciliation(input({
      resultReferences: [{ objectKey: key, objectVersion: "r2-version-1" }]
    }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("REFERENCED_BY_RESULT_OR_OUTBOX");
  });

  it("preserves an object referenced by an outbox even if version differs", () => {
    const report = planArtifactOrphanReconciliation(input({
      outboxReferences: [{ objectKey: key, objectVersion: "older-version" }]
    }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("REFERENCED_BY_RESULT_OR_OUTBOX");
  });

  it.each(["pending", "leased", "completed"])("preserves objects for task state %s", (state) => {
    const report = planArtifactOrphanReconciliation(input({ tasks: [{ taskKey, state }] }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("TASK_NOT_TERMINAL_DEAD");
  });

  it("preserves objects when the task row is missing", () => {
    const report = planArtifactOrphanReconciliation(input({ tasks: [] }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("TASK_STATE_UNKNOWN");
  });

  it("preserves objects when R2 and D1 snapshots are not jointly attested", () => {
    const report = planArtifactOrphanReconciliation(input({ crossStoreSnapshotConsistent: false }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("CROSS_STORE_SNAPSHOT_NOT_ATTESTED");
  });

  it("preserves objects until the full retention window has elapsed", () => {
    const report = planArtifactOrphanReconciliation(input({
      objects: [object({ uploaded: new Date(cutoffEpochMs - retentionMs + 1) })]
    }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained[0].reason).toBe("RETENTION_WINDOW_NOT_ELAPSED");
  });

  it("fails closed when either inventory snapshot is incomplete", () => {
    for (const overrides of [{ objectListingComplete: false }, { referenceSnapshotComplete: false }]) {
      const report = planArtifactOrphanReconciliation(input(overrides));
      expect(report.candidateCount).toBe(0);
      expect(report.retained[0].reason).toBe("RECONCILIATION_SNAPSHOT_INCOMPLETE");
    }
  });

  it("preserves malformed keys, metadata, versions, and timestamps", () => {
    const report = planArtifactOrphanReconciliation(input({
      objects: [
        object({ key: "other-prefix/file" }),
        object({ customMetadata: { taskKey: "wrong", uploadId } }),
        object({ version: "" }),
        object({ uploaded: "not-a-date" })
      ]
    }));
    expect(report.candidateCount).toBe(0);
    expect(report.retained).toHaveLength(4);
    expect(report.retained.every((entry) => entry.reason === "OBJECT_IDENTITY_OR_TIMESTAMP_UNVERIFIED")).toBe(true);
  });

  it("rejects incomplete or oversized reference snapshots", () => {
    expect(planArtifactOrphanReconciliation(input({ referenceSnapshotComplete: undefined })))
      .toMatchObject({ decision: "DENY", reason: "INVALID_RECONCILIATION_INPUT", deletionPerformed: false });
    expect(planArtifactOrphanReconciliation(input({
      resultReferences: Array.from({ length: 1001 }, () => ({ objectKey: key, objectVersion: "v" }))
    }))).toMatchObject({ decision: "DENY", reason: "INVALID_RECONCILIATION_INPUT", deletionPerformed: false });
  });

  it("fails closed on malformed reference rows and duplicate task identities", () => {
    expect(planArtifactOrphanReconciliation(input({ resultReferences: [{ objectKey: key }] })))
      .toMatchObject({ decision: "DENY", reason: "INVALID_REFERENCE_SNAPSHOT" });
    expect(planArtifactOrphanReconciliation(input({
      tasks: [{ taskKey, state: "dead" }, { taskKey, state: "dead" }]
    }))).toMatchObject({ decision: "DENY", reason: "INVALID_TASK_SNAPSHOT" });
  });
});
