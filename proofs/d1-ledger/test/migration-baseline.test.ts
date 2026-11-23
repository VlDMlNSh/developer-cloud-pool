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

  it("blocks direct SQL writes to retired per-approval claim and outbox tables", async () => {
    const names = await env.POOL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('pool_task_claims_legacy_insert_block', 'pool_task_claims_legacy_update_block', 'pool_task_claims_legacy_delete_block', 'pool_task_outbox_legacy_insert_block', 'pool_task_outbox_legacy_update_block', 'pool_task_outbox_legacy_delete_block')"
    ).all<{ name: string }>();
    expect(new Set((names.results ?? []).map(row => row.name))).toEqual(new Set([
      "pool_task_claims_legacy_insert_block",
      "pool_task_claims_legacy_update_block",
      "pool_task_claims_legacy_delete_block",
      "pool_task_outbox_legacy_insert_block",
      "pool_task_outbox_legacy_update_block",
      "pool_task_outbox_legacy_delete_block"
    ]));
    await expect(env.POOL_DB.prepare(
      "INSERT INTO pool_task_claims (approval_id, claim_id, envelope_digest, created_at) VALUES ('x', 'x', ?, 1)"
    ).bind("a".repeat(64)).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");
    await expect(env.POOL_DB.prepare(
      "INSERT INTO pool_task_outbox (outbox_id, approval_id, event_type, envelope_digest, created_at) VALUES ('x', 'x', 'pool.task.claimed', ?, 1)"
    ).bind("a".repeat(64)).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");

    // Seed one historical row with only the INSERT guards temporarily lifted;
    // UPDATE and DELETE guards remain active and are exercised below.
    await env.POOL_DB.prepare(`
      INSERT INTO pool_approval_ledger (
        approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
        profile, envelope_digest, expires_at, executor_id
      ) VALUES ('legacy-write-seal-fixture', '10001', '20002', 91, ?, 'jarvis-code-sandbox-v1', ?, 1900003600, 'executor-legacy-test')
    `).bind("b".repeat(40), "c".repeat(64)).run();
    await env.POOL_DB.prepare("DROP TRIGGER pool_task_claims_legacy_insert_block").run();
    await env.POOL_DB.prepare("DROP TRIGGER pool_task_outbox_legacy_insert_block").run();
    await env.POOL_DB.prepare(`
      INSERT INTO pool_task_claims (approval_id, claim_id, envelope_digest, created_at)
      VALUES ('legacy-write-seal-fixture', 'legacy-write-seal-fixture', ?, 1)
    `).bind("a".repeat(64)).run();
    await env.POOL_DB.prepare(`
      INSERT INTO pool_task_outbox (outbox_id, approval_id, event_type, envelope_digest, created_at)
      VALUES ('legacy-write-seal-fixture', 'legacy-write-seal-fixture', 'pool.task.claimed', ?, 1)
    `).bind("a".repeat(64)).run();
    await env.POOL_DB.prepare("CREATE TRIGGER pool_task_claims_legacy_insert_block BEFORE INSERT ON pool_task_claims BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END").run();
    await env.POOL_DB.prepare("CREATE TRIGGER pool_task_outbox_legacy_insert_block BEFORE INSERT ON pool_task_outbox BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END").run();

    await expect(env.POOL_DB.prepare(
      "UPDATE pool_task_claims SET status = 'dead' WHERE approval_id = 'legacy-write-seal-fixture'"
    ).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_task_claims WHERE approval_id = 'legacy-write-seal-fixture'"
    ).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_task_outbox SET status = 'dead' WHERE approval_id = 'legacy-write-seal-fixture'"
    ).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_task_outbox WHERE approval_id = 'legacy-write-seal-fixture'"
    ).run()).rejects.toThrow("LEGACY_CLAIM_PATH_DISABLED");

    await env.POOL_DB.prepare("DROP TRIGGER pool_task_claims_legacy_delete_block").run();
    await env.POOL_DB.prepare("DROP TRIGGER pool_task_outbox_legacy_delete_block").run();
    await env.POOL_DB.prepare("DELETE FROM pool_task_claims WHERE approval_id = 'legacy-write-seal-fixture'").run();
    await env.POOL_DB.prepare("DELETE FROM pool_task_outbox WHERE approval_id = 'legacy-write-seal-fixture'").run();
    await env.POOL_DB.prepare("CREATE TRIGGER pool_task_claims_legacy_delete_block BEFORE DELETE ON pool_task_claims BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END").run();
    await env.POOL_DB.prepare("CREATE TRIGGER pool_task_outbox_legacy_delete_block BEFORE DELETE ON pool_task_outbox BEGIN SELECT RAISE(ABORT, 'LEGACY_CLAIM_PATH_DISABLED'); END").run();
    await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger WHERE approval_id = 'legacy-write-seal-fixture'").run();
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
           profile, envelope_digest, expires_at, executor_id)
        VALUES (?, '10001', '20002', 42, ?, 'jarvis-code-sandbox-v1', ?, ?, 'executor-alpha')
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

    const taskExecutor = await env.POOL_DB.prepare(
      "SELECT executor_id FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first<{ executor_id: string }>();

    expect(taskCount?.count).toBe(1);
    expect(taskExecutor?.executor_id).toBe("executor-alpha");
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

  it("rejects approvals without an executor identity", async () => {
    await expect(env.POOL_DB.prepare(`
      INSERT INTO pool_approval_ledger
        (approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
         profile, envelope_digest, expires_at)
      VALUES ('missing-executor', '10001', '20002', 43, ?, 'jarvis-code-sandbox-v1', ?, 1900003600)
    `).bind("d".repeat(40), "e".repeat(64)).run()).rejects.toThrow("EXECUTOR_ID_REQUIRED");
  });

  it("keeps approval executor identity immutable", async () => {
    const now = 1_900_000_000;
    await env.POOL_DB.prepare(`
      INSERT INTO pool_approval_ledger
        (approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
         profile, envelope_digest, expires_at, executor_id)
      VALUES ('immutable-executor', '10001', '20002', 44, ?, 'jarvis-code-sandbox-v1', ?, ?, 'executor-immutable')
    `).bind("f".repeat(40), "a".repeat(64), now + 3600).run();

    await expect(env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger SET executor_id = 'executor-replaced'
      WHERE approval_id = 'immutable-executor'
    `).run()).rejects.toThrow("EXECUTOR_ID_IMMUTABLE");
  });

  it("rejects cross-executor attachment to an existing logical task key", async () => {
    const taskKey = "9".repeat(64);
    const targetSha = "8".repeat(40);
    const digest = "7".repeat(64);
    const now = 1_900_000_000;

    for (const [approvalId, executorId] of [
      ["executor-task-a", "executor-alpha"],
      ["executor-task-b", "executor-beta"]
    ]) {
      await env.POOL_DB.prepare(`
        INSERT INTO pool_approval_ledger
          (approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
           profile, envelope_digest, expires_at, executor_id)
        VALUES (?, '10001', '20002', 45, ?, 'jarvis-code-sandbox-v1', ?, ?, ?)
      `).bind(approvalId, targetSha, digest, now + 3600, executorId).run();
    }

    await env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?
       WHERE approval_id = 'executor-task-a'
    `).bind(now, taskKey).run();

    await expect(env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?
       WHERE approval_id = 'executor-task-b'
    `).bind(now + 1, taskKey).run()).rejects.toThrow("TASK_KEY_BINDING_CONFLICT");

    const attached = await env.POOL_DB.prepare(`
      SELECT COUNT(*) AS count FROM pool_task_approvals WHERE task_key = ?
    `).bind(taskKey).first<{ count: number }>();
    expect(attached?.count).toBe(1);
  });
});
