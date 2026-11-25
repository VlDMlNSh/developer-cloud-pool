# Cloud Development Pool — isolated D1 proof

This directory contains a local-only Cloudflare Workers/D1 proof. It is not mounted in the product Worker, the Hono web console, production Supervisor/Worker workflows, or any deployed service.

## Current migration baseline

The clean-base candidate starts from the owner-approved CODE capability root and preserves the selected canonical source lineage:

- 0001: CODE approval ledger with exact `jarvis-code-sandbox-v1` profile constraint.
- 0002–0005: historical per-approval tables, logical task identity, immutable attempts and non-authorizing reconciliation.
- 0006–0010: independent terminal-attempt projection outbox, bounded delivery retries, identity immutability and at-most-once comment-post state.
- 0011: immutable executor identity on approvals and logical tasks; replaces the task-keyed trigger to require executor match and disables the legacy approval-keyed claim/outbox trigger.
- 0012: additive qualified admission, route qualification, admission receipt and task-ready outbox binding.
- 0013: immutable approval authorization, current route qualification and receipt/outbox binding guards.
- 0014: database-enforced lease acquisition, renewal, fencing, terminal release and indeterminate quarantine.
- 0015: append-only issuer-verified reconciliation decision evidence bound to the current quarantined attempt and lease generation.
- 0016: disables INSERT/UPDATE/DELETE on retired per-approval claim and outbox tables; canonical task delivery remains in `pool_task_delivery_outbox`.

Migration 0011 deliberately does not backfill historical rows because their executor identity cannot be inferred. Existing rows without an executor ID cannot be consumed through the canonical task-keyed trigger. Pass 27 adds a forward-only atomic qualified-admission migration (0012) and adapts the local admission adapter to canonical task identity v2. The adapter binds executor identity across approval, logical task, admission, outbox linkage and commit receipt. Pass 34 adds SQL lease/fencing guards; Pass 35 adds a local authenticated-principal lease adapter seam with primary-first readback. Migration 0016 seals both retired per-approval tables against direct SQL writes while preserving historical rows.

## Runtime and test boundary

