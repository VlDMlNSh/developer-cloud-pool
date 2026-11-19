# 2026-11-19 — Pass 22 clean-base D1 migration manifest checkpoint

**Status:** VERIFIED — source-blob composition manifest. Implementation NOT RUN.  
**Immutable default target:** `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145 OPEN / DRAFT / UNMERGED.  
**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

## Live source state
- PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; exact-head runs 43600901063 and 43600901068 SUCCESS; stale base, do not merge as-is.
- PR #72 head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; exact-head workflow lookup returned no runs (NOT VERIFIED).
- PR #111 head `687196738782432797bf394f1342cb9df19f478f`; exact-head runs 43881396272 and 43881396386 SUCCESS.
- PR #146 head `4aeb9bddecd747ca533ba5619be83fc4809e2a95`; exact-head runs 44582839702 and 44582839780 SUCCESS.
- Issue #140 OPEN. PR #145/#146/#147 OPEN/DRAFT/UNMERGED. No merge or governance change.

## Candidate migration order
| Ordinal | Selected source |
|---|---|
| 0001 | #146 CODE-profile root blob `c14951239dfd6f93e20184f46373a8d13b62a69f` |
| 0002–0005 | Shared #67/#146 blobs: `44b8f7e...`, `49b079...`, `0ad590...`, `7a1989...` |
| 0006–0010 | #67 projection outbox chain: `660fa9...`, `767d95...`, `1d9385...`, `869194...`, `30ac9d...` |
| 0011 | #72 atomic admission blob `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc`, corrected for CODE profile and executor-bound task identity |
| 0012 | #111 lease guard blob `0610c4ee63f338e9b4d4db30ffe6fdffbaf6d854` |
| 0013 | #146 executor identity blob `47c2f0f7db6379e6760317fe3903214f6f31ffee` |
| 0014 | New forward-only retirement migration; not yet authored |

The old #67 migration 0006 projection outbox is preserved. #111/#146 lease guard is ported as 0012. #146 executor identity 0007 is ported as 0013. Historical source migration files are not edited.

## Required composition rules
- `jarvis-code-sandbox-v1` is the sole accepted capability profile; executor ID remains separate.
- Task-key canonical serialization must include executor ID; approvals/tasks/attempts must share the same executor binding.
- `pool_task_delivery_outbox` is the only task-ready outbox.
- `pool_attempt_projection_outbox` remains an independent terminal projection queue.
- Migration 0014 drops `pool_approval_consumed_legacy_claim_outbox` and rejects writes to `pool_task_claims` / `pool_task_outbox` without deleting historical rows.
- Remove/deprecate positive `claimAndEnqueue()`; every adapter result explicitly includes `dispatch:false` and `executionAuthorized:false`.

## Validation state
No code, migration, tests, implementation branch, hosted D1, secret, dispatch or deployment changed in Pass 22. No local tests or Pass 22 exact-head CI run. Existing green CI applies only to source PR heads and is not evidence for the composed candidate. Current detailed ruleset read-back unavailable.

## Next
Create a new implementation branch from the frozen default SHA, apply the manifest, author migration 0014, then run fresh-database and frozen-upgrade Workers-runtime adversarial tests before opening an implementation PR.

Report: [Pass 22 clean-base manifest](../reports/2026-11-19-pass-22-clean-base-d1-migration-manifest.md).
