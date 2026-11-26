import { admitQualifiedTask } from "./admit-qualified-task.mjs";
import { verifyOwnerNextEnvelopeForActions } from "./owner-next-envelope.mjs";

const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const OWNER_LOGIN = "VlDMlNSh";
const REPOSITORY = "VlDMlNSh/developer-cloud-pool";
const DEFAULT_REF = "refs/heads/Основной";
const WORKFLOW_REF = "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной";
const PROFILE = "jarvis-code-sandbox-v1";
const BODY_DIGEST = "65e2c8aed83c729f4663f27dceb83ec1b5abe5c0717eb156934fcce9658df2e3";
const SHA40 = /^[a-f0-9]{40}$/;
const DECIMAL = /^[1-9][0-9]{0,31}$/;
const deny = reason => ({ decision: "DENY", dispatch: false, executionAuthorized: false, reason });
const safeInt = value => Number.isSafeInteger(value) && value > 0;

export async function bindGitHubNextEvent(context) {
  if (!context || context.githubActions !== "true" || context.serverUrl !== "https://github.com") return deny("UNTRUSTED_GITHUB_ACTIONS_CONTEXT");
  if (context.eventName !== "issue_comment" || context.eventAction !== "created" ||
      context.repository !== REPOSITORY || String(context.repositoryId) !== REPOSITORY_ID ||
      String(context.ownerNumericId) !== OWNER_ID || context.ownerLogin !== OWNER_LOGIN) return deny("GITHUB_EVENT_IDENTITY_MISMATCH");
  if (context.issueNumber !== 96 || context.isPullRequest !== false ||
      String(context.commentUserId) !== OWNER_ID || context.commentUserLogin !== OWNER_LOGIN ||
      String(context.actorId) !== OWNER_ID || context.actorLogin !== OWNER_LOGIN ||
      String(context.actorId) !== String(context.commentUserId) ||
      context.actorLogin !== context.commentUserLogin ||
      context.commentAuthorAssociation !== "OWNER") return deny("GITHUB_OWNER_ISSUE_PREDICATE_FAILED");
  if (context.commentBody !== "/next") return deny("GITHUB_COMMAND_BODY_NOT_EXACT");
  if (context.ref !== DEFAULT_REF || !SHA40.test(context.sha || "") ||
      context.workflowRef !== WORKFLOW_REF || !SHA40.test(context.workflowSha || "")) return deny("GITHUB_WORKFLOW_PROVENANCE_MISMATCH");
  if (!DECIMAL.test(String(context.commentId)) || !safeInt(context.runId) || !safeInt(context.runAttempt)) return deny("GITHUB_EVENT_ID_INVALID");

  const bound = {
    sourceCommentId: String(context.commentId), repositoryId: REPOSITORY_ID,
    ownerNumericId: OWNER_ID, issueNumber: 96, eventName: "issue_comment",
    eventAction: "created", actorNumericId: String(context.actorId), actorLogin: context.actorLogin,
    authorAssociation: "OWNER", bodyDigest: BODY_DIGEST, ref: DEFAULT_REF,
    targetSha: context.sha, workflowRef: WORKFLOW_REF, workflowSha: context.workflowSha,
    runId: context.runId, runAttempt: context.runAttempt, profile: PROFILE
  };
  const canonical = JSON.stringify([
    bound.sourceCommentId, bound.repositoryId, bound.ownerNumericId, bound.issueNumber,
    bound.eventName, bound.eventAction, bound.actorNumericId, bound.actorLogin,
    bound.authorAssociation, bound.bodyDigest, bound.ref, bound.targetSha,
    bound.workflowRef, bound.workflowSha, bound.profile
  ]);
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    bound.eventDigest = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
  } catch { return deny("GITHUB_EVENT_DIGEST_UNAVAILABLE"); }
  return { decision: "BOUND", context: bound, dispatch: false, executionAuthorized: false };
}

async function readReceipt(db, event) {
  return db.prepare(
    "SELECT source_comment_id, repository_id, owner_numeric_id, issue_number, event_name, event_action, actor_numeric_id, actor_login, author_association, body_digest, ref, target_sha, workflow_ref, workflow_sha, run_id, run_attempt, profile, event_digest, admission_id, recorded_at, dispatch_enabled, attestation_schema, attestation_version, issue_node_id, comment_node_id, observed_default_head_sha, run_head_sha, workflow_id, workflow_state, workflow_commit_sha, workflow_file_blob_sha, workflow_file_ref_sha FROM pool_source_comment_receipts WHERE repository_id = ? AND source_comment_id = ?"
  ).bind(event.repositoryId, event.sourceCommentId).first();
}

