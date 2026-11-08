# 2026-11-08 — Task Identity Conflict and Retry Cap Hardening

Status: PARTIAL IMPLEMENTATION; CI FAILED ON INTERMEDIATE HEAD; LATEST HEAD NOT YET VERIFIED

## Target and ancestry

- PR #40: https://github.com/VlDMlNSh/developer-cloud-pool/pull/40
- Implementation branch: `proof/task-identity-fencing-design-2026-11-08`
- PR base: PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833` (stacked; not default).
- Intermediate validation head: `4d490e4c345f5e313ef5a956ba5b0d73f1afeef7`.
- Latest implementation head at report time: `430bc60a2df27fed7b569d4744d94b4616c91b68`.
- PR remains OPEN / DRAFT / UNMERGED.

## Findings addressed

1. Trigger previously used `ON CONFLICT(task_key) DO NOTHING` then conditional attachment, allowing a conflicting existing task binding to leave an approval consumed but unattached. Migration now uses `RAISE(ABORT, 'TASK_KEY_BINDING_CONFLICT')` before attachment. Adapter pre-check denies a known conflict before ledger mutation. This is intended to roll back the approval transition atomically.
2. Added fixed `MAX_ATTEMPTS = 5`. Exhausted pending/expired tasks should transition to `dead`; a database trigger marks their pending task outbox row `dead`.
3. Added adversarial tests for binding-conflict rollback and bounded attempts/dead-letter.

## CI evidence

- Prior baseline exact-head run `42489375654` on `84e9b98a249924846ab29debdb7d32608d87e77c`: SUCCESS.
- Hardening run `42489686559` on `4d490e4c345f5e313ef5a956ba5b0d73f1afeef7`: FAILED.
- Job `Local Workers-runtime D1 adversarial tests`, job ID `128759131545`.
- 25 tests passed, 2 failed (27 total); syntax check passed.
- Failure 1: conflict test expected generic ambiguous reason, but adapter correctly returned `TASK_KEY_BINDING_CONFLICT` from the pre-check. Test expectation corrected in a subsequent commit.
- Failure 2: five-attempt test expected `ATTEMPT_LIMIT_REACHED`, but adapter returned `TASK_NOT_LEASEABLE`. A safe diagnostic branch was added to distinguish an exhausted-but-not-transitioned row. Root cause is not yet established.
- Latest head `430bc60a2df27fed7b569d4744d94b4616c91b68` had no workflow run returned at the time of report. Latest code is therefore NOT VERIFIED.
- The successful earlier run does not validate this hardening delta.

## Readback blobs

- Migration: `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- Lease adapter latest before report: `f44f9f9ffb3d16a4ace869ea25892648bed332e1`.
- Tests after conflict expectation correction: `723411c806fdc9afa97b1d81f3097e28fa52ed58`.
- README: `a364fb31ff340970d15658f3cf4ee5502696d4ef`.

## Remaining work

- Re-run exact-head CI on latest head.
- Diagnose and fix the attempt-count/expiry transition; verify five leases, expiry reclaim, sixth acquisition dead-letter, and outbox status.
- Verify trigger abort rolls back approval state (the test passed its setup but failed earlier at reason assertion in the failed run, so rollback assertions did not execute on that run).
- Add durable audit and restart/recovery tests.
- Obtain independent security/contract review; PR #40 currently has no review submissions or inline threads.
- No remote D1 deployment, production Worker/Supervisor integration, secrets, dispatch, provider execution or Gemini controller used.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