- Exact-pinned development dependencies: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`.
- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd D1 runtime.
- Uses only synthetic test rows.
- No account API, hosted D1, secrets, provider calls, GitHub writes, workflow dispatch, or external execution.
- The Worker entrypoint is deliberately inert and returns 404.
- Every observed queue and adapter in this proof is non-dispatching. This package does not grant execution authority.

## Run

With Node.js 24:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

The ordinary D1 suite applies migrations 0001–0016 to a fresh local D1 database. The separate `UPGRADE_DB` test binding exercises a staged upgrade: it applies only 0001–0010, seeds historical synthetic approval/task/attempt/outbox rows at that boundary, and then applies only 0011–0016. It checks preservation of historical IDs and relationships, the intentionally-null legacy executor identity, fail-closed handling of unidentifiable legacy approvals, executor-bound atomic admission, receipt/outbox linkage, exact replay, cross-executor task-key conflict, migration reapplication and missing-receipt denial.

This is an isolated synthetic upgrade fixture, not a dump of any hosted or production database. The upgrade path does not run all migrations on an empty database and call that an upgrade.

## Atomic admission v2

- Migration 0012 is adapted from the historical atomic-admission proof, not copied unchanged. It uses the CODE profile and adds executor identity to admission and receipt rows.
- The adapter derives the task key through `canonicalTaskKey` (v2), checks executor identity on input, replay, approval consumption and final readback, and never dispatches.
- The tests use synthetic local rows and include executor-substitution denial cases.

## Status

This is a candidate proof foundation on a clean branch from a frozen default SHA. It is not a hosted deployment, executor qualification, or Contour A acceptance.


## Pass 32 — ambiguous D1 batch acknowledgement and durable readback

- Admission pre-read and post-write verification use D1 `withSession("first-primary")` so the first read is routed to the primary and later reads in the same session remain sequentially consistent.
- A rejected/ambiguous `batch()` is not reported as a rollback. The adapter performs a new primary-first readback and returns `ADMISSION_ALREADY_COMMITTED` only when the immutable admission, approval, executor, attempt, route evidence, receipt, task-ready outbox and current task-attempt tuple all match.
- If no complete durable record can be observed, the result is `ADMISSION_OUTCOME_UNCONFIRMED`; callers must retain the same admission identity for retry/reconciliation and must not mint a new one.
- Fault injection covers: commit then lost acknowledgement; failure before commit followed by exact same-key retry; and unavailable primary readback after commit. Dispatch remains disabled.
- D1 batch atomicity and D1 Sessions API semantics are based on Cloudflare's documented binding behavior. No external orchestration dependency is added.


## Pass 33 — SQL-level authorization and receipt binding

- Added forward-only migration 0013 to freeze approval authorization identity, make consumed/revoked states monotonic, and require consumed_at/task_key/admission_id to bind in one ready-to-consumed update.
- Added database-level admission checks for the consumed approval, task/executor identity, active route qualification, evidence digest and qualification freshness.
- Added a receipt INSERT guard that binds every receipt identity to the admission, prepared attempt, current task pointer, pending task-ready outbox and active qualification. Adapter checks remain defense in depth, not the only enforcement layer.
- Adversarial tests cover direct SQL mutation of consumed approval identity, direct admission against revoked route evidence, and forged receipt attempt identity.
- Migration upgrade tests now exercise 0013 as part of the forward-only 0011–0013 upgrade sequence.
- This remains local synthetic D1 proof. Lease fencing, trusted event provenance, hosted D1, executor qualification and independent review are separate gates.


## Pass 34 — database-enforced lease and fencing

Migration `0014_d1_lease_fencing_guards.sql` closes SQL-level bypasses in the immutable-attempt lease lifecycle:

- A lease acquisition is a single pending → leased transition for the current prepared attempt, with exactly one positive monotonic generation increment and a bounded expiry.
- A live lease can only be renewed by preserving owner, attempt and generation while extending expiry; an expired lease cannot be renewed.
- A running attempt cannot be created by direct SQL without a matching current, unexpired task lease.
- Task lease release is permitted only as the transactional projection of a fenced terminal attempt transition.
- Indeterminate is a quarantine state for an expired running attempt; it is not automatically reclaimed.
- Attempt start/indeterminate/terminal metadata and audit-event identities are bound to the corresponding SQL transitions; terminal metadata and audit events cannot be rewritten.
- Task attempt pointers are monotonic and can advance only to the next prepared attempt after the prior attempt is failed or abandoned.

The new `test/lease-fencing.test.ts` exercises direct-SQL bypass attempts, valid acquisition/renewal/finalization, expired lease handling, indeterminate quarantine, forged event insertion and pointer regression. The frozen schema-0010 upgrade suite now applies migrations 0011–0014.

This is still a local synthetic Workers/D1 proof. The lease API is not yet wired into the admission adapter or an executor. No hosted D1, dispatch, worker launch or production write is performed.


## Pass 35 — authenticated lease adapter seam

- Added `src/acquire-attempt-lease.mjs`. It requires an injected trusted `authenticateExecutor` function, binds the authenticated principal's executor identity and capability profile to the current task/attempt, and uses a conditional lease update.
- The adapter reads the precondition and verifies the post-write tuple through D1 `withSession("first-primary")`. If the write acknowledgement is ambiguous, it performs a fresh primary-first readback and reports success only for the exact owner/attempt/generation/expiry/running-attempt/audit-event tuple.
- Every result remains `dispatch: false` and `executionAuthorized: false`. No dispatch, worker launch, lease renewal, or automatic takeover is implemented.
- Added synthetic Workers/D1 tests for successful lease acquisition, mismatched authenticated executor, missing authenticator, and task/executor mismatch.
- The injected authenticator is a trust-boundary dependency, not authentication implemented by this module. The test authenticator is synthetic and does not establish a production identity provider or trusted GitHub Actions context.
- Explicit indeterminate-attempt reconciliation remains unimplemented; quarantined attempts remain blocked pending separately authorized reconciliation.


## Pass 36 — issuer-bound indeterminate reconciliation evidence

- Migration 0015 adds `pool_attempt_reconciliation_decisions`, an append-only evidence ledger unique by attempt/generation and issuer/JTI. SQL guards bind each decision to the existing pending reconciliation queue row, the exact indeterminate attempt, the current task pointer, expired lease owner and fencing generation.
- `src/record-attempt-reconciliation.mjs` requires an injected evidence verifier. The verifier must cryptographically validate the evidence signature and enforce issuer and audience pinned in trusted runtime configuration, token lifetime and claim integrity. The request cannot choose its own trust policy. The adapter also requires an injected trusted clock; caller-supplied timestamps are not used to validate token expiry or stamp verification time. The adapter independently checks exact task/attempt/generation, evidence digest, JTI, observation time and decision semantics.
- Supported observations are `safe_to_retry` (executor stopped and external effects absent), `result_confirmed` (result and provenance digests supplied), and `effects_unknown` (explicit uncertainty). Unsafe or mismatched claims fail closed.
- Successful recording does not modify the task, attempt, lease, queue or outbox. It does not release the lease, create another attempt, authorize retry, or dispatch. Every result retains `dispatch: false`, `executionAuthorized: false`, `stateChanged: false`, and `retryAuthorized: false`.
- The verifier is only an injected trust boundary in this local proof. No production issuer/key registry, OIDC verifier integration, owner approval for retry, or execution transition is implemented. Synthetic tests do not qualify cryptographic trust or hosted D1 behavior.


## Pass 52 — trusted clock for atomic admission

- `admitQualifiedTask(db, input, trustedClock)` requires an injected trusted clock. Caller-supplied `input.now` is not validated or used.
- The adapter samples trusted time after the primary pre-read, then uses that same sample for approval consumption, route freshness, admission timestamps, exact replay validation and the first atomic write.
- Ambiguous-write recovery takes a fresh trusted sample before revalidating time-sensitive route evidence.
- Missing, throwing or invalid clocks fail closed.
- Every deny and success response explicitly includes `dispatch: false` and `executionAuthorized: false`.
- Adversarial tests cover caller future/past timestamps, invalid/throwing/missing clock, time preceding route evidence, and the existing replay/concurrency/recovery paths.
- This is a local adapter contract. It does not prove the real controller/runtime clock source or authorize execution; runtime clock provenance remains a separate gate.


## Pass 57 — retired legacy claim path sealed

- Forward-only migration 0016 adds database-level INSERT, UPDATE and DELETE denial triggers to historical `pool_task_claims` and `pool_task_outbox` tables.
- Existing rows and migration history are preserved; no table drop, rename, backfill or migration rewrite.
- Canonical task admission and delivery continue exclusively through `pool_tasks` and `pool_task_delivery_outbox`.
- Baseline tests assert the six guards exist and reject direct INSERT. Atomic-admission and lease test fixtures temporarily drop and restore the six guards only during synthetic teardown.
- This closes the documented direct-SQL legacy-write gap in the local proof. It does not establish hosted D1 permissions, live worker isolation, or execution authorization.


## Pass 59 — GitHub owner /next event context and durable source-comment receipt

- Added a fail-closed binder for the exact owner-created top-level `issue_comment` event on Issue #96. It binds repository/owner numeric IDs, exact `/next` body, owner association, default branch ref, target/workflow SHA, workflow ref, run ID and run attempt.
- The only accepted capability profile is `jarvis-code-sandbox-v1`. The binder rejects whitespace, suffixes, LF/CRLF, wrong issue/repository/owner/ref/workflow, malformed SHA, and invalid event/run identifiers.
- Added forward-only migration 0017 in the existing `proofs/d1-ledger` only. It creates an append-only source-comment receipt with repository-scoped uniqueness, fixed owner/repository/issue/event/profile constraints, workflow provenance fields, event digest and admission linkage. SQL requires a matching consumed approval, task, prepared attempt, current route, pending task-ready outbox and immutable admission commit receipt; update/delete are denied.
- Added `admitGitHubNextEvent` composition: bind the event, require the admission envelope digest to equal the canonical event digest, run the existing non-authorizing admission adapter, then record and primary-first read back the source-comment receipt. Ambiguous receipt writes are reconciled by primary readback; mismatches remain DENY/UNCONFIRMED. This two-stage local proof never dispatches.
- Reuse: existing Cloudflare Workers Vitest + local D1 harness and canonical `pool_task_delivery_outbox`; no external dependency, alternate ledger or legacy outbox.
- Limitations: no live `issue_comment` workflow/controller exists on default; workflow ref is a frozen expected identity for the future controller. This local binder does not cryptographically authenticate GitHub's event payload, independently query GitHub for default HEAD, prove hosted D1 behavior, or authorize dispatch. Receipt persistence occurs after the existing admission transaction; the wrapper returns no success unless receipt readback confirms. Recovery uses the same immutable admission and source-comment key.
- Dispatch and execution authorization remain false.


## Pass 60 — local D1 integration for GitHub /next receipt

- Added `test/github-next-event.integration.test.ts` with seven local Workers/D1 scenarios for successful receipt persistence and exact replay, conflicting admission, changed run provenance, pre-commit failure recovery, lost insert acknowledgement, partial readback, unavailable primary readback and incomplete canonical outbox tuple.
- Tests seed only synthetic CODE approval and local route rows, then call the actual `admitGitHubNextEvent` composition. Fault wrappers inject failures at the D1 statement/session boundary; they do not contact hosted D1.
- All returned paths assert `dispatch: false` and `executionAuthorized: false`.
- Exact synthetic merge CI: D1 107/107 (8 files), Pool Contract PASS; see Pass 60 report/checkpoint.
- This improves local proof coverage only. It does not establish GitHub event authenticity, hosted D1 behavior, live controller operation, executor qualification or Contour A acceptance.

## Pass 79 — triggering actor binding requirement

The GitHub issue-comment binder requires both the comment author's identity and the triggering workflow actor identity. The future controller must source `actorId` and `actorLogin` from GitHub's trusted `github.actor_id` and `github.actor` contexts, not from event JSON supplied by a caller or repository variables. The binder compares those values with the owner identity and the comment author's `user.id` / `user.login`; any mismatch fails closed. The D1 receipt records the validated actor identity.

This is a source-level adapter requirement only. No real controller currently maps these fields, and synthetic tests do not prove that mapping. Workflow-level provenance remains NOT VERIFIED. Dispatch and execution authorization remain false.


## Pass 81 — GitHub Actions context normalization

- `src/github-actions-context.mjs` maps the runner-provided `github` context and `GITHUB_ACTIONS` / `GITHUB_SERVER_URL` environment values into the strict flat input expected by `bindGitHubNextEvent`.
- Identity, event metadata, issue/comment fields, ref, event target SHA, workflow ref/SHA and run ID/attempt are copied from explicit Actions context properties. Missing trusted values are left missing (run ID/attempt become `NaN`) so the binder rejects them; there are no caller-input or repository-variable fallbacks.
- The issue comment body is read only from `github.event.comment.body`, not the issue body. Pull-request conversation comments are marked from the trusted event issue's `pull_request` property.
- Unit tests verify field mapping, distinct event/workflow SHAs, missing-context fail-closed behavior and comment-vs-issue body separation.
- This adapter is a pure normalization function. It does not authenticate GitHub's runtime, prove a workflow callsite, write D1, or authorize execution. No workflow invokes it yet; live context-to-binder wiring remains NOT VERIFIED.
- Every binder result remains `dispatch: false` and `executionAuthorized: false`.
