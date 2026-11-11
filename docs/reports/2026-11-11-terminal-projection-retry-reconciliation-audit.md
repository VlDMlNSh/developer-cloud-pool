# Terminal Projection Retry and Reconciliation Conformance Audit — 2026-11-11

- Scope: read-only source/contract audit of PR #58 and PR #59; related PR #61 / #24 / #25 current-head CI spot checks.
- PR #58: https://github.com/VlDMlNSh/developer-cloud-pool/pull/58
- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #58 immutable head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; base PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59 immutable head: `22200226da4f1af30645cf441a639db6893e9310`; base PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #58 reconciler blob: `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- PR #59 projection-outbox adapter blob: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.

## Verified evidence

1. PR #58 is OPEN / DRAFT / UNMERGED. Exact-head PR workflow run 42979949181 completed SUCCESS; its ten fake-boundary tests cover lost response, delayed visibility, reconciliation-only no-POST, digest conflict, duplicate markers, label convergence and failures. No formal reviews or inline threads.
2. PR #59 is OPEN / DRAFT / UNMERGED. Exact-head PR workflow run 42981807825 completed SUCCESS; its local Workers-runtime D1 suite reports 3 files / 53 tests. No formal reviews or inline threads.
3. PR #59 is explicitly same-worker recovery only. `deadLetterExpiredProjection` requires matching lease owner + generation + expired lease + exhausted attempt count. It is not an independent reaper. PR #60 correctly treats independent recovery as a separate authority design.
4. PR #59 migration records the prior lease owner when lease ownership is cleared (`COALESCE(NEW.lease_owner, OLD.lease_owner)`), but that identity remains delivery attribution, not authenticated Recovery Actor identity.
5. PR #59 adapter accepts caller-supplied `now`; this is only local deterministic test time, not production trusted time. It does not establish hosted D1, issuer, clock or sender qualification.
6. PR #61 current head `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`: run 42991794791 SUCCESS. PR #24 head `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`: runs 42982847600 and 42982847694 SUCCESS. PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`: runs 42228269689 and 42228269676 SUCCESS. All are draft/local or contract validation evidence only; no formal reviews found in the inspected PRs.

## Conformance findings — PR #58

### F-01 — delayed-visibility retry is not bounded in the adapter (design gap)

The fake reconciler exposes caller-controlled `allowPost: boolean`. After a POST whose marker is not yet visible, it returns RETRYABLE. A later reconciliation-only pass with `allowPost:false` is safe and is tested. However, the module itself has no retry counter, backoff/cooldown, durable attempt identity, or one-shot retry capability. A subsequent caller can pass `allowPost:true` while the first comment remains temporarily invisible and create another comment. The local test suite does not exercise that second-post path under delayed visibility.

This is not a production incident because the PR explicitly has no live GitHub client or credentials. It means the fake protocol proof does not establish bounded duplicate avoidance. Before any real sender, couple retry authorization to durable outbox attempt/generation state and an explicit reconciliation delay/budget; test visibility races where the first POST becomes visible immediately after the second read.

### F-02 — prefix-wide managed-label deletion needs an explicit ownership contract

The reconciler classifies every `pool:*` label as managed, then removes every one not in the desired set. This intentionally removes `pool:claimed` in the current fixture, but it also removes any other `pool:*` label, including future lifecycle/governance labels. Before live wiring, define the exact terminal projection label allowlist and prove that labels outside that allowlist cannot be deleted by this component. Keep unrelated non-`pool:` human labels preserved.

### F-03 — envelope accepts multiple terminal labels

`validateEnvelope` accepts one to three distinct labels so long as each is outcome-compatible. It does not enforce one canonical terminal lifecycle label. This may be broader than the Worker lifecycle invariant; reconcile it against the authoritative issue lifecycle contract before accepting the sender envelope. Add negative tests for two simultaneous terminal labels unless multi-label semantics are explicitly approved.

## Disposition

- PR #58 local fake-GitHub proof: CI VERIFIED at exact head; protocol qualification INCOMPLETE (F-01..F-03).
- PR #59 local D1 retry/dead-letter proof: CI VERIFIED at exact head; hosted/backend and independent recovery NOT QUALIFIED.
- PR #60 issuer/time design: remains prerequisite; no production issuer or trusted clock evidenced.
- PR #58/#59 independent review: NOT RUN.
- No source changes, merges, secret access, hosted provisioning, real GitHub writes, dispatch or deployment.
- Keep both dispatch gates fail-closed; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step

Amend the PR #58 design/tests (on a new bounded review pass) to prove bounded retry under delayed visibility, enumerate exactly which pool labels this reconciler owns, and align terminal label cardinality with the Worker lifecycle contract. Keep it fake/local and dispatch:false until the protocol is accepted and a separately authorized live sender is qualified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
