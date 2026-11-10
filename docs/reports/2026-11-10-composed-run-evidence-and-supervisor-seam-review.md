# 2026-11-10 — composed run-attempt evidence check and Supervisor seam inspection

## Target and final refs

- PR #57: https://github.com/VlDMlNSh/developer-cloud-pool/pull/57
- Final PR head: `7a06a663de5431ebb79dc2e1297d66491c9d6d0f`
- Base `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- PR #57 OPEN / DRAFT / UNMERGED; formal reviews 0; inline review threads 0.
- Issue #38 remains OPEN.

## Composed adapter → verifier

Added:
- `proofs/github-actions-run-evidence-adapter/src/evidence-check.mjs`
- `proofs/github-actions-run-evidence-adapter/test/evidence-check.test.mjs`

The composition factory pins `owner`, `repo` and `repositoryId` in deployment configuration. Each check accepts only the expected evidence binding; caller-provided repository and clock fields are ignored. It derives run ID and run attempt from that binding and calls the existing Octokit reader, which is fixed to the attempt-specific GET route and has retries disabled.

The clock is injected once at composition time by the trusted host root, not accepted per invocation. The composition layer samples it twice after transport completion and passes those values to the pure verifier. Clock failure, backwards/future samples, stale observations, HTTP errors and transport errors fail closed. The code explicitly documents that this library cannot itself prove the provenance/trustworthiness of the injected clock; that remains a production composition-root qualification gate.

The verifier's terminal outcome remains `TERMINAL_EXECUTOR_ONLY`, `sideEffects=UNKNOWN`, `retryAuthorized=false`, `dispatch=false`. No retry or dispatch capability is created.

Source blobs:
- composition: `f7b04e8dcf966a1cc37be9261fe31158eb9a3281`
- composition tests: `52227c2bdede82c54a6bd70d77d27fd11c7ea444`

## Exact-head CI

Final exact-head fixture run `42837090182`, job `129902075346`, head `7a06a663de5431ebb79dc2e1297d66491c9d6d0f`: COMPLETED / SUCCESS; 23 tests passed, 0 failed. This includes 7 new composition tests plus prior transport and pure-verifier tests.

Exact-head Pool Contract Validation run `42837090501`: COMPLETED / SUCCESS.

Artifact `13773817882`, 2,701 bytes, digest `sha256:cef61a9a5d346913c94e6e36e6f8e03f9b233f8d259f2c8459c19e3273d7bb3d`.

No live API request or credential was used. The synthetic fetch was local to the test process; no egress was used by the adapter tests.

## Supervisor / Worker integration seam inspection

Read exact default-branch blobs:
- `.github/workflows/pool-supervisor.yml`: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`
- `.github/workflows/pool-worker.yml`: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
- `scripts/pool-supervisor.mjs`: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`
- `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md`: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`

Confirmed integration blockers:
1. The current supervisor receives `POOL_RUN_ID`, `POOL_RUN_SHA`, title and conclusion from `workflow_run`, but does not pass an exact `run_attempt` or immutable repository/workflow identity into a reconciliation boundary.
2. Stale recovery lists workflow runs and matches heuristically by display title and `created_at >= issue.updated_at - 120s`; it does not bind the attempt-specific endpoint, repository ID, workflow ID/path/ref, event, head SHA or referenced workflow set.
3. If no matching run appears after 15 minutes, it changes `pool:claimed` back to `pool:ready` based on absence from the list response. Absence from that list is not authoritative evidence that an executor did not start or cannot still produce side effects.
4. It uses ambient `Date.now()` in stale-claim recovery. This is not yet a qualified trusted-clock provider.
5. Supervisor workflow grants `actions:write` and `issues:write`; it can dispatch workers when the repository variable is literally true. The current adapter must not be wired to dispatch/retry until capability/issuer, trusted clock, exact run identity and side-effect reconciliation are qualified.
6. Worker reporting mutates Issue labels/comments in a separate job. This is not a transactional State Authority and does not establish single-use resolution receipts.

No supervisor or worker production file was modified. Dispatch was not enabled or invoked. No issue task was dispatched. The composition adapter remains an isolated read-only proof package in PR #57.

## Governance and scope

- Active ruleset `26550182` on `refs/heads/Основной`; required approvals=0, CODEOWNERS review=false, no bypass actors.
- PR #57 formal reviews=0, inline threads=0. Independent review NOT RUN.
- No secrets or token values read; no live API credential, Gemini dispatch, provider/model call, DSH, Resource Probe, remote D1/Worker provisioning, deployment, merge or paid resource used.

## Status

- Octokit lockfile and exact dependency installation: VERIFIED.
- Attempt-specific Octokit transport with synthetic fetch: VERIFIED.
- Transport → composition → pure verifier with injected host clock: VERIFIED on synthetic inputs.
- Clock provider provenance / production trusted clock: NOT QUALIFIED.
- Supervisor/Worker production integration: NOT IMPLEMENTED.
- Authoritative stale-run reconciliation / side-effect resolution: NOT QUALIFIED.
- Live GitHub API: NOT RUN.
- Resolver / durable single-use resolution receipt: NOT IMPLEMENTED / NOT QUALIFIED.
- PR #57: OPEN / DRAFT / UNMERGED.
- Issue #38: OPEN.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Design a read-only integration contract and tests for Supervisor event binding: derive `run_attempt` from the native `workflow_run` event, bind repository ID + workflow ID/path/ref + event + SHA, and prove that an inconclusive list/API result cannot transition `claimed → ready`. Keep supervisor dispatch disabled. Do not wire resolver or retry authorization into the existing workflow until the issuer/capability and side-effect reconciliation contracts are qualified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
