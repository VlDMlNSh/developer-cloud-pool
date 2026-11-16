# 2026-11-16 — PR #432 Option B governance regression audit

## Scope and immutable targets

Read-only audit of the merged MediaHub Gemini transport change against the explicit owner decision and merged PR #421 Option B contract. No workflow dispatch, provider calls, secret/variable reads, merge, deployment, or infrastructure mutation.

- MediaHub main HEAD observed: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- PR #421 head: `185f55b63121b1aece7e60f6c087ecfceab2721e`; merge commit: `f16e5bae202a78584f273132e7f88c6e25d3142e`.
- PR #432 head: `33ae44f3ca77337553b97819f5190d57d157fe5e`; merge commit: `1a6e5a16ef9950b72dda04abd69a27f019922489`.
- Current controller blob: `7799f0fc713c5bd772ce6820df40a926a83445c8`.
- Current child blobs: Agent 1 `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`; Agent 2 `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`; Agent 3 `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`.

## Primary governance evidence

Owner comment [Issue #301 comment 6289586838](https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6289586838) explicitly says “APPROVE OPTION B” and authorizes:
- three child workflows changed to `workflow_call`, with standalone `workflow_dispatch` removed;
- one manually invoked controller;
- only explicitly listed per-child provider secrets; no `secrets: inherit`;
- no `MEDIAHUB_GITHUB_TOKEN` passed to children or model processes;
- independent review, actionlint, positive/negative contract tests and exact CI before integration.

The same owner decision explicitly does not authorize agent execution, automatic merge, deployment, or Contour A qualification.

PR #421 is the merged implementation of this Option B design. Its PR body lists independent review and exact-head validation as required pre-merge gates. The review API returned an empty review list for PR #421; this audit therefore does not claim that formal independent review was recorded.

PR #432 is also merged. Its body describes a different REST/HMAC + `workflow_dispatch` transport and itself says it must remain Draft/unmerged pending exact-head CI, independent security review, governance/branch-protection evidence and a no-secret probe. The review API returned an empty review list for PR #432. No separate owner authorization for this reversal was found in the examined Issue #301 approval record.

## Source-level regression

PR #432's diff changes all three child workflow triggers from `workflow_call` back to `workflow_dispatch`, adds dispatch ID, immutable target SHA and HMAC signature inputs, and replaces reusable-workflow caller context with a child-side HMAC authorization job.

Current main read-back confirms:
- controller blob `7799f0fc...` references `MEDIAHUB_GITHUB_TOKEN` and `MEDIAHUB_DISPATCH_HMAC_KEY`;
- all three current child workflow files declare `workflow_dispatch`, not `workflow_call`;
- the current controller/children are internally consistent with REST/HMAC, but inconsistent with the approved Option B owner decision and PR #421's merged architecture.

The controller blob was read back from main. Its current content is not an assertion that the token or HMAC secret is present/configured; no secret or variable values/metadata were inspected.

## Exact-head CI evidence

PR #432 head `33ae44f3...`:
- Astra Verify run `39648761007`: FAILURE; job `119391236908`; compile step failed and downstream checks were skipped.
- Gemini workflow contract validation run `39648761390`: FAILURE; job `119391238470`; “Run controller transport contracts” failed after lint and several other contract steps passed.
- Astra Cloud Runtime Validation run `39648760929`: SUCCESS.
- Non-launching caller-context probe run `39648761566`: SUCCESS.
- Controller probe run `39648761507`: SUCCESS.
- Combined commit status endpoint returned no status entries; the listed workflow-run evidence is the available exact-head evidence.

PR #421 head `185f55b6...`:
- Gemini workflow contract validation run `39475766192`: SUCCESS; job `118811191780`; controller transport contracts passed.
- Non-launching controller-only batch/probe run `39475766513`: SUCCESS, but Agent 1/2/3 execution jobs were SKIPPED. This is not evidence of Gemini dispatch or provider execution.
- Other observed runs: Astra Verify `39475766199` SUCCESS; Astra Cloud Runtime Validation `39475766251` SUCCESS.
- Review API returned no formal reviews.

The successful no-secret probe does not compensate for the PR #432 exact-head failures, missing independent review, or missing governance authorization for the transport reversal.

## Findings and disposition

1. **VERIFIED — governance regression:** current main implements REST/HMAC + child `workflow_dispatch`, while the explicit owner approval and merged PR #421 specify reusable `workflow_call`.
2. **VERIFIED — PR #432 review gate absent:** formal review list is empty.
3. **VERIFIED — PR #432 exact-head CI was not green:** at least two relevant workflow runs failed, including the controller transport contract suite.
4. **NOT VERIFIED — effective secret/variable configuration and scope:** no values or metadata inspected.
5. **NOT VERIFIED — independent security acceptance of the post-PR-432 transport:** no formal review evidence.
6. **NOT AUTHORIZED — new Gemini batch:** do not dispatch via REST/HMAC or invoke children directly until the transport decision is reconciled and all controller gates are re-established.

## Required next bounded step

Restore the approved Option B workflow_call architecture on a fresh branch from current main, or obtain a new explicit owner/governance decision authorizing REST/HMAC as a superseding architecture. Any corrective PR must include independent security review, positive and negative contract tests, actionlint and exact-head CI. Do not dispatch agents while this remains unresolved. Keep Cloud Pool Issue #96 fail-closed and PR #102 Draft/unmerged pending its own independent review.

## Cross-project status

- Cloud Pool default HEAD: `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- Cloud Pool docs branch: `docs/next-2026-11-15-controller-d1-audit`, PR #99 OPEN/DRAFT, head `de8339758b2005c2cd7508d697798ec5c941c952`.
- Cloud Pool PR #102: OPEN/DRAFT/UNMERGED, head `a19aca5c31bf6a39104f4eb10296a94eab404fda`; read-only probe only, not a production dispatcher.
- Cloud Pool Issue #96 remains fail-closed. No Cloud Pool dispatch.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
