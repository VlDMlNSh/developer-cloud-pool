# Wave 339 — D1 trusted-clock implementation design

Date: 2026-11-15
Status: source/design audit SUCCEEDED; implementation NOT RUN; trusted time NOT QUALIFIED.

## Trigger and supplementary execution

- Created exact supplementary MediaHub Issue #301 comment [6900348230](https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6900348230).
- This bridge event is not the Cloud Pool-native controller required by Issue #94. Controller and three child-run IDs/artifacts are NOT VERIFIED; do not claim parallel execution.

## Immutable repository state

- Cloud Pool default branch `Основной`: HEAD `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Isolated D1 candidate `integration/d1-ledger-clean-main-2026-11-15`: 6 commits ahead / 0 behind, merge base exactly default HEAD.
- PR #87: OPEN / DRAFT / UNMERGED; live head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, base `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Exact-head Actions: Isolated D1 Ledger Proof run [43712647597](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712647597) SUCCESS; Pool Contract Validation run [43712647615](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712647615) SUCCESS. These are recorded candidate evidence, not acceptance of the new trusted-clock design.
- PR #87 formal reviews: 0. Combined status contexts: empty / NOT VERIFIED.
- Documentation branch `docs/gemini-three-agent-next-bridge-2026-11-15`: 75 ahead / 0 behind; PR #95 OPEN / DRAFT / UNMERGED. This remains a documentation continuation branch, not default/production state.
- Issue #94 OPEN; Cloud Pool-native controller remains NOT IMPLEMENTED / NOT QUALIFIED.

## Source evidence re-read

- `proofs/d1-ledger/src/admit-qualified-task.mjs` blob `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`: input validation requires caller-supplied `input.now`; first-admission assertion, approval expiry/consumption, admission time, route freshness and exact replay all depend on it.
- `proofs/d1-ledger/migrations/0014_atomic_admission_registry_assertion.sql` blob `cb8a47d83faba62981daa8f7320da87baa2c55e2`: trigger compares rows against `NEW.checked_at`, but the insert currently receives that value from application input.
- `proofs/d1-ledger/src/trusted-route-registry.mjs` blob `12f1b09b238d61fa7cf3574221f3cb79f6d4767a`: bundle freshness and issuer evidence validation consume caller-supplied `now`; persistence binds that same value to snapshot `accepted_at` and registry pointer `updated_at`.
- `proofs/d1-ledger/migrations/0012_durable_route_registry_snapshots.sql` blob `485d8c2d2327a64c8d86ddc004134113d6ae3d80` requires `accepted_at >= issued_at` and `accepted_at < valid_until`; migration 0013 adds the persisted bundle/key structures; migration 0014 adds same-batch admission assertion.
- `proofs/d1-ledger/test/atomic-admission.test.ts` blob `4543d1db062da3e94ee839c50c79e3f01016b8b7` uses a synthetic future constant `NOW = 1_800_000_000`; it must be changed to derive fixtures from D1 `SELECT unixepoch()` when production code starts using database time. Otherwise the fixtures themselves will be future-dated relative to the engine clock.
- `proofs/d1-ledger/test/trusted-route-registry-persistence.test.ts` blob `0c52812ba17f77781231322a315f4d7b2d46283b` similarly uses a fixed synthetic `NOW` and needs DB-clock fixture conversion.

## Implementation design decision

Do not add a separate migration numbered 0015 for this clock repair: the proposed Revocation Authority Contract v1 reserves migration 0015/0016 for its independent revocation ledger/admission work. The clean D1 package is an unmerged proof candidate and no hosted D1 deployment is evidenced, so revise its not-yet-adopted migrations 0012–0014 only after source/test changes are ready; do not create a numbering collision or silently renumber the proposed revocation contract.

### A0 admission

1. Remove `input.now` from the trusted admission input contract and validation.
2. Make the first statement of the D1 batch insert the immutable registry assertion using `INSERT ... SELECT ..., unixepoch()`. The trigger then evaluates route/snapshot/key validity against DB-generated `NEW.checked_at`.
3. Every later statement in that same batch must read the exact assertion row's `checked_at` by `admission_id` for approval expiry/consumption, `admitted_at`, attempt `created_at`, receipt `committed_at`, and receipt/assertion equality. Do not call the clock independently in each statement and do not bind an application timestamp.
4. Exact replay must derive a fresh DB timestamp in the replay SELECT itself (one materialized CTE/scalar row), then recheck route, active snapshot and issuer-key windows against that value. It must not trust the caller's original timestamp.
5. A missing/invalid clock or failed assertion must fail closed. A failed D1 batch must roll back the assertion, approval consumption, admission, attempt, outbox binding and receipt; approval remains ready.

### Registry persistence

1. Obtain verification time from the D1 engine (read-only `SELECT unixepoch()`) before cryptographic freshness checks; never accept caller `now` as authority.
2. At the persistence batch boundary, set `accepted_at` and registry pointer `updated_at` from DB time in SQL, not from the preflight JS value.
3. Add DB guards so persisted acceptance is inside `issued_at <= accepted_at < valid_until` and meets the 300-second maximum-age policy; preserve monotonic epoch/pointer constraints. Preflight verification time and persisted acceptance time are distinct observations and must both be checked.
4. Treat DB clock health/rollback monitoring as an operational governance dependency; database time is not an independent cryptographic timestamp or whole-database restore anchor.

### Adversarial tests required

- Caller input has old, future, zero, missing, malformed or contradictory `now`: ignored/rejected by the API; it cannot affect decision.
- D1 clock returns no usable timestamp / DB unavailable: DENY, no state mutation.
- Route observed-at is too old, in the future, or expired at DB time; snapshot expired/too old; issuer key not-yet-valid/expired/revoked: fail closed.
- Registry epoch advances after preflight and before admission batch: stale assertion aborts; approval remains ready; no assertion/admission/receipt/task/attempt/outbox mutation.
- Inject failure after assertion and at each subsequent batch stage: all statements roll back.
- Exact replay rechecks current DB time and active trust state; expiry/revocation after original commit denies replay without rewriting the original receipt.
- Registry persistence uses DB-derived `accepted_at`/pointer time; future caller values cannot backdate or extend validity.
- Test fixtures derive `NOW` from D1 `unixepoch()`; no hard-coded future timestamps.

## Scope and safety

- No source, migration, test, workflow or default-branch changes in this pass.
- No hosted D1, provider/model calls, secret reads, dispatch, deployment, merge or resource provisioning.
- `dispatch:false` remains mandatory.
- Revocation event verifier/ledger, external anti-rollback checkpoint, Cloud Pool-native Gemini controller and web-console runtime remain separate Contour A blockers.

## Disposition

- Repository/source revalidation and implementation design: SUCCEEDED.
- Trusted DB clock implementation/tests: NOT RUN.
- PR #87 independent review and aggregate checks: NOT VERIFIED.
- Gemini bridge event: DISPATCHED / controller and child runs NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next: implement the admission DB-time materialization and registry persistence changes together on the clean PR #87 candidate, update D1 fixtures, run exact-head CI and re-read all rollback/replay evidence. Keep controller Issue #94 separate.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
