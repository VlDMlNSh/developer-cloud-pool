import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { admitQualifiedTask } from "../src/admit-qualified-task.mjs";
import { canonicalTaskKey } from "../src/task-identity.mjs";

const db = env.UPGRADE_DB;
const legacyTaskKey = "1".repeat(64);
const legacyApprovalId = "legacy-approval-001";
const legacyAttemptId = "legacy-attempt-001";
const legacyDigest = "b".repeat(64);
const now = 1_800_000_000;

const admissionTaskKey = await canonicalTaskKey({ repositoryId: "20002", issueNumber: 43, targetSha: "c".repeat(40), profile: "jarvis-code-sandbox-v1", executorId: "executor-upgrade-alpha" });
const admissionInput = {
  admissionId: "upgrade-admission-001",
  taskKey: admissionTaskKey,
  now,
  executorId: "executor-upgrade-alpha",
  approval: {
    approvalId: "upgrade-approval-001", ownerNumericId: "10001",
    repositoryId: "20002", issueNumber: 43, targetSha: "c".repeat(40),
    profile: "jarvis-code-sandbox-v1", executorId: "executor-upgrade-alpha",
    envelopeDigest: "d".repeat(64)
  },
  route: {
    schemaVersion: 1, qualificationId: "upgrade-route-qualification-001",
    routeId: "local-ollama", providerId: "ollama", modelId: "qwen-local",
    issuerId: "local-authority", accountRef: "upgrade-account-1",
    credentialHandleRef: "upgrade-handle-1", quotaDomainId: null,
    costClass: "local", capabilityId: "pool.execute.local",
    capabilityProfile: "jarvis-code-sandbox-v1",
    evidenceRef: "local-evidence:upgrade-qualification-001",
    evidenceDigest: "e".repeat(64), observedAt: now - 60,
    validUntil: now + 3600, revocationVersion: 0, registryVersion: "registry-v1"
  },
  attempt: {
    attemptId: "upgrade-attempt-001", inputDigest: "f".repeat(64),
    executionIdempotencyKey: "upgrade-idem-001"
  }
};

