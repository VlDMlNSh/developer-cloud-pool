# 2026-11-19 — Pass 23 clean-base D1 migration foundation

**Result:** VERIFIED — migrations 0001–0010 apply to a fresh local Workers-runtime D1 database; 3/3 adversarial baseline tests pass.  
**Implementation PR:** [#148](https://github.com/VlDMlNSh/developer-cloud-pool/pull/148), OPEN / DRAFT / UNMERGED.  
**Implementation branch:** `feat/pass23-d1-clean-base-foundation-2026-11-19`.  
**Immutable base:** `refs/heads/Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Exact tested PR head:** `613790e739aece5028dca54ae82b2d853fa95642`.  
**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

## 1. GitHub state recovered

- Default branch `Основной` HEAD confirmed at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140 remains OPEN. Owner's restricted qualification permission remains synthetic/non-production only; no merge, production change, secret disclosure or live dispatch.
- PR #67 OPEN/DRAFT/UNMERGED, base stale at `221f216c00ca7e5596bcc682ba185ad155a10603`, head `a53f6232bd5b50d3e150addf528b8e722002f9dd`.
- PR #72 OPEN/DRAFT/UNMERGED, stacked on #67, head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`.
- PR #111 OPEN/DRAFT/UNMERGED, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, head `687196738782432797bf394f1342cb9df19f478f`.
- PR #145 docs continuation OPEN/DRAFT/UNMERGED, base remains default `b81d2b5...`.
- PR #146 OPEN/DRAFT/UNMERGED, head `4aeb9bddecd747ca533ba5619be83fc4809e2a95`.
- PR #147 OPEN/DRAFT/UNMERGED, stacked on #146.
- PR #148 created from the exact current default SHA. Current head `613790e739aece5028dca54ae82b2d853fa95642`, base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, 19 changed files, 20 commits ahead, 0 commits behind. It remains draft and unmerged.
- Ruleset detail read-back is not exposed by the connected GitHub action set; no claim of fresh governance verification.

## 2. Implemented clean-base foundation

A new branch was created directly from the immutable default SHA. No stale PR branch was merged or used as its parent.

### Migration source blobs

| File | Source blob SHA |
|---|---|
| 0001 CODE approval ledger | `c14951239dfd6f93e20184f46373a8d13b62a69f` |
| 0002 legacy claim/outbox substrate | `44b8f7e0658296d287269770c5e91b1c3e25973c` |
| 0003 logical task and task-ready outbox | `49b0798871429d7961e81eb1d86ad892dba0b9b9` |
| 0004 immutable attempts | `0ad590ffdd2589f857257739275c15ed2d54d729` |
| 0005 reconciliation queue | `7a19897f6197c79517170e101e4cbf1db233cac6` |
| 0006 terminal projection outbox | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` |
| 0007 bounded projection retries | `767d95a30fa0a14c79e88c8c58392bfec9cdddc2` |
| 0008 projection retry monotonicity | `1d9385dd371f3404c52ec15fce03b0a14d384ab1` |
| 0009 projection identity immutability | `86919425f498dc634329bb783a3ca6ae7a0ff6a1` |
| 0010 projection comment at-most-once | `30ac9d0ed0cbede9586c365578c606b47bcce1a7` |

The selected 0001 root enforces exact profile `jarvis-code-sandbox-v1`. Migrations 0002–0010 were transplanted byte-for-byte from the selected PR #67 source lineage. Historical source files were not modified.

### Test harness and test coverage

Added:
- exact-pinned `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12`;
- lockfile-based `npm ci`;
- Cloudflare Workers Vitest/Miniflare configuration;
- inert Worker entrypoint (404 only);
- local synthetic D1 migration setup;
- CI workflow with read-only contents permission and pinned actions;
- README documenting the local-only proof boundary.

The fresh-D1 test suite asserts:
1. all required approval/task/attempt/reconciliation/task-ready/projection tables exist after migrations 0001–0010;
2. approval ledger constrains the exact CODE profile;
3. two distinct approvals attach to one logical task;
4. exactly one task-ready outbox row exists for that logical task;
5. the task-keyed path does not write to the legacy per-approval tables;
6. projection outbox schema exists separately and is not conflated with task-ready queue.

**Scope limitation:** projection lifecycle/retry behavior is not tested in this pass; this pass verifies its schema separation only. Migrations 0011–0014 and all production adapter integration remain outstanding.

## 3. Exact-head CI evidence

Final tested head: `613790e739aece5028dca54ae82b2d853fa95642`.

- [Isolated D1 Ledger Proof — run 44589681768](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44589681768) — COMPLETED / SUCCESS.
  - Job 135791975727 — SUCCESS.
  - `npm ci --ignore-scripts --no-audit --no-fund` — SUCCESS.
  - `npm run check` — SUCCESS.
  - Workers-runtime D1 tests — 1 file, 3 tests PASSED.
- [Pool Contract Validation — run 44589681751](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44589681751) — COMPLETED / SUCCESS.
  - Job 135791980028 — SUCCESS.
- Combined status API returned no individual status contexts; workflow runs and their jobs are the positive evidence above.

The first D1 run 44589517309 failed because the third test incorrectly expected an empty task-ready queue after the preceding test had already inserted one row in the shared fixture. The test was corrected to expect that one existing task-ready row while asserting the projection outbox remains empty. The subsequent exact-head run passed 3/3 tests. This was a test assertion correction, not a schema/migration fix.

## 4. Changed-file verification

- Compare against frozen base: 20 commits ahead, 0 behind; 19 added files; no deletions.
- All ten migration files were re-fetched from the implementation branch and their blob SHAs match the selected source blobs above.
- Key blobs:
  - `package.json`: `d970b887f52eb1011e3df74b560ad9a35bb25866`
  - `package-lock.json`: `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`
  - `migration-baseline.test.ts`: `9725582167ecc8687fd3baa3969b1fc0ab46c743`
  - `d1-ledger-proof-validation.yml`: `c1cff6e9f9ee3ca8f5766e07c7d17f84b21dc05e`
- PR #148 remains DRAFT / UNMERGED. No changes were made to default branch.

## 5. Explicitly not done

- Atomic qualified admission migration 0011 and CODE-profile/executor-ID adaptation — NOT RUN.
- Lease guard migration 0012 — NOT RUN.
- Executor identity migration 0013 — NOT RUN.
- Forward-only legacy outbox retirement migration 0014 — NOT RUN.
- Adapter logical task key update, removal of positive `claimAndEnqueue()`, and uniform `executionAuthorized:false` — NOT RUN.
- Full adversarial matrix (replay, ambiguous storage, fail-closed, lease fencing, projection lifecycle) — NOT RUN.
- Hosted D1, secrets, provider calls, external dispatch, executor launch, deployment, merge — NOT RUN.
- Gemini controller — NOT RUN; no dispatch gates were evaluated in this pass.
- Detailed governance/ruleset read-back — NOT VERIFIED.

## 6. Status and next step

**Pass 23:** VERIFIED — clean-base D1 migrations 0001–0010 apply on fresh local Workers D1; 3/3 baseline tests and exact-head CI passed.

**Pass 23 implementation PR:** [#148](https://github.com/VlDMlNSh/developer-cloud-pool/pull/148), OPEN / DRAFT / UNMERGED.

**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

Next bounded engineering pass: add migration 0011 as a CODE-profile and executor-bound atomic admission contract, then migration 0012 lease guard and 0013 executor binding. Before retirement migration 0014, adapt the trigger sequence and task key to include executor ID, then run a frozen schema-0010 upgrade fixture. Do not merge PR #148 without separate review and owner authorization.

Effort estimate against the original 45-hour plan: prior 15.5–20.5 hours plus an estimated 2.5–3.5 hours of verified Pass 23 deliverables gives 18–24 engineering-equivalent hours complete and 21–27 hours remaining (central estimate 24 hours). This is deliverable-equivalent planning, not measured active time.

Evidence:
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [PR #148](https://github.com/VlDMlNSh/developer-cloud-pool/pull/148)
- [D1 CI run 44589681768](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44589681768)
- [Contract CI run 44589681751](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44589681751)
- [Canonical Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
