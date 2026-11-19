# 2026-11-19 — Pass 26: executor-bound canonical task identity v2

**Status: IMPLEMENTED / CI NOT VERIFIED.** This pass defines and tests an isolated canonical identity module; it does not integrate atomic admission.

## Frozen state and ancestry
- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140: OPEN; local/no-secret proof only, no dispatch/deployment/hosted D1/merge.
- PR #148 clean-base D1 base: `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #149 executor identity migration 0011: OPEN/DRAFT/UNMERGED, head `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- PR #150 Pass 26: OPEN/DRAFT/UNMERGED, stacked on PR #149, base SHA `3a64c045a6cdd5890846dbd75bc53952ed1ba718`, head `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb`.

## Implemented
- `proofs/d1-ledger/src/task-identity.mjs`: pure canonical identity v2 and SHA-256 task key derivation.
- Versioned tuple: `pool-task-v2, repositoryId, issueNumber, targetSha, capabilityProfile, executorId, schemaVersion=2`.
- Executor ID is an independent identity dimension, not folded into or substituted for capability profile.
- Executor ID syntax/length matches migration 0011 (1–128 restricted ASCII characters).
- `proofs/d1-ledger/test/task-identity.test.ts`: deterministic same-identity key, different executor separation, profile separation, stable tuple order/version, malformed input rejection.

## Validation
- GitHub exact-head workflow lookup for PR #150 head `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb` returned no runs at time of read-back. Exact-head CI: NOT VERIFIED; tests are authored but not claimed as executed.
- Source read-back of the module succeeded; blob `6c7b50a9aa18a461ff05926d076333ad52023f83`.
- No local runtime in this pass; no hosted D1, secrets/variables reads, provider calls, dispatch, deployment, merge or production mutation.

## Important limits
- The historical PR #72 adapter uses `pool-task-v1` and a DSH-only profile. It is source material, not safe to copy unchanged.
- PR #150 provides the v2 task identity contract only. It does not update the historical adapter, SQL atomic-admission migration, admission receipt, or task-key DB integration.
- Migration 0011's SQL conflict guard remains necessary; it is not a substitute for canonical adapter key derivation.
- Full atomic qualified admission, lease fencing, legacy write denial, upgrade fixture and independent review remain outstanding.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Rebase/adapt the historical admission adapter into the clean-base proof only after binding v2 task key and executor ID end-to-end in approval/task/admission/attempt/receipt/outbox SQL, then add exact replay, concurrent admission, mismatch, rollback and revocation-race tests. Keep dispatch false.

Links: [PR #150](https://github.com/VlDMlNSh/developer-cloud-pool/pull/150), [PR #149](https://github.com/VlDMlNSh/developer-cloud-pool/pull/149), [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140).
