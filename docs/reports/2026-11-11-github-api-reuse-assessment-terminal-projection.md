# GitHub API Reuse Assessment for Terminal Projection — 2026-11-11

## Immutable targets and scope

- PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`.
- PR #60 head: `234fb2ee40265e26fac00c69ac1b6192766602cb`.
- This pass is a read-only source and component assessment. No code, workflow, secret, permission, dispatch or hosted runtime changes.

## Reuse-first findings

### 1. Octokit Retry

Repository: [octokit/plugin-retry.js](https://github.com/octokit/plugin-retry.js), README blob `34c5c76be0091ca50f3a428ff8b0c388ee8479db`.

- Maintained official Octokit plugin; retries selected HTTP 4xx/5xx responses and excludes important non-retryable status codes.
- Useful for transport-level transient GitHub API failures.
- Not a durable outbox, idempotency ledger, semantic duplicate detector, retry budget persisted across process restarts, or authorization/capability system.
- Do not allow blind retries of comment POSTs merely because the HTTP client supports retry. The application must distinguish safe reads from side-effecting requests and perform marker read-back / durable attempt accounting.

### 2. Octokit Throttling

Repository: [octokit/plugin-throttling.js](https://github.com/octokit/plugin-throttling.js), README blob `b0b87c7aac8965c1807ed48985f827741ac0b961`.

- Implements GitHub recommended rate-limit and secondary-rate-limit handling.
- Callback policy determines whether a request is retried; documentation example demonstrates an explicit one-retry limit.
- Can be reused for a future authorized GitHub API client.
- Does not provide durable scheduling, exact-once comment creation, deduplication, or business-level retry limits.

### 3. GitHub Script

Repository: [actions/github-script](https://github.com/actions/github-script), README blob `bbae14e0c51ff43ec7481124f94d151a4e0ab266`.

- Official GitHub Action for API calls in workflow context; exposes Octokit and workflow-scoped token.
- Supports configurable retries using `@octokit/plugin-retry`.
- Strong candidate for a future narrow GitHub Actions sender, if the sender is explicitly authorized and uses a minimal workflow permission set.
- README states the project is not currently accepting contributions; this is not itself a blocker to consumption.
- Default token is scoped to the current repository; cross-repository/PAT use requires explicit separate authorization and must not be silently introduced.

### 4. Probot

Repository: [probot/probot](https://github.com/probot/probot), README blob `4360a1dcb4ee35d6e47406175cc42c8a280a27df`.

- Mature framework for GitHub Apps with granular installation permissions and webhook events.
- Could be relevant if the pool later adopts a separately governed GitHub App actor.
- Not a drop-in fit for current GitHub Actions-only proof: it adds an app runtime, webhook ingress, installation identity and credential lifecycle.
- Not adopted.

## Decision matrix

| Concern | Reuse component | Decision |
|---|---|---|
| GitHub REST client | Octokit / actions/github-script | REUSE CANDIDATE for future authorized sender |
| HTTP transient retry | Octokit plugin-retry | REUSE, but never as semantic outbox retry policy |
| API rate limits | Octokit plugin-throttling | REUSE for future sender |
| GitHub App ingress/runtime | Probot | NOT ADOPTED; separate runtime and authority boundary |
| Durable retry budget / generation fencing | Existing D1 outbox proof | Keep D1 as durable source of truth; HTTP plugin cannot replace it |
| Marker deduplication / delayed visibility | Existing reconciler protocol | Must remain application-level and be hardened/tested |
| Recovery Actor authority | PR #60 issuer/capability contract | No reusable library found that removes project-specific governance requirements |

## PR #58 source recheck

Read immutable source blobs:
- `projection-reconciler.mjs`: `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- `projection-reconciler.test.ts`: `76b144bd067a42455b858345abec5ee3580c8ccf`.

The previously identified findings remain present:
1. `allowPost` is caller-controlled and is not cryptographically/durably bound to the D1 outbox delivery generation, attempt ceiling or retry_after_at. PR #59 contains durable bounded retry state, but the PR #58 reconciler API does not consume that state as an authorization input.
2. `currentManaged` selects every label beginning `pool:`; unknown/future `pool:*` labels may be removed.
3. Envelope validation allows 1–3 labels and does not enforce one canonical terminal lifecycle label.

Tests still demonstrate only a delayed-visibility read-only follow-up after one POST; they do not demonstrate that an authorized durable retry budget prevents a second POST across repeated delayed visibility windows.

## Current PR / CI / review snapshot

- PR #58 OPEN / DRAFT; exact head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; run `42979949181` SUCCESS.
- PR #59 OPEN / DRAFT; exact head `22200226da4f1af30645cf441a639db6893e9310`; run `42981807825` SUCCESS.
- PR #60 OPEN / DRAFT; exact head `234fb2ee40265e26fac00c69ac1b6192766602cb`; no exact-head run returned, CI NOT VERIFIED.
- PR #58/#59/#60 formal reviews: none; inline review threads: none.
- No merges, production GitHub API client, live GitHub writes, remote D1, secret access, workflow dispatch or deployment.

## Next action

Do not add another HTTP client or workflow engine. Reuse Octokit / github-script if and when a sender is separately authorized. First resolve the stacked PR dependency: changes to PR #58 alter the base SHA of PR #59 and require a controlled rebase/revalidation. Then harden the existing proof with:
- durable attempt/generation/retry-after authorization passed from D1, not a caller boolean;
- exact allowlist of reconciler-owned labels;
- exactly one canonical terminal label (unless the authoritative lifecycle contract explicitly states otherwise);
- adversarial delayed-visibility race tests, including the marker becoming visible immediately after a later pre-POST read.

Dispatch remains fail-closed. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
