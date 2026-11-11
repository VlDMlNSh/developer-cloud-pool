# Durable Quota Reservation Reuse Assessment — 2026-11-11

## Scope and immutable refs

- PR #29 quota planner head: `e4c8d642bbc054e7c52b391356965b492dad32b4`.
- PR #39 D1 claim/outbox proof head: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #39 base: `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`, branch `proof/d1-single-use-ledger-retry-2026-11-06`; stacked proof branch, not default integration.
- PR #39 exact-head run observed: `42329993548`, Isolated D1 Ledger Proof, SUCCESS. README records 13/13 tests on immediately preceding source revision; exact job log/count for current head was not retrieved in this pass, so do not claim current-head test count.
- No production D1, provider calls, credentials, deployment, or dispatch.

## Mature/reusable implementation found inside the repository

PR #39 contains a local-only Cloudflare D1 proof package:
- `proofs/d1-ledger/migrations/0002_create_task_claim_outbox.sql`
- `proofs/d1-ledger/src/claim-outbox.mjs`
- tests for concurrent first-consumer-wins, deterministic idempotency, immutable binding mismatch, pre-consumed replay, and rollback when outbox insertion fails.
- It uses a conditional `ready -> consumed` UPDATE and SQLite trigger to create claim + outbox rows in the same transaction.
- README explicitly states local synthetic D1 only; not mounted in production Supervisor/Worker, no provider calls, no dispatch, no secrets, no deployed Worker.

Disposition: REUSE AS A PROOF PATTERN / NOT PRODUCTION-QUALIFIED. Do not duplicate trigger/outbox mechanics for quota reservations before the existing proof's branch stack and hosted execution limitations are resolved.

## PR #29 planner boundary

PR #29 `scripts/provider-quota-ledger.mjs` is a pure state-transition module:
- route and provider/quota-domain state;
- evidence-backed shared quota-domain effects;
- 401/403 auth failure, 402 billing block, 429 cooldown/reconciliation, bounded 5xx cooldown;
- provider-authoritative quota reset evidence;
- model and billing-class route eligibility.

It does not persist state, reserve capacity, coordinate concurrency, reconcile usage after crashes, or prove provider quota truth. `scripts/provider-slot-admission.mjs` explicitly says a production controller must wrap the planner with an atomic shared lease store.

## Recommended architecture (bounded)

Keep three authorities separate:

1. **Provider quota evidence** — provider-authoritative account/model/period limits and reset windows. Unknown limits remain unknown; no guessed free quota or fungible cross-provider balance.
2. **Internal reservation ledger** — atomic local admission budget. Use one durable bucket per provider account slot + provider quota domain + model/scope + reset period. Require an explicit verified cap before finite token reservations; if cap is unknown, deny quota-dependent admission or use a separately authorized conservative concurrency-only policy.
3. **Usage reconciliation** — reconcile provider-reported usage against reservation records. Never treat reservation as provider billing truth. Idempotent reservation keys bind task ID + immutable attempt ID + account slot + model + period. Terminal outcomes release only unused reserved balance after trusted evidence; ambiguous outcomes retain reservation and enter reconciliation.

Candidate D1 schema should include:
- quota bucket primary identity: account-slot ID, quota-domain ID, model/scope, period ID;
- explicit provider evidence reference, observed limit, observed used, reserved amount, status/version;
- reservation unique key bound to task+attempt+slot+model+period, requested amount, state, created/expiry/reconciled timestamps;
- outbox event created transactionally with reservation state change;
- monotonic lease/generation fencing for reservation ownership;
- conditional atomic UPDATE with remaining-capacity predicate, and trigger-backed outbox or a transactionally equivalent D1 batch.

Negative-first acceptance tests:
- concurrent N requests against one bucket never reserve more than available capacity;
- duplicate idempotency key returns same reservation and does not double-count;
- same task but different attempt is not silently replayed;
- wrong account slot, model, quota period, or evidence ref is denied;
- unknown/unverified limit cannot be treated as available quota;
- provider 429 without retry-after enters reconciliation, not guessed reset;
- crash/ambiguous provider response retains reservation until trusted reconciliation;
- failed outbox insert rolls back bucket and reservation together;
- stale lease generation cannot release/modify a newer reservation;
- two independent Worker requests against isolated D1 prove one-winner behavior, not only Promise.all against local synthetic runtime.

## Critical limitations / blockers

- PR #39 is stacked on an older proof branch, not current default; it cannot be treated as an integrated library.
- PR #39 local synthetic D1 tests do not prove hosted D1 behavior or production concurrency.
- PR #29 pure planner cannot be the authority for capacity or usage.
- Provider account-slot independence, secret existence, actual authentication, upstream quota, pricing and reset timezone remain NOT VERIFIED.
- GitHub repository metadata reports `allow_update_branch=false`; no automatic update-branch endpoint is available through the installed connector. No branch ref was force-moved or PR base changed.
- PR #28/#29 base refs are `Основной`, but their API base SHA snapshots still report `64d2636d4500127e635c214ccfb722c6b3fcda80`; current default ref is `6fdcedebeba62715122e43a75c6ad6d926321ce7`. This discrepancy must be resolved through a real branch update/rebase, not inferred away from a file-overlap comparison.

## Next bounded step

1. Inspect the PR #39 stacked predecessor and exact-head workflow logs; establish whether its D1 proof can be safely re-targeted or cherry-picked as a separately reviewed proof branch.
2. Design a quota-specific migration and adapter that reuses the conditional-write/trigger/outbox pattern but does not conflate approval consumption with token reservation.
3. Prove concurrency through independent HTTP requests to a test-only Worker backed by isolated D1 before considering hosted use.
4. Keep provider calls and production credential injection disabled.

## Status

- Reusable D1 claim/outbox pattern: FOUND; local proof only.
- Quota planner: PURE / STATIC; not durable.
- Atomic quota reservation: NOT IMPLEMENTED.
- Hosted D1: NOT QUALIFIED.
- Provider APIs/secrets: NOT READ / NOT CALLED.
- Agent dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Links

- PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- PR #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #28: https://github.com/VlDMlNSh/developer-cloud-pool/pull/28
- D1 proof README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/proof/d1-claim-outbox-atomic-2026-11-07/proofs/d1-ledger/README.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
