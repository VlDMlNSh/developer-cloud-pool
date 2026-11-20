# Pass 34 — D1 lease and attempt fencing SQL guards

Date: 2026-11-20
Status: VERIFIED by exact-head local Workers/D1 CI. Independent review NOT VERIFIED.

## Frozen target and lineage

- Canonical default branch: `Основной` @ `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`.
- Previous default snapshot: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; comparison shows 3 documentation-only commits (Pass 33 report/checkpoint/snapshot), no intervening code changes.
- Parent: Pass 33 @ `deb14d34ce7387dec217cd79fc29403a91542c44`.
- Implementation branch: `feat/pass34-d1-lease-fencing-sql-guards-2026-11-20`.
- Final implementation HEAD: `13cf7d43b7bdf645b1336498f32f449035994e7f`.
- PR #161 implementation: OPEN / DRAFT / UNMERGED; base Pass 33.
- PR #162 validation-only: OPEN / DRAFT / UNMERGED; base `Основной` at `7e76bd2...`; validation merge commit `647fa199128e0e55c3180b30c1c28d82f14c9704`. Do not merge.
- Pass 33 PR #159 remains OPEN / DRAFT / UNMERGED; no review submissions. PR #161 also has no review submissions or inline review threads.

## Reuse / architecture assessment

- Reused the repository's existing Cloudflare Workers Vitest / Miniflare D1 migration harness and pinned dependencies; no new runtime or development dependency.
- Official Cloudflare D1 documentation states that each individual D1 database is inherently single-threaded and processes queries one at a time. This supports keeping lease state transitions in the same D1 authority with conditional SQL and triggers rather than adding a second lock service.
- Durable Objects were reviewed as an official stateful coordination alternative. They are single-threaded per object and useful when an independent coordination atom is needed, but introducing a second coordinator here would duplicate authority and complicate the existing D1 ledger. Not adopted in this pass.
- Reference: https://developers.cloudflare.com/d1/platform/limits/ and https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/

## Audit finding

The older lease proof had a `pool_attempts_running_requires_current_lease` trigger in an earlier migration sequence. In the current CODE-profile chain, migration 0006 is already the attempt projection outbox; the old lease guard was not present in the current sequence. Migration 0004 had partial acquisition/terminal/indeterminate triggers but did not independently block every direct-SQL bypass. The older adapter modules were not copied blindly because they were tied to a different migration baseline and legacy profile.

## Changes — migration 0014

Added forward-only `0014_d1_lease_fencing_guards.sql`:

1. A lease can be acquired only from pending for the current prepared attempt, with one positive monotonic generation increment and a bounded expiry.
2. A live lease can be renewed only with the same owner, attempt and generation, before the old expiry, with an extended but bounded deadline.
3. Direct prepared -> running attempt mutation is rejected unless the matching current, unexpired task lease exists.
4. A lease cannot be directly released or transferred. Only the fenced terminal-attempt projection can clear it.
5. Expired running attempts can become indeterminate only for the matching current attempt and generation. Indeterminate remains quarantined; no automatic takeover is allowed.
6. Attempt start, indeterminate and terminal metadata are set only in their corresponding lifecycle transitions; terminal metadata cannot be rewritten.
7. Attempt events must match the current transition, deterministic event ID, actor/owner, generation, digest and timestamp; update/delete remain blocked.
8. Task attempt pointers can advance only to the next prepared attempt after the previous attempt is failed or abandoned.

Added `test/lease-fencing.test.ts` with 8 tests covering direct-SQL running bypass, valid lease acquisition, owner substitution, generation jumps, same-owner renewal, expiry, direct release, stale finalization, terminal metadata mutation, indeterminate quarantine, forged event insertion and pointer regression. Frozen schema-0010 upgrade fixture now applies migrations 0011–0014.

## Exact-head CI

- First D1 run [44711715024](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44711715024) FAILED 7/50. The first lease test itself passed; subsequent tests exposed a test-fixture teardown defect: it attempted to delete append-only attempt events while the test's append-only DELETE trigger was active. Production SQL guards were not disabled by application code. The fixture now temporarily drops only the append-only UPDATE/DELETE guards during cleanup and restores them before every test; the event INSERT provenance guard stays active.
- Final D1 run [44711819163](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44711819163), job `136205134465`: COMPLETED / SUCCESS; 5 test files / 50 tests passed; pinned Node 24.9.0; `npm ci`; inert Worker syntax check; fresh local D1 migration and authority tests.
- Pool Contract Validation [44711819175](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44711819175), job `136205134889`: COMPLETED / SUCCESS; all six workflow YAML files parsed; security contract checks passed; `POOL_CONTRACT_VALIDATION=PASS`; dispatch remained false.
- Validation checkout merge commit `647fa199128e0e55c3180b30c1c28d82f14c9704` combines exact implementation HEAD with current default SHA `7e76bd2...`.

## Evidence / limitations

- Migration 0014 blob: `8504b2ae3150092493a2a7808d58a89a4ef9650e`.
- Lease test blob: `9ac92318324179405249af3f3825c33b56922df3`.
- Migration upgrade test blob: `b5f66e84d56c2d1ee74912315190949a89a45e54`.
- README blob: `ac9b277cb440c6c894b23ff1957608874535c59c`.
- This pass adds SQL enforcement and synthetic tests only. The current Pass 33 adapter is still admission-only; no canonical lease adapter is wired into the runtime path yet.
- A SQL owner string is not authentication: trusted principal-to-executor binding still belongs at the authenticated adapter/controller boundary.
- Indeterminate attempts intentionally remain quarantined; explicit reconciliation and safe recovery are not implemented by this pass.
- Hosted D1 behavior, cross-region failure semantics, live GitHub event authenticity, actual executor sandbox qualification and production fencing remain NOT VERIFIED.
- No hosted D1, secrets/secret values, provider calls, dispatch, executor launch, deployment, merge, production writes or governance changes.
- Gemini controller workflow remains absent from default; Gemini/Claude NOT RUN.

## Next

Pass 35: integrate one canonical attempt-lease adapter into the current CODE admission chain; bind authenticated executor identity and worker clock, add primary-first durable readback for ambiguous lease writes, and define an explicit reconciliation path for indeterminate attempts. Keep automatic takeover disabled until reconciliation proves it safe. Obtain independent review of PRs #159 and #161.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
