# Migration 0011 review packet — v1 fixture inventory — 2026-11-12

## Status and scope

SOURCE INVENTORY VERIFIED / UPGRADE-PRESERVATION TEST NOT RUN / MIGRATION 0011 NOT CREATED / NO SCHEMA OR RUNTIME CHANGE.

This packet defines the evidence required before any migration 0011 implementation. Work was restricted to source inspection and documentation. No SQL, application code, dependency, workflow, secret, permission, hosted D1, GitHub write, dispatch, provider call, deployment or merge was changed or executed. Independent technical/security/governance review remains deferred until actual Cloud Pool launch by owner direction.

## Immutable target and live repository snapshot

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`; latest commit search returned HEAD `221f216c00ca7e5596bcc682ba185ad155a10603` (rechecked 2026-11-12).
- PR #67 target implementation: `impl/receipt-bound-projection-2026-11-11@f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`, base `221f216c00ca7e5596bcc682ba185ad155a10603`, OPEN / DRAFT / UNMERGED, mergeable true. Exact-head runs 43162128594 (Isolated D1 Ledger Proof) and 43162128615 (Pool Contract Validation) completed SUCCESS. Combined status contexts 0; formal reviews 0; review threads 0.
- PR #66 documentation branch: `docs/projection-stack-reconciliation-2026-11-11@269546cc83b3fe28072599cb35c63e1048cbf1e3`, base `221f216c00ca7e5596bcc682ba185ad155a10603`, OPEN / DRAFT / UNMERGED, mergeable true. No exact-head workflow runs or status contexts were returned; CI is NOT VERIFIED for this documentation head.
- PR #60 remains OPEN / DRAFT / UNMERGED at `134fe6fe739a09b181fee88463ac848a6b059206`, based on `864213e2ff5b4fa956ba405dea8137a44d812f49`; exact-head CI remains NOT VERIFIED.
- PR #63 remains OPEN / DRAFT / UNMERGED at `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`, based on `6fdcedebeba62715122e43a75c6ad6d926321ce7`; mergeability false.
- Open issue search surfaced #1 governance gate, #5 ephemeral agent-browser, #22 secure web console, #38 durable single-use Supervisor claims, and #21 native mobile scope among others. #22 and #5 remain later work; no permission/dispatch gate is changed here.

## 1. Migration inventory (PR #67 exact head)

| Migration | Blob SHA | Schema/evidence relevant to upgrade |
|---|---|---|
| 0001 approval ledger | `a80524ed839b63dd6483978118619495fa550877` | Approval identity and consumed state. |
| 0002 claim/outbox | `44b8f7e0658296d287269770c5e91b1c3e25973c` | Historical per-approval claim/outbox triggers. |
| 0003 logical task identity | `49b0798871429d7961e81eb1d86ad892dba0b9b9` | Logical task key, approval attachment, legacy trigger preservation. |
| 0004 immutable attempts | `0ad590ffdd2589f857257739275c15ed2d54d729` | Attempts, append-only attempt events, terminal event trigger. |
| 0005 reconciliation queue | `7a19897f6197c79517170e101e4cbf1db233cac6` | Indeterminate-attempt reconciliation row. |
| 0006 projection outbox | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` | One outbox row per attempt; event ID/digest copied by trigger. |
| 0007 bounded delivery retries | `767d95a30fa0a14c79e88c8c58392bfec9cdddc2` | Retry/dead-letter fields and guards. |
| 0008 retry monotonicity | `1d9385dd371f3404c52ec15fce03b0a14d384ab1` | Delivery attempts cannot decrease. |
| 0009 immutable outbox identity | `86919425f498dc634329bb783a3ca6ae7a0ff6a1` | Outbox identity and event_digest immutable. |
| 0010 comment at-most-once | `30ac9d0ed0cbede9586c365578c606b47bcce1a7` | Comment state and append-only comment evidence. |

