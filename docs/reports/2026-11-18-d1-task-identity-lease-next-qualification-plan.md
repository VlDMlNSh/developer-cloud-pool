# 2026-11-18 — D1 task identity and lease qualification plan

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Source branch: `proof/task-identity-fencing-design-2026-11-08`
- Immutable source HEAD: `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`
- Source files read back:
  - `proofs/d1-ledger/src/task-lease.mjs` blob `b41edf89cdf960b2c007f38ba16554dc179f021a`
  - `proofs/d1-ledger/src/claim-outbox.mjs` blob `37d75e2b31d9214b04398527eb08dce296f1ff27`
  - `proofs/d1-ledger/test/claim-outbox.test.ts` blob `723411c806fdc9afa97b1d81f3097e28fa52ed58`
  - `proofs/d1-ledger/migrations/0003_create_logical_task_identity.sql` blob `49b0798871429d7961e81eb1d86ad892dba0b9b9`
  - `proofs/d1-ledger/package.json` blob `cd7a705ce39860685c3ec60134dc8442fab738d8`
  - `proofs/d1-ledger/README.md` blob `a364fb31ff340970d15658f3cf4ee5502696d4ef`
- This is a source audit and qualification-plan pass. No source implementation was changed.

## Verified implementation facts

1. `acquireTaskLease` uses a conditional D1 UPDATE. It increments `lease_generation` and `attempt_count` only when the task is pending or the existing lease is expired; the maximum is five attempts.
2. Renewal and finalization require matching task key, worker ID, generation, and an unexpired lease.
3. All observed adapter decisions retain `dispatch: false`; README states the proof is local-only and not mounted into the Hono console or production Supervisor/Worker.
4. The test file contains reclaim/generation fencing, live-lease non-stealing, expiry renewal denial, five-attempt dead-letter, and a 12-way concurrent approval claim test. The 12-way test covers approval consumption, not concurrent `acquireTaskLease` contention.
5. `logicalTaskKey()` currently hashes the tuple `pool-task-v1, repositoryId, issueNumber, targetSha, profile, 1`. It does not include an explicit capability-envelope digest or canonical payload digest.
6. The migration permits multiple approvals to attach to one task and records each approval's `envelope_digest` separately. Consequently, two approvals with different envelope digests can share the same logical task key if the other tuple fields match. This may be intentional approval multiplicity, but the contract must distinguish per-approval authorization evidence from the task's canonical execution capability and payload.
7. `acquireTaskLease` reads the lease back by task key and worker ID, but not by a unique claim-attempt token. Same-worker concurrent requests and an interleaving reclaim/readback need explicit adversarial coverage.
8. The adapter fences lease renewal/finalization, but there is no lease-aware result-write or outbox-delivery adapter in this proof. Therefore fencing of external side effects is not established.

## Architectural decision required before implementation

Do not blindly add approval-specific `envelopeDigest` to the logical task key: that would make independently approved identical tasks distinct and could break intended deduplication. Instead define two separate immutable digests:

- **Task execution identity**: repository ID, issue/approval scope as contractually selected, immutable target SHA, execution profile, canonical payload digest, canonical capability-set digest.
- **Approval evidence identity**: approval ID, issuer/owner, approval envelope digest, authorization timestamp/expiry and provenance.

The schema must enforce that every approval attached to a task authorizes the exact task execution identity. If multiple approvals are allowed to share a task, their envelopes must resolve to the same canonical capability/payload contract or the task must remain denied pending an explicit policy.

A lease is a time-bounded coordination primitive, not exactly-once execution and not an authorization grant. External effects require idempotency keyed by immutable task identity plus effect identity, and must validate current fencing generation at the durable write boundary.

## Next broad pass — ordered execution plan

### Gate 0 — preserve the baseline
- Keep source target fixed at `2b7e30a...`.
- Do not modify PR #130 or admission-stack PRs.
- Do not enable dispatch, read secrets, call providers, write hosted D1, deploy, or merge.
- Work in a new proof branch; retain all results as local D1/workerd evidence.

