import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";

const snapshot = (epoch: number, digest: string, version: string, acceptedAt: number) => ({
  epoch, digest, version, acceptedAt
});

async function insertSnapshot(db: D1Database, row: ReturnType<typeof snapshot>) {
  return db.prepare(`
    INSERT INTO pool_route_registry_snapshots (
      registry_epoch, registry_version, root_key_id, bundle_digest,
      issued_at, valid_until, accepted_at, issuer_key_count, route_count
    ) VALUES (?, ?, 'platform-root-v1', ?, ?, ?, ?, 1, 1)
  `).bind(row.epoch, row.version, row.digest, row.acceptedAt - 10,
    row.acceptedAt + 300, row.acceptedAt).run();
}

describe("durable route registry snapshot ledger migration", () => {
  it("enforces append-only snapshots and a monotonic, snapshot-bound singleton watermark", async () => {
    const db = env.POOL_DB;
    const first = snapshot(1001, "a".repeat(64), "registry-v1001", 1_800_000_100);
    const second = snapshot(1002, "b".repeat(64), "registry-v1002", 1_800_000_200);

    await insertSnapshot(db, first);
    await expect(db.prepare(`
      INSERT INTO pool_route_registry_state (
        state_id, current_epoch, current_bundle_digest, current_registry_version, updated_at
      ) VALUES (1, ?, ?, ?, ?)
    `).bind(first.epoch, first.digest, first.version, first.acceptedAt).run()).resolves.toBeTruthy();

    await expect(db.prepare(
      "UPDATE pool_route_registry_snapshots SET registry_version = 'tampered' WHERE registry_epoch = ?"
    ).bind(first.epoch).run()).rejects.toThrow();
    await expect(db.prepare(
      "DELETE FROM pool_route_registry_snapshots WHERE registry_epoch = ?"
    ).bind(first.epoch).run()).rejects.toThrow();

    await expect(insertSnapshot(db, snapshot(1000, "c".repeat(64), "registry-v1000", 1_800_000_300)))
      .rejects.toThrow();

    await insertSnapshot(db, second);
    await expect(db.prepare(`
      UPDATE pool_route_registry_state
         SET current_epoch = ?, current_bundle_digest = ?,
             current_registry_version = ?, updated_at = ?
       WHERE state_id = 1 AND current_epoch = ? AND current_bundle_digest = ?
    `).bind(second.epoch, second.digest, second.version, second.acceptedAt,
      first.epoch, first.digest).run()).resolves.toBeTruthy();

    const current = await db.prepare(
      "SELECT current_epoch, current_bundle_digest, current_registry_version FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    expect(current).toEqual({
      current_epoch: second.epoch,
      current_bundle_digest: second.digest,
      current_registry_version: second.version
    });

    await expect(db.prepare(`
      UPDATE pool_route_registry_state
         SET current_epoch = ?, current_bundle_digest = ?,
             current_registry_version = ?, updated_at = ?
       WHERE state_id = 1
    `).bind(first.epoch, first.digest, first.version, 1_800_000_400).run()).rejects.toThrow();

    await expect(db.prepare(
      "DELETE FROM pool_route_registry_state WHERE state_id = 1"
    ).run()).rejects.toThrow();

    await expect(db.prepare(`
      INSERT INTO pool_route_registry_state (
        state_id, current_epoch, current_bundle_digest, current_registry_version, updated_at
      ) VALUES (1, ?, ?, ?, ?)
    `).bind(second.epoch, "d".repeat(64), second.version, second.acceptedAt).run())
      .rejects.toThrow();
  });
});
