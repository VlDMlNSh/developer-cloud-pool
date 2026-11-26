import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("isolated D1 upgrade binding smoke", () => {
  it("applies pinned migrations to a distinct local D1 without mutating POOL_DB", async () => {
    await applyD1Migrations(env.UPGRADE_DB, env.UPGRADE_MIGRATIONS);

    const upgradeTable = await env.UPGRADE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pool_approval_ledger'"
    ).first<{ name: string }>();
    expect(upgradeTable?.name).toBe("pool_approval_ledger");

    const primaryTable = await env.POOL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pool_approval_ledger'"
    ).first<{ name: string }>();
    expect(primaryTable).toBeNull();

    await env.UPGRADE_DB.prepare(
      "INSERT INTO pool_approval_ledger (approval_id, owner_numeric_id, repository_id, issue_number, target_sha, profile, envelope_digest, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      "isolated-upgrade-smoke",
      "10001",
      "20002",
      7,
      "a".repeat(40),
      "dsh-headless-probe",
      "b".repeat(64),
      1_900_000_000
    ).run();

    const isolatedRow = await env.UPGRADE_DB.prepare(
      "SELECT approval_id FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind("isolated-upgrade-smoke").first<{ approval_id: string }>();
    expect(isolatedRow?.approval_id).toBe("isolated-upgrade-smoke");

    const primaryCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'pool_approval_ledger'"
    ).first<{ count: number }>();
    expect(primaryCount?.count).toBe(0);
  });
});
