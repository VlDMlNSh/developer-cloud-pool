import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { admitQualifiedTask as admitQualifiedTaskWithClock } from "../src/admit-qualified-task.mjs";

const NOW = 1_800_000_000;
const trustedClock = () => NOW;
const admitQualifiedTask = (db, value, clock = trustedClock) => admitQualifiedTaskWithClock(db, value, clock);
const input = {
  admissionId: "admission-001",
  taskKey: "57f7bbc19f483c2cb754a96ae71ca4d248d7ec455f6393086ba9da304c312ee5",
  now: NOW,
  executorId: "executor-alpha",
  approval: {
    approvalId: "approval-atomic-001", ownerNumericId: "10001",
    repositoryId: "20002", issueNumber: 42, targetSha: "b".repeat(40),
    profile: "jarvis-code-sandbox-v1", executorId: "executor-alpha", envelopeDigest: "c".repeat(64)
  },
  route: {
    schemaVersion: 1, qualificationId: "route-qualification-001", routeId: "local-ollama",
    providerId: "ollama", modelId: "qwen-local", issuerId: "local-authority",
    accountRef: "local-account-1", credentialHandleRef: "local-handle-1",
    quotaDomainId: null, costClass: "local", capabilityId: "pool.execute.local",
    capabilityProfile: "jarvis-code-sandbox-v1", evidenceRef: "local-evidence:qualification-001",
    evidenceDigest: "d".repeat(64), observedAt: NOW - 60, validUntil: NOW + 3600,
    revocationVersion: 0, registryVersion: "registry-v1"
  },
  attempt: {
    attemptId: "attempt-atomic-001", inputDigest: "e".repeat(64),
    executionIdempotencyKey: "idem-atomic-001"
  }
};

async function seed(overrides = {}) {
  const a = { ...input.approval, ...overrides.approval };
  const r = { ...input.route, ...overrides.route };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state, executor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)
  `).bind(a.approvalId, a.ownerNumericId, a.repositoryId, a.issueNumber,
    a.targetSha, a.profile, a.envelopeDigest, NOW + 3600, a.executorId).run();
  await env.POOL_DB.prepare(`
    INSERT INTO pool_route_qualifications (
      schema_version, qualification_id, route_id, provider_id, model_id, issuer_id, account_ref,
      credential_handle_ref, quota_domain_id, cost_class, capability_id,
      capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
      revocation_version, registry_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r.schemaVersion, r.qualificationId, r.routeId, r.providerId, r.modelId, r.issuerId,
    r.accountRef, r.credentialHandleRef, r.quotaDomainId, r.costClass, r.capabilityId,
    r.capabilityProfile, r.evidenceRef, r.evidenceDigest, r.observedAt, r.validUntil,
    r.revocationVersion, r.registryVersion).run();
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
    "pool_attempt_projection_comment_events_no_delete",
    "pool_task_claims_legacy_insert_block",
    "pool_task_claims_legacy_update_block",
    "pool_task_claims_legacy_delete_block",
    "pool_task_outbox_legacy_insert_block",
    "pool_task_outbox_legacy_update_block",
    "pool_task_outbox_legacy_delete_block"
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
    ["pool_attempt_projection_comment_events_no_delete", "BEFORE DELETE ON pool_attempt_projection_comment_events"],
    ["pool_task_claims_legacy_insert_block", "BEFORE INSERT ON pool_task_claims"],
    ["pool_task_claims_legacy_update_block", "BEFORE UPDATE ON pool_task_claims"],
    ["pool_task_claims_legacy_delete_block", "BEFORE DELETE ON pool_task_claims"],
    ["pool_task_outbox_legacy_insert_block", "BEFORE INSERT ON pool_task_outbox"],
    ["pool_task_outbox_legacy_update_block", "BEFORE UPDATE ON pool_task_outbox"],
    ["pool_task_outbox_legacy_delete_block", "BEFORE DELETE ON pool_task_outbox"]
  ];
  for (const [name, clause] of guards) {
    const message = name.includes('_legacy_') ? 'LEGACY_CLAIM_PATH_DISABLED' : name.toUpperCase();
    await env.POOL_DB.prepare(`CREATE TRIGGER ${name} ${clause} BEGIN SELECT RAISE(ABORT, '${message}'); END`).run();
  }
  await seed();
});

