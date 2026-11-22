# Pass 45 — current D1 lineage and exact CI evidence audit

Date: 2026-11-22  
Scope: read-only audit of the newer PR #143 and PR #148–#166 chain against Issue #140. No runtime code or SQL changes.

## Current repository restore

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- HEAD commit message: `docs: close Pass 38 in GitHub Context Window`
- Current HEAD workflow-run query: empty; combined status: empty. Exact-current-head CI NOT VERIFIED.
- Compare confirms current default is 7 commits ahead of the clean-base parent `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, with only documentation files changed in that delta. It is 4 commits ahead of `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`, also documentation-only in the compare result. This reduces source drift but does not replace validation on the current exact base.

## Newer D1 candidate lineage discovered

All listed PRs remain OPEN / DRAFT / UNMERGED unless stated otherwise.

| PR | Branch relationship | Head | Scope |
|---|---|---|---|
| #143 | directly targets default; base `68183828cf7934e89109310c8f99281be4eb7ed8` | `3d189df6a4242325ad6261fb38d6e03d7ac6eebd` | Earlier current-base ledger proof, but includes Supervisor/Worker workflow and runtime edits; separate lineage, not the clean CODE chain |
| #148 | default base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` | `613790e739aece5028dca54ae82b2d853fa95642` | Clean-base CODE D1 migrations 0001–0010 |
| #149 | stacked on #148 | `3a64c045a6cdd5890846dbd75bc53952ed1ba718` | Immutable executor identity |
| #150 | stacked on #149 | `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb` | Canonical executor-bound task identity v2 |
| #152 | stacked on #150 | `d56d334d2045d08fd7aa71feb9749aab08d96840` | Atomic CODE admission, executor-bound receipt/outbox |
| #157 | stacked on #152 | `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a` | D1 ambiguous-batch primary readback |
| #159 | stacked on #157 | `deb14d34ce7387dec217cd79fc29403a91542c44` | SQL approval/admission/receipt hardening |
| #161 | stacked on #159 | `13cf7d43b7bdf645b1336498f32f449035994e7f` | SQL lease and attempt fencing |
| #163 | stacked on #161 | `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a` | Authenticated-principal lease adapter seam |
| #165 | stacked on #163 | `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0` | Issuer-bound indeterminate reconciliation evidence |
| #153/#154/#156/#158/#160/#162/#164/#166 | validation PRs targeting default | corresponding feature heads | Validation-only PRs; not implementation branches |

## Schema and implementation findings

The newer #148–#165 lineage is the relevant candidate for Issue #140, not the historical #111/#114 parallel roots.

- Migration 0001 on #165 head uses exact CODE profile `jarvis-code-sandbox-v1`, not legacy `dsh-headless-probe`.
- README on #165 head documents one forward-only migration lineage 0001–0015: CODE approval ledger; task/attempt/reconciliation; projection/outbox; immutable executor identity; atomic qualified admission; admission/receipt guards; database-enforced lease/fencing; issuer-bound reconciliation decisions.
- Migration 0011 adds immutable executor identity to approvals and tasks; historical rows are intentionally not backfilled because executor identity cannot be inferred.
- Migration 0012 adds route qualification, atomic admission, receipt and task-ready outbox binding.
- Migration 0014 adds database-enforced lease acquisition/renewal/fencing/release and indeterminate quarantine.
- Migration 0015 adds append-only issuer-bound reconciliation evidence bound to the current indeterminate attempt and generation.
- The package manifest pins the existing Workers/Vitest harness (`@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`) and contains no production JOSE dependency.
- Reconciliation adapter still requires injected `verifyEvidence` and `trustedClock`. The SQL ledger and synthetic verifier seam are not production JWT/JWKS trust.
- README explicitly states this package is local-only, not mounted in product Worker, Hono console, production Supervisor/Worker or deployed service. Full legacy-table write-denial migration remains outstanding.
- PR #143 is not interchangeable with #148–#165: it is a separate older-base ledger candidate and modifies Supervisor/Worker workflows and scripts. Do not combine it with the clean CODE proof without a separate authority and file-overlap review.

## CI evidence re-read

Actions runs were re-read with job logs. All are **PR merge-result validations**, not standalone head-only executions:

