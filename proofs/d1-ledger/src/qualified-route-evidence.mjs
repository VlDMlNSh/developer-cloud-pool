const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;
const EVIDENCE_FIELDS = [
  "schemaVersion", "qualificationId", "routeId", "providerId", "modelId",
  "issuerId", "keyId", "accountRef", "credentialHandleRef", "quotaDomainId",
  "costClass", "capabilityId", "capabilityProfile", "evidenceRef",
  "observedAt", "validUntil", "revocationVersion", "registryVersion", "status"
];
const MAX_EVIDENCE_AGE_SECONDS = 300;
const deny = (reason) => ({ verified: false, dispatch: false, reason });

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validEvidence(evidence, now) {
  if (!isRecord(evidence) || !Number.isSafeInteger(now) || now <= 0) return false;
  const keys = Object.keys(evidence).sort();
  if (keys.length !== EVIDENCE_FIELDS.length ||
      keys.some((key, index) => key !== [...EVIDENCE_FIELDS].sort()[index])) return false;
  if (evidence.schemaVersion !== 1 || evidence.status !== "qualified") return false;
  for (const key of [
    "qualificationId", "routeId", "providerId", "modelId", "issuerId", "keyId",
    "accountRef", "credentialHandleRef", "capabilityId", "capabilityProfile",
    "registryVersion"
  ]) if (!SAFE_ID.test(evidence[key] || "")) return false;
  if (typeof evidence.evidenceRef !== "string" ||
      evidence.evidenceRef.length < 1 || evidence.evidenceRef.length > 512) return false;
  if (evidence.quotaDomainId !== null &&
      !SAFE_ID.test(evidence.quotaDomainId || "")) return false;
  if (!["local", "free_quota"].includes(evidence.costClass)) return false;
  if (evidence.costClass === "free_quota" && evidence.quotaDomainId === null) return false;
  if (!Number.isSafeInteger(evidence.observedAt) || evidence.observedAt <= 0 ||
      !Number.isSafeInteger(evidence.validUntil) || evidence.validUntil <= evidence.observedAt ||
      !Number.isSafeInteger(evidence.revocationVersion) || evidence.revocationVersion < 0) return false;
  return evidence.observedAt <= now &&
    now - evidence.observedAt <= MAX_EVIDENCE_AGE_SECONDS &&
    evidence.validUntil > now;
}

/**
 * Version 1 canonical bytes are UTF-8 JSON for a fixed-position array.
 * Field names are intentionally excluded; position and null representation
 * are fixed by EVIDENCE_FIELDS. Unknown object keys are rejected before use.
 */
export function canonicalizeQualifiedRouteEvidence(evidence) {
  if (!isRecord(evidence)) throw new TypeError("EVIDENCE_NOT_OBJECT");
  const values = EVIDENCE_FIELDS.map((field) => evidence[field] ?? null);
  return JSON.stringify(["qualified-route-evidence-v1", ...values]);
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    let encoded = "";
    for (const byte of bytes) encoded += String.fromCharCode(byte);
    const canonical = btoa(encoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return canonical === value ? bytes : null;
  } catch {
    return null;
  }
}

function sameRoute(evidence, route) {
  return isRecord(route) &&
    route.status === "qualified" && route.revokedAt === null &&
    route.schemaVersion === evidence.schemaVersion &&
    route.qualificationId === evidence.qualificationId &&
    route.routeId === evidence.routeId &&
    route.providerId === evidence.providerId &&
    route.modelId === evidence.modelId &&
    route.issuerId === evidence.issuerId &&
    route.keyId === evidence.keyId &&
    route.accountRef === evidence.accountRef &&
    route.credentialHandleRef === evidence.credentialHandleRef &&
    route.quotaDomainId === evidence.quotaDomainId &&
    route.costClass === evidence.costClass &&
    route.capabilityId === evidence.capabilityId &&
    route.capabilityProfile === evidence.capabilityProfile &&
    route.registryVersion === evidence.registryVersion &&
    route.revocationVersion === evidence.revocationVersion;
}

function validIssuer(evidence, issuer, now) {
  return isRecord(issuer) &&
    issuer.status === "active" && issuer.revokedAt === null &&
    issuer.issuerId === evidence.issuerId && issuer.keyId === evidence.keyId &&
    issuer.registryVersion === evidence.registryVersion &&
    Number.isSafeInteger(issuer.validFrom) && issuer.validFrom <= now &&
    Number.isSafeInteger(issuer.validUntil) && issuer.validUntil > now &&
    isRecord(issuer.publicKeyJwk) &&
    issuer.publicKeyJwk.kty === "EC" && issuer.publicKeyJwk.crv === "P-256" &&
    typeof issuer.publicKeyJwk.x === "string" &&
    typeof issuer.publicKeyJwk.y === "string";
}

/**
 * Verify detached ES256 evidence against a caller-supplied trust snapshot.
 * Production callers MUST obtain trustedRoute/trustedIssuer from a pinned,
 * access-controlled authority and re-check its version/revocation watermark
 * inside the same durable admission consistency boundary. This function
 * alone does not establish that the supplied trust snapshot is authoritative.
 */
export async function verifyQualifiedRouteEvidence({
  evidence, signature, trustedRoute, trustedIssuer, now
} = {}) {
  if (!validEvidence(evidence, now)) return deny("EVIDENCE_INVALID_OR_STALE");
  if (!sameRoute(evidence, trustedRoute)) return deny("ROUTE_REGISTRY_BINDING_MISMATCH");
  if (!validIssuer(evidence, trustedIssuer, now)) return deny("ISSUER_TRUST_BINDING_INVALID");

  const bytes = new TextEncoder().encode(canonicalizeQualifiedRouteEvidence(evidence));
  const evidenceDigest = await sha256Hex(bytes);
  if (!SHA256_HEX.test(evidenceDigest)) return deny("EVIDENCE_DIGEST_INVALID");
  const signatureBytes = decodeBase64Url(signature);
  if (!signatureBytes || signatureBytes.length !== 64) return deny("SIGNATURE_ENCODING_INVALID");

  try {
    const key = await crypto.subtle.importKey(
      "jwk", trustedIssuer.publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]
    );
    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" }, key, signatureBytes, bytes
    );
    if (!valid) return deny("ISSUER_SIGNATURE_INVALID");
  } catch {
    return deny("ISSUER_SIGNATURE_INVALID");
  }

  return Object.freeze({
    verified: true,
    dispatch: false,
    evidenceDigest,
    qualificationId: evidence.qualificationId,
    issuerId: evidence.issuerId,
    keyId: evidence.keyId,
    route: Object.freeze({ ...evidence }),
    reason: "SIGNED_ROUTE_EVIDENCE_VERIFIED"
  });
}

export const qualifiedRouteEvidencePolicy = Object.freeze({
  schemaVersion: 1,
  signatureAlgorithm: "ES256",
  maxEvidenceAgeSeconds: MAX_EVIDENCE_AGE_SECONDS,
  canonicalEncoding: "UTF-8 JSON fixed-position array"
});
