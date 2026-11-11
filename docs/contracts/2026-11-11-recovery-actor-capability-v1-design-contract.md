# Recovery Actor Capability v1 — design contract and negative-first test matrix

Date: 2026-11-11

## Status and immutable scope

- Status: DESIGN DRAFT / NOT IMPLEMENTED / NOT QUALIFIED.
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Implementation target audited: PR #67 head `dea09ffe94059f446c74fada37971087ec4878eb`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Documentation branch: `docs/projection-stack-reconciliation-2026-11-11`; this document is documentation-only and does not authorize source changes.
- Blocking source finding: `acquireAttemptLease(..., { resumable: true })` permits an expired still-running attempt takeover based on a caller-controlled boolean. It does not authenticate a Recovery Actor issuer, capability, scope or evidence. Existing local test explicitly exercises this path.
- Preserve PR #67 as DRAFT / UNMERGED. Do not enable dispatch, hosted D1, live provider calls or deployment. Independent technical/security/governance qualification remains deferred until after actual Cloud Pool launch, per owner direction.

## 1. Security objective

A Recovery Actor may resolve one exact durable reconciliation item only when it presents a separately authenticated, narrowly scoped, unexpired, single-use authorization and decision-specific evidence. A Worker, task payload, caller-provided boolean, issue comment, expired lease, or possession of a task identifier is never sufficient authority.

The contract separates:
1. **Authentication** — establish the issuer's cryptographic identity from a trusted issuer/key registry.
2. **Authorization** — verify the signed capability is for this resolver, this actor, this task/attempt/reconciliation tuple and exactly one permitted decision.
3. **Evidence validation** — validate the decision-specific evidence against a trusted evidence contract.
4. **Atomic consumption and state transition** — consume the one-time nonce and perform the guarded ledger transition as one database transaction.
5. **Audit** — append a durable, redacted decision record without storing bearer tokens or secret material.

Failure or ambiguity at any boundary is deny/no-op; do not silently fall back to Worker authority.

## 2. Capability v1 envelope

The following is a logical schema, not a finalized wire encoding. Exact serialization, signature algorithm, key custody and runtime library must be selected and qualified before implementation.

Required claims:

| Claim | Requirement |
|---|---|
| `version` | Exact supported value `recovery-capability/v1`; unknown versions deny |
| `capability_id` | Cryptographically random unique identifier; never reused |
| `issuer_id` | Stable issuer identity resolved through trusted registry, not caller-supplied trust |
| `key_id` | Exact active signing key registered for that issuer and algorithm |
| `subject` | Exact Recovery Actor workload/principal identity; no wildcard |
| `audience` | Exact resolver service identifier |
| `issued_at`, `not_before`, `expires_at` | Validated using trusted server/database time; short bounded lifetime; reject excessive future skew |
| `nonce` | Cryptographically random, globally unique one-use replay key |
| `decision` | Exactly one enum value from §4; no generic recovery permission |
| `resource.task_key` | Exact task key |
| `resource.attempt_id` | Exact immutable attempt ID |
| `resource.reconciliation_id` | Exact durable pending reconciliation row ID |
| `resource.observed_lease_generation` | Exact generation observed by issuer |
| `resource.input_digest` | Exact immutable task input digest |
| `evidence.digest` | Digest of the decision-specific evidence bundle |
| `evidence.kind` | Exact evidence class allowed for the selected decision |
| `constraints` | Explicit single-use; no delegation; no scope expansion; no wildcard resource selectors |

Signature validation must pin the allowed algorithm from issuer configuration; never trust an algorithm or key URL selected by the token. The issuer registry must support key activation, retirement and revocation. The resolver must reject unknown, inactive, revoked or out-of-validity keys. Raw capability tokens and private keys must never be written to logs, task payloads or audit rows.

The issuer must be distinct from the Worker being recovered. Worker identity, task payload fields, labels, issue comments and caller context are not issuer proof. The trusted issuer-to-principal mapping and key registry are out-of-band configuration with auditable change control.

## 3. Exact resource binding and replay semantics

The authorization must bind all of the following together: task key, attempt ID, reconciliation row ID, observed lease generation, input digest, decision, issuer, subject, audience, capability ID, nonce, expiry and evidence digest.

A valid capability authorizes one decision for one exact resource tuple. It cannot authorize a different attempt, a newer generation, a changed input, another task, another resolver, or a second action.

The nonce/capability ID must be protected by a database uniqueness constraint. Consumption and the state transition must occur in one transaction/batch with conditional predicates that re-read:
- the exact pending reconciliation row and its status;
- the exact current task and attempt;
- the current attempt/lease generation and input digest;
- the required lease/attempt state for the decision;
- the nonce is unused and the capability has not already been consumed;
- trusted time remains within the capability validity window.

