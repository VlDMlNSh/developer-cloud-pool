# Developer Cloud Pool — GitHub Context Window

**Updated:** 2026-11-08 — composed Workflow+D1 commit-then-timeout proof and exact-head CI success
**Phase:** Contour A — cloud pool launch and authenticated remote web access
**Disposition:** BLOCKED / NOT QUALIFIED / NOT ACCEPTED
**Priority:** Cloud pool and its secure browser Experience plane first. Native iOS/local mobile assistant and external servers are later Contour B work.

## Canonical repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Latest observed default HEAD: 864213e2ff5b4fa956ba405dea8137a44d812f49 (2026-11-08).
- This context window is maintained on working branch docs/github-context-window-2026-11-06. It is unmerged and is not canonical on the default branch.
- Latest proof branch: proof/cloudflare-workflows-vitest-2026-11-08 @ 4eb4aea106787c70039cd7110f1ca7a260628b57.
- Latest proof PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52 — OPEN / DRAFT / UNMERGED; base PR #25 Hono branch.
- Latest report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/4eb4aea106787c70039cd7110f1ca7a260628b57/docs/reports/2026-11-08-composed-workflow-d1-retry-proof.md.
- Previous checkpoint: docs/checkpoints/2026-11-06-cloud-pool-next-checkpoint.md.

## Contour A — cloud execution pool

### Runtime baseline

Default-branch README still reports:
- Supervisor/Worker: IMPLEMENTED SCAFFOLD / NOT RUN.
- DSH evaluation: NOT RUN.
- Resource Probe: IMPLEMENTED / NOT RUN.
- Cloud runtime deployment/profile qualification: NOT RUN.
- General-purpose agent execution, checkpoint/resume and automatic continuation: NOT IMPLEMENTED.

Do not infer a running pool from workflow definitions, queued runs, static profiles or a successful static contract check. Runtime acceptance requires actual permitted execution evidence and independent review.

### Governance and dispatch

- Governance issue #1: OPEN — https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Latest recorded live Ruleset 26550182: ACTIVE on refs/heads/Основной, PR required, zero required approvals, CODEOWNERS review false, unattributed-change extra approval false. This is not independent review enforcement.
- Current Actions variables endpoint was rejected by the approved read connector; POOL_DISPATCH_ENABLED and POOL_AUTHORIZATION_CONTRACT_ACCEPTED remain NOT VERIFIED.
- Keep dispatch fail-closed. Do not change dispatch variables, dispatch workflows, run DSH/Resource Probe or access provider credentials until current governance and execution authorization are verified.
- No governance, secret, variable or dispatch setting was changed.

## Phase B — authenticated remote web console

- Controlling issue #22: OPEN — https://github.com/VlDMlNSh/developer-cloud-pool/issues/22.
- V1 remains read-only. No direct browser-to-GitHub privileged API access, no browser-side workflow dispatch, no task mutations.
- Existing graphite dashboard prototype retained.
- Hono 4.13.16 prototype on PR #25 remains OPEN / DRAFT / UNMERGED; exact-head CI was previously verified, independent review remains NOT VERIFIED.
- OAuth/session runtime, Workers Free eligibility, deployment and browser/device QA remain NOT IMPLEMENTED / NOT VERIFIED / NOT RUN.
- Protected API reads remain fail-closed; mutation requests rejected. Never publish an unauthenticated dashboard.

## D1 + Workflows composed retry proof — 2026-11-08

- Branch: proof/cloudflare-workflows-vitest-2026-11-08.
- Exact head: 4eb4aea106787c70039cd7110f1ca7a260628b57; parent c108f52957d4ad3964e57e72cda0f5a4fa721721.
- Draft PR #52: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52; base feat/jarvis-hono-web-prototype-2026-11-06 @ 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85.
- Upstream Cloudflare Workers SDK fixture baseline pinned at ab086218678b1bf311b158bcc6cb6b7437a7839.
- Local runtime on Voktors-Mini.Dlink: Node 22.23.3 / npm 10.9.9; @cloudflare/vitest-plugin 1.6.0, Vitest 4.1.12, Wrangler 4.158.0.
- Local checks after fresh npm ci: npm run check PASS; npm test 11/11 PASS; npm run validate:ui PASS; npm run test:workflow 6/6 PASS (4 D1 ledger, 2 composed Workflow); git diff --check PASS.
- D1 adapter exercises insert-if-absent attempt identity, exact task/attempt/generation fencing, durable receipt first-write-wins replay, and needs_review no-retry. Data is synthetic local Miniflare D1 only.
- The composed Workflow step performs a D1 receipt commit, then consumes a persistent local one-shot fault that fails the step after commit. The Workflow retries; assertions prove two callback invocations, exactly one original receipt row, completed attempt at the exact generation, and consumed fault counter. The concurrent local D1 test proves duplicate claims/competing receipt writers converge on one first-writer receipt.
- GitHub PR workflow run 42503077168 (Jarvis Web Prototype Validation) completed SUCCESS on exact head 4eb4aea106787c70039cd7110f1ca7a260628b57; job 128799814431. All steps completed successfully, including the new Cloudflare Workflow and D1 local proof suite. This verifies the local composed proof on CI, not live Cloudflare account behavior.
- PR #52 reviews/threads: 0/0. Independent review NOT RUN.
- No remote D1, secrets, OAuth credentials, providers/models, workflow dispatch, deployment or production mutations.
- Workflows adoption NOT QUALIFIED / NOT ADOPTED. Worker-process restart, regional failover, distributed concurrency stress, live Cloudflare account semantics, duplicate Workflow creation/event suppression, external side-effect idempotency and authority bridge remain NOT VERIFIED.
- Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B deferred.

## Cross-project boundary

- MediaHub OS is a historical source of requirements/contracts, not permission to expand cloud-pool scope.
- Contour B, iOS, local inference, media assistant and external server integration remain deferred until Contour A acceptance.
- Preserve historical IDs and authority boundaries. Do not mix Jarvis, ASTRA A0 and MediaHub Product State Authority; do not bypass issuer/capability controls.
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Next bounded actions

1. Read back PR #52 exact-head CI run 42500316035 and job steps; treat any missing result as NOT VERIFIED.
2. Compose the D1 adapter inside a synthetic Workflow step and test commit-then-timeout replay using official Workflow mocks.
3. Verify concurrent attempt claims and stale-generation fencing under local D1; test pending-indeterminate no-retry.
4. Re-run exact-head CI after changes and obtain independent security review; keep PR draft and unmerged.
5. Re-read current governance before any execution; dispatch stays fail-closed.

## Canonical source links

- Repository README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Pool Supervisor architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Web-console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
