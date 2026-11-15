# Wave 325 — registry writer-boundary and production integration audit

Date: 2026-11-15
Scope: read-only source audit of the stacked PR #87 → #92 → #93 route-registry / A0 admission proof. No source-code or runtime changes.

## Immutable targets

- Cloud Pool default branch: `Основной` @ `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- PR #87: `integration/d1-ledger-clean-main-2026-11-15` @ `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`.
- PR #92: `fix/a0-admission-exact-replay-receipt-integrity-2026-11-15` @ `7014961587759b27d2ef6e91c60ce098d077ae83`.
- PR #93: `fix/verified-registry-capability-clean-stack-2026-11-15` @ `e200838d038b9cd48635233187819302bba6a33e`.
- All three remain OPEN / DRAFT / UNMERGED and form one stacked dependency chain.

## Source audit and writer inventory

Inspected all 13 `proofs/d1-ledger/src/*.mjs` source files at the PR #93 stack head. Exact source blobs:

- `trusted-route-registry.mjs`: `916581ca07cf94edb21c8c2daa77a4c45db3d666`.
- `admit-qualified-task.mjs`: `878e6ecf70355d05f9738d579b9455124b7ac3f9`.
- `worker.mjs`: `214622f6dc94623521070eb9e7fbc2f573fdc2c6`.
- `qualified-route-evidence.mjs`: `0d5b97ad0bc59173fe8c4c7de28c67965bd09ad0`.
- Remaining inspected source blobs: a0-admission-contract `14c31d66995d6f99ceb6ea5df060ba8e00848464`; claim-outbox `37d75e2b31d9214b04398527eb08dce296f1ff27`; consume `f71e559a7c13b9a0242a7f619eba998c5906d95e`; projection-delivery `b09e9248323a57fff5e1c426eae012e2bb7aa3f0`; projection-envelope `cb1fb8b130c66343ca3b1c071aac506113c4cfb0`; projection-outbox `06e80d04b4bb16fbc74028cb716b9167dcc965a1`; projection-reconciler `4d440879a850fec1e3313b01df1b139e71d92fd7`; task-attempts `6cb028e048569700ed623d93462ef55e2392a084`; task-lease `b41edf89cdf960b2c007f38ba16554dc179f021a`.

Findings:

1. Within the inspected source set, the only code inserting into `pool_route_registry_snapshots`, `pool_route_registry_issuer_keys`, `pool_route_qualifications`, or advancing `pool_route_registry_state` is `persistTrustedRouteRegistryBundle()` in `trusted-route-registry.mjs`.
2. `persistTrustedRouteRegistryBundle()` no longer accepts caller-supplied bundle/signature/clock as authority. It requires the exact verifier result object registered in module-private WeakMaps by `verifyTrustedRouteRegistryBundle()`; copied/spread objects fail closed. The verifier retains a deep-frozen snapshot and detached signature. The persisted timestamp is the verifier-issued `verifiedAt`.
3. `admit-qualified-task.mjs` writes the admission assertion and reads registry state/snapshot/issuer/qualification rows; it does not create or update registry snapshots, issuer keys, qualifications or the active pointer. Its assertion insert is guarded by migration 0014 in the same D1 batch as approval consumption and task/attempt/receipt writes.
4. The inspected `worker.mjs` is deliberately inert and returns HTTP 404. It imports no registry writer and exposes no HTTP route. The local D1 proof therefore has no demonstrated production caller or deployed DB binding.
5. Migration 0013's route-qualification binding trigger enforces complete and consistent registry identity when any of the registry identity columns is supplied. It still permits legacy rows with all three registry-binding columns NULL; those rows do not satisfy migration 0014's admission assertion join and cannot pass that trusted-registry admission guard. This is a compatibility path, not evidence of an accepted route.
6. This source audit is limited to the PR #87/#92/#93 D1 proof source tree. It does not establish that every future/deployed D1 binding writer is restricted to this module, nor prove Cloudflare D1 authorization boundaries or production Supervisor/Worker integration. Treat production writer isolation as NOT VERIFIED, not as a proven bypass.

## CI and governance

- Exact-head local Workers-runtime D1 runs remain the previously recorded successes: PR #87 #43712647597 / contract #43712647615; PR #92 #43718679258 / contract #43718679251; PR #93 #43736259303 and #43736264768. PR #93 artifact #14170616460, SHA-256 `909e27d3bec1ca75933085475431f3ff5e4f9f8578985e1e2670d01336270c5a`.
- Formal reviews remain 0 across the stack; combined commit status contexts remain empty. Active ruleset #26550182 has no required approvals or status contexts. Independent security/provenance review is NOT RUN / NOT VERIFIED.
- The Cloud Pool default branch has no `.github/workflows/gemini-batch-dispatch-controller.yml`; `pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` has no `issue_comment` trigger and the default Worker blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` remains the DSH headless-probe profile only.
- Cloud Pool Issue #94 explicitly requires a Cloud Pool-native controller and prohibits using MediaHub Issue #301 as a substitute. Consequently no MediaHub /next comment, Gemini controller run, child dispatch, provider/model call, secret metadata read, or host action was initiated in this pass. Gemini Agent 1/2/3: NOT RUN for Cloud Pool.
- Issue #94 acceptance still requires a dedicated owner-only exact-/next control issue, trusted-main controller, immutable SHA-bound envelopes, comment-ID idempotency, three bounded child runs, full artifact reconciliation, adversarial tests, exact-head CI, governance and metadata gates, plus a no-secret probe.

## Disposition and next step

- Registry writer inventory within the local proof source: VERIFIED (single intended writer found).
- Production writer isolation / deployed D1 and Supervisor-Worker integration: NOT VERIFIED.
- PR #87/#92/#93 integrated independent review: NOT RUN / NOT VERIFIED.
- Gemini children for Cloud Pool: NOT RUN; Cloud Pool-native controller is not present on default.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next bounded unit: continue Issue #94's Cloud Pool-native controller contract and no-secret static/adversarial test design, while independently obtaining a formal review of the #87/#92/#93 stack. Keep all dispatch disabled until every gate passes.
- No merge, deployment, provider/model execution, secret read, paid resource, or runtime mutation.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
