# Projection delivery receipt-boundary audit and reusable component assessment — 2026-11-11

## Scope and immutable sources

- Repository: `VlDMlNSh/developer-cloud-pool`
- Current default: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Source PR #58 head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`
- Source PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`
- PR #58 source blob: `projection-reconciler.mjs` and projection tests read from the exact #58 head.
- PR #59 source blob: `projection-outbox.mjs` `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`; D1 test blob `d572b3d5fdf58c720d9cbfe0990419e7a9bc60f1`.
- Manifest blob previously verified: `35ad2ebe3756377f373c0367b0adabd6cf1c936b`.

This is an author-side source audit, not independent review. No code was executed or changed in this pass.

## Confirmed blocking defect: acknowledgement is not receipt-bound

At PR #59 head, `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` accepts no projection receipt or verified projection result. Its conditional UPDATE checks only:

- matching outbox ID;
- status `leased`;
- lease owner;
- delivery lease generation;
- lease expiry.

It then marks the row `delivered`. Consequently, any caller holding a valid lease tuple can acknowledge without proving that the external GitHub projection was verified.

The existing test named `rejects stale delivery acknowledgement after lease expiry and takeover` explicitly demonstrates the gap: after acquiring a new lease, it calls `acknowledgeProjectionDelivered` directly and expects `PROJECTION_DELIVERED`, without invoking `reconcileTerminalProjection` or presenting a receipt. The test proves stale-lease fencing, not delivery correctness.

The reconciler returns `projection_verified`, `eventId`, and `payloadDigest`, but does not bind that result to the outbox delivery lease generation. Its `claimGeneration` is the task-attempt claim generation and must not be confused with `lease_generation_delivery`.

### Required correction before integration

Do not merely add a caller-supplied boolean or plain object receipt: callers can construct those values.

Prefer one narrow exported orchestration boundary that owns the sequence:

1. validate the exact leased outbox row and capture `outbox_id`, `event_digest`, `lease_owner`, `lease_generation_delivery`, and trusted lease time;
2. invoke the projection reconciler using only that immutable envelope;
3. if and only if the reconciler returns verified read-back for the same event ID and digest, perform a conditional D1 acknowledgement requiring the same owner, generation, unexpired lease, event digest, and expected status;
4. do not export a lower-level receipt-free ACK function;
5. return retryable/deny on ambiguous read-back, mismatched digest, wrong event, stale generation, expired lease, or duplicate marker.

If a split process boundary is required later, define an authenticated receipt format with a separately qualified issuer/key and expiry. Do not treat an in-memory plain object as cryptographic proof.

Add negative-first tests proving:
- valid lease without verified projection cannot ACK;
- verified result for another event/digest cannot ACK;
- verified result from a previous delivery generation cannot ACK after takeover;
- marker duplicate/conflict and delayed read-back cannot ACK;
- lost POST response with matching read-back may ACK once;
- ACK replay is idempotent only for the same immutable receipt/lease identity;
- concurrent ACK attempts result in one state transition.

## Existing proof strengths retained

- PR #58 reconciler is a local fake API boundary, has no network client/credentials, and verifies comment marker and managed-label read-back before returning `PROJECTION_VERIFIED`.
- Tests cover lost POST response, delayed marker visibility, no-POST reconciliation mode, digest conflict, duplicate markers, inconsistent terminal labels, malformed envelopes, and retryable label mutation failure.
- PR #59 adds bounded five-attempt retry, deterministic backoff, dead-letter guards, monotonic attempts, and same-owner/generation fencing for expired fifth-lease recovery.
- Existing tests cover 20-way lease contention, stale ACK after takeover, retry backoff, dead-letter terminality, and expired fifth-lease recovery.

These are local proof claims only; they do not establish live GitHub API semantics, hosted D1 behavior, trusted time, issuer identity, or deployment readiness.

## Reusable component search — compatibility result

Inspected current public GitHub candidates and their documented constraints:

1. [jamarius-fortson/effect-queue](https://github.com/jamarius-fortson/effect-queue) — SQLite transactional outbox/inbox with no runtime dependencies, Python 3.12+, and a README documenting 146 tests including real process-kill and simulated-network schedules. Useful as a failure-model/test-design reference. **Not reusable as a Cloudflare Worker/D1 runtime component**: Python package, local SQLite files, subprocess/process model.
2. [devmor-j/persistent-bus](https://github.com/devmor-j/persistent-bus) — Node.js TypeScript event bus over native `node:sqlite` plus Redis Pub/Sub, retries and dead-lettering. **Not a D1 drop-in**: requires Node `node:sqlite` and Redis; Cloudflare Workers/D1 runtime and transaction boundaries differ.
3. [Zehelein/pg-transactional-outbox](https://github.com/Zehelein/pg-transactional-outbox) — PostgreSQL-specific TypeScript outbox/inbox. **Not compatible with D1 SQL/runtime** without a backend rewrite.
4. Cloudflare D1 documentation confirms D1 is a Worker-bound SQL database, but does not provide a drop-in GitHub projection reconciler or a receipt-bound outbox ACK primitive.

Decision: no inspected candidate is a compatible, maintained drop-in for this D1 + Cloudflare Workers + GitHub REST projection boundary. Do not transplant their code. Reuse only applicable test ideas: real crash seams, deterministic fault schedules, independent invariant checker, honest at-least-once boundary. Re-run maintenance, license, release and CI review before any future adoption.

## Disposition

- PR #58 projection source audit: VERIFIED by read-back; independent review NOT RUN.
- PR #59 outbox source audit: VERIFIED by read-back; independent review NOT RUN.
- Receipt-bound ACK: BLOCKING DEFECT CONFIRMED.
- Local proof tests: source inspected only; NOT RUN in this pass.
- Hosted D1 / live GitHub adapter / trusted clock / issuer: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Create a new immutable integration candidate from the current default only after independent review. Implement the receipt-bound orchestration boundary and negative-first tests; preserve the PR #58/#59 logical patch union and package/workflow/migration compatibility. Do not merge PR #58/#59 or deploy hosted resources.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
