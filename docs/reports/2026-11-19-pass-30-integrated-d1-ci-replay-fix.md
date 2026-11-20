# Pass 30 — integrated D1 CI activation and replay projection fix — 2026-11-19

## Objective
Establish an approved exact-head CI path for the stacked D1 implementation, execute the integrated Workers/D1 proof, diagnose the failure, and make the smallest adapter correction.

## Refreshed repository state
- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (unchanged).
- Implementation PR #152 remains OPEN / DRAFT / UNMERGED; base Pass 26 branch; head: `d56d334d2045d08fd7aa71feb9749aab08d96840`.
- Validation PR #153 OPEN / DRAFT / UNMERGED; same source head, base `Основной`. Validation-only; do not merge.
- PRs #148/#149/#150 and docs PR #145 remain OPEN / DRAFT / UNMERGED.
- Issue #140 OPEN; Issue #151 OPEN / PLANNED.

## CI path
The D1 workflow is pull_request-only, restricted to base `Основной` and paths `proofs/d1-ledger/**` / workflow file. PR #152 is intentionally stacked on a feature branch, so it cannot trigger this workflow. Instead of weakening workflow filters or changing permissions, created draft validation PR #153 from the same implementation branch to `Основной`. This ran the existing workflows on the integrated stack. No workflow or governance definition was changed.

## First exact-head run — failure, useful evidence
- D1 run `44603988834`, run number 555, job `135842681244`: FAILED.
- Pool Contract run `44603989590`, run number 796, job `135842682777`: SUCCESS.
- First D1 run completed 28/29 tests; 3 files, 1 failed.
- Failure: exact replay was denied in `rejects replay but returns the same durable receipt for an exact retry`.
- The two new adversarial tests (missing receipt and mismatched receipt identity) passed, as did migration baseline and task identity tests.

## Root cause and fix
The replay SELECT projected `a.attempt_id AS requested_attempt_id`, but the new receipt/outbox/task consistency guard compared against `prior.attempt_id`, which was not selected under that name. Those comparisons saw an undefined value and rejected a valid replay.

Fix in `proofs/d1-ledger/src/admit-qualified-task.mjs`:
- Add explicit projection `a.attempt_id AS admission_attempt_id`.
- Compare receipt attempt, outbox attempt and task current attempt against `prior.admission_attempt_id`.
- Preserve `requested_attempt_id` for original input-to-attempt identity comparison and response.

## Successful exact-head validation
- Final source head: `d56d334d2045d08fd7aa71feb9749aab08d96840`.
- Adapter blob: `78c0906f26f7eb54ca3a489eba3eeca5c3f55cae`.
- D1 run `44604194767`, run number 556, job `135843386415`: COMPLETED / SUCCESS.
- D1 logs show merge checkout `4edaf599cd9c005f8a4e5b51c2244685e3fbb2d4` = merge of final source head `d56d334d2045d08fd7aa71feb9749aab08d96840` into frozen default `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Node `24.9.0`; `npm ci --ignore-scripts --no-audit --no-fund` passed; `npm run check` passed; `npm test` passed.
- Workers/D1 summary: 3 test files passed; 29 tests passed; 0 failed.
- Pool Contract Validation run `44604194769`, run number 797, job `135843386357`: COMPLETED / SUCCESS. Dispatch gate observed `POOL_DISPATCH_ENABLED=false`; workflow YAML parsed; `POOL_CONTRACT_VALIDATION=PASS`.
- Combined commit status endpoint returned an empty list; evidence is completed workflow run/job records and logs.

## Validation boundary
- Fresh local D1 migrations 0001–0012 and current suite: VERIFIED by exact-head Actions run.
- Frozen schema-0010 upgrade fixture / upgrade-path coverage: NOT VERIFIED / not yet present in this evidence.
- Hosted D1, credentials/secrets, provider calls, dispatch, executor launch, deployment, merge and production writes: NOT RUN.
- Independent review and current detailed ruleset readback: NOT VERIFIED.
- Gemini and Claude: NOT RUN.

## Next
1. Add frozen schema-0010 upgrade fixture and prove forward migration 0011–0012 against existing synthetic data.
2. Extend failure injection around ambiguous D1 batch outcomes and durable readback dimensions.
3. Continue SQL/trigger audit; only after upgrade and atomic proof are independently verified proceed to lease fencing.
4. Keep PR #153 draft and unmerged as the exact-head validation surface.

## Status
Pass 30 exact-head D1 suite and contract validation: VERIFIED / SUCCEEDED. PR #152 and #153 remain OPEN / DRAFT / UNMERGED. Contour A remains BLOCKED / NOT ACCEPTED. Contour B DEFERRED. Issue #151 multi-account Jarvis/shared GPU remains PLANNED.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
