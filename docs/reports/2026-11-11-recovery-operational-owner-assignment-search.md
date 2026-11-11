# Recovery Actor — operational owner assignment source search

- Date: 2026-11-11
- Status: SOURCE SEARCH COMPLETE / NO ACCEPTED OPERATIONAL APPOINTMENTS FOUND / GOVERNANCE BLOCKED
- Cloud Pool default snapshot: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- Pre-pass documentation PR #63 head: `2e1a9b160906c5e0f926d6d342e0dd959bedbb8e`
- MediaHub default snapshot: `main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`
- Scope: no-code search for accepted, named operational owners or deployed service appointments for Security Issuer Authority, trust-anchor custody, principal/revocation registry, trusted time, security audit, privacy/retention and recovery quorum.
- Search boundary: public GitHub repository content, issues, pull requests and primary architecture/governance documents in the two project repositories. This does not claim visibility into external organizational records.

## 1. Result

No accepted GitHub source was found that appoints a named operational team/person, service operator or on-call owner for:
- Security Issuer Authority and Recovery Grant issuance;
- trust-anchor/key custody, dual control, rotation and compromise response;
- service-principal identity registry and enrollment/suspension/recovery;
- authoritative revocation-state publication and freshness;
- production trusted-time source;
- private, tamper-evident security audit sink and audit-reader access;
- Privacy/Data Governance classification, retention, deletion and legal-hold approval;
- recovery quorum and emergency activation.

The search did find functional role descriptions. A role label or responsibility statement is not an operational appointment, deployed service, or accepted authority grant.

## 2. Primary source reconciliation

