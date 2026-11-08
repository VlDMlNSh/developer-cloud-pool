# PR #53 F2 finalizer fencing — bounded exact-head audit — 2026-11-09

## Immutable target and scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #53 head: `b8a253f06418841d5f0250c9fd550bf3247db040`.
- PR #53 base: `feat/reusable-pool-worker-boundary-2026-11-06` @ `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- PR state: OPEN / DRAFT / UNMERGED; mergeable=true.
- Scope: source-level finalizer protocol, exact-head CI evidence, review evidence, and recovery failure modes. No source mutation, dispatch, Worker execution, DSH, provider/model call, deployment, secret read or merge.

## Exact-head CI
GitHub Check Runs for exact head `b8a253f...`:
- Reusable Pool Worker Boundary Validation: run `42513724733`, job `128832083652`, COMPLETED / SUCCESS.
  - Checkout exact PR head: SUCCESS.
  - Syntax-check Supervisor: SUCCESS.
  - Authorization boundary tests: SUCCESS.
  - Finalizer fencing adversarial tests: SUCCESS.
- Pool Contract Validation: run `42513724707`, job `128832072329`, COMPLETED / SUCCESS.
  - Checkout without persisted credentials: SUCCESS.
  - Assert dispatch remains disabled: SUCCESS.
  - Workflow YAML parse: SUCCESS.
  - Pool security contract validation: SUCCESS.
- Commit status endpoint: `pending`, zero legacy statuses. This is not a failure of the two completed check runs; report checks individually.
- Formal PR reviews: 0. Inline review threads: 0. PR comments: 0.
- CI verifies static/unit behavior; no live GitHub API orchestration, race test, recovery integration, or production backend test was run.

## Positive findings
- Supervisor derives claim generation from GitHub Actions run ID + run attempt and binds the full issue body SHA-256 digest.
- Worker checks the exact generation, immutable body digest, open issue state, unique managed state, caller/callee identity and target SHA before the probe.
- Finalizer checks issue number, open state, immutable body digest, exact generation and unique claimed state; it removes the generation and claimed labels and verifies readback.
- Workflow permissions remain job-scoped; finalizer has Issues write only; worker is read-only.
- Both dispatch-gate assertions passed in the exact-head contract job. No dispatch occurred.

## Blocking F2/F10 findings

### F2-R1 — state mutation and audit provenance are not recoverable as one logical operation (HIGH)
Source: `scripts/pool-finalizer-runner.mjs`, blob `b0af6b4d97ac497315ac90978518cb63efd6e3ac`.
Sequence:
1. PATCH terminal labels and remove `pool:claimed` plus the generation label.
2. Verify terminal label read-back.
3. POST the audit comment.
If step 3 returns an error, times out, or the response is lost after GitHub persisted the comment, the task is already terminal but the workflow reports failure/unknown outcome. A rerun cannot repair this by replaying the same finalizer: `buildFinalizationPlan` requires exactly one current generation label and the `pool:claimed` state, both removed in step 1. There is no durable audit outbox, idempotent comment lookup/reconciliation, or terminal-state recovery branch.
Result: terminal projection and provenance can split; an exact retry is rejected. This contradicts the Shared Immutable Claim Lifecycle Contract requirement that terminal state and audit evidence commit together or remain represented as an explicitly recoverable pending finalization.
Required remediation: persist a finalization intent/outbox in the authoritative store before or atomically with terminal state; make comment delivery idempotent and retryable; retain a recoverable FINALIZING state until audit delivery is confirmed; test lost response and duplicate delivery. GitHub Issue labels/comments alone cannot supply cross-endpoint atomicity.

### F2-R2 — acknowledged non-CAS stale-writer race remains (HIGH / known)
The runner reads the issue, builds a plan, then PATCHes a complete label set. GitHub Issues label PATCH has no compare-and-swap in this implementation. Another actor can alter claim generation/state between final read and PATCH; the stale finalizer can overwrite the newer labels. Read-back detects some outcomes but does not prevent a lost update or make the mutation atomic.
Required remediation: use a qualified conditional-write backend/fenced authoritative state transition; GitHub labels/comments must be projections only. Do not describe the label approach as race-free.

### F2-R3 — tests do not exercise runner API failure/recovery (MEDIUM)
The new 9-test suite validates the pure plan function: body mutation, closed issue, stale generation, duplicate generations, duplicate finalization, identity and digest. It does not execute `pool-finalizer-runner.mjs` with a mocked GitHub API to inject PATCH success + comment failure/lost response, competing writer, read-back lag, duplicate comment or recovery.
Required remediation: add deterministic runner integration tests with mocked API responses and explicit failure injection, plus authoritative-store recovery tests after backend selection.

## Disposition
- PR #53 exact-head static/unit CI: VERIFIED / SUCCESS (2 runs).
- F2 pure-policy tests: VERIFIED for covered cases.
- F2 finalizer recoverability: NOT VERIFIED / BLOCKED by F2-R1.
- F2 atomic fencing: NOT QUALIFIED / BLOCKED by F2-R2.
- Independent/formal PR review: NOT RUN (0 reviews, 0 threads).
- PR #53: keep OPEN / DRAFT; do not merge or enable dispatch on this evidence.
- Issue #38 remains OPEN; D1 remains a local qualification candidate only. Use the backend-neutral lifecycle contract as the acceptance oracle.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Evidence links
- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Exact boundary run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42513724733
- Exact contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42513724707
- Runner source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/b8a253f06418841d5f0250c9fd550bf3247db040/scripts/pool-finalizer-runner.mjs
- Pure policy source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/b8a253f06418841d5f0250c9fd550bf3247db040/scripts/pool-finalizer.mjs
- Shared lifecycle contract: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/contracts/SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md
- Autonomous-First policy: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/policies/AUTONOMOUS-FIRST-DEVELOPMENT-AND-ACCEPTANCE.md
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