Related source/test blobs:
- `src/task-attempts.mjs`: `6cb028e048569700ed623d93462ef55e2392a084`.
- `test/projection-delivery.test.ts`: `a1b96a2e122b25594f75e5eb160c816ffff67812`.
- `test/projection-envelope.test.ts`: `14fd64aa76d1cc97ea45fc1ecfa6d80e28bc8624`.
- `vitest.config.ts`: `39bcf53a51180e7e5f309978e307e9964a2cc22e`.
- `test/apply-migrations.ts`: `e1307208cc520a3399e66a937c3e0b05b71ac0f6`.

## 2. What current tests actually prove

### Existing generated D1 fixture

`test/projection-delivery.test.ts:createOutbox()` constructs a fresh fixture for each relevant test:
- Inserts one synthetic ready approval row.
- Calls `claimLogicalTask`.
- Creates attempt `attempt-projection-orch-N` with fixed input digest `d…d`.
- Acquires a worker lease.
- Finalizes succeeded with result digest `9…9`, provenance digest `8…8`, terminal reason `completed`.
- The migration 0004 trigger creates event ID `attempt-finalized:attempt-projection-orch-N` and event digest `9…9` (v1 result-only behavior).
- Migration 0006 creates the outbox row with the same ID/digest.
- Subsequent delivery tests verify receipt matching, ACK ordering, lease fencing, retry behavior, comment at-most-once and outbox digest immutability.

This is a reproducible v1-shaped fixture, but it is generated from scratch after the entire current migration set has been applied. It is not a frozen pre-upgrade database snapshot.

### Existing envelope fixture

`test/projection-envelope.test.ts` supplies a synthetic JavaScript outbox object with:
- `outbox_id=attempt-finalized:attempt-7`
- `event_digest=a…a`
- repository/issue/target/profile/generation/status metadata.

It verifies envelope mapping and reconciliation behavior but does not exercise a D1 migration or historical row preservation.

### Migration test bootstrap

`vitest.config.ts` calls `readD1Migrations(path.join(root, "migrations"))`, injects the complete result as `TEST_MIGRATIONS`, and `test/apply-migrations.ts` applies that list to `env.POOL_DB` using `applyD1Migrations`.

There is no current test that:
- creates a database at schema version 0010,
- inserts populated v1 terminal event/outbox/comment fixtures,
- applies a candidate 0011 migration after those rows exist,
- snapshots and compares the immutable identity tuple before and after upgrade.

Therefore existing successful CI is not evidence that a populated v1 database upgrades without mutation.

## 3. Required frozen v1 fixture set

Build a deterministic pre-upgrade fixture containing at minimum:

1. One succeeded terminal attempt with distinct result and provenance digests (e.g. result `9…9`, provenance `8…8`); assert v1 event digest remains result-only.
2. One failed or abandoned terminal attempt, with a different stable attempt/event ID and digest.
3. Corresponding two outbox rows with immutable task/attempt/repository/issue/target/profile/lease-generation/status/event-digest values.
4. One outbox with comment state `not_attempted`.
5. One outbox with comment state `indeterminate`, immutable post-attempt timestamp and generation, and its append-only `post_reserved` event.
6. One outbox with comment state `verified`, corresponding `marker_verified` event, and delivered status only if the existing fixture can legally reach that state through supported transitions.
7. Projection delivery events covering at least pending/leased/retryable/dead-letter or delivered states where legal, including retry count, lease generation, timestamps and reason code.
8. Exact external marker body bytes held in a fake GitHub API fixture for each event; never issue a real POST.
9. One nonterminal attempt and one indeterminate reconciliation row to detect accidental scope expansion or mutation.
10. All relevant rows in parent task, attempt, attempt-event, outbox, projection-event, comment-event and reconciliation tables.

The fixture must be generated through supported adapters/triggers where possible, not by bypassing invariants with arbitrary SQL. Any unavoidable seed-only insert must be explicitly isolated and validated against constraints.

## 4. Byte-for-byte preservation oracle

Before migration, export canonical snapshots from each relevant table using explicit ordered column lists and deterministic ordering. Preserve both raw SQLite values and a stable canonical serialization of the snapshot.

At minimum compare:
- all existing event IDs and event digests;
- all outbox IDs and immutable identity columns;
- task/attempt IDs and attempt number;
- result/provenance digests and terminal timestamps;
- all delivery/comment state, retry/lease fields and event rows;
- exact marker strings stored in the fake API fixture.

