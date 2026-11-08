# Integrated single-use claim, lease and outbox protocol — ADR and threat model

- Date: 2026-11-08
- Status: PROPOSED DESIGN; NOT IMPLEMENTED; NOT QUALIFIED; NOT AUTHORIZED FOR DISPATCH
- Scope: Composition boundary for PR #36 (D1 approval ledger), PR #39 (atomic claim/outbox proof), PR #37 (GitHub Supervisor/reusable Worker boundary), and Issue #38.
- Target: docs/cross-chat-continuation-2026-11-06; draft branch only, not default branch.
- Last observed default HEAD: 197ba98d0dc7d8437d759dd25bee8750d02e59ae. Re-read all live refs before implementation.

## 1. Decision

Do not integrate existing adapters or enable dispatch. Current PRs prove separate properties, not one end-to-end authority chain:

- PR #36 conditionally consumes a row, but identity binding and time are caller inputs in the proof; issuer authenticity and principal-derived owner/repository are absent.
- PR #39 atomically consumes approval, inserts claim and pending outbox in its local Workers-runtime proof. Leases, fencing, delivery, retry, dead-letter, crash recovery and consumer are absent.
- PR #37 claims through GitHub Issue label GET/PATCH/read-back. This is not compare-and-swap or authoritative durable state. Worker does not verify consumed D1 approval or outbox event.
- GitHub workflow concurrency serializes runs only within its concurrency group; it does not prevent another actor/workflow changing an Issue.

Target one authoritative durable state machine. GitHub Issues are intake/display only. A committed claim/outbox event does not mean a Worker started or external effects completed.

D1 remains the preferred candidate under the existing storage ADR, subject to independent review and real-backend qualification. This document authorizes no D1 provisioning, deployment, paid fallback, code integration, secret access or dispatch.

## 2. Security objectives and invariants

1. **Authenticated issuer:** every approval is authenticated against a configured issuer trust root and key lifecycle. Caller-supplied owner, repository, actor, profile, timestamp or digest fields are not proof.
2. **Principal-derived scope:** owner/repository IDs come from authenticated GitHub/OIDC context and are checked against an explicit allowlist. Numeric IDs are canonical; names are display-only.
3. **Canonical envelope:** approval signs a versioned canonical payload containing approval ID, issuer/key ID, owner ID, repository ID, issue number, immutable target SHA, worker profile, capability set/digest, request digest, issued-at, not-before, expiry, nonce and policy version.
4. **Trusted time:** server-side trusted clock evaluates not-before, expiry and revocation. Client-provided now is forbidden. Clock uncertainty/failure fails closed.
5. **Single authoritative claim:** one D1 transaction conditionally changes approval ready→consumed, inserts exactly one claim and one outbox event, and records immutable binding. Labels, workflow runs and client responses are never alternative authority.
6. **No resurrection:** consumed, expired, revoked, cancelled or ambiguous approvals never return to ready. Retry retrieves the same claim/event only when the complete immutable binding matches.
7. **Fenced execution:** each lease acquisition increments a monotonic generation/fencing token. Every heartbeat and acknowledgement is conditional on claim ID, generation, worker identity and lease validity. Stale generations cannot mutate state.
8. **At-least-once delivery, idempotent execution:** outbox delivery may repeat. Worker effects use stable task/operation idempotency keys. Exactly-once external side effects are not assumed.
9. **Least privilege:** issuer, intake, ledger, dispatcher, Worker and finalizer have distinct minimal capabilities. Dispatcher cannot issue approvals; Worker cannot mint claims or alter GitHub task labels; UI cannot change authoritative state.
10. **Auditability:** append-only redacted events record principal, policy version, claim/event IDs, generation, timestamps, decision and reason. No credential/private-key material or raw secrets.
11. **Fail closed:** storage errors, mismatched uniqueness conflicts, invalid signatures, unknown key IDs, clock failure, quota exhaustion, lease ambiguity and unverifiable acknowledgements cannot cause dispatch.
12. **No cross-account authority bleed:** provider accounts, credentials, quotas, issuer identities and worker profiles remain separately scoped.

