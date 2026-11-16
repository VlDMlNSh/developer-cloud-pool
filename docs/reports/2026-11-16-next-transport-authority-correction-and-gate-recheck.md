# 2026-11-16 — MediaHub Gemini transport authority correction and gate recheck

## Scope and immutable evidence

Read-only reconciliation of the previous Cloud Pool audit's claim that PR #432 reversed an active owner-approved Option B architecture without authorization. No workflow dispatch, provider call, secret/variable value or metadata read, merge, deployment, or infrastructure mutation.

- MediaHub main HEAD observed: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Current controller blob: `7799f0fc713c5bd772ce6820df40a926a83445c8`.
- Current child workflow blobs: Agent 1 `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`; Agent 2 `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`; Agent 3 `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`.
- Bootstrap on canonical docs branch, blob `75f30750183efe8c6877368e9f0ada48f8e81ea7`.
- Transport policy blob `a4e2ca4f0d4745cf54f771cf73b69afa3d0f1a06`.
- PR #432 head `33ae44f3ca77337553b97819f5190d57d157fe5e`, merge commit `1a6e5a16ef9950b72dda04abd69a27f019922489`.
- PR #437 head `2e23f9a99e655369672340329c4c1b6de25f1576`, merged; PR #431 head `8177cce6859624e7740db204e0c19cb2bcdfe7ca`, OPEN/READY/unmerged.

## Corrected authority interpretation

The earlier report `2026-11-16-next-pr432-option-b-governance-regression-audit.md` incorrectly treated Option B approval in Issue #301 comment `6289586838` as the still-active transport contract and described PR #432 as an unauthorized governance reversal.

That conclusion is superseded by later project decisions and current normative records:
- PR #432's body explicitly describes the token-backed GitHub API + HMAC transport as the intended controller correction.
- The canonical Bootstrap §1A / §1A-1 (blob `75f30750...`) explicitly says the interim reusable `workflow_call` description after PR #421 is stale, identifies PR #432 as merged, and names REST/HMAC as the active implementation. It also explicitly keeps agent-mode blocked pending independent review, exact-main CI, secret/variable scope metadata, effective governance and trusted-main no-secret probe.
- The transport policy's current text is stale relative to Bootstrap: it still describes PR #431 as the correction and says PR #431 is open. It must be updated to reference current main and the PR #432/PR #437 history.
- Owner comment `6326219239` (Wave 332) corrected Bootstrap §1A/§1B to token-backed REST/HMAC and explicitly retained the dispatch gates.
- Therefore **Option B is historical/intermediate and superseded as the active transport**. PR #432's transport direction is authorized by the later owner-directed project record; this does not mean PR #432 passed its own stated review/CI gates or that runtime dispatch is authorized.

## Source and CI recheck

Current main controller blob `7799f0fc...` contains the controller-side GitHub API dispatch/HMAC transport; all three child workflows declare `workflow_dispatch` and verify signed inputs before provider steps. The source is internally aligned with the later Bootstrap direction.

PR #432 exact-head CI had failures:
- `39648761007` Astra Verify failed at compile.
- `39648761390` Gemini controller transport contracts failed.

Those historical failures were followed by the HMAC test repair and executable child authorization coverage in PR #437. PR #437 exact-head evidence:
- Contract validation run `39757948715`, job `119754631139`: SUCCESS; legacy/context/reusable/transport contracts and executable child HMAC authorization contracts all passed.
- Controller probe run `39757948751`: no-secret caller-context probe and assertion SUCCESS; `dispatch_and_monitor` and batch admission SKIPPED.
- Astra Verify run `39757948759`, job `119754631035`: SUCCESS; compile, unit tests and signed-command smoke passed.
- Astra Cloud Runtime Validation run `39757948849`: SUCCESS.
- Formal review APIs returned zero submitted reviews for PR #432, PR #437 and PR #431.

PR #431 is a separate, unmerged token-backed candidate based on the PR #421 merge. It has five observed exact-head workflows SUCCESS (`39600483360`, `39600483597`, `39600483335`, `39600483400`, `39600483390`), but it is not the active main implementation and has no formal reviews. Do not conflate PR #431 candidate CI with current main acceptance.

Current main HEAD `1694cde3...` had no workflow runs or combined status entries returned by the available commit-run/status queries. This connector's workflow-run wrapper filters to PR-triggered runs; empty output is not proof of passing main CI. Exact-main CI therefore remains NOT VERIFIED in this pass.

## Remaining runtime gates

- Trusted-main no-secret probe: VERIFIED non-launching. Issue #301 comment `6901747908` produced controller run `43764634513`; probe job `132966862378` and assertion job `132966891092` succeeded. Readiness and dispatch were skipped. This does not verify effective secret/variable presence/scope or agent execution.
- Effective `MEDIAHUB_GITHUB_TOKEN`, `MEDIAHUB_DISPATCH_HMAC_KEY`, provider secret and batch-enable variable metadata/scope: NOT VERIFIED. No values or metadata were read.
- Independent security review: NOT VERIFIED; formal review APIs for PR #432/#437/#431 returned empty arrays.
- Effective branch/org governance and exact-main required checks: NOT VERIFIED.
- Gemini new wave: NOT RUN. No controller dispatch, child invocation or provider call.
- Cloud Pool Issue #96 remains fail-closed; PR #102 remains OPEN/DRAFT/UNMERGED. Cloud Pool PR #99 documentation branch remains OPEN/DRAFT.

## Disposition and next step

1. Do not restore Option B solely on the basis of the older owner comment; it is superseded by later owner-directed REST/HMAC source records.
2. Do not launch Gemini yet. First obtain independent security review of the current main REST/HMAC controller and child authorization boundary; verify effective secret/variable metadata and least-privilege scope without exposing values; verify effective repository/org governance; and obtain exact-main CI evidence.
3. Update stale transport-policy documentation to agree with current Bootstrap/main source, preserving the historical PR #421/PR #432 decision history.
4. Keep Cloud Pool Issue #96 fail-closed and PR #102 unmerged until its own independent review.

Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
