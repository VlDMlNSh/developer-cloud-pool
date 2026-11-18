# D1 lease acquisition-attempt fencing — engineering pass

Date: 2026-11-18  
Contour: A — isolated D1 proof qualification  
Status: source change SUCCEEDED; exact-head Workers-runtime CI VERIFIED; independent review NOT RUN; not production accepted.

## Immutable source and branch provenance

- Parent proof HEAD: `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- New isolated branch: `proof/d1-lease-attempt-fencing-2026-11-18`.
- Resulting source HEAD: `2cefe8d62b99012ff23d45f33e3251996747fb7b`.
- Draft PR #131 targets only the parent proof branch, not the default branch; no merge performed.
- Default branch remains `Основной` at prior readback `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; recheck before integration.
- Existing PR #40 and #130 were not modified by this pass.

## Engineering change

The original lease acquisition did a conditional UPDATE, then a second SELECT filtered by task key and worker ID. Since worker ID can be reused, a same-worker reclaim between those operations could cause the earlier call to read a later generation.

Implemented in the isolated proof branch:
1. Migration `0004_add_lease_attempt_identity.sql` adds nullable `lease_attempt_id` and an index on `(task_key, lease_attempt_id)`.
2. Each acquisition creates a fresh UUID and writes it in the same conditional UPDATE that increments `lease_generation`.
3. Readback selects by `task_key + lease_attempt_id`, not reusable worker ID.
4. If a later acquisition supersedes the first before readback, the earlier call fails closed with `LEASE_ACQUISITION_SUPERSEDED`.
5. Lease expiry arithmetic is rejected if the result is not a safe JS integer.
6. Generation increment is constrained below `Number.MAX_SAFE_INTEGER`.
7. Finalization clears the attempt ID.

The change remains local-only and `dispatch: false`. No hosted D1, production binding, secrets, provider calls, deploy or Contour B integration.

## Adversarial test

Added a deterministic Workers-runtime interleaving test. A wrapper injects a second acquisition with the same worker ID after the first conditional UPDATE succeeds but before the first readback. Expected: the second acquisition obtains generation 2 and its own attempt ID; the first returns DENY / `LEASE_ACQUISITION_SUPERSEDED`; persisted attempt ID matches only the second acquisition.

Also added expiry-overflow and generation-overflow tests.

## Cloudflare D1 contract assessment

Current Cloudflare D1 docs state D1 is compatible with most SQLite SQL conventions and document prepared statement result retrieval, but do not explicitly guarantee `UPDATE ... RETURNING` for this D1/runtime combination. SQLite itself supports RETURNING since 3.35.0, but SQLite compatibility alone is not a D1 feature guarantee. Therefore this change uses the explicit attempt-token pattern and does not depend on RETURNING.

References:
- https://developers.cloudflare.com/d1/sql-api/sql-statements/
- https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- https://www.sqlite.org/lang_returning.html

## CI evidence

- Workflow: `.github/workflows/d1-ledger-proof-validation.yml`
- Run: [44307008802](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44307008802)
- Event: push; exact `head_sha`: `2cefe8d62b99012ff23d45f33e3251996747fb7b`
- Run: COMPLETED / SUCCESS.
- Job `134811053620`, `Local Workers-runtime D1 adversarial tests`: COMPLETED / SUCCESS.
- `npm ci --ignore-scripts --no-audit --no-fund`: SUCCESS.
- `npm run check`: SUCCESS.
- `npm test` in Workers-runtime D1: SUCCESS.
- Lockfile artifact `14429260200`, SHA-256 `d73de3e274d3c49f5251c7cb0e6d54f983bdbbd1f58d60595ae1b43d6d0db77c`, expires 2026-11-25.
- This was an exact branch-head push run, not a PR merge-context-only run.

## Remaining qualification gaps

- Independent security/code review: NOT RUN.
- Result and outbox writes fenced by current lease generation + effect identity: NOT VERIFIED.
- End-to-end worker execution, routing, durable state recovery and external side-effect idempotency: NOT VERIFIED.
- Governance/security gates for production dispatch: NOT VERIFIED; dispatch remains disabled.
- PR #131 is DRAFT / OPEN / UNMERGED.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## Next bounded step

Independently review PR #131 and add proof that every durable result/outbox mutation validates the currently held generation and stable effect identity in the same transaction. Then test stale worker output rejection, duplicate delivery idempotency, crash recovery and ambiguous storage outcomes. Do not merge until independent review and exact-head CI evidence are recorded.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
