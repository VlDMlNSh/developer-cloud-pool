# Issuer-authenticated capability contract for durable Pool claims

- Date: 2026-11-16
- Status: DESIGN CONTRACT / NOT IMPLEMENTED / NOT QUALIFIED
- Scope: Contour A only
- Related: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38), [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94), [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96), [durable claim decision](../decisions/2026-11-11-durable-supervisor-claim-protocol.md)
- Immutable evidence inputs: PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; PR #54 head `15a09c910f52553c59796260131a6b5a4a39c15f`; PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.

## 1. Purpose and security boundary

Define the minimum authenticated authority envelope that a future Claim Service may consume exactly once. This document does not authorize implementation against a live account, key generation, secret creation, D1 provisioning, Worker deployment, dispatch, or gate enablement.

The Claim Service is the authority that verifies and consumes capabilities. Supervisor, Worker, browser sessions, issue labels, workflow inputs and caller-provided timestamps are untrusted inputs. A valid signature alone is insufficient: the service must also enforce audience, issuer/key status, immutable task binding, time validity, one-time nonce consumption and current policy.

The only allowed successful outcome at this layer is a durable claim/outbox result with `dispatch: false`. External execution is a later, separately authorized and reconciled stage.

## 2. Capability format

Use a versioned, signed capability. Recommended interoperable representation: compact JWS using EdDSA (Ed25519), with the exact protected header:

```json
{
  "alg": "EdDSA",
  "kid": "issuer-key-id",
  "typ": "pool-claim-capability+jwt",
  "v": 1
}
```

No `alg` negotiation, `none`, symmetric HMAC fallback, remote `jku`/ `x5u` key discovery, or caller-selected verification algorithm is permitted. The verifier pins the permitted algorithm and resolves `kid` only through a locally configured, versioned trust registry. Unknown, disabled, expired or revoked keys fail closed.

The payload is a canonical JSON object (RFC 8785 JCS before signing) with these required claims:

| Claim | Type / rule | Purpose |
|---|---|---|
| `iss` | exact trusted issuer identifier | Issuer identity |
| `sub` | stable numeric GitHub owner ID, string | Authenticated owner subject |
| `aud` | exact Claim Service audience | Prevent cross-service replay |
| `repo_id` | numeric GitHub repository ID, string | Repository boundary |
| `control_issue` | positive integer | Exact control issue binding |
| `source_comment_id` | positive decimal string | Idempotency source |
| `task_id` | opaque bounded identifier | Logical task identity |
| `target_sha` | lowercase 40-hex commit SHA | Immutable code target |
| `worker_profile` | allowlisted profile identifier | Capability restriction |
| `envelope_digest` | lowercase SHA-256 hex | Canonical immutable task-envelope digest |
| `jti` | cryptographically random unique identifier | Single-use token identity |
| `iat` | integer NumericDate seconds | Issuance time |
| `nbf` | integer NumericDate seconds | Earliest acceptance time |
| `exp` | integer NumericDate seconds | Expiration time |
| `policy_version` | exact policy version | Policy binding |

Reject unknown critical claims and duplicate JSON keys. Enforce a strict maximum token size, bounded string lengths, exact numeric/string types, lowercase canonical encodings and an explicit profile allowlist. Do not accept user-supplied prompts, shell commands, workflow names, arbitrary refs, permissions, matrices, model/provider choices or child counts as capability claims.

The canonical envelope digest is SHA-256 over RFC 8785 canonical JSON of the immutable task fields (repository ID, control issue, source comment ID, task ID, target SHA, worker profile and policy version). Exclude signature bytes and time-varying transport metadata. Define this digest algorithm/version in the contract and test it with fixed cross-language vectors before implementation.

## 3. Issuer authentication and source admission

The issuer must derive owner identity and event provenance from trusted GitHub event/API metadata, never from a request body or a display name.

