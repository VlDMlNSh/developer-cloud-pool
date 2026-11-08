# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-08 — local two-process Workflow/D1 persistence proof; exact-head CI for report commit NOT VERIFIED
**Phase:** Contour A — cloud pool launch and authenticated remote web access
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED
**Priority:** Cloud pool and secure browser Experience plane first. Contour B remains deferred.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной` @ `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- This Context Window is on `docs/github-context-window-2026-11-06`; that documentation branch is unmerged and noncanonical.
- Proof branch: `proof/cloudflare-workflows-vitest-2026-11-08` — implementation SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e`; report-only successor commit `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d`.
- New local process-recreation report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/4db46c78e57c4af1b995b1cebeb6c12203e6ab3d/docs/reports/2026-11-08-workflow-process-recreation-proof.md.
- Draft PR #52: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52 — OPEN / DRAFT / UNMERGED; base PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`.
- Latest proof report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/34cdf68d44aac22c10871bf42ddf1cbadf31082e/docs/reports/2026-11-08-workflow-explicit-restart-proof.md.
- Previous duplicate-trigger report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/784a2288fe3c42deb53c6e585c9180264c16b91b/docs/reports/2026-11-08-workflow-duplicate-trigger-proof.md.
- Previous composed retry report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/4eb4aea106787c70039cd7110f1ca7a260628b57/docs/reports/2026-11-08-composed-workflow-d1-retry-proof.md.

## Current Contour A baseline

- README baseline: Supervisor/Worker scaffold / NOT RUN; DSH evaluation NOT RUN; Resource Probe NOT RUN; cloud runtime deployment/profile qualification NOT RUN; general-purpose agent execution/checkpoint-resume not implemented.
- PR #25 Hono console prototype: OPEN / DRAFT / UNMERGED. It remains service-only health + fail-closed protected reads + mutation rejection. No authenticated live console, OAuth/session runtime, deployment or device QA.
- Issue #22 (secure remote web console): OPEN.
- Issue #26 (provider/account-isolated routing and quota ledger): OPEN / DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- PR #51 (indeterminate reconciliation queue): OPEN / DRAFT / UNMERGED; exact-head push CI verified, no production adoption, independent review NOT RUN.
- PR #52 (Workflow/D1 proof): OPEN / DRAFT / UNMERGED; reviews 0, review threads 0. Independent security/provenance review NOT RUN. Report-only successor commit `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d` has no associated PR-triggered CI run returned by the commit-runs query; report-commit CI NOT VERIFIED.

## Governance, dispatch and agent controller

- Issue #1 remains OPEN.
- Ruleset 26550182 is ACTIVE on `refs/heads/Основной`; pull requests are required, but required approving reviews = 0, CODEOWNERS review = false, extra approval for unattributed changes = false. Thread resolution is required; bypass actors are empty. This does NOT enforce independent review.
- Issue #1 records `POOL_DISPATCH_ENABLED=false` as verified on 2026-11-04. Current values of `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` have NOT been re-read; treat current state as NOT VERIFIED and keep dispatch fail-closed. No secret or variable values were accessed.
- The approved `.github/workflows/gemini-batch-dispatch-controller.yml` was NOT FOUND in the workflow directory on either default branch `Основной` or PR #25 base branch `feat/jarvis-hono-web-prototype-2026-11-06`. Gemini dispatch is NOT RUN; do not bypass or recreate the controller as a shortcut.
- Voktors-Mini.Dlink was used only for local proof tests and Git push; this does not qualify it as a pool worker or as the approved SentinelX host for Claude Code.
- No DSH, Resource Probe, model/provider calls, dispatch, deployment, remote D1 or paid fallback were used.

## Workflow + D1 proof — 2026-11-08

