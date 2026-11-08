# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-08 — issuer/capability contract gap confirmed; no resolver authorized
**Phase:** Contour A — cloud pool launch and authenticated remote web access
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED
**Priority:** Cloud pool and secure browser Experience plane first. Contour B remains deferred.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной` @ `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- This Context Window is on `docs/github-context-window-2026-11-06`; that documentation branch is unmerged and noncanonical. Context Window and checkpoint are synchronized together on the documentation branch; see latest branch HEAD and blob IDs in Git history. The Context Window is the current file on this branch; the branch remains unmerged and noncanonical.
- Proof branch: `proof/cloudflare-workflows-vitest-2026-11-08` — implementation SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e`; latest report-only successor commit `c430fe4beecf93a20052f0c3efedb5f8539e4faa` (previous report commit `1eb3be17d9146d57a4335b511804946e097651ae`).
- Local completed-instance process-recreation report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/1eb3be17d9146d57a4335b511804946e097651ae/docs/reports/2026-11-08-workflow-process-recreation-proof.md.
- Local in-progress Workflow process-recovery report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/c430fe4beecf93a20052f0c3efedb5f8539e4faa/docs/reports/2026-11-08-workflow-inprogress-process-recovery-proof.md.
- Hosted Cloudflare account-level qualification plan (plan only; no provisioning authorization): https://github.com/VlDMlNSh/developer-cloud-pool/blob/67fd2ef1af5fc577c045d4ecce68e9b94959c82e/docs/qualification/CLOUDFLARE-ACCOUNT-LEVEL-QUALIFICATION-PLAN-2026-11-08.md.
- Draft PR #52: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52 — OPEN / DRAFT / UNMERGED; current head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`; base PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`. Original implementation SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e` exact-head CI SUCCESS; report-only commits `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d`, `1eb3be17d9146d57a4335b511804946e097651ae` and `c430fe4beecf93a20052f0c3efedb5f8539e4faa` have exact-head CI SUCCESS (runs `42506472721`, `42506744722` and `42507524428`).
- Latest proof report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/34cdf68d44aac22c10871bf42ddf1cbadf31082e/docs/reports/2026-11-08-workflow-explicit-restart-proof.md.
- Previous duplicate-trigger report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/784a2288fe3c42deb53c6e585c9180264c16b91b/docs/reports/2026-11-08-workflow-duplicate-trigger-proof.md.
- Previous composed retry report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/4eb4aea106787c70039cd7110f1ca7a260628b57/docs/reports/2026-11-08-composed-workflow-d1-retry-proof.md.

## Current Contour A baseline

