import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { admitGitHubNextEvent, bindGitHubNextEvent } from "../src/github-next-event.mjs";
import { admitQualifiedTask } from "../src/admit-qualified-task.mjs";
import { canonicalTaskKey } from "../src/task-identity.mjs";

const NOW = 1_800_000_000;
const trustedClock = () => NOW;
const workflowRef = "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной";

async function fixture(id, commentIdOverride) {
  const targetSha = id.repeat(40);
  const context = {
    githubActions: "true", serverUrl: "https://github.com",
    eventName: "issue_comment", eventAction: "created",
    repository: "VlDMlNSh/developer-cloud-pool", repositoryId: "1445644538",
    ownerNumericId: "157891068", ownerLogin: "VlDMlNSh",
    actorId: "157891068", actorLogin: "VlDMlNSh",
    ref: "refs/heads/Основной", sha: targetSha, workflowRef, workflowSha: "f".repeat(40),
    runId: 500000 + id.charCodeAt(0), runAttempt: 1,
    issueNumber: 96, isPullRequest: false, commentId: commentIdOverride ?? (900000 + id.charCodeAt(0)),
    commentBody: "/next", commentUserId: "157891068",
    commentUserLogin: "VlDMlNSh", commentAuthorAssociation: "OWNER"
  };
  const bound = await bindGitHubNextEvent(context);
  expect(bound.decision).toBe("BOUND");
  const executorId = "executor-alpha";
  const approval = {
    approvalId: `approval-next-${id}`, ownerNumericId: "157891068",
    repositoryId: "1445644538", issueNumber: 96, targetSha,
    profile: "jarvis-code-sandbox-v1", executorId, envelopeDigest: bound.context.eventDigest
  };
  const route = {
    schemaVersion: 1, qualificationId: `route-next-${id}`, routeId: "local-ollama",
    providerId: "ollama", modelId: "qwen-local", issuerId: "local-authority",
    accountRef: "local-account-1", credentialHandleRef: "local-handle-1",
    quotaDomainId: null, costClass: "local", capabilityId: "pool.execute.local",
    capabilityProfile: "jarvis-code-sandbox-v1", evidenceRef: `local-evidence:next-${id}`,
    evidenceDigest: id.repeat(64), observedAt: NOW - 60, validUntil: NOW + 3600,
    revocationVersion: 0, registryVersion: "registry-v1"
  };
  const attempt = {
    attemptId: `attempt-next-${id}`, inputDigest: "e".repeat(64),
    executionIdempotencyKey: `idem-next-${id}`
  };
  const input = {
    admissionId: `admission-next-${id}`,
    taskKey: await canonicalTaskKey({
      repositoryId: approval.repositoryId, issueNumber: approval.issueNumber,
      targetSha, profile: approval.profile, executorId
    }),
    executorId, approval, route, attempt
  };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state, executor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)
  `).bind(approval.approvalId, approval.ownerNumericId, approval.repositoryId,
    approval.issueNumber, approval.targetSha, approval.profile, approval.envelopeDigest,
    NOW + 3600, executorId).run();
  await env.POOL_DB.prepare(`
    INSERT INTO pool_route_qualifications (
      schema_version, qualification_id, route_id, provider_id, model_id, issuer_id, account_ref,
      credential_handle_ref, quota_domain_id, cost_class, capability_id,
      capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
      revocation_version, registry_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(route.schemaVersion, route.qualificationId, route.routeId, route.providerId,
    route.modelId, route.issuerId, route.accountRef, route.credentialHandleRef,
    route.quotaDomainId, route.costClass, route.capabilityId, route.capabilityProfile,
    route.evidenceRef, route.evidenceDigest, route.observedAt, route.validUntil,
    route.revocationVersion, route.registryVersion).run();
  return { context, input, event: bound.context };
}

function faultDatabase({ insertMode, receiptReadMode } = {}) {
  let sessionNumber = 0;
  return {
    prepare(sql) {
      const statement = env.POOL_DB.prepare(sql);
      if (!sql.startsWith("INSERT INTO pool_source_comment_receipts")) return statement;
      return {
        bind(...values) {
          const bound = statement.bind(...values);
          return {
            async run() {
              if (insertMode === "before-commit") throw new Error("injected pre-commit failure");
              const result = await bound.run();
              if (insertMode === "commit-then-throw") throw new Error("injected lost acknowledgement");
              return result;
            }
          };
        }
      };
    },
    batch: (...args) => env.POOL_DB.batch(...args),
    withSession(consistency) {
      sessionNumber += 1;
      if (receiptReadMode === "unavailable-after-insert" && sessionNumber >= 4) {
        throw new Error("injected primary readback outage");
      }
      const session = env.POOL_DB.withSession(consistency);
      return {
        prepare(sql) {
          const statement = session.prepare(sql);
          if (!sql.includes("FROM pool_source_comment_receipts")) return statement;
          return {
            bind(...values) {
              const bound = statement.bind(...values);
              return {
                async first() {
                  const row = await bound.first();
                  if (receiptReadMode === "partial-after-insert" && sessionNumber >= 4 && row) {
                    return { ...row, run_attempt: null };
                  }
                  return row;
                }
              };
            }
          };
        }
      };
    }
  };
}


