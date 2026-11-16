# Cloud Pool live controller and D1 audit — 2026-11-15

## Scope and immutable baseline

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Immutable default HEAD inspected: `6507823e7ec27caa9b2621daef964dba2d4cf436`
- Audit branch: `docs/next-2026-11-15-controller-d1-audit`, created from that exact HEAD.
- No application code, workflow, secret, variable, deployment, dispatch gate, or production resource was changed.

## Cloud Pool /next admission proof

PR #98:
- OPEN / DRAFT / UNMERGED; HEAD `f23cdb5484d5923e02242b3ea142397f9e1f0270`; base `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- Compare: 9 commits ahead / 0 behind; merge base equals immutable default HEAD.
- Exact-head checks on this SHA: runs `43758616823`, `43758657644`, and `43758657648`, all completed SUCCESS. Contract job `132949585672`; security-invariant job `132948250752`.
- Job steps confirm syntax, adversarial admission/ledger tests, worker dispatch disabled, YAML parsing and security contract checks.
- No formal reviews. No workflow artifact uploaded. The code is a non-dispatching proof; it does not enable the pool or implement production execution.

Static source review:
- Admission requires exact owner `/next`, control issue #96, trusted default branch/ref and a 40-hex target SHA.
- Ledger records are digest-checked append-only issue comments under a required serialized lock; ambiguous dispatch-intent outcomes do not retry.
- The adapter deliberately stops before dispatch. `authorizeSingleDispatch` is not wired into a live controller; no production dispatch is implemented by PR #98.
- Treat as admission/ledger contract proof only, not a live supervisor/controller.

PR #97 remains an older draft on a stale base and should not be merged in place of #98.

## A0 → D1 / trusted route registry chain

- PR #87 HEAD `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, base default `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`; exact-head checks success.
- PR #92 HEAD `7014961587759b27d2ef6e91c60ce098d077ae83`, stacked on #87; two exact-head checks success. Exact replay now verifies admission, receipt, approval consumption, task/attempt/outbox and registry assertion chain; dispatch remains false.
- PR #93 current API HEAD `e200838d038b9cd48635233187819302bba6a33e`, base #92 HEAD `7014961587759b27d2ef6e91c60ce098d077ae83`; two exact-head D1 checks `43736264768` and `43736259303` success; formal reviews zero.
- PR #93 description is stale: it names prior HEAD `99ca50ce11efb380efa6346a1db672585876a8b1`, not the current API HEAD. Do not rely on stale provenance text; refresh the PR description/report before any acceptance.
- PR #86/#84 are older upstream layers; all remain draft/unmerged with no formal reviews.
- These are local Workers-runtime proofs. No hosted D1, production root custody, deployed runtime, provider call, dispatch, or route qualification is established.
- Durable monotonic revocation authority/watermark and rollback/replay resistance remain qualification gaps.

## Gemini controller live-state audit (MediaHub OS is separate repository)

- MediaHub main HEAD: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- PR #421 (Option B workflow_call design) merged on 2026-10-21 as `f16e5bae202a78584f273132e7f88c6e25d3142e`.
- Subsequent PR #432 merged on 2026-10-21 and changed the controller back to GitHub REST dispatch of three `workflow_dispatch` children. Its body records the REST/HMAC transport; formal reviews were zero.
- Current main controller blob: `7799f0fc713c5bd772ce6820df40a926a83445c8`; it still contains REST `/dispatches` logic and `MEDIAHUB_GITHUB_TOKEN` use.
- Current main child workflow blobs: Agent 1 `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`, Agent 2 `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`, Agent 3 `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`; each still declares `workflow_dispatch`, not `workflow_call`.
- Therefore PR #421 merge is historical evidence, not proof that its Option B design remains active on current main. Technical exclusion of direct child invocation is NOT VERIFIED; governance/transport mismatch remains open. No direct child dispatch was performed in this audit.
- Last positively observed three-agent controller wave: Wave 317, controller run `43758372020` SUCCESS at MediaHub SHA `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`. Child runs: Agent 1 `43758391124`, Agent 2 `43758392668`, Agent 3 `43758394303`; all completed SUCCESS. Jobs `132947478284`, `132947485744`, `132947491904` succeeded. Artifact digests:
  - Agent 1: `sha256:fb88a63579e4887f1fa36764576247566316dc695462f8817bcda5c8456cf0b9`
  - Agent 2: `sha256:767545b2f94464d39d0173495d5a6bcff9fc06bba8548d44aec22dcf9f7ff546`
  - Agent 3: `sha256:e0c016ee29057b2e8f2fc970133eace131a9a882473465cfa41a5d2ea6dc6548`
- This proves the previous Wave 317 batch, not a new launch from this ChatGPT /next message. The current chat message is not itself an owner-authored Issue #301 comment event; no controller was invoked in this pass.

## Decisions, status and next step

- PR #98: CI VERIFIED / independent review NOT RUN / UNMERGED.
- PR #92/#93: exact-head CI VERIFIED / independent review NOT RUN / unmerged local D1 proof.
- Gemini Wave 317: three child runs SUCCEEDED with artifact digests; this is prior-wave evidence.
- Gemini transport: current-main controller/child workflow source does not match the merged Option B workflow_call design; NOT VERIFIED for technical controller-only exclusivity.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next bounded task: reconcile the MediaHub controller transport regression (PR #432 and later workflow history) against the explicit Option B governance decision; restore and independently verify a controller-only call path or obtain explicit governance for a revised transport. In parallel, refresh PR #93 provenance text and close the durable revocation-watermark gap. Keep Cloud Pool dispatch disabled and do not merge drafts.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
