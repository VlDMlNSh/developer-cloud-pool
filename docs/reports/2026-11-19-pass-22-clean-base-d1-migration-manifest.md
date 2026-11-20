# 2026-11-19 — Pass 22 clean-base D1 migration manifest

**Status:** VERIFIED — source-blob composition manifest and dependency audit. Runtime implementation NOT RUN.  
**Contour:** A only. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.  
**Immutable integration base:** `refs/heads/Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145 OPEN / DRAFT / UNMERGED.  
**Controlling issue:** [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140), OPEN.

## 1. Current GitHub state

- Default branch `Основной` HEAD re-read: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #67: OPEN / DRAFT / UNMERGED; base SHA `221f216c00ca7e5596bcc682ba185ad155a10603`; head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; 40 changed files, 47 commits. Exact-head runs `43600901063` (Pool Contract Validation) and `43600901068` (Isolated D1 Ledger Proof) SUCCESS. Its old base makes it unsuitable for direct merge.
- PR #72: OPEN / DRAFT / UNMERGED; stacked on #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; five changed files, 20 commits. Exact-head workflow lookup returned no runs; CI NOT VERIFIED.
- PR #111: OPEN / DRAFT / UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; head `687196738782432797bf394f1342cb9df19f478f`; 20 changed files, four commits. Exact-head runs `43881396272` and `43881396386` SUCCESS. Its migration 0006 is the lease guard and cannot be copied under that ordinal into #67's migration history.
- PR #146: OPEN / DRAFT / UNMERGED; base current default `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; head `4aeb9bddecd747ca533ba5619be83fc4809e2a95`. Exact-head runs `44582839702` and `44582839780` SUCCESS. It provides the CODE-profile root and executor identity component, but its 0006 lease guard displaces the #67 projection-outbox migration sequence.
- PR #145: OPEN / DRAFT / UNMERGED; docs branch head before this Pass 22 update `88e61217318c53b29051f82f19311e31d0ee81ef`, base default `b81d2b5...`.
- PR #147 remains OPEN / DRAFT / UNMERGED, stacked on #146.
- Issue #140 remains OPEN. Latest owner scope remains synthetic/no-secret/non-production only; no merge, dispatch or production action.
- Current branch search also returned `feat/issue140-canonical-admission-lease-2026-11-19`, but all probed D1 files/reports returned 404. Branch SHA and contents are NOT VERIFIED; do not use it as a base.
- Current detailed ruleset read-back is unavailable in the connected GitHub action set. Historical ruleset evidence is not asserted as a fresh read.

## 2. Corrected source-lineage conclusion

Pass 21 correctly found the D1 proof package absent from the current default tree. This does not mean there is no reusable canonical lineage: Issue #140 comments and PR #141's full follow-up audit explicitly select PR #67's `proofs/d1-ledger` migrations 0001–0010 plus PR #72 migration 0011/composite admission adapter as the intended source lineage. These branches are stale relative to current default and must be selectively transplanted, not merged or stacked as-is.

The manifest below resolves the migration ordinal collision while preserving projection delivery and the CODE profile.

## 3. Proposed clean-base migration manifest

The following is a new, unexecuted composition plan for a clean implementation branch from immutable default SHA `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`. It does not rewrite any migration in the historical source branches and does not imply any migration has been applied to hosted D1.

