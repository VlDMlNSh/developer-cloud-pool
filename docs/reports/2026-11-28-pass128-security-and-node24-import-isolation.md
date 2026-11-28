# Pass 128 — Security chain review, Node 24 CI migration and transitive Worker isolation

Date: 2026-11-28

## Status

**VERIFIED** — bounded source-level security review of the controller → collector → independent Actions context → envelope verifier → local D1 receipt path; transitive Worker import-graph guard; Node 24 action migration for both validation workflows; exact PR merge-result CI.

**NOT VERIFIED / NOT RUN** — independent external security review, live `issue_comment` controller execution, hosted D1 behavior, live provider/executor routing, effective branch ruleset metadata and production deployment.

Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Default branch `Основной`: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Starting Pass 128 continuation state: Pass 127 documentation head `dbb3c27ec0d679f9dd6e3be8f3b722733b04002e`.
- Pass 128 final code/test head: `d5a08db2f01158ea8a457190401126b2f19afda9`.
- Exact PR merge-result checked by CI: `a1a6e41eb16bcd63d72f18bbb3cf7ee5911cc1bf` (merge of Pass 128 code/test head into the default HEAD above).
- PR #188 remains OPEN / DRAFT / UNMERGED.
- Scope limited to validation-workflow Node 24 migration, stronger import-graph isolation checks and source-level review. No runtime, dispatch or production authority was added.

## Reuse First

Reused official GitHub first-party Actions already evaluated in Pass 127:
- `actions/checkout` v7.0.1, immutable SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`, Node 24 runtime.
- `actions/setup-node` v7.1.0, immutable SHA `949feb2413d6458794dcd2491c4babbbce0c15c1`, Node 24 runtime.

Updated:
- `.github/workflows/d1-ledger-proof-validation.yml`: both action pins migrated; `package-manager-cache: false`.
- `.github/workflows/pool-contract-validation.yml`: checkout migrated to Node 24 action SHA.

No new package, dependency, provider, service or paid resource. The action migration removed the Node20 deprecation warnings from these two validation workflows in the verified job logs.

## Security review — bounded findings

### 1. Workflow admission and privilege boundary

- Trigger remains only `issue_comment: created`.
- Job predicate remains repository-bound, Issue #96-only, excludes PR conversation comments, requires exact `/next`, numeric owner ID and `OWNER` association.
- Workflow/job permissions remain read-only: contents, issues and actions read.
- Checkout remains pinned to `github.workflow_sha` with `persist-credentials: false`.
- No alternate trigger, write permission, secret reference, dispatch or executor invocation was introduced.

### 2. Collector and source provenance

Reviewed `scripts/owner-next-api-envelope.mjs`:
- Fixed `https://api.github.com` origin and repository-scoped path validation.
- Redirects are rejected; response bodies are bounded to 256 KiB; requests have a bounded timeout.
- Raw webhook repository/owner/comment/sender identity is checked before API reads.
- API repository, issue, comment, run and workflow responses are cross-checked against immutable identifiers and expected state.
- Default ref is checked against the run target SHA; workflow bytes are fetched at `GITHUB_WORKFLOW_SHA` and their Git blob SHA is recomputed.
- Reruns fail closed pending durable reconciliation.
- Trusted Actions context is mapped independently from the raw webhook and runner environment; it is not copied from the API-derived envelope.

### 3. Workers verifier and D1 receipt

Reviewed `proofs/d1-ledger/src/owner-next-envelope.mjs`, `proofs/d1-ledger/src/github-next-event.mjs` and migration 0018:
- Verifier rejects duplicate JSON keys, unexpected schema keys, invalid owner/ref/run/workflow identity, event/context substitutions and digest mismatches.
- Attested adapter verifies the envelope before admission and binds the digest to the approval record.
- Receipt readback checks source comment identity, run/workflow provenance, immutable attestation fields and `dispatch_enabled = 0`.
- Migration 0018 constrains attestation schema/version and workflow/ref/blob provenance; existing append-only receipt guards remain.
- The collector-to-verifier-to-D1 composition is exercised with synthetic GitHub API fixtures in local Workers-runtime tests. This is not a live GitHub event or hosted D1 proof.

### 4. Worker import-graph isolation

Previous validator only inspected direct imports in the Worker entrypoint. This pass replaces that weak check with a recursive source graph traversal:
- Traverses static local `import` and `export ... from` edges.
- Rejects dynamic import, CommonJS `require`, non-relative imports and missing import targets.
- Resolves real paths and rejects symlink escapes outside the Worker source root.
- Rejects reachability of the legacy synthetic event adapter, attested adapter, API collectors and controller modules.
- Unit tests cover an inert entrypoint, transitive forbidden adapter, dynamic/require/non-relative imports and symlink escape.
- Current Worker graph: `modules=1 edges=0`; Worker entrypoint remains intentionally inert and returns 404.

The graph guard is a source-policy check, not a sandbox for hostile code.

## CI evidence

Both workflows checked out exact merge-result `a1a6e41eb16bcd63d72f18bbb3cf7ee5911cc1bf`:

- Isolated D1 Ledger Proof run `46176960877`, job `141077728349`: SUCCESS; 9/9 files, 140/140 tests.
- Pool Contract Validation run `46176960864`, job `141077735842`: SUCCESS; 42/42 Node tests, `POOL_CONTRACT_VALIDATION=PASS`, `WORKER_IMPORT_GRAPH=PASS modules=1 edges=0`.
- Both logs show exact merge-result checkout. Neither log contains the previous Node20 action deprecation warning.

During this pass, two intermediate CI attempts failed because newly added regex assertions had incorrect escaping. Those failures were diagnosed from job logs, assertions were corrected, and the final exact merge-result CI above passed. No production code was weakened to obtain green CI.

## Repository and governance state

- PR #188: OPEN / DRAFT / UNMERGED.
- Cumulative comparison to default: 239 commits, 94 files, +12,578 / -16.
- Formal PR reviews: 0; inline review threads: 0.
- Issue #96 remains OPEN.
- Default-branch Contents read for `.github/workflows/next-event-controller.yml` remains NOT_FOUND. GitHub requires an `issue_comment` workflow to exist on default branch before it can trigger. Live controller execution remains NOT RUN.
- Independent security review: NOT RUN.
- Effective ruleset/branch-protection conditions and `POOL_DISPATCH_ENABLED` metadata: NOT VERIFIED.
- No secrets read, hosted D1 writes, provider calls, dispatch, executor launch, deployment, merge or production mutation.

## Metrics

- D1 CI: 140/140 tests, 9/9 files.
- Pool Contract CI: 42/42 tests; contract PASS.
- Worker import graph: 1 module, 0 edges.
- Node20 action warnings in the two validation workflows: none in final logs.
- New dependencies: 0.
- Paid resources: 0.
- Active engineering time: NOT MEASURED.
- Performance benchmark: NOT RUN.
- External independent review: NOT RUN.

## Next critical path

1. Obtain independent security review of the full controller → collector → verifier → D1 chain.
2. Re-read effective branch protection/rulesets and dispatch metadata through an authorized metadata-only route.
3. Integrate the workflow only through approved governance; never copy it directly to default branch or bypass review.
4. After approved integration, verify default-branch workflow blob SHA and only then test a genuine owner-authored Issue #96 comment, with dispatch still false.
5. Keep PR #188 Draft/unmerged until independent review and governance gates pass.
6. Keep Contour B deferred.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
