import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";

const NOW = 1_800_000_000;
const publicJwk = JSON.stringify({
  kty: "EC", crv: "P-256", x: "A".repeat(43), y: "B".repeat(43)
});

function installBatch(db: D1Database, {
  expectedEpoch, epoch, digest, version, acceptedAt
}: {
  expectedEpoch: number; epoch: number; digest: string; version: string; acceptedAt: number;
}) {
  const statements = [
    // CHECK(assertion = 1) turns a failed expected-epoch predicate into a SQL
    // error. D1 batch atomicity must roll back every statement in this batch.
    db.prepare(`
      INSERT INTO pool_route_registry_cas_guard (assertion)
      SELECT CASE
        WHEN (? = 0 AND NOT EXISTS (SELECT 1 FROM pool_route_registry_state))
          OR EXISTS (SELECT 1 FROM pool_route_registry_state WHERE current_epoch = ?)
        THEN 1 ELSE 0 END
    `).bind(expectedEpoch, expectedEpoch),
    db.prepare("DELETE FROM pool_route_registry_cas_guard"),
    db.prepare(`
      INSERT INTO pool_route_registry_snapshots (
        registry_epoch, registry_version, root_key_id, bundle_digest,
        issued_at, valid_until, accepted_at, issuer_key_count, route_count
      ) VALUES (?, ?, 'platform-root-v1', ?, ?, ?, ?, 1, 1)
    `).bind(epoch, version, digest, acceptedAt - 10, acceptedAt + 300, acceptedAt),
    db.prepare(`
      INSERT INTO pool_route_registry_issuer_keys (
        registry_epoch, issuer_id, key_id, registry_version, status,
        revoked_at, valid_from, valid_until, public_key_jwk_json
      ) VALUES (?, 'issuer-a', 'key-a', ?, 'active', NULL, ?, ?, ?)
    `).bind(epoch, version, acceptedAt - 100, acceptedAt + 7200, publicJwk),
    db.prepare(`
      INSERT INTO pool_route_registry_routes (
        registry_epoch, qualification_id, route_id, issuer_id, key_id,
        provider_id, model_id, account_ref, credential_handle_ref, quota_domain_id,
        cost_class, capability_id, capability_profile, evidence_digest,
        observed_at, valid_until, revocation_version, status, evidence_json, issuer_signature
      ) VALUES (?, 'qualification-a', 'route-a', 'issuer-a', 'key-a',
        'provider-a', 'model-a', 'account-a', 'handle-a', 'quota-a',
        'free_quota', 'pool.execute', 'headless-probe', ?, ?, ?, 1,
        'qualified', '{}', 'synthetic-signature')
    `).bind(epoch, "c".repeat(64), acceptedAt - 1, acceptedAt + 120),
    expectedEpoch === 0
      ? db.prepare(`
          INSERT INTO pool_route_registry_state (
            state_id, current_epoch, current_bundle_digest, current_registry_version, updated_at
          ) VALUES (1, ?, ?, ?, ?)
        `).bind(epoch, digest, version, acceptedAt)
      : db.prepare(`
          UPDATE pool_route_registry_state
             SET current_epoch = ?, current_bundle_digest = ?,
                 current_registry_version = ?, updated_at = ?
           WHERE state_id = 1 AND current_epoch = ?
        `).bind(epoch, digest, version, acceptedAt, expectedEpoch)
  ];
  return db.batch(statements);
}

