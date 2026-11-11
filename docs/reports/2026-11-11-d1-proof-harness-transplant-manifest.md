# D1 proof harness transplant manifest — 2026-11-11

## Decision

Status: MANIFEST PREPARED / INDEPENDENT REVIEW NOT RUN / NO BRANCH MUTATION.

Do not merge either PR or cherry-pick their full commit ancestry. PR #58 and #59 are divergent children of the same merge base:

- Shared proof base: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #58 head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`, 4 commits ahead / 0 behind shared base.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`, 10 commits ahead / 0 behind shared base.
- Comparing #58 head to #59 head: DIVERGED, #59 is 10 ahead / 4 behind, merge base is the shared proof base.

This corrects the shorthand “#59 stacks directly on latest #58”: it stacks on the earlier shared base, not the latest #58 head. The 4 later #58 commits are absent from #59. Reconstruct a reviewed logical patch union from exact source files; preserve provenance in the manifest.

## Exact delta between the two proof heads

PR #58's four commits after shared base change:
1. `docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md` — add; carry forward as the intended integration contract, but revise its ack wording because the current acknowledgement API accepts no receipt.
2. `proofs/d1-ledger/package.json` — modified; preserve the `node --check src/projection-envelope.mjs` addition.
3. `proofs/d1-ledger/src/projection-envelope.mjs` — add; carry forward after source review.
4. `proofs/d1-ledger/test/projection-envelope.test.ts` — add; carry forward and extend with malformed-row/contract edge cases if review finds gaps.

PR #59's ten commits after shared base change:
1. `.github/workflows/d1-ledger-proof-validation.yml` — add both PR branch names to the appropriate push/pull_request filters. Preserve all existing branches; take a deliberate union, not either file blindly.
2. `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` — add after 0006; inspect trigger replacement and lease-owner audit behavior.
3. `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql` — add after 0007.
4. `proofs/d1-ledger/src/projection-outbox.mjs` — modify; use retry/dead-letter implementation, but do not treat it as integrated projection delivery.
5. `proofs/d1-ledger/test/claim-outbox.test.ts` — modify; carry retry/backoff/dead-letter tests and add receipt-bound acknowledgement tests before claiming delivery correctness.

## File-by-file current-default transplant set

The current default tree at `Основной@221f216c00ca7e5596bcc682ba185ad155a10603` has no D1 project directory, package manifest, migrations or Workers/D1 test harness. Proposed logical transplant set:

| Path | Source | Disposition | Review requirement |
|---|---|---|---|
| `.github/workflows/d1-ledger-proof-validation.yml` | PR #58 + #59 | ADD, merged trigger-filter union | Preserve existing push and PR target branches; least-privilege `contents: read`; verify path filters and no credentials |
| `docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md` | PR #58 | ADD, revise | Correct contract: ack requires receipt bound to outbox/event ID, digest and delivery generation |
| `docs/contracts/TASK-IDENTITY-AND-FENCED-DELIVERY-PROOF.md` | shared proof base | ADD | Verify identity/fencing claims against code and migrations |
| `docs/reports/2026-11-06-d1-ledger-proof-implementation.md` | shared proof base | ADD, historical | Label as isolated local proof, not current-default or hosted qualification |
| `proofs/d1-ledger/README.md` | shared proof base | ADD | Retain local-only and dispatch-disabled boundaries |
| `proofs/d1-ledger/package.json` | PR #58 + PR #59 | ADD, reconcile | Keep `test` script; syntax check must include consume, claim-outbox, task-lease, task-attempts, projection-outbox, projection-reconciler AND projection-envelope |
| `proofs/d1-ledger/package-lock.json` | shared proof base | ADD, verify | Lockfile must correspond exactly to reconciled package.json; `npm ci` only |
| `proofs/d1-ledger/vitest.config.ts` | shared proof base | ADD | Validate pinned Workers Vitest plugin and local migration setup |
| `proofs/d1-ledger/wrangler.jsonc` | shared proof base | ADD, test-only | Placeholder D1 ID remains non-deployable; no hosted resource binding |
| `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql` | shared proof base | ADD, ordered | Recheck schema ownership and constraints |
| `proofs/d1-ledger/migrations/0002_create_task_claim_outbox.sql` | shared proof base | ADD, ordered | Recheck transactional claim/outbox invariant |
| `proofs/d1-ledger/migrations/0003_create_logical_task_identity.sql` | shared proof base | ADD, ordered | Recheck stable task identity |
| `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql` | shared proof base | ADD, ordered | Recheck immutable attempt events and lease fencing |
| `proofs/d1-ledger/migrations/0005_create_attempt_reconciliation_queue.sql` | shared proof base | ADD, ordered | Recheck indeterminate attempt semantics |
| `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql` | shared proof base | ADD, ordered | Recheck terminal event trigger, append-only delivery events |
| `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` | PR #59 | ADD after 0006 | Keep `COALESCE(NEW.lease_owner, OLD.lease_owner)`; retry/dead-letter guards |
| `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql` | PR #59 | ADD after 0007 | Keep monotonic retry-attempt invariant |
| `proofs/d1-ledger/src/claim-outbox.mjs` | shared proof base | ADD | Audit transactional claim and immutable task identity |
| `proofs/d1-ledger/src/consume.mjs` | shared proof base | ADD | Audit authorization/consumption boundary |
| `proofs/d1-ledger/src/task-lease.mjs` | shared proof base | ADD | Audit fencing and caller-supplied time limitation |
| `proofs/d1-ledger/src/task-attempts.mjs` | shared proof base | ADD | Audit finalization and event immutability |
| `proofs/d1-ledger/src/projection-envelope.mjs` | PR #58 | ADD | Pure mapping only; no authority or I/O |
| `proofs/d1-ledger/src/projection-reconciler.mjs` | PR #58 | ADD | Fake injected API only; final comment + label read-back; no live GitHub adapter |
| `proofs/d1-ledger/src/projection-outbox.mjs` | PR #58 + #59 | ADD, reconcile | Retain five-attempt backoff and guards; ACK MUST be changed to require and validate verified receipt |
| `proofs/d1-ledger/src/worker.mjs` | shared proof base | ADD, inspect | No production adapter; no dispatch; retain minimal worker surface |
| `proofs/d1-ledger/test/apply-migrations.ts` | shared proof base | ADD | Ensure migration order is deterministic |
| `proofs/d1-ledger/test/claim-outbox.test.ts` | shared proof base + PR #59 | ADD, reconcile | Keep claim/lease/backoff/dead-letter regression tests; add receipt success, missing/fabricated/mismatched receipt, stale generation and failure tests |
| `proofs/d1-ledger/test/consume.test.ts` | shared proof base | ADD | Preserve authorization negative tests |
| `proofs/d1-ledger/test/projection-envelope.test.ts` | PR #58 | ADD | Keep pure mapping and malformed row tests |
| `proofs/d1-ledger/test/projection-reconciler.test.ts` | PR #58 | ADD | Keep lost POST response/read-back, duplicate marker, digest conflict and label convergence tests |

