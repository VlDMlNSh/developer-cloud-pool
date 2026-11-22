# Pass 41 — JOSE verifier integration gate and runtime validation

Date: 2026-11-22  
Status: DESIGN REVIEW VERIFIED; IMPLEMENTATION NOT STARTED; NOT QUALIFIED

## Immutable target and restored state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD read-back: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- PR #165 implementation head: `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`
- PR #165 remains OPEN / DRAFT / UNMERGED.
- Pass 40 research report blob: `8686e5f96eecf873c5a91555d3c4fc3c3ea3e466`
- New documentation branch starts at `c3c48891982d4868f97c328369a9e244cf7b7146` (Pass 40 checkpoint commit).

## Pass 41 objective

Convert Pass 40's mature-library research into an implementation boundary that can be safely used for a later, testable prototype. No cryptographic implementation is to be improvised and no production trust configuration is to be invented.

## Source and dependency review

- D1 proof manifest blob: `d970b887f52eb1011e3df74b560ad9a35bb25866`; currently lists Vitest and Cloudflare Vitest plugin only.
- D1 lockfile blob: `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`; no jose dependency.
- Reconciliation adapter blob: `fe4102eae2038b98be3220bb2961fa433bb9b4b0`; accepts injected `verifyEvidence` and `trustedClock`, and explicitly does not implement cryptographic verification.
- Reconciliation tests blob: `b6cb31bd7e33e5934c005b3268b44de8792e5597`; current verifier tests use synthetic injected claims, not signed JWTs.
- Candidate upstream: `panva/jose`, release `6.2.18`, MIT, zero dependencies, ESM, Cloudflare Workers support.
- Official API documentation confirms `jwtVerify` validates compact JWT signatures and claims; `createRemoteJWKSet` resolves keys from a configured HTTPS JWKS URL, observes alg/kid/use/key_ops, and requires one matching key. Remote JWKS options include cache age, cooldown, timeout and customFetch.
- Sources:
  - https://github.com/panva/jose
  - https://jsr.io/@panva/jose/doc/jwks/remote
  - https://jsr.io/@panva/jose/doc/jwt/verify
  - https://github.com/panva/jose/blob/main/docs/jwks/remote/variables/customFetch.md

## Integration contract — proposed, not implemented

1. Pin `jose` to an exact reviewed version and commit its package-lock integrity. No floating semver or runtime-time package installation.
2. Trusted issuer configuration is constructed only from deployment-controlled configuration. It contains exact issuer, exact audience, fixed HTTPS JWKS URL, explicit algorithm allowlist, required token type/profile, bounded token lifetime, clock tolerance, JWKS cache age/cooldown/timeout, and a trust-config version.
3. Reject non-HTTPS JWKS URLs, URL credentials, fragments, unexpected ports, unapproved hosts, and any issuer/JWKS URL derived from token claims. Do not use JWT `jku` or `x5u` headers for key discovery.
4. Use `jwtVerify` with explicit `issuer`, `audience`, `algorithms`, `maxTokenAge`, and bounded `clockTolerance`. Enforce the expected protected-header `typ` and required claims after verification. Never accept `alg=none`.
5. Construct one remote JWKS resolver per immutable issuer-config version. Set bounded cacheMaxAge, cooldownDuration and timeoutDuration. Do not persist a mutable untrusted JWKS cache.
6. A `customFetch` wrapper may only issue GET to the exact configured JWKS URL, must preserve manual redirect handling, and must reject redirects, unexpected response types, non-200 responses and oversized payloads. It must not log token, response body, or key material. Verify the installed jose version's actual fetch behavior in tests before relying on it.
7. After signature and standard claim verification, retain the existing Pool-specific checks: exact `pool.attempt.reconcile` capability, task key, attempt ID, lease generation, evidence digest, JTI, observation time, decision constraints and trusted clock. JOSE verification does not grant Pool authority.
8. JTI uniqueness/replay scope remains durable in D1. A unique `(issuer_id, evidence_jti)` constraint is not a substitute for issuer allowlisting or safe key lifecycle.
9. Any verifier/config/JWKS/clock error must deny. No task, attempt, lease, queue or outbox mutation; no retry authorization; no dispatch or execution authorization.

## Required deterministic test matrix before integration

- Valid synthetic RS256 token with matching issuer/audience and pinned JWKS.
- Wrong issuer, wrong audience, missing issuer/audience, wrong `typ`, missing required claims.
- `alg=none`, disallowed algorithm, key-type mismatch, `use`/key_ops mismatch.
- Invalid signature, altered payload, malformed compact serialization, duplicate/unknown kid and multiple matching keys.
- Expired, not-yet-valid, future-issued, excessive lifetime and clock-skew boundaries.
- JWKS redirect, wrong host/path, non-200, malformed JSON, duplicate keys, oversized body, timeout, network outage and stale-cache behavior.
- Key rollover with bounded overlap; removed key with warm cache; emergency cache invalidation and issuer config version change.
- Same JTI replay, same JTI under different issuer, concurrent duplicate attempts and durable D1 uniqueness.
- Missing trust config, invalid config, unavailable clock and thrown verifier errors.
- Every negative test asserts no database write and `dispatch=false`, `executionAuthorized=false`, `retryAuthorized=false`.

## Pass 41 execution result and limitations

- Re-read current default branch metadata, default HEAD, PR #165, PR reviews/comments, Pass 40 report, D1 manifest/lockfile, adapter and tests.
- Confirmed PR #165 has a COMMENTED review, not an approval. Owner's review sequencing note in Issue #96 says independent/external review is deferred until the pool can operate its own bounded review workflow. Therefore do not request an external review now; keep the gate explicitly NOT VERIFIED.
- Confirmed corrected PR merge-result CI: D1 run `45032534259` SUCCESS (6 test files; 61 tests per recorded log); Pool Contract run `45032534262` SUCCESS and `POOL_CONTRACT_VALIDATION=PASS`. These are merge-result checks, not standalone head-only CI.
- Attempted a read-only git clone of the exact implementation branch for local package-lock generation and test execution. The execution environment could not resolve `github.com`; clone failed before checkout. No local test execution or source mutation was claimed.
- No code, package manifest or lockfile changed. No real issuer/JWKS request, no credentials, no hosted D1, no provider call, no dispatch and no deployment.
- Gemini dispatch: NOT RUN. The approved trusted-main controller/dispatch gates were not requalified in this pass; do not bypass them.

## Disposition

- Mature component selection: VERIFIED as research.
- Integration contract: DOCUMENTED; not implementation.
- JOSE verifier: PLANNED / NOT IMPLEMENTED.
- PR #165: OPEN / DRAFT / UNMERGED.
- Production trust boundary: NOT QUALIFIED.
- Contour A: NOT ACCEPTED.
- Contour B: DEFERRED.

## Next concrete step

When a repository-connected writable/test environment is available, create a separate clean-base prototype branch from the exact frozen base, pin `jose` and lockfile integrity, implement only the injected verifier adapter (not live production issuer config), and add deterministic synthetic signed-JWT/JWKS tests. Run exact-head CI and inspect logs before considering integration into PR #165. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
