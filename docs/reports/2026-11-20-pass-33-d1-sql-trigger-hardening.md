# Pass 33 — D1 SQL trigger and admission binding hardening

Date: 2026-11-20
Status: implementation authored; exact-head D1 validation RUNNING at publication; contract validation SUCCESS.

## Frozen target and lineage

- Default branch: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Parent implementation: Pass 32 `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a`.
- Pass 33 branch: `feat/pass33-d1-sql-trigger-hardening-2026-11-20`.
- Current implementation HEAD: `deb14d34ce7387dec217cd79fc29403a91542c44`.
- Implementation PR #159: OPEN / DRAFT / UNMERGED; stacked on Pass 32.
- Validation-only PR #160: OPEN / DRAFT / UNMERGED; targets `Основной`; do not merge.
- Compare to default: 57 commits ahead, 0 behind; merge base is the frozen default SHA.

## Reuse assessment

Retained the repository's existing Cloudflare Workers Vitest integration and D1 migration harness (`@cloudflare/vitest-plugin@1.4.7`, Vitest 4.1.12). This is the correct maintained D1-specific runtime substrate already used by the project. No new dependency or alternate SQL engine was added. The fixture uses synthetic data only.

## Findings from SQL/trigger audit

1. Approval authorization identity columns were not comprehensively immutable. Migration 0011 protected executor ID, and migration 0012 protected a previously-bound admission ID, but owner/repository/issue/target/profile/envelope/expiry and approval primary identity lacked a unified database guard.
2. The approval consumed state had no monotonic transition guard; a direct SQL writer could attempt to reopen or switch a consumed record.
3. `consumed_at`, task key and admission ID needed a single atomic binding rule. Late admission-ID binding after an approval had already been consumed would otherwise be possible.
4. The migration 0012 admission INSERT trigger checked executor/profile equality but did not independently require the exact consumed approval, active/non-revoked route qualification, evidence digest and freshness.
5. The migration 0012 receipt INSERT trigger checked approval/task/executor identity but did not independently compare receipt attempt ID, qualification ID, evidence digest and committed time with the admission, prepared attempt, task current-attempt pointer and pending task-ready outbox.

## Changes

Added forward-only migration `0013_harden_admission_sql_bindings.sql`:
- Freeze approval ID and authorization identity.
- Permit only ready -> consumed/revoked state transitions.
- Bind consumed timestamp and task key during ready -> consumed; bind admission ID only in that same transition. A historical task-key-only consumption remains possible for compatibility but cannot be retroactively upgraded into a qualified admission.
- Enforce full approval/task/executor/route/evidence/freshness binding before inserting an admission.
- Enforce complete admission/attempt/task/outbox/qualification binding before inserting a commit receipt.

Tests:
- Direct SQL mutation of consumed approval identity must abort.
- A consumed approval without admission ID cannot be retroactively bound.
- Direct SQL admission against revoked qualification must abort.
- Forged receipt attempt identity must be rejected by the database.
- Frozen schema-0010 upgrade fixture now applies migrations 0011–0013.

## CI evidence and correction history

- Initial integrated D1 run [44709234906](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709234906) FAILED: 5/41. It exposed over-strict compatibility in the new consumption guard (historical task-key-only tests), one expected trigger error-name mismatch, and an upgrade test still expecting a forged receipt to be insertable. These were not hidden.
- Corrected the consumption guard to preserve the non-authorizing legacy task-key path while preventing late qualified-admission binding; kept executor immutability enforcement on its existing dedicated trigger; changed forged-receipt upgrade test to assert database rejection.
- Contract validation [44709527912](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709527912): COMPLETED / SUCCESS. Dispatch gate false; YAML parse and pool security contract checks passed.
- Final D1 run [44709527918](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709527918): RUNNING at report publication. Do not count as passed until exact-head completion is re-read.

## Evidence / limitations

- SQL migration and tests were re-read from GitHub after writes; blobs at the current branch head are recorded in the Pass 33 checkpoint.
- No hosted D1, secrets/secret values, provider calls, dispatch, executor launch, deployment, merge or production mutation.
- Gemini controller availability was not changed; Gemini/Claude dispatch NOT RUN.
- Independent review remains NOT VERIFIED. Current detailed ruleset read-back was not obtained in this pass; no governance change was made.
- Local Miniflare D1 tests are the only intended runtime qualification here. Hosted D1 locking/replication, real qualification issuer authenticity, lease fencing, trusted GitHub event provenance, executor sandbox and production runtime remain NOT VERIFIED.

## Next

Re-read exact-head D1 run 44709527918. If green, record exact test count and inspect all migration-upgrade assertions. Then continue with lease/fencing trigger audit and independent review. Keep PR #159/#160 unmerged and dispatch disabled.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
