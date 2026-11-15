import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { admitQualifiedTask } from "../src/admit-qualified-task.mjs";

const NOW = 1_800_000_000;
const input = {
  admissionId: "admission-001",
  taskKey: "16eb82ba2f090f2f56d5ca3e63c0c86d4622ba2443cee60bbfec5ab42d13cd99",
  now: NOW,
  approval: {
    approvalId: "approval-atomic-001", ownerNumericId: "10001",
    repositoryId: "20002", issueNumber: 42, targetSha: "b".repeat(40),
    profile: "dsh-headless-probe", envelopeDigest: "c".repeat(64)
  },
  route: {
    schemaVersion: 1, qualificationId: "route-qualification-001", routeId: "local-ollama",
    providerId: "ollama", modelId: "qwen-local", issuerId: "local-authority",
    accountRef: "local-account-1", credentialHandleRef: "local-handle-1",
    quotaDomainId: null, costClass: "local", capabilityId: "pool.execute.local",
    evidenceRef: "local-evidence:qualification-001", evidenceDigest: "d".repeat(64),
    observedAt: NOW - 60, revocationVersion: 1, registryVersion: "registry-v1"
  },
  attempt: {
    attemptId: "attempt-atomic-001", inputDigest: "e".repeat(64),
    executionIdempotencyKey: "idem-atomic-001"
  }
};

async function seed(overrides = {}) {
  const a = { ...input.approval, ...overrides.approval };
  const r = { ...input.route, issuedAt: NOW - 60, ...overrides.route };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')
  `).bind(a.approvalId, a.ownerNumericId, a.repositoryId, a.issueNumber,
    a.targetSha, a.profile, a.envelopeDigest, NOW + 3600).run();
  await env.POOL_DB.prepare(`
    INSERT INTO pool_route_qualifications (
      schema_version, qualification_id, route_id, provider_id, model_id, issuer_id, account_ref,
      credential_handle_ref, quota_domain_id, cost_class, capability_id,
      evidence_ref, evidence_digest, observed_at, issued_at, expires_at, revocation_version, registry_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r.schemaVersion, r.qualificationId, r.routeId, r.providerId, r.modelId, r.issuerId,
    r.accountRef, r.credentialHandleRef, r.quotaDomainId, r.costClass,
    r.capabilityId, r.evidenceRef, r.evidenceDigest, r.observedAt ?? NOW - 60,
    r.issuedAt ?? NOW - 60, NOW + 3600, r.revocationVersion, r.registryVersion).run();
}

beforeEach(async () => {
  // Append-only guards are disabled only around fixture teardown, then restored
  // before the test body. Production migration guards remain enabled in tests.
  for (const name of [
    "test_abort_atomic_attempt", "pool_admissions_no_update", "pool_admissions_no_delete",
    "pool_admission_receipts_no_update", "pool_admission_receipts_no_delete",
    "pool_route_qualification_no_delete", "pool_attempt_events_no_update",
    "pool_attempt_events_no_delete", "pool_attempt_projection_events_no_update",
    "pool_attempt_projection_events_no_delete", "pool_attempt_projection_comment_events_no_update",
    "pool_attempt_projection_comment_events_no_delete"
  ]) await env.POOL_DB.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();

  await env.POOL_DB.prepare("DELETE FROM pool_admission_commit_receipts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_admissions").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_comment_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_reconciliations").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_delivery_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_approvals").run();
  await env.POOL_DB.prepare("DELETE FROM pool_tasks").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await env.POOL_DB.prepare("DELETE FROM pool_route_qualifications").run();

  const guards = [
    ["pool_admissions_no_update", "BEFORE UPDATE ON pool_admissions"],
    ["pool_admissions_no_delete", "BEFORE DELETE ON pool_admissions"],
    ["pool_admission_receipts_no_update", "BEFORE UPDATE ON pool_admission_commit_receipts"],
    ["pool_admission_receipts_no_delete", "BEFORE DELETE ON pool_admission_commit_receipts"],
    ["pool_route_qualification_no_delete", "BEFORE DELETE ON pool_route_qualifications"],
    ["pool_attempt_events_no_update", "BEFORE UPDATE ON pool_attempt_events"],
    ["pool_attempt_events_no_delete", "BEFORE DELETE ON pool_attempt_events"],
    ["pool_attempt_projection_events_no_update", "BEFORE UPDATE ON pool_attempt_projection_events"],
    ["pool_attempt_projection_events_no_delete", "BEFORE DELETE ON pool_attempt_projection_events"],
    ["pool_attempt_projection_comment_events_no_update", "BEFORE UPDATE ON pool_attempt_projection_comment_events"],
    ["pool_attempt_projection_comment_events_no_delete", "BEFORE DELETE ON pool_attempt_projection_comment_events"]
  ];
  for (const [name, clause] of guards) {
    await env.POOL_DB.prepare(`CREATE TRIGGER ${name} ${clause} BEGIN SELECT RAISE(ABORT, '${name.toUpperCase()}'); END`).run();
  }
  await seed();
});

