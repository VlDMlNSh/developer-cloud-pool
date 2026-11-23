# Pass 49 — reconciliation pre-write expiry revalidation and security review

Date: 2026-11-23
Status: CODE FIX VERIFIED; EXACT-HEAD CI VERIFIED; INDEPENDENT REVIEW NOT RUN; NOT QUALIFIED; NOT ACCEPTED

## Immutable state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Frozen PR base: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- Previous integration head: `c248241f4cc64f703cfb62679a665a921504d3e3`
- Pass 49 integration head: `5450ddd8002d7a336b3eb41adeaba1d62a17fb75`
- Integration branch: `integration/pass48-current-base-d1-2026-11-23`
- PR #168: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168
- PR #168 remains OPEN / DRAFT / UNMERGED, base unchanged, head updated to the Pass 49 commit.

## Scope of Pass 49

The pass continued the security review of the issuer-bound reconciliation adapter and migration 0015. No production trust configuration, secret, hosted D1, dispatch, provider call, deployment or merge was used.

### Finding: a second asynchronous boundary remained before the durable write

Pass 48 revalidated JWT time claims after the asynchronous signature/JWKS verifier. The adapter then awaited a primary D1 precondition read before inserting the durable reconciliation decision. A token could expire during that D1 read; the pre-write path still relied on the earlier timestamp.

### Correction

In `proofs/d1-ledger/src/record-attempt-reconciliation.mjs`:
1. Keep the post-verifier clock sample and validation.
2. After the asynchronous primary precondition read succeeds, sample the trusted clock again immediately before the first durable mutation.
3. Fail closed for invalid, non-positive or backwards time.
4. Normalize the verified claims again against this final pre-write timestamp.
5. Use that timestamp for `verified_at` and exact primary readback comparison.

In `proofs/d1-ledger/test/reconciliation.test.ts`:
- Added deterministic test where evidence expires during the asynchronous primary precondition read.
- The test asserts the third trusted-clock read occurs, decision is DENY, and no reconciliation decision row is inserted.

The change does not mutate the task, attempt, lease, queue or outbox and preserves `dispatch:false` and `executionAuthorized:false`.

## Exact-head CI evidence

Pass 49 head: `5450ddd8002d7a336b3eb41adeaba1d62a17fb75`
PR base: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
GitHub PR merge-result checkout: `659bc39dc448e9f803c4a20044209017d3cd7fb6`

### Isolated D1 Ledger Proof
- Run: 45212088972
- Job: 137823313130
- Conclusion: SUCCESS
- Exact PR merge-result checkout, Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, `npm test`.
- 6/6 test files passed; 63/63 tests passed.
- Reconciliation suite: 9 tests passed, including expiry during asynchronous verifier and expiry during asynchronous D1 precondition read.

### Pool Contract Validation
- Run: 45212089137
- Job: 137823313662
- Conclusion: SUCCESS
- `POOL_DISPATCH_ENABLED=false` observed in job environment.
- Six workflow YAML files parsed.
- Pinned Actions, shell interpolation, inert legacy worker, read-only supervisor and manual read-only probes passed.
- `POOL_CONTRACT_VALIDATION=PASS`.

These results verify the local synthetic proof and workflow contracts only. They do not establish production identity or runtime qualification.

## Security review disposition

### Verified observations
- Migration 0015 makes the reconciliation-decision ledger append-only, unique by attempt/generation and issuer/JTI, and binds insertion to the current pending reconciliation row, indeterminate attempt, current task pointer, expired lease owner and fencing generation.
- Adapter readback compares the durable decision fields to the verified claims and the final `verified_at`.
- Recording a decision alone does not release a lease, change attempt state, authorize retry or dispatch.
- Exact D1 proof and Pool Contract CI passed on the Pass 49 head.

### Blocking trust boundary
- The adapter still accepts `verifyEvidence` as an injected function. The module does not itself construct or enforce a production issuer allowlist, audience, algorithm allowlist, fixed HTTPS JWKS endpoint, protected-header type, key rollover policy or bounded remote-JWKS fetch behavior.
- `normalize()` validates claim shape and Pool-specific semantics but does not cryptographically verify the JWT. The caller-supplied verifier is a trust seam, not production authentication.
- The previously selected mature JOSE library remains `panva/jose` (MIT; Pass 41 documented exact candidate release 6.2.18). It is not in the D1 package manifest or lockfile and has not been integrated or tested with signed JWT/JWKS fixtures.
- Required production verifier tests remain outstanding: issuer/audience mismatch, algorithm confusion/none, wrong typ, invalid signature, malformed compact token, unknown/duplicate kid, JWKS redirects/host/path/size/timeout, rotation/cache behavior, clock boundaries and durable JTI replay.
- This review is internal code inspection, not independent or external review.

### Governance constraint
Issue #140 explicitly excludes independent/external review requests for this local no-secret qualification task. Pass 41 also records that external review is deferred until the pool can operate its own bounded review workflow. Therefore no external reviewer was requested and no independent approval is claimed.
- Current ruleset #26550182 is active but requires zero approving reviews. Governance does not enforce an independent approval gate.

## Other current state

- PR #168: OPEN / DRAFT / UNMERGED.
- PR #165/#166 remain separate historical candidates; they are not merged.
- Issue #140 remains OPEN.
- Gemini dispatch: NOT RUN / NOT AUTHORIZED; approved controller gates not requalified in this pass.
- No secret values were read; no provider calls, hosted D1 writes, deployment, merge or production action occurred.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next concrete step

Build a separate, no-secret JOSE verifier prototype on the same clean integration lineage using the already selected `panva/jose` library, exact package and lockfile pin, and synthetic signed JWT/JWKS fixtures. Implement a fixed deployment-configured issuer/audience/JWKS policy with explicit algorithms, typ, token lifetime and bounded fetch/rotation behavior. Keep the adapter seam but make the production verifier factory construct its trust policy only from trusted runtime configuration. Run the full negative-first matrix and exact-head CI. Do not enable live credentials, hosted D1, dispatch or execution.

Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
