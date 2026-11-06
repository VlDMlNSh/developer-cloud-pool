# D1 single-use claim and delivery recovery qualification plan — 2026-11-06

## 1. Scope and immutable evidence

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Tracking issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- D1 proof PR #36: OPEN / DRAFT / UNMERGED; head `1e278b1601b8a77131118aa5c627c07d663b0e51`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Exact-head D1 proof CI run `42276981988`, job `128095703539`: COMPLETED / SUCCESS. Read-back steps all succeeded: checkout, pinned Node 24.9.0, npm ci, syntax check, Workers-runtime tests, lockfile artifact upload.
- Exact-head Pool Contract CI run `42276982111`, job `128095703972`: COMPLETED / SUCCESS. Read-back: checkout without persisted credentials, dispatch-disabled assertion, YAML parse, security contract.
- PR #37 remains OPEN / DRAFT / UNMERGED at head `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- Voktors-Mini.Dlink remains the one operational SentinelX Free host (ID `host_5f7264034bdf0b51`); no host commands or changes were needed in this pass.

## 2. What the current proof actually guarantees

Source: `proofs/d1-ledger/src/consume.mjs`, blob `ef4f9693e1e2a378c08e974a65a8deb486af8712`; test blob `8c4af56fffd40e716a4f1f16632b99c0c4f72f33`; migration blob `a80524ed839b63dd6483978118619495fa550877`.

- One conditional SQL UPDATE transitions a matching row from ready to consumed.
- The adapter returns ALLOW_ONCE only if D1 reports success and exactly one changed row.
- 12 concurrent local Workers-runtime consumers produce one winner and eleven denials.
- Replay, field mismatch, expiry, malformed binding, missing storage and ambiguous storage exception deny.
- D1 batch rollback is tested locally.
- Successful consumption explicitly returns `dispatch: false`.
- This is local Miniflare/workerd evidence, not a live Cloudflare account/database test.

It does not guarantee that a consumed task is delivered or completed. A crash after consume and before worker start can strand the authorization. A timeout after commit but before the response creates an ambiguous outcome; blindly retrying the consume is unsafe and cannot distinguish a committed first attempt from a never-committed request.

## 3. Required semantic split

Do not label the end-to-end system exactly-once. Qualify these separate properties:

1. **Authorization uniqueness:** at most one claim record is accepted for one immutable approval/task identity.
2. **Durable delivery:** an accepted claim creates a durable pending work item in the same database transaction.
3. **At-least-once delivery attempts:** a dispatcher may retry pending/expired leases.
4. **Effect idempotency:** the executor must deduplicate external side effects using a stable task idempotency key and/or downstream idempotency support.
5. **Fenced completion:** only the current lease/fencing generation may acknowledge or advance task state.

Without idempotent downstream effects, exactly-once external side effects cannot be promised.

## 4. Candidate protocol to qualify (design only; not implemented)

### 4.1 Approval envelope

A trusted approval issuer must create a signed, short-lived envelope containing at least:
- unique approval ID / nonce (`jti`);
- issuer identity and issuer key ID;
- authenticated GitHub owner numeric ID, derived from a verified OAuth/App identity response rather than caller input;
- repository numeric ID, issue number, immutable target commit SHA, approved executor profile;
- canonical envelope digest;
- issued-at, expiry, audience, protocol version and explicit scope.

Use asymmetric signing if issuer and verifier are separate trust domains: private signing material stays only with the approval issuer; the Worker verifies with a pinned public key/key set. Key rotation, revocation, issuer compromise and clock-skew policy must be specified. Do not put issuer private keys or GitHub credentials in the Supervisor or executor.

### 4.2 Atomic claim plus transactional outbox

Proposed logical state:
- approval: `READY -> CLAIMED` or `REVOKED`;
- outbox task: `PENDING -> LEASED -> COMPLETED`, with retry/dead-letter states;
- claim has stable `claim_id`, task idempotency key, lease expiry, attempt count and monotonically increasing fencing generation.

A claim attempt should:
1. Verify envelope signature, issuer, audience, time bounds, immutable target and all identity bindings.
2. Generate a unique claim ID and task idempotency key.
3. In one D1 `batch()` transaction, conditionally update the approval row only if it is READY, unexpired, unrevoked and all bindings match; then insert the outbox row only if that exact claim ID is now present.
4. Treat the transaction as accepted only when both expected statements report success and the conditional update changed exactly one row. Any batch error must roll back the entire claim/outbox operation.
5. Return the existing claim state for a matching idempotent retry; do not mint a second task or interpret an ambiguous response as a fresh authorization.

Cloudflare documents D1 `batch()` as sequential transactional execution: if one statement fails, the sequence aborts/rolls back. This supports a claim-plus-outbox design, subject to testing exact SQL/runtime behavior. Source: https://developers.cloudflare.com/d1/worker-api/d1-database/