## 3. Actors and authority boundaries

| Actor | Allowed authority | Explicitly forbidden |
|---|---|---|
| Approval issuer | Sign bounded approval for allowlisted task | Execute, dispatch, alter ledger directly |
| GitHub intake adapter | Read trusted event context; validate metadata; submit signed envelope | Treat labels as authorization; choose arbitrary SHA/profile |
| Approval verifier + ledger API | Verify signature/policy; atomic consume/claim/outbox | Dispatch or call providers |
| Outbox dispatcher | Lease pending events; deliver bounded signed invocation | Create approvals or alter immutable binding |
| Worker | Verify invocation and lease/fencing token; execute bounded task; submit idempotent result | Claim from labels, change approval, self-extend authority |
| Finalizer | Record terminal result conditionally; update non-authoritative presentation | Reopen approvals or override ledger |
| Human reviewer | Audit and approve governance changes | Bypass issuer, ledger, lease or policy |

GitHub workflow identity (workflow_ref, workflow_sha, repository ID, caller/callee identity) is defense-in-depth, not a replacement for signed approval and ledger claim. Worker validates both immutable invocation provenance and durable claim envelope.

## 4. Canonical approval envelope

Exact wire format is a pre-implementation gate. It must define schema_version, approval_id, issuer_id, key_id, policy_version, owner_id, repository_id, issue_number, target_sha, worker_profile, sorted capability identifiers and digest, request_digest, issued_at, not_before, expires_at, unique nonce, signature algorithm and signature over canonical bytes.

Rules:
- Reject unknown versions, duplicate keys, non-canonical encodings, invalid UTF-8, unexpected fields, unsupported algorithms and non-allowlisted capabilities.
- Derive owner/repository from authenticated GitHub context and compare to signed envelope; never accept the envelope as its own authentication context.
- Bind full immutable commit SHA, not branch/tag. Verify it belongs to the approved repository under explicit policy.
- Bind profile/capabilities to server allowlist; a signed over-broad request is denied.
- Store only minimum envelope/digest and audit fields. Define retention/access controls before implementation.

## 5. Authoritative state machine

Approval: ready→consumed; terminal denial states expired, revoked, cancelled. No transition out of consumed.

Claim: queued→leased→running→succeeded | failed | needs_review | cancelled. Recovery may move leased→queued only after trusted expiry check; next lease increments generation. Ambiguous running execution moves to needs_review unless safe idempotent continuation is proven.

Outbox: pending→leased→delivered. Failures increment bounded attempt metadata and eventually dead_letter. Delivery is not proof of execution success.

Approval consume, claim insert and outbox insert are one transaction. Unique constraints enforce one claim and outbox per approval. Transaction compares every immutable binding field and server time. If response is lost after commit, retry returns same claim/event only for equivalent signed envelope and binding.

### Transaction boundary

1. Authenticate caller and derive principal from trusted execution context.
2. Validate canonical envelope signature, key status, repository allowlist, policy, profile, capabilities and target SHA.
3. Evaluate not-before, expiry and revocation using trusted server time.
4. In one D1 transaction: conditionally consume approval; insert claim; insert outbox event; append redacted audit event.
5. Read back committed claim/outbox/audit identity and verify immutable binding.
6. Return receipt with claim ID, event ID, binding digest and state. Receipt is not a dispatch credential.
7. Separate dispatcher leases outbox event and sends signed short-lived invocation token.

No GitHub label write occurs inside authorization transaction. Labels update asynchronously for presentation and may be stale without changing authority.

## 6. Lease, fencing and acknowledgement

A claim lease includes lease_owner, lease_expires_at, generation, heartbeat_at and bounded attempt_count.

