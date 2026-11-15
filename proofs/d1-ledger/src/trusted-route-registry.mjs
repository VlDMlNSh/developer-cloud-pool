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
  return btoa(binary).replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_");
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
    if (!exactKeys(entry, ["evidence", "signature"])) {
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
    bundle.validUntil - bundle.issuedAt <= 3600 &&
    bundle.issuedAt <= now && now - bundle.issuedAt <= MAX_REGISTRY_AGE_SECONDS &&
    SAFE_ID.test(bundle.rootKeyId || "") &&
    Array.isArray(bundle.issuerKeys) && bundle.issuerKeys.length > 0 &&
    Array.isArray(bundle.routes) && bundle.routes.length > 0 &&
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
  rootKeySource: "platform-environment-binding",
  dispatchEnabled: false
});