- README baseline: Supervisor/Worker scaffold / NOT RUN; DSH evaluation NOT RUN; Resource Probe NOT RUN; cloud runtime deployment/profile qualification NOT RUN; general-purpose agent execution/checkpoint-resume not implemented.
- PR #25 Hono console prototype: OPEN / DRAFT / UNMERGED. It remains service-only health + fail-closed protected reads + mutation rejection. No authenticated live console, OAuth/session runtime, deployment or device QA.
- Issue #22 (secure remote web console): OPEN.
- Issue #26 (provider/account-isolated routing and quota ledger): OPEN / DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- PR #51 (indeterminate reconciliation queue): OPEN / DRAFT / UNMERGED; exact-head push CI verified, no production adoption, independent review NOT RUN.
- PR #52 (Workflow/D1 proof): OPEN / DRAFT / UNMERGED; current head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`; reviews 0, review threads 0. Independent security/provenance review NOT RUN. Report-only commits `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d`, `1eb3be17d9146d57a4335b511804946e097651ae` and `c430fe4beecf93a20052f0c3efedb5f8539e4faa` have exact-head CI SUCCESS (runs `42506472721`, `42506744722` and `42507524428`); independent security/provenance review remains NOT RUN.

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
- A separate controlled in-progress process-recovery proof is now VERIFIED locally (details below). The earlier completed-instance experiment remains separate and does not itself prove in-progress recovery. Initial pre-migration request emitted `D1_ERROR: no such table: pool_attempts`; after applying the migration, a distinct attempt succeeded. npm install exited 0 but emitted non-fatal optional-package TAR_ENTRY_ERROR warnings. This diagnostic is preserved in the report.
- Exact-head GitHub Actions run `42505474727`, job `128807039896`, Jarvis Web Prototype Validation: COMPLETED / SUCCESS on exact SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e`. Every job step completed successfully, including Workflow/D1 local proof.
- Report-only process-proof commit `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d`: exact-head run `42506472721`, job `128810086646`, COMPLETED / SUCCESS.
- Independent-repeat report commit `1eb3be17d9146d57a4335b511804946e097651ae`: exact-head run `42506744722`, job `128810903390`, COMPLETED / SUCCESS; all steps passed, including Workflow/D1 local proof.
- Completed-instance local process recreation has been repeated independently using a second isolated persistence directory and a different Attempt ID/generation. Both repetitions preserve the completed Workflow identity and D1 receipt across two OS processes.
- Evidence remains synthetic local Miniflare. In-progress recovery is VERIFIED only for the tested persisted `step.sleep()` scenario across abrupt local process termination. No real Cloudflare account D1/Workflow semantics, regional failover, distributed concurrency stress, production retention, arbitrary external side-effect idempotency or authority bridge has been proven.
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

## In-progress Workflow process-recovery proof — 2026-11-08

- Report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/c430fe4beecf93a20052f0c3efedb5f8539e4faa/docs/reports/2026-11-08-workflow-inprogress-process-recovery-proof.md.
- Temporary proof-only input added a 60-second named `step.sleep()` before the D1 receipt step; it was reverted after the test. No runtime source change is part of report commit `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.
- Attempt `attempt-inprogress-recovery2`, generation 42, was `claimed` with zero receipt rows after approximately 35 seconds inside the sleep. The first Wrangler/Workerd process set was terminated abruptly with SIGKILL.
- A distinct Wrangler/Workerd process started against the exact same local persistence directory. Wrangler's local Workflow CLI showed the same instance still `Running`, with the original sleep step and original start timestamp (58 seconds elapsed), rather than a new sleep from the second process start.
- The Workflow completed at the original 60-second end time. Final D1 readback: Attempt `completed`, generation 42, `invocation_count=1`, `receipt_count=1`, unchanged receipt JSON. This verifies local resumption for the tested persisted-sleep scenario only.
- Exact-head GitHub Actions run `42507524428`, job `128813275338`: COMPLETED / SUCCESS on exact SHA `c430fe4beecf93a20052f0c3efedb5f8539e4faa`; every step passed, including Cloudflare Workflow and D1 local proof.
- The preliminary 25-second trial was excluded because it completed before termination; only the 60-second controlled trial is counted.

## Issuer/capability contract source review — 2026-11-08

- Report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/COMMIT/docs/reports/2026-11-08-issuer-capability-contract-source-review.md (commit ref will be synchronized in the following checkpoint commit).
- Reviewed immutable Cloud Pool default SHA `864213e2ff5b4fa956ba405dea8137a44d812f49`, PR #51 head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`, MediaHub snapshot `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- MH-12 defines bounded capability semantics; Compute Wire Protocol v1 defines signed envelopes, authority epoch, admission, lease/fencing, idempotency and revocation conceptually. Issue #301 remains OPEN; Wave 205 explicitly identifies issuer/capability authority as P0 and says governance must settle issuer/key semantics.
- PR #51 migration 0005 is a pending-only durable reconciliation record. It contains no verified issuer/principal/capability, signed grant, policy version, authority epoch, revocation reference or evidence-verification result. It cannot authorize resolver/retry/terminalization.
- MediaHub AuthorizationContext allow-list seam has no evidenced authenticated FileTaskIngress source edge. Separate node-specific HMAC command signer is not proven to be the general Cloud Pool capability contract.
- Mature components evaluated as candidates: Cedar for policy evaluation; libmacaroons for attenuable capability tokens; LiteLLM remains only a provider gateway candidate. None installed/adopted; neither Cedar nor Macaroons resolves governance/issuer/key lifecycle.
- Decision: NO resolver, retry, lease release, terminalization or provider dispatch until governance-owned contract resolves issuer trust, principal binding, exact grant scope, expiry/replay, revocation, attenuation, epochs/fencing, evidence/audit, authority separation and fail-closed outages.
- PR #51 exact-head CI run `42495716401` SUCCESS; PR remains OPEN/DRAFT/UNMERGED; zero reviews; independent review NOT RUN. No secrets, dispatch, remote Cloudflare, provider calls, deployment or merge.

## PR #51 bounded reconciliation-queue review — 2026-11-08

