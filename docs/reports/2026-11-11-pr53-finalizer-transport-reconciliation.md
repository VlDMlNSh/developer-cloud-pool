# PR #53 — Finalizer injectable transport and reconciliation pass

- Date: 2026-11-11
- Scope: bounded implementation/test pass on draft PR #53 branch; no default-branch runtime changes.
- Immutable default snapshot before this report: 7bb525bd0b551181c8a212c5b723e29cc60ae863.
- PR base: 1be8672c1be1a720b6c813dcafff5c020b6456ae.
- Final PR #53 head: 3458b01c99e0a3ed62e5469dc11631ec5316b0cd.
- Compare PR #37 base → PR #53 head: 43 ahead / 0 behind, 11 files.
- PR #53 remains OPEN / DRAFT / UNMERGED; mergeable=true is not qualification.

## Existing component reuse

Reviewed PR #58 (6f7953e4abec3cc564984ee3635cdb7717ae5d5e), an existing local fake-GitHub projection reconciler. Reused its deterministic marker/read-back, no-blind-retry, delayed-visibility and reconciliation-only design principles. PR #58 is a local fake boundary proof, not live GitHub qualification and not a reason to add a new dependency.

## Changes

1. Added scripts/pool-finalizer-protocol.mjs with exported finalizeWithTransport(api, expected). The transport boundary is injectable; the production runner supplies the real GitHub adapter, tests supply fake transport.
2. Reordered terminalization: create deterministic run/attempt/envelope-digest audit marker and verify by read-back BEFORE terminal label mutation. If marker POST fails or visibility is delayed, terminal labels are not written.
3. Lost POST response is reconciled by reading comments; no blind second POST in the same attempt. Duplicate markers and digest conflicts fail closed.
4. Lost PATCH response is resolved by authoritative Issue read-back. Already-finalized Issue plus matching marker is idempotent.
5. scripts/pool-finalizer-runner.mjs delegates protocol sequencing to the injectable module; GitHub API adapter remains in the runner.
6. Added tests/security/pool-finalizer-runner.test.mjs: POST failure-before-commit, lost POST response, lost PATCH response, idempotent replay, delayed marker visibility, duplicate/conflicting markers, and explicit non-CAS race demonstration.
7. Updated contract validator, boundary test, and Pool Contract Validation workflow to execute both finalizer planner and fake-transport suites.

## Final source read-back

- scripts/pool-finalizer-protocol.mjs: blob c69a8a6bd465ade382e3f576ac557390c4f0a541.
- scripts/pool-finalizer-runner.mjs: blob 4b4b168624502ad38454a394af7faf4104919deb.
- scripts/pool-finalizer.mjs: blob d21e4dbeeacebd6f2bc1bfa1bbc5756b3baaa5ab.
- tests/security/pool-finalizer-runner.test.mjs: blob 88fcf67c99afd97605eb1726c68d79c8aa891f0c.
- tests/security/reusable-pool-worker-boundary.test.mjs: blob 511b2f21449660c5a68774f17d82b62b2f3d121d.
- scripts/validate-pool-contract.mjs: blob e400c4c9823ccf5f8d75fb066131df24d8d0f889.
- .github/workflows/pool-contract-validation.yml: blob 30a07348bf9b88897ad5fffd81bec9584b06c1f9.
- PR API head read-back: 3458b01c99e0a3ed62e5469dc11631ec5316b0cd.

## Exact-head CI evidence

Both push-triggered runs point to exact head 3458b01c99e0a3ed62e5469dc11631ec5316b0cd:
- Pool Contract Validation run 43042039819: COMPLETED / SUCCESS. YAML parse, pool security contract validator, and Node test command passed. Job log: 19 tests, 19 pass, 0 fail.
- Reusable Pool Worker Boundary Validation run 43042039837: COMPLETED / SUCCESS. Supervisor authorization boundary tests and finalizer adversarial tests passed.

Earlier intermediate commits had failing CI. Those failures were diagnosed and corrected; only the two final exact-head runs above are qualifying evidence for this source snapshot.

## Residual F2 — HIGH / OPEN

The fake-transport race test deliberately demonstrates that a concurrent human label added after the final GET can be overwritten by GitHub's whole-label PATCH. A subsequent GET may still show the desired terminal state, so read-back alone cannot prove that no concurrent label was lost. The test currently documents the hazard; it does not resolve it.

The audit marker is now verified before terminal labels, addressing the dangerous terminal-label-before-comment ordering for this protocol. However:
- GitHub Issue labels remain non-CAS.
- The fake transport does not qualify live API race behavior or transactional authority.
- No hosted authoritative claim store is connected to this runner.
- Independent security review remains NOT RUN.

## Governance and status

- Current active default-branch ruleset "Основной — verified" has required_approving_review_count=0, require_code_owner_review=false, and required_review_thread_resolution=true. It protects refs/heads/Основной, not this draft feature branch. This does not enforce independent review.
- PR #53 formal reviews: 0; inline review threads: 0.
- Issue #38 remains OPEN / NOT QUALIFIED.
- Dispatch remains FAIL-CLOSED.
- No secrets read, provider/model calls, Worker/DSH/Resource Probe execution, deployment, merge, hosted resource creation, or default-branch runtime changes.

## Next bounded step

Do not try to patch around GitHub's non-CAS endpoint. Reconcile the existing PR #39/#54 conditional-write/transactional-outbox work with Issue #38 and PR #58, then define the authoritative transactional Claim Store and retryable GitHub projection boundary. Re-run exact-head CI and obtain independent security/governance review. Hosted D1 remains NOT AUTHORIZED / NOT RUN pending account entitlement/quota proof and explicit authorization.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
