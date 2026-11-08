# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-08 — deterministic Workflow instance identity and duplicate-trigger suppression proof; exact-head CI success
**Phase:** Contour A — cloud pool launch and authenticated remote web access
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED
**Priority:** Cloud pool and secure browser Experience plane first. Contour B remains deferred.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной` @ `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- This Context Window is on `docs/github-context-window-2026-11-06`; that documentation branch is unmerged and noncanonical.
- Proof branch: `proof/cloudflare-workflows-vitest-2026-11-08` @ `784a2288fe3c42deb53c6e585c9180264c16b91b`.
- Draft PR #52: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52 — OPEN / DRAFT / UNMERGED; base PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`.
- Latest proof report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/784a2288fe3c42deb53c6e585c9180264c16b91b/docs/reports/2026-11-08-workflow-duplicate-trigger-proof.md.
- Previous composed retry report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/4eb4aea106787c70039cd7110f1ca7a260628b57/docs/reports/2026-11-08-composed-workflow-d1-retry-proof.md.

## Current Contour A baseline

- README baseline: Supervisor/Worker scaffold / NOT RUN; DSH evaluation NOT RUN; Resource Probe NOT RUN; cloud runtime deployment/profile qualification NOT RUN; general-purpose agent execution/checkpoint-resume not implemented.
- PR #25 Hono console prototype: OPEN / DRAFT / UNMERGED. It remains service-only health + fail-closed protected reads + mutation rejection. No authenticated live console, OAuth/session runtime, deployment or device QA.
- Issue #22 (secure remote web console): OPEN.
- Issue #26 (provider/account-isolated routing and quota ledger): OPEN / DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- PR #51 (indeterminate reconciliation queue): OPEN / DRAFT / UNMERGED; no production adoption.
- PR #52 (Workflow/D1 proof): OPEN / DRAFT / UNMERGED; reviews 0, review threads 0. Independent security/provenance review NOT RUN.

## Governance, dispatch and agent controller

- Issue #1 remains OPEN.
- Ruleset 26550182 is ACTIVE on `refs/heads/Основной`; pull requests are required, but required approving reviews = 0, CODEOWNERS review = false, extra approval for unattributed changes = false. Thread resolution is required; bypass actors are empty. This does NOT enforce independent review.
- Issue #1 records `POOL_DISPATCH_ENABLED=false` as verified on 2026-11-04. Current values of `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` have NOT been re-read in this pass; treat current state as NOT VERIFIED and keep dispatch fail-closed. No secret or variable values were accessed.
- The approved `.github/workflows/gemini-batch-dispatch-controller.yml` was NOT FOUND in the workflow directory on either default branch `Основной` or PR #25 base branch `feat/jarvis-hono-web-prototype-2026-11-06`. Gemini dispatch is NOT RUN; do not bypass or recreate the controller as a shortcut.
- Current Desktop Commander device Voktors-Mini.Dlink is online. It was used only for local proof tests and Git push; this does not qualify it as a pool worker or as the approved SentinelX host for Claude Code.
- No DSH, Resource Probe, model/provider calls, dispatch, deployment, remote D1 or paid fallback were used.

## Workflow + D1 proof — 2026-11-08

- Official Workers SDK fixture baseline pinned at `cloudflare/workers-sdk@ab086218678b1bf311b158bcc6cb6b7437a7839`; reused official `@cloudflare/vitest-plugin` / Miniflare harness.
- Local runtime: Node 22.23.3, npm 10.9.9, `@cloudflare/vitest-plugin@1.6.0`, Vitest 4.1.12, Wrangler 4.158.0.
- Exact final proof head: `784a2288fe3c42deb53c6e585c9180264c16b91b`.
- Implementation commit for deterministic instance identity and duplicate-trigger test: `1b4643fabd59ba68e88110dba8b98b22f9529b83`.
- Local checks: `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` PASS; `npm run check` PASS; `npm test` 11/11 PASS; `npm run validate:ui` PASS; `npm run test:workflow` 7/7 PASS (4 D1 ledger + 3 Workflow runtime); `git diff --check` PASS.
- Existing composed Workflow test proves a D1 receipt commit followed by a synthetic one-shot post-commit timeout; same step retries, two callback invocations, one durable first-writer receipt.
- New duplicate-trigger proof derives stable local Workflow ID `attempt-<attemptId>-<generation>`. Second create with the same ID rejects as `instance.already_exists`; introspection shows one Workflow instance and D1 has one attempt + one receipt.
- Exact-head GitHub Actions run `42505104946`, job `128805935587`, Jarvis Web Prototype Validation: COMPLETED / SUCCESS on exact SHA `784a2288fe3c42deb53c6e585c9180264c16b91b`. Read-back confirms all steps completed successfully, including Cloudflare Workflow and D1 local proof.
- Evidence is local synthetic Miniflare only. No Cloudflare account behavior, worker process crash/restart, regional failover, distributed stress, production retention, external side-effect idempotency or authority bridge has been proven.
- Deterministic ID format remains proof-only; production design still needs bounded ID validation, canonical idempotency-key derivation, payload-conflict handling and D1/Workflow reconciliation.

## Next bounded actions

1. Inspect official Cloudflare Workflow Vitest APIs and determine whether they can model replay/recovery after a simulated worker restart; do not label harness replay as a real process restart.
2. Verify the full workflow/attempt/indeterminate reconciliation chain against PR #51 and its base; keep all work synthetic/local.
3. Resolve the missing approved Gemini controller and governance evidence only through authorized repository changes and documented gates; until then Gemini dispatch remains NOT RUN and dispatch stays fail-closed.
4. Continue the authenticated remote web console work only after the runtime/gateway dependencies are understood; do not deploy the current prototype.
5. Keep PR #52 DRAFT / UNMERGED; no production adoption or Contour A acceptance.

## Canonical source links

- Repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool Supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Governance issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
