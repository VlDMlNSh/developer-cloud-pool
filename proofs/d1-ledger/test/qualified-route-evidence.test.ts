import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalizeQualifiedRouteEvidence,
  qualifiedRouteEvidencePolicy,
  verifyQualifiedRouteEvidence
} from "../src/qualified-route-evidence.mjs";

const NOW = 1_800_000_000;
const evidence = {
  schemaVersion: 1,
  qualificationId: "qualification-001",
  routeId: "route-a",
  providerId: "provider-a",
  modelId: "model-a",
  issuerId: "issuer-a",
  keyId: "key-2026-01",
  accountRef: "account-a",
  credentialHandleRef: "handle-a",
  quotaDomainId: "quota-a",
  costClass: "free_quota",
  capabilityId: "pool.execute",
  capabilityProfile: "dsh-headless-probe",
  evidenceRef: "evidence://provider/123",
  observedAt: NOW,
  validUntil: NOW + 3600,
  revocationVersion: 7,
  registryVersion: "registry-v3",
  status: "qualified"
};

let privateKey;
let publicKeyJwk;
let signature;

function routeRecord(overrides = {}) {
  return {
    ...evidence,
    status: "qualified",
    revokedAt: null,
    ...overrides
  };
}

function issuerRecord(overrides = {}) {
  return {
    issuerId: evidence.issuerId,
    keyId: evidence.keyId,
    registryVersion: evidence.registryVersion,
    status: "active",
    revokedAt: null,
    validFrom: NOW - 100,
    validUntil: NOW + 7200,
    publicKeyJwk,
    ...overrides
  };
}

function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sign(record) {
  const bytes = new TextEncoder().encode(canonicalizeQualifiedRouteEvidence(record));
  return base64url(await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, bytes
  ));
}

async function verify(overrides = {}) {
  return verifyQualifiedRouteEvidence({
    evidence,
    signature,
    trustedRoute: routeRecord(),
    trustedIssuer: issuerRecord(),
    now: NOW,
    ...overrides
  });
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  privateKey = pair.privateKey;
  publicKeyJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  signature = await sign(evidence);
});

describe("Qualified Route Evidence v1 canonicalization and ES256 verifier", () => {
  it("publishes a fixed canonical byte vector and SHA-256 digest", async () => {
    const canonical = canonicalizeQualifiedRouteEvidence(evidence);
    expect(canonical).toBe(
      '["qualified-route-evidence-v1",1,"qualification-001","route-a","provider-a","model-a","issuer-a","key-2026-01","account-a","handle-a","quota-a","free_quota","pool.execute","dsh-headless-probe","evidence://provider/123",1800000000,1800003600,7,"registry-v3","qualified"]'
    );
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    expect([...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join(""))
      .toBe("3d409b69df838b6ba0826a950c7d43940b5127aba25fc320b192d9c2b33d43da");
    expect(qualifiedRouteEvidencePolicy).toMatchObject({
      schemaVersion: 1, signatureAlgorithm: "ES256", maxEvidenceAgeSeconds: 300
    });
  });

  it("verifies a signed evidence record against the exact trusted route and issuer snapshot", async () => {
    const result = await verify();
    expect(result).toMatchObject({
      verified: true, dispatch: false, qualificationId: evidence.qualificationId,
      issuerId: evidence.issuerId, keyId: evidence.keyId,
      evidenceDigest: "3d409b69df838b6ba0826a950c7d43940b5127aba25fc320b192d9c2b33d43da"
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.route)).toBe(true);
  });

  it("rejects a modified signature", async () => {
    const binary = signature.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Uint8Array.from(
      atob(binary + "=".repeat((4 - binary.length % 4) % 4)),
      character => character.charCodeAt(0)
    );
    decoded[0] ^= 1;
    const changed = base64url(decoded);
    expect(await verify({ signature: changed })).toMatchObject({
      verified: false, dispatch: false, reason: "ISSUER_SIGNATURE_INVALID"
    });
  });

  it("rejects issuer substitution and key rotation mismatch", async () => {
    expect(await verify({
      trustedIssuer: issuerRecord({ issuerId: "issuer-substitute" })
    })).toMatchObject({ verified: false, reason: "ISSUER_TRUST_BINDING_INVALID" });
    expect(await verify({
      trustedIssuer: issuerRecord({ keyId: "rotated-key" })
    })).toMatchObject({ verified: false, reason: "ISSUER_TRUST_BINDING_INVALID" });
  });

  it("rejects cross-account and cross-quota-domain replay", async () => {
    expect(await verify({
      trustedRoute: routeRecord({ accountRef: "account-other" })
    })).toMatchObject({ verified: false, reason: "ROUTE_REGISTRY_BINDING_MISMATCH" });
    expect(await verify({
      trustedRoute: routeRecord({ quotaDomainId: "quota-other" })
    })).toMatchObject({ verified: false, reason: "ROUTE_REGISTRY_BINDING_MISMATCH" });
  });

  it("rejects a stale or expired evidence record", async () => {
    expect(await verify({ now: NOW + 301 })).toMatchObject({
      verified: false, reason: "EVIDENCE_INVALID_OR_STALE"
    });
    expect(await verify({ now: NOW + 3600 })).toMatchObject({
      verified: false, reason: "EVIDENCE_INVALID_OR_STALE"
    });
  });

  it("rejects revocation and a stale revocation watermark", async () => {
    expect(await verify({
      trustedRoute: routeRecord({ status: "revoked", revokedAt: NOW + 1, revocationVersion: 8 })
    })).toMatchObject({ verified: false, reason: "ROUTE_REGISTRY_BINDING_MISMATCH" });
    expect(await verify({
      trustedRoute: routeRecord({ revocationVersion: 8 })
    })).toMatchObject({ verified: false, reason: "ROUTE_REGISTRY_BINDING_MISMATCH" });
  });

  it("rejects unknown fields so unsigned extensions cannot alter interpretation", async () => {
    const extended = { ...evidence, callerAuthority: "provider" };
    expect(await verify({ evidence: extended })).toMatchObject({
      verified: false, reason: "EVIDENCE_INVALID_OR_STALE"
    });
  });

  it("rejects free-quota evidence without a quota domain", async () => {
    const malformed = { ...evidence, quotaDomainId: null };
    expect(await verify({ evidence: malformed })).toMatchObject({
      verified: false, reason: "EVIDENCE_INVALID_OR_STALE"
    });
  });

  it("rejects an expired issuer key even when evidence itself is fresh", async () => {
    expect(await verify({
      trustedIssuer: issuerRecord({ validUntil: NOW })
    })).toMatchObject({ verified: false, reason: "ISSUER_TRUST_BINDING_INVALID" });
  });
});
