import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { consumeApproval } from "../src/consume.mjs";

const NOW = 1_800_000_000;
const approval = {
  approvalId: "approval-event-001",
  ownerNumericId: "10001",
  repositoryId: "20002",
  issueNumber: 42,
  targetSha: "a".repeat(40),
  profile: "dsh-headless-probe",
  envelopeDigest: "b".repeat(64)
};

async function seed(overrides = {}) {
  const row = { ...approval, expiresAt: NOW + 3600, ...overrides };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number,
      target_sha, profile, envelope_digest, expires_at, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')
  `).bind(
    row.approvalId,
    row.ownerNumericId,
    row.repositoryId,
    row.issueNumber,
    row.targetSha,
    row.profile,
    row.envelopeDigest,
    row.expiresAt
  ).run();
}

beforeEach(async () => {
  // The claim/outbox suite shares the same D1 test database. Remove
  // dependent rows before deleting their approval-ledger parent rows.
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await seed();
});

describe("D1 single-use approval ledger", () => {
  it("allows exactly one winner across concurrent consumers", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => consumeApproval(env.POOL_DB, approval, NOW))
    );

    expect(results.filter((result) => result.decision === "ALLOW_ONCE")).toHaveLength(1);
    expect(results.filter((result) => result.decision === "DENY")).toHaveLength(11);

    const stored = await env.POOL_DB.prepare(
      "SELECT state, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();

    expect(stored.state).toBe("consumed");
    expect(stored.consumed_at).toBe(NOW);
  });

  it("rejects replay after the first consume", async () => {
    const first = await consumeApproval(env.POOL_DB, approval, NOW);
    const second = await consumeApproval(env.POOL_DB, approval, NOW + 1);

    expect(first.decision).toBe("ALLOW_ONCE");
    expect(second).toMatchObject({
      decision: "DENY",
      state: "needs-review",
      dispatch: false,
      reason: "NO_MATCH_OR_ALREADY_CONSUMED"
    });
  });

  it.each([
    ["owner", { ownerNumericId: "99999" }],
    ["repository", { repositoryId: "99999" }],
    ["issue", { issueNumber: 99 }],
    ["target SHA", { targetSha: "c".repeat(40) }],
    ["profile", { profile: "unapproved-profile" }],
    ["envelope digest", { envelopeDigest: "d".repeat(64) }]
  ])("rejects a mismatched %s", async (_name, override) => {
    const result = await consumeApproval(env.POOL_DB, { ...approval, ...override }, NOW);
    expect(result.decision).toBe("DENY");
    expect(result.dispatch).toBe(false);
    expect(result.state).toBe("needs-review");
  });

  it("rejects expired approvals", async () => {
    await env.POOL_DB.prepare(
      "UPDATE pool_approval_ledger SET expires_at = ? WHERE approval_id = ?"
    ).bind(NOW, approval.approvalId).run();

    const result = await consumeApproval(env.POOL_DB, approval, NOW);
    expect(result.decision).toBe("DENY");
    expect(result.reason).toBe("NO_MATCH_OR_ALREADY_CONSUMED");
  });

  it("rejects malformed bindings before storage access", async () => {
    const result = await consumeApproval(env.POOL_DB, {
      ...approval,
      targetSha: "mutable-branch"
    }, NOW);

    expect(result).toMatchObject({
      decision: "DENY",
      state: "needs-review",
      dispatch: false,
      reason: "INVALID_APPROVAL_BINDING"
    });
  });

  it("fails closed when storage is unavailable", async () => {
    const result = await consumeApproval(undefined, approval, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      state: "needs-review",
      dispatch: false,
      reason: "STORAGE_UNAVAILABLE"
    });
  });

  it("fails closed on an ambiguous storage exception", async () => {
    const unavailable = {
      prepare() {
        return {
          bind() {
            return {
              run: async () => { throw new Error("synthetic transport failure"); }
            };
          }
        };
      }
    };

    const result = await consumeApproval(unavailable, approval, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      state: "needs-review",
      dispatch: false,
      reason: "STORAGE_OUTCOME_AMBIGUOUS"
    });
  });

  it("rolls back an earlier statement when a D1 batch fails", async () => {
    await expect(env.POOL_DB.batch([
      env.POOL_DB.prepare(`
        UPDATE pool_approval_ledger
           SET state = 'consumed', consumed_at = ?
         WHERE approval_id = ?
      `).bind(NOW, approval.approvalId),
      env.POOL_DB.prepare(`
        INSERT INTO pool_approval_ledger (
          approval_id, owner_numeric_id, repository_id, issue_number,
          target_sha, profile, envelope_digest, expires_at, state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')
      `).bind(
        approval.approvalId,
        approval.ownerNumericId,
        approval.repositoryId,
        approval.issueNumber,
        approval.targetSha,
        approval.profile,
        approval.envelopeDigest,
        NOW + 3600
      )
    ])).rejects.toThrow();

    const stored = await env.POOL_DB.prepare(
      "SELECT state, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();

    expect(stored.state).toBe("ready");
    expect(stored.consumed_at).toBeNull();
  });
});
