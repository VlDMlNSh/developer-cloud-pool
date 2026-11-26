const SAFE_TASK_KEY = /^[a-f0-9]{64}$/;
const SAFE_UPLOAD_ID = /^[A-Za-z0-9_-]{16,128}$/;
const MAX_ITEMS = 1000;

/**
 * Produces a read-only reconciliation report. This module has no R2 delete
 * capability by design: every candidate still requires a separately reviewed
 * deletion mechanism and an independently approved retention policy.
 */
export function planArtifactOrphanReconciliation(input) {
  if (!input || !Array.isArray(input.objects) ||
      !Array.isArray(input.resultReferences) || !Array.isArray(input.outboxReferences) ||
      !Array.isArray(input.tasks) ||
      input.objects.length > MAX_ITEMS || input.resultReferences.length > MAX_ITEMS ||
      input.outboxReferences.length > MAX_ITEMS || input.tasks.length > MAX_ITEMS ||
      !Number.isSafeInteger(input.cutoffEpochMs) || input.cutoffEpochMs <= 0 ||
      !Number.isSafeInteger(input.retentionMs) || input.retentionMs < 1 ||
      typeof input.objectListingComplete !== "boolean" ||
      typeof input.referenceSnapshotComplete !== "boolean" ||
      typeof input.crossStoreSnapshotConsistent !== "boolean") {
    return { decision: "DENY", reason: "INVALID_RECONCILIATION_INPUT", mode: "DRY_RUN_ONLY", deletionPerformed: false };
  }

  const referencedKeys = new Set();
  for (const reference of [...input.resultReferences, ...input.outboxReferences]) {
    if (!reference || typeof reference.objectKey !== "string" ||
        typeof reference.objectVersion !== "string" || !reference.objectVersion) {
      return { decision: "DENY", reason: "INVALID_REFERENCE_SNAPSHOT", mode: "DRY_RUN_ONLY", deletionPerformed: false };
    }
    referencedKeys.add(reference.objectKey);
  }

  const taskStates = new Map();
  for (const task of input.tasks) {
    if (!task || !SAFE_TASK_KEY.test(task.taskKey ?? "") ||
        !["pending", "leased", "completed", "dead"].includes(task.state) ||
        taskStates.has(task.taskKey)) {
      return { decision: "DENY", reason: "INVALID_TASK_SNAPSHOT", mode: "DRY_RUN_ONLY", deletionPerformed: false };
    }
    taskStates.set(task.taskKey, task.state);
  }

  const retentionBoundary = input.cutoffEpochMs - input.retentionMs;
  const candidates = [];
  const retained = [];

  for (const object of input.objects) {
    const key = object?.key;
    const match = typeof key === "string"
      ? /^ingest\/([a-f0-9]{64})\/([A-Za-z0-9_-]{16,128})$/.exec(key)
      : null;
    const uploadedAt = object?.uploaded instanceof Date
      ? object.uploaded.getTime()
      : (typeof object?.uploaded === "string" ? Date.parse(object.uploaded) : NaN);

    if (!match || typeof object.version !== "string" || !object.version ||
        object.customMetadata?.taskKey !== match[1] ||
        object.customMetadata?.uploadId !== match[2] ||
        !Number.isFinite(uploadedAt) || uploadedAt < 0) {
      retained.push({ key: key ?? null, reason: "OBJECT_IDENTITY_OR_TIMESTAMP_UNVERIFIED" });
      continue;
    }

    if (referencedKeys.has(key)) {
      retained.push({ key, reason: "REFERENCED_BY_RESULT_OR_OUTBOX" });
      continue;
    }

    const taskState = taskStates.get(match[1]);
    if (taskState === undefined) {
      retained.push({ key, reason: "TASK_STATE_UNKNOWN" });
      continue;
    }
    if (taskState !== "dead") {
      retained.push({ key, reason: "TASK_NOT_TERMINAL_DEAD" });
      continue;
    }
    if (!input.crossStoreSnapshotConsistent) {
      retained.push({ key, reason: "CROSS_STORE_SNAPSHOT_NOT_ATTESTED" });
      continue;
    }
    if (uploadedAt > retentionBoundary) {
      retained.push({ key, reason: "RETENTION_WINDOW_NOT_ELAPSED" });
      continue;
    }
    if (!input.objectListingComplete || !input.referenceSnapshotComplete) {
      retained.push({ key, reason: "RECONCILIATION_SNAPSHOT_INCOMPLETE" });
      continue;
    }

    candidates.push({
      key,
      version: object.version,
      taskKey: match[1],
      uploadId: match[2],
      uploadedAt,
      classification: "UNREFERENCED_DEAD_TASK_PAST_RETENTION",
      deletionEligible: false,
      requiresIndependentApproval: true
    });
  }

  return {
    decision: "REPORT_READY",
    mode: "DRY_RUN_ONLY",
    deletionPerformed: false,
    objectListingComplete: input.objectListingComplete,
    referenceSnapshotComplete: input.referenceSnapshotComplete,
    retentionBoundaryEpochMs: retentionBoundary,
    examined: input.objects.length,
    candidateCount: candidates.length,
    retainedCount: retained.length,
    candidates,
    retained
  };
}