- Lease acquisition is a conditional database update requiring queued claim or expired lease, matching expected generation and immutable binding. It increments generation atomically.
- Renewal requires claim ID, current generation, worker identity and unexpired lease. It cannot change task binding or capability.
- Every invocation token binds claim ID, event ID, generation, worker identity, target SHA, profile, capability digest, issued-at and short expiry.
- Worker start acknowledgement is conditional on current generation. A stale Worker cannot acknowledge or overwrite a newer generation.
- Completion acknowledgement is idempotent and conditional on generation, task digest and result digest. Identical duplicate returns recorded result; conflicting result becomes needs_review.
- If a Worker may have performed a non-idempotent external action before losing lease, automatic re-execution is forbidden until reconciled. Exactly-once external effects are not promised.
- Lease duration, heartbeat cadence, max attempts, retry backoff and clock-skew allowance must be explicit, bounded and tested. No infinite renewal.

## 7. Outbox delivery and crash recovery

Dispatcher is a separate least-privilege component:
- Atomically lease pending outbox rows with generation/fencing token.
- Deliver at least once; persist attempt number, last error code, next-attempt time and receipt.
- Use deterministic event ID as idempotency key at Worker.
- Retry transient transport errors with bounded exponential backoff/jitter; do not retry permanent validation/policy errors.
- Exhausted or ambiguous events move to dead_letter / needs_review with audit evidence.
- Crash before delivery: lease expiry permits safe re-lease with new generation.
- Crash after delivery but before receipt persistence: redeliver; Worker deduplicates event ID and binding digest.
- Worker crash: generation fencing blocks stale acknowledgements. Resume only when effects are idempotent; otherwise reconcile.
- Dead-letter replay is privileged/audited and preserves original approval/task binding. It cannot mint approval or change SHA/profile/capabilities.

## 8. Threat model

| Threat / failure | Required control | Residual risk / evidence |
|---|---|---|
| Forged/replayed approval | Signature, nonce/unique ID, one-time consume | Key compromise; rotation/revocation tests |
| Forged owner/repository | Derive principal from OIDC/GitHub; compare immutable IDs | Trust in identity claims/workflow provenance |
| Moving target branch | Full commit SHA and repository policy | Commit availability/transfer policy |
| Client clock manipulation | Trusted server clock; fail closed | Clock dependency and skew tests |
| Concurrent consumers | D1 conditional update, uniqueness, transaction | Real remote D1 test required |
| GitHub label race | Labels are presentation only | UI can be stale; no auth impact |
| Duplicate outbox delivery | Stable event ID and Worker idempotency | External APIs may lack idempotency |
| Lease expires while old Worker runs | Generation fencing on every mutation | In-flight external effect may need reconciliation |
| Dispatcher crash | Lease expiry, retry, dedupe, dead-letter | Bounded recovery/visibility |
| Worker crash after side effect | Idempotency key or needs_review | Exactly-once effects not promised |
| D1 quota/outage | Fail closed, bounded retry, no paid fallback | Availability loss; prove no fallback |
| Issuer key compromise | Key ID, rotation/revocation, short TTL, audit | Emergency revocation/blast-radius test |
| Privilege escalation | Split identities, narrow permissions, allowlists | Review actual GitHub/Cloudflare grants |
| Audit tampering | Append-only model, restricted writer | Independent retention/tamper review |
| Cross-repository/account mix-up | Numeric IDs and per-scope quotas | Transfer/fork/account-separation tests |

### Trust assumptions

- GitHub OIDC issuer and claims are trusted only after issuer, audience, subject, repository ID, workflow identity and immutable SHA validation.
- Signing private key is held by dedicated issuer boundary; never exposed to Worker, client, repository content or logs.
- D1 transactional/consistency guarantees are verified against current docs and disposable remote test.
- Trusted server time exists and failure behavior is known.
- Human governance and independent review are not replaced by CI success.

## 9. Required tests and evidence

### Unit / contract
Signature valid/invalid; unknown/revoked/rotated key; canonicalization ambiguity; malformed envelope; unknown policy; capability escalation; wrong owner/repository/issue/SHA/profile/capability/request digest; duplicate nonce; expiry/not-before boundaries; clock unavailable/skew; duplicate consume and ambiguous commit response; uniqueness and rollback across consume/claim/outbox/audit.

