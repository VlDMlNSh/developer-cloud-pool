# 2026-11-11 Recovery Issuer Ownership and Technology-Selection Crosswalk

- Date: 2026-11-11
- Scope: source-backed preflight for Cloud Pool PR #60; no implementation or authority grant.
- Cloud Pool default target observed: `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Cloud Pool PR #60 remains OPEN / DRAFT / UNMERGED; contract blob `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`; current branch HEAD recorded in the unified context as `234fb2ee40265e26fac00c69ac1b6192766602cb`.
- Exact-head workflow lookup for that PR #60 head returned no runs. Formal review and inline threads remain 0. CI NOT VERIFIED; independent review NOT RUN.

## 1. Source-backed authority findings

MediaHub PR #599 (Wave 486) explicitly selects WB-05 Option A as an owner-directed target: a separately governed Security Issuer Authority, distinct from Jarvis and ASTRA A0. Its own body states that no named teams/services, identity registry, KMS/HSM or audit sink are evidenced, and that independent review/normative acceptance are NOT VERIFIED. PR #599 is OPEN / DRAFT / UNMERGED.

MediaHub PR #600 (Wave 487) is a technology-neutral DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED. Its body explicitly leaves protocol, token format, algorithm, key custody, identity provider, audit sink, endpoint and operational team unselected. Its exact-head CI and independent A3 review are NOT VERIFIED.

Wave 487's source preflight comments (PR #600 comments dated 2026-11-03) identify two material governance gaps:
- Security Audit and Privacy/Data Governance are functional accountabilities, not named deployed operational owners.
- 365-day security / 90-day operational retention values are targets, not approved legal/privacy policy.

The Wave 528 preflight comment on PR #600 recommends candidate directions (GitHub Actions OIDC as workload-authentication input; JWS with strict profile; RFC 8785 JCS for semantic request digest; non-exportable KMS/HSM signing keys; PostgreSQL transactional receipt/idempotency state; separate audit sink). These are recommendations in a preflight comment, not accepted technology decisions, deployed services, or qualification evidence. The same comment explicitly retains unresolved named R-06 ownership, retention approval, concrete KMS/HSM and audit sink, protocol profile, and persistence operations. Wave 528 is PR #634 Runner 2 isolation/design and is not an issuer technology-selection authority.

## 2. Cloud Pool application boundary

Cloud Pool PR #60 correctly applies a separate `projection-outbox-recovery` audience and exact outbox/attempt/generation/operation binding. It must not reuse A0 ingress grants or task Resolver grants. The ≤300-second capability lifetime and ≤30-second revocation freshness are target constraints inherited from Wave 486/487, not evidence that a production issuer or revocation service exists.

The issuer must authenticate the Recovery Actor workload independently. GitHub OIDC, if later selected, is only an authentication input to the separately governed issuer; it does not itself authorize dead-lettering, prove owner approval, or establish mission/request provenance. A D1 binding or workflow identity is not an issuer.

## 3. Decision matrix — status, not technology selection

| Boundary | Current evidence | Decision/status |
|---|---|---|
| Issuer authority | Owner-directed separate Security Issuer Authority target in Wave 486 | Target identified; named operator/service NOT IDENTIFIED |
| Recovery principal | Contract requires stable identity/generation and lifecycle | Registry, admission, suspension and revocation NOT IMPLEMENTED |
| Workload authentication | OIDC / SPIFFE are candidates in Wave 528 preflight | NOT SELECTED / NOT QUALIFIED |
| Grant format and canonicalization | JWS/JCS recommended as candidates; COSE alternative noted | NOT SELECTED / NOT ACCEPTED |
| Signing key custody | Managed KMS/HSM preferred candidate; OpenBao Transit candidate | No provider/service, operator, rotation or compromise process qualified |
| Revocation | ≤30s freshness and monotonic generation target | No authoritative source/transport/owner qualified |
| Trusted time | D1 transaction time preferred conditionally | Exact hosted D1 semantics and transaction coupling NOT QUALIFIED |
| Durable nonce/state | PostgreSQL transactional store recommended in Wave 528 preflight | Not a Cloud Pool decision; no backend selected or qualified |
| Audit | Security Audit / Privacy Data Governance accountabilities | Named operational owner, sink, access controls, integrity and retention approval unresolved |
| Recovery route | Separate composition root and one-use grant required | NOT IMPLEMENTED; no route or permission added |

## 4. Minimum safe path before implementation

1. Obtain explicit governance disposition naming the Security Issuer Authority operator, Security Trust Custodian, Recovery Actor lifecycle owner, revocation source owner, Security Audit operational owner and Privacy/Data Governance retention approver. Functional labels alone are insufficient.
2. Approve or replace retention targets and classify each audit field. Define audit outage, integrity, reader authorization and recovery semantics.
3. Select one workload-authentication and grant-verification profile through an ADR with threat model and interoperability evidence. Keep protocol and crypto choices unselected until review.
4. Qualify signing-key custody/rotation/revocation and a ≤30s revocation-state freshness mechanism.
5. Qualify one trusted clock and a transaction boundary that atomically consumes nonce, fences exact outbox generation, writes terminal state and audit receipt. Hosted backend contention/crash/ambiguous-commit tests are mandatory.
6. Obtain independent security review of the exact ADR + Cloud Pool contract before schema, token verifier, route, secret, or runtime implementation.

No owner identity, service, credential, token format, key provider, database or audit sink is invented or appointed by this report.

## 5. Disposition

- PR #59: exact-head local Workers-runtime D1 tests SUCCESS (run 42981807825 / job 130393715595; 53 tests); hosted D1 and production recovery NOT QUALIFIED; independent review NOT RUN.
- PR #60: contract read-back verified; exact-head CI NOT VERIFIED; independent review NOT RUN.
- Issuer, Recovery Actor, revocation, trusted time and audit boundary: NOT IMPLEMENTED / NOT QUALIFIED.
- No secret access, provider call, workflow dispatch, live GitHub write, deployment or runtime mutation performed.
- Production dispatch remains FAIL-CLOSED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## 6. Next bounded step

Keep PR #60 documentation-only. The next implementation-adjacent action is a governance/ADR decision packet with explicit accountable owners and approved retention, followed by independent review. If no named operational owners can be evidenced, stop at the contract boundary and retain the local D1 proof only.
