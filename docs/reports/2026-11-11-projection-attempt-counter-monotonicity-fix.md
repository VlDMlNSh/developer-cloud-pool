# 2026-11-11 — Projection delivery attempt counter monotonicity

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`, observed baseline `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Target: PR #59, branch `proof/projection-dead-letter-policy-2026-11-11`.
- Previous PR #59 head: `5c47cda4394d0381315bc16182799a09bf861797`.
- New PR #59 head after this pass: `22200226da4f1af30645cf441a639db6893e9310`.
- Base remains PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- Scope limited to the isolated local Workers-runtime D1 proof. No production schema, runtime, deployment, secret, workflow, dispatch, or account resource changes.

## Finding

Migration `0007_bound_projection_delivery_retries.sql` imposed only an upper bound:
`NEW.delivery_attempts > 5`.
It did not reject a value lower than `OLD.delivery_attempts`. The adapter increments the counter on lease acquisition, but the database invariant was incomplete against direct SQL updates. Existing tests covered values above five and terminal dead-letter immutability, not decrement/reset of a non-terminal row.

Migration `0006_create_attempt_projection_outbox.sql` introduces the counter and does not install an earlier monotonicity trigger. Migrations 0001–0005 predate this projection outbox table, so they cannot establish an earlier trigger on it.

## Change

Added `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql`:

- BEFORE UPDATE OF `delivery_attempts`;
- reject when `NEW.delivery_attempts < OLD.delivery_attempts`;
- abort code: `PROJECTION_DELIVERY_ATTEMPTS_MONOTONIC`.

Extended `proofs/d1-ledger/test/claim-outbox.test.ts` in the retry-backoff scenario:
- acquire a second delivery lease (counter = 2);
- attempt direct SQL decrement to 1;
- require SQLite abort with the new trigger code;
- read back and assert the counter remains 2.

The existing >5 assertion remains intact. The Vitest configuration uses `readD1Migrations(.../migrations)`, so the new numbered migration is automatically included by the existing migration loader.

## Provenance and readback

- Migration commit: `4f1368305bb1eeac674c66cf73d7acf026a6be6d`.
- Test commit / current PR head: `22200226da4f1af30645cf441a639db6893e9310`.
- Migration blob SHA after readback: `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- Test blob SHA after readback: `d572b3d5fdf58c720d9cbfe0990419e7a9bc60f1`.
- Both files were re-fetched from the PR branch and their contents verified.

## Validation state

- Previous exact-head PR #59 run `42980783397` passed on the previous head `5c47cda...`; it does not validate this change.
- New exact-head run `42981807825` was observed RUNNING for head `22200226...`.
- Job `130393715595`: Local Workers-runtime D1 adversarial tests; at last readback the pinned Node.js setup was in progress and dependency install/tests were pending.
- New exact-head CI: RUNNING; result NOT VERIFIED until completion.
- PR #59 remains OPEN / DRAFT / UNMERGED. Reviews: 0. Inline review threads: 0.
- PR #58 remains OPEN / DRAFT / UNMERGED; its exact-head run `42979949181` was SUCCESS.
- PR #60 recovery-actor contract remains OPEN / DRAFT / UNMERGED; exact-head CI and independent review NOT RUN.
- Active repository ruleset observed: `Основной — verified`, ID `26550182`, enforcement active.
- Issue #38 and Issue #1 remain open. Cloudflare billing-plan entitlement is still NOT VERIFIED because the connected OAuth integration lacks Billing Read scope; no owner action or token change was performed in this pass.

## Disposition and boundaries

- Monotonicity invariant: IMPLEMENTED in the isolated PR branch; runtime test result PENDING.
- PR #59: NOT QUALIFIED / NOT MERGED.
- No hosted D1, Worker deployment, production projection sender, dispatch, Gemini controller run, provider/model call, secret read, or paid resource was used.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B remains deferred.

## Next bounded step

Re-read run `42981807825` for exact head `22200226da4f1af30645cf441a639db6893e9310`. If successful, inspect the complete job log/artifact and PR patch, then continue the Supervisor split-gate/recovery analysis without enabling dispatch. If failed, diagnose only the exact failing step and patch the smallest relevant scope.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
