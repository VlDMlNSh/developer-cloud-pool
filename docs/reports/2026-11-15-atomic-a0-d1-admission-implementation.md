# Atomic A0 -> D1 admission implementation — 2026-11-15

**Status:** IMPLEMENTED / EXACT-HEAD CI VERIFIED (isolated local proof); route qualification and production admission remain NOT QUALIFIED.  
**Dispatch:** DISABLED.  
**Contour:** A only.

## Immutable target and Git state

- Default branch `Основной` before this report: `3010d6c95f755bb145ee10c201d810dca21916c2`.
- Implementation branch: `proof/atomic-a0-d1-admission-2026-11-15`.
- Exact implementation HEAD: `16aa4cc2d3265bd4d7a10e4581a57cfe0baf5875`.
- Stacked Draft PR #72: https://github.com/VlDMlNSh/developer-cloud-pool/pull/72
- PR #72 base: `impl/receipt-bound-projection-2026-11-11` at `a53f6232bd5b50d3e150addf528b8e722002f9dd` (PR #67 head). PR #72 is OPEN / DRAFT / unmerged.
- PR #67 remains OPEN / DRAFT / unmerged. Do not transplant or merge its entire branch without ancestry reconciliation.
- Default → implementation head compares DIVERGED, 53 ahead / 20 behind, merge base `221f216c00ca7e5596bcc682ba185ad155a10603`. The stacked dependency must be reconciled before default integration.

## Implementation

Migration `0011_atomic_qualified_admission.sql` is additive to existing migrations 0001–0010. It adds:
- typed, append-only route qualification records bound to provider, model, issuer, account reference, credential-handle reference, quota domain, capability profile, evidence reference/digest, observation/validity timestamps, registry version and revocation state;
- immutable admission records and CHECK-backed commit receipts;
- a one-admission-per-logical-task constraint;
- admission/attempt/evidence bindings on the existing task delivery outbox, with a one-way binding trigger.

`admitQualifiedTask()` performs one D1 `batch()`:
1. conditionally consume the exact unexpired owner approval while checking exact route evidence binding, 300-second freshness and revocation;
2. rely on the existing migration 0003 transition trigger for logical task, task-approval and task-outbox creation;
3. insert the immutable admission record;
4. rely on the existing migration 0004 attempt trigger for the immutable attempt and task pointer;
5. bind the existing task outbox to admission ID, attempt ID and evidence digest;
6. insert a constraint-backed commit receipt. A failed assertion aborts the batch.
7. perform durable read-back after commit.

Canonical task identity is recomputed from repository, issue, target SHA and profile. Replay returns only a matching durable receipt. All results carry `dispatch:false`; there is no Worker/Supervisor wiring or provider dispatch.

## Exact-head verification

- Workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43689591339
- Run ID: `43689591339`; job ID: `132737204218`.
- Exact head: `16aa4cc2d3265bd4d7a10e4581a57cfe0baf5875`.
- Workflow/job: COMPLETED / SUCCESS.
- Workers-runtime: 7 files / 91 tests passed, including 7 atomic-admission tests for success, replay, binding substitution, stale evidence, revocation, rollback and concurrency.
- Isolated upgrade-binding smoke: 1 passed.
- Frozen schema-0010 fixture smoke: 2 passed. Historical schema-0010 fixture remains unchanged.
- Artifact `d1-ledger-proof-package-lock`: ID `14152175385`; SHA-256 `8f7b384af448bd58210cddb60843d3a01e83b402bef141e091a53a8cdfd8d236`.
- Combined commit status returned an empty statuses array. Workflow success is verified, but required status contexts are NOT VERIFIED.

## Governance and security limits

- Active repository ruleset `26550182` named `Основной — verified` applies only to `refs/heads/Основной`. It requires PRs and review-thread resolution, but currently sets required approving review count to zero and has no required status-check contexts. Branch-protection endpoint returned 403, so branch protection details beyond the readable ruleset are NOT VERIFIED.
- PR #72 targets the PR #67 implementation branch, not default. It remains Draft and unmerged. Its branch is not covered by the default-only ruleset.
- Route evidence rows are treated as pre-qualified input from a trusted qualification authority. This adapter validates stored immutable identity, digest binding, freshness and revocation; it does not cryptographically authenticate issuer provenance, independently verify provider evidence, or prove live account/quota availability.
- No trusted qualification-authority writer is implemented in this pass. No external login, provider call, secret read, hosted D1, Worker deployment, dispatch, executor qualification, independent security review or merge occurred.
- This is an isolated local D1 proof, not a production-qualified route or an accepted Cloud Development Pool.

## Next

Reconcile PR #67 / PR #72 ancestry with current default without importing stale stack history; verify effective required checks and exact PR-head CI; then obtain independent technical/security/governance review after the pool is operational. Keep dispatch disabled. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