## Concrete compatibility defect found

At exact PR heads, the package scripts differ:

- PR #58 `package.json` blob `ebfcf2b311871694904516b245222425fa9c38f8` checks both `projection-reconciler.mjs` and `projection-envelope.mjs`.
- PR #59 `package.json` blob `26b52ef60613366eaca02191b2d28901415cea5a` checks `projection-reconciler.mjs` but omits `projection-envelope.mjs`.

Because PR #59 is based on the earlier shared proof base and does not include #58's four later commits, a transplant that simply copies #59's package file silently loses the syntax check for the envelope module. The final reconciled package script must preserve both checks. Regenerate/verify lockfile only if package dependencies actually change; current dependency set shown is `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12`.

## Known gaps that remain excluded from this transplant

- No end-to-end lease→mapper→fake reconciler→receipt→D1 ACK actor yet.
- `acknowledgeProjectionDelivered` currently accepts no receipt and can mark delivered based only on lease identity/generation/time. Do not accept as final.
- The reconciler success result is `PROJECTION_VERIFIED` after final read-back, but does not carry delivery lease generation.
- Fifth expired lease recovery is same-owner/generation only; no independent reaper. Do not weaken this without separately qualified issuer, grant/revocation and trusted-time authority.
- Caller-supplied `now` and worker ID are not trusted time or authenticated workload identity.
- Fake GitHub transport is not live GitHub API qualification.
- Hosted D1 and test Worker remain NOT AUTHORIZED / NOT RUN.

## Required acceptance gates for a future integration PR

1. Independent review of this manifest and exact source patches.
2. Reconciled package scripts and lockfile; `npm ci`, syntax check, all local D1 tests.
3. Migration checksum/order test for 0001–0008, including fresh DB and migration upgrade from 0006 to 0008.
4. Workflow filter union verified against intended PR and push branches; permissions remain read-only.
5. Receipt-bound ACK negative tests: missing receipt, fabricated receipt, wrong outbox ID, wrong digest, wrong generation, stale lease, mismatched read-back.
6. Orchestrator tests: successful projection, sender failure, ambiguous comment POST, marker read-back mismatch, label read-back mismatch, restart/reconciliation; no ACK unless receipt verified.
7. No live GitHub credentials, no dispatch, no hosted D1, no deployment.
8. Exact-head CI on candidate and independent review before merge.
9. Preserve existing default scripts/workflows and verify no unrelated file loss.

## Status

- Manifest source inventory: VERIFIED against PR #58/#59 exact-head patches and current default tree.
- Manifest independent review: NOT RUN.
- Code integration: NOT RUN.
- Hosted D1: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
