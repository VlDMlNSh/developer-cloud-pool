# /next pass — read-only owner-event controller qualification boundary

Date: 2026-11-16
Scope: one bounded review of PR #112 and the live repository governance boundary. No production changes.

## Immutable target and repository state

- Default branch: `Основной`.
- PR #112 base SHA: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #112 head SHA: `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- PR #112: OPEN, DRAFT, UNMERGED; zero formal reviews and zero inline review comments at review time.
- Active ruleset: ID `26550182`, enforcement active, selector `refs/heads/Основной`; requires PR, zero required approvals, thread resolution, deletion/non-fast-forward prohibited, no bypass actors. No required status-check rule is present in the returned ruleset payload.
- Branch API reports `protected=false`; this does not override the active ruleset evidence.

## Reviewed artifact

PR #112 proposes `.github/workflows/next-event-controller-readonly.yml` (blob `772a6e78423f60dab862c5e237532a2da8654334`) and `scripts/next-event-controller.mjs` with adversarial tests.

The workflow:
- listens to issue-comment-created, PR and a branch-specific push;
- gives `contents: read` only;
- pins checkout and setup-node actions by commit;
- runs event admission only for newly created comments on open Issue #96;
- separates the event-admission job from contract-test job;
- does not grant secrets, write permissions, provider credentials or dispatch authority.

The controller contract in PR body validates exact `/next` body, owner identity, repository and issue numeric identities, trusted default-branch ref, issue API URL, comment identity and 40-character SHA. It is event-envelope validation only.

## Exact-head CI evidence

- Read-only controller run [43882090833](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090833), exact SHA `c9a4c0ab2001f01a09632795283071c521e1c99d`: COMPLETED / SUCCESS.
- Job `133350342861`: SUCCESS; pinned Node setup, syntax check and adversarial read-only tests completed.
- Job `133350345738` (`event-admission`): SKIPPED on PR event, as expected for the issue-comment-only admission path.
- PR #112 body records 21/21 adversarial tests. The run's job summary verifies the test step completed successfully; test count is reported in the PR body.
- Pool Contract Validation run [43882090867](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090867): COMPLETED / SUCCESS on the same exact SHA.

## Critical qualification boundary

This controller is NOT the Gemini batch dispatch controller and is NOT the production worker dispatcher. The default branch workflow inventory does not contain `next-event-controller-readonly.yml`; it exists only on PR #112's feature branch at review time. The PR is not merged.

The read-only workflow does not:
- create durable admission or atomic quota reservations;
- acquire a repository-wide lease or monotonic fencing token;
- dispatch child workflows or Gemini agents;
- prove that any of the four Gemini credentials are valid, distinct-account, independently quota-backed or available;
- qualify Supervisor/Worker execution, secret isolation in a live provider call, state persistence or recovery.

The existing legacy `pool-supervisor.yml` / `pool-worker.yml` workflows remain separate. No secret values were read. No Gemini/provider calls, D1 provisioning, deployment, dispatch, merge or paid resource was used.

## Decision

- Read-only event envelope contract: VERIFIED on PR #112 exact head.
- Durable admission / lease / dispatch authority: NOT IMPLEMENTED / NOT VERIFIED by this PR.
- Gemini agents in this pass: NOT RUN.
- Contour A: IN PROGRESS / NOT ACCEPTED.
- Contour B: DEFERRED.

Do not merge this read-only event controller as if it enabled the pool. Next bounded engineering target: review and test the durable one-shot admission + lease/fencing integration against this event identity, keeping provider dispatch disabled until the complete security/governance gate is proven.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
