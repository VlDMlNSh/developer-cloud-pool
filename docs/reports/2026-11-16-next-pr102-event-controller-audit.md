# 2026-11-16 — /next: PR #102 event-controller trust and gate audit

Date: 2026-11-16
Parent objective: Cloud Pool-native /next controller, Issue #94.
Control surface: Issue #96.
Disposition: read-only source audit completed; PR remains Draft; no merge or dispatch.

## Immutable targets and live refs

- Cloud Pool default branch: `Основной` @ `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- MediaHub OS main: `main` @ `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- PR #102: `feat/cloud-pool-next-controller-readonly-2026-11-16` @ `a19aca5c31bf6a39104f4eb10296a94eab404fda`; base SHA equals current Cloud Pool default HEAD.

## A. Repository and governance recheck

- Cloud Pool repository default branch is still `Основной`; MediaHub default branch is still `main`.
- Issues #94 and #96 remain OPEN. Issue #96 explicitly keeps dispatch PLANNED / fail-closed.
- PR #100, #101 and #102 remain OPEN / DRAFT / UNMERGED. PR #102 mergeable=true is not acceptance evidence.
- PR #102 formal review list is empty (0 reviews); independent review is NOT VERIFIED.
- Cloud Pool default HEAD remains unchanged at `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- No repository variable/secret values were read. No dispatch gate was changed.

## B. PR #102 source audit

Files reviewed:
- `.github/workflows/next-event-controller-readonly.yml`
- `scripts/next-event-controller.mjs`
- `test/next-event-controller.test.mjs`

Verified properties:
- The workflow listens to `issue_comment.created`, but the event-admission job is scoped to Issue #96 and excludes PR conversation comments.
- The script checks exact repository/owner, default branch/ref, open issue state, exact `/next` body, owner login + `OWNER` association, safe positive comment ID and a 40-hex event SHA.
- It derives a deterministic identity from repository + issue + source comment ID.
- Permissions are `contents: read`; checkout disables persisted credentials; no API token, secret, variable, provider or child workflow is used.
- A positive evaluation explicitly returns `READ_ONLY_NO_DISPATCH` and `executionAuthorized: false`.
- GitHub issue-comment workflow execution is sourced from the default-branch workflow definition; the job also checks the expected default-branch ref and checks out the repository's declared default branch. This is a sound read-only trust-boundary starting point, not proof of canonical source-comment reconciliation.

Residual gaps (intentionally outside this PR's read-only scope):
1. The derived comment identity is not persisted; it is not durable idempotency.
2. `concurrency` serializes executions in its workflow group but is not an authoritative admission ledger or distributed lock.
3. The event payload is not re-read through the GitHub API; canonical comment ID/body/author/issue state and current default-branch SHA are not reconciled.
4. There is no durable controller-run record or end-to-end workflow/child run identity correlation.
5. The workflow has no write permissions and dispatches no children; therefore it cannot satisfy Issue #94/#96 execution acceptance.

No critical unsafe side effect was identified in this bounded read-only slice. This is a source audit by the primary assistant, not independent review; the formal independent-review gate remains OPEN.

## C. Exact-head CI evidence

All runs below are tied to PR #102 exact head `a19aca5c31bf6a39104f4eb10296a94eab404fda`:

- Push contract run `43815087262`: COMPLETED / SUCCESS. The event-admission job was skipped on the push event as expected; contract test job passed.
- PR controller workflow run `43815104716`: COMPLETED / SUCCESS; contract-tests job `133125329861` SUCCESS; event-admission job `133125331599` SKIPPED (the PR event is not an owner issue comment).
- Repository workflow/security validation run `43815104739`: COMPLETED / SUCCESS; job `133125261247` SUCCESS.
- Combined commit status endpoint returned an empty statuses array; named Actions runs above are the positive CI evidence. Empty status contexts are not an additional pass.
- Source contains 17 positive/negative test cases; the CI job completed successfully.

CI validates source/test and workflow invariants. It does not test a live Issue #96 event on default branch, durable idempotency, API reconciliation, dispatch, or child execution.

## D. Gemini agents and MediaHub controller

- New Gemini Agent 1/2/3 wave: NOT RUN.
- Cloud Pool Issues #94/#96 define a separate Cloud Pool-native controller; MediaHub Issue #301/controller is not a substitute and must not be repurposed.
- MediaHub main/controller remains at `1694cde38c7b7d69baf9676b4908c1bb6e197fbe` / workflow blob `7799f0fc713c5bd772ce6820df40a926a83445c8`.
- The previously recorded REST/HMAC + `workflow_dispatch` child transport versus approved `workflow_call` contract mismatch and independent governance review remain unresolved.
- No owner comment was posted, no controller dispatch was attempted, and no child workflow/provider call was made. Last confirmed historical Gemini batch remains controller `43763042415`, children `43763061253`, `43763062743`, `43763064255`; this is not a new wave.

## E. Disposition and next step

- PR #102: SOURCE-AUDITED; exact-head CI SUCCESS; OPEN / DRAFT / UNMERGED.
- Independent review: NOT VERIFIED.
- Durable idempotency, authoritative serialization, canonical API revalidation and workflow-run identity correlation: NOT IMPLEMENTED.
- Cloud Pool dispatch: NOT RUN; Issue #96 remains fail-closed.
- Gemini new wave: NOT RUN; MediaHub transport/governance gate unresolved.
- Live Gemini execution, provider routing/quota, remote web console, durable production state/recovery and Contour A acceptance: NOT VERIFIED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: obtain independent security/governance review of PR #102 before adding API read permissions or write-capable admission. After review, implement canonical comment/default-branch SHA revalidation and durable idempotency/serialization in a separate bounded change, retaining Issue #96 fail-closed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
