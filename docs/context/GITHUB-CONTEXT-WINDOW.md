# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-06 19:58 Europe/Vilnius  
**Phase:** Contour A — cloud pool launch and qualification  
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED  
**Priority:** Prove and qualify the cloud execution pool first; then deliver the authenticated remote web console. Native iOS, local mobile assistant, and external servers remain later phases.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Latest observed default-branch HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae` (2026-11-06 13:43:35Z)
- Repository is public; GitHub App connector has admin/push permissions.
- This context file is being introduced on branch `docs/github-context-window-2026-11-06` from the observed default HEAD. It is not yet merged or canonical on the default branch.
- README blob on default branch: `fea44c2485b604432ab9ee20293c3e1f7ee8bdec`.
- Pool supervisor architecture blob: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`.
- Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Implementation report blob: `7b0ca68c6af169ff00777d05e33a256cbaedd5ee`.

## Phase A — cloud execution pool

### Implemented scaffold (not runtime-qualified)

- GitHub Actions Pool Supervisor: scheduled/event/manual wakeups, serialized reconciliation, issue-backed task intake, immutable target SHA and worker profile allowlist.
- Pool Worker: one profile only, DSH headless package/configuration smoke test.
- Worker separates validation, probe execution and issue-write reporting into distinct jobs with limited permissions.
- Dispatch feature gate: `POOL_DISPATCH_ENABLED`; fail-closed behavior when unset/false.
- Standard GitHub-hosted job ceiling is an account-wide concurrency ceiling, not reserved VMs.
- DSH is developer-preview candidate only. General-purpose agent execution, durable checkpoint/resume, automatic continuation, cross-repository dispatch and provider routing are not qualified.

### Live acceptance state

- Actual supervisor/worker end-to-end execution: NOT VERIFIED from this pass.
- DSH probe: NOT RUN / NOT QUALIFIED.
- Resource probe: NOT VERIFIED from this pass.
- Exact-head Actions checks on default HEAD: NOT VERIFIED from this pass.
- Dispatch must remain disabled. Do not set `POOL_DISPATCH_ENABLED=true`, dispatch workflows, execute model calls, read provider credentials or use paid fallback.
- Architecture acceptance gates include default-branch governance, recognized workflow YAML, idle supervisor run, invalid task rejection, approved task lifecycle, exact SHA checkout, DSH smoke, failure handling, worker-completion wakeup and secret-free evidence.

### Governance

- Owner-controlled governance issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1 (reported OPEN in current web-console issue).
- Active ruleset reported by issue #22: `26550182` / `Основной — verified`; required approval count is zero. This is not independent review and does not satisfy project acceptance.
- Issue #22 explicitly says production dispatch remains BLOCKED and forbids changing the dispatch variable, running DSH/resource probes, accessing provider credentials or paid fallback within its scope.
- No governance or dispatch setting was changed in this pass.

## Phase B — authenticated remote web console

- Controlling issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- User priority recorded there: authenticated remote web access from desktop and iPhone browser first; native iOS assistant second; external servers third.
- Existing static graphite UI: PR #6, OPEN/DRAFT/UNMERGED; fixtures only, no live API/auth.
- Hosting ADR and OpenAPI contract: PR #24, documentation-only, OPEN/DRAFT/UNMERGED.
- Hono prototype: PR #25; fail-closed runtime prototype and committed lockfile exist on its branch. Prior recorded CI success applies only to the exact SHA documented in the checkpoint; latest head must be rechecked independently.
- Proposed runtime: Cloudflare Workers Static Assets + Hono API, retaining existing vanilla graphite UI.
- Proposed auth: server-side GitHub OAuth, exact numeric owner-ID allowlist, opaque `__Host-jarvis_session` cookie. OAuth/session implementation and independent security review are NOT VERIFIED.
- workers.dev namespace `jarvis-developer-cloud-pool.workers.dev`: PROVISIONED / VERIFIED by API write/read-back.
- Workers Free entitlement: NOT VERIFIED; connected Cloudflare OAuth lacks Billing Read.
- Cloudflare Access: disabled / not required for this no-card path.
- Worker scripts: zero; deployment NOT RUN. Never publish an unauthenticated dashboard.
- GitHub Actions runners are ephemeral and are not a persistent web host. GitHub Pages alone is not the trusted API/control plane.

## Cross-project boundary

- MediaHub OS is a source of historical requirements and contracts, not a reason to import additional product scope into the cloud pool.
- Contour B / MediaHub iOS and local media assistant remain blocked until Contour A acceptance.
- Preserve account isolation for provider keys. Never inspect or print secret values. Registration is not proof of key usability.
- Do not mix Jarvis, ASTRA A0 and MediaHub Product State Authority; do not bypass issuer/capability boundaries.

## Issues, PRs and branches

- Pool web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Governance issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Static UI PR #6: https://github.com/VlDMlNSh/developer-cloud-pool/pull/6
- Hosting/API contract PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Hono prototype PR #25: https://github.com/VlDMlNSh/developer-cloud-pool/pull/25
- Working documentation branch for this context file: `docs/github-context-window-2026-11-06`
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## This pass — 2026-11-06

- Verified repository installation, default branch name and recent commit history.
- Read README, pool supervisor architecture, supervisor workflow, worker workflow and 2026-11-04 supervisor implementation report.
- Confirmed the requested context-window path did not exist on the default branch or the existing web-console documentation branch.
- Read web-console issue #22 and its current recorded scope/constraints; inspected the existing web-console continuation checkpoint and OpenAPI contract.
- Created this documentation branch from immutable base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- No workflow was dispatched, no secret was read, no deployment or runtime execution occurred, and no production setting was changed.
- This file is a proposed shared context checkpoint until its PR is independently reviewed and merged.

## Next bounded step

1. Recheck exact current default-branch SHA and latest Actions run/check evidence for Supervisor, Worker and Resource Probe; classify empty/missing evidence as NOT VERIFIED.
2. Independently inspect current ruleset/branch governance and dispatch variable state without changing either.
3. Run no workflow until governance and owner-approved execution gates are proven; then perform the first permitted idle-supervisor validation before any worker dispatch.
4. Continue the secure web console only within issue #22's no-secret, no-deploy, read-only scope while the pool gate remains closed.
5. Re-read this context file after publication, record blob/commit SHA, and keep default-branch canonical status distinct from unmerged working changes.

## Canonical source links

- Pool repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Web-console issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
