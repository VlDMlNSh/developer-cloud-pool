# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-06 21:09 Europe/Vilnius  
**Phase:** Contour A — cloud pool launch and authenticated remote web access  
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED  
**Priority:** Cloud pool and its secure browser Experience plane first. Native iOS/local mobile assistant and external servers are later Contour B work.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Latest observed default HEAD: 197ba98d0dc7d8437d759dd25bee8750d02e59ae (compare endpoint, 2026-11-06 pass).
- This context window is maintained on working branch docs/github-context-window-2026-11-06. It is unmerged and is not canonical on the default branch.
- Latest report: [GitHub read adapter audit and path hardening](../reports/2026-11-06-github-read-adapter-audit.md).
- Latest checkpoint: [Cloud Pool next checkpoint](../checkpoints/2026-11-06-cloud-pool-next-checkpoint.md).

## Contour A — cloud execution pool

### Runtime baseline

Default-branch README currently reports:
- Supervisor/Worker: IMPLEMENTED SCAFFOLD / NOT RUN.
- DSH evaluation: NOT RUN.
- Resource Probe: IMPLEMENTED / NOT RUN.
- Cloud runtime deployment/profile qualification: NOT RUN.
- General-purpose agent execution, checkpoint/resume and automatic continuation: NOT IMPLEMENTED.

Do not infer a running pool from workflow definitions, queued runs, static profiles or a successful static contract check. Runtime acceptance requires actual permitted execution evidence and independent review.

### Governance and dispatch

- Governance issue #1: OPEN — https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Issue #1 contains historical 2026-11-04 evidence. Current ruleset and current repository variable POOL_DISPATCH_ENABLED were NOT independently re-read in this pass; treat both as NOT VERIFIED.
- Issue #22 last records active ruleset ID 26550182 with zero required approvals. This is not independent review and is not acceptance.
- Keep dispatch fail-closed. Do not change dispatch variables, dispatch workflows, run DSH/Resource Probe or access provider credentials until current governance and execution authorization are verified.
- No governance, secret, variable or dispatch setting was changed in this pass.

## Phase B — authenticated remote web console

- Controlling issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22 — OPEN.
- Owner priority: secure authenticated browser access from desktop and iPhone first; native iOS assistant second; external servers third.
- V1 must be read-only. No direct browser-to-GitHub privileged API access, no browser-side workflow dispatch, no task mutations.
- Existing graphite dashboard prototype is retained; do not rewrite it.
- Hosting candidate: Cloudflare Workers Static Assets + Hono. GitHub Actions runners are ephemeral; GitHub Pages alone is not the trusted API/control plane.
- Application auth target: server-side GitHub OAuth with single-use state, PKCE S256, immutable numeric owner-ID allowlist and opaque Secure/HttpOnly/host-only __Host-jarvis_session cookie. OAuth/session runtime NOT IMPLEMENTED.
- Workers.dev namespace jarvis-developer-cloud-pool.workers.dev: previously recorded PROVISIONED / VERIFIED.
- Workers Free entitlement: NOT VERIFIED. Worker scripts absent; deployment NOT RUN. Cloudflare Access is not required for this application-level OAuth path.
- Protected API reads remain fail-closed; mutation requests rejected. Never publish an unauthenticated dashboard.

### Web-console PR lineage

Compared against current default HEAD 197ba98d0dc7d8437d759dd25bee8750d02e59ae:
- PR #24 hosting/API docs branch: 59 ahead / 2 behind; DRAFT / UNMERGED / DIVERGED.
- PR #25 Hono prototype branch: 29 ahead / 2 behind; DRAFT / UNMERGED / DIVERGED.
- PR #31 synthetic GitHub adapter branch: 36 ahead / 2 behind; DRAFT / UNMERGED / STACKED on PR #25.
- Do not merge or retarget stacked branches independently. Reconcile the two-commit divergence against current default and rerun exact-head CI after any rebase.

### OAuth compatibility proof — PR #30

- Branch: proof/github-oauth4webapi-compat-2026-11-06.
- Target SHA: ad9f9ac598a2414b5209b6923094b16be64630ae.
- Uses pinned oauth4webapi@3.8.8, synthetic custom-fetch fixtures and fake credentials only.
- Run 42216422883, job 127887461269: COMPLETED / SUCCESS; all steps including protocol test passed on job read-back.
- Reviews/threads: 0/0.
- Proves library API fit against synthetic GitHub OAuth contract only. It does not prove live token-endpoint interoperability or implement callback/session/cookie/CSRF handling. Production OAuth remains NOT IMPLEMENTED.

### GitHub read adapter — PR #31

- Branch head: 5470fccbc4a5fe80a750f402d70d703757fc4c1d.
- Source blob: 97d49834085f9ad4466ffaeae76bb927fe322e3b.
- Test blob: a2ff0a846c62b61e58a9c4b2729434d6af8d6d99.
- Run 42229917555, job 127932882432: COMPLETED / SUCCESS; all nine job steps read back successful.
- Bounded GET-only adapter, fixed API origin, repository allowlist, response-size/timeout/page bounds, ETag/rate-limit handling, explicit response projection, manual redirect rejection and exact GitHub HTTPS-origin validation.
- Adapter is synthetic-only and UNMOUNTED from Hono Worker.
- Reviews/threads: 0/0. No live GitHub API request or deployment.

