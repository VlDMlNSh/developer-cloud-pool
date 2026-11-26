import { createHash } from "node:crypto";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const CONTROL_ISSUE = 96;
const PREFIX = "<!-- cloud-pool-next-ledger:v1 ";
const SUFFIX = " -->";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validRecord(record) {
  return record && record.version === 1 &&
    record.repository === OWNER_REPO &&
    record.issueNumber === CONTROL_ISSUE &&
    Number.isSafeInteger(record.sourceCommentId) && record.sourceCommentId > 0 &&
    /^[0-9a-f]{40}$/.test(record.targetSha || "") &&
    /^[0-9a-f]{64}$/.test(record.dispatchId || "") &&
    ["ADMITTED", "DISPATCH_INTENT"].includes(record.state);
}

export function makeLedgerRecord({ sourceCommentId, targetSha, state }) {
  const payload = {
    version: 1,
    repository: OWNER_REPO,
    issueNumber: CONTROL_ISSUE,
    sourceCommentId,
    targetSha,
    dispatchId: sha256(OWNER_REPO + ":" + CONTROL_ISSUE + ":" + sourceCommentId),
    state
  };
  if (!validRecord(payload)) throw new TypeError("Invalid Cloud Pool ledger record.");
  return Object.freeze({ ...payload, recordDigest: sha256(JSON.stringify(payload)) });
}

export function encodeLedgerComment(record) {
  const { recordDigest, ...payload } = record || {};
  if (!validRecord(payload) || recordDigest !== sha256(JSON.stringify(payload))) {
    throw new TypeError("Ledger record integrity check failed.");
  }
  return PREFIX + JSON.stringify({ ...payload, recordDigest }) + SUFFIX;
}

export function parseLedgerComments(comments) {
  const records = [];
  for (const comment of comments || []) {
    const body = String(comment?.body || "");
    const start = body.indexOf(PREFIX);
    if (start < 0) continue;
    const end = body.indexOf(SUFFIX, start + PREFIX.length);
    if (end < 0 || body.slice(0, start).trim() || body.slice(end + SUFFIX.length).trim()) {
      throw new Error("Malformed Cloud Pool ledger comment.");
    }
    let record;
    try { record = JSON.parse(body.slice(start + PREFIX.length, end)); }
    catch { throw new Error("Malformed Cloud Pool ledger JSON."); }
    const { recordDigest, ...payload } = record || {};
    if (!validRecord(payload) || recordDigest !== sha256(JSON.stringify(payload))) {
      throw new Error("Untrusted or corrupted Cloud Pool ledger record.");
    }
    records.push(Object.freeze({ ...payload, recordDigest }));
  }
  return records;
}

/**
 * Plans one serialized write-ahead step. Caller must hold the repository-wide
 * controller concurrency lock while reading comments and applying the plan.
 * This module never dispatches a workflow or performs network I/O.
 */
export function planNextDispatch({ sourceCommentId, targetSha, records, observedRuns = [], lockHeld }) {
  if (lockHeld !== true) return Object.freeze({ action: "DENY", reason: "SERIAL_CONTROLLER_LOCK_REQUIRED" });
  if (!Number.isSafeInteger(sourceCommentId) || sourceCommentId <= 0 ||
      !/^[0-9a-f]{40}$/.test(String(targetSha || ""))) {
    return Object.freeze({ action: "DENY", reason: "INVALID_SOURCE_OR_TARGET" });
  }

  const matching = (records || []).filter(r => r.sourceCommentId === sourceCommentId);
  if (matching.length > 1) return Object.freeze({ action: "DENY", reason: "DUPLICATE_LEDGER_RECORDS" });

  const existing = matching[0];
  if (existing && (existing.targetSha !== targetSha ||
      existing.dispatchId !== sha256(OWNER_REPO + ":" + CONTROL_ISSUE + ":" + sourceCommentId))) {
    return Object.freeze({ action: "DENY", reason: "SOURCE_COMMENT_BINDING_CONFLICT" });
  }

  if (!existing) {
    return Object.freeze({
      action: "PERSIST_ADMISSION",
      record: makeLedgerRecord({ sourceCommentId, targetSha, state: "ADMITTED" })
    });
  }

  const runs = (observedRuns || []).filter(run =>
    run?.dispatchId === existing.dispatchId && run?.targetSha === existing.targetSha
  );
  if (runs.length > 1) return Object.freeze({ action: "INCIDENT", reason: "DUPLICATE_CONTROLLER_RUNS" });
  if (runs.length === 1) return Object.freeze({
    action: "RECONCILED",
    controllerRunId: runs[0].runId,
    dispatchId: existing.dispatchId,
    targetSha: existing.targetSha
  });

  if (existing.state === "ADMITTED") {
    return Object.freeze({
      action: "PERSIST_DISPATCH_INTENT",
      record: makeLedgerRecord({ sourceCommentId, targetSha, state: "DISPATCH_INTENT" })
    });
  }

  // DISPATCH_INTENT is a write-ahead marker. If no run is visible after a
  // previous attempt, the outcome is ambiguous: do not automatically retry.
  return Object.freeze({
    action: "AMBIGUOUS_NO_RETRY",
    reason: "DISPATCH_INTENT_WITHOUT_VISIBLE_RUN",
    dispatchId: existing.dispatchId,
    targetSha: existing.targetSha
  });
}

/**
 * Dispatch permission is deliberately ephemeral: only the same invocation
 * that has just persisted the intent may dispatch once. Recovery invocations
 * cannot regain this permission from the durable record.
 */
export function authorizeSingleDispatch({ record, appendConfirmed, sameInvocation }) {
  if (!validRecord(record) || record.state !== "DISPATCH_INTENT" ||
      appendConfirmed !== true || sameInvocation !== true) {
    return Object.freeze({ allowed: false, reason: "FRESH_INTENT_COMMIT_REQUIRED" });
  }
  return Object.freeze({
    allowed: true,
    dispatchId: record.dispatchId,
    targetSha: record.targetSha,
    maxAttempts: 1
  });
}