Only one concurrent consumer may commit. A separate “mark nonce used” transaction followed by a later state mutation is not acceptable. If the chosen D1/runtime semantics cannot prove the required all-or-nothing behavior, the resolver must remain disabled; do not emulate atomicity with GitHub Actions concurrency or an in-memory lock.

## 4. Decision enum and evidence contracts

The v1 decision set is deliberately narrow:

### `confirm_terminal_from_evidence`
May record a terminal outcome only when the evidence bundle proves the exact attempt's terminal result and is bound to the attempt ID, input digest and generation. A lease timeout, missing heartbeat or queue age is not terminal evidence. It must not create a retry.

### `resume_same_attempt_with_idempotency_proof`
May resume the same immutable attempt only when evidence proves the prior execution is safe to resume and the operation's idempotency contract prevents duplicate external effects. Must retain the same attempt ID and input digest while incrementing/fencing the lease generation. A caller's `resumable=true` assertion is never evidence.

### `authorize_new_attempt`
May create a new attempt only when the prior attempt's outcome is established as terminal or the operation has an explicit, verified idempotency/reconciliation guarantee that makes a new attempt safe. The new attempt must reference the prior attempt and exact reconciliation decision. It must not erase or rewrite the old attempt.

No catch-all “recover”, “force”, “clear lease”, or generic retry decision is permitted in v1. If evidence is inconclusive, the record stays pending and the task remains quarantined for human/governed resolution.

## 5. Resolver algorithm — normative order

1. Parse a bounded input; reject unknown fields, duplicate claims, oversized evidence and unsupported version.
2. Resolve `issuer_id + key_id` from the trusted registry. Verify signature with the configured algorithm and key; reject unknown/revoked/inactive key.
3. Validate issuer authorization for the exact decision and subject; validate exact audience and validity window against trusted time.
4. Validate one-use/no-delegation constraints and exact resource binding.
5. Load the evidence by immutable reference; recompute digest; validate provenance, freshness, subject, task/attempt/generation/input binding and decision-specific schema.
6. Start one database atomic unit. Recheck current reconciliation/task/attempt state and exact generation/digest. Insert/consume the nonce under a uniqueness constraint and perform only the permitted conditional transition. Append the decision audit record in the same atomic unit where supported.
7. Read back the committed task, attempt, reconciliation and audit state. Return success only if every expected field matches. On ambiguous commit/read-back, return an indeterminate result, retain durable reconciliation state and prohibit another action until reconciled by trusted evidence.

Never infer that an executor stopped merely because its lease expired. Never clear a lease or overwrite history as a side effect of failed verification.

## 6. Negative-first test matrix

All tests below are required before a resolver implementation can be considered locally qualified. Each rejection test must assert **no task/attempt/reconciliation mutation, no nonce consumption unless the atomic transaction definitively committed, and no sensitive value in logs**.

| ID | Adversarial case | Required result |
|---|---|---|
| N01 | Worker submits `resumable=true` without capability | DENY; no state change |
| N02 | Worker forges `issuer_id`, subject, role or evidence fields in task payload | DENY; trusted registry remains authoritative |
| N03 | Missing capability, malformed envelope or unknown version | DENY |
| N04 | Unknown issuer, unknown key ID, inactive/revoked/retired key | DENY |
| N05 | Signature tampering, wrong key, algorithm substitution or untrusted key URL | DENY |
| N06 | Expired, not-yet-valid, excessive future skew or invalid time ordering | DENY |
| N07 | Wrong audience, subject, decision or resolver | DENY |
| N08 | Task key, attempt ID, reconciliation ID, generation or input digest mismatch | DENY |
| N09 | Wildcard, multi-resource, delegated, multi-use or extra decision scope | DENY |
| N10 | Missing evidence, wrong evidence kind, digest mismatch, stale or untrusted evidence | DENY |
| N11 | Evidence references another task/attempt/generation or does not prove the selected decision | DENY |
| N12 | Reused nonce/capability ID, including concurrent duplicate submissions | At most one commit; all others DENY/REPLAY |
| N13 | Two different capabilities race on the same reconciliation row | At most one commit; second sees resolved/stale state |
| N14 | Lease generation changes after capability issuance | DENY stale capability |
| N15 | Reconciliation row already resolved/cancelled or task/attempt state changed | DENY |
| N16 | Attempt already terminal, or new attempt exists unexpectedly | DENY unless explicit decision contract permits exact state |
| N17 | Storage batch/transaction fails before commit | No mutation; nonce remains available only if transaction is proven rolled back |
| N18 | Commit outcome or read-back is ambiguous | INDETERMINATE; quarantine; no automatic retry |
| N19 | Trusted clock unavailable or inconsistent | DENY |
| N20 | Audit append fails or immutable history constraint is violated | Whole transaction fails; no partial transition |
| N21 | Oversized/deeply nested/duplicate-key or unknown-field payload | DENY within bounded resource budget |
| N22 | Capability or evidence contains secrets; logging/error path exercised | Redacted output; no token/private key/secret leakage |

