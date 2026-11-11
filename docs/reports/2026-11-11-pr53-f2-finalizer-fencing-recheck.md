# PR #53 F2 finalizer fencing — current-head security recheck

- Date: 2026-11-11
- Status: SOURCE PARTIALLY VERIFIED; F2 NOT RESOLVED; PR #53 NOT REVIEW-READY.
- Immutable default snapshot: `Основной@9cf09e684958a44e58228aba2c59641fcfe9ab39`.
- Immutable PR #53 head: `b8a253f06418841d5f0250c9fd550bf3247db040`.
- Parent PR #37 head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Compare #37 → #53: 26 ahead / 0 behind; ten changed paths, 26 commits. PR #53 remains OPEN / DRAFT / UNMERGED, mergeable=true. That status does not mean security-qualified.
- Exact-head PR-triggered workflow runs returned: none. CI NOT VERIFIED.
- Formal review submissions: 0. Inline review threads: 0. Independent security review NOT RUN.

## 1. Source read-back

Read from branch `fix/pr37-f2-finalizer-fencing-2026-11-08`:

- `scripts/pool-finalizer.mjs` blob `84ec79662097b9aeaeff0ca7d5b4b0524104c34d`.
- `scripts/pool-finalizer-runner.mjs` blob `b0af6b4d97ac497315ac90978518cb63efd6e3ac`.
- `scripts/pool-supervisor.mjs` blob `adc265c27617b0395b6b0ff275bacf3f1839cc0f`.
- `tests/security/pool-finalizer-fencing.test.mjs` blob `bfa3bfc9940f50befe1fdffe8d44ecc86ff32cfe`.
- Supervisor workflow `.github/workflows/pool-supervisor.yml` blob `7132542d605f5f8544a7235eb7d37ac32765e232`.
- Worker workflow `.github/workflows/pool-worker.yml` blob `19958cfa11d5ac09c130f64d27042cda5f562953`.

PR #53 adds SHA-256 body binding, a Supervisor run/attempt generation label, Worker-side generation validation and a finalizer that checks issue identity/open state/body digest/unique claimed state/generation before writing terminal labels. It preserves non-managed labels from the latest read and performs response/read-back checks. The implementation explicitly acknowledges that GitHub label PATCH is not CAS.

## 2. Findings

### F2-A — residual non-atomic mutation race remains HIGH

The finalizer performs GET → validate → GET → validate → PATCH labels → GET/read-back. The GitHub Issue labels PATCH endpoint does not atomically condition the update on the body digest, current labels, or generation observed by the preceding GET.

Consequences:
- An external actor can mutate the task body or claim labels after the final GET but before PATCH. The terminal label write may therefore be applied to a task state that no longer matches the validated envelope/generation.
- A concurrent human label edit between final GET and PATCH can be lost because PATCH replaces the complete label set assembled from the stale read.
- The subsequent read-back detects some mismatches only after the mutation has already happened. Detection is not rollback or fencing.

This is not merely a test gap; it is a property of the selected GitHub API primitive. The PR's own limitation statement correctly disclaims race-free finalization. Therefore F2 remains OPEN / HIGH / ACCEPTANCE BLOCKER for any dispatch authorization.

### F2-B — finalizer does not independently bind TARGET_SHA to the immutable body

The runner validates that `TARGET_SHA` is a 40-character SHA and that `ENVELOPE_DIGEST` matches the issue body, but `buildFinalizationPlan` does not parse the Target SHA from the body and compare it to `expected.targetSha`. The audit comment prints `TARGET_SHA` as provenance. Worker-side validation does compare the body SHA with the input, and the supervisor derives the input from the body, reducing exploitability in the current workflow chain; nevertheless, the finalizer should independently enforce the same binding before publishing provenance.

### F2-C — terminal state and audit comment are not one atomic operation

The runner PATCHes terminal labels and then POSTs the audit comment. If the comment request fails or its response is lost after the terminal label transition, a rerun will no longer see `pool:claimed` and the current planner rejects duplicate finalization. The issue can be terminal without its expected provenance comment. No deterministic audit marker reconciliation/replay path is implemented in this runner.

### F2-D — tests cover pure planning, not the runner protocol

The new test file contains nine unit tests for the pure finalization planner. It does not execute the fetch/PATCH/read-back/comment sequence against a fake GitHub transport, so it does not prove:
- concurrent mutation between the final GET and PATCH;
- human-label preservation under concurrent updates;
- PATCH success followed by lost response;
- terminal-label success followed by comment POST failure/lost response;
- idempotent recovery of terminal state and provenance.

## 3. Decision and required remediation

Do not attempt to describe the current implementation as race-free, exactly-once, or accepted. Keep PR #53 draft and both dispatch gates fail-closed.

Preferred remediation order:
1. Decide whether finalization authority must be moved to the same transactional claim store that owns the immutable envelope and claim generation. A DB conditional transition should be the authoritative terminalization; GitHub labels/comments should become a retryable projection, not the authority.
2. If GitHub remains the projection, add a deterministic marker and a reconciliation-only, idempotent comment/label projection protocol. Never requeue or redispatch from projection reconciliation.
3. Add a narrow fake-transport runner test suite covering the four race/failure windows above.
4. Bind the finalizer's expected target SHA to the immutable issue body and claim record before any write.
5. Obtain an independent security review and exact-head CI after remediation.

Mature component reuse remains the D1 conditional-write pattern already proven locally in PR #39/#54; this does not qualify hosted D1 or solve issuer authentication. The fake-GitHub projection/reconciler in PR #58 is a reusable test pattern, not a live API guarantee. No new dependency is required for this bounded remediation.

## 4. Explicitly unchanged

No runtime/default-branch code, schema, workflow, permission, secret, credential, dispatch gate, Worker execution, provider/model call, deployment, remote D1 resource, merge or branch update was performed. This is a read-only audit plus documentation publication. PR #53 remains an unmerged draft proposal.

## Status

- PR #53 F2 source: PARTIALLY VERIFIED.
- F2 atomicity: NOT RESOLVED / HIGH.
- Finalizer target binding: remediation required.
- Audit comment replay: NOT IMPLEMENTED.
- Runner integration tests: NOT PRESENT.
- Exact-head CI: NOT VERIFIED.
- Independent review: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: add a fake-transport runner harness and target-SHA binding to PR #53, while explicitly preserving the non-CAS limitation; then rerun exact-head CI and request independent review. Do not enable dispatch or claim race-free semantics.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
