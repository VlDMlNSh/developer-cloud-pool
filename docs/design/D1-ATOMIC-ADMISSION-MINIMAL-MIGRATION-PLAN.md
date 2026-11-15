# D1 Atomic Admission — Minimal Migration and Batch Implementation Plan

**Status:** DESIGN / NOT IMPLEMENTED / NOT QUALIFIED  
**Date:** 2026-11-15  
**Applies to:** isolated `proofs/d1-ledger` only  
**Dispatch:** permanently false in this proof

## 1. Evidence reviewed

The existing PR #67 D1 proof already contains a native rollback test for `env.POOL_DB.batch([...])`: `proofs/d1-ledger/test/consume.test.ts`, blob `ef502247683239d50d3c781240cc5b2595aa0696`. It asserts that an earlier statement is rolled back when a later statement in the batch fails.

Existing primitives reviewed at PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`:

- Approval ledger + single-use state: migration 0001, blob `a80524ed839b63dd6483978118619495fa550877`.
- Trigger-backed logical task + task approval + task outbox: migration 0003, blob `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- Immutable attempts and attempt-created event trigger: migration 0004, blob `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Current logical task adapter: `src/claim-outbox.mjs`, blob `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- Current attempt adapter: `src/task-attempts.mjs`, blob `6cb028e048569700ed623d93462ef55e2392a084`.
- A0 callback-based evaluator: `src/a0-admission-contract.mjs`, blob `14c31d66995d6f99ceb6ea5df060ba8e00848464`.

This proof is on an open, unmerged PR branch, not the default branch. It must not be represented as production schema or deployed D1.

## 2. Concrete gap

`claimLogicalTask()` updates the approval row; migration 0003 creates/attaches the logical task and task-level outbox transactionally via trigger. It then performs a separate read-back.

`createTaskAttempt()` is a separate API call that inserts the immutable attempt and relies on migration 0004 triggers to update `pool_tasks.current_attempt_id` and insert `attempt.created`.

Therefore the current public proof APIs do not atomically compose:
1. qualified route evidence binding;
2. single-use approval consumption;
3. logical task + task approval + durable task outbox;
4. immutable attempt + attempt event.

A crash between task claim and attempt creation can leave a consumed approval, task and queue intent without a current attempt. This is a local-proof composition gap, not evidence of a production incident.

## 3. Minimal schema delta (migration 0011 proposal)

Do not replace the existing approval/task/attempt tables or duplicate the task/outbox model.

Add `pool_route_qualifications` with:
- `qualification_id` primary key;
- `route_id`, `provider_id`, `model_id`, `issuer_id`;
- opaque `account_ref` and `credential_handle_ref` (never secret values);
- `quota_domain_id`, `cost_class`, `capability_profile`;
- `evidence_ref`, `evidence_digest`;
- `observed_at`, `valid_until`, `revocation_version`;
- `registry_version`, `status` constrained to qualified/suspended/revoked;
- canonical constraints and unique identity for a qualification revision.

Extend `pool_approval_ledger` with `qualification_id`, `route_evidence_digest`, `admission_id`, `model_id`, and `idempotency_key`. Keep the owner/repository/issue/target SHA/profile/envelope digest immutable after issuance; the new fields must be validated against the signed/verified admission envelope before the batch is called.

Add append-only `pool_admissions` with:
- `admission_id` primary key;
- unique `approval_id`;
- `task_key`, `attempt_id`, `attempt_number`;
- `qualification_id`, `route_evidence_digest`, `registry_version`, `revocation_version`;
- `owner_numeric_id`, `repository_id`, `issue_number`, `target_sha`, `profile`, `model_id`;
- `envelope_digest`, `idempotency_key`, `created_at`.

Add uniqueness constraints for approval, attempt, and idempotency key. Add immutable-identity update/delete guards. Do not store raw credentials or provider response bodies.

## 4. Atomic batch API proposal

Create a new `admitQualifiedTask(db, envelope, verifiedEvidence, now)` adapter. It is a local proof API only.

