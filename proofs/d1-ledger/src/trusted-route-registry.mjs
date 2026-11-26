import {
  canonicalizeQualifiedRouteEvidence,
  verifyQualifiedRouteEvidence
} from "./qualified-route-evidence.mjs";

const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const BUNDLE_FIELDS = [
  "schemaVersion", "registryEpoch", "registryVersion", "issuedAt",
  "validUntil", "rootKeyId", "issuerKeys", "routes"
];
const MAX_REGISTRY_AGE_SECONDS = 300;
const MAX_REGISTRY_LIFETIME_SECONDS = 3600;
const MAX_ISSUER_KEYS = 64;
const MAX_ROUTES = 256;
const MAX_BUNDLE_BYTES = 512 * 1024;
const deny = (reason) => Object.freeze({ verified: false, dispatch: false, reason });

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, i) => key === wanted[i]);
}

function validPublicJwk(jwk) {
  return exactKeys(jwk, ["kty", "crv", "x", "y"]) &&
    jwk.kty === "EC" && jwk.crv === "P-256" &&
    typeof jwk.x === "string" && /^[A-Za-z0-9_-]{43}$/.test(jwk.x) &&
    typeof jwk.y === "string" && /^[A-Za-z0-9_-]{43}$/.test(jwk.y);
}

function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return base64url(bytes) === value ? bytes : null;
  } catch {
    return null;
  }
}

function canonicalIssuer(key) {
  return [
    key.issuerId, key.keyId, key.registryVersion, key.status,
    key.revokedAt, key.validFrom, key.validUntil,
    key.publicKeyJwk.kty, key.publicKeyJwk.crv,
    key.publicKeyJwk.x, key.publicKeyJwk.y
  ];
}

/**
 * Registry bundle v1 uses a fixed-position JSON array. Issuer and route rows
 * MUST arrive sorted by their stable composite IDs; duplicates and unknown
 * fields are rejected rather than normalized.
 */
export function canonicalizeTrustedRouteRegistryBundle(bundle) {
  if (!exactKeys(bundle, BUNDLE_FIELDS) ||
      !Array.isArray(bundle.issuerKeys) || !Array.isArray(bundle.routes)) {
    throw new TypeError("REGISTRY_BUNDLE_SCHEMA_INVALID");
  }
  const issuers = bundle.issuerKeys.map((key) => {
    if (!exactKeys(key, [
      "issuerId", "keyId", "registryVersion", "status", "revokedAt",
      "validFrom", "validUntil", "publicKeyJwk"
    ]) || !validPublicJwk(key.publicKeyJwk)) {
      throw new TypeError("REGISTRY_ISSUER_SCHEMA_INVALID");
    }
    return canonicalIssuer(key);
  });
  const routes = bundle.routes.map((entry) => {
    if (!exactKeys(entry, ["evidence", "signature"]) ||
        typeof entry.signature !== "string" || entry.signature.length > 128) {
      throw new TypeError("REGISTRY_ROUTE_SCHEMA_INVALID");
    }
    return [JSON.parse(canonicalizeQualifiedRouteEvidence(entry.evidence)), entry.signature];
  });
  return JSON.stringify([
    "trusted-route-registry-bundle-v1",
    bundle.schemaVersion, bundle.registryEpoch, bundle.registryVersion,
    bundle.issuedAt, bundle.validUntil, bundle.rootKeyId, issuers, routes
  ]);
}

function orderedUnique(values, keyOf) {
  let previous = "";
  for (const value of values) {
    const key = keyOf(value);
    if (!key || key <= previous) return false;
    previous = key;
  }
  return true;
}

