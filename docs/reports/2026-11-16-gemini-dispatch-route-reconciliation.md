# 2026-11-16 — Gemini dispatch route reconciliation and Cloud Pool boundary

## Objective

Reconcile the request to attach three Gemini executions to every ChatGPT `/next` with the current Cloud Pool acceptance contract. Keep Cloud Pool Contour A as the only active project scope.

## Immutable repository state

- Cloud Pool repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Default HEAD observed: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- Cloud Pool PR #98: OPEN / DRAFT / UNMERGED; current PR metadata reports head `f23cdb5484d5923e02242b3ea142397f9e1f0270` in its body (PR #100 is stacked on that base); formal reviews for PR #98: 0.
- Cloud Pool PR #100: OPEN / DRAFT / UNMERGED; head `cb952a915093a4aaafb8f878954503d2460c4008`; formal reviews: 0. It explicitly fails closed with `DURABLE_LOCK_NOT_IMPLEMENTED`.
- Cloud Pool PR #102: OPEN / DRAFT / UNMERGED; head `e6613c152c5334db04f520cfe069f3bbd1c57772`; mergeable=false at read time; formal reviews: 0. It is only a read-only event-admission probe.
- Cloud Pool PR #106: OPEN / DRAFT / UNMERGED; head `15de4aa015493aec7ee5137f1e4dae9591c4ab4f`; mergeable=false at read time; formal reviews: 0.
- Cloud Pool control Issue #96 remains OPEN. Its contract expressly requires Cloud Pool-native control and says MediaHub Issue #301 is not a substitute.
- Parent requirement Issue #94 remains OPEN: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94.

## Gemini controller source reconciliation

The current MediaHub main controller source was re-read directly:
`https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml`.

The current source and tests show:
- Controller uses GitHub REST `workflow_dispatch` API calls with an HMAC-signed payload.
- All three child workflows (`gemini-autonomous-engineering.yml`, `gemini-agent-2.yml`, `gemini-agent-3.yml`) expose matching `workflow_dispatch` inputs and verify the HMAC before provider credentials are used.
- `tests/test_gemini_transport_controller_contract.py` explicitly tests this REST/HMAC + `workflow_dispatch` design.
- Therefore, the earlier Context Window statement that the controller's REST/HMAC transport mismatches child `workflow_dispatch` is incorrect and is superseded by this source-level reconciliation. This correction does NOT make MediaHub's controller a Cloud Pool controller.
- The MediaHub controller is fixed to MediaHub repository, Issue #301, its own secrets/variables and its own workflows. Issue #94 explicitly prohibits using Issue #301 as a substitute for Cloud Pool-native control.

## Live evidence

- MediaHub trusted-main no-secret probe run `43764634513` completed SUCCESS on main SHA `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`; it verifies only caller context for Issue #301 `/probe`, not Gemini execution.
- Probe comment `6901747908`; result comment `6901757142` confirms probe/assertion jobs SUCCESS and readiness/dispatch jobs SKIPPED.
- No fresh three-child dispatch was initiated in this pass. No secrets were read. Effective secret/variable presence and scope remain NOT VERIFIED.
- Historical successful three-agent waves remain historical evidence and do not establish a current live 3/3 batch.

## Decision and status

- Do NOT post `/next` to MediaHub Issue #301 as a workaround for Cloud Pool. Do NOT use MediaHub controller secrets or runs as Cloud Pool evidence.
- Cloud Pool-native Gemini Agent 1/2/3: NOT IMPLEMENTED / NOT RUN.
- Keep `POOL_DISPATCH_ENABLED=false`; no child dispatch, provider call, deployment, merge or qualification occurred.
- Cloud Pool PR #102 event probe is not sufficient for dispatch: trusted GitHub API re-fetch, durable idempotency, enforced lease/fencing, crash recovery, signed child task contract, child run/artifact reconciliation, and secret/variable metadata checks remain acceptance gates.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Advance the Cloud Pool-native Issue #94 stack only: complete the authenticated durable ledger/lease design (including fencing and crash recovery), then integrate the trusted-main controller and three child workflows within the Cloud Pool repository, using only Cloud Pool-scoped credentials and free-tier routes. Verify exact-head CI and governance before any live child dispatch.

## Evidence links

- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- PR #98: https://github.com/VlDMlNSh/developer-cloud-pool/pull/98
- PR #100: https://github.com/VlDMlNSh/developer-cloud-pool/pull/100
- PR #102: https://github.com/VlDMlNSh/developer-cloud-pool/pull/102
- PR #106: https://github.com/VlDMlNSh/developer-cloud-pool/pull/106
- MediaHub controller source: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- MediaHub probe run: https://github.com/VlDMlNSh/mediahub-os/actions/runs/43764634513
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
