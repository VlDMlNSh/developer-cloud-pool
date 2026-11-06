import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimAndEnqueue } from "../src/claim-outbox.mjs";

const NOW = 1_800_000_000;
const approval = {
  approvalId: "approval-outbox-001",
  ownerNumericId: "10001",
  repositoryId: "20002",
  issueNumber: 42,
  targetSha: "a".repeat(40),
  profile: "dsh-headless-probe",
  envelopeDigest: "b".repeat(64)
};

async function seed(overrides = {}) {
  const row = { ...approval, expiresAt: NOW + 3600, state: "ready", consumedAt: null, ...overrides };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number,
      target_sha, profile, envelope_digest, expires_at, state, consumed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.approvalId, row.ownerNumericId, row.repositoryId, row.issueNumber,
    row.targetSha, row.profile, row.envelopeDigest, row.expiresAt, row.state, row.consumedAt
  ).run();
}

beforeEach(async () => {
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS test_abort_outbox_insert").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await seed();
});

describe("atomic D1 claim and transactional outbox", () => {
  it("commits one claim and one outbox event under 12 concurrent attempts", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => claimAndEnqueue(env.POOL_DB, approval, NOW))
    );
    expect(results.filter((r) => r.decision === "CLAIMED_ONCE")).toHaveLength(1);
    expect(results.filter((r) => r.decision === "ALREADY_ENQUEUED")).toHaveLength(11);
    expect(results.every((r) => r.dispatch === false)).toBe(true);

    const claims = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    const outbox = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_outbox").first();
    const ledger = await env.POOL_DB.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();
    expect(claims.n).toBe(1);
    expect(outbox.n).toBe(1);
    expect(ledger.state).toBe("consumed");
  });

  it("returns the same deterministic claim and outbox IDs on retry", async () => {
    const first = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    const retry = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    expect(first).toMatchObject({
      decision: "CLAIMED_ONCE",
      claimId: approval.approvalId,
      outboxId: `pool-task:${approval.approvalId}`
    });
    expect(retry).toMatchObject({
      decision: "ALREADY_ENQUEUED",
      claimId: approval.approvalId,
      outboxId: `pool-task:${approval.approvalId}`,
      dispatch: false
    });
  });

  it("does not create a claim for a binding mismatch", async () => {
    const result = await claimAndEnqueue(
      env.POOL_DB, { ...approval, targetSha: "c".repeat(40) }, NOW
    );
    expect(result.decision).toBe("DENY");
    const count = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    expect(count.n).toBe(0);
  });

  it("does not create a claim from a pre-consumed approval with the same timestamp", async () => {
    const alreadyConsumed = { ...approval, approvalId: "approval-preconsumed-001" };
    await seed({ ...alreadyConsumed, state: "consumed", consumedAt: NOW });

    const result = await claimAndEnqueue(env.POOL_DB, alreadyConsumed, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED"
    });
    const count = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims WHERE approval_id = ?")
      .bind(alreadyConsumed.approvalId).first();
    expect(count.n).toBe(0);
  });

  it("rolls back approval consumption and claim when outbox insertion fails", async () => {
    await env.POOL_DB.prepare(`
      CREATE TRIGGER test_abort_outbox_insert
      BEFORE INSERT ON pool_task_outbox
      BEGIN SELECT RAISE(ABORT, 'synthetic outbox failure'); END
    `).run();

    const result = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CLAIM_TRANSACTION_AMBIGUOUS"
    });

    const ledger = await env.POOL_DB.prepare(
      "SELECT state, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();
    const claims = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    expect(ledger.state).toBe("ready");
    expect(ledger.consumed_at).toBeNull();
    expect(claims.n).toBe(0);
  });
});