function validBundle(bundle, now) {
  return exactKeys(bundle, BUNDLE_FIELDS) &&
    bundle.schemaVersion === 1 &&
    Number.isSafeInteger(bundle.registryEpoch) && bundle.registryEpoch > 0 &&
    SAFE_ID.test(bundle.registryVersion || "") &&
    Number.isSafeInteger(bundle.issuedAt) && bundle.issuedAt > 0 &&
    Number.isSafeInteger(bundle.validUntil) && bundle.validUntil > now &&
    bundle.validUntil - bundle.issuedAt <= MAX_REGISTRY_LIFETIME_SECONDS &&
    bundle.issuedAt <= now && now - bundle.issuedAt <= MAX_REGISTRY_AGE_SECONDS &&
    SAFE_ID.test(bundle.rootKeyId || "") &&
    Array.isArray(bundle.issuerKeys) && bundle.issuerKeys.length > 0 && bundle.issuerKeys.length <= MAX_ISSUER_KEYS &&
    Array.isArray(bundle.routes) && bundle.routes.length > 0 && bundle.routes.length <= MAX_ROUTES &&
    orderedUnique(bundle.issuerKeys, (x) => isRecord(x) ? `${x.issuerId || ""}/${x.keyId || ""}` : "") &&
    orderedUnique(bundle.routes, (x) => isRecord(x) && isRecord(x.evidence) ? x.evidence.qualificationId || "" : "");
}

function parsePinnedRoot(env, rootKeyId) {
  if (!isRecord(env) || env.ROUTE_REGISTRY_ROOT_KEY_ID !== rootKeyId ||
      typeof env.ROUTE_REGISTRY_ROOT_PUBLIC_JWK !== "string") return null;
  try {
    const jwk = JSON.parse(env.ROUTE_REGISTRY_ROOT_PUBLIC_JWK);
    return validPublicJwk(jwk) ? jwk : null;
  } catch {
    return null;
  }
}

/**
 * Verify a root-signed registry bundle using platform environment bindings.
 * The root public key is deliberately not accepted from the request/bundle.
 * This function establishes bundle authenticity only; persistence, monotonic
 * epoch enforcement and the D1 admission CAS are separate required controls.
 */
export async function verifyTrustedRouteRegistryBundle({
  bundle, signature, env, now
} = {}) {
  if (!Number.isSafeInteger(now) || now <= 0 || !validBundle(bundle, now)) {
    return deny("REGISTRY_BUNDLE_INVALID_OR_STALE");
  }
  const rootJwk = parsePinnedRoot(env, bundle.rootKeyId);
  if (!rootJwk) return deny("REGISTRY_ROOT_NOT_PINNED");

  let canonical;
  try {
    canonical = canonicalizeTrustedRouteRegistryBundle(bundle);
  } catch {
    return deny("REGISTRY_BUNDLE_CANONICALIZATION_FAILED");
  }
  const bytes = new TextEncoder().encode(canonical);
  if (bytes.length > MAX_BUNDLE_BYTES) return deny("REGISTRY_BUNDLE_TOO_LARGE");
  const signatureBytes = decodeBase64Url(signature);
  if (!signatureBytes || signatureBytes.length !== 64) {
    return deny("REGISTRY_SIGNATURE_ENCODING_INVALID");
  }

  try {
    const root = await crypto.subtle.importKey(
      "jwk", rootJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]
    );
    if (!await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" }, root, signatureBytes, bytes
    )) return deny("REGISTRY_ROOT_SIGNATURE_INVALID");
  } catch {
    return deny("REGISTRY_ROOT_SIGNATURE_INVALID");
  }

  const verifiedRoutes = [];
  for (const entry of bundle.routes) {
    const evidence = entry.evidence;
    if (evidence.registryVersion !== bundle.registryVersion) {
      return deny("REGISTRY_ROUTE_VERSION_MISMATCH");
    }
    const issuer = bundle.issuerKeys.find((key) =>
      key.issuerId === evidence.issuerId && key.keyId === evidence.keyId
    );
    if (!issuer || issuer.registryVersion !== bundle.registryVersion) {
      return deny("REGISTRY_ISSUER_KEY_NOT_FOUND");
    }
    const result = await verifyQualifiedRouteEvidence({
      evidence,
      signature: entry.signature,
      trustedIssuer: {
        ...issuer,
        publicKeyJwk: issuer.publicKeyJwk
      },
      trustedRoute: { ...evidence, revokedAt: null },
      now
    });
    if (!result.verified) return deny(result.reason);
    verifiedRoutes.push(result);
  }

  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Object.freeze({
    verified: true,
    dispatch: false,
    registryEpoch: bundle.registryEpoch,
    registryVersion: bundle.registryVersion,
    rootKeyId: bundle.rootKeyId,
    bundleDigest: [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join(""),
    issuerKeyCount: bundle.issuerKeys.length,
    routeCount: verifiedRoutes.length,
    routes: Object.freeze(verifiedRoutes),
    reason: "ROOT_SIGNED_REGISTRY_BUNDLE_VERIFIED"
  });
}

