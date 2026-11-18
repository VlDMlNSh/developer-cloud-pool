# Issue #38 — D1 claim/lease exact-head reconciliation

Date: 2026-11-18  
Status: SOURCE READ / CI EVIDENCE RECONCILED / NOT QUALIFIED

## Immutable refs observed

- Repository default branch: `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Proof branch: `proof/task-identity-fencing-design-2026-11-08` resolves to `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- Latest proof-branch commit message: `fix: report exhausted state consistently after dead-letter transition`.
- Latest source blob read back: `proofs/d1-ledger/src/task-lease.mjs` @ `b41edf89cdf960b2c007f38ba16554dc179f021a`.
- README blob: `a364fb31ff340970d15658f3cf4ee5502696d4ef`.
- package.json blob: `cd7a705ce39860685c3ec60134dc8442fab738d8`.
- Vitest config blob: `39bcf53a51180e7e5f309978e307e9964a2cc22e`.
- Proof branch is not default and has no production integration evidence.

## CI reconciliation

Workflow run [42489887940](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42489887940), job [128759748692](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42489887940), completed SUCCESS. The job log proves checkout of PR #40 merge ref `23e06138ddee46934c8cb137d04dd1585d390ea6`, which merged proof commit `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb` into `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.

That run executed:
- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run check`
- `npm test`
- 2 test files, 27 tests, all passing (13 consume + 14 claim/outbox).
- Artifact ID `13620723665`, SHA-256 `a79f822dd3acf44b22237d1fe164b8d446a0b269e6b40046987f2a3fda64d66b`.

**Critical qualification boundary:** this CI run did not execute the current task-lease tests. The checkout was a PR #40 merge ref, not the proof branch head as a direct exact-head CI run. Combined status for the current proof head returned no status entries. Therefore current task-lease exact-head CI = NOT VERIFIED.

## Source findings

The current lease adapter uses a conditional D1 UPDATE for acquisition, increments `lease_generation`, bounds attempts to five, and fences renewal/finalization by task key, owner, generation and unexpired lease. It returns `dispatch:false` in all observed decision paths.

The current `vitest.config.ts` includes `test/**/*.test.ts`; guessed paths `test/task-lease.test.ts` and `migrations/0010_ledger.sql` returned 404. These guessed paths are not treated as evidence. The exact migration/test tree has not yet been recovered. README statements that lease tests exist are not a substitute for reading and executing those tests.

## Qualification gaps

1. Recover the exact branch tree and actual lease test/migration paths.
2. Run the current branch head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb` through exact-head CI.
3. Prove simultaneous claim contention against local D1/workerd: exactly one winner and correct loser readback.
4. Prove expiry/reclaim increments generation; old owner/generation cannot renew, finalize, write result or emit outbox side effects.
5. Prove dead-letter/outbox atomicity, bounded retries, ambiguous-storage fail-closed behavior and crash recovery.
6. Prove task key is derived from repository ID, approval/Issue identity, immutable target SHA, execution profile, capability envelope and canonical payload digest; adapter currently accepts a precomputed 64-hex key and does not establish that derivation.
7. Test same worker ID, expiry equality, clock rollback/forward assumptions and integer/generation overflow.
8. Preserve idempotency for external effects. A lease is not exactly-once execution.

## Governance and related PRs

- Issue #38 remains OPEN.
- PR #130 remains OPEN / DRAFT / UNMERGED; base is PR #129's branch; mergeable=true at readback. Reviews 0; inline review threads 0.
- PRs #129, #128, #86, #84, #81 and #77 remain OPEN / DRAFT / UNMERGED at metadata readback. Do not infer acceptance from CI of sibling PRs.
- Default branch remains `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Repository ruleset and current dispatch variable were not re-read in this pass: NOT VERIFIED.
- Gemini controller was not invoked. Gemini NOT RUN.
- No secrets read, hosted D1 writes, provider calls, production dispatch, deployment, merge or Contour B work.

## Decision and next step

Continue qualifying the existing Workers + D1 proof; do not add external queue infrastructure yet. First recover the actual migration/test tree, then create a clean exact-head CI run for the proof branch with the lease-specific adversarial suite. Keep all dispatch gates fail-closed.

Contour A: BLOCKED / NOT ACCEPTED.  
Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
