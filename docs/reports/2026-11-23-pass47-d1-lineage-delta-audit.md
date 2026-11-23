# Pass 47 — D1 lineage delta and integration-safety audit

Date: 2026-11-23
Status: READ-ONLY AUDIT VERIFIED; INTEGRATION NOT RUN; CONTOUR A NOT ACCEPTED
Immutable target: default branch `Основной` @ `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
Feature candidate: PR #165 head `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`

## Scope and result

This pass answers whether the existing #148→#165 stacked D1 lineage can be transplanted onto the current default without duplicating or colliding with current source/schema. It is a read-only provenance and migration audit. No implementation, cherry-pick, rebase, workflow dispatch, test run, deployment, hosted D1 operation, secret read or merge occurred.

## Exact current-base delta

GitHub compare API for base `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a` (PR #165's parent / PR #163 head) to current default `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`:
- Current default is 7 commits ahead of that base.
- The 7 commits are documentation-only.
- Changed files: Pass 33 report/checkpoint/current snapshot and Context Window, plus Pass 38 CI regression/correction report.
- No application source, SQL migration, package, workflow or runtime file changed in that default delta.

GitHub compare API for current default `81baad...` to PR #165 head `80dcd...`:
- Candidate is 93 commits ahead and 7 commits behind; histories have diverged.
- The candidate adds `proofs/d1-ledger/**` and `.github/workflows/d1-ledger-proof-validation.yml`; no D1 ledger path exists in the exact default tree.
- This means the default-side delta since the candidate's frozen parent is documentation-only, but the candidate is not a fast-forward and is not a current-base qualification. A clean current-base transplant/replay remains required.

## D1 lineage and ownership map

The PR file lists show one coherent, additive migration sequence within `proofs/d1-ledger/migrations`:
- #148: migrations 0001–0010; clean CODE ledger foundation, local Workers D1 test harness, inert proof Worker and proof workflow.
- #149: migration 0011 binds immutable executor identity.
- #152: migration 0012 atomic qualified admission and executor-bound task identity.
- #154/#157: frozen schema-0010 upgrade proof through 0012 and adapter/replay test corrections.
- #159: migration 0013 hardens approval/admission SQL bindings.
- #161: migration 0014 enforces lease acquisition/renewal/fencing/terminal release/quarantine at SQL boundary.
- #163: authenticated lease adapter and tests; no new migration.
- #165: migration 0015 adds append-only issuer-bound reconciliation decision evidence; adapter and tests.
- #150 contributes canonical task identity helper/tests.

No duplicate migration ID was found in the inspected #148→#165 changed-file sequence. The current default tree contains no `proofs/d1-ledger` directory and no `d1-ledger-proof-validation.yml`, so this is an additive transplant candidate rather than an observed path collision. This is not yet a full SQL semantic equivalence proof against every historical ledger or controller branch.

## Security and workflow findings

1. PR #165's formal review list contains one COMMENTED review by repository owner `VlDMlNSh`; there is no independent APPROVED review.
2. PR #165 head combined status is pending with zero contexts. Current exact-head CI is NOT VERIFIED.
3. Historical runs 45032534259 (D1) and 45032534262 (Pool Contract) passed on a PR merge-result checkout based on the older frozen base. They do not qualify the current default base.
4. The candidate D1 workflow is PR-only, grants `contents: read`, pins checkout and Node, uses `npm ci --ignore-scripts`, and runs `node --check` plus local Vitest. It contains no dispatch, hosted D1 or provider invocation. The workflow file is absent on default.
5. The active default ruleset #26550182 targets only `refs/heads/Основной`, blocks deletion and non-fast-forward, requires PR and thread resolution, has no bypass actors, but requires **0 approving reviews**. It therefore does not enforce independent review.
6. Issue #140 remains OPEN and explicitly limits work to local no-secret qualification; it prohibits dispatch, hosted D1, provider calls, secrets/variables inspection, deployment and merge. Its baseline SHA in the issue body is historical and must not override the newly frozen target SHA above.
7. Default branch Actions include successful `Pool Supervisor (retired heartbeat)` run 45161800097 on the current HEAD. This is retired heartbeat evidence, not worker/executor functionality.

## Source-level blocker retained

The #165 adapter currently samples `trustedNow` before awaiting injected `verifyEvidence`, then uses the same timestamp to normalize expiry and persist `verified_at`. If verification performs asynchronous remote JWKS resolution, the token may expire during the await. The proof must take a fresh trusted-clock reading after verification and re-check expiry/issued-at/not-before and clock rollback before DB mutation. Add a deterministic delayed-verifier test that crosses `exp`. The production JOSE/JWKS verifier remains unimplemented and unmounted.

## Integration decision

The default-side delta is clean at file level: seven docs-only commits since #165's frozen parent, with no D1 source/schema overlap. This removes the earlier uncertainty about source-file collision, but does not make the stacked PR chain merge-ready.

Next bounded engineering action:
1. Freeze/re-read default HEAD again immediately before branch creation.
2. Create one clean integration branch from that exact HEAD.
3. Port the #148→#165 proof lineage preserving source commit provenance and the exact 0001–0015 order; do not merge stacked PRs one by one.
4. Apply the post-verification trusted-clock fix and delayed-expiry adversarial test before considering the verifier seam safe.
5. Run `npm ci --ignore-scripts`, `npm run check`, and the full Workers/Vitest suite on the exact integration HEAD. Keep workflow PR-only and outputs non-authorizing.
6. Record exact-head CI and independent review separately. Do not merge or dispatch.

## Status

- Current target and GitHub metadata revalidation: VERIFIED.
- D1 PR file/migration ownership map: VERIFIED at changed-file-list level.
- Current-base source collision: no overlap observed; semantic replay NOT RUN.
- Historical merge-result CI: VERIFIED as historical evidence only.
- Current exact-head CI: NOT VERIFIED.
- Production JWT/JWKS verifier: NOT IMPLEMENTED.
- Hosted D1/live event binding/executor qualification: NOT QUALIFIED.
- Gemini dispatch: NOT RUN / NOT AUTHORIZED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map (Contour B remains deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
