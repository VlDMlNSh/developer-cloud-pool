import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { admitQualifiedTask } from "../src/admit-qualified-task.mjs";

let NOW = 1_800_000_000;
let registryReadyForTest = false;
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
    capabilityProfile: "dsh-headless-probe", evidenceRef: "local-evidence:qualification-001",
    evidenceDigest: "d".repeat(64), observedAt: NOW - 60, validUntil: NOW + 3600,
    revocationVersion: 0, registryVersion: "registry-v1",
    keyId: "issuer-key-001", registryEpoch: 2001, registryBundleDigest: "f".repeat(64)
  },
  attempt: {
    attemptId: "attempt-atomic-001", inputDigest: "e".repeat(64),
    executionIdempotencyKey: "idem-atomic-001"
  }
};

async function ensureRegistry() {
  if (registryReadyForTest) return;
  const db = env.POOL_DB;
  const state = await db.prepare(
    "SELECT current_epoch, updated_at FROM pool_route_registry_state WHERE state_id = 1"
  ).first();
  const maxRow = await db.prepare(
    "SELECT COALESCE(MAX(registry_epoch), 0) AS max_epoch FROM pool_route_registry_snapshots"
  ).first();
  const epoch = Number(maxRow.max_epoch) + 1;
  NOW = Math.max(NOW, Number(state?.updated_at || 0) + 10);
  const digest = epoch.toString(16).padStart(64, "0");
  const acceptedAt = NOW - 5;

  await db.prepare(`
    INSERT INTO pool_route_registry_snapshots (
      registry_epoch, registry_version, root_key_id, bundle_digest,
      issued_at, valid_until, accepted_at, issuer_key_count, route_count,
      bundle_json, root_signature
    ) VALUES (?, 'registry-v1', 'test-root', ?, ?, ?, ?, 1, 1, '{}', 'synthetic-test-only')
  `).bind(epoch, digest, NOW - 60, NOW + 3600, acceptedAt).run();
  await db.prepare(`
    INSERT INTO pool_route_registry_issuer_keys (
      registry_epoch, bundle_digest, issuer_id, key_id, registry_version,
      status, revoked_at, valid_from, valid_until, public_key_jwk
    ) VALUES (?, ?, 'local-authority', 'issuer-key-001', 'registry-v1',
      'active', NULL, ?, ?, ?)
  `).bind(epoch, digest, NOW - 100, NOW + 3600,
    JSON.stringify({ kty: "EC", crv: "P-256", x: "A".repeat(43), y: "B".repeat(43) })).run();
  if (state) {
    await db.prepare(`
      UPDATE pool_route_registry_state
         SET current_epoch = ?, current_bundle_digest = ?,
             current_registry_version = 'registry-v1', updated_at = ?
       WHERE state_id = 1
    `).bind(epoch, digest, acceptedAt).run();
  } else {
    await db.prepare(`
      INSERT INTO pool_route_registry_state (
        state_id, current_epoch, current_bundle_digest, current_registry_version, updated_at
      ) VALUES (1, ?, ?, 'registry-v1', ?)
    `).bind(epoch, digest, acceptedAt).run();
  }

  input.now = NOW;
  input.route.observedAt = NOW - 60;
  input.route.validUntil = NOW + 3600;
  input.route.registryEpoch = epoch;
  input.route.registryBundleDigest = digest;
  registryReadyForTest = true;
}

async function seed(overrides = {}) {
  await ensureRegistry();
  const a = { ...input.approval, ...overrides.approval };
  const r = { ...input.route, ...overrides.route };
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
      capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
      revocation_version, registry_version, issuer_key_id, registry_epoch, registry_bundle_digest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(r.schemaVersion, r.qualificationId, r.routeId, r.providerId, r.modelId, r.issuerId,
    r.accountRef, r.credentialHandleRef, r.quotaDomainId, r.costClass, r.capabilityId,
    r.capabilityProfile, r.evidenceRef, r.evidenceDigest, r.observedAt, r.validUntil,
    r.revocationVersion, r.registryVersion, r.keyId, r.registryEpoch, r.registryBundleDigest).run();
}

