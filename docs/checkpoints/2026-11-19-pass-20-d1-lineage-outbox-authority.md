# 2026-11-19 — Pass 20 D1 lineage and outbox authority checkpoint

**Status:** VERIFIED — source lineage audit completed; migration manifest remains NOT APPROVED / NOT APPLIED.
**Default HEAD:** `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (signature verified).
**PR #146 candidate:** `4aeb9bddecd747ca533ba5619be83fc4809e2a95`; OPEN / DRAFT / UNMERGED.
**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

## Work performed
Compared exact migration trees and SQL blobs across PR #67, #72, #111 and #146. Confirmed:
- CODE-profile and retired DSH profile are competing 0001 roots.
- #67 owns 0006–0010 projection lineage; #111/#146 reuse 0006 for lease guard, and #146 uses 0007 for executor identity, colliding with #67's 0007.
- #72 0011 admission remains DSH-profile-specific and its task-key algorithm omits executor identity unlike #146.
- Approval-keyed `pool_task_outbox` and task-keyed `pool_task_delivery_outbox` remain dual task-ready paths because the legacy trigger/adapter survives. Select the task-keyed outbox as sole task-ready authority; retire legacy writer/adapter additively.
- `pool_attempt_projection_outbox` remains a separate terminal projection queue.

## Candidate ordering (not approved/applied)
Preserve #67 0001–0010 with CODE-profile root variant, then append new unique migrations for legacy-route retirement, executor binding, lease guard and semantically adapted CODE admission (example 0011–0014). Existing migrations remain immutable. Full rationale and exact blob SHAs are in the Pass20 report.

## Evidence / non-actions
- PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; #72 `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; #111 `687196738782432797bf394f1342cb9df19f478f`; #146 `4aeb9bddecd747ca533ba5619be83fc4809e2a95`.
- Issue #140 OPEN; bounded non-production owner authorization comment #7014947185 remains available. PR #146 reviews 0 / threads 0.
- Default combined status pending/0 contexts — NOT VERIFIED.
- Existing #146 exact-head CI remains SUCCESS: runs `44582839780`, `44582839702`, `44582828669`; it does not test the proposed combined migration manifest.
- No SQL changes, local tests, hosted D1, secret values, provider calls, executor launch, dispatch, agents, deployment, merge or governance changes.

## Next
Build clean-base migration composition fixture and adversarial tests: one task-ready writer/reader, legacy route inert, projection outbox independent, executor included in task identity, lease guard and CODE admission/revocation. Exact-head CI and independent review before any hosted D1.

Report: `docs/reports/2026-11-19-pass-20-d1-lineage-outbox-authority.md`.
Canonical MediaHub OS map (deferred reference):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