function receiptMatches(row, event, admissionId) {
  return Boolean(row && row.source_comment_id === event.sourceCommentId &&
    row.repository_id === event.repositoryId && row.owner_numeric_id === event.ownerNumericId &&
    row.issue_number === event.issueNumber && row.event_name === event.eventName &&
    row.event_action === event.eventAction && row.actor_numeric_id === event.actorNumericId &&
    row.actor_login === event.actorLogin && row.author_association === event.authorAssociation &&
    row.body_digest === event.bodyDigest && row.ref === event.ref && row.target_sha === event.targetSha &&
    row.workflow_ref === event.workflowRef && row.workflow_sha === event.workflowSha &&
    row.run_id === event.runId && row.run_attempt === event.runAttempt &&
    row.profile === PROFILE && row.event_digest === event.eventDigest &&
    row.admission_id === admissionId && row.dispatch_enabled === 0 &&\n    row.attestation_schema === (event.attestationSchema ?? "") &&\n    row.attestation_version === (event.attestationVersion ?? 0) &&\n    row.issue_node_id === (event.issueNodeId ?? "") && row.comment_node_id === (event.commentNodeId ?? "") &&\n    row.observed_default_head_sha === (event.observedDefaultHeadSha ?? "") &&\n    row.run_head_sha === (event.runHeadSha ?? "") && row.workflow_id === (event.workflowId ?? "") &&\n    row.workflow_state === (event.workflowState ?? "") &&\n    row.workflow_commit_sha === (event.workflowCommitSha ?? "") &&\n    row.workflow_file_blob_sha === (event.workflowFileBlobSha ?? "") &&\n    row.workflow_file_ref_sha === (event.workflowFileRefSha ?? ""));
}

async function verifyAdmissionChain(db, input) {
  const { approval: a, route: r, attempt: t } = input;
  const row = await db.prepare(
    "SELECT a.admission_id, a.approval_id, a.task_key, a.executor_id, a.attempt_id, a.attempt_number, a.qualification_id, a.evidence_digest, a.admitted_at, a.dispatch_enabled, l.owner_numeric_id, l.repository_id, l.issue_number, l.target_sha, l.profile, l.envelope_digest, l.state AS approval_state, l.consumed_at, l.executor_id AS approval_executor_id, t.executor_id AS task_executor_id, t.current_attempt_id, t.attempt_number AS task_attempt_number, p.status AS attempt_status, p.input_digest, p.execution_idempotency_key, q.route_id, q.provider_id, q.model_id, q.issuer_id, q.account_ref, q.credential_handle_ref, q.quota_domain_id, q.cost_class, q.capability_id, q.capability_profile, q.registry_version, q.schema_version, q.evidence_ref, q.observed_at, q.valid_until, q.revocation_version, q.qualification_status, q.revoked_at, o.status AS outbox_status, o.event_type, o.admission_id AS outbox_admission_id, o.attempt_id AS outbox_attempt_id, o.evidence_digest AS outbox_evidence_digest, c.assertion, c.executor_id AS receipt_executor_id, c.approval_id AS receipt_approval_id, c.task_key AS receipt_task_key, c.attempt_id AS receipt_attempt_id, c.qualification_id AS receipt_qualification_id, c.evidence_digest AS receipt_evidence_digest, c.committed_at, c.dispatch_enabled AS receipt_dispatch_enabled FROM pool_admissions a JOIN pool_approval_ledger l ON l.approval_id = a.approval_id JOIN pool_tasks t ON t.task_key = a.task_key JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key JOIN pool_route_qualifications q ON q.qualification_id = a.qualification_id JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key JOIN pool_admission_commit_receipts c ON c.admission_id = a.admission_id WHERE a.admission_id = ?"
  ).bind(input.admissionId).first();
  return Boolean(row && row.approval_id === a.approvalId && row.task_key === input.taskKey &&
    row.executor_id === input.executorId && row.approval_executor_id === input.executorId &&
    row.task_executor_id === input.executorId && row.attempt_id === t.attemptId &&
    row.attempt_number > 0 && row.qualification_id === r.qualificationId &&
    row.evidence_digest === r.evidenceDigest && row.admitted_at === row.consumed_at &&
    row.dispatch_enabled === 0 && row.owner_numeric_id === a.ownerNumericId &&
    row.repository_id === a.repositoryId && row.issue_number === a.issueNumber &&
    row.target_sha === a.targetSha && row.profile === PROFILE &&
    row.envelope_digest === a.envelopeDigest && row.approval_state === "consumed" &&
    row.current_attempt_id === t.attemptId && row.task_attempt_number === row.attempt_number &&
    row.attempt_status === "prepared" && row.input_digest === t.inputDigest &&
    row.execution_idempotency_key === t.executionIdempotencyKey &&
    row.route_id === r.routeId && row.provider_id === r.providerId &&
    row.model_id === r.modelId && row.issuer_id === r.issuerId &&
    row.account_ref === r.accountRef && row.credential_handle_ref === r.credentialHandleRef &&
    row.quota_domain_id === (r.quotaDomainId ?? null) && row.cost_class === r.costClass &&
    row.capability_id === r.capabilityId && row.capability_profile === PROFILE &&
    row.registry_version === r.registryVersion && row.schema_version === r.schemaVersion &&
    row.evidence_ref === r.evidenceRef && row.observed_at === r.observedAt &&
    row.valid_until === r.validUntil && row.revocation_version === r.revocationVersion &&
    row.qualification_status === "qualified" && row.revoked_at === null &&
    row.outbox_status === "pending" && row.event_type === "pool.task.ready" &&
    row.outbox_admission_id === input.admissionId && row.outbox_attempt_id === t.attemptId &&
    row.outbox_evidence_digest === r.evidenceDigest && row.assertion === 1 &&
    row.receipt_executor_id === input.executorId && row.receipt_approval_id === a.approvalId &&
    row.receipt_task_key === input.taskKey && row.receipt_attempt_id === t.attemptId &&
    row.receipt_qualification_id === r.qualificationId &&
    row.receipt_evidence_digest === r.evidenceDigest && row.committed_at === row.admitted_at &&
    row.receipt_dispatch_enabled === 0);
}