Expected after 0011:
- every pre-existing value above remains identical;
- new `event_digest_version` is exactly 1 for every existing event and outbox row;
- no v2 staging digest is synthesized for old rows;
- row counts and primary/unique key sets remain unchanged;
- no new terminal event/outbox/comment event is generated by the migration;
- no comment state is reset or advanced;
- migration can be applied once and reports the expected migration ledger state;
- a failed migration is atomic: no partial columns/triggers or row changes remain.

Do not use only SELECT counts as an oracle. The comparison must include every identity and state field, plus exact marker bytes.

## 5. Disposable local upgrade harness proposal

The existing single `POOL_DB` setup applies all migrations before each test and is not an upgrade harness. Add a separate migration-specific test target only after review:

A. Create an isolated disposable D1 database binding dedicated to migration-upgrade tests (not the shared test DB).
B. Apply migrations 0001–0010 only using the exact migration files at the pinned PR #67 target.
C. Seed the frozen v1 fixture and snapshot all required tables.
D. Apply candidate migration 0011 exactly once using the supported Cloudflare Workers Vitest D1 migration helper.
E. Re-read and compare the complete snapshot; assert v1 version defaults and absence of generated v2 digests/events.
F. Test failure atomicity using a deliberately invalid disposable migration variant in a separate fresh database, not by corrupting the real candidate.
G. Run the migration-upgrade test under the exact Node 24 / Workers compatibility configuration; capture exact-head CI run and artifact digests.

The current package's test bootstrap uses official `@cloudflare/vitest-plugin` and `applyD1Migrations`; do not introduce a home-grown SQLite migration runner or a second SQL engine. Confirm the supported way to construct an isolated D1 binding in the installed plugin version before implementing this harness. The current Wrangler config uses a synthetic zero UUID database ID and is explicitly local-only.

## 6. Migration 0011 review checklist — no SQL authored here

- [ ] New `event_digest_version` column on event and outbox tables, with CHECK for only supported versions and existing rows defaulted to 1.
- [ ] Version copied atomically by terminal event/outbox triggers.
- [ ] Outbox immutable identity trigger extended to include version.
- [ ] Envelope and marker/recovery grant contracts carry the exact (event ID, version, digest) tuple.
- [ ] Existing v1 event digest and marker serialization unchanged.
- [ ] No rewrite, rehash, duplicate event, duplicate outbox, or comment POST.
- [ ] V2 digest staging bound to the same attempt identity and fenced finalization CAS; no caller-selected digest or arbitrary identity.
- [ ] Terminal evidence fields become immutable once terminal, without retroactively changing valid historical rows.
- [ ] Comment state machine and at-most-once semantics remain unchanged.
- [ ] Rollback disables v2 writes but retains v2 readers and rows; v1-only binary rollback is blocked if v2 rows exist.
- [ ] Unknown version and conflicting replay fail closed.
- [ ] No secret, provider, dispatch, hosted D1 or external GitHub operation.

## 7. Qualification status and next step

- Source inventory 0001–0010: VERIFIED at immutable PR #67 target.
- Existing v1 generated fixture path: VERIFIED by source inspection.
- Frozen historical v1 fixture: NOT CREATED.
- Populated upgrade harness: NOT IMPLEMENTED.
- Byte-for-byte upgrade test: NOT RUN.
- Migration 0011: NOT CREATED / NOT APPLIED.
- PR #67 exact-head local CI: SUCCESS (runs 43162128594 and 43162128615); this validates current code only, not migration upgrade.
- PR #66 exact-head CI: NOT VERIFIED (no runs/status contexts returned for its current head).
- Hosted D1: NOT RUN / NOT QUALIFIED.
- Recovery Actor: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: design the isolated D1 migration-upgrade test harness against the installed `@cloudflare/vitest-plugin@1.4.7` API, then create a frozen v1 fixture and run the before/after byte-preservation test on a disposable local database. Do not author or apply migration 0011 until the harness demonstrates that it can test a populated pre-0011 database.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
