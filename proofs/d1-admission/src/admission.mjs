const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const ISSUE_NUMBER = 96;
const ISSUE_URL = "https://api.github.com/repos/" + OWNER_REPO + "/issues/" + ISSUE_NUMBER;
const DEFAULT_REF = "refs/heads/Основной";
const SHA40 = /^[a-f0-9]{40}$/;
const NUMERIC = /^[0-9]+$/;
const PROFILES = new Set(["dsh-headless-probe"]);

const deny = (reason) => ({
  decision: "DENY", dispatch: false, executionAuthorized: false, reason
});

async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validate(input, now) {
  const { event, repository, ref, targetSha, controllerRunId, controllerCodeSha, approvalId, profile } = input ?? {};
  if (input?.eventName !== "issue_comment" || event?.action !== "created") return "EVENT_NOT_NEW_ISSUE_COMMENT";
  if (repository?.full_name !== OWNER_REPO || String(repository?.id) !== REPOSITORY_ID) return "WRONG_REPOSITORY";
  if (repository?.owner?.login !== OWNER_LOGIN || String(repository?.owner?.id) !== OWNER_ID) return "WRONG_REPOSITORY_OWNER";
  if (repository?.default_branch !== "Основной" || ref !== DEFAULT_REF) return "UNTRUSTED_WORKFLOW_REF";
  if (!SHA40.test(targetSha ?? "") || !SHA40.test(controllerCodeSha ?? "")) return "INVALID_CONTROLLER_OR_TARGET_SHA";
  if (!NUMERIC.test(String(controllerRunId ?? "")) || !approvalId || approvalId.length > 128) return "INVALID_CONTROLLER_OR_APPROVAL_ID";
  if (!PROFILES.has(profile)) return "PROFILE_NOT_ALLOWED";
  if (!Number.isSafeInteger(now) || now <= 0) return "INVALID_CLOCK";
  const issue = event?.issue;
  if (!issue || issue.pull_request || issue.number !== ISSUE_NUMBER || issue.state !== "open" || issue.repository_url !== ISSUE_URL) {
    return "WRONG_CONTROL_ISSUE";
  }
  const comment = event?.comment;
  if (!Number.isSafeInteger(comment?.id) || comment.id <= 0 || comment.body !== "/next") return "INVALID_SOURCE_COMMENT";
  if (comment.user?.login !== OWNER_LOGIN || String(comment.user?.id) !== OWNER_ID || comment.author_association !== "OWNER") {
    return "COMMENT_AUTHOR_NOT_OWNER";
  }
  return null;
}

/**
 * No-secret admission proof. A single INSERT plus SQLite/D1 triggers performs
 * durable receipt + one-shot approval consume + immutable logical task +
 * task-level outbox in one atomic statement. It never dispatches.
 */
