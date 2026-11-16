# 2026-11-16 — Gemini controller trigger and admission-gate audit

## Scope

Read-only revalidation of the active MediaHub main controller trigger path and the reasons a ChatGPT `/next` message does not itself launch GitHub Actions. No GitHub issue comment was posted, no workflow was dispatched, no provider/model was called, and no secret values were read.

## Immutable source refs

- MediaHub default branch: `main`; HEAD `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Controller workflow blob: `7799f0fc713c5bd772ce6820df40a926a83445c8`.
- Child workflow blobs: Agent 1 `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`; Agent 2 `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`; Agent 3 `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`.
- Contract test blobs: transport `5ae0e8db9465ce36bd4020df69b552c659cd6187`; child HMAC runtime `e92e1c3f4e52fb2005845e520d1bbe10dcdacfbe`; trigger coverage `48513b078d685b74d65adfcffe8e0813e7f19716`.
- PR #432 merged; PR #437 merged. Formal review API for PRs #431, #432, #434 and #437 returned zero submitted reviews.

## Verified trigger semantics

The active controller is not automatically triggered by a message in ChatGPT. Its owner comment bridge is a GitHub Actions `issue_comment: created` event on Issue #301, exact body `/next`, non-PR issue, author association `OWNER`, and trusted workflow ref `refs/heads/main`.

For this GitHub event, the controller:
1. checks `vars.MEDIAHUB_GEMINI_BATCH_ENABLED` and sets admission enabled only when its value lowercases to `true`;
2. requires the workflow to be running from `refs/heads/main`;
3. resolves or validates one immutable 40-hex target SHA;
4. uses the controller-only `MEDIAHUB_GITHUB_TOKEN` and `MEDIAHUB_DISPATCH_HMAC_KEY` to dispatch the three fixed child workflows;
5. signs each child payload and monitors exact child run IDs, jobs and artifact digests;
6. fails the batch if any child is not accepted/reconciled, successful, has verified successful jobs, or lacks artifact digests.

The `/probe` path is intentionally non-launching. The trigger contract tests explicitly assert that `/probe` never reaches readiness or dispatch. The November 16 trusted-main probe (controller run `43764634513`, probe job `132966862378`, assertion job `132966891092`) succeeded but readiness and dispatch were skipped; it proves caller context only, not Gemini execution or batch admission.

## Current gates

- PR #437 exact-head checks were reported SUCCESS: contract validation `39757948715`, non-launching probe `39757948751`, Astra Verify `39757948759`, Astra Cloud `39757948849`. These are PR-head checks, not proof of current-main exact-head CI.
- Current-main exact-head CI: NOT VERIFIED. The available commit-run/status wrapper returned no current-main run/status evidence; empty results are not success.
- Independent security review of the merged controller/child transport: NOT VERIFIED. Formal review APIs for PRs #431/#432/#434/#437 returned empty review lists.
- Effective repository/org secret and variable presence/scope metadata: NOT VERIFIED. No secret values were accessed. In particular, the `MEDIAHUB_GEMINI_BATCH_ENABLED` value and the effective scopes/least-privilege permission set for `MEDIAHUB_GITHUB_TOKEN` have not been evidenced by a permitted metadata result.
- Effective branch/org governance: NOT VERIFIED.
- Historical Wave 318 execution/provenance remains historical evidence only; it does not clear current admission gates.

## Decision

**New three-agent Gemini batch: NOT RUN.** This is a gate hold, not evidence that the controller source is absent or that the GitHub trigger contract is broken. A ChatGPT message cannot create the GitHub `issue_comment` event by itself. Posting a GitHub `/next` comment now would enter the admission path, but the required current-main CI, independent security review, effective secret/variable metadata and governance evidence are still unverified. Do not manufacture a dispatch or bypass the controller.

## Next bounded action

Obtain an independent security review of the exact current-main controller and child workflows, and collect exact-main CI plus metadata-only evidence for the batch flag, token permissions, HMAC secret scope and effective governance. Then re-evaluate the existing Issue #301 owner-comment route; do not redesign the controller unless that review finds a concrete defect.

## Cross-project status

- Cloud Pool default HEAD observed previously: `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- Cloud Pool PR #102 remains OPEN/DRAFT/UNMERGED; Issue #96 remains fail-closed.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
