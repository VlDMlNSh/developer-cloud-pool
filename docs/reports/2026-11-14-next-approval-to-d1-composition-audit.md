# Cloud Pool /next — approval evidence to D1 composition audit

- Date: 2026-11-14
- Status: SOURCE RECONCILIATION COMPLETE / COMPOSITION NOT IMPLEMENTED / DISPATCH DISABLED
- Immutable targets: default `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`; PR #67 `a53f6232bd5b50d3e150addf528b8e722002f9dd`; PR #68 `d9afb6f45a7deb465f7fee7aa347469c2f6019b7`; PR #55 `edff010388897f23f58bceb92e5180a09970fdff`; PR #39 `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- Scope: determine whether existing GitHub owner-approval evidence and local D1 claim/outbox proofs can be composed without introducing a new JWT issuer or duplicating mature work. Read-only source/CI/review/branch comparison; no code, secrets, workflows, settings, dispatch, provider calls, hosted resources, deployments, billing changes or merges.

## 1. Live project refs and exact-head evidence

- Default branch: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67 OPEN/DRAFT/UNMERGED at `a53f6232bd5b50d3e150addf528b8e722002f9dd`. Exact-head Pool Contract Validation run 43600901063 SUCCESS and Isolated D1 Ledger Proof run 43600901068 SUCCESS. D1 job log confirms 6 test files / 84 tests, upgrade-binding smoke 1, frozen schema fixture smoke 2. Formal reviews/threads 0/0.
- PR #68 OPEN/DRAFT/UNMERGED at `d9afb6f45a7deb465f7fee7aa347469c2f6019b7`. Exact-head Runner Resource Probe run 43602513530 SUCCESS (job 132470131134); read-only Ubuntu 24.04.5, AWS image 20261111.127.1, 4 vCPU, 88.46 GiB available workspace; no agents installed, no secrets accessed, no profile qualified. Exact-head Pool Contract Validation run 43602513555 SUCCESS (job 132470131216); workflow/security invariants PASS, dispatch fail-closed, 30 qualification matrix records PASS. Formal reviews/threads 0/0.
- PR #55 OPEN/DRAFT/UNMERGED at `edff010388897f23f58bceb92e5180a09970fdff`, base `864213e2ff5b4fa956ba405dea8137a44d812f49`; compare with current default is DIVERGED, 6 ahead / 59 behind. Exact-head runs 42797001864 Pool Contract Validation SUCCESS and 42797001989 GitHub Approval Event Adapter Fixture Tests SUCCESS; job 129764618860 confirms 11/11 tests passed. Formal reviews/threads 0/0.
- PR #39 OPEN/DRAFT/UNMERGED at `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`; compare with current default is DIVERGED, 55 ahead / 62 behind. Exact-head Isolated D1 Ledger Proof run 42329993548 SUCCESS; recorded test evidence 19/19 local Workers-runtime tests. Three reviews are COMMENTED, not APPROVED; audit records explicit gaps (trusted issuer provenance, task-wide identity, remote D1, lease/delivery/recovery and independent-review qualification). Inline threads 0.
- Historical PR #55/#39 code must not be merged or cherry-picked wholesale: both are materially diverged from current default. Use as source candidates and transplant only after current-base integration and exact-head tests.

## 2. Reusable owner-approval verifier — PR #55

Source blob `80bbb2c93691be3eaf89466d6638a9795dafe6fb`:
- Accepts only native `issue_comment.created` context, an Issue (not PR), fixed repository full name and numeric repository ID, fixed owner/approver numeric ID, allowlisted issue number, immutable comment timestamp (created_at == updated_at), fixed target SHA and allowlisted profile.
- Re-reads canonical repository, issue and comment from GitHub REST; checks owner, IDs, URL tuples, body and timestamps; then re-reads Issue/comment again to detect resource changes.
- Strict command parser returns target SHA, profile and nonce. Evidence includes repository/owner IDs, issue ID/number, comment ID/author, created time, target SHA, profile and nonce.
- All accepted and denied results explicitly set `dispatch:false`; verifier is read-only and exposes no storage, provider or secret API.
- Fixture suite is negative-first and 11/11 passed on the exact historical PR #55 head.

Explicit limitations recorded by PR #55 author audit:
1. No production invocation/composition root binds native event, trusted Actions context, protected approver policy and least-privilege Octokit.
2. Nonce is only syntax-checked and returned; there is no durable replay protection or expiry enforcement.
3. No real Actions event, live GitHub API or Actions token permission qualification; CI uses synthetic fixtures.
4. No independent security/governance review.

Disposition: reuse as the read-only owner-approval evidence adapter candidate, not as an issuer, durable capability, or dispatch authority. Do not add a custom JWT issuer merely to replace this existing proof.

## 3. Reusable D1 task/outbox proof — PR #67, historical PR #39

PR #67 current D1 schema and adapter:
- `pool_approval_ledger` stores approval_id, owner_numeric_id, repository_id, issue_number, target_sha, profile, envelope_digest, expiry and consumed state.
- Migration 0002 trigger creates per-approval claim/outbox atomically on ready -> consumed.
- Migration 0003 introduces canonical logical task key from repository ID, issue number, target SHA and profile; attaches distinct approvals to one task and creates one task-level delivery outbox row.
- `claimLogicalTask` consumes a pre-existing ready approval row and returns queue-only `dispatch:false`; it does not authenticate GitHub owner evidence or create the ready row from a verified event.
- Existing ledger schema has no nonce column or unique nonce index. A different comment ID carrying the same command nonce can therefore be represented as a different approval_id unless a separate replay invariant is added.
- D1 schema stores repository ID and issue number but no issue ID, tenant ID, route/cost/quota domain, approval event timestamp, or explicit attempt ID in the approval row.

