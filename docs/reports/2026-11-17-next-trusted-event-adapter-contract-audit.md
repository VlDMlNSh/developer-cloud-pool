# Trusted GitHub Actions event adapter contract audit — 2026-11-17

## Result

A focused audit compared the clean-base read-only Issue #96 event controller candidate (PR #112) with the atomic D1 admission proof (PR #114). The candidates provide complementary pieces, but they are not yet integrated and neither is production-qualified. The safest trusted source for the D1 proof's currently caller-supplied event/controller fields is the GitHub Actions event context on an `issue_comment` workflow that exists on the protected default branch.

## Immutable repository state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- PR #112: OPEN / DRAFT / UNMERGED; head `c9a4c0ab2001f01a09632795283071c521e1c99d`; base is the immutable default HEAD.
- PR #114: OPEN / DRAFT / UNMERGED; head `ab9461eb84b14fe230918391d5212f19ca25592c`; base is the immutable default HEAD.
- No default-branch changes, merges, deployments, provider calls, secret reads, or dispatches were performed.

## Verified GitHub Actions trust contract

GitHub's official event documentation states that for `issue_comment`:
- `GITHUB_SHA` is the last commit on the default branch.
- `GITHUB_REF` is the default branch.
- The workflow is triggered only if its workflow file exists on the default branch.

The official Actions contexts reference defines `github.workflow_sha` / `GITHUB_WORKFLOW_SHA` as the commit SHA for the workflow file.

Sources:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://docs.github.com/en/actions/reference/workflows-and-actions/variables

This provides a documented platform trust boundary when the controller workflow is actually present on the default branch. The adapter should derive, not accept from user input:
- source event JSON from runner-provided `GITHUB_EVENT_PATH`;
- event name, ref, target SHA and run ID from runner-provided environment/context;
- controller workflow source SHA from `GITHUB_WORKFLOW_SHA`;
- checked-out controller implementation revision from the immutable `GITHUB_SHA` used by checkout.

Do not infer that a feature-branch workflow is trusted merely because it passes the same predicate tests.

## PR #112 — read-only event predicate

Files inspected:
- `.github/workflows/next-event-controller-readonly.yml` blob `772a6e78423f60dab862c5e237532a2da8654334`
- `scripts/next-event-controller.mjs` blob `846aa93417248b99653a4b08cae676c4cbc56f06`

Positive controls:
- `issue_comment: created` only;
- exact Issue #96, non-PR issue, open state and repository URL;
- repository numeric ID, owner login and numeric owner ID;
- default branch ref and SHA shape;
- exact comment body `/next`;
- comment author identity and `OWNER` association;
- checkout at `${{ github.sha }}`, pinned action SHAs, `contents: read`, `persist-credentials: false`;
- explicit `READ_ONLY_NO_DISPATCH` and `executionAuthorized: false`.

Exact-head CI:
- Event controller run `43882090833`, head `c9a4c0ab2001f01a09632795283071c521e1c99d`: contract-test job SUCCESS.
- The event-admission job `133350345738` was SKIPPED. Thus no real issue_comment execution or live admission is proven.
- Pool Contract Validation run `43882090867`: SUCCESS.

PR #112 remains a draft candidate and its workflow does not persist an admission receipt, consume approval, create a D1 task/outbox, or dispatch.

## PR #114 — atomic D1 admission proof

Inspected current PR head and source:
- Head: `ab9461eb84b14fe230918391d5212f19ca25592c`.
- Admission module blob: `e37eef052de0a5daff36c0ffbf873a2fd49d942b`.
- SQL migration blob: `20bd330c4c6fe01752e64abb5d3f8b6112e5a66c`.
- Worker entrypoint is a deliberate 404 stub; it is not a deployed admission endpoint.

Exact-head CI:
- D1 run `43935827714`, job `133540023253`: SUCCESS.
- Log confirms Node syntax check PASS and 12/12 Vitest Workers-runtime tests PASS.
- Pool Contract Validation run `43935827741`, job `133540025359`: SUCCESS.
- Artifact `14260129001`, SHA-256 `99ee88f17c8e52d77fa883cb3b89aafd26dc2e29441c44182463480e765b685a`.
- Combined commit status contexts returned empty; workflow run evidence is available, but no branch-protection required-check evidence is inferred from that empty response.

The D1 function correctly requires equality between `targetSha` and `trustedDefaultHeadSha`, but both are supplied in its input object. It also accepts `event`, `controllerRunId` and `controllerCodeSha` as input. This is an intentional pure proof boundary, not a trusted event adapter. The code itself does not authenticate the provenance of those fields.

## Engineering decision

Do not merge PR #112 or #114, and do not enable dispatch. Reuse their bounded components only after a clean integration pass.

The next implementation should be a no-secret trusted event adapter on a new clean-base branch (or a controlled dependent branch) that:
1. runs only from a workflow file present on `Основной` for `issue_comment: created`;
2. checks out exactly `GITHUB_SHA` and pins/records `GITHUB_WORKFLOW_SHA`;
3. derives event payload, repository/ref/SHA/run metadata exclusively from GitHub runner context;
4. rejects unless `GITHUB_SHA`, default ref, workflow ref and expected controller workflow path satisfy the repository contract;
5. passes the derived values to the pure D1 admission function; caller-supplied target/controller metadata is not accepted;
6. remains read-only/no-secret with `dispatch: false` and `executionAuthorized: false`;
7. uses a fake D1 binding in adversarial tests and does not provision hosted D1 or inspect credentials.

A separate owner approval issuance contract and hosted D1 qualification are still prerequisites before any live admission. A trusted event adapter alone does not authorize child execution.

## Agent and governance gates

- Cloud Pool-native `.github/workflows/gemini-batch-dispatch-controller.yml` was not found on the default branch.
- Four-agent Gemini dispatch: NOT RUN. Candidate PR #107 remains isolated, unmerged and not qualified.
- Issues #94 and #96 remain OPEN.
- PR #112 and #114 remain OPEN/DRAFT/UNMERGED; PR #114 has 0 formal reviews.
- No secret values or secret metadata were inspected.
- No independent security review, hosted D1 persistence, approval issuance, worker identity, outbox delivery, Supervisor integration, model routing/quota qualification, or remote Jarvis UI is established.

## Status

- PR #112 read-only predicate: CI VERIFIED; real event-admission job NOT VERIFIED.
- PR #114 local D1 admission proof: exact-head CI VERIFIED; trusted event provenance NOT VERIFIED.
- Trusted production adapter: PLANNED.
- Gemini dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step

Implement and test the trusted event adapter described above on an immutable clean-base target, with no secrets, no hosted resources, and dispatch permanently disabled.