Before issuing a capability, the issuer must validate all Issue #96 admission conditions:
- event is a newly created top-level issue comment;
- complete comment body equals `/next` byte-for-byte (no whitespace, suffix, prefix or extra lines);
- exact repository identity and exact control issue number match configuration;
- author numeric ID equals the configured repository owner numeric ID and trusted association metadata confirms owner;
- reject PR review comments, PR conversation comments, issue edits, pull_request-originated contexts, workflow_dispatch, workflow_run and schedule as dispatch authority;
- source comment ID has not already been admitted;
- target SHA is read from the trusted default branch once and frozen for the entire wave;
- task profile and policy version are selected from trusted controller configuration, not caller input.

A signed capability attests that these checks were completed. It does not replace Claim Service validation of signature, claims, key status, time, nonce and storage transaction.

## 4. Key custody, rotation and revocation

**No key custody backend is selected or qualified by this document.** Before implementation, choose a free-tier-compatible and governance-approved signing boundary with evidence of identity, availability, access isolation, quota and recovery. Do not assume GitHub Actions Secrets, OIDC federation, Cloudflare bindings or any other service is configured or authorized.

Required controls:
- signing private key is non-exportable where supported, or otherwise isolated to the issuer process; never present in browser, Worker task payload, logs, artifacts or repository files;
- verifier receives only public keys and a signed/versioned trust-registry update;
- separate issuer-signing authority from GitHub repository write authority and from worker execution authority;
- key IDs are immutable and never reused;
- rotation supports overlap: publish and verify new public key before issuer switches; retire old key only after bounded maximum token lifetime and reconciliation window;
- revocation is an online or versioned trust-state check performed for every consume; revoked/unknown key means DENY;
- trust-registry rollback is rejected using a monotonic version or equivalent anti-rollback control;
- compromise response disables the key, rejects outstanding capabilities from it, and requires explicit re-issuance from a newly authenticated source event;
- no automatic key rotation to evade quota, account limits or provider policy.

A public key being present is not proof that the corresponding private key is protected or that issuer identity is trustworthy. Record custody evidence without reading or printing secret values.

## 5. Trusted time and validity

The Claim Service owns time validation. Caller-supplied `now`, timestamps in workflow inputs, GitHub comment timestamps and worker clocks are not authoritative for acceptance.

The service must use a platform-provided server clock with documented operational guarantees and a bounded, configured clock-skew allowance. The actual runtime/time source and drift monitoring must be evidenced before qualification; until then time validation is NOT QUALIFIED.

Validation rules:
- require `iat <= nbf < exp`;
- require `exp - iat` not to exceed a short configured maximum capability lifetime;
- reject if current trusted time is before `nbf` (with only the explicitly configured skew allowance) or at/after `exp`;
- reject future `iat` beyond skew allowance;
- never extend expiry on retry or replay;
- persist trusted acceptance/consumption time in the same transaction as the state transition;
- ambiguous time-source health, excessive drift or missing time evidence means DENY / HOLD, not fallback to caller time.

The numeric lifetime and skew values are deployment policy, not guessed defaults. They must be selected through threat analysis and fixed in the versioned policy before live issuance.

## 6. Consume and claim/outbox transaction

The future Claim Service must perform these checks before any state mutation:
1. Parse bounded JWS and enforce the fixed protected header.
2. Resolve `kid` from trusted registry; verify signature with pinned Ed25519 implementation.
3. Check issuer, subject, audience, repository ID, control issue, profile and policy version against trusted configuration.
4. Recompute canonical envelope digest and compare in constant time.
5. Check `jti`, source comment ID and immutable task identity have not been consumed by another envelope.
6. Validate `iat`, `nbf`, `exp` using service trusted time and current key revocation state.
7. Atomically conditionally transition the approval/capability from ready to consumed and create exactly one claim and one outbox row in the same transaction.

Required unique constraints include issuer + `jti`, source comment ID, logical task identity, and one outbox row per claim. The transaction must bind the claim to the exact envelope digest and immutable fields. A repeated identical request may return the already-created claim only after authoritative read-back confirms every binding. A replay with a changed digest or any changed binding is DENY.

A timeout, storage exception, partial read, missing row or uncertain commit is an ambiguous outcome. Return HOLD / needs-review with `dispatch: false`; reconcile by authoritative read-back before any retry. Never infer failure from a lost response and never requeue solely because a run is absent from a bounded GitHub query.

