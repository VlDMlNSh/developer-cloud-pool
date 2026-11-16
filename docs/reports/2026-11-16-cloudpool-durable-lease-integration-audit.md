# Cloud Pool /next durable-lease integration audit — 2026-11-16

## Decision

Do not implement a second lease engine and do not enable dispatch. Reuse the existing isolated D1 attempt/lease proof as the candidate persistence primitive, but first port a narrowly scoped repository-wide claim/lease boundary onto the current default branch and connect it to the trusted Issue #96 controller. The present admission ledger branch is not a safe integration base.

## Immutable source state

- Repository default branch: `Основной`.
- Default HEAD observed in this pass: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #110 remains OPEN/DRAFT/UNMERGED; documentation branch only.
- Issue #94 defines the four-child Cloud Pool qualification wave; Issue #96 is the sole Cloud Pool /next control issue. Both require fail-closed dispatch until the listed qualification gates pass.

## Findings

1. **Admission proof is stale relative to current default.** PR #98 head `f23cdb5484d5923e02242b3ea142397f9e1f0270` compares as 9 commits ahead and 13 behind current default `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. It must not be merged or treated as current integration code without a clean-base port and fresh validation.
2. **Owner-authenticated ledger PR is still deliberately fail-closed.** PR #100 head `cb952a915093a4aaafb8f878954503d2460c4008` is 25 commits ahead of its PR #98 base and 0 behind that base, but it inherits the stale base. Its code removes caller-controlled `lockHeld` authority and makes runtime planning/reconciliation return `DURABLE_LOCK_NOT_IMPLEMENTED` before GitHub API access. This is the correct security posture, not a usable dispatcher.
3. **Existing D1 attempt lease is useful but isolated.** PR #56 head `0769b6b5d5eda9c7821804b93db21ded6e0985ef` is 4 commits ahead / 0 behind its own base `32c88e50e173e6b19bc6c61723ab6474a3c08145`. Exact-head run `42825872826`, job `129862892371`, completed SUCCESS. Its change removes caller-controlled `resumable` and denies expired-running takeover absent trusted reconciliation. This is local Workers-runtime D1 proof only; it is not a deployed or production-connected Issue #96 lease.
4. **Four-agent candidate contract suite is green but not qualified.** PR #107 head `027492668e7721a5371b38997bc76a6cd6a50cd4`; exact-head run `43868830501`, job `133304274884`, SUCCESS. The eight tests use injected fake clients; no Gemini API request or live child dispatch occurred. SDK runtime, production caller, four account identities/quota ownership and independent review remain NOT VERIFIED.
5. **Owner ledger contract tests pass but do not create a lock.** PR #100 exact-head run `43826793313`, job `133162447332`, SUCCESS. This confirms the current fail-closed implementation and its tests, not dispatch readiness. Formal reviews on PRs #56, #98, #100 and #107: none observed.
6. **No qualified Cloud Pool production controller was found.** The admission and client candidates are separate. GitHub issue comments are not an atomic compare-and-swap store; a caller-supplied Boolean or Actions concurrency group is not a durable monotonic fencing token. The existing D1 package is an isolated proof and no hosted D1 binding/deployment or production Supervisor integration was verified.

## Reuse and architecture choice

- Reuse the repository's existing D1 single-use ledger / immutable-attempt model and its fail-closed expired-attempt handling; do not create a parallel lease protocol.
- Treat D1 as a candidate only after verifying current default-branch dependencies, free-tier/no-paid-fallback constraints, hosted binding availability and migration ownership. No Cloudflare account, database, billing or deployment action was taken.
- Port the smallest lease adapter to a clean branch based on the current default SHA. Required persisted identity: repository, Issue #96, owner actor identity, source comment ID, immutable target SHA, wave ID and four task IDs. Required lease state: owner, monotonic generation, expiry, claim state and append-only audit events.
- The same durable store must atomically claim the source event and advance the fencing generation. Every state mutation must compare task/wave identity, lease owner and generation. Expired running attempts remain indeterminate until trusted reconciliation; expiry alone must never authorize duplicate execution.
- Separate claim from external dispatch. Persist a one-shot dispatch intent before any external request; if the response is ambiguous, reconcile by exact workflow identity and immutable SHA. If uniqueness cannot be established, transition to `NEEDS_REVIEW`; never re-release the same approval.
- Only after this proof is integrated into the trusted default-branch Issue #96 caller should PR #107's four isolated task envelopes be connected.

## Evidence and limitations

- PR #98 exact-head checks: runs `43758657648` and `43758657644`, both COMPLETED/SUCCESS on the PR #98 head, but the branch is now 13 commits behind current default.
- PR #100 exact-head run `43826793313`, job `133162447332`: COMPLETED/SUCCESS.
- PR #107 exact-head run `43868830501`, job `133304274884`: COMPLETED/SUCCESS.
- PR #56 exact-head run `42825872826`, job `129862892371`: COMPLETED/SUCCESS.
- Exact-head CI for PR #110 head `119f201ce2d3861667e025e28ab05a8db23e1c12`: no PR-triggered workflow runs returned; CI NOT VERIFIED.
- No test was executed locally in this pass. No secrets were read, no provider/model calls, dispatches, deployments, merges or paid resources were used.

