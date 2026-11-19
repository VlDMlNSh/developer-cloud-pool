import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("canonical D1 migration baseline", () => {
  it("creates the CODE approval ledger and both distinct outbox schemas", async () => {
    const tables = await env.POOL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    ).all<{ name: string }>();
    const names = new Set((tables.results ?? []).map((row) => row.name));

    for (const name of [
      "pool_approval_ledger",
      "pool_task_claims",
      "pool_task_outbox",
      "pool_tasks",
      "pool_task_approvals",
      "pool_task_delivery_outbox",
      "pool_attempts",
      "pool_attempt_events",
      "pool_attempt_reconciliations",
      "pool_attempt_projection_outbox",
      "pool_attempt_projection_events",
      "pool_attempt_projection_comment_events"
    ]) expect(names.has(name), name).toBe(true);

    const ledger = await env.POOL_DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'pool_approval_ledger'"
    ).first<{ sql: string }>();
    expect(ledger?.sql).toContain("jarvis-code-sandbox-v1");
  });

  it("attaches multiple approvals to one logical task with exactly one task-ready outbox row", async () => {
    const taskKey = "a".repeat(64);
    const targetSha = "b".repeat(40);
    const digest = "c".repeat(64);
    const now = 1_900_000_000;

    for (const approvalId of ["approval-one", "approval-two"]) {
      await env.POOL_DB.prepare(`
        INSERT INTO pool_approval_ledger
          (approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
           profile, envelope_digest, expires_at)
        VALUES (?, '10001', '20002', 42, ?, 'jarvis-code-sandbox-v1', ?, ?)
      `).bind(approvalId, targetSha, digest, now + 3600).run();

      await env.POOL_DB.prepare(`
        UPDATE pool_approval_ledger
           SET state = 'consumed', consumed_at = ?, task_key = ?
         WHERE approval_id = ? AND state = 'ready'
      `).bind(now, taskKey, approvalId).run();
    }

    const taskCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first<{ count: number }>();
    const approvalCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_task_approvals WHERE task_key = ?"
    ).bind(taskKey).first<{ count: number }>();
    const readyCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_task_delivery_outbox WHERE task_key = ?"
    ).bind(taskKey).first<{ count: number }>();
    const legacyClaims = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_task_claims"
    ).first<{ count: number }>();
    const legacyOutbox = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_task_outbox"
    ).first<{ count: number }>();

    expect(taskCount?.count).toBe(1);
    expect(approvalCount?.count).toBe(2);
    expect(readyCount?.count).toBe(1);
    expect(legacyClaims?.count).toBe(0);
    expect(legacyOutbox?.count).toBe(0);
  });

  it("keeps terminal-attempt projection outbox independent from task-ready outbox", async () => {
    const taskReady = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_task_delivery_outbox"
    ).first<{ count: number }>();
    const projection = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM pool_attempt_projection_outbox"
    ).first<{ count: number }>();

    // The preceding test committed one task-ready row in this shared local D1 fixture.
    // The projection queue remains empty and independently addressable.
    expect(taskReady?.count).toBe(1);
    expect(projection?.count).toBe(0);
    const projectionSchema = await env.POOL_DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'pool_attempt_projection_outbox'"
    ).first<{ sql: string }>();
    expect(projectionSchema?.sql).toContain("terminal_status");
  });
});
