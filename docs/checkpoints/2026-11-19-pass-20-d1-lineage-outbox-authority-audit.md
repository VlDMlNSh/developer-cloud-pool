# 2026-11-19 — Pass 20 D1 lineage and outbox authority checkpoint

**Status:** VERIFIED — source lineage and conflicting task-ready authority identified. Canonical migration manifest remains NOT APPROVED.
**Default HEAD:** `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (signature verified).
**Candidate PR #146 HEAD:** `4aeb9bddecd747ca533ba5619be83fc4809e2a95`.
**Source PR heads:** #67 `a53f6232bd5b50d3e150addf528b8e722002f9dd`; #72 `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; #111 `687196738782432797bf394f1342cb9df19f478f`.
**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

## Main finding
Migration 0003 preserves a legacy approval-keyed trigger `pool_approval_consumed_legacy_claim_outbox`. PR #146 migration 0007 replaces the task-keyed trigger but does not remove the legacy trigger. Both `pool_task_outbox` and `pool_task_delivery_outbox` therefore remain writable task-ready queues through separate approval-consumption paths. Adapter `claim-outbox.mjs` exports both `claimAndEnqueue` and `claimLogicalTask`.

Recommended sole task-ready authority: `pool_task_delivery_outbox`. Keep `pool_attempt_projection_outbox` distinct as downstream projection delivery. Retire the legacy trigger and writer in a forward-only migration; preserve historical migration files. This is a recommendation, not an approved schema change.

## Other migration conflicts
- #67 0001 hardcodes retired `dsh-headless-probe`; #146 0001 changes profile to CODE.
- #67 projection outbox 0006 conflicts ordinal with #111/#146 lease guard 0006; renumber in composed manifest.
- #72 0011 admission hardcodes retired profile and requires semantic port, not direct transplant.
- #146 0007 binds executor identity but profile remains a separate capability identity.
- Exact source SHA matrix is in `docs/reports/2026-11-19-pass-20-d1-lineage-outbox-authority-audit.md`.

## Validation / non-actions
Source blobs were fetched by exact SHA. No local migration simulation, schema changes, hosted D1, secrets, provider calls, executor launch, dispatch, deployment, merge or agent dispatch. Manifest NOT APPROVED.

## Effort estimate
Yesterday's baseline: 45 engineering hours total. Pass18 prior deliverable credit: 12–15h. Pass19 + Pass20 in this chat: estimated 3.5–5.5h equivalent. Cumulative deliverable credit: 15.5–20.5h. Remaining: 24.5–29.5h (central 27h). This is estimated engineering-equivalent effort, not a timer; actual active hours NOT MEASURED.

## Next
Build a clean-base composed migration candidate, remove legacy approval-keyed trigger/writer, add one-outbox assertions and verify projection queue remains separate. Then port admission to CODE profile with explicit identity/evidence binding.

Report: `docs/reports/2026-11-19-pass-20-d1-lineage-outbox-authority-audit.md`.
Canonical MediaHub OS map (deferred reference):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