| Candidate head | D1 run | Merge result checkout | D1 result | Pool Contract |
|---|---:|---|---:|---|
| #148 `613790e...` | 44589681768 | `6a5d5bf`, head into `b81d2b5...` | 1 file / 3 tests PASS | 44589681751 PASS |
| #152 `d56d334...` | 44604194767 | `4edaf59`, head into `b81d2b5...` | 3 files / 29 tests PASS | 44604194769 PASS |
| #157 `ae0bf4f...` | 44703757450 | `badba84`, head into `b81d2b5...` | 4 files / 39 tests PASS | 44703757544 PASS |
| #159 `deb14d3...` | 44709527918 | `62d08db`, head into `b81d2b5...` | 4 files / 42 tests PASS | 44709527912 PASS |
| #161 `13cf7d4...` | 44711819163 | `647fa19`, head into `7e76bd2...` | 5 files / 50 tests PASS | 44711819175 PASS |
| #163 `83b8e9d...` | 44718354234 | `a8c98b8`, head into `7e76bd2...` | 5 files / 54 tests PASS | 44718354072 PASS |
| #165 `80dcd60...` | 45032534259 | `8ab5a07`, head into `7e76bd2...` | 6 files / 61 tests PASS | 45032534262 PASS |

Pool Contract job logs for these runs show `POOL_CONTRACT_VALIDATION=PASS`; for #165 the log also records `POOL_DISPATCH_ENABLED: false`. This is historical workflow-run environment evidence only, not a fresh read of the current repository variable.

PR #166 is the validation-only PR for #165 and targets default at frozen base `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`; it explicitly says do not merge. The #165 merge-result CI therefore does not prove the exact current default base `81baad...`.

## Governance and controller

- Issue #1 remains OPEN. Its governance details were last documented on 2026-11-04 and are stale for current acceptance; live ruleset readback was not available in this pass. Current ruleset and required-review enforcement: NOT VERIFIED.
- Issue #96 remains OPEN / PLANNED and says no controller implementation or dispatch is authorized until all gates pass.
- The earlier Pass 42 read of `.github/workflows/gemini-batch-dispatch-controller.yml` returned 404 on default and PR #165. Not requalified in Pass 45; Gemini dispatch remains NOT RUN.
- PR #165 has one COMMENTED review authored by the repository owner, not an independent APPROVED review. PRs #148/#152/#157/#159/#161/#163/#166 had no submitted reviews returned.
- No secrets or variable values were read.

## Decision and next bounded work

1. Do not start another parallel D1 implementation and do not transplant PR #143 into the clean CODE lineage.
2. Treat #148→#165 as the strongest existing local proof candidate. It already covers the migration/lease/admission stages requested by Issue #140, but remains a stacked Draft chain.
3. Before integration, create one current-default-based validation/integration candidate at `81baad...` (or a newly re-read default HEAD), replay the canonical migration lineage and exact tests on that precise base, and preserve source commits/provenance. Since the default delta from the old frozen bases is docs-only, perform a controlled file/tree-level comparison before choosing rebase vs forward-only transplant.
4. Close outstanding gaps in that same chain: production JOSE/JWKS verification (or explicitly leave reconciliation unqualified), full legacy-table write denial, trusted GitHub event binding, and authenticated executor principal. Keep all outputs `dispatch:false` and `executionAuthorized:false`.
5. Do not merge implementation or validation PRs on the basis of merge-result CI alone. Independent security review, current ruleset verification, exact-current-base CI, hosted D1 and executor qualification remain separate gates.

## Status

- Newer CODE D1 lineage identified and source-level migration chain read: **VERIFIED (read-only audit)**.
- Merge-result CI evidence: **VERIFIED** at the per-run level shown above.
- Exact current default-head CI: **NOT VERIFIED**.
- Production JWT/JWKS trust, live event provenance, hosted D1, executor identity/authentication, worker execution: **NOT QUALIFIED**.
- Controller/dispatch: **BLOCKED / NOT AUTHORIZED / NOT RUN**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

No code, SQL, workflow, dependency, ruleset or production resource was changed. No local tests were run in this pass; test evidence is from the linked GitHub Actions merge-result jobs only. No hosted D1, secrets, provider calls, dispatch, deployment, merge or paid resources were used.

Canonical MediaHub map (separate project; Contour B remains deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
