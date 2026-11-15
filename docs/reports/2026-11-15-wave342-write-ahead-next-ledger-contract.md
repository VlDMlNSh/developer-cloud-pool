# Wave 342 — write-ahead /next dispatch ledger contract

Date: 2026-11-15

## Result

Implemented a pure, fail-closed write-ahead ledger state machine and adversarial tests on the isolated PR #97 branch. Exact-head CI succeeded. No live controller, issue-comment persistence or workflow dispatch was enabled.

## Immutable refs

- Cloud Pool default branch `Основной` observed HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (rechecked via recent commit search; unchanged).
- Feature branch: `feat/cloud-pool-next-admission-contract-2026-11-15`.
- Draft PR [#97](https://github.com/VlDMlNSh/developer-cloud-pool/pull/97), base SHA `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`, head SHA `e216d0eb66af182258a9e8552677bbcad3b1d311). OPEN / DRAFT / UNMERGED.
- PR #97 formal reviews: 0. Aggregate status contexts: empty / NOT VERIFIED.
- Other open draft stack rechecked: PR #87 head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; #92 head `7014961587759b27d2ef6e91c60ce098d077ae83` based on #87; #93 head `e200838d038b9cd48635233187819302bba6a33e` based on #92; #95 head `f60efb394052bbb5af9c0d36190e63569eb9303c`. All OPEN / DRAFT / UNMERGED, formal reviews 0.

## Changes

- `scripts/next-dispatch-ledger.mjs`, blob `7b629889b7191f21c1e0099bc65f9dca1eaee460`.
- `test/next-dispatch-ledger.test.mjs`, blob `23ca351d00776a5372a9d72aa0ae116e7b13134b`.
- Updated `.github/workflows/next-admission-contract.yml`, blob `6902e72cd6bd7ce3670986af32f1a8b8a9c4f054`.

The protocol:
1. Requires a serialized controller lock before state evaluation.
2. Creates a digest-checked append-only record bound to repository, control issue #96, source comment ID, target SHA and deterministic dispatch ID.
3. Requires durable `ADMITTED` record before a `DISPATCH_INTENT` record.
4. Grants one dispatch permission only to the same invocation that has confirmed the intent append; the permission is not recoverable from persisted state.
5. On recovery, reconciles exactly one visible controller run.
6. If `DISPATCH_INTENT` exists but no matching run is visible, returns `AMBIGUOUS_NO_RETRY`; it does not automatically retry.
7. Duplicate ledger rows, duplicate matching runs, target rebinding and corrupted ledger records fail closed.

This intentionally prefers safety over availability. A crash after intent persistence but before the dispatch request can require manual reconciliation; the system does not guess whether the API request was sent.

## Exact-head CI

Head: `e216d0eb66af182258a9e8552677bbcad3b1d311`.

- [Cloud Pool Next Admission Contract — run 43756440044](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43756440044): COMPLETED / SUCCESS. All 8 job steps succeeded, including the combined admission and ledger adversarial suite.
- [Pool Contract Validation — run 43756439898](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43756439898): COMPLETED / SUCCESS. All 7 steps succeeded, including YAML parsing and dispatch-disabled security invariants.
- Formal review: 0 / NOT VERIFIED.
- Aggregate status contexts: empty / NOT VERIFIED.

## Explicit non-implementation

The PR contains protocol logic and tests only. It does not yet:
- persist ledger comments against live Issue #96;
- hold a real Actions concurrency lock or prove its serialization under load;
- list/reconcile real workflow runs by dispatch ID;
- connect an `issue_comment.created` trigger;
- dispatch a controller workflow or Gemini children;
- establish a signed envelope, artifact evidence, or multi-wave reliability.

No secret values or secret metadata were inspected. No provider/model calls, dispatch, paid resources, deployment, hosted D1, merge or Contour B work occurred. Dispatch remains fail-closed.

Issue #96 updated in comment [6900567298](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96#issuecomment-6900567298); PR #97 discussion updated in comment [6900566700](https://github.com/VlDMlNSh/developer-cloud-pool/pull/97#issuecomment-6900566700).

## Supplementary Gemini bridge

MediaHub Issue #301 comment [6900524362](https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6900524362) records the supplementary /next bridge event. It is not the Cloud Pool-native controller. Cloud Pool controller and child run IDs/artifacts were not evidenced; Gemini execution NOT VERIFIED.

## Status and next step

- Admission predicate and tests: SUCCEEDED.
- Write-ahead ledger state machine and adversarial tests: SUCCEEDED.
- Exact-head CI: SUCCEEDED.
- Live durable persistence / serialized concurrency / workflow-run reconciliation: NOT IMPLEMENTED.
- Cloud Pool-native controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Gemini three-child dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: implement a trusted-main controller adapter that appends and reads ledger records on Issue #96, holds one repository-wide concurrency group, and reconciles controller workflow runs using a deterministic run name. Keep dispatch disabled; add fake-API tests for append timeouts, delayed run visibility, crash-after-intent, duplicate event delivery and duplicate runs before connecting any live dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