### Path-normalization correction

- Finding: original repository slug validation allowed . and .. path segments, which can be normalized by the URL parser and escape the intended /repos/{owner}/{repo} path.
- Correction branch: fix/github-read-adapter-path-segments-2026-11-06, based on PR #31 immutable head 5470fccbc4a5fe80a750f402d70d703757fc4c1d.
- Current correction branch head: dee17350864cb49e8c5dd41cf61859d77d3affca.
- Source blob: 9f4f9e5918e1c84fc8ad4b4f1369a92207394c63.
- Test blob: bd8ac8d97cdd673bb170a22d67ce08697cf46789.
- Rejects dot-segment owner/repository values and adds four negative fixtures. Both files were read back.
- Exact-head CI: NOT VERIFIED. Local Node tests: NOT RUN. PR creation did not complete; no PR ref exists. Branch remains unmerged/unreviewed and must not be treated as qualified.

## Provider routing and account isolation

- Issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26 — OPEN / DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- MediaHub registry is a configuration inventory, not proof that credentials exist or routes are usable/free.
- Represent each provider account/credential slot separately. Track quota, cooldown, rate limits and qualification evidence per slot; never merge accounts by provider name.
- Never copy, reveal or transmit secret values. Provider/model calls remain disabled until qualification and authorization gates pass.

## Cross-project boundary

- MediaHub OS is a historical source of requirements/contracts, not permission to expand the cloud-pool scope.
- Contour B, iOS, local inference, media assistant and external server integration remain deferred until Contour A acceptance.
- Preserve historical IDs and authority boundaries. Do not mix Jarvis, ASTRA A0 and MediaHub Product State Authority; do not bypass issuer/capability controls.
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## This pass — 2026-11-06 21:09 Europe/Vilnius

- Re-read shared context window and latest web-console checkpoint; verified current default HEAD by comparing documentation and feature branches.
- Re-read Issues #1, #22 and #26; README on default branch; PR #24/#25/#30/#31 descriptions and current branch comparisons.
- Read PR #30 synthetic OAuth test, workflow and report; fetched run/job 42216422883 / 127887461269 and confirmed success.
- Read PR #31 adapter source, tests and URL-origin hardening report; fetched run/job 42229917555 / 127932882432 and confirmed all steps successful.
- Identified dot-segment path-normalization weakness; created isolated correction branch and updated source/tests. Read-back verified; CI/local tests not run; PR not opened.
- Created dated report and checkpoint on this documentation branch.
- No secrets, provider/model calls, DSH, Resource Probe, dispatch, deployment, browser execution, paid resources or external servers were used.

## Next bounded actions

1. Obtain authorized independent review for PR #25/#30/#31; current review counts are zero.
2. Reconcile stacked PR branches against current default HEAD before merge; exact-head CI must run after rebase.
3. Open a stacked PR for the dot-segment correction and verify exact-head CI plus independent review.
4. Re-read current ruleset and POOL_DISPATCH_ENABLED through an authorized read-only source; keep dispatch disabled.
5. Continue authenticated read-only web console work only while OAuth/session, Workers Free eligibility, independent review and exact-head CI remain explicit gates.

## Canonical source links

- Repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool Supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Live reconciliation — 2026-11-06 22:14 Europe/Vilnius

- Latest dated report: [Live GitHub reconciliation](../reports/2026-11-06-live-reconciliation-2214.md).
- Default HEAD remains observed as `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; default HEAD status and PR-workflow queries returned empty arrays: CI NOT VERIFIED.
- PR #25 current recorded head `d311998640122c4a83e0d1485ae43fb4140bb0fa`: exact-head Pool Contract run `42188040679` / job `127793018101` SUCCESS; Jarvis Web run `42188040627` / job `127792999385` SUCCESS. This corrects the earlier stale "no returned runs" note. PR remains OPEN/DRAFT/UNMERGED; independent reviews/threads 0/0.
- PR #31 head `5470fccbc4a5fe80a750f402d70d703757fc4c1d`: run `42229917555` / job `127932882432` SUCCESS; synthetic adapter remains unmounted; reviews/threads 0/0.
- PR #30 synthetic OAuth proof remains limited to test fixtures; reviews/threads 0/0.
- PR #25 branch is 29 ahead / 2 behind default; PR #31 is 36 ahead / 2 behind. Both DIVERGED and #31 remains stacked on #25.
- Path-segment correction branch head `dee17350864cb49e8c5dd41cf61859d77d3affca`: no workflow run returned; CI NOT VERIFIED; local tests NOT RUN; no PR observed.
- Issue #1 governance and dispatch evidence is stale; current ruleset and `POOL_DISPATCH_ENABLED` NOT VERIFIED. Dispatch remains fail-closed.
- Issue #26 provider/account-slot routing remains DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED.
- No deployment, OAuth/session implementation, runtime execution, DSH, Resource Probe, provider calls, secrets access or paid resources.
- Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Next: reconcile the two-commit divergence and stacked PR dependency without blind retarget/merge; then submit the path-segment fix as a stacked PR, obtain exact-head CI and independent review. Re-read governance before any execution.