beforeEach(async () => {
  registryReadyForTest = false;
  // Append-only guards are disabled only around fixture teardown, then restored
  // before the test body. Production migration guards remain enabled in tests.
  for (const name of [
    "test_abort_atomic_attempt", "pool_admissions_no_update", "pool_admissions_no_delete",
    "pool_admission_receipts_no_update", "pool_admission_receipts_no_delete",
    "pool_admission_registry_assertions_no_delete",
    "pool_route_qualification_no_delete", "pool_attempt_events_no_update",
    "pool_attempt_events_no_delete", "pool_attempt_projection_events_no_update",
    "pool_attempt_projection_events_no_delete", "pool_attempt_projection_comment_events_no_update",
    "pool_attempt_projection_comment_events_no_delete"
  ]) await env.POOL_DB.prepare(`DROP TRIGGER IF EXISTS ${name}`).run();

  await env.POOL_DB.prepare("DELETE FROM pool_admission_commit_receipts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_admission_registry_assertions").run();
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
    ["pool_admission_registry_assertions_no_delete", "BEFORE DELETE ON pool_admission_registry_assertions"],
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
    expect(changedAccountReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false });
    expect(changedOwnerReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false });
    expect(changedValidityReplay).toMatchObject({ decision: "DENY", reason: "ADMISSION_IDENTITY_CONFLICT", dispatch: false });
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
    const staleRoute = { ...input.route, qualificationId: "route-stale-001", observedAt: NOW - 301 };
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

  it("rejects a mismatched capability profile before consuming approval", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, { ...input, route: { ...input.route, capabilityProfile: "other-profile" } });
    expect(result).toMatchObject({ decision: "DENY", reason: "INVALID_ADMISSION_BINDING", dispatch: false });
    const row = await env.POOL_DB.prepare("SELECT state FROM pool_approval_ledger WHERE approval_id = ?").bind(input.approval.approvalId).first();
    expect(row.state).toBe("ready");
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
    expect(results.every(x => x.dispatch === false)).toBe(true);
  });
  it("rejects an admission whose route registry epoch is not the active snapshot", async () => {
    const result = await admitQualifiedTask(env.POOL_DB, {
      ...input, route: { ...input.route, registryEpoch: 2000 }
    });
    expect(result).toMatchObject({
      decision: "DENY", reason: "ADMISSION_TRANSACTION_ROLLED_BACK_OR_AMBIGUOUS",
      dispatch: false
    });
    const row = await env.POOL_DB.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approval.approvalId).first();
    expect(row.state).toBe("ready");
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admissions").first())
      .toMatchObject({ n: 0 });
  });

  it("rejects a route whose issuer key is revoked in the active root-signed registry snapshot", async () => {
    const db = env.POOL_DB;
    const digest = "e".repeat(64);
    const current = await db.prepare(
      "SELECT current_epoch, updated_at FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    const epoch = Number(current.current_epoch) + 1;
    const acceptedAt = NOW - 1;
    await db.prepare(`
      INSERT INTO pool_route_registry_snapshots (
        registry_epoch, registry_version, root_key_id, bundle_digest,
        issued_at, valid_until, accepted_at, issuer_key_count, route_count,
        bundle_json, root_signature
      ) VALUES (?, 'registry-v2', 'test-root', ?, ?, ?, ?, 1, 1, '{}', 'synthetic-test-only')
    `).bind(epoch, digest, NOW - 20, NOW + 300, acceptedAt).run();
    await db.prepare(`
      INSERT INTO pool_route_registry_issuer_keys (
        registry_epoch, bundle_digest, issuer_id, key_id, registry_version,
        status, revoked_at, valid_from, valid_until, public_key_jwk
      ) VALUES (?, ?, 'local-authority', 'issuer-key-001', 'registry-v2',
        'revoked', ?, ?, ?, ?)
    `).bind(epoch, digest, NOW - 10, NOW - 100, NOW + 1000,
      JSON.stringify({ kty: "EC", crv: "P-256", x: "A".repeat(43), y: "B".repeat(43) })).run();
    await db.prepare(`
      UPDATE pool_route_registry_state
         SET current_epoch = ?, current_bundle_digest = ?,
             current_registry_version = 'registry-v2', updated_at = ?
       WHERE state_id = 1
    `).bind(epoch, digest, acceptedAt).run();

    const approval = { ...input.approval, approvalId: "approval-revoked-key-001" };
    const route = {
      ...input.route, qualificationId: "route-revoked-key-001",
      registryVersion: "registry-v2", registryEpoch: epoch,
      registryBundleDigest: digest
    };
    const attempt = { ...input.attempt, attemptId: "attempt-revoked-key-001" };
    await seed({ approval, route });
    const result = await admitQualifiedTask(env.POOL_DB, {
      ...input, admissionId: "admission-revoked-key-001", approval, route, attempt
    });
    expect(result).toMatchObject({
      decision: "DENY", reason: "ADMISSION_TRANSACTION_ROLLED_BACK_OR_AMBIGUOUS",
      dispatch: false
    });
    const row = await db.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();
    expect(row.state).toBe("ready");
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_admissions WHERE admission_id = 'admission-revoked-key-001'"
    ).first()).toMatchObject({ n: 0 });
  });


  it("rejects an epoch advance interleaved after admission preflight and before its D1 batch", async () => {
    const db = env.POOL_DB;
    const current = await db.prepare(
      "SELECT current_epoch FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    const maximum = await db.prepare(
      "SELECT COALESCE(MAX(registry_epoch), 0) AS max_epoch FROM pool_route_registry_snapshots"
    ).first();
    const nextEpoch = Number(maximum.max_epoch) + 1;
    const nextDigest = "a".repeat(64);
    const acceptedAt = NOW - 1;

    const advanceRegistry = async () => db.batch([
      db.prepare(`
        INSERT INTO pool_route_registry_snapshots (
          registry_epoch, registry_version, root_key_id, bundle_digest,
          issued_at, valid_until, accepted_at, issuer_key_count, route_count,
          bundle_json, root_signature
        ) VALUES (?, 'registry-v2', 'test-root', ?, ?, ?, ?, 1, 1, '{}', 'synthetic-test-only')
      `).bind(nextEpoch, nextDigest, NOW - 20, NOW + 3600, acceptedAt),
      db.prepare(`
        INSERT INTO pool_route_registry_issuer_keys (
          registry_epoch, bundle_digest, issuer_id, key_id, registry_version,
          status, revoked_at, valid_from, valid_until, public_key_jwk
        ) VALUES (?, ?, 'local-authority', 'issuer-key-002', 'registry-v2',
          'active', NULL, ?, ?, ?)
      `).bind(nextEpoch, nextDigest, NOW - 100, NOW + 3600,
        JSON.stringify({ kty: "EC", crv: "P-256", x: "C".repeat(43), y: "D".repeat(43) })),
      db.prepare(`
        UPDATE pool_route_registry_state
           SET current_epoch = ?, current_bundle_digest = ?,
               current_registry_version = 'registry-v2', updated_at = ?
         WHERE state_id = 1 AND current_epoch = ?
      `).bind(nextEpoch, nextDigest, acceptedAt, current.current_epoch)
    ]);

    // Force the TOCTOU interleaving at the storage boundary: the admission's
    // preflight read has completed, but its atomic assertion/consume batch has
    // not started. The new registry pointer must make the old route fail closed.
    const interleavedDb = {
      prepare: (...args) => db.prepare(...args),
      batch: async (statements) => {
        await advanceRegistry();
        return db.batch(statements);
      }
    };
    const admission = await admitQualifiedTask(interleavedDb, input);

    const pointer = await db.prepare(
      "SELECT current_epoch, current_bundle_digest FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    expect(pointer).toMatchObject({
      current_epoch: nextEpoch,
      current_bundle_digest: nextDigest
    });
    expect(admission).toMatchObject({
      decision: "DENY",
      reason: "ADMISSION_TRANSACTION_ROLLED_BACK_OR_AMBIGUOUS",
      dispatch: false
    });

    const ledger = await db.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approval.approvalId).first();
    expect(ledger.state).toBe("ready");
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_admissions WHERE admission_id = ?"
    ).bind(input.admissionId).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_admission_registry_assertions WHERE admission_id = ?"
    ).bind(input.admissionId).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_admission_commit_receipts WHERE admission_id = ?"
    ).bind(input.admissionId).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_attempts WHERE attempt_id = ?"
    ).bind(input.attempt.attemptId).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_tasks WHERE task_key = ?"
    ).bind(input.taskKey).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_delivery_outbox WHERE task_key = ?"
    ).bind(input.taskKey).first()).toMatchObject({ n: 0 });
  });

});