async function recordGitHubNextReceipt(db, input, event, trustedClock) {
  if (!db || typeof db.prepare !== "function" || typeof db.withSession !== "function") return deny("SOURCE_COMMENT_STORAGE_UNAVAILABLE");
  const a = input?.approval;
  if (!a || a.ownerNumericId !== event.ownerNumericId || a.repositoryId !== event.repositoryId ||
      a.issueNumber !== event.issueNumber || a.targetSha !== event.targetSha ||
      a.profile !== PROFILE || a.envelopeDigest !== event.eventDigest) return deny("SOURCE_COMMENT_ADMISSION_ENVELOPE_MISMATCH");
  try {
    const session = db.withSession("first-primary");
    if (!await verifyAdmissionChain(session, input)) return deny("ADMISSION_CHAIN_READBACK_MISMATCH");
    const existing = await readReceipt(session, event);
    if (existing) return receiptMatches(existing, event, input.admissionId)
      ? { decision: "SOURCE_COMMENT_ALREADY_RECORDED", admissionId: input.admissionId, sourceCommentId: event.sourceCommentId, dispatch: false, executionAuthorized: false }
      : deny("SOURCE_COMMENT_IDENTITY_CONFLICT");
    let recordedAt;
    try { recordedAt = trustedClock(); } catch { return deny("TRUSTED_CLOCK_UNAVAILABLE"); }
    if (!Number.isSafeInteger(recordedAt) || recordedAt <= 0) return deny("TRUSTED_CLOCK_INVALID");
    await db.prepare(
      "INSERT INTO pool_source_comment_receipts (source_comment_id, repository_id, owner_numeric_id, issue_number, event_name, event_action, actor_numeric_id, actor_login, author_association, body_digest, ref, target_sha, workflow_ref, workflow_sha, run_id, run_attempt, profile, event_digest, admission_id, recorded_at, dispatch_enabled, attestation_schema, attestation_version, issue_node_id, comment_node_id, observed_default_head_sha, run_head_sha, workflow_id, workflow_state, workflow_commit_sha, workflow_file_blob_sha, workflow_file_ref_sha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(event.sourceCommentId, event.repositoryId, event.ownerNumericId, event.issueNumber,
      event.eventName, event.eventAction, event.actorNumericId, event.actorLogin,
      event.authorAssociation, event.bodyDigest, event.ref, event.targetSha, event.workflowRef,
      event.workflowSha, event.runId, event.runAttempt, event.profile, event.eventDigest,
      input.admissionId, recordedAt, event.attestationSchema ?? "", event.attestationVersion ?? 0,\n      event.issueNodeId ?? "", event.commentNodeId ?? "", event.observedDefaultHeadSha ?? "",\n      event.runHeadSha ?? "", event.workflowId ?? "", event.workflowState ?? "",\n      event.workflowCommitSha ?? "", event.workflowFileBlobSha ?? "", event.workflowFileRefSha ?? "").run();
    const committed = await readReceipt(db.withSession("first-primary"), event);
    return receiptMatches(committed, event, input.admissionId)
      ? { decision: "SOURCE_COMMENT_RECORDED", admissionId: input.admissionId, sourceCommentId: event.sourceCommentId, dispatch: false, executionAuthorized: false }
      : deny("SOURCE_COMMENT_READBACK_MISMATCH");
  } catch {
    try {
      const recovered = await readReceipt(db.withSession("first-primary"), event);
      return receiptMatches(recovered, event, input.admissionId)
        ? { decision: "SOURCE_COMMENT_ALREADY_RECORDED", admissionId: input.admissionId, sourceCommentId: event.sourceCommentId, dispatch: false, executionAuthorized: false }
        : deny("SOURCE_COMMENT_OUTCOME_UNCONFIRMED");
    } catch { return deny("SOURCE_COMMENT_OUTCOME_UNCONFIRMED"); }
  }
}