### Concurrency / backend
- At least 50 concurrent claim attempts against one approval: exactly one claim and event.
- Concurrent attempts across approvals/repositories: isolation and quota accounting.
- Competing lease acquisition: exactly one current generation.
- Stale heartbeat/start/completion rejected.
- D1 busy/lock, quota exhaustion, transient 5xx, connection reset and ambiguous commit.
- Run against disposable real D1 before remote qualification; Miniflare is necessary but insufficient.

### Recovery / end-to-end
Dispatcher crash before send, after send, before receipt persistence and during retry; Worker crash before/during/after effect and before acknowledgement; lease expiry with old Worker heartbeat/ack; dead-letter and audited replay; immutable binding; duplicate event/completion; external Issue label edits have no authorization effect; negative paths prove no provider call, execution, secret read or dispatch.

### Security / governance
- Independent reviewer examines issuer, identity derivation, signature format, D1 transaction, lease/fencing, idempotency, permissions, audit and recovery.
- Protected branch requires at least one authorized independent approval; CODEOWNERS/reviewer identity configured. Zero required approvals is insufficient.
- Exact-head CI after final code/docs changes; path filters must not leave tested source head ambiguous.
- Retain artifact digests, run IDs, target SHA, environment and logs without credentials.
- Verify current Cloudflare Free/no-card entitlement, D1 limits, isolation and credential ownership without reading secret values or changing billing.
- Governance approval is separate from author self-review.

## 10. Rollout and kill switches

Each phase requires separate written authorization:
1. Contract/threat-model review only.
2. Local D1/Workers-runtime implementation on isolated branch; inert, unmounted from Hono/Supervisor/production workflows.
3. Independent security review and exact-head CI.
4. Disposable remote D1 qualification only after no-card entitlement and isolation verified.
5. Read-only shadow evaluation with no dispatch/provider calls.
6. Explicitly authorized limited execution with repository allowlist, bounded quotas and operator kill switch.
7. Broader rollout after measured recovery, audit, cost and security acceptance.

Kill switches: server-side fail-closed dispatch disabled by default; issuer key revocation; repository/profile disable; dispatcher stop; Worker invocation rejection. Kill switches never erase claims, outbox rows or audit history.

No rollout phase is approved here. Do not infer current live gate values from historical reports.

## 11. Blockers and non-decisions

No exact signature library/algorithm or canonical serialization selected before crypto review. GitHub OIDC alone is not assumed to be approval issuer; human/policy approval provenance needs signed assertion. Labels, workflow concurrency and branch refs are not CAS. Account-specific D1 no-card eligibility remains unverified. Lease durations, retry limits, retention and quota numbers are not selected.

No production code, migrations, workflows, permissions, secrets, variables, resources or deployments are changed by this document. No agent dispatch, Worker execution, DSH, Resource Probe or provider/model call is authorized.

## 12. Acceptance checklist

- [ ] Independent architecture/security reviewer approves threat model and authority separation.
- [ ] Signed envelope and trusted issuer contract finalized.
- [ ] Principal derivation and repository allowlist specified/testable.
- [ ] D1 schema/state transitions, lease/fencing and outbox reviewed together.
- [ ] Idempotency and ambiguous external-effect handling explicit.
- [ ] Test matrix and remote D1 qualification plan approved.
- [ ] GitHub permissions/governance enforce independent review.
- [ ] Free/no-card entitlement and isolated disposable resource path verified.
- [ ] Explicit authorization for next implementation phase recorded.

Until gates pass: NOT IMPLEMENTED / NOT QUALIFIED / NOT AUTHORIZED; dispatch disabled; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## References

- PR #36: https://github.com/VlDMlNSh/developer-cloud-pool/pull/36
- PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Existing storage ADR: ./2026-11-06-durable-state-and-single-use-authorization-adr.md
- Context Window: ../context/GITHUB-CONTEXT-WINDOW.md


## 13. Mandatory alternatives analysis from Issue #38

Issue #38 requires comparison of three bounded claim designs. The D1 protocol above is a candidate design, not an exclusive decision, until this comparison and its evidence gates are satisfied.

