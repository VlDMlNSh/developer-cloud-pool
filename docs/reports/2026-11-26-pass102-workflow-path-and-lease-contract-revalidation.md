# Pass 102 — workflow path and lease contract revalidation

Date: 2026-11-26

## Status

- **VERIFIED:** documented GitHub Actions workflow-run `path` format is `<workflow-file>@<branch>`; PR #176's suffix comparison is consistent with the official REST response example.
- **VERIFIED:** PR #175 lease adapter uses the injected `trustedClock()`, not caller-supplied `input.now`; existing tests explicitly exercise ignored future/past caller timestamps.
- **NOT VERIFIED:** live `issue_comment` event behavior in this repository, same-run API-attested envelope to D1 composition, workflow-file blob/ancestry attestation, production authenticator/clock wiring, live D1 and executor runtime.
- **BLOCKED / NOT ACCEPTED:** Contour A.
- **DEFERRED:** Contour B.

## Frozen target and scope

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Scope: revalidate current PR heads and CI, resolve the prior workflow-run path concern against GitHub's official REST API schema, inspect the D1 lease adapter and tests, and correct Pass101 documentation. No runtime or code changes.

## Current candidate refs and CI

| PR | Head SHA | Exact-head Actions |
|---|---|---|
| [#174](https://github.com/VlDMlNSh/developer-cloud-pool/pull/174) | `a8809c1dc8c2eaa49944fb031baeec54ce46b922` | [45677997233](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45677997233) Pool Contract SUCCESS |
| [#175](https://github.com/VlDMlNSh/developer-cloud-pool/pull/175) | `3d69bc943677dba909792bf4930d4c0aa5d2233f` | [45690428935](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45690428935) D1 SUCCESS, 8 files / 123 tests; [45690428805](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45690428805) Pool Contract SUCCESS |
| [#176](https://github.com/VlDMlNSh/developer-cloud-pool/pull/176) | `ca53ed9eb625d2532aa00cc269cf7f8617d97266` | [45705794330](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45705794330) Pool Contract SUCCESS, 21/21 verifier tests |

All three remain OPEN / DRAFT / UNMERGED; formal reviews 0 and review threads 0. These are candidate checks, not merge-result or runtime qualification.

## Finding 1 — workflow-run path

The official [GitHub REST API workflow-runs documentation](https://docs.github.com/en/rest/actions/workflow-runs) includes a response example whose `path` is `.github/workflows/build.yml@main`. The current verifier comparison:

```js
workflowRun.path === EXPECTED_WORKFLOW_PATH + "@" + repository.default_branch
```

is consistent with that documented shape when the repository default branch is `Основной`. The prior Pass101 claim that the expected suffix was probably incorrect is withdrawn and corrected in the Pass101 report/checkpoint.

This schema example is not a live `issue_comment` run from this repository. No such event run was observed; event-specific qualification remains NOT RUN.

## Finding 2 — D1 lease time source

Inspected PR #175:
- `proofs/d1-ledger/src/acquire-attempt-lease.mjs`
- `proofs/d1-ledger/test/lease-fencing.test.ts`

The adapter requires an injected `trustedClock` function and calls it after executor authentication and primary task/attempt precondition reads. It rejects thrown, non-positive, non-safe-integer and rollback values against persisted `updated_at` / attempt `created_at`. It bounds TTL to 1–900 seconds, writes the lease with generation fencing, and verifies the task/attempt/event tuple through a primary read-back. Ambiguous writes are reconciled by another primary read-back. The caller's `input.now` is not used for lease time.

The tests explicitly pass future and past `input.now` values and assert the injected clock is used. They also test invalid and rollback clocks. This supports the adapter's local contract, but does not qualify the production clock provider, executor authenticator, distributed clock characteristics or deployed D1 semantics.

## Blocking composition edge

The API verifier in PR #176 returns `OBSERVED_ONLY`; it does not create D1 admission. PR #175's `bindGitHubNextEvent(context)` accepts a flat Actions-context object. There is no same-run callsite that constructs an immutable API-attested envelope from successful API read-backs and passes that exact object to D1 admission plus durable source-comment receipt.

Workflow-file bytes/blob identity and trusted ancestry are not independently bound into that envelope. The controller workflow is absent from default HEAD and exists only on candidate PR #176.

## Reuse First

- REUSE the existing Node built-in GitHub REST verifier and adversarial tests.
- REUSE the existing D1 ledger, migration 0017, lease adapter and Workers/Vitest harness.
- ADAPT the trust boundary to accept one immutable API-attested envelope, rather than a caller-shaped flat Actions context.
- BUILD only the missing same-run composition and workflow-code identity binding. No new third-party dependency is justified.

## Safety and non-actions

- No code, schema, workflow or dependency changes.
- Local tests newly run: 0; no claim of local test execution.
- No live webhook, hosted D1, D1 writes, workflow dispatch, executor launch, provider/model call, secret or token value read, repository variable read/write, Ruleset mutation, deployment, merge or production write.
- Gemini / Claude Code / ECC / FCC: NOT RUN.
- Independent security review: NOT RUN.
- Active engineering time: NOT MEASURED.

## Next bounded pass — Pass 103

Implement the same-run immutable API-attested envelope and workflow-file blob identity, then pass that exact envelope into the existing D1 admission/receipt adapter. Add end-to-end adversarial tests for API-response tampering, blob substitution, stale default-ref race, duplicate/replay/rerun, actor/repository mismatch and ambiguous D1 acknowledgement. Keep `dispatch=false` and `executionAuthorized=false`. Do not merge or enable dispatch.

## Canonical links

- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/main/docs/context/GITHUB-CONTEXT-WINDOW.md
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- PR #174: https://github.com/VlDMlNSh/developer-cloud-pool/pull/174
- PR #175: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- PR #176: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- MediaHub canonical map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
