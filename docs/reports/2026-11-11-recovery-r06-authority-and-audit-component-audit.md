# Recovery Actor R-06 and authority-source evidence audit

- Date: 2026-11-11
- Status: SOURCE AUDIT SUCCEEDED / ACCOUNTABILITY ROLES IDENTIFIED / OPERATIONAL OWNERS NOT EVIDENCED / NOT ACCEPTED / NOT IMPLEMENTED
- Cloud Pool immutable base: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- MediaHub source snapshot: `main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`
- Scope: reconcile Wave 486/487 R-06 and Security Issuer Authority requirements against current MH-12/MH-13 governance records and evaluate mature OSS for audit evidence, key custody and trust-log roles.
- Non-goals: assign real people/teams, select a vendor, deploy a service, request credentials/tokens, change runtime/schema/workflow/permissions, or enable dispatch.

## 1. Source state and provenance

The source documents are not accepted baselines:

- Wave 486 decision artifact blob `13e6745463dbc05a7c188423bb45ffb2b210c789`; status explicitly says owner-directed target decisions selected, normative acceptance pending, runtime blocked. Its report blob is `7b778ebe67105d50afb00466965cdcfb5353a262`.
- Wave 487 amended contract blob `1200d343139c8e67a826902b3ade09d4987c537d`; status DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED. Its report blob is `c9dfa2e63683ac52223a890ad0d96ab4f950aedd`.
- PR #599 and #600 are OPEN / DRAFT / UNMERGED; their recorded exact-head workflow queries returned no PR-triggered runs and formal review submissions are zero. CI NOT VERIFIED; independent A3 review NOT RUN.
- MediaHub default branch snapshot read at `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- MH-12 security architecture blob `cf4ebfd5bf471ca676f075c51d3a24906504e490`: ARCHITECTURE COMPLETE / GOVERNANCE REVIEW REQUIRED. It defines security roles and boundaries but explicitly says implementation/technology are not selected and production qualification/governance acceptance are not granted.
- MH-12 index blob `8b2dba3d486df8284ac034145eb1f284b6d03bf7`: governance acceptance NOT GRANTED; implementation NOT AUTHORIZED by that architecture record.
- MH-12 unknowns blob `97f08824fb858dd4506876729ae37d610140c3e8`: exact auth stack, capability representation, PKI, certificate lifecycle, secret storage, hardware-backed security, recovery trust root, CI/CD signing path and cloud identity remain REQUIRES VERIFICATION.
- MH-13 privacy/data-governance blob `e732ff9cacbc9c1189bd83306cdff30906326cf0`: RECONSTRUCTED / PROPOSED, acceptance NOT YET VERIFIED, frozen NO, production implementation NOT AUTHORIZED. It explicitly marks exact ownership/stewardship, classification taxonomy, retention periods, deletion semantics, legal mappings and residency as unknown.
- MH-21 retention blob `8dfe3b619be593c3ec57948e350671895827ae8b`: PROPOSED / provider evidence required; provider claims are not canonical without current contractual evidence.

These states must not be collapsed into an “accepted governance” claim.

## 2. What is actually assigned vs what is missing

Wave 486 §3/R-06 and Wave 487 §10 assign **functional accountability**:
- Security Audit: integrity and controlled access to security events, including auditable audit reads.
- Privacy/Data Governance: data classification and retention policy.

Wave 486 §7 explicitly says actual accountable individuals/teams, deployed issuer/audit services, concrete KMS/HSM, identity registry, audit sink, legal retention approval and endpoint/network topology remain unresolved. Wave 487 §10 repeats that a concrete operational team is not assigned.

MH-12 gives the Security domain responsibility for identity, authentication, trust, capability, authorization, policy, secrets and compromise response, and places Audit after State Authority events in the canonical request path. However MH-12 is still governance-review-required and has no accepted implementation or production qualification. MH-12 unknowns retain the exact trust-root, secret-storage, cloud-identity and PKI gaps.

MH-13 defines the Privacy/Data Governance domain but is itself a proposed reconstruction, not accepted or frozen; it expressly leaves exact ownership/stewardship and retention/deletion/legal semantics unknown.

**Conclusion:** role-level responsibility is recorded; no named accountable operational owner, on-call/service team, deployed issuer, KMS/HSM, principal registry, authoritative revocation source, trusted-time service, tamper-evident audit sink, privacy/legal approver or retention/deletion operator is evidenced in accepted source. This is a governance and service-ownership blocker, not permission to invent people or implement an issuer.

## 3. Mature GitHub component search — audit / trust / key custody

Additional GitHub repositories inspected directly:

| Project | Mature capability found | Recovery Actor fit / limitation | Disposition |
|---|---|---|---|
| [immudb](https://github.com/codenotary/immudb) | Cryptographically verifiable immutable database; append-only versions; SQL/KV/document modes; transactions; can be run as service or embedded Go library | Strong candidate substrate for tamper-evident security-event storage. Does not supply identity authorization, policy, private metadata classification/retention approval, audit access governance, or Recovery Grant issuance. Embedded mode still requires an application process and storage lifecycle; service mode requires durable hosting/backup/operations | Candidate for a later audit-sink ADR only; no selection/deployment |
| [Sigstore Rekor](https://github.com/sigstore/rekor) | Transparency log with signed metadata and inclusion/integrity proofs; public service docs describe production availability | Primarily software supply-chain transparency, not private operational security audit. Public logging may disclose sensitive event metadata. README says Rekor v1 is in maintenance mode while v2 is being developed | Do not use as private Recovery Actor audit sink; possible artifact-provenance use only |
| [OpenBao](https://github.com/openbao/openbao) | Secret/key management, encryption, leasing and revocation, audit logging | Candidate key/secret custody and audit component, but requires persistent service, storage backend, operator and recovery/availability model; does not decide issuer authority, principal admission or consumer-specific one-use grants | Candidate only if accepted trust-custody and free-hosting ADR proves fit; no selection/deployment |
| [Ory Hydra](https://github.com/ory/hydra) | OpenID Certified OAuth2/OIDC server, token issuance/validation, client and JWKS management | General identity/token service, not private append-only audit storage or the exact atomic one-use recovery grant + D1 transaction | Previously assessed; no selection |

Important distinction: immudb and Rekor are evidence-integrity/logging technologies, not authority issuers. OpenBao can manage keys/secrets but does not decide who may issue a particular recovery capability. Hydra issues OAuth/OIDC tokens but does not close the consumer-specific state transition. No single component replaces the required trust boundary.

## 4. Architecture and free-infrastructure constraint

Cloud Pool's current target uses GitHub-hosted ephemeral runners and prohibits assuming a persistent owner-operated server or paid fallback. immudb/OpenBao self-hosted deployments require a persistent operating environment, storage durability, backup/restore, upgrades, monitoring and accountable operators. An embedded immudb library avoids a separate server but does not eliminate the need to qualify persistent local storage, recovery, audit-reader authorization, backup and retention; it also does not make ephemeral GitHub runners a durable audit host.

Rekor's public transparency log is not appropriate for private operational events unless a separately approved privacy-safe metadata design is proven; no such approval exists. No free-tier hosted backend or durable always-on service has been evidenced in this pass.

Therefore no audit/key-custody dependency is selected. Reuse remains a candidate after authority ownership and hosting/retention constraints are accepted; avoid building a bespoke append-only log or vault without first completing this fit/hosting ADR.

## 5. R-06 evidence requirements and unresolved gates

Before an issuer implementation can be authorized, evidence must identify:
1. named accountable Security Audit owner/team and on-call service operator;
2. named Privacy/Data Governance owner and legal/privacy approval path for classification, retention, deletion and legal hold;
3. issuer service operator and service-principal enrollment/recovery owner;
4. independent Security Trust Custodian and dual-control process for root/key lifecycle;
5. authoritative principal registry and revocation-state publisher with freshness/version guarantees;
6. qualified trusted-time source and skew/rollback handling;
7. selected audit sink with tamper evidence, read-access controls, backup/restore, deletion/legal-hold semantics and outage behavior;
8. approved hosting/availability/cost model consistent with free-only infrastructure, or explicit authorization for an alternative;
9. independent A3 reviewer who did not author, issue or implement the reviewed change.

Wave 486's 365-day security-evidence and 90-day operational-metadata retention periods remain target defaults only. MH-13 explicitly says historical exact retention is unknown; MH-21 says provider retention/deletion must be evidenced. Do not enforce those periods in production or collect extra personal data until the Privacy/Data Governance/legal gate accepts them.

## 6. Next bounded step

1. Keep Recovery Actor NOT IMPLEMENTED / NOT QUALIFIED and production dispatch FAIL-CLOSED.
2. Continue with a no-code source search for already accepted, owner-assigned security/audit/identity service decisions in the current canonical MediaHub map, governance issue history and Cloud Pool contracts. If none exists, record the gap; do not create a fictional service owner.
3. Once a concrete service/hosting candidate exists, compare immudb/OpenBao against the free-only and privacy requirements using an ADR and a threat model; keep Hydra/Rekor out of the recovery-grant issuance path.
4. Do not promote PR #63 or PR #60 without exact-head CI, current governance checks and required review evidence.

## 7. Status

- R-06 functional accountabilities: IDENTIFIED IN DRAFT TARGET DOCUMENTS.
- Named operational owners and accepted governance: NOT EVIDENCED.
- Issuer / trust custodian / principal registry / revocation source / trusted time: NOT IMPLEMENTED / NOT QUALIFIED.
- Audit sink / privacy retention approval: NOT SELECTED / NOT ACCEPTED.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

No secrets, credentials, private keys, live tokens or provider endpoints accessed. No workflow dispatch, runtime/schema/permission change, deployment or merge.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