describe("route registry transactional CAS schema", () => {
  it("persists immutable child rows and atomically rejects stale writers without orphans", async () => {
    const db = env.POOL_DB;
    const firstDigest = "a".repeat(64);
    await installBatch(db, {
      expectedEpoch: 0, epoch: 1001, digest: firstDigest,
      version: "registry-v1001", acceptedAt: NOW
    });

    const issuer = await db.prepare(
      "SELECT issuer_id, key_id, registry_version FROM pool_route_registry_issuer_keys WHERE registry_epoch = 1001"
    ).first();
    const route = await db.prepare(
      "SELECT qualification_id, provider_id, account_ref, quota_domain_id FROM pool_route_registry_routes WHERE registry_epoch = 1001"
    ).first();
    const firstState = await db.prepare(
      "SELECT current_epoch, current_bundle_digest FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    expect(issuer).toEqual({
      issuer_id: "issuer-a", key_id: "key-a", registry_version: "registry-v1001"
    });
    expect(route).toEqual({
      qualification_id: "qualification-a", provider_id: "provider-a",
      account_ref: "account-a", quota_domain_id: "quota-a"
    });
    expect(firstState).toEqual({ current_epoch: 1001, current_bundle_digest: firstDigest });

    await expect(db.prepare(
      "UPDATE pool_route_registry_routes SET account_ref = 'substituted' WHERE registry_epoch = 1001"
    ).run()).rejects.toThrow();
    await expect(db.prepare(
      "DELETE FROM pool_route_registry_issuer_keys WHERE registry_epoch = 1001"
    ).run()).rejects.toThrow();
    await expect(db.prepare(`
      INSERT INTO pool_route_registry_routes (
        registry_epoch, qualification_id, route_id, issuer_id, key_id,
        provider_id, model_id, account_ref, credential_handle_ref, quota_domain_id,
        cost_class, capability_id, capability_profile, evidence_digest,
        observed_at, valid_until, revocation_version, status, evidence_json, issuer_signature
      ) VALUES (1001, 'late-qualification', 'route-b', 'issuer-a', 'key-a',
        'provider-a', 'model-a', 'account-a', 'handle-a', 'quota-a',
        'free_quota', 'pool.execute', 'headless-probe', ?, ?, ?, 1,
        'qualified', '{}', 'synthetic-signature')
    `).bind("f".repeat(64), NOW, NOW + 120).run()).rejects.toThrow();

    await installBatch(db, {
      expectedEpoch: 1001, epoch: 1002, digest: "b".repeat(64),
      version: "registry-v1002", acceptedAt: NOW + 1000
    });
    const advanced = await db.prepare(
      "SELECT current_epoch, current_registry_version FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    expect(advanced).toEqual({ current_epoch: 1002, current_registry_version: "registry-v1002" });

    // A stale writer has a newer candidate epoch but an obsolete expected
    // pointer. The CHECK-backed assertion must abort before any rows persist.
    await expect(installBatch(db, {
      expectedEpoch: 1001, epoch: 1003, digest: "c".repeat(64),
      version: "registry-v1003", acceptedAt: NOW + 2000
    })).rejects.toThrow();

    const orphanCounts = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM pool_route_registry_snapshots WHERE registry_epoch = 1003) AS snapshots,
        (SELECT COUNT(*) FROM pool_route_registry_issuer_keys WHERE registry_epoch = 1003) AS issuers,
        (SELECT COUNT(*) FROM pool_route_registry_routes WHERE registry_epoch = 1003) AS routes
    `).first();
    expect(orphanCounts).toEqual({ snapshots: 0, issuers: 0, routes: 0 });
    const finalState = await db.prepare(
      "SELECT current_epoch FROM pool_route_registry_state WHERE state_id = 1"
    ).first();
    expect(finalState).toEqual({ current_epoch: 1002 });

    // Two writers race from the same expected epoch. D1 must serialize the
    // batches so exactly one can advance the singleton watermark.
    const contenders = await Promise.allSettled([
      installBatch(db, {
        expectedEpoch: 1002, epoch: 1004, digest: "4".repeat(64),
        version: "registry-v1004", acceptedAt: NOW + 4000
      }),
      installBatch(db, {
        expectedEpoch: 1002, epoch: 1005, digest: "5".repeat(64),
        version: "registry-v1005", acceptedAt: NOW + 5000
      })
    ]);
    expect(contenders.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    expect(contenders.filter((item) => item.status === "rejected")).toHaveLength(1);
    const winner = await db.prepare(
      "SELECT current_epoch FROM pool_route_registry_state WHERE state_id = 1"
    ).first<{ current_epoch: number }>();
    expect([1004, 1005]).toContain(winner?.current_epoch);
    const acceptedCandidates = await db.prepare(`
      SELECT COUNT(*) AS count FROM pool_route_registry_snapshots
       WHERE registry_epoch IN (1004, 1005)
    `).first();
    expect(acceptedCandidates).toEqual({ count: 1 });

    const guards = await db.prepare(
      "SELECT COUNT(*) AS count FROM pool_route_registry_cas_guard"
    ).first();
    expect(guards).toEqual({ count: 0 });
  });
});
