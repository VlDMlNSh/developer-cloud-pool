# 2026-11-11 PR #54 transactional finalization contract conformance audit

- Scope: documentation/source audit only; immutable proof target PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Related target contract: [Transactional attempt finalization contract](../decisions/2026-11-11-transactional-attempt-finalization-contract.md), blob `16c3c63d3377ceeb11247026785815073e0e091b`.
- PR #54 remains OPEN/DRAFT/UNMERGED at the audited head; exact-head D1 proof run `42537241204` COMPLETED/SUCCESS. This is local Workers-runtime/Miniflare evidence only.
- Source blob `proofs/d1-ledger/src/task-attempts.mjs`: `6cb028e048569700ed623d93462ef55e2392a084`.
- Migration blob `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql`: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Outbox migration blob `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql`: `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- Test blob `proofs/d1-ledger/test/claim-outbox.test.ts`: `5bcd6e42acc8ac7ee4f2cfec31e32a5e2d3b5499`.

## Verified conformance

1. Terminalization starts with a conditional UPDATE on exact attempt/task, running status, attempt generation, current task pointer, lease owner/generation and unexpired lease.
2. The migration trigger writes the terminal event and clears the same task lease as part of the D1 statement's trigger transaction; migration 0006 creates one projection outbox row from that event.
3. Attempt events and projection delivery events have update/delete rejection triggers.
4. Exact replay checks stored terminal status, result digest, provenance digest, terminal reason, lease generation, actor and event row; conflicting result replay is covered by a test.
5. Exact-head local proof CI run `42537241204` succeeded.

## Blocking contract mismatch

Migration 0004 trigger `pool_attempts_terminal_projection` populates `pool_attempt_events.event_digest` with:
`COALESCE(NEW.result_digest, NEW.provenance_digest, NEW.input_digest)`.

Because valid finalization requires a result digest, this selects only `result_digest`; it does not commit to provenance digest, terminal status/reason, owner, lease generation, trusted completion time, or authenticated actor/capability provenance. The outbox migration copies this incomplete digest to `pool_attempt_projection_outbox.event_digest`. The replay path in `finalizeTaskAttempt` compares against the same result-first coalesce, making the implementation internally consistent but not compliant with the newer target contract.

The target contract requires a versioned canonical serialization/digest over all security-relevant finalization fields, including both result and provenance digests. It deliberately leaves canonical serialization and digest algorithm/version to be defined. No implementation change is safe until that format is decided; inventing a serialization now would silently freeze an unapproved wire/audit contract.

## Additional gaps / qualification boundary

- Event schema has no dedicated columns for terminal status, terminal reason, trusted timestamp provenance, authenticated issuer/subject/audience/operation/policy/nonce. Some fields remain on attempt/task rows or actor_id; that does not make the event digest bind them.
- Local API accepts caller-supplied `workerId` and `now`; these are test-seam inputs, not authenticated principal or trusted time. The target contract explicitly requires qualified issuer and trusted-time composition before promotion.
- Current tests prove exact replay and conflicting result digest, but should add conflicting provenance/reason/actor/generation cases, canonical serialization test vectors, digest-version migration compatibility, concurrent terminalization, and rollback/fault injection at event/outbox insertion.
- No mature drop-in package can supply this invariant: it is a domain-specific transaction/event schema. Reuse the existing Cloudflare Workers Vitest + D1 proof harness; do not build a database engine or add an unrelated event-sourcing dependency.
- No hosted D1 entitlement/ownership/quota/isolation, issuer, trusted time, production adapter, independent security approval or real hosted contention is qualified.

## Disposition

- PR #54 local exact-head CI: VERIFIED.
- Existing local terminal event/outbox atomicity pattern: VERIFIED as a synthetic proof.
- Canonical finalization digest conformance: FAILED against target contract / NOT IMPLEMENTED.
- Hosted service and production authorization: NOT QUALIFIED.
- No source changes, merge, dispatch, secrets, provider calls, deployment or resource mutation performed.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED. Dispatch remains fail-closed.

## Next bounded action

Governance/design-only: approve a versioned canonical finalization-event schema and deterministic serialization (field order, UTF-8/number/null representation, domain separation, digest algorithm/version, backward-compatibility policy). Then implement migration + trigger + replay verifier + golden vectors and adversarial tests on a proof branch, retaining `dispatch:false`. Do not select hosted D1 or issuer technology until their separate entitlement and authority gates are proven.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
