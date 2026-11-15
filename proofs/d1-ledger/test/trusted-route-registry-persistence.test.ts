import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { canonicalizeQualifiedRouteEvidence } from "../src/qualified-route-evidence.mjs";
import {
  canonicalizeTrustedRouteRegistryBundle,
  persistTrustedRouteRegistryBundle
} from "../src/trusted-route-registry.mjs";

const NOW = 1_800_001_000;
const evidenceBase = {
  schemaVersion: 1, qualificationId: "qualification-persist-001",
  routeId: "route-persist-a", providerId: "provider-persist-a",
  modelId: "model-persist-a", issuerId: "issuer-persist-a",
  keyId: "key-persist-2026", accountRef: "account-persist-a",
  credentialHandleRef: "handle-persist-a", quotaDomainId: "quota-persist-a",
  costClass: "free_quota", capabilityId: "pool.execute",
  capabilityProfile: "dsh-headless-probe", evidenceRef: "evidence://provider/persist-001",
  observedAt: NOW - 5, validUntil: NOW + 300, revocationVersion: 4,
  registryVersion: "registry-persist-v1", status: "qualified"
};

let rootPrivate;
let issuerPrivate;
let envBindings;
let issuerPublic;

function publicOnly(jwk) {
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
}
function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function sign(key, bytes) {
  return base64url(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, bytes));
}
async function makeBundle(epoch, version, qualificationId = evidenceBase.qualificationId) {
  const evidence = { ...evidenceBase, qualificationId, registryVersion: version };
  const routeSignature = await sign(
    issuerPrivate,
    new TextEncoder().encode(canonicalizeQualifiedRouteEvidence(evidence))
  );
  const bundle = {
    schemaVersion: 1, registryEpoch: epoch, registryVersion: version,
    issuedAt: NOW - 5, validUntil: NOW + 240, rootKeyId: "pool-root-persist-v1",
    issuerKeys: [{
      issuerId: evidence.issuerId, keyId: evidence.keyId,
      registryVersion: version, status: "active", revokedAt: null,
      validFrom: NOW - 100, validUntil: NOW + 3600, publicKeyJwk: issuerPublic
    }],
    routes: [{ evidence, signature: routeSignature }]
  };
  const signature = await sign(
    rootPrivate,
    new TextEncoder().encode(canonicalizeTrustedRouteRegistryBundle(bundle))
  );
  return { bundle, signature };
}

beforeAll(async () => {
  const root = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  const issuer = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  rootPrivate = root.privateKey;
  issuerPrivate = issuer.privateKey;
  issuerPublic = publicOnly(await crypto.subtle.exportKey("jwk", issuer.publicKey));
  envBindings = {
    ROUTE_REGISTRY_ROOT_KEY_ID: "pool-root-persist-v1",
    ROUTE_REGISTRY_ROOT_PUBLIC_JWK: JSON.stringify(publicOnly(await crypto.subtle.exportKey("jwk", root.publicKey)))
  };
});

describe("atomic persistence of root-signed route registry", () => {
  it("persists the signed payload, issuer keys, qualified routes and active pointer as one D1 batch", async () => {
    const db = env.POOL_DB;
    const first = await makeBundle(2001, "registry-persist-v1");
    const result = await persistTrustedRouteRegistryBundle({
      db, ...first, env: envBindings, now: NOW
    });
    expect(result).toMatchObject({
      verified: true, persisted: true, alreadyPersisted: false,
      active: true, registryEpoch: 2001, dispatch: false,
      reason: "ROOT_SIGNED_REGISTRY_SNAPSHOT_PERSISTED"
    });

    const snapshot = await db.prepare(`
      SELECT registry_epoch, registry_version, bundle_digest, bundle_json,
             root_signature, issuer_key_count, route_count
        FROM pool_route_registry_snapshots WHERE registry_epoch = 2001
    `).first();
    expect(snapshot).toMatchObject({
      registry_epoch: 2001, registry_version: "registry-persist-v1",
      bundle_digest: result.bundleDigest, bundle_json: JSON.stringify(first.bundle),
      root_signature: first.signature, issuer_key_count: 1, route_count: 1
    });

    const issuer = await db.prepare(`
      SELECT issuer_id, key_id, status, registry_epoch, bundle_digest
        FROM pool_route_registry_issuer_keys
       WHERE registry_epoch = 2001 AND issuer_id = 'issuer-persist-a'
    `).first();
    expect(issuer).toMatchObject({
      issuer_id: "issuer-persist-a", key_id: "key-persist-2026",
      status: "active", registry_epoch: 2001, bundle_digest: result.bundleDigest
    });

    const route = await db.prepare(`
      SELECT qualification_id, issuer_key_id, registry_epoch,
             registry_bundle_digest, evidence_digest
        FROM pool_route_qualifications
       WHERE qualification_id = 'qualification-persist-001'
    `).first();
    expect(route).toMatchObject({
      qualification_id: "qualification-persist-001",
      issuer_key_id: "key-persist-2026", registry_epoch: 2001,
      registry_bundle_digest: result.bundleDigest
    });
    expect(route.evidence_digest).toMatch(/^[a-f0-9]{64}$/);

    const pointer = await db.prepare(`
      SELECT current_epoch, current_bundle_digest, current_registry_version
        FROM pool_route_registry_state WHERE state_id = 1
    `).first();
    expect(pointer).toEqual({
      current_epoch: 2001, current_bundle_digest: result.bundleDigest,
      current_registry_version: "registry-persist-v1"
    });

    const retry = await persistTrustedRouteRegistryBundle({
      db, ...first, env: envBindings, now: NOW
    });
    expect(retry).toMatchObject({
      verified: true, persisted: true, alreadyPersisted: true,
      active: true, dispatch: false,
      reason: "REGISTRY_SNAPSHOT_ALREADY_PERSISTED"
    });

    const invalid = await persistTrustedRouteRegistryBundle({
      db, bundle: first.bundle, signature: (first.signature[0] === "A" ? "B" : "A") + first.signature.slice(1),
      env: envBindings, now: NOW
    });
    expect(invalid).toMatchObject({ verified: false, persisted: false, dispatch: false });

    // A new snapshot that collides with the immutable qualification identity
    // must roll back its snapshot, issuer key and active-pointer writes together.
    const colliding = await makeBundle(2002, "registry-persist-v2");
    const failed = await persistTrustedRouteRegistryBundle({
      db, ...colliding, env: envBindings, now: NOW + 1
    });
    expect(failed).toMatchObject({
      verified: true, persisted: false, dispatch: false,
      reason: "REGISTRY_PERSISTENCE_FAILED"
    });
    expect(await db.prepare(
      "SELECT COUNT(*) AS n FROM pool_route_registry_snapshots WHERE registry_epoch = 2002"
    ).first()).toMatchObject({ n: 0 });
    expect(await db.prepare(
      "SELECT current_epoch FROM pool_route_registry_state WHERE state_id = 1"
    ).first()).toMatchObject({ current_epoch: 2001 });
  });
});