| Option | Atomicity / contention guarantee | Privilege and operational cost | Recovery / audit | Current disposition |
|---|---|---|---|---|
| A. Serialized Supervisor + Issue labels | Workflow concurrency serializes only runs in the same group. Issue label GET/PATCH/read-back is not CAS and cannot prevent another actor/workflow changing labels. A single-writer governance rule reduces but does not eliminate races unless every writer is technically constrained. | Lowest infrastructure cost; requires strict control of every label writer and workflow identity. | GitHub issue history is useful but label state is mutable; interrupted claim reconciliation remains ambiguous. | REJECTED as an authoritative single-use claim primitive. May remain a presentation/intake layer only. |
| B. Dedicated state repository + immutable per-task reservation refs | Git ref creation has documented create semantics (201 success, 409 conflict, 422 validation failure), making create-only unique refs a plausible one-winner reservation primitive. It is not yet qualified as a formal CAS contract for this protocol. | Requires a separate repository, narrowly scoped Contents: write authority, and a credential/token boundary. Do not grant Contents: write to the existing Supervisor as a shortcut. | Must define deterministic ref name, immutable object content, binding digest, expiry/no-expiry, retry after ambiguous response, deletion/recreation prevention, audit and garbage collection. Ref deletion/recreation or force-update must be technically prevented, not merely discouraged. | CANDIDATE ONLY; NOT QUALIFIED. Requires isolated prototype, permission design and adversarial contention/recovery tests. |
| C. Conditional-write durable store (D1 candidate) | D1 conditional SQL updates, uniqueness constraints and a transaction can implement atomic consume + claim + outbox. Existing local Workers-runtime tests are not remote-backend proof. | Workers/D1 bindings and isolated database scope; account-specific Free/no-card entitlement and quota/isolation remain unverified. | Best relational fit for claims, leases, outbox, audit and recovery, provided remote transaction semantics and all failure paths are qualified. | PREFERRED CANDIDATE, NOT SELECTED FOR PRODUCTION and NOT QUALIFIED. |

### Decision rule

1. Keep Option A out of the authority path. A single-writer policy is a mitigation, not a durable CAS guarantee.
2. Evaluate Option B only as a bounded isolated proof. Do not broaden the current Supervisor's permissions; a separate state repository and narrowly scoped writer identity would be required. Test create races, duplicate retries, ambiguous HTTP response, deletion/recreation, ref mutation, repository transfer, stale reservation and recovery.
3. Continue Option C as the preferred local proof because the existing storage ADR selected D1 as the simplest relational candidate. This preference is provisional and does not override account eligibility, quota, security or real-backend gates.
4. Compare evidence, not feature descriptions. The chosen backend must demonstrate one-winner behavior under concurrent attempts, immutable binding, replay resistance, interruption recovery, auditability and least privilege.
5. If neither B nor C passes all gates, record the explicit decision **NO QUALIFIED CLAIM BACKEND — DISPATCH MUST REMAIN DISABLED**. Do not fall back to labels or paid infrastructure.

### Required comparative qualification evidence

- A common test contract runs the same logical scenarios against each viable candidate: concurrent first claim, duplicate same-binding retry, conflicting-binding retry, lost response after commit, interrupted claimant, stale worker, expiry, revocation, recovery, deletion/tamper attempt and audit reconstruction.
- For the selected backend, run at least 50 simultaneous contenders against one approval/reservation and prove exactly one durable winner. Repeat across independent approvals and repositories to test isolation.
- For ref reservations, prove server-side prevention of update/delete/recreate and define how branch/ref namespace permissions are enforced. If those guarantees cannot be enforced, reject Option B.
- For D1, run the concurrency/recovery suite against a disposable remote D1 instance only after Free/no-card entitlement, resource isolation and quota scope are verified. Local Miniflare results alone do not qualify it.
- Document residual risks and operational recovery procedures for each viable option. Independent reviewer must approve the comparative decision before implementation or dispatch.

### Issue #38 traceability

This section addresses the explicit three-design comparison and the prohibition on granting Contents: write to the current Supervisor. It does not close Issue #38: real backend contention, recovery tests, independent review and exact-head CI remain outstanding. The issue must remain open until its acceptance criteria are evidenced.