| Candidate ordinal | Source | Source blob SHA | Composition decision |
|---|---|---|---|
| 0001 | PR #146 CODE-profile approval ledger | `c14951239dfd6f93e20184f46373a8d13b62a69f` | Use this root instead of PR #67's DSH-constrained 0001 (`a80524ed839b63dd6483978118619495fa550877`). Exact immutable CODE profile: `jarvis-code-sandbox-v1`. |
| 0002 | PR #67/#146 shared claim/outbox substrate | `44b8f7e0658296d287269770c5e91b1c3e25973c` | Reuse as source; legacy tables retained only as inert compatibility history after retirement migration. |
| 0003 | PR #67/#146 shared logical task schema | `49b0798871429d7961e81eb1d86ad892dba0b9b9` | Reuse as source; preserve `pool_task_delivery_outbox` and `pool_task_approvals`; legacy trigger is removed by 0014. |
| 0004 | PR #67/#146 shared immutable attempts | `0ad590ffdd2589f857257739275c15ed2d54d729` | Reuse as source. |
| 0005 | PR #67/#146 shared reconciliation queue | `7a19897f6197c79517170e101e4cbf1db233cac6` | Reuse as source; reconciliation remains non-authorizing. |
| 0006 | PR #67 projection outbox | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` | Preserve this ordinal and `pool_attempt_projection_outbox`; do not replace it with the #111/#146 lease guard. |
| 0007 | PR #67 projection delivery retry/dead-letter | `767d95a30fa0a14c79e88c8c58392bfec9cdddc2` | Preserve. |
| 0008 | PR #67 projection retry monotonicity | `1d9385dd371f3404c52ec15fce03b0a14d384ab1` | Preserve. |
| 0009 | PR #67 projection identity immutability | `86919425f498dc634329bb783a3ca6ae7a0ff6a1` | Preserve. |
| 0010 | PR #67 at-most-once projection comment gate | `30ac9d0ed0cbede9586c365578c606b47bcce1a7` | Preserve. |
| 0011 | PR #72 atomic qualified admission | `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc` | Port as a corrected new candidate blob: replace DSH profile constraints with exact CODE profile; add executor identity to approval/admission/task-key binding contract; preserve receipt, qualification, revocation and batch read-back invariants. Do not mass-replace literals. |
| 0012 | PR #111 lease guard | `0610c4ee63f338e9b4d4db30ffe6fdffbaf6d854` | Port unchanged initially as a new ordinal after compatibility review against #67 attempt schema and trigger order. It requires current attempt, lease attempt, owner, positive generation and unexpired lease. |
| 0013 | PR #146 executor identity binding | `47c2f0f7db6379e6760317fe3903214f6f31ffee` | Port as a new ordinal; bind approval, logical task and attempt to executor instance, while keeping executor ID distinct from CODE capability profile. Re-review trigger replacement against adapted 0011. |
| 0014 | New forward-only legacy outbox retirement | NEW — not yet created | Drop `pool_approval_consumed_legacy_claim_outbox`; reject INSERT/UPDATE/DELETE on retired `pool_task_claims` and `pool_task_outbox` while preserving existing rows; ensure no remaining adapter writes there. Keep `pool_task_delivery_outbox` authoritative for task-ready events and `pool_attempt_projection_outbox` independent for terminal projection. |

### Why this composition

- PR #67 and #146 migrations 0002–0005 are byte-identical at the retrieved source blobs.
- PR #67 0006–0010 provide a projection-delivery chain absent from PR #146's replacement 0006 lease guard.
- PR #72 0011 supplies atomic qualified admission, but hardcodes retired `dsh-headless-probe` in approval/qualification constraints and adapter validation.
- PR #111's lease guard is compatible in intent but collides by ordinal; 0012 preserves it without overwriting projection migration 0006.
- PR #146's executor identity migration collides with PR #67 projection migration 0007; 0013 preserves both histories without renumbering the old source migration files.
- The #146 0001 CODE root is the only inspected source migration with the owner-frozen exact profile literal `jarvis-code-sandbox-v1`. Do not reintroduce DSH as an accepted profile.

## 4. Mandatory adapter and schema adaptation before candidate tests

1. Task identity: update both #67 `logicalTaskKey()` and #72 admission's canonical task-key calculation to include immutable `executor_id` in the canonical serialization. Validate executor ID syntax and ensure task-key collision/conflict checks compare executor ID as well as repository, issue, target SHA and profile.
2. Capability identity: `profile` and route `capability_profile` must equal exactly `jarvis-code-sandbox-v1`; executor instance (for example `claude-code-1`) remains a separate field. Do not infer one from the other.
3. Admission: port #72 `admitQualifiedTask()` as the sole composite admission entrypoint. Low-level consume/claim helpers must not become alternate admission/dispatch paths.
4. Outbox authority: `pool_task_delivery_outbox` is the sole task-ready queue. `pool_attempt_projection_outbox` remains a separate terminal-attempt projection queue. `pool_task_outbox` and `pool_task_claims` are retired legacy storage, not active producers/consumers.
5. Legacy API: remove or make `claimAndEnqueue()` fail closed with an explicit retired-path reason. Replace positive legacy tests with direct SQL negative tests and adapter denial tests.
6. Fail-closed result shape: every exported adapter's success, denial, storage-error and ambiguous-write result must explicitly include `dispatch: false` and `executionAuthorized: false`. Current #67/#72 adapters do not all include the latter; #146 consume does.
7. Executor binding: adapt the #146 0013 trigger to require same executor ID across approval, task, task approval attachment and attempt. The task key must bind executor ID; do not permit two executor identities to attach to one task.
8. Profile inventory: #141 audited 16 literal DSH references across 14 files in the #72 package. Explicitly review/update migration 0001 root, migration 0011, `src/a0-admission-contract.mjs`, `src/admit-qualified-task.mjs`, `src/claim-outbox.mjs`, `src/consume.mjs`, and the 8 associated tests/upgrade fixtures. Add negative DSH rejection tests; do not blindly replace text.
9. Migration history: keep the selected candidate sequence immutable after its first qualification. No edits to an applied migration; subsequent corrections require a higher forward-only migration.