MediaHub source snapshot: `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.

| Source | Exact evidence | What it establishes | What it does not establish |
|---|---|---|---|
| Wave 485 issuer contract skeleton | Blob `14cf0194504824a17569433d4478154eb44afc3f`; PR #598 head `37254c9f4ff09c39943f6924534a63dd44b5a431` | GOV-CAP-01…07 and R-06 were listed as TBD; document is DRAFT / NON-NORMATIVE / NOT ACCEPTED | No issuer, verifier owner, trust-anchor custodian, protocol, sink or retention owner |
| Wave 486 governance target | PR #599 head `824bb2568b2ac8bb3dceb3608366668e99bab95e` | Owner-directed target selects a separately governed Security Issuer Authority and assigns functional R-06 accountability to Security Audit and Privacy/Data Governance | No named operational owners, deployed issuer/audit service, KMS/HSM, principal registry or audit sink |
| Wave 487 issuer/verifier contract candidate | PR #600 head `05a873e82760d63c8b26dc496b43d3309f4cfbf9` | Converts the authority target into a technology-neutral draft contract | No concrete issuer/operator, token format, key custody provider, revocation source, trusted-time service or audit sink; explicitly not accepted/implemented |
| MH-12 index | Blob `8b2dba3d486df8284ac034145eb1f284b6d03bf7` | ARCHITECTURE COMPLETE / GOVERNANCE REVIEW REQUIRED; implementation NOT AUTHORIZED; governance acceptance NOT GRANTED | No production authorization or owner appointment |
| MH-12 Audit | Blob `ab6e1c652790fd9088ac26b595050774611da2fc` | Audit requirements: integrity, access control, privacy-aware retention, bounded storage and controlled export | No selected audit backend or operator |
| MH-12 Recovery Security | Blob `fdfb2ae6ecb7cc1ed1daecb18ad12aaf2a1c6149` | Recovery identity/authorization, operator separation, audit and post-recovery verification are required | No recovery quorum, custodian appointment or deployed recovery service |
| MH-12 unknowns | Blob `97f08824fb858dd4506876729ae37d610140c3e8` | Recovery trust root, PKI, key storage, cloud identity and related unknowns remain open | No accepted implementation selections |
| MH-13 privacy/data governance | Blob `e732ff9cacbc9c1189bd83306cdff30906326cf0` | Reconstructed / proposed, acceptance NOT VERIFIED, frozen NO; exact stewardship and retention/legal semantics unknown | No named privacy steward or approved retention/deletion schedule |
| MH-21 retention | Blob `8dfe3b619be593c3ec57948e350671895827ae8b` | PROPOSED / provider evidence required | No canonical operational retention approval |

Cloud Pool Issue #301 remains OPEN and puts A0 issuer/ingress/lease/cancel/recovery plus R-06 audit/privacy authority gates first in the ordered work. It is a task tracker, not owner appointment or implementation evidence. Cloud Pool PR #60 remains OPEN / DRAFT / UNMERGED at `234fb2ee40265e26fac00c69ac1b6192766602cb`; its exact-head workflow query returned no PR-triggered runs, formal reviews 0 and inline threads 0. Its issuer/trusted-time interface contract says no production issuer, key custody, revocation source or qualified clock is evidenced.

## 3. Search scope and negative result

Repository-scoped GitHub code searches were made for:
- `"Security Audit" owner operator service`;
- `"Privacy Data Governance" owner steward retention approval`;
- `"Trust Custodian" recovery authority quorum`;
- `issuer service owner KMS HSM principal registry revocation source`.

No code-search results were returned for those owner/appointment phrases. Issue search for `R-06 audit privacy owner` surfaced Issue #301 but no separate accepted owner assignment. PR search surfaced the Wave 485–487 issuer-document chain; the chain remains draft.

Current PR read-backs:
- PR #597: OPEN / DRAFT / UNMERGED, head `1e953ef817d67840fd04f70376d700400567426e`.
- PR #598: OPEN / DRAFT / UNMERGED, head `37254c9f4ff09c39943f6924534a63dd44b5a431`.
- PR #599: OPEN / DRAFT / UNMERGED, head `824bb2568b2ac8bb3dceb3608366668e99bab95e`; exact-head workflow run list empty; formal reviews empty.
- PR #600: OPEN / DRAFT / UNMERGED, head `05a873e82760d63c8b26dc496b43d3309f4cfbf9`; exact-head workflow run list empty; formal reviews empty.

The search is intentionally bounded to project GitHub evidence. Absence from these repositories is not proof that no person or team exists outside them; it means no appointment is evidenced in the project's accepted source of record.

## 4. Reuse decisions retained

- SOPS + age remain the selected MediaHub configuration/secret-encryption primitives under accepted component decisions; do not write a replacement encryption tool.
- Cosign remains the selected artifact signature/provenance mechanism; it does not grant a runtime Recovery Actor capability.
- OpenBao remains TARGET-CANDIDATE / FUTURE-GATED; do not deploy it as a second secret authority without a proved capability gap, accepted owner, security review, recovery/rotation design and free-only hosting proof.
- immudb remains a potential audit-storage mechanism only. It does not provide MediaHub event semantics, access authority, retention/legal approval, or Recovery Grant issuance. No durable free-tier hosted audit service or operator was evidenced.
- Rekor is supply-chain transparency, not the default private operational security-event sink.
- Ory Hydra is a general OAuth/OIDC server, not the consumer-specific one-use Recovery Grant plus atomic D1 transition.
- OpenTelemetry/Prometheus are non-authoritative observability mechanisms, not a substitute for the MH-12 security audit store.
- PostgreSQL is target-selected but future-gated in the component registry; it is not evidence of a currently qualified Cloud Pool audit service.

No new dependency is selected and no deployment is authorized by this search.

## 5. Disposition and next step

1. Preserve the named accountability functions already stated by Wave 486/487; do not fabricate actual team/person assignments.
2. Keep issuer, trust custodian, subject registry, revocation publisher, trusted-time service, audit sink, privacy/retention approver and recovery quorum as explicit unresolved gates.
3. Keep Recovery Actor NOT IMPLEMENTED / NOT QUALIFIED and production dispatch FAIL-CLOSED.
4. Next technical step after accepted owner/service evidence: prepare a constrained integration ADR comparing only the already selected SOPS/age design with any newly evidenced dynamic key/issuer requirement, and immudb/PostgreSQL audit-storage fit under the free-only hosting and durability constraints. Do not implement before ownership and hosting decisions pass.

No secrets, key material, live OIDC tokens or provider credentials were read. No workflow was dispatched; no runtime, schema, permission, workflow or dispatch gate was changed; no service was provisioned; no merge/deployment occurred.

- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
