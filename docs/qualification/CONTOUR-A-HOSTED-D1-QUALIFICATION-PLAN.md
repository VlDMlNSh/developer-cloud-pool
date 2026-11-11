# Contour A — hosted D1 claim qualification plan

- Status: PLANNED / NOT AUTHORIZED / NOT RUN.
- Scope: isolated qualification of the conditional single-use claim and task-level outbox against a real Cloudflare D1 service.
- Governing decision: [Durable single-use Supervisor claim protocol](../decisions/2026-11-11-durable-supervisor-claim-protocol.md).
- Evidence report: [Hosted D1 qualification boundary audit](../reports/2026-11-11-hosted-d1-qualification-boundary-audit.md).
- Blocking issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38

## Safety and authorization boundary

This plan does not authorize provisioning, deployment, schema changes, credential creation, secret access, Worker execution, provider calls or dispatch. It is a test design only.

Do not proceed until:
1. Account-specific Workers Free eligibility and quota are verified from authoritative account metadata.
2. No card, upgrade, paid fallback or billing change is required.
3. The exact source stack is reconciled to the current default branch and pinned to an immutable SHA.
4. The selected migration and test adapter have passed exact-head CI.
5. The owner explicitly authorizes creation of one named qualification D1 database and one test-only Worker.
6. The test Worker has no GitHub write permission, no dispatch capability, no provider credentials and no production binding.

If any condition is unresolved, remain NOT RUN.

## Test architecture

Use 50 independent concurrent HTTP requests through a test-only Worker backed by one isolated D1 binding. A sequential `wrangler d1 execute` batch may be used for migration and controlled inspection, but it is not a concurrent contention test.

The Worker must accept only a narrowly scoped, server-verified test capability and a fixed test envelope. It must use service time, enforce immutable request identity, write the claim and task-level outbox transactionally, and return `dispatch:false` unconditionally. The capability must never be placed in source control, browser code, test output or artifacts.

## Procedure

1. **Freeze source.** Reconcile the PR #39/#54 proof stack onto current default; record source commit SHA, migration checksums, test adapter SHA, dependency lockfile and exact-head CI run/job IDs.
2. **Verify account.** Record account-specific Free entitlement, remaining D1/Workers quotas, account ownership and required permissions using metadata-only evidence. No secret or billing-profile values.
3. **Provision isolated resources.** Only after explicit authorization, create a dedicated qualification database and test-only Worker. Record resource creation audit evidence. No production route or production binding.
4. **Apply reviewed migrations.** Apply the exact migrations from the frozen source. Verify schema/version and migration checksums.
5. **Run concurrent contention.** Launch 50 independent HTTP requests concurrently against the same canonical logical task/envelope digest with distinct approval/request IDs. Do not replace concurrency with sequential SQL statements.
6. **Verify one-winner invariants.** Exactly one canonical task and one task-level outbox; duplicate/replayed requests are idempotent; mismatched owner/repository/issue/target SHA/profile/digest are denied; no dispatch or external side effect occurs.
7. **Fault-inject.** Test rollback before commit, lost response after commit, exact retry, Worker restart, stale generation/owner, expiry, unavailable database and indeterminate reconciliation. Never auto-requeue on timeout or absence from a bounded workflow listing.
8. **Measure quotas.** Capture `meta.rows_read`, `meta.rows_written`, aggregate usage, storage and verified quota headroom. Public plan limits alone are insufficient.
9. **Capture audit and artifacts.** Preserve redacted request/response classifications, immutable SHA, migration hashes, run/job IDs, test output digest and resource audit records. Do not retain credentials.
10. **Teardown.** After evidence review and explicit authorization, delete only the named test resources and verify the account inventory returns to baseline.

## Pass/fail criteria

PASS only if all are demonstrated against the actual hosted database:
- 50 genuinely concurrent independent HTTP requests;
- exactly one logical task and exactly one task-level outbox;
- no conflicting or duplicate claim;
- idempotent replay of the exact request;
- mismatched immutable envelope fields rejected;
- transaction rollback and lost-response recovery verified;
- Worker restart preserves durable state;
- all ambiguous outcomes remain indeterminate until authoritative reconciliation;
- `dispatch:false` for every response and zero external/provider effects;
- usage remains within the verified free quota;
- resource creation and cleanup are auditable.

Any missing evidence is NOT VERIFIED, not PASS. A serial SQL batch, local Miniflare, synthetic fetch, or a green static test cannot satisfy hosted contention.

## Explicit exclusions

This qualification does not accept the issuer, owner-authority, trusted-clock, revocation, key custody, production session, Supervisor/Worker authorization, model routing, provider quota, secret isolation, mobile/desktop web UI, or end-to-end Recovery Actor. These remain separate Contour A gates. No claim of exactly-once external side effects is permitted.

## Current status

PLANNED / NOT AUTHORIZED / NOT RUN. Account inventory currently shows no D1 database or Worker script; account-specific Free entitlement remains NOT VERIFIED. The default Supervisor still contains the privileged dispatch path. Keep all dispatch gates fail-closed.