The existing PR #39/#54 D1 package is a local-only proof of conditional consume and trigger-backed claim/outbox atomicity. It is not mounted in the production Worker and its adapter deliberately returns `dispatch: false`. Do not treat those local tests as issuer, key custody, trusted-time or hosted backend qualification.

## 7. Denial taxonomy and audit

Use stable machine-readable decisions:
- `DENY_INVALID_TOKEN`
- `DENY_BAD_SIGNATURE`
- `DENY_UNKNOWN_OR_REVOKED_KEY`
- `DENY_ISSUER_OR_SUBJECT_MISMATCH`
- `DENY_AUDIENCE_OR_REPOSITORY_MISMATCH`
- `DENY_TASK_BINDING_MISMATCH`
- `DENY_POLICY_MISMATCH`
- `DENY_NOT_YET_VALID`
- `DENY_EXPIRED`
- `DENY_REPLAY`
- `HOLD_TRUSTED_TIME_UNAVAILABLE`
- `HOLD_STORAGE_OUTCOME_AMBIGUOUS`
- `HOLD_RECONCILIATION_REQUIRED`

Audit records include decision, reason code, key ID, issuer ID, source event ID, task ID, target SHA, envelope digest, policy version, trusted decision time and correlation ID. Never log the compact token, signature, private/public key bytes, credentials or full sensitive event payload. Audit storage must be append-only or otherwise tamper-evident and independently readable.

## 8. Required adversarial test matrix

Before any live integration, add deterministic test vectors and adversarial tests for:
- valid signature; altered payload; altered signature; wrong algorithm; `alg=none`; unknown `kid`;
- revoked key, retired key, trust-registry rollback and key-ID reuse;
- wrong issuer, owner subject, audience, repository, control issue, source comment, task ID, target SHA, profile and policy version;
- duplicate JSON keys, non-canonical payload, digest mismatch, malformed/oversized token and invalid types;
- missing/duplicate `jti`, replayed source comment, same token concurrent consume, changed-envelope replay;
- future `iat`, future `nbf`, expiry boundary, excessive lifetime, trusted-clock unavailable and clock drift beyond policy;
- storage unavailable, conditional update loses race, trigger/outbox failure rollback, response lost after commit, stale read, duplicate retry and authoritative read-back mismatch;
- no path returns `dispatch: true` from the issuer/capability/claim layer.

Use fixed public test keys only in tests. Never use production signing keys in CI. Tests must run with network access disabled unless a separately approved integration test explicitly requires it.

## 9. Qualification gates and explicit non-goals

Do not implement or enable until all of the following are evidenced:
- approved issuer identity and owner-event provenance;
- approved key custody, access policy, rotation and revocation;
- fixed canonicalization and signature test vectors;
- qualified trusted-time source and drift policy;
- transactional store entitlement, isolation, quota and account ownership verified;
- real concurrent HTTP contention tests against the hosted backend (not sequential SQL or local-only tests);
- lost-response, rollback, restart, replay and revocation tests;
- least-privilege review of issuer, claim service, Supervisor and Worker;
- exact-head CI, security/governance gates and immutable provenance;
- dispatch remains disabled until a separate controller qualification.

No secrets are inspected or created. No hosted D1/database, Worker, signing key, GitHub App, OIDC trust, paid service or provider is provisioned or assumed. No dispatch, merge, production rollout or Contour B work is authorized. External independent acceptance remains deferred per owner direction; internal security/governance gates are still mandatory, and no self-review may mark Contour A ACCEPTED.

## 10. Next implementation sequence

1. Select and evidence the issuer identity and signing-key custody boundary without exposing secret material.
2. Implement a pure verifier with fixed public-key test vectors, strict canonicalization, claim validation, revocation and trusted-time injection.
3. Add adversarial tests listed above; prove all failure paths fail closed.
4. Integrate the verifier with the isolated claim/outbox adapter only after the adapter's backend and trust boundaries are qualified.
5. Conduct hosted concurrency and ambiguity qualification before any dispatch integration.

Until then: issuer authentication, trusted time, hosted claim service and production claim lifecycle remain NOT IMPLEMENTED / NOT QUALIFIED; dispatch remains disabled.
