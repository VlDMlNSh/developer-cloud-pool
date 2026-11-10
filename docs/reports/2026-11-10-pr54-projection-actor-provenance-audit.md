# 2026-11-10 — PR #54 projection audit actor provenance finding and PR #55 exact-head CI recheck

## Scope and immutable targets

Repository: https://github.com/VlDMlNSh/developer-cloud-pool

- PR #55: `edff010388897f23f58bceb92e5180a09970fdff`, base `Основной` at `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #54: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, base `proof/immutable-task-attempts-audit-ci-2026-11-08` at `b9067dc7d06245893cd4e208f6215438efe5ca64`.
- Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`; PR #27 remains OPEN/DRAFT/UNMERGED.

## PR #55 exact-head CI recheck

PR #55 remains OPEN/DRAFT/UNMERGED. Exact-head workflow runs:

- Pool Contract Validation: run `42797001864`, job `129764618337`, COMPLETED/SUCCESS. Steps included checkout without persisted credentials, asserting worker dispatch remains disabled, YAML parsing and pool security contract validation.
- GitHub Approval Event Adapter Fixture Tests: run `42797001989`, job `129764618860`, COMPLETED/SUCCESS. The job checked out source without persisted credentials and ran `node --test`.
- Formal GitHub reviews: 0. Inline review threads: 0. Combined status contexts: empty.

These are positive exact-head CI results only. The fixture workflow remains PR-only and synthetic; it does not invoke the native `issue_comment` loader or instantiate real Octokit transport. No live approval, nonce consumption, dispatch, D1, provider, secret or deployment qualification is implied.

## PR #54 exact-head CI and source audit

PR #54 remains OPEN/DRAFT/UNMERGED. Exact-head run `42537241204`, job `128904147572`, COMPLETED/SUCCESS. Steps included pinned Node setup, exact dependency installation, syntax check and Cloudflare Workers-runtime D1 tests. This is local Workers/Miniflare proof, not hosted D1 qualification. Formal reviews and inline threads were 0 before this pass.

Reviewed the 50-approval contention test and the terminal projection outbox implementation. The 50-way test asserts 50 approvals attach to one logical task and one delivery outbox, all decisions remain `dispatch:false`; the projection lease test asserts one winner among 20 contenders. These remain local runtime proofs.

### Finding — projection transition audit loses actor identity

File: `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql`, line 89.

The `pool_attempt_projection_status_event` trigger writes `NEW.lease_owner` to `actor_id`. Both `markProjectionRetryable()` and `acknowledgeProjectionDelivered()` clear `lease_owner` in the same UPDATE that changes status. Consequently the emitted `delivery.retryable` and `delivery.delivered` events record `actor_id = NULL`, losing the worker identity responsible for the transition. Existing tests assert event types but do not assert actor identity.

A COMMENT review with an inline finding was successfully submitted to PR #54, anchored to exact head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`: review ID `5841304151`. Requested correction: preserve `OLD.lease_owner` for transitions out of leased (or persist an explicit transition actor), and assert actor identity in tests. This is a provenance/correctness finding, not an approval or independent review.

## Changes and safety

- No source code, workflow, secrets, variables, permissions, database resources, dispatch flags, provider calls or deployments changed.
- No merge performed.
- No real D1 resource or credential accessed.
- `POOL_DISPATCH_ENABLED` remains outside this pass and must remain disabled until all governance and runtime gates qualify.

## Status

- PR #55 synthetic fixture and contract CI: VERIFIED on exact PR head; native event integration and real Octokit transport: NOT RUN; production authorization: NOT QUALIFIED.
- PR #54 local Workers/Miniflare D1 tests: SUCCESS on exact PR head; projection audit actor provenance: FINDING OPEN; hosted D1 qualification: NOT RUN; independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Re-read PR #54 after the author addresses review ID `5841304151`; verify trigger actor attribution and tests on the new immutable head, then re-run exact-head D1 proof. Do not merge or enable dispatch. Keep hosted D1 qualification blocked until an already-authorized, isolated free-tier backend and narrow credential scope are evidenced.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Live follow-up recheck — 2026-11-10 12:56 UTC

- PR #54 metadata re-read: OPEN / DRAFT / UNMERGED; branch `test/50-approval-logical-task-contention-2026-11-09`; HEAD remains `ec3f3266ca28c4fb5633a9475cc6f396a4677974`; base remains `proof/immutable-task-attempts-audit-ci-2026-11-08` at `b9067dc7d06245893cd4e208f6215438efe5ca64`.
- No author response or correction is present in the PR timeline. Review `5841304151` remains the only submitted review; inline thread `PRRT_kwDOVirI-s61rjeP` remains unresolved and non-outdated.
- Re-read migration blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` from the exact PR head. The status trigger still stores `NEW.lease_owner`; the provenance defect remains unchanged.
- Exact-head CI remains run `42537241204`, COMPLETED / SUCCESS. It does not cover hosted D1 or actor identity assertions; no newer exact-head run exists in the returned commit workflow list.
- PR #55 metadata re-read: OPEN / DRAFT / UNMERGED; HEAD remains `edff010388897f23f58bceb92e5180a09970fdff`. Exact-head runs `42797001864` and `42797001989` remain COMPLETED / SUCCESS. No reviews or comments are recorded. Scope remains synthetic/read-only; production integration is not qualified.
- No repeated comment was posted. No code, workflow, permission, secret, variable, D1 resource, dispatch, provider/model call, deployment or merge was changed.
- Status: PR #54 actor provenance finding OPEN; PR #54 local proof CI SUCCESS; hosted D1 qualification NOT RUN. PR #55 synthetic fixture CI VERIFIED; production authorization NOT QUALIFIED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: when PR #54 receives a new head, inspect the SQL trigger and transition functions, require actor-identity assertions for retryable and delivered, then verify exact-head D1 proof. Until then, avoid duplicate review noise and continue with another bounded Contour A audit lane.
