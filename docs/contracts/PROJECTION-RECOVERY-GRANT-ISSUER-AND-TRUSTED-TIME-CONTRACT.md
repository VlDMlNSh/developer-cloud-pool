# Projection Recovery Grant Issuer and Trusted-Time Interface Contract

- Date: 2026-11-11
- Status: DESIGN PREREQUISITE / PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED
- Immutable design target: `design/projection-recovery-actor-contract-2026-11-11@04fcf8868a086b9f58c10fdc076aef0b7170d5f2`
- Parent ADR: `docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md`
- Scope: issuer verification and trusted-time boundaries required before any projection outbox recovery implementation.
- Non-goals: runtime code, schema/migrations, key provisioning, secret access, production authority, task resolver changes, dispatch, deployment, provider/model calls.

## 1. Findings from existing contracts

The repository contains a proposed backend-neutral Shared Immutable Claim Lifecycle Contract and a Trusted Reconciliation Authority Contract. They specify issuer authentication, scoped capabilities, revocation, policy versioning, one-use grants, immutable bindings and trusted-time requirements. They do not identify an implemented production issuer, key custody service, revocation source, or qualified production clock.

The existing task Resolver capability is not a projection recovery grant. It has a different audience, subject/resource binding and operation set. Reusing its issuer/capability patterns is permissible only through a separately constrained grant profile; widening Resolver permissions is prohibited.

The local D1 adapter's caller-supplied `now` is a deterministic test seam only. The synthetic Resolver host-clock composition proof does not qualify production clock provenance for this outbox.

## 2. Required trusted composition boundary

Define one trusted composition root with two separately testable dependencies:

- `RecoveryGrantVerifier`: accepts an opaque grant and trusted request binding; returns a verified, immutable grant descriptor or DENY. It must not mint grants, accept caller-selected verification keys/issuers, or return secret/key material.
- `TrustedTimeSource`: returns an authoritative UTC instant and provenance metadata to the trusted composition root. It must fail closed when unavailable, invalid, outside configured skew bounds, or non-monotonic where monotonicity is required.

The storage adapter must not accept an arbitrary actor ID, decoded-but-unverified claims, caller-provided `now`, issuer/key selectors, or a caller-provided nonce-consumed flag. It receives only the verifier-produced grant descriptor and trusted time result through a non-public composition boundary. Type branding alone is not a security boundary; module visibility and runtime verification must prevent plain JSON/object forgery at ingress.

No concrete implementation is selected by this contract.

## 3. Recovery grant profile

A grant must be authenticated by an issuer whose authority and key lifecycle are independently governed. The verified claims must bind all of:

- schema/version and issuer identity;
- key identifier/version (identifier only; never key bytes);
- subject to a configured recovery-actor allowlist;
- audience exactly `projection-outbox-recovery`;
- operation exactly `dead_letter_expired_projection`;
- repository numeric ID;
- outbox ID and attempt ID;
- delivery generation and immutable outbox event digest;
- maximum delivery-attempt ceiling;
- not-before and expiry;
- unique grant ID and nonce;
- policy version / authority epoch where the issuer governance contract requires them.

Unknown claims, unsupported versions, duplicate fields, malformed canonical encodings, wrong audience/subject/operation, mismatched resource binding, revoked issuer/key/policy, expired or not-yet-valid grants, and replay are DENY / UNRESOLVED. A grant cannot authorize scanning arbitrary repositories or batches; any future batch interface must verify a distinct per-row binding or a separately reviewed bounded batch capability.

## 4. Issuer responsibilities and unresolved ownership

Before implementation, governance must name and qualify:
1. the authoritative issuer service or owner-approved issuance event;
2. the principal authentication method at issuance;
3. issuer/key custody, rotation, revocation and compromise response;
4. policy-version and authority-epoch semantics;
5. the subject registry and recovery actor lifecycle;
6. the audit sink and retention owner.

A registered GitHub secret, repository variable, environment name, workflow identity, actor string, or possession of D1 binding is not by itself proof of an issuer. Do not introduce a static shared token, copy credentials across accounts, grant broad Contents: write, or treat GitHub Actions workflow permissions as a capability issuer without a separate threat model.

Candidate technologies (JWS, managed KMS/HSM, Cedar, Macaroons) remain candidates only. A token format or policy engine does not establish principal authentication, key custody, revocation freshness, or authority ownership. No new dependency is selected here.

## 5. Trusted-time contract

Preferred source: database-generated UTC time evaluated by the same database transaction that conditionally validates lease expiry, grant validity and nonce consumption. This preference is conditional on proving the selected D1 runtime's exact semantics and transaction behavior.

If database time cannot be qualified, an alternative trusted composition-root clock must provide:
- a documented platform source and UTC conversion;
- bounded wall-clock skew and an explicit maximum evidence age;
- monotonicity/backwards-jump detection for the process/session;
- behavior for unavailable, malformed, stale, future-inconsistent or backwards time;
- sampling after grant verification and immediately before the conditional state transition;
- no caller override or arbitrary request timestamp.

The chosen source must consistently evaluate both the outbox lease expiry and grant not-before/expiry. If the grant validity boundary cannot be evaluated atomically with nonce consumption and the terminal transition, the design must document the residual race and remain unqualified until resolved. Test clocks may be injected only through a test-only adapter that is not exported by production composition.

## 6. Required verification sequence

1. Authenticate the issuance principal independently of request fields.
2. Resolve issuer/key/policy state from trusted configuration or authoritative registry; fail closed on unavailable or stale revocation state.
3. Verify signature/authentication, schema, canonicalization, audience, subject, operation, resource binding and policy epoch.
4. Obtain trusted time from the qualified source; reject invalid/skewed/backwards time.
5. Execute one atomic conditional transition: exact leased outbox row, exact generation, expired lease, exhausted attempt budget, matching grant scope, valid grant interval, unused nonce; terminalize only the outbox; consume nonce; append immutable recovery audit event.
6. Read back the exact terminal row and unique event. Any ambiguous commit or failed readback is NOT VERIFIED; never retry by assuming the first write failed.

The database transaction remains the state-transition authority. Issuer verification does not replace SQL fencing; SQL fencing does not authenticate the caller.

## 7. Required adversarial tests

- forged actor ID, fabricated branded object and caller-supplied decoded claims;
- wrong issuer/key version, revoked key, stale revocation data, wrong policy epoch;
- wrong audience, subject, operation, repository, outbox, attempt, generation or event digest;
- duplicate/unknown claims, unsupported schema and non-canonical encoding;
- not-before boundary, expiry boundary, clock unavailable, skew, backwards jump and future-inconsistent time;
- concurrent identical grant use: exactly one nonce consumption and one dead-letter event;
- expired/live lease, non-exhausted attempts, stale generation and already terminal row;
- ambiguous commit and readback failure;
- proof that no path can acquire/retry/acknowledge/requeue, mutate task/attempt, write GitHub, or dispatch.

Synthetic unit tests are necessary but not sufficient. Hosted backend, issuer, key lifecycle, revocation and time-source qualification are separate mandatory gates.

## 8. Decision

No issuer or production clock is evidenced as implemented and qualified in the inspected contracts. Therefore the next engineering step is governance/source identification and interface verification, not runtime implementation. Keep recovery NOT IMPLEMENTED / NOT QUALIFIED, task Resolver unchanged, production dispatch FAIL-CLOSED, and Contour B deferred.