## Next bounded implementation

Create a clean-base, isolated D1 lease integration proof against `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`: first map the current Supervisor/Worker call boundary and governance, then port only the atomic claim/lease/fencing state machine with adversarial tests. Do not wire external dispatch in that PR. Require exact-head CI and independent security review before proceeding to the production caller.

## Status

- Admission predicate/probe: PARTIAL.
- Durable D1 lease proof: VERIFIED as isolated local-runtime proof only; production integration NOT VERIFIED.
- Owner-authenticated Issue #96 runtime ledger: deliberately BLOCKED / fail-closed pending durable lock.
- Four Gemini client contract tests: VERIFIED; live four-agent qualification NOT RUN.
- Cloud Pool production controller: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Clean-base implementation pass — 2026-11-16

A new clean-base proof was created as PR #111 from default HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. It ports the isolated D1 ledger package from PR #56 exact head `0769b6b5d5eda9c7821804b93db21ded6e0985ef` without importing the stale admission branch or enabling any dispatch path.

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/111
- Head: `62e203e0c35eed1e71ab25f67ae45c3d33d7578c`; compare: 1 ahead / 0 behind.
- Exact-head D1 CI: run `43880577392`, job `133345051895`, SUCCESS; syntax checks passed; 36/36 tests passed (13 + 23).
- Exact-head Pool Contract Validation: run `43880577430`, SUCCESS.
- Artifact `14232860410`; SHA-256 `81925793bc92b1f214666a61b2817eb327127bfba92168358cc32b85b2c0bd4f`.
- No secrets, provider calls, dispatch, hosted D1, merge, deployment or paid resources.
- PR remains Draft. The proof is local Workers-runtime D1 only; production Supervisor integration, hosted persistence, independent security review and live four-agent execution remain NOT VERIFIED / NOT RUN.

Next bounded step: inspect the SQL transaction/trigger invariants and adapt the atomic claim to bind Issue #96 source event + owner + immutable target SHA + four-task wave. Dispatch must remain disabled; ambiguous results must become NEEDS_REVIEW.


## SQL attempt-state integrity pass — 2026-11-16

A direct SQL status update could otherwise move a prepared attempt to `running` without passing through the lease-acquisition projection. Added migration 0006 to make this transition conditional on a matching current attempt, matching lease attempt, non-empty lease owner, positive fencing generation, and unexpired lease.

An adversarial test now proves the direct transition is rejected without mutating the attempt, while the supported `acquireAttemptLease` path succeeds and projects generation 1.

- PR #111 latest head: `687196738782432797bf394f1342cb9df19f478f`; clean-base compare: 4 ahead / 0 behind.
- D1 exact-head run [43881396386](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396386): SUCCESS; syntax passed; 37/37 tests passed.
- Pool Contract Validation [43881396272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396272): SUCCESS.
- Artifact `14232471651`; SHA-256 `08329cbcb0bb479760af4a9dbb7682472180e4bd4431ca2ffaa0cc18612c99d3`.
- PR remains OPEN / DRAFT / UNMERGED. Default branch unchanged.
- No secrets, provider calls, dispatch, hosted D1, merge or deployment.
- This does not authenticate a worker or qualify a hosted lock; production Issue #96 integration and independent security review remain open.


## Read-only Issue #96 event controller — clean-base verification — 2026-11-16

Ported the existing read-only event controller candidate from PR #102 to a clean branch based on current default. Strengthened event identity checks with repository numeric ID, owner numeric ID, exact Issue #96 repository API URL, exact source comment ID, owner login and OWNER association. The controller produces a deterministic SHA-256 event identity but explicitly returns executionAuthorized=false.

- PR #112: https://github.com/VlDMlNSh/developer-cloud-pool/pull/112 — OPEN / DRAFT / UNMERGED.
- Base: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845; head: c9a4c0ab2001f01a09632795283071c521e1c99d.
- Read-only controller CI [43882090833](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090833): SUCCESS; job 133350342861; 21/21 tests passed.
- Pool Contract Validation [43882090867](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090867): SUCCESS.
- No API writes, secrets, provider calls, D1, or dispatch. Event admission job was skipped on PR/push CI; live issue_comment behavior NOT VERIFIED.
- Audit finding: legacy pool-supervisor.yml triggers on schedule/workflow_dispatch/issues/workflow_run and dispatches by pool:ready label if the gate is true. It does not implement exact Issue #96 owner-comment admission. Runtime variable value not inspected. Keep dispatch disabled and do not treat this workflow as qualified owner /next control.
- Four-child amendment in Issue #96 is recorded; no child dispatch was performed.
- Remaining: durable single-use D1 binding to owner/repository/source-comment/target-SHA/wave/four task IDs, controller fencing, ambiguous recovery, live event test, independent review and governance.