Positive controls must prove one exact successful case for each of the three decisions, including exact read-back and append-only audit, plus key rotation behavior that accepts only the configured active key. Positive controls do not replace the negative matrix.

## 7. Persistence and audit requirements

Persist append-only records for capability consumption and recovery decisions, including capability ID, issuer ID, key ID, subject, decision, exact resource tuple, evidence digest/reference, trusted decision time, outcome and correlation ID. Do not persist raw bearer token, private key, API key, full secret-bearing evidence or unredacted provider payload.

Enforce uniqueness for nonce and capability ID. Enforce immutability of historical attempt identity/input and append-only decision history at the database layer, not only in application code. Retain rejected-attempt telemetry only in a bounded, redacted security log; do not let untrusted callers create unbounded durable rows.

## 8. Mature GitHub component review

Reviewed upstream source repositories and their own README/specification descriptions:

- [Eclipse Biscuit specification repository](https://github.com/eclipse-biscuit/biscuit), README blob `f53e9f28495c1f5d47e6bc1f416da0cd26511abb`: mature capability-oriented authorization token with signed authority blocks, attenuation and decentralized validation. The project explicitly states that Biscuit is not an authentication protocol and that revocation requires external state management. It does not by itself provide one-time nonce consumption or atomic ledger transitions. Candidate for a later protocol/library evaluation only; **not adopted**.
- [Eclipse Biscuit Rust implementation](https://github.com/eclipse-biscuit/biscuit-rust), README blob `032851cee4368762ae6e027339e52017b295ae85`: supports token verification and attenuation, but is Rust-focused and not a drop-in Worker JavaScript/D1 resolver. Its non-goal on revocation reinforces the need for durable replay state. **Not adopted**.
- [Cedar policy engine](https://github.com/cedar-policy/cedar), README blob `2d5f0653cd04f65c1a5ddb2a3b0fabbeeeb2b11b`: mature fine-grained authorization policy engine with schema validation and analyzability. It evaluates policies; it is not a signed capability issuer, replay store or transaction coordinator. Could later encode decision policy if the runtime/language fit is demonstrated. **Not adopted**.

Conclusion: no mature component found that replaces the complete issuer authentication + one-use replay ledger + decision-specific evidence + atomic D1 transition boundary. Reuse of a token/policy library must not replace durable single-use state or transaction predicates. No dependency was added.

## 9. Qualification gates and implementation order

Before source implementation:
- finalize trusted issuer registry, issuer enrollment/rotation/revocation and independent authority boundary;
- select a supported signature/token implementation compatible with the actual Cloudflare Worker runtime and pin its provenance;
- verify D1 transaction/batch atomicity and uniqueness semantics in the local Workers runtime;
- finalize trusted-time source and maximum capability lifetime/skew;
- define evidence schemas and trusted evidence origins for each decision;
- agree the exact state transition table and audit retention model.

Then implement negative-first in the isolated local D1 proof harness. The caller-controlled `resumable` path must be removed or made unreachable before any production wiring. Tests must cover concurrency and crash/ambiguous-commit cases. Hosted D1, dispatch and provider execution remain separately gated and are not authorized by passing local tests.

## 10. Current repository evidence and next step

- Default branch `Основной`: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67: `dea09ffe94059f446c74fada37971087ec4878eb`, OPEN / DRAFT / UNMERGED.
- Exact-head Actions associated with PR #67: runs `43064261520` (Isolated D1 Ledger Proof) and `43064261551` (Pool Contract Validation), both completed SUCCESS. Combined commit-status endpoint returned zero contexts / pending; formal reviews and inline comments are empty. These runs do not qualify Recovery Actor.
- PR #66 documentation branch HEAD at this pass: `55babef9b6a3e2422e387e3be575d6e06c2447ad`; its exact-head PR workflow run list returned empty. NOT VERIFIED.
- Active ruleset `26550182` applies to `refs/heads/Основной`: PR required, deletion and non-fast-forward blocked, review-thread resolution required, 0 approvals, no bypass actors; current user cannot bypass.
- No code, tests, workflows, secrets, variables, hosted resources, deployment, dispatch or provider/model calls were changed or run in this pass.
- Independent review remains deferred until after actual pool launch by owner direction.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: inspect the exact current Recovery Actor/authority contracts and decide issuer/key custody and evidence-source ownership; only then draft the executable state-transition specification. Do not implement or dispatch until those authorities are explicit.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