export const trustedRouteRegistryPolicy = Object.freeze({
  schemaVersion: 1,
  signatureAlgorithm: "ES256",
  maxRegistryAgeSeconds: MAX_REGISTRY_AGE_SECONDS,
  maxRegistryLifetimeSeconds: MAX_REGISTRY_LIFETIME_SECONDS,
  maxIssuerKeys: MAX_ISSUER_KEYS,
  maxRoutes: MAX_ROUTES,
  maxBundleBytes: MAX_BUNDLE_BYTES,
  rootKeySource: "platform-environment-binding",
  dispatchEnabled: false
});


/**
 * Verify and durably persist a complete root-signed registry snapshot.
 *
 * Snapshot metadata, the exact bundle/signature, issuer-key records, route
 * qualifications and active singleton pointer are committed in one D1 batch.
 * Existing route rows remain append-only. This writer never enables dispatch.
 * A0 admission must still re-check the active snapshot and issuer-key row in
 * its own D1 batch; persistence alone is not an admission decision.
 */
export async function persistTrustedRouteRegistryBundle({
  db, bundle, signature, env, now
} = {}) {
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    return Object.freeze({ persisted: false, verified: false, dispatch: false, reason: "STORAGE_UNAVAILABLE" });
  }

  const verified = await verifyTrustedRouteRegistryBundle({ bundle, signature, env, now });
  if (!verified.verified) {
    return Object.freeze({ ...verified, persisted: false });
  }

  const bundleJson = JSON.stringify(bundle);
  try {
    const prior = await db.prepare(`
      SELECT bundle_digest, bundle_json
        FROM pool_route_registry_snapshots
       WHERE registry_epoch = ?
    `).bind(verified.registryEpoch).first();
    if (prior) {
      if (prior.bundle_digest !== verified.bundleDigest || prior.bundle_json !== bundleJson) {
        return Object.freeze({
          verified: true, persisted: false, dispatch: false,
          reason: "REGISTRY_EPOCH_ALREADY_BOUND"
        });
      }
      const state = await db.prepare(`
        SELECT current_epoch, current_bundle_digest
          FROM pool_route_registry_state WHERE state_id = 1
      `).first();
      return Object.freeze({
        verified: true, persisted: true, alreadyPersisted: true,
        active: state?.current_epoch === verified.registryEpoch &&
          state?.current_bundle_digest === verified.bundleDigest,
        registryEpoch: verified.registryEpoch,
        bundleDigest: verified.bundleDigest,
        dispatch: false,
        reason: "REGISTRY_SNAPSHOT_ALREADY_PERSISTED"
      });
    }

    const statements = [
      db.prepare(`
        INSERT INTO pool_route_registry_snapshots (
          registry_epoch, registry_version, root_key_id, bundle_digest,
          issued_at, valid_until, accepted_at, issuer_key_count, route_count,
          bundle_json, root_signature
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        verified.registryEpoch, verified.registryVersion, verified.rootKeyId,
        verified.bundleDigest, bundle.issuedAt, bundle.validUntil, now,
        verified.issuerKeyCount, verified.routeCount, bundleJson, signature
      )
    ];

    for (const key of bundle.issuerKeys) {
      statements.push(db.prepare(`
        INSERT INTO pool_route_registry_issuer_keys (
          registry_epoch, bundle_digest, issuer_id, key_id, registry_version,
          status, revoked_at, valid_from, valid_until, public_key_jwk
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        verified.registryEpoch, verified.bundleDigest, key.issuerId, key.keyId,
        key.registryVersion, key.status, key.revokedAt, key.validFrom,
        key.validUntil, JSON.stringify(key.publicKeyJwk)
      ));
    }

    for (let index = 0; index < bundle.routes.length; index += 1) {
      const evidence = bundle.routes[index].evidence;
      const routeProof = verified.routes[index];
      if (!routeProof || routeProof.qualificationId !== evidence.qualificationId) {
        return Object.freeze({
          verified: true, persisted: false, dispatch: false,
          reason: "REGISTRY_VERIFIED_ROUTE_ORDER_MISMATCH"
        });
      }
      statements.push(db.prepare(`
        INSERT INTO pool_route_qualifications (
          schema_version, qualification_id, route_id, provider_id, model_id,
          issuer_id, account_ref, credential_handle_ref, quota_domain_id,
          cost_class, capability_id, capability_profile, evidence_ref,
          evidence_digest, observed_at, valid_until, revocation_version,
          revoked_at, registry_version, issuer_key_id, registry_epoch,
          registry_bundle_digest
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
      `).bind(
        evidence.schemaVersion, evidence.qualificationId, evidence.routeId,
        evidence.providerId, evidence.modelId, evidence.issuerId,
        evidence.accountRef, evidence.credentialHandleRef, evidence.quotaDomainId,
        evidence.costClass, evidence.capabilityId, evidence.capabilityProfile,
        evidence.evidenceRef, routeProof.evidenceDigest, evidence.observedAt,
        evidence.validUntil, evidence.revocationVersion, evidence.registryVersion,
        evidence.keyId, verified.registryEpoch, verified.bundleDigest
      ));
    }

    statements.push(db.prepare(`
      INSERT OR IGNORE INTO pool_route_registry_state (
        state_id, current_epoch, current_bundle_digest,
        current_registry_version, updated_at
      ) VALUES (1, ?, ?, ?, ?)
    `).bind(
      verified.registryEpoch, verified.bundleDigest, verified.registryVersion, now
    ));
    statements.push(db.prepare(`
      UPDATE pool_route_registry_state
         SET current_epoch = ?, current_bundle_digest = ?,
             current_registry_version = ?, updated_at = ?
       WHERE state_id = 1 AND current_epoch < ?
    `).bind(
      verified.registryEpoch, verified.bundleDigest, verified.registryVersion,
      now, verified.registryEpoch
    ));

    await db.batch(statements);
    const state = await db.prepare(`
      SELECT current_epoch, current_bundle_digest
        FROM pool_route_registry_state WHERE state_id = 1
    `).first();
    const active = state?.current_epoch === verified.registryEpoch &&
      state?.current_bundle_digest === verified.bundleDigest;
    if (!active) {
      return Object.freeze({
        verified: true, persisted: false, dispatch: false,
        reason: "REGISTRY_ACTIVE_POINTER_NOT_ADVANCED"
      });
    }
    return Object.freeze({
      verified: true, persisted: true, alreadyPersisted: false,
      active: true, registryEpoch: verified.registryEpoch,
      bundleDigest: verified.bundleDigest, dispatch: false,
      reason: "ROOT_SIGNED_REGISTRY_SNAPSHOT_PERSISTED"
    });
  } catch {
    return Object.freeze({
      verified: true, persisted: false, dispatch: false,
      reason: "REGISTRY_PERSISTENCE_FAILED"
    });
  }
}
