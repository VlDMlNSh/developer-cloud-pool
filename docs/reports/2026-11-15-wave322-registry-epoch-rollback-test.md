# Wave 322 — D1 registry stale-epoch rollback regression (2026-11-15)

## Immutable targets

- Default branch: `Основной`
- Default HEAD observed: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`
- PR #93 branch: `fix/verified-registry-capability-clean-stack-2026-11-15`
- PR #93 pre-change target: `99ca50ce11efb380efa6346a1db672585876a8b1`
- PR #93 post-change target: `e200838d038b9cd48635233187819302bba6a33e`
- Test blob after write/read-back: `1a4b33b1765194ccc3b401dcd63aa775041e4b05`
- PR #93: https://github.com/VlDMlNSh/developer-cloud-pool/pull/93

## Scope and findings

Reviewed PR #93, which adds verifier-issued persistence authority for root-signed registry snapshots. The API uses module-private WeakMaps to bind the exact immutable bundle and detached signature to the exact verifier result object. Copying or reconstructing the result cannot obtain persistence authority. The branch changes three files and has two prior D1 proof runs on exact pre-change head, both SUCCESS.

Static review initially considered whether a lower registry epoch could leave partial rows after the active pointer failed to advance. This hypothesis was explicitly checked against migration 0012. The database has a BEFORE INSERT trigger rejecting any snapshot epoch <= MAX(persisted registry_epoch) with RAISE(ABORT); D1 batch is atomic. Therefore the hypothesized stale-epoch partial write is not supported by source evidence and is not reported as a confirmed defect.

The test suite did not contain a dedicated lower-unseen-epoch regression case. Added a targeted case to the existing persistence test:
- Persist epoch 2001 first.
- Verify a separately signed lower epoch 2000 with a unique qualification ID.
- Attempt persistence through the genuine verifier result.
- Assert persistence fails and snapshot, issuer-key, route-qualification rows for epoch 2000 remain absent.
- Assert active pointer remains epoch 2001.

This is test-only; no migration or production route behavior changed.

## CI

New exact-head D1 workflow run:
- Run #43736259303: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43736259303
- Job #132879411032: Local Workers-runtime D1 adversarial tests — COMPLETED / SUCCESS.
- Exact target SHA: `e200838d038b9cd48635233187819302bba6a33e`, matching PR #93 head at recheck.
- Syntax check: SUCCESS.
- Workers-runtime D1 suite: 11 test files / 120 tests PASS / 0 FAIL. The updated `trusted-route-registry-persistence.test.ts` including stale-epoch rollback case passed.
- Isolated second D1 binding/migration smoke: 1 passed, 2 skipped by test-name filter.
- Frozen schema-0010 fixture smoke: 2 passed, 1 skipped by test-name filter; golden SHA-256 `afbf1445c6d2fa0b51cdbd0da932d158aa2850832ca8297f83b103c00d8b2187`.
- Lockfile artifact ID `14170616460`; ZIP SHA-256 `909e27d3bec1ca75933085475431f3ff5e4f9f8578985e1e2670d01336270c5a`.

Prior pre-change exact-head checks on `99ca50ce11efb380efa6346a1db672585876a8b1`:
- Run #43725400300 / job #132846119246: SUCCESS; all steps passed including syntax, D1 tests, second binding/migration API, frozen schema-0010 fixture and artifact upload.
- Run #43725394531 / job #132846100952: SUCCESS; same step set passed.
These prior runs do not substitute for the new exact-head run.

## Governance and agent state

- PR #93 remains OPEN / DRAFT; no merge performed.
- The change is on a stacked feature branch, not default branch.
- No secrets or provider credentials read; no provider calls, deployment, dispatch or pool execution.
- Gemini three-agent dispatch remains NOT RUN / NOT QUALIFIED. No child IDs or artifacts exist.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Cross-project MediaHub note

- PR #651 merged into MediaHub main at `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Owner `/probe` comment #6897245259 exists, but GitHub's full Issue #301 comment listing shows it at 15:58:33Z before the PR merge at 16:25:14Z. The only corresponding controller run #43732834570 ran on pre-merge SHA `46e7395cc7a8755a096f1a8667b750177ed42011` and failed at `assert_probe_context`. No post-merge /probe or controller run is evidenced. No additional comment was posted by this pass.
- This does not change the priority: Developer Cloud Pool Contour A remains primary.

## Next step

Exact-head run #43736259303 is SUCCESS. Keep PR #93 draft and unmerged. Next bounded pass: inspect PR #92 exact-head CI and the atomic A0 admission/registry assertion boundary, then test replay, stale epoch and revocation races before any merge or live qualification.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
