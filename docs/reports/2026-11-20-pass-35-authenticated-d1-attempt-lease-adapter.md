# Pass 35 — authenticated D1 attempt-lease adapter seam

Date: 2026-11-20
Status: VERIFIED (local synthetic D1 adapter proof and exact-head CI); NOT QUALIFIED for production identity or hosted D1.

## Frozen target and lineage

- Frozen default base: `Основной` @ `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`.
- Pass 34 parent: `13cf7d43b7bdf645b1336498f32f449035994e7f`.
- Pass 35 implementation branch: `feat/pass35-authenticated-d1-lease-adapter-2026-11-20`.
- Pass 35 implementation HEAD: `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`.
- Validation PR #164 merge checkout: `a8c98b873a91f7f28dcb66ee5842c7520c7ab47a` (implementation head merged into frozen default for CI only).
- Implementation PR #163: OPEN / DRAFT / UNMERGED; stacked on Pass 34 branch.
- Validation-only PR #164: OPEN / DRAFT / UNMERGED; targets `Основной`. Do not merge.

## Reuse and design decision

Reused the existing pinned `@cloudflare/vitest-plugin@1.4.7`, Vitest 4.1.12 and Workers/Miniflare D1 harness. Reused D1 Sessions `withSession("first-primary")` already present in the admission adapter; no new dependency, database, lock service or second coordination authority was added. This is a local adapter proof, not a new runtime.

## Implementation

Added `proofs/d1-ledger/src/acquire-attempt-lease.mjs` (blob `1b6232137dc53998d3efda36a32c809916e9d316`).

The adapter:
1. Requires an injected `authenticateExecutor` dependency and rejects missing/failed authentication.
2. Binds the returned authenticated principal's executor ID and CODE capability profile to the requested executor and persisted task.
3. Checks that the requested attempt is the task's current prepared attempt and that no lease is already held.
4. Uses a conditional SQL update for pending -> leased, preserving monotonic generation and a maximum 900-second expiry.
5. Reads the resulting task/attempt/lease/audit-event tuple through a fresh primary-first D1 session.
6. After an ambiguous update acknowledgement, reports committed only when primary readback proves the exact owner, attempt, generation, expiry, running transition and deterministic lease-acquired event.

All returned decisions retain `dispatch: false` and `executionAuthorized: false`. The adapter does not dispatch, launch a worker, renew leases or automatically reclaim expired leases.

Updated `proofs/d1-ledger/test/lease-fencing.test.ts` (blob `22a3c0050f2a93969efb981a450a1027c92de7f6`) with four tests: successful authenticated acquisition; mismatched principal executor; missing authenticator; persisted task/executor mismatch.

Updated `proofs/d1-ledger/README.md` (blob `e88e020bcbd52695f64fc358b259db5e26db5f06`) to correct the migration sequence through 0014 and describe Pass 35.

## Exact-head CI evidence

Validation PR #164 ran against the frozen default base and implementation head `83b8e9d...`:

- Isolated D1 Ledger Proof: run [44718354234](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44718354234), job `136227400079`, COMPLETED / SUCCESS. Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, inert Worker syntax check, 5 test files / 54 tests passed. Lease-fencing suite: 12 tests; migration upgrade suite: 7; atomic admission: 18; baseline: 6; task identity: 11.
- Pool Contract Validation: run [44718354072](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44718354072), job `136227400255`, COMPLETED / SUCCESS. Six workflow YAML files parsed, `POOL_CONTRACT_VALIDATION=PASS`; dispatch gate disabled or unset.
- No test dependency or runtime dependency was added.

## Findings and limits

- The authenticator is injected by the caller. The adapter does not itself authenticate GitHub Actions, verify OIDC, or validate a production issuer. The test authenticator is synthetic. Production principal provenance remains NOT VERIFIED.
- The adapter is a local proof module, not wired into the deployed Hono console, product Worker or live Supervisor/Worker runtime.
- The D1 suite is synthetic local Workers/Miniflare. Hosted D1 behavior, production network acknowledgement loss, cross-region semantics and real executor sandbox remain NOT VERIFIED.
- Expired running attempts remain quarantined as indeterminate. No automatic takeover is permitted; an explicit, authority-separated reconciliation operation is still missing.
- Lease renewal is not implemented by this adapter.
- PRs #159 and #161 have no independent review submissions; independent review NOT VERIFIED.
- Current default branch combined status lookup returned an empty status list; default-branch CI is NOT VERIFIED.
- Active ruleset #26550182 was last observed targeting only `refs/heads/Основной`, requiring PR and review-thread resolution, with zero required approvals and no bypass actors. This pass made no governance changes; re-read full ruleset details before any merge.
- Gemini controller remains absent from the default branch. Gemini and Claude were NOT RUN. No secret values were read.

## Safety boundary

No hosted D1 provisioning or writes, secret reads, provider calls, GitHub dispatch, worker launch, deployment, merge, production mutation, ruleset change or paid resource was used.

## Next

Pass 36: design and test an explicit, issuer-bound reconciliation protocol for indeterminate attempts. It must require independent evidence and authority, preserve attempt/generation history, forbid silent takeover and retain `dispatch:false` / `executionAuthorized:false`. In parallel, obtain independent review of PRs #159, #161 and #163. Do not merge validation PR #164.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
