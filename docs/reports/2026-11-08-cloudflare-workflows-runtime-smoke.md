# Cloudflare Workflows local runtime smoke — 2026-11-08

## Result

**Local Workflow runtime smoke: VERIFIED. Full Cloudflare Workflows/D1 proof: PLANNED. CI: NOT VERIFIED. Workflow adoption: NOT DECIDED.**

This pass established a real, repeatable local test path on the authorized Voktors-Mini.Dlink macOS device. It did not deploy or access a Cloudflare account.

## Immutable target and environment

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Proof branch: `proof/cloudflare-workflows-vitest-2026-11-08`
- Immutable checkout HEAD: `8e3cd9dd4d2a650c0b37042ff896fb5c0f282f1e`
- Base application head: PR #25 `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`
- Upstream SDK fixture commit: https://github.com/cloudflare/workers-sdk/commit/ab086218678b1bf311b158bcc62cc6b7437a7839
- Host: Voktors-Mini.Dlink; Desktop Commander device ID `e264f341-2e21-4dfc-9f97-9b95cd08bcd3`.
- Runtime: macOS arm64, Node `v22.23.3`, npm `10.9.9`.
- Scratch checkout: `/tmp/developer-cloud-pool-proof-20261108`. All experiment files remain local scratch and are not committed to GitHub.

## Reuse and dependency compatibility

Inspected official Cloudflare Workers SDK fixtures at the immutable upstream SHA above. Reused the documented `cloudflareTest` plugin and Workflow introspection APIs; did not copy the example's non-deterministic placeholder application logic.

Local dependency set:
- `@cloudflare/vitest-plugin@1.6.0`
- `vitest@4.1.12`
- `wrangler@4.158.0` (existing pinned version)
- transitive Miniflare `5.20261104.0-beta`
- lockfile format: npm lockfile v3.

A first lockfile-generating `npm install` without legacy peer handling failed inside npm with `Cannot read properties of null (reading 'edgesOut')`. Retrying dependency installation with `--package-lock=false --legacy-peer-deps`, followed by `npm install --package-lock-only --legacy-peer-deps`, succeeded. A clean `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` then installed 84 packages successfully. CI must use the same peer-resolution flag until this is independently shown unnecessary.

## Local verification

On the immutable checkout, after clean install:
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run validate:ui`: PASS (`JARVIS_STATIC_UI_VALIDATION=PASS`).
- `npm run test:workflow`: 1/1 PASS under Vitest 4.1.12 and the Cloudflare Workers runtime plugin.
- The smoke test created a local Workflow instance through the Worker fetch handler, waited for terminal `complete`, and asserted the named step result and final Workflow output.

The first smoke-test draft used the upstream `await using` pattern in a file named `.test.js`. Node's built-in `node --test` auto-discovered it and failed to parse the resource-management syntax in that execution mode. The file was renamed to `.vitest.js` and explicitly included in the Vitest config; the two test runners are now isolated. This is a test-discovery constraint to preserve in the eventual repository implementation.

Local scratch file SHA-256:
- `package.json`: `36921a9412f26161770d7ecf5833c7f0a440c4fef29ef7c6fa789f1e5b1bd180`
- `package-lock.json`: `0b352d25b5963ee1e3f101a827b9adec79fa5c0bc02ef1639119bb2f7c33f00b`
- `wrangler.proof.jsonc`: `cee734a320bdc610721f7e352901df83759880c704faee5c9bd69b9d58f70b2f`
- `vitest.config.js`: `c8e61e6e52774a213cdd6648cf5300fe9c055686b13e1012eca70dd8eba0bd5e`
- `src/workflow-proof.js`: `409b8459d36b47ff47a2fddd75452db32e4cd8ebedb68959bab8c1eed6638409`
- `tests/workflow-runtime.vitest.js`: `4aaa6d1e8b9ffb306c5659b2110b28621fd22f04335aa208bc17aafdf97c678a`

## Scope boundaries and unresolved proof obligations

This is only a runtime compatibility smoke. It does **not** prove:
- D1 schema/migration integration with Workflows;
- atomic idempotency after D1 commit followed by a Workflow step timeout;
- Task/Attempt identity and lease-generation fencing;
- pending-indeterminate no-retry/no-takeover behavior;
- duplicate Workflow/event suppression;
- provider, model, remote D1, dispatch, secret isolation or production deployment boundaries;
- exact-head GitHub Actions CI or independent review.

No GitHub source code was changed in this pass; the scratch files above have not been promoted. No secrets were read, no provider/model calls were made, no Cloudflare account operation or deployment was performed, and no dispatch was run.

## Operational observations

- SentinelX host listing showed Voktors-Mini.Dlink operational, with the Free plan's single active host slot occupied. mh-dev-01 and mh-dev-02 remain disabled; no host state was changed.
- SentinelX capabilities/state reads transiently returned `duplicate_session` / `agent_disconnected`; the same physical device was available through Desktop Commander. No SentinelX mutation was attempted.
- Desktop Commander configuration reported an empty `allowedDirectories` list (broad filesystem scope). The experiment was restricted to a new `/tmp` checkout; no credentials, dotfiles containing secrets, or unrelated project files were read.

## Next bounded action

Extend the local-only fixture with a synthetic D1 binding and migration setup, then prove the atomic commit-then-timeout deduplication case and lease-generation fencing. Keep the proof branch isolated; only after these cases pass should the complete harness be committed and opened as a draft PR targeting PR #25's branch for exact-head CI. No deployment or Workflow adoption follows automatically.
