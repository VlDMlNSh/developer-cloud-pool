import { beforeAll, describe, expect, it } from "vitest";
import { canonicalizeQualifiedRouteEvidence } from "../src/qualified-route-evidence.mjs";
import {
  canonicalizeTrustedRouteRegistryBundle,
  trustedRouteRegistryPolicy,
  verifyTrustedRouteRegistryBundle
} from "../src/trusted-route-registry.mjs";

const NOW = 1_800_000_000;
const evidence = {
  schemaVersion: 1, qualificationId: "qualification-001", routeId: "route-a",
  providerId: "provider-a", modelId: "model-a", issuerId: "issuer-a",
  keyId: "key-2026-01", accountRef: "account-a", credentialHandleRef: "handle-a",
  quotaDomainId: "quota-a", costClass: "free_quota", capabilityId: "pool.execute",
  capabilityProfile: "dsh-headless-probe", evidenceRef: "evidence://provider/123",
  observedAt: NOW, validUntil: NOW + 3600, revocationVersion: 7,
  registryVersion: "registry-v3", status: "qualified"
};

let rootPrivate;
let rootPublic;
let issuerPrivate;
let issuerPublic;

function publicOnly(jwk) {
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
}

function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sign(privateKey, bytes) {
  return base64url(await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, bytes
  ));
}

let bundle;
let routeSignature;
let rootSignature;
let env;

async function resignBundle() {
  rootSignature = await sign(
    rootPrivate,
    new TextEncoder().encode(canonicalizeTrustedRouteRegistryBundle(bundle))
  );
}

beforeAll(async () => {
  const root = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  const issuer = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
  );
  rootPrivate = root.privateKey;
  rootPublic = publicOnly(await crypto.subtle.exportKey("jwk", root.publicKey));
  issuerPrivate = issuer.privateKey;
  issuerPublic = publicOnly(await crypto.subtle.exportKey("jwk", issuer.publicKey));
  routeSignature = await sign(
    issuerPrivate,
    new TextEncoder().encode(canonicalizeQualifiedRouteEvidence(evidence))
  );
  bundle = {
    schemaVersion: 1,
    registryEpoch: 3,
    registryVersion: "registry-v3",
    issuedAt: NOW,
    validUntil: NOW + 240,
    rootKeyId: "pool-root-2026",
    issuerKeys: [{
      issuerId: "issuer-a", keyId: "key-2026-01",
      registryVersion: "registry-v3", status: "active", revokedAt: null,
      validFrom: NOW - 100, validUntil: NOW + 7200,
      publicKeyJwk: issuerPublic
    }],
    routes: [{ evidence, signature: routeSignature }]
  };
  env = {
    ROUTE_REGISTRY_ROOT_KEY_ID: "pool-root-2026",
    ROUTE_REGISTRY_ROOT_PUBLIC_JWK: JSON.stringify(rootPublic)
  };
  await resignBundle();
});

describe("root-signed route registry bundle v1", () => {
  it("verifies root signature, issuer signature and route bindings", async () => {
    const result = await verifyTrustedRouteRegistryBundle({
      bundle, signature: rootSignature, env, now: NOW
    });
    expect(result).toMatchObject({
      verified: true, dispatch: false, registryEpoch: 3,
      registryVersion: "registry-v3", rootKeyId: "pool-root-2026",
      issuerKeyCount: 1, routeCount: 1,
      reason: "ROOT_SIGNED_REGISTRY_BUNDLE_VERIFIED"
    });
    expect(result.bundleDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.routes)).toBe(true);
    expect(trustedRouteRegistryPolicy).toMatchObject({
      schemaVersion: 1, signatureAlgorithm: "ES256",
      rootKeySource: "platform-environment-binding", dispatchEnabled: false
    });
  });

  it("rejects a changed root signature", async () => {
    const raw = rootSignature.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(
      atob(raw + "=".repeat((4 - raw.length % 4) % 4)),
      (character) => character.charCodeAt(0)
    );
    bytes[0] ^= 1;
    const altered = base64url(bytes);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle, signature: altered, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROOT_SIGNATURE_INVALID" });
  });

  it("rejects an unpinned or substituted root key", async () => {
    expect(await verifyTrustedRouteRegistryBundle({
      bundle, signature: rootSignature,
      env: { ...env, ROUTE_REGISTRY_ROOT_KEY_ID: "other-root" }, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROOT_NOT_PINNED" });
    expect(await verifyTrustedRouteRegistryBundle({
      bundle, signature: rootSignature,
      env: { ...env, ROUTE_REGISTRY_ROOT_PUBLIC_JWK: JSON.stringify(issuerPublic) }, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROOT_SIGNATURE_INVALID" });
  });

  it("rejects private key material in the configured root binding", async () => {
    const privateJwk = await crypto.subtle.exportKey("jwk", rootPrivate);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle, signature: rootSignature,
      env: { ...env, ROUTE_REGISTRY_ROOT_PUBLIC_JWK: JSON.stringify(privateJwk) },
      now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROOT_NOT_PINNED" });
  });

  it("rejects stale and expired registry snapshots", async () => {
    expect(await verifyTrustedRouteRegistryBundle({
      bundle, signature: rootSignature, env, now: NOW + 301
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: { ...bundle, validUntil: NOW }, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
  });

  it("rejects registry bundles exceeding issuer-key fanout limits", async () => {
    const oversized = {
      ...bundle,
      issuerKeys: Array.from({ length: 65 }, (_, index) => ({
        ...bundle.issuerKeys[0],
        issuerId: `issuer-${String(index).padStart(3, "0")}`
      }))
    };
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: oversized, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
  });

  it("rejects unsigned registry-version changes", async () => {
    const changed = { ...bundle, registryVersion: "registry-v4" };
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: changed, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROOT_SIGNATURE_INVALID" });
  });

  it("rejects route records not bound to the signed registry version", async () => {
    const changedEvidence = { ...evidence, registryVersion: "registry-v2" };
    const changed = {
      ...bundle,
      routes: [{ evidence: changedEvidence, signature: routeSignature }]
    };
    await resignBundleFor(changed);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: changed, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_ROUTE_VERSION_MISMATCH" });
  });

  it("rejects an issuer key substitution inside a root-signed registry", async () => {
    const changed = {
      ...bundle,
      issuerKeys: [{ ...bundle.issuerKeys[0], publicKeyJwk: rootPublic }]
    };
    await resignBundleFor(changed);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: changed, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "ISSUER_SIGNATURE_INVALID" });
  });

  it("rejects an unknown field and duplicate or unsorted identities", async () => {
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: { ...bundle, authority: "caller-claimed" },
      signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
    const duplicate = { ...bundle, issuerKeys: [...bundle.issuerKeys, ...bundle.issuerKeys] };
    await resignBundleFor(duplicate);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: duplicate, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
  });

  it("rejects a missing issuer key and a modified route signature", async () => {
    const noIssuer = { ...bundle, issuerKeys: [] };
    await resignBundleFor(noIssuer);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: noIssuer, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "REGISTRY_BUNDLE_INVALID_OR_STALE" });
    const badRoute = { ...bundle, routes: [{ evidence, signature: "invalid" }] };
    await resignBundleFor(badRoute);
    expect(await verifyTrustedRouteRegistryBundle({
      bundle: badRoute, signature: rootSignature, env, now: NOW
    })).toMatchObject({ verified: false, reason: "SIGNATURE_ENCODING_INVALID" });
  });
});

async function resignBundleFor(value) {
  const signature = await sign(
    rootPrivate,
    new TextEncoder().encode(canonicalizeTrustedRouteRegistryBundle(value))
  );
  rootSignature = signature;
}