## 5. Required adversarial validation matrix

- Fresh empty D1 database applies 0001–0014 in order with no missing objects, trigger failures or duplicate migration IDs.
- Frozen schema-0010 upgrade fixture upgrades through 0014 without data loss and without mutating the fixture baseline.
- Two or more distinct approvals for the same repository/issue/target/profile/executor attach to exactly one logical task and exactly one task-ready outbox row.
- Same task with different executor ID yields a different task key and cannot cross-attach.
- Exactly one task-ready writer/reader remains; writes to legacy `pool_task_claims` and `pool_task_outbox` fail; the legacy trigger is absent.
- Projection outbox continues to receive one row for terminal attempt finalization and its retry/dead-letter/at-most-once behavior remains independent.
- Exact replay creates no duplicate task, approval attachment, outbox, attempt, admission or receipt.
- Storage unavailable, D1 batch exception, ambiguous write, partial read-back or stale receipt returns denial with both authorization flags false.
- Stale/expired/revoked route qualification, executor mismatch, profile mismatch, altered target SHA, approval reuse and task-key collision all fail closed.
- Attempt cannot enter running without matching current unexpired lease and positive fencing generation; stale generation/owner and ambiguous finalization are denied.
- Every adapter success/deny/error result includes `dispatch:false` and `executionAuthorized:false`.
- No test performs provider calls, external dispatch, deployment, or reads secrets.

## 6. CI/provenance interpretation

- PR #67 exact-head runs `43600901063` and `43600901068` SUCCESS apply only to old source head `a53f6232...`.
- PR #72 exact-head workflow lookup returned no runs; NOT VERIFIED.
- PR #111 exact-head runs `43881396272` and `43881396386` SUCCESS apply only to `687196738...`.
- PR #146 exact-head runs `44582839702` and `44582839780` SUCCESS apply only to `4aeb9bd...`.
- None of these runs validates the composed manifest or the new retirement migration. No Pass 22 code tests or exact-head CI were run because this pass produces the source manifest only.
- No secrets/variables read, hosted D1 provisioned/written, workflow dispatch, Gemini controller call, Claude host launch, provider/model call, deployment, merge or governance mutation.

## 7. Result and next step

**Pass 22 result:** VERIFIED source-level migration composition manifest. **Implementation NOT RUN** in this pass. The manifest is ready to become the immutable specification for a new implementation branch from the frozen default SHA, but the candidate branch has not yet been created and no code is claimed changed.

Next single engineering task: create a new implementation branch from `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, transplant the selected source blobs as candidate migrations 0001–0013, implement 0014, and run the fresh-database plus frozen-upgrade Workers-runtime matrix before publishing an implementation PR.

Effort estimate remains 24.5–29.5 engineering-equivalent hours remaining against the original 45-hour plan. No implementation-hour credit is claimed; actual active time is NOT MEASURED.

Evidence:
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [PR #67](https://github.com/VlDMlNSh/developer-cloud-pool/pull/67)
- [PR #72](https://github.com/VlDMlNSh/developer-cloud-pool/pull/72)
- [PR #111](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111)
- [PR #145 — docs continuation, unmerged](https://github.com/VlDMlNSh/developer-cloud-pool/pull/145)
- [PR #146 — CODE profile and executor identity candidate, unmerged](https://github.com/VlDMlNSh/developer-cloud-pool/pull/146)
- [PR #147 — additive research, unmerged](https://github.com/VlDMlNSh/developer-cloud-pool/pull/147)
- [Pass 21 report](2026-11-19-pass-21-current-base-d1-retirement-precondition-audit.md)
- [Canonical Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
