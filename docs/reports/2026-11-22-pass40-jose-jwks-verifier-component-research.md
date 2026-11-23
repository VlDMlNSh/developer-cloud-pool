# Pass 40 — production JWT/JWKS verifier component research

Date: 2026-11-22  
Status: RESEARCH VERIFIED; NO IMPLEMENTATION; NOT QUALIFIED; NOT ACCEPTED

## Immutable project target and restored state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD at start: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- PR #165 head: `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`
- PR #165 frozen base: `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`
- Pass 39 documentation branch: `docs/pass39-reconciliation-review-2026-11-22`

## Current PR and CI revalidation

PR #165 is OPEN / DRAFT / UNMERGED. Its only review submission is the Pass 39 COMMENT review `6012744917`; it is not an approval and not an independent third-party review.

Recorded corrected PR merge-result workflows:
- D1 Ledger run `45032534259`: COMPLETED / SUCCESS; prior job evidence records 6 test files and 61/61 tests.
- Pool Contract run `45032534262`: COMPLETED / SUCCESS; `POOL_CONTRACT_VALIDATION=PASS`; dispatch observed false.
- These are merge-result checks. Standalone head-only checkout validation is NOT VERIFIED.

## Existing trust seam

- D1 package metadata blob: `d970b887f52eb1011e3df74b560ad9a35bb25866`. The package currently lists Vitest and the Cloudflare Vitest plugin as dev dependencies; no JOSE/JWT runtime dependency is present.
- Reconciliation adapter blob: `fe4102eae2038b98be3220bb2961fa433bb9b4b0`. It still receives `verifyEvidence` and `trustedClock` as injected functions. This is an explicit seam, not a production verifier.

## Mature GitHub component research

### 1. panva/jose — primary candidate for the cryptographic seam

- Repository: https://github.com/panva/jose
- Latest observed release: `6.2.18`
- Latest observed commit: `d1e200f22d2bc66cd2ed6cc48fc622b6f1765cc5` (2026-11-18)
- Package metadata blob: `e9a010bb08bcefc02f5607e8623f0bb6af10c0e0`
- License file blob: `d0ec038a85d95944b66fec1b44cbb1ade45919b7` (MIT)
- Package metadata reports zero dependencies, ESM, and runtime support including Cloudflare Workers.
- Relevant APIs: `jwtVerify`, `createRemoteJWKSet`, local JWKS support, explicit issuer/audience validation and JWS signature verification.
- Remote JWKS key selection considers `alg`, `kid`, `use`, and `key_ops`; refresh is cooldown-limited.
- Important limitation: jose is a JOSE primitive, not an application authorization framework. Its threat model leaves trusted JWKS URL selection, transport/network policy, cache protection and authorization policy to the integrator. A removed key is not necessarily immediately revoked while a cached JWKS remains valid.

### 2. panva/oauth4webapi — protocol-layer candidate, not a substitute for custom claims

- Repository: https://github.com/panva/oauth4webapi
- Latest observed release: `3.8.9`
- Latest observed commit: `aa7e6e889fd64a325adbef651419326e8a3266e7` (2026-11-20)
- Package metadata blob: `8e15037613147842f88779f92a6668cafb994ae6`
- License file blob: `5623d3a79393f1d8b4a50ff4f9c1e405501d0504` (MIT)
- Package metadata reports zero dependencies, ESM, and Cloudflare Workers compatibility.
- README documents OAuth/OIDC metadata discovery, authorization code + PKCE, token introspection/revocation and incoming JWT access-token validation.
- Appropriate for OAuth/OIDC protocol flows. It does not remove the need to enforce the Pool-specific `pool.attempt.reconcile` capability and exact task/attempt/generation bindings.

## Decision

Prefer a small production verifier adapter built around pinned `jose` rather than writing custom cryptographic/JWKS code. Do not add it until a bounded prototype and adversarial tests pass.

The trusted issuer configuration must be immutable and server-owned: exact issuer, audience, fixed HTTPS JWKS URI, explicit algorithm allowlist, required token profile/type, bounded lifetime, clock tolerance and JWKS cache policy. Never derive discovery/JWKS URLs from untrusted token claims or permit arbitrary redirects/hosts. Keep Pool capability and resource-binding checks in the existing reconciliation adapter after cryptographic and standard claim verification.

Key lifecycle must explicitly define:
- planned rollover with bounded overlap of old/new public keys;
- behavior for unknown `kid` and refresh cooldown;
- emergency revocation/cache invalidation and maximum stale-key window;
- issuer removal and trust-config versioning;
- JWKS fetch failure, malformed response, timeout, oversized body and redirect rejection;
- JTI uniqueness/replay scope and durable replay protection in D1.

## Required adversarial test matrix

Wrong issuer; wrong audience; `alg=none`; disallowed algorithm; key-type/use/key_ops mismatch; unknown/duplicate `kid`; invalid signature and modified payload; expired/not-yet-valid token; excessive token lifetime; clock skew boundary; replayed JTI for same and different issuer scopes; key rollover overlap; removed key with warm cache; JWKS outage; timeout; redirect; oversized/malformed JWKS; missing trust configuration; unavailable trusted clock. All failures must deny without state transition, retry authorization or dispatch.

## Work performed and non-actions

- Revalidated repository metadata, default HEAD, PR #165, review submissions and recorded corrected merge-result workflows.
- Read the exact D1 package manifest and reconciliation adapter from PR #165 branch.
- Inspected mature upstream repositories, package metadata, license files, current release/commit metadata and protocol/JWKS documentation.
- No implementation or dependency changes.
- No Gemini dispatch: NOT RUN; this pass was limited to research and documentation.
- No secret values read, no real issuer/JWKS calls, no provider calls, no hosted D1, no dispatch, no deployment, no paid resources.

## Disposition

Research pass: VERIFIED.  
Production verifier: PLANNED / NOT IMPLEMENTED.  
PR #165: KEEP DRAFT.  
Contour A: NOT ACCEPTED.  
Contour B: DEFERRED.

Next: implement a no-secret local verifier prototype using pinned `jose` only after the repository runtime/toolchain is checked; add deterministic synthetic JWKS/key-rotation/revocation tests; then request independent review. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
