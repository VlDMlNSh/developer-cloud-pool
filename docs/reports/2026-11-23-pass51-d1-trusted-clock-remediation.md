# Pass 51 — trusted clock for D1 lease acquisition

Date: 2026-11-23
Repository: `VlDMlNSh/developer-cloud-pool`
Issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
Implementation PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168
Working branch: `integration/pass48-current-base-d1-2026-11-23`
Target PR head: `ec1caca61caa453d4e0ce5405890e8791f6bfd29`
PR base recorded by GitHub: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
Current default HEAD observed: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`

## Scope and decision

Remediate Pass 50 finding F-50-01 (HIGH): lease acquisition previously accepted caller-controlled `input.now` as the authority for persisted timestamps and lease expiry.

Reuse First: retained the existing isolated D1 proof, Vitest 4.1.12 and Cloudflare Vitest plugin 1.4.7. No new runtime dependency, provider, service or paid resource was introduced.

## Changes

- `acquireAttemptLease` now requires an injected `trustedClock` function in addition to the executor authenticator.
- The clock is sampled after principal authentication and after the task/attempt precondition read, immediately before the conditional lease write.
- Caller-supplied `input.now` is no longer read or validated as an authority.
- The trusted timestamp is checked for positive safe-integer validity, safe expiry arithmetic, and monotonicity against persisted task/attempt timestamps; invalid, unavailable, or rolled-back time fails closed.
- Lease expiry, task `updated_at`, attempt `started_at`, event timestamp readback and ambiguous-write recovery all use the same trusted sample.
- Added five adversarial adapter tests: caller future time, caller past time, invalid clock, persisted-time rollback, and clock exception.
- All outputs continue to set `dispatch:false` and `executionAuthorized:false`.

## Immutable evidence

- Source blob: `0b4798a8a0a38484682165ef8c5265807a04e27b`.
- Test blob: `52ee72bf89a73b5d9088d1be301b2aa5ae442d4a`.
- PR head: `ec1caca61caa453d4e0ce5405890e8791f6bfd29`.
- D1 Ledger Proof run [45227149858](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45227149858): COMPLETED / SUCCESS. Job [137876597970](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45227149858) — inert Worker check passed; 6 test files, 68 tests passed.
- Pool Contract Validation run [45227149883](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45227149883): COMPLETED / SUCCESS; dispatch-disabled, YAML and pool security contract steps passed.
- Both workflow runs target PR head `ec1caca...`; combined status contexts are empty and are not treated as an additional pass signal.
- PR formal reviews: 0. Independent security review: NOT RUN.
- Merge-result CI: NOT VERIFIED.
- PR base is still recorded as `81baad...`; comparison shows default HEAD `8c38bb...` is two commits ahead, containing only the Context Window and Pass 50 report. Rebase/base synchronization and exact merge-result validation remain open.

## Qualification boundary

This pass verifies the local adapter's time-source contract only. It does not prove that the production controller/runtime supplies a trustworthy, monotonic clock. Clock provenance in the actual runtime must be separately qualified before execution integration. No hosted D1, secrets, provider calls, dispatch, deployment, production action or merge occurred.

## Status and next step

- F-50-01 adapter remediation: VERIFIED by exact PR-head CI.
- Local D1 proof: VERIFIED — 68 tests passed.
- Pool security contract validation: VERIFIED.
- Production clock provenance: NOT VERIFIED.
- Independent review: NOT RUN.
- PR #168: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: synchronize the integration branch with current default without losing provenance; verify exact merge-result CI; then independently qualify the trusted clock provider in the actual controller/runtime. Do not merge or enable dispatch before all gates pass.

Canonical Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
