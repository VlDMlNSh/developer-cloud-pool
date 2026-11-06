# Pool Claim + Transactional Outbox Contract v1.0.0

Status: PROPOSED / DESIGN ONLY / NOT IMPLEMENTED / NOT ACCEPTED  
Date: 2026-11-07  
Applies to: Cloud Development Pool Contour A only  
Tracking: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)  
Related: [PR #36](https://github.com/VlDMlNSh/developer-cloud-pool/pull/36), [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)

## 1. Purpose and non-goals

Define a versioned contract for a durable, single-use approval claim and transactional outbox. This contract is a design artifact. It does not authorize a Cloudflare resource, Worker deployment, GitHub dispatch, provider call, secret creation, or production integration.

The contract distinguishes:
- authorization uniqueness: at most one claim identity is accepted for one signed approval;
- durable enqueue: a successful claim and its outbox task are committed atomically;
- delivery attempts: pending work is delivered at least once with bounded retry;
- effect idempotency: repeated worker attempts do not duplicate supported downstream effects;
- fenced acknowledgement: an expired/stale worker cannot complete a task after a newer lease generation exists.

**Exactly-once external side effects are not guaranteed** unless the downstream system itself supports a stable idempotency key or an equivalent deduplication protocol. D1 atomicity alone does not create exactly-once execution.

## 2. Immutable binding and approval envelope

A trusted approval issuer creates a signed envelope. The caller does not choose or assert its own trusted owner identity, issuer, timestamp, profile, or repository authority.

Required signed claims:
- `version`: exactly `pool-approval/v1`;
- `issuer`: stable issuer identifier;
- `key_id`: signing key identifier;
- `audience`: exact claim service audience;
- `jti`: globally unique approval identifier (1–128 ASCII characters);
- `owner_numeric_id`: numeric GitHub owner ID derived from a verified identity response;
- `repository_id`: numeric repository ID;
- `issue_number`: positive integer;
- `target_sha`: lowercase 40-hex immutable commit SHA;
- `profile`: exact allowlisted profile identifier;
- `payload_digest`: SHA-256 digest of canonical approved task payload;
- `issued_at`, `expires_at`: integer Unix seconds;
- `scope`: explicit bounded action set, never an unrestricted dispatch permission.

Signature requirements:
1. Canonical serialization must be specified and versioned; compute `envelope_digest` over the exact canonical signed bytes.
2. Verify signature, issuer allowlist, key ID, audience, version, time bounds, maximum TTL, and revocation before touching the ledger.
3. The issuer private key remains outside Supervisor, Worker, and D1. Verifiers receive only pinned public keys.
4. Key rotation, compromise, revocation, and clock-skew policy must be documented before production.
5. The claim service uses a trusted server clock. Client-supplied `now` is never accepted.
6. Owner and repository IDs are independently checked against authenticated GitHub identity/context; values copied from the request body are not authority.

The current local proof accepts caller-supplied owner ID, digest and time and has no issuer/signature verification. It therefore does not meet this contract.

## 3. Stable identity and idempotency

Derive a stable claim identifier from signed issuer identity, `jti`, and envelope digest using a specified unambiguous encoding, e.g. SHA-256 over length-prefixed fields. Do not accept a fresh client-generated claim ID on retry.

- `approval_id = (issuer, jti)` is unique.
- `claim_id` is deterministic for the signed approval.
- `idempotency_key = claim_id` for the logical task.
- A retry with the same approval must resolve to the same claim and task.
- A different envelope digest, owner, repository, issue, target SHA, profile, audience, or issuer for an existing `approval_id` is a hard conflict and is denied.
- Never create a second task merely because the first HTTP response was lost.

## 4. Logical state model

### Approval

`READY -> CLAIMED`  
`READY -> REVOKED`

No transition from CLAIMED back to READY. A claimed approval is never reissued as a fresh approval. Expiry blocks a new claim; it does not erase an already committed task. Revocation after claim follows the explicit task cancellation policy below.

### Outbox task

`PENDING -> LEASED -> COMPLETED`  
`LEASED -> PENDING` on expired lease / retryable failure  
`PENDING|LEASED -> DEAD_LETTER` after bounded attempts or permanent failure  
`PENDING -> CANCELLED` only under the defined post-claim revocation policy

A task is never silently deleted to represent completion. State transitions must be auditable.

## 5. Proposed D1 schema (not a migration)

The following is a reviewable logical schema. It must be adapted and tested against the selected D1/SQLite runtime before implementation. Integer timestamps are Unix seconds. All identifiers and digests are opaque, validated values.

```sql
CREATE TABLE pool_approvals_v1 (
  approval_id TEXT PRIMARY KEY NOT NULL,
  issuer TEXT NOT NULL,
  key_id TEXT NOT NULL,
  envelope_digest TEXT NOT NULL CHECK (
    length(envelope_digest) = 64 AND envelope_digest NOT GLOB '*[^0-9a-f]*'
  ),
  owner_numeric_id TEXT NOT NULL CHECK (
    length(owner_numeric_id) > 0 AND owner_numeric_id NOT GLOB '*[^0-9]*'
  ),
  repository_id TEXT NOT NULL CHECK (
    length(repository_id) > 0 AND repository_id NOT GLOB '*[^0-9]*'
  ),
  issue_number INTEGER NOT NULL CHECK (issue_number > 0),
  target_sha TEXT NOT NULL CHECK (
    length(target_sha) = 40 AND target_sha NOT GLOB '*[^0-9a-f]*'
  ),
  profile TEXT NOT NULL,
  payload_digest TEXT NOT NULL CHECK (
    length(payload_digest) = 64 AND payload_digest NOT GLOB '*[^0-9a-f]*'
  ),
  issued_at INTEGER NOT NULL CHECK (issued_at > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > issued_at),
  status TEXT NOT NULL CHECK (status IN ('ready', 'claimed', 'revoked')),
  claim_id TEXT UNIQUE,
  idempotency_key TEXT UNIQUE,
  claimed_at INTEGER,
  revoked_at INTEGER,
  CHECK (
    (status = 'ready' AND claim_id IS NULL AND idempotency_key IS NULL
      AND claimed_at IS NULL AND revoked_at IS NULL)
    OR
    (status = 'claimed' AND claim_id IS NOT NULL
      AND idempotency_key = claim_id AND claimed_at IS NOT NULL
      AND revoked_at IS NULL)
    OR
    (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE TABLE pool_outbox_v1 (
  task_id TEXT PRIMARY KEY NOT NULL,
  approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approvals_v1(approval_id),
  claim_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_digest TEXT NOT NULL CHECK (
    length(payload_digest) = 64 AND payload_digest NOT GLOB '*[^0-9a-f]*'
  ),
  state TEXT NOT NULL CHECK (
    state IN ('pending', 'leased', 'completed', 'dead_letter', 'cancelled')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  lease_owner TEXT,
  lease_expires_at INTEGER,
  next_attempt_at INTEGER NOT NULL,
  last_error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  CHECK (
    (state = 'leased' AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL)
    OR
    (state <> 'leased' AND lease_owner IS NULL AND lease_expires_at IS NULL)
  ),
  CHECK (
    (state = 'completed' AND completed_at IS NOT NULL)
    OR
    (state <> 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX pool_outbox_v1_pending
  ON pool_outbox_v1(state, next_attempt_at, created_at);

CREATE INDEX pool_outbox_v1_expired_lease
  ON pool_outbox_v1(state, lease_expires_at);
```

Schema review items before implementation:
- Confirm SQLite CHECK behavior and D1 foreign-key enforcement in the exact runtime.
- Define max lengths and character sets for all opaque identifiers.
- Decide whether approval revocation can cancel only PENDING tasks or also invalidate LEASED tasks; default safe policy: cancel PENDING, flag LEASED for cooperative cancellation, never claim an already-started external side effect was undone.
- Define retention/archival and backup/restore invariants.
- Add an append-only event ledger with constrained event types and payload digests. A table inside the same database is not tamper-proof against a privileged database writer; security-relevant audit evidence must also be exported to an independently controlled sink.

## 6. Atomic claim + outbox protocol

The implementation must use one D1 `batch()` transaction for approval transition, outbox insertion, and the corresponding audit event. Do not split these into independent HTTP requests or separate transactions.

Preconditions before batch:
- signed envelope and all claims verified;
- server-derived identity and server clock validated;
- payload digest and immutable target verified;
- deterministic `claim_id` and `task_id` computed;
- profile and scope allowlisted;
- quotas/reservation budget checked without treating an untrusted caller value as accounting authority.

Logical SQL sequence:
1. Conditional UPDATE of exactly one matching READY approval to CLAIMED, binding every signed field and `expires_at > server_now`. It sets the deterministic claim ID and claimed timestamp.
2. Conditional `INSERT ... SELECT` of the outbox task from that exact approval row, requiring status CLAIMED, matching claim ID, digest, and immutable bindings. A competing different claim ID selects no row.
3. Insert a claim audit event tied to the task and claim ID.
4. Verify each statement's result metadata. A successful batch with zero changed/inserted rows is not authorization.
5. Read back by the same `approval_id` and `claim_id`. Return ALLOW/ACCEPTED only if exactly one matching outbox task exists and every immutable field matches.
6. On a lost/ambiguous response, perform a primary-consistent read by the same deterministic `claim_id`. If the exact task exists, return its existing state. If absent, deny or retry the same deterministic claim transaction. Never mint a new claim ID.
7. A duplicate or conflicting unique-key result must be resolved by exact read-back; never convert an arbitrary SQL conflict into ALLOW.

The claim transaction does not call GitHub Actions, providers, model APIs, or external executors. It only records durable authority and work intent.

## 7. Lease, fencing, retry and acknowledgement

Lease acquisition is a conditional database transition:
- eligible task is PENDING with `next_attempt_at <= server_now`, or LEASED with `lease_expires_at <= server_now`;
- update state to LEASED, set a fresh opaque lease owner, increment `lease_generation`, set bounded `lease_expires_at`, increment attempt count;
- exactly one competing dispatcher may own a given generation;
- all times come from the server; leases have a maximum duration and heartbeat policy.

Worker payload contains only task ID, immutable target/profile/payload digest, idempotency key, lease generation and minimum required task data. It does not receive approval issuer private material, D1 admin credentials, broad GitHub write authority, or unrelated provider secrets.

Acknowledgement must condition on task ID, state LEASED, exact lease owner and exact current lease generation. Stale generation is rejected. A task may be COMPLETED only after the executor reports a verifiable terminal result. If the downstream operation is not idempotent, retry policy must route ambiguous outcomes to NEEDS_REVIEW rather than automatically repeat the side effect.

Retry policy:
- bounded attempts and bounded exponential backoff with jitter;
- permanent validation/security failures go to DEAD_LETTER or NEEDS_REVIEW immediately;
- expired lease can be reclaimed with a higher generation;
- no unbounded retry loops;
- every transition records a reason code and audit event.

## 8. Deterministic local adversarial test contract

A local Workers-runtime suite must be deterministic, isolated and independent of external services. Use a fixed synthetic clock injected only through a test clock adapter; production code must not accept client-supplied time. Add explicit failpoints around transaction boundaries.

Required assertions:
1. 12 and 100 concurrent different claim IDs for one approval: exactly one accepted claim and one outbox task.
2. Concurrent identical retries: all successful responses resolve to one identical claim/task; exactly one outbox row.
3. Same approval ID with altered envelope digest or any immutable binding: conflict/deny; no second task.
4. Expired, revoked, wrong issuer, wrong key ID, wrong audience, bad signature, malformed canonicalization: deny before ledger transition.
5. Failure in outbox insert or audit insert: batch rolls back approval transition and no outbox row remains.
6. Lost response simulated after successful commit: read-back with same claim ID returns the same task, no duplicate.
7. Lost response before commit: read-back is empty and same deterministic retry can claim once.
8. Crash after claim commit before dispatcher start: pending outbox task survives restart and is delivered later.
9. Concurrent lease acquisition: exactly one current lease generation.
10. Expired lease: a new generation is issued; old worker acknowledgement is rejected.
11. Duplicate worker delivery with same idempotency key: downstream test adapter observes one logical effect.
12. Lost downstream response: do not duplicate an effect; use downstream idempotency or transition to manual review.
13. Retry ceiling: bounded attempts then DEAD_LETTER; no infinite loop.
14. Revocation before claim denies; revocation after claim follows explicit cancellation semantics.
15. Clock skew, missing clock, storage unavailable, overload and ambiguous read: fail closed.
16. Backup/restore and process interruption: consumed approvals do not become READY and completed effects are not replayed without idempotency proof.

For each test retain: exact source SHA, runtime version, migration digest, test case ID, concurrency count, state before/after, number of outbox rows, winning claim ID (synthetic only), and result. Do not log tokens, signatures, private keys, personal data or live approval envelopes.

Local tests prove implementation behavior only in the local Workers runtime. A separate isolated real-D1 qualification is required before any production decision.

## 9. Trust boundaries and permissions

- Approval issuer: authenticates owner action and signs bounded approvals. No execution permission.
- Claim API: verifies signatures and performs atomic ledger/outbox writes. No provider/model secrets and no unrestricted GitHub dispatch permission.
- Supervisor/dispatcher: leases already approved tasks; no authority to mint approvals or modify issuer keys.
- Worker: executes one immutable approved task under narrow profile/capability; no ledger administration or broad repository write.
- Audit sink: independently controlled from the claim database writer.
- Operator: can revoke/inspect under audited procedures; cannot silently rewrite history.

PR #37's reusable Worker boundary is a separate necessary control, not a substitute for this durable claim contract. The current PR #37 implementation uses GitHub Issue labels as a claim mechanism and has no D1 outbox integration. Its changes remain unmerged.

## 10. Quotas, retention and recovery

Before live backend testing, specify:
- maximum outstanding approvals/tasks per owner, repository and profile;
- daily task/attempt/row-write budget and hard stop behavior;
- retention for consumed/revoked approvals, completed tasks and audit metadata;
- backup frequency, restore point objective, restore test cadence and access control;
- behavior after database deletion, restore to stale snapshot, account suspension, quota exhaustion or prolonged outage;
- operator runbook for reconciliation of PENDING, LEASED, COMPLETED and ambiguous external effects.

A restored snapshot must not silently resurrect consumed approvals or re-run completed non-idempotent effects. If this cannot be guaranteed, restoration must pause dispatch and require reconciliation.

## 11. Qualification gates

No implementation/deployment until all are satisfied:
- [ ] independent review of this contract and threat model;
- [ ] deterministic local adversarial tests pass on exact source SHA;
- [ ] exact-head CI and dependency lockfile reproducibility verified;
- [ ] Cloudflare account-specific Free/card-free eligibility verified from permitted non-secret evidence;
- [ ] isolated live D1 backend authorized and provisioned;
- [ ] live contention, ambiguous-response, recovery, lease/fencing, backup/restore tests pass;
- [ ] issuer identity, key custody/rotation/revocation and trusted clock qualified;
- [ ] quotas, audit sink, least-privilege boundaries and recovery runbook accepted;
- [ ] governance Ruleset enforces independent review;
- [ ] dispatch remains disabled until a separate explicit acceptance decision.

## 12. Current evidence and disposition (2026-11-07)

- Default branch `Основной` HEAD verified: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #36: OPEN / DRAFT / UNMERGED; head `1e278b1601b8a77131118aa5c627c07d663b0e51`. Exact-head D1 proof run `42276981988` / job `128095703539` SUCCESS; Pool Contract run `42276982111` / job `128095703972` SUCCESS. Reviews 0; inline threads 0.
- PR #37: OPEN / DRAFT / UNMERGED; head `5587a4e013507b5be330fd0c49ce1fc836faa946`. Exact-head reusable Worker boundary run `42284051309` and Pool Contract run `42284051311` SUCCESS. Reviews 0; inline threads 0.
- The committed lockfile exists at PR #36 HEAD: `proofs/d1-ledger/package-lock.json`, blob `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`. The CI uses `npm ci` without regenerating the lockfile. However, `proofs/d1-ledger/README.md` still incorrectly says the lockfile is absent/uncommitted; that stale statement needs correction on the PR branch before review/merge.
- PR #36 implementation report has older historical passages saying lockfile was not committed; later passages document it as committed. Treat the later exact-head evidence as authoritative and correct the stale README/report wording in a dedicated PR update.
- Cloudflare Free/card-free account entitlement remains NOT VERIFIED. No live D1 exists. Independent security review NOT RUN. Active ruleset last audited had required approvals 0 and CODEOWNERS review false; re-audit before merge.
- No production claim/outbox code, live D1, Worker, dispatch, provider/model call, billing/profile access, secret read, or resource provisioning was performed for this contract.

Disposition: PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED / NOT ACCEPTED. Contour A remains BLOCKED; Contour B remains DEFERRED.
