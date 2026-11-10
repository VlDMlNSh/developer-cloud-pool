# 2026-11-10 — GitHub Actions run-attempt evidence adapter proof

## Immutable target

- New draft PR #57: https://github.com/VlDMlNSh/developer-cloud-pool/pull/57
- Branch: `proof/github-actions-run-evidence-adapter-2026-11-10`
- Base default HEAD at branch creation: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Initial PR head: `4576d7dbf686f06894c4c785510634af2934fa84`.
- Follow-up path/ref identity correction head: `4fc22aa212d2b23ef2547db89b6fc00ba3d27b2d`.
- PR #57 remains OPEN/DRAFT/UNMERGED. No review or inline threads recorded at the last read.

## Work completed

Added an isolated proof package:
- `proofs/github-actions-run-evidence-adapter/src/verifier.mjs`
- `proofs/github-actions-run-evidence-adapter/test/verifier.test.mjs`
- `proofs/github-actions-run-evidence-adapter/package.json`
- `.github/workflows/github-actions-run-evidence-fixtures.yml`

The verifier is pure and read-only. It accepts a single attempt-specific workflow-run response and an immutable expected binding. It validates:
- numeric repository ID, run ID and exact run_attempt;
- workflow ID and exact workflow path including its ref suffix;
- event and immutable head SHA;
- allowlisted status/conclusion values;
- trusted observation timestamp and freshness window.

Outcomes:
- active/queued/waiting states -> `STILL_ACTIVE`;
- a completed run with recognized conclusion -> `TERMINAL_EXECUTOR_ONLY`, `sideEffects=UNKNOWN`, `retryAuthorized=false`, `dispatch=false`;
- API errors, rate limits, stale observations, missing fields, mismatches and unknown future enum values -> `UNRESOLVED`, `dispatch=false`.

No transport, HTTP client, token, secret, D1, dispatch, provider/model, deployment or production resolver is implemented. The production transport contract is to use GitHub's attempt-specific REST endpoint at the fixed `api.github.com` origin, with Actions: read only, and inject trusted observation time. Existing mature Octokit candidate is selected in the previous component-selection report; dependency integration is deliberately deferred until a verified npm lockfile and synthetic-fetch transport tests can be generated.

## Exact-head CI evidence

Initial implementation head `4576d7dbf686f06894c4c785510634af2934fa84`:
- Run `42833283887`, workflow **GitHub Actions Run Evidence Fixture Tests**, event pull_request, run_attempt 1, exact head SHA confirmed in the native run payload.
- Job `129888681560`, `node-fixtures`, COMPLETED/SUCCESS; checkout without persisted credentials and synthetic evidence fixture test step both SUCCESS.

After the initial CI run, source and tests were amended to require the API's full ref-qualified `path` value (GitHub response example uses `.github/workflows/build.yml@main`), not merely a workflow filename. New exact head is `4fc22aa212d2b23ef2547db89b6fc00ba3d27b2d`. The synchronize-triggered exact-head run subsequently completed successfully: run `42833466801`, job `129889327476`, event `pull_request`, run_attempt `1`, head SHA `4fc22aa212d2b23ef2547db89b6fc00ba3d27b2d`; the job's checkout and synthetic fixture test steps both COMPLETED/SUCCESS. The final amended head's fixture CI is therefore VERIFIED.

Official endpoint:
- `GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}`
- Fine-grained token permission: Actions repository permission `read`; public resources may be read unauthenticated.
- The documented response contains `id`, `run_attempt`, `workflow_id`, `path`, `event`, `head_sha`, `status`, `conclusion`, `referenced_workflows`, and `repository.id`.
- Status and conclusion are distinct; status values include queued/in_progress/completed/waiting/requested/pending.

Source: https://docs.github.com/en/rest/actions/workflow-runs

## Relationship to existing PR #55 and reuse

PR #55 remains separate: it verifies provenance of the native `issue_comment.created` approval event and re-reads the Issue/comment through an Octokit-shaped read-only interface. Its exact-head runs `42797001864` / job `129764618337` and `42797001989` / job `129764618860` were COMPLETED/SUCCESS. It does not verify Workflow run lifecycle or exact run_attempt. PR #57 adds that separate evidence boundary.

Do not introduce a custom REST transport or retry client. Reuse official Octokit as selected in [the prior component-selection report](2026-11-10-octokit-transport-component-selection.md) after a lockfile can be generated and verified. This PR's pure verifier intentionally has zero runtime dependencies.

## Governance and project state

- Default branch `Основной` remains at `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Ruleset `26550182` remains active for `refs/heads/Основной`, but required approvals = 0 and CODEOWNERS review = false. It does not enforce independent review.
- PR #55, #56, #57 are drafts; no merge attempted.
- Issue #38 remains OPEN. Its requirements still include durable single-use claims, immutable approval/attempt binding, atomicity, recovery, contention and fail-closed dispatch.
- Autonomous-First policy allows bounded internal engineering without external review as a blanket prerequisite; it does not waive security gates or final acceptance.
- No secret values read, no dispatch, no provider/model calls, no DSH, no Resource Probe, no remote D1/Worker provisioning, no deployment, no paid resource.
- Resolver authority remains disabled; dispatch remains fail-closed.

## Status and next step

- Pure verifier and synthetic fixtures: IMPLEMENTED on PR #57.
- Initial exact-head fixture CI: SUCCESS on initial SHA only.
- Final amended SHA exact-head CI: VERIFIED — run `42833466801`, job `129889327476`, COMPLETED/SUCCESS.
- Live GitHub API transport with real Octokit + synthetic fetch: NOT IMPLEMENTED.
- Resolver capability/effect reconciliation/hosted State Authority: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

Next: verify exact-head CI on `4fc22aa212d2b23ef2547db89b6fc00ba3d27b2d`, then review the full PR #57 diff and extend the synthetic adapter to assert attempt-specific URL/method and no network egress using a pinned Octokit dependency only after a verified lockfile is available.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