- Report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/7cec4821f0710cf7dac823fe5948b4d613042564/docs/reports/2026-11-08-pr51-reconciliation-queue-bounded-review.md
- Immutable target: PR #51 head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- Reviewed complete 4-file diff and migrations 0001–0005, D1 Vitest migration loader, adapter, tests and workflow.
- No blocking defect found in inspected scope. Migration 0005 creates a pending-only reconciliation row only for running→indeterminate, guarded by current task pointer, matching lease generation and expiry validation in migration 0004. It preserves lease context and does not authorize retry, lease clearing, terminalization or dispatch.
- Exact-head run `42495716401`, job `128777501915`: SUCCESS on exact SHA. `npm ci`, syntax check and 35/35 Workers-runtime D1 tests passed. Lockfile artifact ID `13623665401`, SHA-256 `8380de93ae870e28f35abf7df7c94cd9c734da565761a977f251d8d2a60768f7`.
- PR #51 remains OPEN / DRAFT / UNMERGED. No independent review submissions/comments. This bounded assistant inspection is NOT an independent review and is not production approval.
- No remote D1, deployment, provider/model, secrets, dispatch or production integration.

## Hosted Cloudflare account-level qualification plan — 2026-11-08

- Plan: https://github.com/VlDMlNSh/developer-cloud-pool/blob/67fd2ef1af5fc577c045d4ecce68e9b94959c82e/docs/qualification/CLOUDFLARE-ACCOUNT-LEVEL-QUALIFICATION-PLAN-2026-11-08.md.
- Plan commit `67fd2ef1af5fc577c045d4ecce68e9b94959c82e`; file blob `ae9d7de65e82f438a6b000b34237aaa149f64159`.
- Reuses the existing Workers/Workflows/D1 implementation and official Workers Vitest/Miniflare harness; no second runtime, custom queue or custom database is proposed.
- Defines Q0 read-only inventory, governance and account-plan preconditions, disposable-resource topology, hosted D1 invariants, Workflow retry/duplicate/sleep tests, bounded concurrency, recovery/retention observations, security/data hygiene, teardown and evidence requirements.
- Documents current Cloudflare Free limits from official docs: Workflows 100,000 executions/day, 100 concurrent running instances, 100,000 queued instances, 3-day completed-state retention, 1 MiB event payload, 100 MB state per instance and 10 ms CPU per step; D1 Free 10 databases/account, 500 MB/database, 5 GB account storage, 7-day Time Travel and 50 read subrequests per invocation. Recheck plan and actual remaining quota at Q0.
- No Cloudflare account API operation, resource creation, deployment, remote D1 migration, secret access, provider call or paid action was performed in this pass. Plan is NOT AUTHORIZED FOR PROVISIONING / NOT EXECUTED.
- Exact-head CI for the plan commit was not observed in the Actions run inventory; mark CI NOT VERIFIED rather than infer success. This docs branch remains unmerged and noncanonical.

## Remaining limitations and blockers

- In-progress Workflow recovery after abrupt process termination is VERIFIED locally for one persisted-sleep scenario; completed-instance local process-recreation persistence is VERIFIED in two independent repetitions. Hosted Cloudflare account D1/Workflow semantics, regional failover, distributed concurrency stress, production Workflow retention, arbitrary external side-effect idempotency and authority bridge remain NOT VERIFIED.
- PR #25 remains OPEN / DRAFT / UNMERGED; authenticated OAuth/session runtime, Workers Free eligibility, deployment and browser/device QA remain NOT IMPLEMENTED / NOT VERIFIED / NOT RUN.
- PR #51 remains OPEN / DRAFT / UNMERGED; reconciliation queue is not production-qualified.
- PR #52 remains OPEN / DRAFT / UNMERGED; no independent review.
- Issue #22 remains OPEN; Issue #26 remains DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- Gemini controller is missing from known refs; dispatch NOT RUN. Current dispatch variables NOT VERIFIED.
- Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED.

## Next bounded actions

1. Obtain the governance-owned issuer/capability contract decision for the Cloud Pool ↔ MediaHub compute boundary. Do not design or implement resolver, retry, lease release or terminalization before the ten unresolved contract topics in the latest report are settled.
2. Keep PR #51 and PR #52 OPEN / DRAFT / UNMERGED; independent review remains NOT RUN.
3. Hosted Cloudflare Q0 remains blocked until governance and account-scope gates are available. No provisioning, remote D1, secret access or deployment.

## Canonical source links

- Repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool Supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Governance issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