beforeAll(async () => {
  const migrations = env.TEST_MIGRATIONS;
  // Build the independent upgrade database at the frozen schema-0010 boundary.
  await applyD1Migrations(db, migrations.slice(0, 10));

  // Historical synthetic records: approval -> task -> approval link -> ready
  // outbox -> immutable attempt. No executor identity existed at schema 0010.
  await db.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state, task_key
    ) VALUES (?, '10001', '20002', 42, ?, 'jarvis-code-sandbox-v1', ?, ?, 'ready', ?)
  `).bind(legacyApprovalId, "a".repeat(40), legacyDigest, now + 7200, legacyTaskKey).run();

  await db.prepare(`
    INSERT INTO pool_tasks (
      task_key, repository_id, issue_number, target_sha, profile,
      state, created_at, updated_at
    ) VALUES (?, '20002', 42, ?, 'jarvis-code-sandbox-v1', 'pending', ?, ?)
  `).bind(legacyTaskKey, "a".repeat(40), now - 600, now - 600).run();

  await db.prepare(`
    INSERT INTO pool_task_approvals (task_key, approval_id, envelope_digest, attached_at)
    VALUES (?, ?, ?, ?)
  `).bind(legacyTaskKey, legacyApprovalId, legacyDigest, now - 590).run();

  await db.prepare(`
    INSERT INTO pool_task_delivery_outbox (outbox_id, task_key, event_type, status, created_at)
    VALUES (?, ?, 'pool.task.ready', 'pending', ?)
  `).bind("legacy-ready:" + legacyTaskKey, legacyTaskKey, now - 580).run();

  await db.prepare(`
    INSERT INTO pool_attempts (
      attempt_id, task_key, attempt_number, status, input_digest,
      execution_idempotency_key, created_at
    ) VALUES (?, ?, 1, 'prepared', ?, 'legacy-idem-001', ?)
  `).bind(legacyAttemptId, legacyTaskKey, "c".repeat(64), now - 570).run();

  await db.prepare(`
    INSERT INTO pool_attempt_projection_outbox (
      outbox_id, task_key, attempt_id, repository_id, issue_number, target_sha,
      profile, lease_generation, terminal_status, event_digest, status, created_at, updated_at
    ) VALUES ('legacy-projection-001', ?, ?, '20002', 42, ?, 'jarvis-code-sandbox-v1',
      1, 'failed', ?, 'pending', ?, ?)
  `).bind(legacyTaskKey, legacyAttemptId, "a".repeat(40), "d".repeat(64), now - 560, now - 560).run();

  // Apply only the four forward migrations under test, never 0001-0010 to this DB.
  await applyD1Migrations(db, migrations.slice(10));
});

async function seedAdmission() {
  const a = admissionInput.approval;
  const r = admissionInput.route;
  await db.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state, executor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)
  `).bind(a.approvalId, a.ownerNumericId, a.repositoryId, a.issueNumber,
    a.targetSha, a.profile, a.envelopeDigest, now + 3600, a.executorId).run();

  await db.prepare(`
    INSERT INTO pool_route_qualifications (
      schema_version, qualification_id, route_id, provider_id, model_id, issuer_id,
      account_ref, credential_handle_ref, quota_domain_id, cost_class, capability_id,
      capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
      revocation_version, registry_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r.schemaVersion, r.qualificationId, r.routeId, r.providerId, r.modelId,
    r.issuerId, r.accountRef, r.credentialHandleRef, r.quotaDomainId, r.costClass,
    r.capabilityId, r.capabilityProfile, r.evidenceRef, r.evidenceDigest,
    r.observedAt, r.validUntil, r.revocationVersion, r.registryVersion).run();
}

describe("frozen schema-0010 upgrade through migrations 0011-0014", () => {
  it("preserves historical identifiers, task links, attempts and schema-0010 comment defaults", async () => {
    const approval = await db.prepare(
      "SELECT approval_id, task_key, executor_id FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(legacyApprovalId).first();
    const task = await db.prepare(
      "SELECT task_key, current_attempt_id, attempt_number, executor_id FROM pool_tasks WHERE task_key = ?"
    ).bind(legacyTaskKey).first();
    const link = await db.prepare(
      "SELECT approval_id FROM pool_task_approvals WHERE task_key = ?"
    ).bind(legacyTaskKey).first();
    const ready = await db.prepare(
      "SELECT outbox_id, event_type, status FROM pool_task_delivery_outbox WHERE task_key = ?"
    ).bind(legacyTaskKey).first();
    const attempt = await db.prepare(
      "SELECT attempt_id, task_key, attempt_number, status FROM pool_attempts WHERE attempt_id = ?"
    ).bind(legacyAttemptId).first();
    const projection = await db.prepare(
      "SELECT outbox_id, comment_post_state, comment_post_attempted_at FROM pool_attempt_projection_outbox WHERE outbox_id = 'legacy-projection-001'"
    ).first();

    expect(approval).toMatchObject({ approval_id: legacyApprovalId, task_key: legacyTaskKey, executor_id: null });
    expect(task).toMatchObject({ task_key: legacyTaskKey, current_attempt_id: legacyAttemptId, attempt_number: 1, executor_id: null });
    expect(link).toMatchObject({ approval_id: legacyApprovalId });
    expect(ready).toMatchObject({ outbox_id: "legacy-ready:" + legacyTaskKey, event_type: "pool.task.ready", status: "pending" });
    expect(attempt).toMatchObject({ attempt_id: legacyAttemptId, task_key: legacyTaskKey, attempt_number: 1, status: "prepared" });
    expect(projection).toMatchObject({ outbox_id: "legacy-projection-001", comment_post_state: "not_attempted", comment_post_attempted_at: null });
  });

  it("fails closed for historical approvals whose executor identity cannot be inferred", async () => {
    await expect(db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?
       WHERE approval_id = ?
    `).bind(now, legacyTaskKey, legacyApprovalId).run()).rejects.toThrow();
    const row = await db.prepare(
      "SELECT state, executor_id FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(legacyApprovalId).first();
    expect(row).toMatchObject({ state: "ready", executor_id: null });
  });

  it("admits a new executor-bound task and verifies durable receipt, outbox and exact replay", async () => {
    await seedAdmission();
    const first = await admitQualifiedTask(db, admissionInput);
    const replay = await admitQualifiedTask(db, admissionInput);
    expect(first).toMatchObject({ decision: "ADMITTED_QUEUED", dispatch: false, attemptId: admissionInput.attempt.attemptId });
    expect(replay).toMatchObject({ decision: "ADMISSION_ALREADY_COMMITTED", dispatch: false });
    const durable = await db.prepare(`
      SELECT l.executor_id, t.executor_id AS task_executor, t.current_attempt_id,
             o.admission_id, o.attempt_id, o.evidence_digest,
             r.attempt_id AS receipt_attempt, r.assertion, r.dispatch_enabled
        FROM pool_approval_ledger l
        JOIN pool_tasks t ON t.task_key = l.task_key
        JOIN pool_task_delivery_outbox o ON o.task_key = t.task_key
        JOIN pool_admission_commit_receipts r ON r.admission_id = o.admission_id
       WHERE l.approval_id = ?
    `).bind(admissionInput.approval.approvalId).first();
    expect(durable).toMatchObject({
      executor_id: admissionInput.executorId, task_executor: admissionInput.executorId,
      current_attempt_id: admissionInput.attempt.attemptId,
      admission_id: admissionInput.admissionId, attempt_id: admissionInput.attempt.attemptId,
      evidence_digest: admissionInput.route.evidenceDigest,
      receipt_attempt: admissionInput.attempt.attemptId, assertion: 1, dispatch_enabled: 0
    });
  });

  it("rejects reuse of one logical task key by two distinct executor identities", async () => {
    const conflictTaskKey = "e".repeat(64);
    const insertApproval = async (approvalId: string, executorId: string) => {
      await db.prepare(`
        INSERT INTO pool_approval_ledger (
          approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
          profile, envelope_digest, expires_at, state, executor_id
        ) VALUES (?, '10001', '20002', 77, ?, 'jarvis-code-sandbox-v1', ?, ?, 'ready', ?)
      `).bind(approvalId, "e".repeat(40), "8".repeat(64), now + 3600, executorId).run();
    };

    await insertApproval("executor-alpha-task-approval", "executor-alpha");
    await db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?, admission_id = 'executor-alpha-admission'
       WHERE approval_id = 'executor-alpha-task-approval'
    `).bind(now, conflictTaskKey).run();

    await insertApproval("executor-beta-task-approval", "executor-beta");
    await expect(db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?, admission_id = 'executor-beta-admission'
       WHERE approval_id = 'executor-beta-task-approval'
    `).bind(now, conflictTaskKey).run()).rejects.toThrow();

    const first = await db.prepare(
      "SELECT state, executor_id FROM pool_approval_ledger WHERE approval_id = 'executor-alpha-task-approval'"
    ).first();
    const second = await db.prepare(
      "SELECT state, executor_id FROM pool_approval_ledger WHERE approval_id = 'executor-beta-task-approval'"
    ).first();
    const task = await db.prepare(
      "SELECT executor_id FROM pool_tasks WHERE task_key = ?"
    ).bind(conflictTaskKey).first();
    expect(first).toMatchObject({ state: "consumed", executor_id: "executor-alpha" });
    expect(second).toMatchObject({ state: "ready", executor_id: "executor-beta" });
    expect(task).toMatchObject({ executor_id: "executor-alpha" });
  });

  it("keeps migration reapplication idempotent and rejects invalid foreign references", async () => {
    const before = await db.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first();
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(10));
    const after = await db.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first();
    expect(after.n).toBe(before.n);
    await expect(db.prepare(`
      INSERT INTO pool_task_approvals (task_key, approval_id, envelope_digest, attached_at)
      VALUES ('missing-task', 'missing-approval', ?, ?)
    `).bind("a".repeat(64), now).run()).rejects.toThrow();
  });

  it("denies exact replay when the durable receipt is absent after upgrade", async () => {
    // A separate admission identity keeps this fault-injection case independent.
    const missingReceiptTaskKey = await canonicalTaskKey({ repositoryId: "20002", issueNumber: 44, targetSha: "9".repeat(40), profile: "jarvis-code-sandbox-v1", executorId: "executor-upgrade-alpha" });
    const input = {
      ...admissionInput,
      admissionId: "upgrade-admission-missing-receipt",
      taskKey: missingReceiptTaskKey,
      approval: { ...admissionInput.approval, approvalId: "upgrade-approval-missing-receipt", issueNumber: 44, targetSha: "9".repeat(40) },
      route: { ...admissionInput.route, qualificationId: "upgrade-route-missing-receipt" },
      attempt: { ...admissionInput.attempt, attemptId: "upgrade-attempt-missing-receipt",
        executionIdempotencyKey: "upgrade-idem-missing-receipt" }
    };
    await db.prepare(`
      INSERT INTO pool_approval_ledger (
        approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
        profile, envelope_digest, expires_at, state, executor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)
    `).bind(input.approval.approvalId, input.approval.ownerNumericId,
      input.approval.repositoryId, input.approval.issueNumber, input.approval.targetSha,
      input.approval.profile, input.approval.envelopeDigest, now + 3600, input.executorId).run();
    await db.prepare(`
      INSERT INTO pool_route_qualifications (
        schema_version, qualification_id, route_id, provider_id, model_id, issuer_id,
        account_ref, credential_handle_ref, quota_domain_id, cost_class, capability_id,
        capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
        revocation_version, registry_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(input.route.schemaVersion, input.route.qualificationId, input.route.routeId,
      input.route.providerId, input.route.modelId, input.route.issuerId, input.route.accountRef,
      input.route.credentialHandleRef, input.route.quotaDomainId, input.route.costClass,
      input.route.capabilityId, input.route.capabilityProfile, input.route.evidenceRef,
      input.route.evidenceDigest, input.route.observedAt, input.route.validUntil,
      input.route.revocationVersion, input.route.registryVersion).run();
    const first = await admitQualifiedTask(db, input);
    expect(first.decision).toBe("ADMITTED_QUEUED");
    await db.prepare("DROP TRIGGER pool_admission_receipts_no_delete").run();
    await db.prepare("DELETE FROM pool_admission_commit_receipts WHERE admission_id = ?")
      .bind(input.admissionId).run();
    const replay = await admitQualifiedTask(db, input);
    expect(replay).toMatchObject({ decision: "DENY", reason: "ADMISSION_COMMIT_RECEIPT_MISMATCH", dispatch: false });

    // A present but forged receipt must fail the same durable identity readback.
    await expect(db.prepare(`
      INSERT INTO pool_admission_commit_receipts (
        admission_id, approval_id, task_key, executor_id, attempt_id,
        qualification_id, evidence_digest, committed_at, assertion, dispatch_enabled
      ) VALUES (?, ?, ?, ?, 'forged-attempt-id', ?, ?, ?, 1, 0)
    `).bind(input.admissionId, input.approval.approvalId, input.taskKey,
      input.executorId, input.route.qualificationId, input.route.evidenceDigest, now).run()).rejects.toThrow();
    const forgedReplay = await admitQualifiedTask(db, input);
    expect(forgedReplay).toMatchObject({
      decision: "DENY", reason: "ADMISSION_COMMIT_RECEIPT_MISMATCH", dispatch: false
    });
  });

  it("rejects malformed task-ready outbox event types after upgrade", async () => {
    const taskKey = "f".repeat(64);
    await db.prepare(`
      INSERT INTO pool_tasks (
        task_key, repository_id, issue_number, target_sha, profile, executor_id,
        state, created_at, updated_at
      ) VALUES (?, '20002', 99, ?, 'jarvis-code-sandbox-v1', 'executor-outbox-test',
        'pending', ?, ?)
    `).bind(taskKey, "f".repeat(40), now, now).run();
    await expect(db.prepare(`
      INSERT INTO pool_task_delivery_outbox (
        outbox_id, task_key, event_type, status, created_at
      ) VALUES ('invalid-event-001', ?, 'pool.task.ready.invalid', 'pending', ?)
    `).bind(taskKey, now).run()).rejects.toThrow();
  });
});