### Gate 1 — contract and identity
- Write a canonical task-envelope schema and canonical JSON rules (field ordering, Unicode normalization, number representation, absent/null distinction, digest algorithm/version).
- Specify which fields are task identity and which are approval evidence.
- Specify how multiple approvals can attach without broadening capability.
- Add positive and negative identity vectors, including different target SHA, profile, capability set, payload, repository, issue scope and approval envelope.
- Require conflict rollback and fail-closed behavior.

### Gate 2 — lease contention and fencing
- Concurrently issue 2, 12 and 50 claims for one pending task; assert exactly one current generation/owner wins.
- Repeat with same worker ID, distinct worker IDs, and synchronized expiry boundaries.
- Test expiry at `expires_at - 1`, equality, and `expires_at + 1`.
- Test reclaim increments generation exactly once.
- Assert stale generation cannot renew, finalize, write a result, mark outbox delivered, or create a second effect.
- Test duplicate/replayed worker run IDs and lease-readback races.
- Test attempt cap, dead-letter/outbox atomicity, crash between claim and execution, crash after effect before acknowledgement, and retry recovery.
- Test storage rejection, timeout/ambiguous response, partial batch failure, clock rollback/forward assumptions, safe-integer boundaries and generation overflow.

### Gate 3 — exact-head runtime evidence
- Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, and `npm test` in the exact Workers Vitest/Miniflare/workerd runtime on the new branch.
- Upload test output, lockfile digest, source SHA and artifact SHA-256.
- Repeat concurrency tests enough times to expose interleavings; preserve deterministic seeds and test counts.
- Do not interpret empty status API responses as success. Exact-head workflow run and artifacts must be inspectable.

### Gate 4 — independent review and integration gate
- Independent reviewer checks schema, capability separation, canonicalization, transaction boundaries, fencing and recovery.
- Only after all tests and review pass, propose a separate integration plan. Production integration remains prohibited until governance and Contour A acceptance gates pass.

## Acceptance criteria for this proof

- Exactly one lease generation is current for each task at a time.
- Stale owner/generation cannot mutate any durable execution result or delivery state.
- Every result and external effect is idempotent and bound to immutable task/effect identity.
- Every approval authorizes the exact canonical task capability and payload; no approval attachment can widen authority.
- Ambiguous storage outcomes fail closed and are safely recoverable.
- Outbox intent and task state transitions are transactionally consistent.
- Exact-head Workers runtime tests and artifacts are independently inspectable.
- Dispatch remains false throughout qualification.

## Current test/evidence status

- Source readback: VERIFIED.
- Existing authored test cases: VERIFIED as source text.
- PR #40 workflow run `42489887940`: `COMPLETED / SUCCESS` in PR merge context. Event head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; base `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; checked-out merge commit `23e06138ddee46934c8cb137d04dd1585d390ea6`.
- Job `128759748692`: `npm ci`, `npm run check`, and Workers Vitest passed; 2 test files, 27/27 tests. Artifact `13620723665`, ZIP SHA-256 `a79f822dd3acf44b22237d1fe164b8d446a0b269e6b40046987f2a3fda64d66b`.
- Classification: merge-context CI VERIFIED; standalone exact-head CI NOT VERIFIED.
- Concurrent lease acquisition winner proof: NOT VERIFIED.
- Result/outbox fencing: NOT VERIFIED.
- Independent security review: NOT RUN.
- Production integration/dispatch: NOT RUN.

## Governance and status

- PR #40: OPEN / DRAFT / UNMERGED; 0 formal reviews and 0 review threads at latest readback. Successful merge-context CI is not PR acceptance.
- PR #130: OPEN / DRAFT / UNMERGED at prior verified readback; recheck before any future action.
- Gemini: NOT RUN; controller/governance gates not freshly established in this pass.
- No secrets read, hosted D1 writes, provider calls, production dispatch, deployment, merge or Contour B work.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Follow-up engineering investigation — same-worker lease readback race — 2026-11-18

