# PR #37 latest-head follow-up — workflow identity correction and finalizer gap

Date: 2026-11-08 (Europe/Vilnius)
Scope: read-only source and exact-head CI review. No source, workflow, governance, secret, variable, infrastructure or deployment changes.

## Immutable refs

- Default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37: OPEN / DRAFT / UNMERGED; base `Основной`; current head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Prior reviewed head: `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- Current PR #37 worker workflow blob: `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- Current Supervisor workflow blob: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- Current Supervisor script blob: `2d0611851ff738b2aeb377f464e5fa7d821f3696`.

## Exact-head CI

At exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`:

- Reusable Pool Worker Boundary Validation run `42484039940`, job `128741929176`: COMPLETED / SUCCESS. Steps include exact-head checkout, Supervisor syntax check and authorization boundary tests.
- Pool Contract Validation run `42484039932`, job `128741928922`: COMPLETED / SUCCESS. Steps include dispatch-disabled assertion, YAML parsing and pool security contract validation.
- Combined commit status contexts: empty; do not interpret as an independent status-check pass.

## Finding disposition

### F1 — workflow context placement

The previous review identified job.workflow_* expressions in job-level env, where the context was unavailable. Current worker workflow places CALLEE_REPOSITORY, CALLEE_FILE_PATH and CALLEE_WORKFLOW_SHA in the step-level env of the validation step. The latest contract validator checks these exact step-level strings and rejects their job-level placement. The prior invalid-workflow placement finding is corrected at this head; exact-head CI is green. This does not establish a real reusable Worker execution or production qualification.

### F2 — finalizer does not bind terminal write to the validated envelope/claim generation

The current Supervisor finalizer still reads the issue and checks only that pool:claimed is present. It does not revalidate that the issue remains open, that Target SHA and Worker profile still equal the immutable values passed to the Worker, that exactly one managed state is present, or that the current claim belongs to this Supervisor run / claim generation. It then replaces managed labels with pool:probe-complete or pool:needs-review based only on the reusable workflow result.

Therefore, the earlier A→B mutation scenario remains possible at the source-contract level: Worker validates target A, issue content changes to target B while retaining pool:claimed, and finalizer can mark B complete based on A's result. This is a static source finding; no live race reproduction was run. GitHub Issue label PATCH is not compare-and-swap, and read-before-write/read-back does not provide database-grade atomic claim/finalization.

Required correction: bind finalization to immutable task envelope digest, target SHA, profile, issue state, claim/run identity and generation/fencing token; reject changed/closed/conflicting state; test stale, competing and mutated claims. Do not implement or dispatch before review/governance gates.

## Other unresolved acceptance gates

- Issuer/owner authority and signed approval provenance are not verified by workflow caller/callee identity alone.
- The D1 proof in PR #36/#39 is local Workers-runtime evidence, not integrated into this Supervisor/Worker flow or remote D1 qualification.
- Lease acquisition/renewal/reclaim, generation fencing, stale acknowledgement rejection, outbox delivery/retry/dead-letter and crash recovery remain unimplemented/unqualified.
- Active ruleset 26550182 was last recorded as requiring zero approvals, no required reviewers and no CODEOWNERS review; current effective ruleset was not re-read in this pass.
- Live `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` values were not read; NOT VERIFIED.
- No independent authorized security review is established. Existing review submissions from a separate connected account are COMMENTED / CHANGES_REQUESTED and explicitly say organizational independence and reviewer authority are NOT VERIFIED. They are not APPROVE.
- Default branch still contains the legacy privileged Supervisor/Worker chain. PR #37 is draft/unmerged and does not alter default behavior.

## Disposition

PR #37 F1 placement defect: corrected at current head, exact-head CI VERIFIED.
PR #37 F2 finalizer binding: OPEN / BLOCKING.
Integrated authorization / lease / outbox: NOT QUALIFIED.
Remote D1: NOT RUN.
Gemini controller dispatch: NOT RUN.
Worker/DSH execution and deployment: NOT RUN.
Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.

Next bounded step: test-first remediation of F2 on a separate immutable target, with explicit envelope + claim-generation contract and negative mutation/stale-claim fixtures; then exact-head CI and authorized independent review. Keep dispatch fail-closed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
