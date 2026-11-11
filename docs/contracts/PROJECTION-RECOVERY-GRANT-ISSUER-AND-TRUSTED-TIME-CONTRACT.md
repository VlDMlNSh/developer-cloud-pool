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

The original WB-05 decision packet (blob `1b562c6546b1216f2ee89095cd6a78427a967dc5`) left options A–D unselected. The later owner-directed Wave 486 disposition (MediaHub PR #599; disposition blob `7b778ebe67105d50afb00466965cdcfb5353a262`) selected Option A as a target: a separately governed Security Issuer Authority distinct from Jarvis, ASTRA A0, executors and Product State Authority. PR #599 is OPEN/DRAFT/UNMERGED; exact-head CI and independent review are NOT VERIFIED. Wave 487 (MediaHub PR #600; contract blob `1200d343139c8e67a826902b3ade09d4987c537d`) translates that target into a DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED contract; its exact-head CI and independent A3 review are NOT VERIFIED. Neither PR proves a deployed issuer or operational staffing. Wave 528 is MediaHub PR #634, a Runner 2 isolation/design proposal, and is not a source for issuer token, canonicalization, database or audit-sink technology decisions. R-06 operational ownership, retention approval and concrete audit/KMS service selection remain unresolved.

The local D1 adapter's caller-supplied `now` is a deterministic test seam only. The synthetic Resolver host-clock composition proof does not qualify production clock provenance for this outbox.

## 2. Crosswalk to MediaHub Wave 486 / Wave 487 authority requirements

This recovery grant profile is a distinct consumer-specific application of the owner-directed Security Issuer Authority target. It is not an A0 ingress capability and does not grant Jarvis, A0, or the Cloud Pool authority to issue grants.

| MediaHub requirement | Projection recovery application | Boundary / evidence |
|---|---|---|
| Separate Security Issuer Authority | Only that separately governed authority may authenticate/authorize issuance of a projection-recovery grant | Owner-directed target only; PR #599 / #600 remain Draft |
| Service-principal lifecycle and identity generation | Recovery Actor is a separately admitted service principal with stable ID and generation; suspension/revocation invalidates new grants | No registry or production lifecycle implementation evidenced |
| Audience confinement | Exact audience `projection-outbox-recovery`; never accept A0 ingress or task Resolver audience | No cross-audience reuse |
| Consumer-specific verification | Cloud Pool recovery composition root verifies its own grant immediately before state transition | No caller-supplied actor ID or decoded claims |
| Maximum capability lifetime | Grant lifetime MUST NOT exceed 300 seconds, measured by qualified trusted time | Wave 486/487 target default; test seam does not qualify production clock |
| Revocation freshness | Revocation state MUST be no older than 30 seconds and generation MUST NOT roll back; stale/unavailable state denies recovery | Wave 486/487 target default; no production revocation source evidenced |
| Delegation attenuation | No delegation by default. If later required, every hop must preserve issuer, original requester, actor identity, exact audience, operation, resource and no-broader lifetime/scope | Jarvis→A0 delegation semantics do not automatically authorize a Cloud Pool recovery delegation |
| R-06 security audit | Record issuer/subject identity generations, grant digest/ID, audience, operation, exact outbox binding, decision/reason, revocation generation, trusted timestamp/confidence and transition receipt; never raw grant/token/key | Security Audit owns integrity/access accountability; concrete sink/operator not evidenced |
| R-06 privacy and retention | Minimize payload; classify fields; apply deletion/legal-hold and controlled-reader rules. Wave 486's 365-day security / 90-day operational values are target defaults only | Privacy/Data Governance owns classification/retention accountability; legal approval and operational owner unresolved |
| Audit failure | No new recovery transition when required audit cannot be durably committed and verified; ambiguous commit remains NOT VERIFIED | Consistent with fail-closed privileged mutation target; exact sink/transaction coupling unqualified |

The Wave 487 requester/mission provenance fields apply to the actual authenticated issuance request. For this maintenance operation, the authenticated requester is the admitted Recovery Actor workload principal; any human approval evidence is required only if the accepted issuer policy explicitly requires it. Do not invent a Jarvis mission or claim that a Cloud Pool grant is an A0 grant. The issuer must independently authorize the exact recovery operation and resource binding.

The Wave 487 contract is technology-neutral and explicitly selects no token format, signature algorithm, KMS/HSM vendor, identity provider, database, queue or audit sink. JWS, KMS/HSM, Cedar and Macaroons listed below are candidates only; RFC 8785 and PostgreSQL are not decisions sourced from Wave 528.

## 3. Required trusted composition boundary

Define one trusted composition root with two separately testable dependencies:

- `RecoveryGrantVerifier`: accepts an opaque grant and trusted request binding; returns a verified, immutable grant descriptor or DENY. It must not mint grants, accept caller-selected verification keys/issuers, or return secret/key material.
- `TrustedTimeSource`: returns an authoritative UTC instant and provenance metadata to the trusted composition root. It must fail closed when unavailable, invalid, outside configured skew bounds, or non-monotonic where monotonicity is required.

The storage adapter must not accept an arbitrary actor ID, decoded-but-unverified claims, caller-provided `now`, issuer/key selectors, or a caller-provided nonce-consumed flag. It receives only the verifier-produced grant descriptor and trusted time result through a non-public composition boundary. Type branding alone is not a security boundary; module visibility and runtime verification must prevent plain JSON/object forgery at ingress.

No concrete implementation is selected by this contract.

## 4. Recovery grant profile

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

## 5. Issuer responsibilities and unresolved ownership

Before implementation, governance must name and qualify:
1. the authoritative issuer service or owner-approved issuance event;
2. the principal authentication method at issuance;
3. issuer/key custody, rotation, revocation and compromise response;
4. policy-version and authority-epoch semantics;
5. the subject registry and recovery actor lifecycle;
6. the audit sink and retention owner.

A registered GitHub secret, repository variable, environment name, workflow identity, actor string, or possession of D1 binding is not by itself proof of an issuer. Do not introduce a static shared token, copy credentials across accounts, grant broad Contents: write, or treat GitHub Actions workflow permissions as a capability issuer without a separate threat model.

Candidate technologies (JWS, managed KMS/HSM, Cedar, Macaroons) remain candidates only. A token format or policy engine does not establish principal authentication, key custody, revocation freshness, or authority ownership. No new dependency is selected here.

## 6. Trusted-time contract

Preferred source: database-generated UTC time evaluated by the same database transaction that conditionally validates lease expiry, grant validity and nonce consumption. This preference is conditional on proving the selected D1 runtime's exact semantics and transaction behavior.

If database time cannot be qualified, an alternative trusted composition-root clock must provide:
- a documented platform source and UTC conversion;
- bounded wall-clock skew and an explicit maximum evidence age;
- monotonicity/backwards-jump detection for the process/session;
- behavior for unavailable, malformed, stale, future-inconsistent or backwards time;
- sampling after grant verification and immediately before the conditional state transition;
- no caller override or arbitrary request timestamp.

The chosen source must consistently evaluate both the outbox lease expiry and grant not-before/expiry. If the grant validity boundary cannot be evaluated atomically with nonce consumption and the terminal transition, the design must document the residual race and remain unqualified until resolved. Test clocks may be injected only through a test-only adapter that is not exported by production composition.

## 7. Required verification sequence

1. Authenticate the issuance principal independently of request fields.
2. Resolve issuer/key/policy state from trusted configuration or authoritative registry; fail closed on unavailable or stale revocation state.
3. Verify signature/authentication, schema, canonicalization, audience, subject, operation, resource binding and policy epoch.
4. Obtain trusted time from the qualified source; reject invalid/skewed/backwards time.
5. Execute one atomic conditional transition: exact leased outbox row, exact generation, expired lease, exhausted attempt budget, matching grant scope, valid grant interval, unused nonce; terminalize only the outbox; consume nonce; append immutable recovery audit event.
6. Read back the exact terminal row and unique event. Any ambiguous commit or failed readback is NOT VERIFIED; never retry by assuming the first write failed.

The database transaction remains the state-transition authority. Issuer verification does not replace SQL fencing; SQL fencing does not authenticate the caller.

## 8. Required adversarial tests

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

## 9. Decision

No issuer or production clock is evidenced as implemented and qualified in the inspected contracts. Therefore the next engineering step is governance/source identification and interface verification, not runtime implementation. Keep recovery NOT IMPLEMENTED / NOT QUALIFIED, task Resolver unchanged, production dispatch FAIL-CLOSED, and Contour B deferred.