- Official Workers SDK fixture baseline pinned at `cloudflare/workers-sdk@ab086218678b1bf311b158bcc6cb6b7437a7839`; reused official `@cloudflare/vitest-plugin` / Miniflare harness.
- Local runtime: Node 22.23.3, npm 10.9.9, `@cloudflare/vitest-plugin@1.6.0`, Vitest 4.1.12, Wrangler 4.158.0.
- Exact final proof head: `34cdf68d44aac22c10871bf42ddf1cbadf31082e`.
- Local checks: `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` PASS; `npm run check` PASS; `npm test` 11/11 PASS; `npm run validate:ui` PASS; `npm run test:workflow` 8/8 PASS (4 D1 ledger + 4 Workflow runtime); `git diff --check` PASS.
- Existing composed Workflow test proves a D1 receipt commit followed by a synthetic one-shot post-commit timeout; same step retries, two callback invocations, one durable first-writer receipt.
- Duplicate-trigger proof derives stable local Workflow ID `attempt-<attemptId>-<generation>`. Second create with same ID rejects as `instance.already_exists`; introspection shows one Workflow instance and D1 has one attempt + one receipt.
- New explicit restart test calls official `WorkflowInstance.restart()` after completion. Workflow reruns from the beginning; local D1 retains exactly one unchanged receipt, Attempt remains completed, callback count becomes two and output remains the original receipt.
- Cloudflare documents that explicit Workflow restart cancels in-progress steps, erases intermediate Workflow state and treats the instance as a first run. This is NOT a Worker-process crash/restart. The official Vitest test APIs provide Workflow introspection/modifiers but no documented worker-process restart control.
- Local explicit-restart test emits Workerd `outputGateBroken` cancellation diagnostics (`User called restart`); the test passes and all D1/output assertions pass.
- New bounded process-recreation proof (report-only; implementation remains at `34cdf68d44aac22c10871bf42ddf1cbadf31082e`): ran the existing Worker under Wrangler `4.158.0` with `--local --persist-to /tmp/cdp-process-restart-state`; applied the local D1 migration; completed Attempt `attempt-process-restart-2` at generation 32 with one step invocation and one receipt; terminated Wrangler PID 66614; restarted a distinct Wrangler process PID 67553 against the same persistence directory; replayed the same Workflow create and received the expected `instance.already_exists`; queried D1 after restart and confirmed status completed, generation 32, invocation_count 1, receipt_count 1, unchanged receipt JSON. This verifies local persistence of a completed Workflow instance identity and D1 receipt across two OS processes.
- The process was stopped only after Workflow completion. In-progress Workflow resumption after abrupt process termination remains NOT VERIFIED. Initial pre-migration request emitted `D1_ERROR: no such table: pool_attempts`; after applying the migration, a distinct attempt succeeded. npm install exited 0 but emitted non-fatal optional-package TAR_ENTRY_ERROR warnings. This diagnostic is preserved in the report.
- Exact-head GitHub Actions run `42505474727`, job `128807039896`, Jarvis Web Prototype Validation: COMPLETED / SUCCESS on exact SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e`. Every job step completed successfully, including Workflow/D1 local proof.
- Evidence remains synthetic local Miniflare. No real Cloudflare account D1 semantics, worker process crash/restart, regional failover, distributed concurrency stress, production retention, external side-effect idempotency or authority bridge has been proven.
- Deterministic Workflow ID remains proof-only; production design needs bounded ID validation, canonical idempotency-key derivation, payload-conflict handling and D1/Workflow reconciliation.

## PR #51 reconciliation-chain inspection

- PR #51 exact head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; base PR #50 exact head `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #51 migration 0005 adds unique pending reconciliation work on running -> indeterminate, preserving task key, attempt ID, input digest, lease generation, expired lease owner and timestamp.
- Trigger validates that task current attempt and lease generation still match. It does not clear the lease, create a retry or authorize terminalization.
- PR #51 includes exact terminal-finalization replay recognition from PR #50. Exact replay requires matching immutable terminal projection and audit actor/generation; conflicting replay remains denied and no second terminal event is appended.
- Exact-head push CI run `42495716401`, job `128777501915`: COMPLETED / SUCCESS on exact SHA `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`. Steps include install, syntax, Workers-runtime D1 tests and artifact upload.
- CI artifact `d1-ledger-proof-package-lock`, ID `13623665401`, SHA-256 `8380de93ae870e28f35abf7df7c94cd9c734da565761a977f251d8d2a60768f7`, retained through 2026-11-15.
- PR #50 exact-head push CI run `42495440869` completed SUCCESS on `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #51 is a persistence boundary, not an authority resolver. It has no trusted evidence/capability verification and no retry/lease-takeover permission. Reviews/threads are 0/0; independent review NOT RUN. PR remains OPEN / DRAFT / UNMERGED.

## Remaining limitations and blockers

- No in-progress Workflow recovery after abrupt process termination, regional failover, real Cloudflare account D1/Workflow semantics, distributed concurrency stress, production Workflow retention, external side-effect idempotency or authority bridge. Completed-instance local process-recreation persistence is separately VERIFIED.
- PR #25 remains OPEN / DRAFT / UNMERGED; authenticated OAuth/session runtime, Workers Free eligibility, deployment and browser/device QA remain NOT IMPLEMENTED / NOT VERIFIED / NOT RUN.
- PR #51 remains OPEN / DRAFT / UNMERGED; reconciliation queue is not production-qualified.
- PR #52 remains OPEN / DRAFT / UNMERGED; no independent review.
- Issue #22 remains OPEN; Issue #26 remains DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- Gemini controller is missing from known refs; dispatch NOT RUN. Current dispatch variables NOT VERIFIED.
- Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED.

## Next bounded actions

1. Completed-instance local Workflow/D1 persistence across two Wrangler processes is VERIFIED. Next bounded action: run a separate controlled in-progress Workflow fixture, terminate the Wrangler process during a wait, restart against the same isolated persistence directory, and test whether the Workflow resumes exactly once. Do not call this Cloudflare production recovery.
2. If in-progress recovery is unsupported or inconclusive, record the limitation and define a separate Cloudflare account-level qualification test plan without deploying or using secrets.
3. Continue verifying reconciliation queue integration only after PR #51's full migration chain is inspected against the exact base. No authority resolver or retries until issuer/capability contract is approved.
4. Keep PR #52 and PR #51 DRAFT / UNMERGED. No production adoption or Contour A acceptance.

## Canonical source links

- Repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool Supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Governance issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