The actual SQL must be tested on a real isolated D1 database before this design is accepted. The plan does not assume local Miniflare proof is sufficient.

### 4.3 Delivery and recovery

- Dispatcher leases PENDING tasks using a conditional update and a monotonically increasing fencing generation.
- Worker receives only a task reference and immutable approved payload digest; no broad database, repository or secret access.
- Worker acknowledges with claim ID + current fencing generation. Stale workers cannot complete a task after a newer lease is issued.
- Expired lease returns to retryable pending state, with bounded attempts, backoff and dead-letter/manual review path.
- If the dispatcher times out after a possible commit, it reads by the original claim ID using a primary-consistent read path; it never creates a new claim ID for the same approval.
- External side effects use the stable idempotency key. If the downstream target has no idempotency mechanism, require a compensating/manual-review policy and explicitly do not promise exactly-once effects.
- Revocation semantics must define whether revocation blocks only new claims or can cancel already leased tasks. No ambiguous implicit revocation.

## 5. Required adversarial test matrix

All tests first run in local Workers runtime, then repeat against a provisioned isolated real D1 backend after account entitlement and explicit deployment authorization are verified.

| Test | Required assertion |
|---|---|
| 12/100 concurrent claims | exactly one claim/outbox pair |
| duplicate HTTP request / same idempotency key | returns same claim; no second outbox |
| two distinct claim IDs racing on one approval | one accepted |
| injected failure between conditional update and outbox insert | full transaction rollback |
| commit succeeds, response is dropped | primary read by same claim ID resolves outcome |
| process crash after claim, before dispatch | outbox remains pending and is delivered after restart |
| crash after lease, before worker starts | lease expires; new fencing generation can be issued |
| stale worker completion after re-lease | rejected |
| worker succeeds but acknowledgement response is dropped | retry does not duplicate external side effect |
| worker failure / repeated failure | bounded retry, then dead-letter/manual review |
| revoke before claim | deny |
| revoke after claim, before lease | follows explicit revocation policy |
| issuer signature/audience/key/expiry mismatch | deny |
| owner/repository/issue/target/profile/digest mismatch | deny |
| clock skew / missing trusted time | deny or manual review |
| backup restore / point-in-time recovery | no duplicate claim or resurrection of consumed approval |
| database overload / unavailable / ambiguous writes | fail closed; no new claim without primary read resolution |

Record concurrency count, winning claim ID, D1 result metadata, task transition history, artifact digest and exact backend identity. No personal or secret data in logs.

## 6. Governance, isolation and quota gates

Before any real-backend test:
- verify account-specific Workers/D1 Free entitlement and card-free eligibility using an authorized non-secret evidence source; current account subscription entitlement is NOT VERIFIED (prior API returned 403 due to missing Billing scopes; do not inspect billing profile/payment details or request paid fallback);
- verify exact Free quota and reset semantics; configure hard daily budgets and backpressure;
- create a dedicated isolated D1 database only after entitlement is verified and the user has authorized provisioning;
- bind a dedicated Worker identity with least privilege; Supervisor must not receive D1 admin or broad contents write;
- separate approval issuer, claim API, dispatcher and executor trust domains;
- publish a data retention, audit integrity, backup/restore and incident/revocation plan;
- require independent security review and exact-head CI after every code change.

No resources were provisioned, no billing was inspected, no secrets were read, and no deployment or dispatch occurred in this pass.

## 7. Decision and current disposition

- Candidate C remains the strongest technical direction for conditional single-use claims, but is **DESIGN CANDIDATE ONLY**.
- Current local D1 proof: VERIFIED for bounded local one-winner/replay/fail-closed behavior.
- Claim + outbox atomicity: NOT IMPLEMENTED / NOT TESTED.
- Delivery recovery, leases, fencing, downstream idempotency: NOT IMPLEMENTED / NOT TESTED.
- Real Cloudflare D1 contention and recovery: NOT RUN.
- Account-specific Free/card-free entitlement: NOT VERIFIED.
- Independent security review: NOT RUN.
- PR #36 and PR #37: OPEN / DRAFT / UNMERGED.
- Dispatch gates: KEEP FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.

## 8. Next bounded step

Implement no production code yet. First review this protocol against the existing PR #36 schema and PR #37 trust boundary, then produce a separate versioned contract/schema proposal and deterministic local adversarial tests for claim-plus-outbox, idempotent retry, leases and fencing. Only after those pass should account entitlement and a real isolated D1 test be considered. Keep dispatch disabled.

## References

- Cloudflare D1 database API and transactional batch semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/
- D1 result metadata: https://developers.cloudflare.com/d1/worker-api/return-object/
- D1 throughput and single-threaded database behavior: https://developers.cloudflare.com/d1/reference/faq/
- D1 retry behavior: https://developers.cloudflare.com/d1/observability/debug-d1/
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #36: https://github.com/VlDMlNSh/developer-cloud-pool/pull/36
- PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