describe("atomic qualified A0 -> D1 admission", () => {
  it("commits approval, existing task/outbox, evidence receipt and immutable attempt as one unit", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED", admissionId: input.admissionId,
      taskKey: input.taskKey, attemptId: input.attempt.attemptId, dispatch: false
    });
    const rows = await env.POOL_DB.prepare(`
      SELECT l.state, l.admission_id, t.task_key, o.status AS outbox_status,
             a.evidence_digest, a.dispatch_enabled, p.status AS attempt_status,
             r.assertion, r.dispatch_enabled AS receipt_dispatch
        FROM pool_approval_ledger l
        JOIN pool_tasks t ON t.task_key = l.task_key
        JOIN pool_task_delivery_outbox o ON o.task_key = t.task_key
        JOIN pool_admissions a ON a.approval_id = l.approval_id
        JOIN pool_attempts p ON p.attempt_id = a.attempt_id
        JOIN pool_admission_commit_receipts r ON r.admission_id = a.admission_id
       WHERE l.approval_id = ?
    `).bind(input.approval.approvalId).first();
    expect(rows).toMatchObject({
      state: "consumed", admission_id: input.admissionId,
      task_key: input.taskKey, outbox_status: "pending",
      evidence_digest: input.route.evidenceDigest, dispatch_enabled: 0,
      attempt_status: "prepared", assertion: 1, receipt_dispatch: 0
    });
  });

  it("rejects replay but returns the same durable receipt for an exact retry", async () => {
    const first = await admitQualifiedTask(env.POOL_DB, input);
    const replay = await admitQualifiedTask(env.POOL_DB, input);
    const changedAccountReplay = await admitQualifiedTask(env.POOL_DB, { ...input, route: { ...input.route, accountRef: "other-account" } });
    const changedOwnerReplay = await admitQualifiedTask(env.POOL_DB, { ...input, approval: { ...input.approval, ownerNumericId: "99999" } });
    expect(changedAccountReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false });
    expect(changedOwnerReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false });
    expect(first.decision).toBe("ADMITTED_QUEUED");
    expect(replay).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED",
      admissionId: input.admissionId, dispatch: false
    });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first())
      .toMatchObject({ n: 1 });
  });

  it("rejects revoked route evidence before consuming approval", async () => {
    await env.POOL_DB.prepare(`
      UPDATE pool_route_qualifications
         SET qualification_status = 'revoked', revoked_at = ?, revocation_version = revocation_version + 1
       WHERE qualification_id = ?
    `).bind(NOW - 1, input.route.qualificationId).run();
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({ decision: "DENY", reason: "ADMISSION_TRANSACTION_ROLLED_BACK_OR_AMBIGUOUS", dispatch: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });

  it("rolls back approval, task, outbox and admission if immutable attempt insertion fails", async () => {
    await env.POOL_DB.prepare(`
      CREATE TRIGGER test_abort_atomic_attempt
      BEFORE INSERT ON pool_attempts
      WHEN NEW.attempt_id = 'attempt-atomic-001'
      BEGIN SELECT RAISE(ABORT, 'synthetic attempt insert failure'); END
    `).run();
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({ decision: "DENY", dispatch: false });
    const ledger = await env.POOL_DB.prepare("SELECT state, consumed_at, admission_id FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    const tasks = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_tasks").first();
    const admissions = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first();
    expect(ledger).toMatchObject({ state: "ready", consumed_at: null, admission_id: null });
    expect(tasks.n).toBe(0);
    expect(admissions.n).toBe(0);
  });

  it("rejects evidence digest or account binding substitution", async () => {
    const altered = { ...input, route: { ...input.route, accountRef: "other-account" } };
    const result = await admitQualifiedTask(env.POOL_DB, altered);
    expect(result).toMatchObject({ decision: "DENY", dispatch: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });


  it("rejects stale route evidence before consuming approval", async () => {
    const staleApproval = { ...input.approval, approvalId: "approval-stale-001" };
    const staleRoute = { ...input.route, qualificationId: "route-stale-001", observedAt: NOW - 301, issuedAt: NOW - 301 };
    await seed({ approval: staleApproval, route: staleRoute });
    const staleInput = {
      ...input, admissionId: "admission-stale-001", approval: staleApproval, route: staleRoute
    };
    const result = await admitQualifiedTask(env.POOL_DB, staleInput);
    expect(result).toMatchObject({ decision: "DENY", dispatch: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(staleApproval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });

  it("allows only one concurrent admission for one single-use approval", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => admitQualifiedTask(env.POOL_DB, input)));
    expect(results.filter(x => x.decision === "ADMITTED_QUEUED")).toHaveLength(1);
    expect(results.every(x => ["ADMITTED_QUEUED", "ADMISSION_ALREADY_COMMITTED", "DENY"].includes(x.decision))).toBe(true);
    const approvals = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first();
    const attempts = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first();
    expect(approvals.n).toBe(1);
    expect(attempts.n).toBe(1);
    expect(results.every(x => x.dispatch === false)).toBe(true);
  });
});
