# Cloud Pool live-state revalidation — 2026-11-16

## Immutable refs and scope

- Cloud Pool default branch: `Основной`; observed HEAD `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- Audit/documentation branch: `docs/next-2026-11-15-controller-d1-audit`, based on the above default baseline.
- MediaHub OS main HEAD: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Read-only GitHub metadata/source audit. No workflow dispatch, provider call, secret read, deployment, merge, or application-code change.

## Cloud Pool pull requests

### PR #99 — documentation audit
- OPEN / DRAFT / UNMERGED; head `a92d97e9769d1d772e445fa4cd45c28cbc0b107d`; base `6507823e7ec27caa9b2621daef964dba2d4cf436`; mergeable reported true.
- Exact-head check-runs endpoint returned zero checks. CI: NOT VERIFIED.
- Formal review list empty. Independent review: NOT VERIFIED.
- Documentation branch remains separate from default; do not treat PR #99 as merged or canonical default state.

### PR #98 — /next admission and ledger proof
- OPEN / DRAFT / UNMERGED; head `f23cdb5484d5923e02242b3ea142397f9e1f0270`; base `6507823e7ec27caa9b2621daef964dba2d4cf436`; mergeable reported true.
- Three exact-head checks all completed SUCCESS: run `43758616823` (job `132949585672`), run `43758657644` (job `132948250839`), and run `43758657648` (job `132948250752`).
- Formal review list empty. The PR is a non-dispatching admission/ledger proof; no live pool/controller dispatch or production execution is established.

## Gemini controller transport reconciliation

- MediaHub main controller workflow blob: `7799f0fc713c5bd772ce6820df40a926a83445c8`.
- PR #421 merged as `f16e5bae202a78584f273132e7f88c6e25d3142e`; its approved Option B design converted child workflows to reusable `workflow_call` and local controller jobs, removing REST child dispatch.
- PR #432 later merged as `1a6e5a16ef9950b72dda04abd69a27f019922489`; its description explicitly restores REST dispatch of three `workflow_dispatch` child workflows with HMAC-signed child authorization and `MEDIAHUB_GITHUB_TOKEN`.
- Current main controller source still has REST `/dispatches` and references `MEDIAHUB_GITHUB_TOKEN`. Current child workflow files expose `workflow_dispatch`, not `workflow_call`.
- PR #421's merged state therefore does not mean Option B is active. This is a material governance/transport divergence requiring an explicit reconciliation decision and independent security review.
- PR #432 body itself identifies prerequisites: separate `MEDIAHUB_DISPATCH_HMAC_KEY` and least-privilege `MEDIAHUB_GITHUB_TOKEN`; effective secret presence/scope was not verified here. No secret values were read.
- Issue #301 remains OPEN and says it is a tracker, not dispatch authorization. Its ordered acceptance work includes A0 issuer/ingress/lifecycle, target manifest, schema/security review, then controlled worker execution. Its current visible body does not independently qualify these gates.
- No new Gemini batch was launched in this pass. Prior Wave 317 success remains historical evidence only; do not claim it as a run from this pass.

## Status and next bounded action

- PR #98: exact-head CI VERIFIED; formal review NOT VERIFIED; implementation remains draft/non-dispatching.
- PR #99: exact-head CI NOT VERIFIED (zero checks); formal review NOT VERIFIED.
- Gemini controller: transport/governance divergence BLOCKED; no launch.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: reconcile the approved Option B decision with merged PR #432 and current main. Either restore and independently validate controller-only `workflow_call` transport under the existing authority, or obtain a new explicit governance decision for a revised transport. Before any dispatch, verify secret/variable metadata without exposing values, controller security gates, immutable target SHA, and current workflow checks.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
