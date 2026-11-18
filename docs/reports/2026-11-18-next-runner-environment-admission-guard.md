# /next — GitHub-hosted runner identity guard in D1 admission adapter — 2026-11-18

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #125 base: PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR #125 target before this pass: `2ca95775982c711a289881e94eb664d5fe14ed5a`.
- Final PR #125 head after this pass: `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`.
- Bounded scope: harden the synthetic Actions-context adapter to reject non-GitHub-hosted runners; no live controller or execution path.

## Reconciliation

- PR #125 OPEN / DRAFT / UNMERGED; head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`; base PR #114 `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR #114 OPEN / DRAFT / UNMERGED; head `ab9461eb84b14fe230918391d5212f19ca25592c`; base default SHA.
- Issue #96 OPEN; control issue for owner-only /next admission.
- PR #125 and #114 formal review collections are empty (0 submitted reviews).
- Ruleset #26550182 ACTIVE, default branch only; requires PR and thread resolution but 0 approving reviews and 0 status checks. Governance is insufficient for acceptance.
- PR #125 exact-head check-runs on final SHA: two runs completed SUCCESS (details below).

## Engineering change

The adapter previously checked `GITHUB_ACTIONS=true` and `GITHUB_SERVER_URL=https://github.com` but did not assert the runner class. GitHub documents `RUNNER_ENVIRONMENT` as `github-hosted` or `self-hosted`.

Changes:
- `proofs/d1-admission/src/github-actions-adapter.mjs`: fail closed unless `RUNNER_ENVIRONMENT === "github-hosted"`.
- `proofs/d1-admission/test/github-actions-adapter.test.ts`: valid fixture now declares `RUNNER_ENVIRONMENT=github-hosted`; adversarial matrix rejects `self-hosted`.

Files were re-read from GitHub after writes:
- Adapter blob `89f28778dab1ee10c7e39bebeaaf0a6270b9c750`.
- Test blob `45d8751c597e4ac7eaced57225122311f9b98f4f`.

This only strengthens the pure adapter's input contract. The `environment` argument remains injectable for deterministic tests. Production must source values from the actual runner process and read the event payload from `GITHUB_EVENT_PATH`; this pass does not implement that production wrapper.

## Exact-head verification

- PR proof run [44265881516](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265881516), job [134670152674](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265881516/job/134670152674): COMPLETED / SUCCESS on exact head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`. Job log checkout and `git log -1` both report the exact SHA. `npm ci`, `npm run check`, `npm test` passed. Workers-runtime tests: 22/22 (10 adapter + 12 D1 admission).
- Push validation [44265877332](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265877332), job [134670137185](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265877332/job/134670137185): COMPLETED / SUCCESS on the same exact SHA; syntax and 22/22 tests passed.
- Workflow logs show checkout of exact commit, dependency install, syntax validation and both test files passing.

## Reuse-first assessment

- GitHub Actions runner-provided default variables: **REUSE**; use the documented `RUNNER_ENVIRONMENT` rather than inventing a host identity signal.
- No new external dependency or bespoke host-detection component added.

## Qualification boundary / blockers

- The approved production `.github/workflows/cloud-pool-next-controller.yml` is absent from default branch; the event cannot trigger a production controller until that workflow exists on default branch.
- Current adapter accepts an injected environment object. No production entrypoint reading process environment and `GITHUB_EVENT_PATH` exists in this PR.
- No live event signature/API re-read, hosted D1, approval issuer, Supervisor lease/fencing/recovery, outbox delivery, worker identity, provider routing/quota, real execution or Jarvis UI is qualified.
- CI uses local Workers-runtime D1 emulation, not hosted D1.
- Independent A3 review remains NOT RUN; PR #125/#114 have 0 formal reviews.
- Gemini NOT RUN. No secrets read, provider call, dispatch, deployment, merge or paid resource creation.

## Status

- Runner-class fail-closed predicate: VERIFIED in exact-head CI.
- Local D1 + Actions-context composition: VERIFIED as a synthetic test only.
- Production owner-event controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Implement a production controller entrypoint only after an independent A3 review and governance gate are established. It must source event payload from the runner's `GITHUB_EVENT_PATH`, runner metadata from process environment, re-read the default branch head via the GitHub API with narrowly scoped read permission, and remain fail-closed with dispatch disabled. Then qualify hosted D1 and approval/lease/outbox lifecycle separately.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