const sourceReceiptColumns = [
  "source_comment_id", "repository_id", "owner_numeric_id", "issue_number",
  "event_name", "event_action", "actor_numeric_id", "actor_login",
  "author_association", "body_digest", "ref", "target_sha", "workflow_ref",
  "workflow_sha", "run_id", "run_attempt", "profile", "event_digest",
  "admission_id", "recorded_at", "dispatch_enabled"
];

function sourceReceiptInsert(db, event, admissionId, overrides = {}) {
  const values = [
    event.sourceCommentId, event.repositoryId, event.ownerNumericId, event.issueNumber,
    event.eventName, event.eventAction, event.actorNumericId, event.actorLogin,
    event.authorAssociation, event.bodyDigest, event.ref, event.targetSha,
    event.workflowRef, event.workflowSha, event.runId, event.runAttempt,
    event.profile, event.eventDigest, admissionId, NOW, 0
  ];
  const bound = values.map((value, index) =>
    Object.hasOwn(overrides, sourceReceiptColumns[index]) ? overrides[sourceReceiptColumns[index]] : value
  );
  return db.prepare(`INSERT INTO pool_source_comment_receipts (${sourceReceiptColumns.join(", ")})
    VALUES (${sourceReceiptColumns.map(() => "?").join(", ")})`).bind(...bound).run();
}

async function receiptCount(sourceCommentId) {
  return env.POOL_DB.prepare(
    "SELECT COUNT(*) AS count FROM pool_source_comment_receipts WHERE source_comment_id = ?"
  ).bind(String(sourceCommentId)).first();
}