async function admitBoundGitHubNextEvent(db, input, event, trustedClock) {
  if (input?.approval?.envelopeDigest !== event.eventDigest) return deny("SOURCE_COMMENT_ADMISSION_ENVELOPE_MISMATCH");
  const admitted = await admitQualifiedTask(db, input, trustedClock);
  if (!["ADMITTED_QUEUED", "ADMISSION_ALREADY_COMMITTED"].includes(admitted.decision)) return admitted;
  const receipt = await recordGitHubNextReceipt(db, input, event, trustedClock);
  if (receipt.decision === "DENY") return receipt;
  return { ...admitted, sourceCommentId: event.sourceCommentId,
    receiptDecision: receipt.decision, dispatch: false, executionAuthorized: false };
}

export async function admitGitHubNextEvent(db, input, context, trustedClock) {
  const bound = await bindGitHubNextEvent(context);
  if (bound.decision !== "BOUND") return bound;
  return admitBoundGitHubNextEvent(db, input, bound.context, trustedClock);
}

export async function admitGitHubNextAttestedEvent(db, input, sourceJson, suppliedDigest, trustedContext, trustedClock) {
  let verified;
  try { verified = await verifyOwnerNextEnvelopeForActions(sourceJson, suppliedDigest, trustedContext); }
  catch (error) { return deny(error?.code || "API_ATTESTATION_INVALID"); }
  const { event: e, ref: r, run, policy } = verified.envelope;
  const event = {
    sourceCommentId: e.commentId, repositoryId: e.repositoryId, ownerNumericId: e.ownerId,
    issueNumber: e.issueNumber, eventName: e.name, eventAction: e.action,
    actorNumericId: e.actorId, actorLogin: e.actorLogin, authorAssociation: e.authorAssociation,
    bodyDigest: e.bodySha256, ref: r.name, targetSha: run.headSha,
    workflowRef: trustedContext.workflowRef, workflowSha: run.workflowCommitSha,
    runId: Number(run.id), runAttempt: run.attempt, profile: policy.profile,
    eventDigest: verified.digest, attestationSchema: verified.envelope.schema,
    attestationVersion: verified.envelope.version, issueNodeId: e.issueNodeId,
    commentNodeId: e.commentNodeId, observedDefaultHeadSha: r.observedDefaultHeadSha,
    runHeadSha: run.headSha, workflowId: run.workflowId, workflowState: run.workflowState,
    workflowCommitSha: run.workflowCommitSha, workflowFileBlobSha: run.workflowFileBlobSha,
    workflowFileRefSha: run.workflowFileRefSha
  };
  return admitBoundGitHubNextEvent(db, input, event, trustedClock);
}