export async function admitOwnerNextEvent(db, input, now) {
  const invalid = validate(input, now);
  if (invalid) return deny(invalid);
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");

  const { event, repository, targetSha, controllerRunId, controllerCodeSha, approvalId, profile } = input;
  const sourceCommentId = String(event.comment.id);
  const actorId = String(event.comment.user.id);
  const waveId = await digest(JSON.stringify(["pool-wave-v1", REPOSITORY_ID, ISSUE_NUMBER, sourceCommentId]));
  const taskKey = await digest(JSON.stringify(["pool-task-v2", REPOSITORY_ID, ISSUE_NUMBER, targetSha, profile, waveId]));
  const admissionId = await digest(JSON.stringify(["pool-admission-v1", REPOSITORY_ID, ISSUE_NUMBER, sourceCommentId]));
  const envelopeDigest = await digest(JSON.stringify([
    "pool-admission-envelope-v1", REPOSITORY_ID, ISSUE_NUMBER, actorId,
    String(controllerRunId), controllerCodeSha, targetSha, profile, waveId
  ]));

  const values = [
    sourceCommentId, admissionId, String(repository.id), ISSUE_NUMBER, actorId, "OWNER",
    String(controllerRunId), controllerCodeSha, targetSha, profile, waveId,
    envelopeDigest, taskKey, approvalId, now
  ];

  let insertResult;
  try {
    insertResult = await db.prepare(`
      INSERT INTO pool_admission_receipts (
        source_comment_id, admission_id, repository_id, issue_number, actor_id,
        owner_association, controller_run_id, controller_code_sha, target_sha,
        profile, wave_id, envelope_digest, task_key, approval_id, admitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_comment_id) DO NOTHING
      RETURNING admission_id
    `).bind(...values).first();
  } catch {
    // A failed response can be ambiguous. Read the stable source ID before
    // considering any retry; never repeat a side effect blindly.
    try {
      const prior = await db.prepare(
        "SELECT admission_id, envelope_digest, task_key, approval_id FROM pool_admission_receipts WHERE source_comment_id = ?"
      ).bind(sourceCommentId).first();
      if (!prior) return deny("ADMISSION_OUTCOME_AMBIGUOUS_NO_RECEIPT");
      if (prior.admission_id !== admissionId || prior.envelope_digest !== envelopeDigest ||
          prior.task_key !== taskKey || prior.approval_id !== approvalId) return deny("SOURCE_COMMENT_IDENTITY_CONFLICT");
      return { decision: "ADMISSION_REPLAY", admissionId, sourceCommentId, waveId, taskKey, dispatch: false, executionAuthorized: false };
    } catch {
      return deny("ADMISSION_OUTCOME_AMBIGUOUS_STORAGE_UNAVAILABLE");
    }
  }

  try {
    const prior = await db.prepare(
      "SELECT admission_id, envelope_digest, task_key, approval_id FROM pool_admission_receipts WHERE source_comment_id = ?"
    ).bind(sourceCommentId).first();
    if (!prior || prior.admission_id !== admissionId || prior.envelope_digest !== envelopeDigest ||
        prior.task_key !== taskKey || prior.approval_id !== approvalId) {
      return deny("SOURCE_COMMENT_IDENTITY_CONFLICT_OR_INCOMPLETE_TRANSACTION");
    }
    const [task, outbox, approval] = await Promise.all([
      db.prepare("SELECT task_key, repository_id, issue_number, target_sha, profile, wave_id FROM pool_tasks WHERE task_key = ?").bind(taskKey).first(),
      db.prepare("SELECT outbox_id, task_key, status FROM pool_task_outbox WHERE task_key = ?").bind(taskKey).first(),
      db.prepare("SELECT state, task_key, consumed_at FROM pool_approval_ledger WHERE approval_id = ?").bind(approvalId).first()
    ]);
    if (!task || task.repository_id !== REPOSITORY_ID || task.issue_number !== ISSUE_NUMBER ||
        task.target_sha !== targetSha || task.profile !== profile || task.wave_id !== waveId ||
        !outbox || outbox.task_key !== taskKey || approval?.state !== "consumed" ||
        approval?.task_key !== taskKey || approval?.consumed_at !== now) {
      return deny("ATOMIC_ADMISSION_READBACK_MISMATCH");
    }
    const created = insertResult?.admission_id === admissionId;
    return {
      decision: created ? "ADMITTED" : "ADMISSION_REPLAY",
      admissionId, sourceCommentId, waveId, taskKey,
      outboxId: outbox.outbox_id, dispatch: false, executionAuthorized: false
    };
  } catch {
    return deny("ADMISSION_READBACK_AMBIGUOUS");
  }
}

export async function deriveAdmissionEnvelope(input) {
  const invalid = validate(input, 1);
  if (invalid) throw new Error(invalid);
  const sourceCommentId = String(input.event.comment.id);
  const actorId = String(input.event.comment.user.id);
  const waveId = await digest(JSON.stringify(["pool-wave-v1", REPOSITORY_ID, ISSUE_NUMBER, sourceCommentId]));
  const taskKey = await digest(JSON.stringify(["pool-task-v2", REPOSITORY_ID, ISSUE_NUMBER, input.targetSha, input.profile, waveId]));
  const envelopeDigest = await digest(JSON.stringify([
    "pool-admission-envelope-v1", REPOSITORY_ID, ISSUE_NUMBER, actorId,
    String(input.controllerRunId), input.controllerCodeSha, input.targetSha, input.profile, waveId
  ]));
  return { sourceCommentId, waveId, taskKey, envelopeDigest };
}