Historical PR #39 independently proved atomic ready -> consumed + trigger-created claim/outbox under 12 concurrent attempts and failure rollback in local Workers runtime. Its own review explicitly states that this is not remote D1, not exactly-once external execution, and does not establish trusted issuer/owner provenance. The PR is heavily diverged from current default and its 3 reviews are COMMENTED, not approval.

## 4. Canonical contract mismatches that must be resolved before code integration

| Field / guarantee | PR #55 approval evidence | PR #67 D1 ledger/task | A0 admission contract |
|---|---|---|---|
| Owner numeric ID | present | present | absent from expected binding |
| Repository numeric ID | present | present | absent |
| Issue ID / issue number | both present | issue number only | absent |
| Comment/approval ID | comment ID | approval_id | capabilityId (adapter-injected) |
| Nonce | parsed and returned, not persisted | absent | absent |
| Target SHA / profile | present | present | present |
| Tenant ID | absent | absent | present |
| Task ID / task key | absent | task_key | taskId |
| Attempt ID | absent | separate attempt subsystem | required by A0 |
| Cost class / route / quota domain | absent | absent | present in request, not owner-approval binding |
| Expiry / trusted time | no enforcement | expiry column; now supplied to adapter | no expiry field in expected binding |
| Signature/issuer | canonical GitHub API evidence, no JWT issuer | caller-supplied binding | injected verifier only |
| Dispatch | false | false | false |

Do not silently equate repository ID with tenant ID, approval comment with task ID, or task ID with attempt ID. The task-level approval and execution-attempt identity likely belong to separate lifecycle stages; the normative contract must define when attempt ID is minted and what the owner actually approves. Cost/route/quota domain must be bound into approval before any provider execution is allowed.

## 5. Recommended composition boundary (design decision, not implementation)

1. Treat PR #55 verifier as a read-only evidence adapter. The composition root must bind the native `GITHUB_EVENT_PATH` and `GITHUB_EVENT_NAME`, immutable `GITHUB_REPOSITORY`/repository ID, pinned approver ID and issue allowlist, and a least-privilege GitHub API client. No caller-supplied policy or event object may be treated as trusted deployment configuration.
2. Define a versioned canonical owner approval envelope with at minimum: owner numeric ID, repository numeric ID, issue ID and number, comment ID, nonce, task key, target SHA, profile, tenant identity, cost class, route ID, quota domain, issued-at, expiry, schema version and canonical digest. Decide whether attempt ID is minted after task claim; do not ask the owner to approve an unknown attempt.
3. Add durable nonce replay prevention to D1 (e.g. non-null nonce + unique scope index) and atomically persist verified approval + consume it + create/attach logical task + task-level outbox in one transaction. Define deterministic duplicate/replay outcomes and rollback tests. The exact nonce scope (repository-wide vs owner/repository) must be explicit.
4. Use the existing migration 0003 logical task and outbox trigger only after its schema is reconciled; preserve append-only provenance and queue-only behavior. Keep `dispatch:false`.
5. Transplant source from old PR #55/#39 only into a fresh branch based on the current accepted baseline after the canonical contract is approved internally; do not merge stale/diverged branches.
6. Before real invocation, prove that workflow runs only on trusted default-branch code, event source is native, permissions are least-privilege, comment edits/deletions/reposts fail closed, D1 nonce uniqueness is concurrency-safe, and no API token reaches model/worker payloads.

## 6. Governance and operational blockers

- Issue #1 remains OPEN. Ruleset evidence in its body records PR-required governance but 0 required approvals; zero required approvals is not independent security review. The classic branch endpoint's `protected:false` is distinct from the active Ruleset evidence. Dispatch remains explicitly false.
- Issue #38 remains OPEN; its acceptance requires a real one-winner durable claim backend and security review, not label-only serialization.
- PR #55 and PR #67/68 have no formal independent reviews. The PR #39 COMMENTED reviews are not APPROVED and explicitly state reviewer independence/authority NOT VERIFIED.
- No issuer owner, key custodian, revocation owner or operational audit owner has been qualified for a separate Recovery Actor. This audit does not infer that an A0 GitHub owner comment automatically authorizes projection recovery.
- No hosted D1 entitlement, production OAuth, Jarvis API, live worker, provider route/quota or executor profile was tested.

## 7. Next bounded step

Do not build a JWT issuer and do not dispatch. First create a normative A0 owner-approval-to-D1 composition contract and migration/test plan that resolves the table in section 4, including nonce scope, task/attempt lifecycle, tenant identity, cost/route authorization, trusted time and the read-only GitHub event adapter trust boundary. Then implement a local-only proof on a fresh branch from the current baseline with negative-first tests. Keep provider calls, hosted resources and dispatch disabled.

## Disposition

- PR #55 verifier: VERIFIED as an isolated synthetic read-only event evidence proof only.
- PR #39 D1 claim/outbox: VERIFIED as a narrow local transaction proof only; not production/remote qualification.
- PR #67 A0/D1: VERIFIED local component tests; composition NOT IMPLEMENTED.
- PR #68 contract/matrix and runner inventory: VERIFIED exact-head CI/read-only inventory only.
- A0 owner-approval to D1 single-use admission: NOT IMPLEMENTED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No secrets, dispatch, provider calls, hosted resources, deployment, billing changes, merge or source-code changes occurred.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
