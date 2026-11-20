# Pass 14 — current-base D1 integration target freeze

Date: 2026-11-19  
Status: **VERIFIED — current-base target branch created and read back; source composition NOT FROZEN; implementation NOT RUN.**  
Contour: A only.

## 1. Fresh baseline and governance

- Default branch `Основной` re-read from GitHub: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Default commit parent: `68183828cf7934e89109310c8f99281be4eb7ed8`; tree `c8c78a26a6359ec868922e4040c2870eec873b66`.
- Default commit signature: verified (valid).
- Default recursive tree: `truncated=false`; no `proofs/d1-ledger` package is present in default.
- Active ruleset #26550182 still applies to `refs/heads/Основной`: PR required, thread resolution required, zero required approvals, no bypass actors, deletion and non-fast-forward prohibited. Classic branch protection endpoint was not re-probed in this pass.
- Issue #140 remains OPEN. Its scope is local no-secret qualification only; no hosted D1, secrets/variables inspection, provider calls, dispatch, deployment, merge or production actions.
- Owner authorization comment #7014947185 allows a separately bounded non-production qualification stage using synthetic data and free-tier resources, without changing existing executor identity/routes. It does not authorize production operations, paid fallback, governance changes or merge.

## 2. New implementation target

Created branch `integration/d1-current-base-2026-11-19` from exact default SHA `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

Read-back confirms:
- branch HEAD `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`;
- parent `68183828cf7934e89109310c8f99281be4eb7ed8`;
- tree `c8c78a26a6359ec868922e4040c2870eec873b66`;
- source branch is exactly current default, no commits added;
- inherited baseline commit signature is valid.

The integration branch is a frozen target only. It has no D1 implementation yet.

## 3. CODE profile source contract

PR #146 remains OPEN/DRAFT/UNMERGED. Current head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`; base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

Owner-confirmed immutable profile ID: `jarvis-code-sandbox-v1`. Contract blob `21b04b125349441f6296694a6f780d44c33ef896` states:
- profile status PROPOSED / NOT QUALIFIED / NOT ENABLED;
- executor identity, profile, provider route/model, account/quota/credential handle, host, lease and issuer are separate dimensions;
- default network deny and dispatch false;
- proposed resource ceilings are not yet owner-approved/runtime-enforced;
- host/process attestation and route qualification remain separate gates.

PR #146 current-head workflow runs:
- Pool Contract Validation `44522152749`: SUCCESS on `9d32c4943ae87f5855ab05d42a4ba12d1c205211`.
- Isolated D1 Ledger Proof `44522152799`: SUCCESS on the same exact head.
These runs are candidate proof only; PR #146 is not merged and does not establish canonical integration or executor qualification.

## 4. Source candidates and unresolved composition

- PR #67 remains the historical ledger/projection baseline (0001–0010); it is not current-base.
- PR #72 remains the admission extension (0011) but has legacy `dsh-headless-probe` literals across SQL/adapters/tests and other known gaps.
- PR #111 provides a lease-running guard candidate, but its own 0006 ordinal conflicts with #67 projection migration 0006; any port must be renumbered and tested against the final trigger graph.
- PR #146 provides owner-confirmed CODE profile contract, executor-ID binding, OIDC workflow-principal proof and registry resolver. Its 0006 is the lease guard and 0007 binds executor ID, but its schema does not contain #67 projection 0006–0010 or #72 atomic admission 0011.
- Pass 13 clean-main integration branch adds durable route-registry snapshots and admission-time assertion in its 0012–0014, but is 6 ahead / 18 behind current default and remains research-only. Those objects may be selectively reused only after dependency and signature/issuer semantics review.
- PR #114/#125 remain a competing D1 authority and must not be stacked with the selected ledger.
- No migration sequence or source manifest is approved in this pass. In particular, do not infer that the final migration order is 0001–0011 plus a guessed 0012/0013 sequence.

## 5. Required design freeze before schema edits

Produce an explicit migration/object ownership manifest proving:
1. one approval/admission authority;
2. one logical task identity and one task-ready outbox;
3. one immutable attempt/event model and one reconciler;
4. one current lease and positive fencing generation, with stale-worker denial;
5. one immutable binding tuple including repository, target SHA, task, attempt, executor ID, CODE profile/version, host, route qualification, lease and approval;
6. one trusted event predicate and independent trusted default-ref SHA read;
7. atomic receipt/approval/task/attempt/outbox/registry binding;
8. no legacy DSH profile and no parallel claim/outbox path;
9. all adapter results expose `dispatch:false` and `executionAuthorized:false`.

Only then may source files be transplanted selectively onto the frozen branch. Keep `dispatch:false`, `executionAuthorized:false`, `dispatchAuthorized:false`.

## 6. Tests, actions and limits

- No code/schema/workflow changes on the new integration branch.
- No local tests executed in this pass.
- Exact-head PR #146 CI evidence is listed above; it does not run on the new integration branch.
- No hosted D1 provisioning or writes, no secret/variable inspection, no provider calls, no controller dispatch, no executor launch, no deployment, merge or branch protection changes.
- Gemini NOT RUN; Claude Code host/process qualification NOT RUN.

## 7. Next

Next pass: complete a line-by-line migration/object ownership matrix across #67/#72/#111/#146 and the Pass 13 registry migrations; inspect all adapters and tests for duplicate outbox, legacy profile, identity tuple, trusted ref provenance and output safety. Freeze the exact source manifest before first schema edit. The current-base integration branch is ready as an immutable target but is not yet an implementation.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub OS map (Contour B reference only):  
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
