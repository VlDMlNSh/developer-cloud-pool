# 2026-11-15 — PR #93 verified registry persistence and stale-epoch rollback audit (Wave 322)

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/93
- Target head: `e200838d038b9cd48635233187819302bba6a33e`
- Base: `fix/a0-admission-exact-replay-receipt-integrity-2026-11-15` @ `7014961587759b27d2ef6e91c60ce098d077ae83`
- Default branch `Основной` observed HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`
- PR remains OPEN / DRAFT; mergeable state `clean`; 5 commits ahead / 0 behind its stacked base.

## Verified findings

1. **Correction to prior provisional observation:** the latest PR #93 test file DOES contain the lower unseen epoch rollback case. Blob: `1a4b33b1765194ccc3b401dcd63aa775041e4b05`.
2. The test first persists epoch 2001, then verifies and attempts to persist epoch 2000 with a distinct qualification identity. It expects `persisted: false` and `REGISTRY_PERSISTENCE_FAILED`; it then asserts zero rows for epoch 2000 in snapshots, issuer keys, and route qualifications, while the active pointer remains epoch 2001.
3. Migration `0012_durable_route_registry_snapshots.sql` installs a database trigger rejecting any inserted epoch less than or equal to the maximum persisted epoch. The write is performed using one D1 `db.batch(statements)`; the trigger rejection therefore rolls back the batch. This is consistent with the adversarial test.
4. The earlier static concern that an old epoch could leave a partial snapshot after failure is NOT supported by the current migration + batch + adversarial test evidence.
5. The verifier-issued capability is enforced in `persistTrustedRouteRegistryBundle`; copied/spread verification objects and fabricated `verified: true` objects are rejected. The test also checks caller-owned input mutation after verification and qualification identity collision rollback.
6. Exact-head D1 CI for `e200838...`: push run #43736259303 SUCCESS and pull_request run #43736264768 SUCCESS. Both run the pinned Node 24.9.0 setup, `npm ci --ignore-scripts`, syntax check, Workers-runtime D1 tests, isolated second-binding migration API test, frozen schema-0010 upgrade fixture, and upload the resolved lockfile artifact.
7. PR #93 has zero formal reviews and zero inline review threads. It is a draft stacked on PR #92, which is itself stacked on PR #87; do not treat its green CI or `mergeable=clean` as authorization to merge.
8. Active ruleset `26550182` applies to `refs/heads/Основной`; it requires a PR, prohibits deletion/non-fast-forward, and requires review-thread resolution, but has zero required approving reviews and no required status-check contexts. No bypass actors are configured. This is insufficient evidence of an independent security-review gate.
9. The two CI runs are local Workers-runtime/D1 proofs, not a remote D1 account qualification or deployed runtime. No deployment, provider/model call, secret access, dispatch or production admission was performed.

## Executor / Gemini status

- Cloud Pool-specific independent Gemini review route is NOT VERIFIED / NOT RUN in this pass. The approved MediaHub Gemini controller is not evidence of an authorized Cloud Pool review route; do not repurpose it or bypass its scope.
- Three Gemini child agents: NOT RUN; no controller/child run IDs, job IDs, artifact digests or review attestations.
- No Claude Code execution: third-server host identity/capabilities/allowlist not requalified in this pass.

## Status and next step

- PR #93 implementation + exact-head local D1 CI: VERIFIED at target SHA.
- Independent security review: NOT VERIFIED.
- Governance qualification for merge: BLOCKED / NOT VERIFIED because the active ruleset requires zero approvals and no required checks.
- Remote D1 qualification, live pool runtime, web UI, executor routing, durable operational state and Contour A acceptance: NOT VERIFIED / NOT ACCEPTED.
- Contour B remains DEFERRED.
- Next bounded step: resolve the independent-review/governance gate for the stacked D1 admission/registry series; then perform a separate integration review of PRs #87, #92 and #93 as one dependency chain before considering any merge. Do not merge a stacked child independently.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