### Immutable source and scope
- Inspected proof source at `proof/task-identity-fencing-design-2026-11-08` / `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; no source/runtime files changed.
- Read back `src/task-lease.mjs` blob `b41edf89cdf960b2c007f38ba16554dc179f021a`, migration `0003` blob `49b0798871429d7961e81eb1d86ad892dba0b9b9`, test blob `723411c806fdc9afa97b1d81f3097e28fa52ed58`, and workflow blob `130b7a18599f2674f53c1d062d5fbb0ccdec879e`.
- Production D1, dispatch, secrets, provider credentials and deployment were not touched.

### Confirmed source-level defect candidate: lease acquisition readback is not bound to the winning update
- `acquireTaskLease` performs a conditional UPDATE that increments `lease_generation`, then performs a separate SELECT filtered only by `task_key` and `lease_owner`.
- The API permits the same `workerId` on concurrent/retried calls. If acquisition A commits, its lease expires before A's readback, and acquisition B with the same worker ID reclaims the task, A's SELECT can observe B's newer generation. A can therefore return a lease token it did not acquire. This is a source-level interleaving analysis; it has NOT yet been reproduced in the Workers runtime.
- A unique worker ID per process is not a sufficient invariant: process identity is not an acquisition-attempt identity.

### Required correction and tests (not yet implemented)
- Bind readback to the exact winning UPDATE. Preferred proof options: a unique per-attempt lease token persisted by the conditional UPDATE and selected by that token, or a verified D1-supported atomic `UPDATE ... RETURNING` path that returns the changed row from the winning statement. Do not assume D1 supports a particular SQL feature until its current official contract and the actual Miniflare/workerd runtime are checked.
- Add deterministic same-worker contention tests: simultaneous same-worker calls; lease expiry/reclaim between update and readback; first caller must never receive the later generation; only the actual winner's attempt token may be returned.
- Add integer safety guards for `now + leaseSeconds` and `lease_generation + 1`; reject unsafe JS integers and prove database overflow behavior rather than relying on SQLite coercion.
- Preserve the invariant that lease generation fences only local task-row mutations. No external side effect is safe until result/outbox writes themselves atomically check the current generation and effect identity.

### Canonical identity / upstream component decision
- Current `logicalTaskKey` is a fixed-order JSON array of constrained scalar fields, not a general object serializer. The immediate identity gap is missing explicit canonical payload and capability-set digests, not merely JSON key ordering.
- For a future object-shaped signed/hashable execution envelope, use RFC 8785 JCS and its test vectors rather than inventing a serializer. RFC 8785 lists the JavaScript `canonicalize` implementation; do not add a dependency or change existing task keys until envelope fields, normalization, compatibility/versioning and vectors are approved. Reference: https://www.rfc-editor.org/rfc/rfc8785.html ; upstream implementation: https://github.com/cyberphone/json-canonicalization.

### Provenance / branch topology finding
- The documentation branch currently ends at `fa93ee478880071c50f131b7f42ffb544c6860cd`; source proof branch remains at `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- GitHub compare reports the documentation branch and source proof branch as DIVERGED (397 commits ahead / 77 behind, merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`). Do not stack new runtime work or merge the documentation branch into the proof branch without a deliberate ancestry reconciliation. Keep this pass documentation-only.

### Validation and status
- Verified source/blob readbacks and PR #40 workflow run `42489887940` = COMPLETED/SUCCESS in merge context; that CI ran 27 tests on merge commit `23e06138ddee46934c8cb137d04dd1585d390ea6`, not standalone exact-head.
- No local/Workers runtime tests were executed in this investigation. Race reproduction, exact-head CI, D1 SQL feature qualification and independent security review remain NOT VERIFIED / NOT RUN.
- PR #40 and #130 were not changed; no merge, dispatch or production integration.
- Next bounded step: create a fresh isolated proof branch from an explicitly reconciled immutable source; implement lease-attempt fencing and deterministic race tests only after verifying the D1 SQL/runtime contract. Keep dispatch false.
