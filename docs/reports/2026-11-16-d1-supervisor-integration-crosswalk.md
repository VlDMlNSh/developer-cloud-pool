# 2026-11-16 — Contour A D1-to-Supervisor integration crosswalk

## Scope and immutable target
Read-only source audit and documentation update. Repository `VlDMlNSh/developer-cloud-pool`; default branch `Основной` exact HEAD `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`. No code/workflow/permission/secret/variable/schema/runtime changes, no hosted resources, dispatch, provider calls, deployment, merge or Contour B work.

## Current default Supervisor/Worker source
- `.github/workflows/pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- `.github/workflows/pool-worker.yml` blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- Supervisor grants workflow-level `issues: write` and `actions: write`; its job reads `vars.POOL_DISPATCH_ENABLED`. Script dispatch is enabled only if the value is exactly string `true`; otherwise it logs heartbeat-only and exits before GitHub mutations.
- If enabled, Supervisor still uses issue-label PATCH as claim, posts comments, directly dispatches Worker, returns to ready on dispatch exception, and can requeue stale claims based on absence from a bounded 100-run listing plus issue `updated_at`. These behaviors are not a durable CAS claim, trusted lease, or authoritative ambiguous-outcome reconciliation.
- Worker validates issue state/label/body SHA/profile, then runs only a pinned DSH headless `--dump-config` probe with no provider credentials/model call. Its report job independently PATCHes labels and posts a comment; it does not bind finalization to an immutable claim generation. Workflow report permission is Issues write. These are historical workflow facts, not permission to enable dispatch.
- The active code path remains fail-closed by default; the actual repository variable value was not read. Do not infer its current value from source.

## D1 proof stack and exact inspected heads
- PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; local proof package includes migrations 0001–0010, approval consume/claim/outbox, task attempts, leases, projection delivery and local tests. Its README blob `932f76ecad1434cb3bbb3347c30686a3448b524a` explicitly says local-only, not mounted in Hono, Supervisor/Worker or deployed Worker.
- PR #67 `src/worker.mjs` blob `214622f6dc94623521070eb9e7fbc2f573fdc2c6` is deliberately inert and returns HTTP 404. `wrangler.jsonc` blob `eb683b6bb838cb7a48741f900de6c17be7fdc0fe` contains all-zero placeholder D1 database ID. There is no HTTP claim endpoint or hosted D1 binding.
- PR #87 head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5` adds migration 0011–0014, qualified admission and route registry evidence. PR #92 head `7014961587759b27d2ef6e91c60ce098d077ae83` hardens exact replay receipt; PR #93 head `e200838d038b9cd48635233187819302bba6a33e` requires verifier-issued registry persistence capability. They are a stacked draft chain; #92 is based on #87, #93 on #92, and are not merged.
- PR #67 exact-head local validation runs #43600901063 and #43600901068 succeeded, including Workers-runtime D1 tests. This verifies local proof only, not hosted D1, a service endpoint or production wiring.

## Existing qualification and authority documents
- Durable Supervisor claim protocol on default: `docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md`, blob `830a549809d10015d5662da562cff82710c3aa11`. It already defines issuer-bound one-use claim, atomic claim/outbox, fencing, indeterminate handling, least privilege and promotion gates.
- Hosted D1 plan in PR #65 head `3d67783e4da60296f26547174b0bdeae58d9a3f2`, blob `48cc92df59155881f50d81ff7c6ba1f2375d5d97`, is PLANNED / NOT AUTHORIZED / NOT RUN. It explicitly requires current Workers Free eligibility/quota evidence, immutable source reconciliation, exact-head CI, and owner's explicit authorization for one named qualification D1 and test-only Worker. It excludes GitHub write, dispatch, provider credentials and production bindings from test Worker.
- PR #65 remains Draft/unmerged. Its plan is a design reference and must be selectively reconciled to current source before use; no hosted resource creation is authorized by this audit.
- PR #60 Recovery Actor grant issuer/trusted-time contract is a separate projection-recovery authority. It is not a Supervisor task-claim issuer and must not be wired as a substitute.

## Integration dependency order — recommended, not executed
1. **Freeze/clean-source decision:** choose a clean candidate base at current default and selectively transplant the D1 source stack. Do not merge stacked PR history blindly. Include migration checksums, exact lockfile and tests.
2. **Keep proof inert:** preserve `dispatch:false`, no provider/GitHub credentials, and the current 404 local-only entrypoint until the hosted qualification gate is explicitly authorized.
3. **Issuer boundary first:** define and implement the independently authenticated Supervisor claim API/composition root; exact binding of repository/task/target SHA/profile/envelope/nonce/audience/expiry; trusted time and revocation. Storage credentials remain server-side.
4. **Hosted D1 qualification:** only after current Free entitlement/quota and source/CI evidence, and explicit owner authorization for named isolated resources. Run the plan's 50 independent concurrent HTTP requests plus lost-response, rollback, restart, stale generation/finalizer and cleanup tests. No external side effects; dispatch always false.
5. **Separate actors:** task claim service, Worker execution, indeterminate resolver and projection delivery/recovery must have separate capabilities/audiences. Projection Recovery Actor cannot claim/requeue/dispatch tasks.
6. **Replace Supervisor authority:** labels become display projection only. Supervisor obtains a narrowly scoped claim result and has no D1 admin credential or broad direct dispatch permission. Remove timeout-to-ready and bounded-absence recovery. Require owner/generation/envelope-fenced finalization and authoritative reconciliation.
7. **Worker report hardening:** bind result to exact run ID, claim ID, immutable envelope digest and lease generation; stale writers cannot change task state.
8. **Independent review and exact-head CI:** verify default ruleset, required reviews, provenance, end-to-end hosted evidence and all Contour A acceptance gates before enabling any dispatch. Keep Contour B deferred.

## Blockers and statuses
- Hosted claim-service endpoint: NOT IMPLEMENTED.
- Hosted D1/account Free entitlement/current quota: NOT VERIFIED / NOT RUN.
- Owner authorization for named test resources: NOT GIVEN in this pass.
- Production issuer, trusted time and revocation: NOT QUALIFIED.
- Supervisor/Worker integration with D1 claim/attempt/lease: NOT IMPLEMENTED.
- Supervisor current source has unsafe legacy paths if its dispatch flag is enabled; flag value itself was not read.
- Cloud Pool-native three-agent Gemini dispatch: NOT RUN in this pass; no assertion of child executions.
- No secret values were read, no provider/model calls, no hosted resources, no dispatch, no deployment, no merge.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step
Create a source-only integration candidate manifest for a clean current-default branch: exact file/blob list, migration order, omitted/retained proof layers, and required tests. In parallel, determine whether existing current-base PRs already contain a cleaner selective transplant; do not duplicate implementation. Only after this manifest is reviewed should any implementation PR be assembled. Hosted D1 remains gated by the explicit authorization and free-tier/account checks above.

## Evidence
- Default branch HEAD: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- PR #65: https://github.com/VlDMlNSh/developer-cloud-pool/pull/65
- PR #67: https://github.com/VlDMlNSh/developer-cloud-pool/pull/67
- PR #87/#92/#93: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