describe("atomic qualified A0 -> D1 admission", () => {
  it("commits approval, existing task/outbox, evidence receipt and immutable attempt as one unit", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED", admissionId: input.admissionId,
      taskKey: input.taskKey, attemptId: input.attempt.attemptId, dispatch: false, executionAuthorized: false
    });
    const rows = await env.POOL_DB.prepare(`
      SELECT l.state, l.admission_id, t.task_key, t.current_attempt_id, t.attempt_number,
             o.status AS outbox_status, o.event_type AS outbox_event_type,
             o.admission_id AS outbox_admission_id, o.attempt_id AS outbox_attempt_id,
             o.evidence_digest AS outbox_evidence_digest,
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
      task_key: input.taskKey, current_attempt_id: input.attempt.attemptId, attempt_number: 1,
      outbox_status: "pending", outbox_event_type: "pool.task.ready",
      outbox_admission_id: input.admissionId, outbox_attempt_id: input.attempt.attemptId,
      outbox_evidence_digest: input.route.evidenceDigest,
      evidence_digest: input.route.evidenceDigest, dispatch_enabled: 0,
      attempt_status: "prepared", assertion: 1, receipt_dispatch: 0
    });
  });

  it("rejects replay but returns the same durable receipt for an exact retry", async () => {
    const first = await admitQualifiedTask(env.POOL_DB, input);
    const replay = await admitQualifiedTask(env.POOL_DB, input);
    const changedAccountReplay = await admitQualifiedTask(env.POOL_DB, { ...input, route: { ...input.route, accountRef: "other-account" } });
    const changedOwnerReplay = await admitQualifiedTask(env.POOL_DB, { ...input, approval: { ...input.approval, ownerNumericId: "99999" } });
    const changedValidityReplay = await admitQualifiedTask(env.POOL_DB, { ...input, route: { ...input.route, validUntil: input.route.validUntil + 1 } });
    expect(changedAccountReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false, executionAuthorized: false });
    expect(changedOwnerReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false, executionAuthorized: false });
    expect(changedValidityReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false, executionAuthorized: false });
    expect(first.decision).toBe("ADMITTED_QUEUED");
    expect(replay).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED",
      admissionId: input.admissionId, dispatch: false, executionAuthorized: false
    });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first())
      .toMatchObject({ n: 1 });
  });

  it("denies replay when the durable commit receipt is missing", async () => {
    const first = await admitQualifiedTask(env.POOL_DB, input);
    expect(first.decision).toBe("ADMITTED_QUEUED");
    await env.POOL_DB.prepare("DROP TRIGGER pool_admission_receipts_no_delete").run();
    await env.POOL_DB.prepare("DELETE FROM pool_admission_commit_receipts WHERE admission_id = ?")
      .bind(input.admissionId).run();
    const replay = await admitQualifiedTask(env.POOL_DB, input);
    expect(replay).toMatchObject({
      decision: "DENY", reason: "ADMISSION_COMMIT_RECEIPT_MISMATCH", dispatch: false, executionAuthorized: false
    });
  });

  it("denies replay when receipt identity fields do not match admission", async () => {
    const first = await admitQualifiedTask(env.POOL_DB, input);
    expect(first.decision).toBe("ADMITTED_QUEUED");
    await env.POOL_DB.prepare("DROP TRIGGER pool_admission_receipts_no_delete").run();
    await env.POOL_DB.prepare("DELETE FROM pool_admission_commit_receipts WHERE admission_id = ?")
      .bind(input.admissionId).run();
    await expect(env.POOL_DB.prepare(`
      INSERT INTO pool_admission_commit_receipts (
        admission_id, approval_id, task_key, executor_id, attempt_id, qualification_id,
        evidence_digest, committed_at, assertion, dispatch_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `).bind(
      input.admissionId, input.approval.approvalId, input.taskKey, input.executorId,
      "forged-attempt-identity", input.route.qualificationId, "f".repeat(64), NOW
    ).run()).rejects.toThrow();
    const replay = await admitQualifiedTask(env.POOL_DB, input);
    expect(replay).toMatchObject({
      decision: "DENY", reason: "ADMISSION_COMMIT_RECEIPT_MISMATCH", dispatch: false, executionAuthorized: false
    });
  });

  it("rejects revoked route evidence before consuming approval", async () => {
    await env.POOL_DB.prepare(`
      UPDATE pool_route_qualifications
         SET qualification_status = 'revoked', revoked_at = ?, revocation_version = revocation_version + 1
       WHERE qualification_id = ?
    `).bind(NOW - 1, input.route.qualificationId).run();
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({ decision: "DENY", reason: "ADMISSION_OUTCOME_UNCONFIRMED", dispatch: false, executionAuthorized: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });

  it("resolves a lost batch acknowledgement from a primary readback without creating a second attempt", async () => {
    const ambiguousDb = {
      prepare: (...args) => env.POOL_DB.prepare(...args),
      withSession: (...args) => env.POOL_DB.withSession(...args),
      batch: async statements => {
        await env.POOL_DB.batch(statements);
        throw new Error("synthetic lost batch acknowledgement after commit");
      }
    };
    const result = await admitQualifiedTask(ambiguousDb, input);
    expect(result).toMatchObject({ decision: "ADMISSION_ALREADY_COMMITTED", admissionId: input.admissionId,
      attemptId: input.attempt.attemptId, dispatch: false, executionAuthorized: false, reason: "AMBIGUOUS_BATCH_RESOLVED_BY_PRIMARY_READBACK" });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first()).toMatchObject({ n: 1 });
  });

  it("keeps an unacknowledged non-committed batch unresolved and permits only the same-key retry", async () => {
    const noCommitDb = {
      prepare: (...args) => env.POOL_DB.prepare(...args),
      withSession: (...args) => env.POOL_DB.withSession(...args),
      batch: async () => { throw new Error("synthetic failure before commit"); }
    };
    const uncertain = await admitQualifiedTask(noCommitDb, input);
    expect(uncertain).toMatchObject({ decision: "DENY", reason: "ADMISSION_OUTCOME_UNCONFIRMED", dispatch: false, executionAuthorized: false });
    expect(await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first()).toMatchObject({ state: "ready" });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first()).toMatchObject({ n: 0 });
    expect(await admitQualifiedTask(env.POOL_DB, input)).toMatchObject({ decision: "ADMITTED_QUEUED", dispatch: false, executionAuthorized: false });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first()).toMatchObject({ n: 1 });
  });

  it("fails closed when primary readback is unavailable after an ambiguous batch", async () => {
    let sessions = 0;
    const lostReadbackDb = {
      prepare: (...args) => env.POOL_DB.prepare(...args),
      withSession: (...args) => {
        sessions += 1;
        if (sessions > 1) throw new Error("synthetic primary readback unavailable");
        return env.POOL_DB.withSession(...args);
      },
      batch: async statements => {
        await env.POOL_DB.batch(statements);
        throw new Error("synthetic lost batch acknowledgement");
      }
    };
    expect(await admitQualifiedTask(lostReadbackDb, input)).toMatchObject({
      decision: "DENY", reason: "ADMISSION_OUTCOME_UNCONFIRMED", dispatch: false, executionAuthorized: false
    });
    expect(await admitQualifiedTask(env.POOL_DB, input)).toMatchObject({ decision: "ADMISSION_ALREADY_COMMITTED", dispatch: false, executionAuthorized: false });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first()).toMatchObject({ n: 1 });
  });

  it("rolls back approval, task, outbox and admission if immutable attempt insertion fails", async () => {
    await env.POOL_DB.prepare(`
      CREATE TRIGGER test_abort_atomic_attempt
      BEFORE INSERT ON pool_attempts
      WHEN NEW.attempt_id = 'attempt-atomic-001'
      BEGIN SELECT RAISE(ABORT, 'synthetic attempt insert failure'); END
    `).run();
    const result = await admitQualifiedTask(env.POOL_DB, input);
    expect(result).toMatchObject({ decision: "DENY", dispatch: false, executionAuthorized: false });
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
    expect(result).toMatchObject({ decision: "DENY", dispatch: false, executionAuthorized: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });


  it("rejects stale route evidence before consuming approval", async () => {
    const staleApproval = { ...input.approval, approvalId: "approval-stale-001" };
    const staleRoute = { ...input.route, qualificationId: "route-stale-001", observedAt: NOW - 301 };
    await seed({ approval: staleApproval, route: staleRoute });
    const staleInput = {
      ...input, admissionId: "admission-stale-001", approval: staleApproval, route: staleRoute
    };
    const result = await admitQualifiedTask(env.POOL_DB, staleInput);
    expect(result).toMatchObject({ decision: "DENY", dispatch: false, executionAuthorized: false });
    const ledger = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(staleApproval.approvalId).first();
    expect(ledger.state).toBe("ready");
  });

  it("rejects executor substitution before consuming approval", async () => {
    const altered = { ...input, executorId: "executor-beta" };
    const result = await admitQualifiedTask(env.POOL_DB, altered);
    expect(result).toMatchObject({ decision: "DENY", reason: "INVALID_ADMISSION_BINDING", dispatch: false, executionAuthorized: false });
    const row = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?")
      .bind(input.approval.approvalId).first();
    expect(row.state).toBe("ready");
  });

  it("rejects a mismatched capability profile before consuming approval", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, { ...input, route: { ...input.route, capabilityProfile: "other-profile" } });
    expect(result).toMatchObject({ decision: "DENY", reason: "INVALID_ADMISSION_BINDING", dispatch: false, executionAuthorized: false });
    const row = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?").bind(input.approval.approvalId).first();
    expect(row.state).toBe("ready");
  });

  it("prevents mutation of consumed approval authorization identity", async () => {
    await admitQualifiedTask(env.POOL_DB, input);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_approval_ledger SET owner_numeric_id = '99999' WHERE approval_id = ?"
    ).bind(input.approval.approvalId).run()).rejects.toThrow();
    const row = await env.POOL_DB.prepare(
      "SELECT owner_numeric_id, state, task_key, admission_id FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approval.approvalId).first();
    expect(row).toMatchObject({
      owner_numeric_id: input.approval.ownerNumericId,
      state: "consumed", task_key: input.taskKey, admission_id: input.admissionId
    });
  });

  it("does not allow late admission binding after legacy task consumption", async () => {
    await env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?
       WHERE approval_id = ?
    `).bind(NOW, input.taskKey, input.approval.approvalId).run();
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger SET admission_id = ?
       WHERE approval_id = ?
    `).bind(input.admissionId, input.approval.approvalId).run()).rejects.toThrow();
    const row = await env.POOL_DB.prepare(
      "SELECT state, admission_id FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approval.approvalId).first();
    expect(row).toMatchObject({ state: "consumed", admission_id: null });
  });

  it("rejects direct SQL admission against revoked route evidence", async () => {
    await env.POOL_DB.prepare(`
      UPDATE pool_route_qualifications
         SET qualification_status = 'revoked', revoked_at = ?, revocation_version = revocation_version + 1
       WHERE qualification_id = ?
    `).bind(NOW - 1, input.route.qualificationId).run();
    await env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?, admission_id = ?
       WHERE approval_id = ?
    `).bind(NOW, input.taskKey, input.admissionId, input.approval.approvalId).run();
    await expect(env.POOL_DB.prepare(`
      INSERT INTO pool_admissions (
        admission_id, approval_id, task_key, executor_id, attempt_id, attempt_number,
        qualification_id, evidence_digest, admitted_at, dispatch_enabled
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 0)
    `).bind(input.admissionId, input.approval.approvalId, input.taskKey,
      input.executorId, input.attempt.attemptId, input.route.qualificationId,
      input.route.evidenceDigest, NOW).run()).rejects.toThrow();
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first())
      .toMatchObject({ n: 0 });
  });

  it("prevents mutation of an already-bound task outbox identity", async () => {
    await admitQualifiedTask(env.POOL_DB, input);
    await expect(env.POOL_DB.prepare("UPDATE pool_task_delivery_outbox SET evidence_digest = ? WHERE task_key = ?")
      .bind("f".repeat(64), input.taskKey).run()).rejects.toThrow();
    const row = await env.POOL_DB.prepare("SELECT admission_id, attempt_id, evidence_digest FROM pool_task_delivery_outbox WHERE task_key = ?")
      .bind(input.taskKey).first();
    expect(row).toMatchObject({ admission_id: input.admissionId, attempt_id: input.attempt.attemptId, evidence_digest: input.route.evidenceDigest });
  });
  it("allows only one concurrent admission for one single-use approval", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => admitQualifiedTask(env.POOL_DB, input)));
    expect(results.filter(x => x.decision === "ADMITTED_QUEUED")).toHaveLength(1);
    expect(results.every(x => ["ADMITTED_QUEUED", "ADMISSION_ALREADY_COMMITTED", "DENY"].includes(x.decision))).toBe(true);
    const approvals = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first();
    const attempts = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_attempts").first();
    expect(approvals.n).toBe(1);
    expect(attempts.n).toBe(1);
    expect(results.every(x => x.dispatch === false && x.executionAuthorized === false)).toBe(true);
  });

  it("ignores a caller-supplied future timestamp and uses trusted time", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, { ...input, now: NOW + 86_400 });
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED", dispatch: false, executionAuthorized: false
    });
  });

  it("ignores a caller-supplied past timestamp and uses trusted time", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, { ...input, now: NOW - 86_400 });
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED", dispatch: false, executionAuthorized: false
    });
  });

  it("fails closed when trusted time predates the route evidence", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, input, () => NOW - 301);
    expect(result).toMatchObject({
      decision: "DENY", dispatch: false, executionAuthorized: false
    });
    const approval = await env.POOL_DB.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approval.approvalId).first();
    expect(approval.state).toBe("ready");
  });

  it("fails closed when the trusted clock returns an invalid value", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, input, () => Number.NaN);
    expect(result).toMatchObject({
      decision: "DENY", reason: "TRUSTED_CLOCK_INVALID",
      dispatch: false, executionAuthorized: false
    });
  });

  it("fails closed when the trusted clock throws", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, input, () => { throw new Error("clock unavailable"); });
    expect(result).toMatchObject({
      decision: "DENY", reason: "TRUSTED_CLOCK_UNAVAILABLE",
      dispatch: false, executionAuthorized: false
    });
  });

  it("fails closed when no trusted clock is supplied", async () => {
    const result = await admitQualifiedTaskWithClock(env.POOL_DB, input);
    expect(result).toMatchObject({
      decision: "DENY", reason: "TRUSTED_CLOCK_UNAVAILABLE",
      dispatch: false, executionAuthorized: false
    });
  });

});
