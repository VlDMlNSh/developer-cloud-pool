# 2026-11-10 — Issue #38 local D1 approval/claim schema provenance audit

## Immutable targets and live state

- Current default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- D1 proof PR #39 head: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, OPEN/DRAFT/UNMERGED, stacked on earlier proof branch; not default production code.
- Exact PR #39 workflow run `42329993548`, job `128274072508`: SUCCESS. Steps include `npm ci`, adapter syntax check, local Workers-runtime D1 adversarial tests and lockfile artifact upload. This is local Miniflare/workerd evidence only.
- D1 package pins `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12`; workflow pins Node 24.9.0 and GitHub Actions by SHA.
- PR #39 remains a proof-only branch. No remote D1 database, Worker deployment, dispatch or production binding was used.

## Reused mature component

The proof reuses the official Cloudflare Workers Vitest integration (`@cloudflare/vitest-plugin`) and local Miniflare/workerd D1 fixture instead of building a custom D1 emulator. The dependencies are exact-pinned and installed with `npm ci`. Repository searches for a suitable turnkey transactional-outbox/approval-issuer implementation did not identify a mature drop-in component that satisfies this project's GitHub owner provenance, immutable approval, single-use claim and least-privilege constraints. No external component was adopted without evidence.

## Schema and behavior verified

Migration `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql`:
- Primary key: `approval_id`.
- Stores owner numeric ID, repository ID, issue number, target SHA, profile, envelope digest, expiry, consumed timestamp and ready/consumed/revoked state.
- Does not store canonical GitHub event/comment ID, issuer identity/type, event actor ID as authenticated evidence, issued-at timestamp, authorization policy version, revocation provenance, trusted clock source or quota reservation identity.

Migration `0002_create_task_claim_outbox.sql`:
- Creates one claim per approval and one outbox event per approval, each protected by unique constraints.
- An AFTER UPDATE trigger on ready→consumed inserts claim and outbox rows in the same SQLite transaction.
- Trigger failure aborts the state transition, demonstrated by test.
- Claim/outbox IDs are deterministic from approval ID.

Adapter `claim-outbox.mjs`:
- Conditional update requires exact owner/repository/issue/SHA/profile/digest, ready state, null consumed_at and unexpired row.
- Re-reads claim/outbox/ledger binding to distinguish first consume from exact retry.
- Always returns `dispatch:false`.
- 12 concurrent local attempts produce one `CLAIMED_ONCE`, 11 `ALREADY_ENQUEUED`, one claim row and one outbox row.
- Exact retry returns same IDs; changed owner binding and pre-consumed same-timestamp approval are denied.
- Trigger-induced outbox failure rolls back approval consumption and claim insertion.

## Important gaps / findings

1. **Issuer provenance is absent from the schema.** The adapter accepts `ownerNumericId`, `repositoryId`, `issueNumber`, digest and `now` as function arguments. They are syntactically validated and compared with D1 rows, but no trusted GitHub API adapter proves those values originate from a genuine, unedited, owner-authored event/comment. This is not an authenticated approval issuer.
2. **Time is caller supplied.** Expiry checks compare `expires_at > now`, but `now` is an argument, not a trusted backend clock or authenticated issuer timestamp. A future adapter must define a trusted clock and event ordering.
3. **Claim identity is approval identity.** The trigger uses `NEW.approval_id` as `claim_id`; this is deterministic but does not yet implement a separately generated monotonically increasing fencing generation or lease lifecycle.
4. **No quota reservation, issuer revocation ledger, audit provenance, or finalization outbox is present in these two migrations.**
5. The original `consume.mjs` and `claim-outbox.mjs` check D1 `meta.changes > 0` rather than exactly `=== 1`. Because the update is constrained by the approval primary key, more than one row should be impossible under this schema; nevertheless, the exact-one-row contract should be asserted explicitly in a future proof revision, with a regression test for malformed adapter metadata. This is a hardening issue, not evidence of a demonstrated multi-row exploit.
6. `wrangler.jsonc` uses an all-zero placeholder database ID. This is correctly a local proof fixture and cannot be treated as a deployable resource identity.
7. The current tests prove local database behavior, not Cloudflare account entitlement, remote D1 consistency under live traffic, deployed access control, backups/restores, quotas, or production recovery.

## Backend decision

Issue #38 already records why:
- GitHub labels are not atomic CAS and remain projections only.
- Git refs are a candidate but would require Contents:write and ref deletion/recreation governance; do not expand Supervisor permissions as a shortcut.
- D1 is the strongest current candidate because local conditional-update + trigger/outbox proof exists, but account plan/card-free eligibility, actual remote resource and issuer integration remain unqualified.

Retain D1 as the leading candidate for the next staged qualification, not as a selected production backend. Do not provision or deploy in this pass.

## Next bounded step

Define a canonical GitHub approval-event evidence adapter contract and extend the schema design (not yet dispatch wiring):
- immutable event/comment ID and API resource URL;
- actor numeric ID plus repository numeric ID verified from fresh canonical GitHub API reads;
- owner identity anchored to repository metadata, not caller fields;
- event/comment author and body digest; edited/deleted/ambiguous/paginated/API-error cases deny;
- issuer identity/version and authorization policy digest;
- issued/expiry timestamps from a trusted clock, with revocation semantics;
- quota reservation identity and idempotency key;
- explicit provenance record and audit outbox;
- all adapter failures return `dispatch:false`.

After the contract, implement negative-first adapter tests using recorded synthetic API fixtures. Do not add secrets, enable dispatch, provision D1, or call providers.

## Status

- Local D1 trigger-backed claim+outbox proof: VERIFIED at PR #39 exact head/run.
- Local 12-way single-winner test: VERIFIED.
- Canonical owner-event issuer: NOT IMPLEMENTED.
- Trusted clock / revocation / quota reservation: NOT IMPLEMENTED.
- Monotonic fencing / lease recovery / finalization outbox: NOT IMPLEMENTED in this proof.
- Remote D1 / account Free entitlement: NOT VERIFIED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