describe("GitHub /next admission and durable source-comment receipt — local D1", () => {
  it("writes a complete receipt and returns the same durable result on exact replay", async () => {
    const f = await fixture("a");
    const first = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    const replay = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(first).toMatchObject({
      decision: "ADMITTED_QUEUED", receiptDecision: "SOURCE_COMMENT_RECORDED",
      dispatch: false, executionAuthorized: false
    });
    expect(replay).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED", receiptDecision: "SOURCE_COMMENT_ALREADY_RECORDED",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS count FROM pool_attempts WHERE attempt_id = ?")
      .bind(f.input.attempt.attemptId).first()).toMatchObject({ count: 1 });
    const conflictingAdmission = await admitGitHubNextEvent(
      env.POOL_DB, { ...f.input, admissionId: "admission-next-conflict" }, f.context, trustedClock
    );
    expect(conflictingAdmission).toMatchObject({
      decision: "DENY", dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
  });

  it("denies a rerun whose run provenance conflicts with the immutable receipt", async () => {
    const f = await fixture("b");
    await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    const rerun = { ...f.context, runId: f.context.runId + 10, runAttempt: 2 };
    const result = await admitGitHubNextEvent(env.POOL_DB, f.input, rerun, trustedClock);
    expect(result).toMatchObject({
      decision: "DENY", reason: "SOURCE_COMMENT_IDENTITY_CONFLICT",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
  });

  it("recovers the same admission after a pre-commit receipt write failure without creating another attempt", async () => {
    const f = await fixture("c");
    const failed = await admitGitHubNextEvent(
      faultDatabase({ insertMode: "before-commit" }), f.input, f.context, trustedClock
    );
    expect(failed).toMatchObject({
      decision: "DENY", reason: "SOURCE_COMMENT_OUTCOME_UNCONFIRMED",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 0 });
    const recovered = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(recovered).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED", receiptDecision: "SOURCE_COMMENT_RECORDED",
      dispatch: false, executionAuthorized: false
    });
    expect(await env.POOL_DB.prepare("SELECT COUNT(*) AS count FROM pool_attempts WHERE attempt_id = ?")
      .bind(f.input.attempt.attemptId).first()).toMatchObject({ count: 1 });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
  });

  it("reconciles a receipt commit whose acknowledgement is lost", async () => {
    const f = await fixture("d");
    const result = await admitGitHubNextEvent(
      faultDatabase({ insertMode: "commit-then-throw" }), f.input, f.context, trustedClock
    );
    expect(result).toMatchObject({
      decision: "ADMITTED_QUEUED", receiptDecision: "SOURCE_COMMENT_ALREADY_RECORDED",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
  });

  it("fails closed on a partial receipt readback and recovers only after a complete read", async () => {
    const f = await fixture("e");
    const partial = await admitGitHubNextEvent(
      faultDatabase({ receiptReadMode: "partial-after-insert" }), f.input, f.context, trustedClock
    );
    expect(partial).toMatchObject({
      decision: "DENY", reason: "SOURCE_COMMENT_READBACK_MISMATCH",
      dispatch: false, executionAuthorized: false
    });
    const recovered = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(recovered).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED", receiptDecision: "SOURCE_COMMENT_ALREADY_RECORDED",
      dispatch: false, executionAuthorized: false
    });
  });

  it("returns UNCONFIRMED when primary readback is unavailable after a committed receipt", async () => {
    const f = await fixture("f");
    const result = await admitGitHubNextEvent(
      faultDatabase({ receiptReadMode: "unavailable-after-insert" }), f.input, f.context, trustedClock
    );
    expect(result).toMatchObject({
      decision: "DENY", reason: "SOURCE_COMMENT_OUTCOME_UNCONFIRMED",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
    const recovered = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(recovered).toMatchObject({
      decision: "ADMISSION_ALREADY_COMMITTED", receiptDecision: "SOURCE_COMMENT_ALREADY_RECORDED",
      dispatch: false, executionAuthorized: false
    });
  });

  it("denies replay when the canonical task-ready outbox tuple is incomplete", async () => {
    const f = await fixture("9");
    const admitted = await admitQualifiedTask(env.POOL_DB, f.input, trustedClock);
    expect(admitted.decision).toBe("ADMITTED_QUEUED");
    await env.POOL_DB.prepare("DELETE FROM pool_task_delivery_outbox WHERE task_key = ?")
      .bind(f.input.taskKey).run();
    const result = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(result).toMatchObject({
      decision: "DENY", reason: "ADMISSION_COMMIT_RECEIPT_MISMATCH",
      dispatch: false, executionAuthorized: false
    });
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 0 });
  });

  it("rejects a duplicate repository source-comment key carrying a distinct admission envelope", async () => {
    const first = await fixture("0");
    const firstResult = await admitGitHubNextEvent(env.POOL_DB, first.input, first.context, trustedClock);
    expect(firstResult.decision).toBe("ADMITTED_QUEUED");

    const second = await fixture("1", Number(first.event.sourceCommentId));
    const secondBound = await bindGitHubNextEvent(second.context);
    expect(secondBound.decision).toBe("BOUND");
    const secondAdmission = await admitQualifiedTask(env.POOL_DB, second.input, trustedClock);
    expect(secondAdmission.decision).toBe("ADMITTED_QUEUED");

    await expect(sourceReceiptInsert(
      env.POOL_DB, secondBound.context, second.input.admissionId
    )).rejects.toThrow();
    expect(await receiptCount(first.event.sourceCommentId)).toMatchObject({ count: 1 });
    expect(await receiptCount(secondBound.context.sourceCommentId)).toMatchObject({ count: 1 });
  });

  it("rejects forged receipt INSERT bindings even when the admission id exists", async () => {
    const f = await fixture("2");
    const admitted = await admitQualifiedTask(env.POOL_DB, f.input, trustedClock);
    expect(admitted.decision).toBe("ADMITTED_QUEUED");
    await expect(sourceReceiptInsert(
      env.POOL_DB, f.event, f.input.admissionId, { event_digest: "0".repeat(64) }
    )).rejects.toThrow("SOURCE_COMMENT_ADMISSION_BINDING_INVALID");
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 0 });
  });

  it("rejects source receipt insertion when the independently required commit receipt is missing", async () => {
    const f = await fixture("3");
    const admitted = await admitQualifiedTask(env.POOL_DB, f.input, trustedClock);
    expect(admitted.decision).toBe("ADMITTED_QUEUED");
    const saved = await env.POOL_DB.prepare(
      "SELECT * FROM pool_admission_commit_receipts WHERE admission_id = ?"
    ).bind(f.input.admissionId).first();
    expect(saved).toBeTruthy();

    await env.POOL_DB.prepare("DROP TRIGGER pool_admission_receipts_no_delete").run();
    await env.POOL_DB.prepare(
      "DELETE FROM pool_admission_commit_receipts WHERE admission_id = ?"
    ).bind(f.input.admissionId).run();
    try {
      await expect(sourceReceiptInsert(
        env.POOL_DB, f.event, f.input.admissionId
      )).rejects.toThrow("SOURCE_COMMENT_ADMISSION_BINDING_INVALID");
      expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 0 });
    } finally {
      await env.POOL_DB.prepare(`
        INSERT INTO pool_admission_commit_receipts (
          admission_id, approval_id, task_key, executor_id, attempt_id,
          qualification_id, evidence_digest, committed_at, assertion, dispatch_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(saved.admission_id, saved.approval_id, saved.task_key, saved.executor_id,
        saved.attempt_id, saved.qualification_id, saved.evidence_digest, saved.committed_at,
        saved.assertion, saved.dispatch_enabled).run();
      await env.POOL_DB.prepare(`
        CREATE TRIGGER pool_admission_receipts_no_delete
        BEFORE DELETE ON pool_admission_commit_receipts
        BEGIN SELECT RAISE(ABORT, 'ADMISSION_RECEIPTS_APPEND_ONLY'); END
      `).run();
    }
  });

  it("rejects source receipt insertion when the independently required route row is missing", async () => {
    const f = await fixture("4");
    const admitted = await admitQualifiedTask(env.POOL_DB, f.input, trustedClock);
    expect(admitted.decision).toBe("ADMITTED_QUEUED");

    const statements = [
      env.POOL_DB.prepare("DROP TRIGGER pool_route_qualification_no_delete"),
      env.POOL_DB.prepare("PRAGMA defer_foreign_keys = ON"),
      env.POOL_DB.prepare("DELETE FROM pool_route_qualifications WHERE qualification_id = ?")
        .bind(f.input.route.qualificationId),
      env.POOL_DB.prepare(`INSERT INTO pool_source_comment_receipts (
        ${sourceReceiptColumns.join(", ")}) VALUES (${sourceReceiptColumns.map(() => "?").join(", ")})`)
        .bind(...[
          f.event.sourceCommentId, f.event.repositoryId, f.event.ownerNumericId, f.event.issueNumber,
          f.event.eventName, f.event.eventAction, f.event.actorNumericId, f.event.actorLogin,
          f.event.authorAssociation, f.event.bodyDigest, f.event.ref, f.event.targetSha,
          f.event.workflowRef, f.event.workflowSha, f.event.runId, f.event.runAttempt,
          f.event.profile, f.event.eventDigest, f.input.admissionId, NOW, 0
        ]),
      env.POOL_DB.prepare(`INSERT INTO pool_route_qualifications (
        schema_version, qualification_id, route_id, provider_id, model_id, issuer_id,
        account_ref, credential_handle_ref, quota_domain_id, cost_class, capability_id,
        capability_profile, evidence_ref, evidence_digest, observed_at, valid_until,
        revocation_version, registry_version, qualification_status, revoked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'qualified', NULL)`)
        .bind(f.input.route.schemaVersion, f.input.route.qualificationId, f.input.route.routeId,
          f.input.route.providerId, f.input.route.modelId, f.input.route.issuerId,
          f.input.route.accountRef, f.input.route.credentialHandleRef, f.input.route.quotaDomainId,
          f.input.route.costClass, f.input.route.capabilityId, f.input.route.capabilityProfile,
          f.input.route.evidenceRef, f.input.route.evidenceDigest, f.input.route.observedAt,
          f.input.route.validUntil, f.input.route.revocationVersion, f.input.route.registryVersion),
      env.POOL_DB.prepare(`CREATE TRIGGER pool_route_qualification_no_delete
        BEFORE DELETE ON pool_route_qualifications
        BEGIN SELECT RAISE(ABORT, 'ROUTE_QUALIFICATION_APPEND_ONLY'); END`)
    ];
    await expect(env.POOL_DB.batch(statements)).rejects.toThrow("SOURCE_COMMENT_ADMISSION_BINDING_INVALID");
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 0 });
    const route = await env.POOL_DB.prepare(
      "SELECT qualification_status FROM pool_route_qualifications WHERE qualification_id = ?"
    ).bind(f.input.route.qualificationId).first();
    expect(route).toMatchObject({ qualification_status: "qualified" });
  });

  it("rejects updates to every source receipt field, including identity, provenance, linkage and state", async () => {
    const f = await fixture("5");
    const admitted = await admitGitHubNextEvent(env.POOL_DB, f.input, f.context, trustedClock);
    expect(admitted.receiptDecision).toBe("SOURCE_COMMENT_RECORDED");
    for (const column of sourceReceiptColumns) {
      await expect(env.POOL_DB.prepare(
        `UPDATE pool_source_comment_receipts SET ${column} = ${column} WHERE source_comment_id = ?`
      ).bind(f.event.sourceCommentId).run()).rejects.toThrow("SOURCE_COMMENT_RECEIPTS_APPEND_ONLY");
    }
    expect(await receiptCount(f.event.sourceCommentId)).toMatchObject({ count: 1 });
  });

});
