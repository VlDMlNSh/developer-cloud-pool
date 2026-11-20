# Pass 33 — D1 SQL trigger and admission binding hardening

Date: 2026-11-20
Status: VERIFIED by exact-head CI; independent review remains NOT VERIFIED.

## Frozen target and lineage
- Default branch: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Parent implementation: Pass 32 `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a`.
- Pass 33 branch: `feat/pass33-d1-sql-trigger-hardening-2026-11-20`.
- Final implementation HEAD: `deb14d34ce7387dec217cd79fc29403a91542c44`.
- PR #159 implementation: OPEN / DRAFT / UNMERGED; stacked on Pass 32.
- PR #160 validation-only: OPEN / DRAFT / UNMERGED; targets `Основной`; do not merge.
- Compare to default: 57 commits ahead, 0 behind; merge base is the frozen default SHA.

## Reuse assessment
Retained the repository's existing Cloudflare Workers Vitest integration and D1 migration harness (`@cloudflare/vitest-plugin@1.4.7`, Vitest 4.1.12). This is the maintained D1-specific runtime substrate already used by the project. No new dependency or alternate SQL engine was added. Tests use synthetic data only.

## Findings
1. Approval authorization identity columns lacked a unified database-level immutability guard. Migration 0011 protected executor ID, and 0012 protected a previously-bound admission ID, but owner/repository/issue/target/profile/envelope/expiry and approval primary identity lacked comprehensive protection.
2. Approval state did not have a monotonic transition guard.
3. `consumed_at`, task key and admission ID needed a one-time binding rule. Late admission-ID binding after consumption could otherwise occur.
4. The 0012 admission INSERT trigger did not independently require the exact consumed approval, active/non-revoked route qualification, matching evidence digest and freshness.
5. The 0012 receipt INSERT trigger did not independently compare attempt ID, qualification ID, evidence digest and committed time with the admission, prepared attempt, current task pointer and pending task-ready outbox.

## Changes
Added forward-only migration `0013_harden_admission_sql_bindings.sql`:
- Freeze approval ID and authorization identity.
- Permit only ready -> consumed/revoked state transitions.
- Bind consumption timestamp/task key in the ready -> consumed transition; admission ID must be bound in that same transition. Historical task-key-only consumption remains for compatibility but cannot be retroactively converted into qualified admission.
- Enforce full approval/task/executor/active-route/evidence/freshness binding before inserting an admission.
- Enforce full admission/attempt/task/outbox/qualification binding before inserting a commit receipt.

Adversarial tests:
- Direct SQL mutation of consumed approval identity aborts.
- A consumed approval without admission ID cannot be retroactively bound.
- Direct SQL admission against revoked route evidence aborts.
- Forged receipt attempt identity is rejected by the database.
- Frozen schema-0010 upgrade fixture now applies migrations 0011–0013.

## Exact-head CI
- Initial D1 run [44709234906](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709234906) FAILED 5/41. The first guard was too strict for historical task-key-only consumption, executor error precedence differed from the existing test contract, and the upgrade test still expected a forged receipt to insert. All three were corrected and the failed run retained in the audit trail.
- Final D1 run [44709527918](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709527918), job `136197384963`: COMPLETED / SUCCESS; Node.js 24.9.0; `npm ci`; Worker syntax check; 4 test files / 42 tests passed.
- Contract run [44709527912](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44709527912), job `136197385216`: COMPLETED / SUCCESS; `POOL_DISPATCH_ENABLED=false`; all six workflow YAML files parsed; `POOL_CONTRACT_VALIDATION=PASS`.
- CI checkout merge commit for final validation: `62d08db5317c5b89bccf177c7b9e7bfacb23c62d`, merging exact implementation HEAD `deb14d34...` into frozen default `b81d2b5...`.

## Evidence and limitations
- Migration blob: `ba68819f4526e316e8d8972daddfaadb027a3ab5`.
- Atomic tests blob: `3d9b54b2a695261e3c6857710af837575f522af8`.
- Upgrade tests blob: `ee6aed4ad1c90982ee9290d9933c4e32fdf29ef6`.
- README blob: `44032e3d6f7231dc49f0988f42c6b412d81b4561`.
- No hosted D1, secret values, provider calls, dispatch, executor launch, deployment, merge or production mutation.
- Independent review NOT VERIFIED. Detailed current ruleset read-back was not obtained in this pass; no governance change was made.
- Hosted D1 locking/replication, trusted qualification issuer authenticity, lease fencing, trusted GitHub event provenance, executor sandbox and production runtime remain NOT VERIFIED.

## Next
Continue with lease/fencing SQL and trigger audit, while obtaining independent review of PR #159. Keep PR #159/#160 unmerged and dispatch disabled.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