Preflight (outside D1; no writes):
- validate syntax and exact supported profile/model;
- authenticate issuer/evidence provenance using a separately supplied qualified verifier;
- verify digest, observedAt/validUntil and revocation signature;
- resolve exact qualification ID against a trusted registry snapshot;
- construct canonical admission digest.

The D1 batch must contain ordered statements:
1. Conditional insert/upsert of the exact qualification snapshot only under explicit registry governance (prefer pre-seeded immutable qualification rows; do not let a task caller register its own route).
2. Conditional `UPDATE pool_approval_ledger` from ready to consumed, matching owner/repository/issue/target SHA/profile/envelope digest, expiry, qualification ID, evidence digest, model, registry/revocation version and idempotency key. The existing 0003 trigger creates/attaches the logical task, task approval and one task-level outbox row in this same transaction.
3. Insert the immutable `pool_admissions` row, selected only from the now-consumed approval and the matching qualification row.
4. Insert the immutable `pool_attempts` row with attempt ID/number, input digest and execution idempotency key. Existing 0004 trigger validates pending task/current attempt conditions, advances `current_attempt_id` and appends `attempt.created`.
5. Final SQL assertion/read-back statement must verify exact approval, admission, task, task approval, outbox, attempt and current-attempt pointer bindings. A failed assertion must abort the batch (e.g. a guarded insert into a transaction-assertion table with a CHECK constraint), not merely return a row that application code can ignore.

Only after batch resolves successfully may the adapter perform separate durable read-back and return `ADMITTED_QUEUED`, `dispatch:false`. If the batch throws or its outcome is ambiguous, return DENY/NEEDS_RECONCILIATION with no dispatch authorization; deterministic idempotency keys and read-back resolve the durable result. Never blindly consume a second approval or create a second attempt.

Do not put provider/GitHub network calls inside the D1 batch. The qualification row is pre-existing and immutable; the batch checks that it remains qualified at the expected registry/revocation version. If the D1 deployment cannot provide a consistent revocation check, deny admission.

## 5. Required tests before considering the proof complete

- Batch creates exactly one admission, one task, one task outbox, one attempt and one attempt-created event.
- 12+ concurrent callers for one approval: exactly one admission winner; all retries resolve to the same IDs or deny.
- Different target SHA, profile, model, provider, issuer, account, quota domain or evidence digest: no consumption.
- Unknown/stale/revoked qualification: no consumption.
- Task-key conflict in trigger: approval, admission, attempt and outbox all roll back.
- Attempt trigger failure: approval consumption and task/outbox creation all roll back.
- Assertion/read-back mismatch: transaction rolls back or returns no admission; never dispatch.
- Duplicate approval/admission/attempt/idempotency IDs: fail closed.
- Batch response lost after commit: durable read-back finds the one exact admission; retry does not create a second attempt.
- Revocation version changes between preflight and batch: deny.
- Expiry at exact boundary: deny.
- No secret values in SQL rows, audit events, errors or test snapshots.

## 6. Implementation sequencing

1. Reconcile PR #67's branch ancestry and required checks before selecting an implementation base. It is open/unmerged and carries a larger D1 proof stack; do not copy its entire branch into default.
2. Create a narrowly scoped implementation branch from a deliberately chosen immutable base after confirming the repository's stacked-PR policy.
3. Add migration 0011 and adapter/test changes to the isolated proof package only.
4. Run syntax checks, all D1 Workers-runtime tests, upgrade binding and frozen migration fixture tests on exact head.
5. Keep PR Draft and dispatch false. No hosted D1, provider calls, credentials, deployment or merge until separately authorized and qualified.

## 7. Status

This document is a design plan, not a migration or executable admission implementation. Existing D1 batch rollback tests provide a reusable mechanism, but they do not prove the proposed composite admission API. Contour A remains BLOCKED / NOT ACCEPTED.

Primary contract: https://github.com/VlDMlNSh/developer-cloud-pool/blob/main/docs/contracts/QUALIFIED-ROUTE-EVIDENCE-AND-ATOMIC-A0-D1-ADMISSION.md
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
