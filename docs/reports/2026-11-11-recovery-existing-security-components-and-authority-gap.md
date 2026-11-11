# Recovery Actor — existing selected security components and unresolved authority ownership

- Date: 2026-11-11
- Status: SOURCE RECONCILIATION SUCCEEDED / EXISTING COMPONENTS QUALIFIED AS ARCHITECTURAL SELECTIONS ONLY / OPERATIONAL OWNER GAP OPEN / NO DEPLOYMENT
- Cloud Pool immutable base: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- MediaHub source snapshot: `main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`
- Scope: reconcile the Recovery Actor's security, secret, audit and trust dependencies against already-selected MediaHub components, current governance records and open Cloud Pool design evidence.
- Non-goals: name real operators, change cross-repository authority, create a new secret service, select an issuer protocol, request credentials/tokens, or make runtime/permission/workflow/dispatch/deployment changes.

## 1. Current repository refs and governance

### Cloud Pool
- Default branch `Основной` HEAD: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #63 is OPEN / DRAFT / UNMERGED at `c58e68e0e9a6634a29abdeacb20c0d1e2ece1723`, based on default at the immutable SHA above. Compare: 6 commits ahead / 0 behind; 4 documentation paths, 268 additions, 0 deletions.
- Exact-head PR-triggered workflow query for #63 returned no runs: CI NOT VERIFIED. Formal review submissions 0; inline review threads 0.
- PR #60 is OPEN / DRAFT / UNMERGED at `234fb2ee40265e26fac00c69ac1b6192766602cb`; base is `864213e2ff5b4fa956ba405dea8137a44d812f49`. Compared with current default it is DIVERGED, 7 ahead / 16 behind; merge base is `864213e2ff5b4fa956ba405dea8137a44d812f49`. It contains only the two proposed design/contract documents (318 additions, no deletions). Exact-head PR workflow query returned no runs; formal reviews 0; inline threads 0.
- Active Ruleset #26550182 applies to `refs/heads/Основной`: PR required, 0 required approvals, review-thread resolution required, deletion/non-fast-forward prohibited, no bypass actors. Zero required approvals is not independent security approval.

### MediaHub
- Default `main` source snapshot used: `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Wave 486 PR #599 remains OPEN / DRAFT / UNMERGED at `824bb2568b2ac8bb3dceb3608366668e99bab95e`; Wave 487 PR #600 remains OPEN / DRAFT / UNMERGED at `05a873e82760d63c8b26dc496b43d3309f4cfbf9`.
- Exact-head PR workflow-run queries for #599/#600 returned no runs and formal review lists are empty: CI NOT VERIFIED / independent review NOT RUN.
- Issue #127 (MH-12 autonomous security qualification) remains OPEN. Its stated status is architecture reconciled, qualification queued/not yet executed, closure pending fresh evidence.

## 2. Existing accepted component decisions — do not rebuild

The MediaHub `COMPONENT-ARCHITECTURE-DECISIONS.md` blob `42b2701f0d6a1014435e96118e41e33025dbff08` is marked ACCEPTED BASELINE. The component registry blob is `3ad109ba5ec9b095d0fac851514caadcefbe2f69`.

| Existing component | Canonical status | What it actually covers | Recovery Actor disposition |
|---|---|---|---|
| [SOPS](https://github.com/getsops/sops) | CURRENT_FOUNDATION / selected | Encrypted configuration and secret-file workflow | Reuse for encrypted static configuration where compatible; it does not issue Recovery Grants or provide a runtime authorization service |
| [age](https://github.com/FiloSottile/age) | CURRENT_FOUNDATION / selected | File encryption format/tool/library | Reuse as the selected SOPS encryption primitive; does not by itself provide root-key custody, operator quorum, online revocation or grant issuance |
| [Cosign](https://github.com/sigstore/cosign) | CURRENT_FOUNDATION / selected | Signing and verification of build/release artifacts | Reuse for artifact provenance where policy requires; its selected role is not an operational recovery audit sink or a grant issuer |
| [OpenBao](https://github.com/openbao/openbao) | TARGET-CANDIDATE / FUTURE-GATED | Secrets, key and identity service candidate | Do not deploy or duplicate SOPS/age. Registry requires a demonstrated capability gap, security review, recovery/rotation and HA/local-mode fit first |
| [immudb](https://github.com/codenotary/immudb) | Not in selected component registry; research candidate | Cryptographically verifiable immutable database | Candidate for a later audit-storage ADR only; not an identity/authorization authority |
| [Sigstore Rekor](https://github.com/sigstore/rekor) | Not a selected private audit component | Software-supply-chain transparency log | Not the default sink for private operational recovery events |
| [Ory Hydra](https://github.com/ory/hydra) | Not selected in MediaHub registry | General OAuth2/OIDC authorization server | Not a drop-in implementation of a one-use outbox/attempt/generation-bound Recovery Grant plus atomic D1 transition |

Source alignment:
- `architecture/COMPONENT-INTEGRATION-BOUNDARY.md` blob `d80f369ed126ac470ab60296559781e45cd203a4`, status ACCEPTED ARCHITECTURAL BASELINE, says SOPS/age are used for encrypted config/secrets and runtime receives only minimum plaintext.
- `architecture/COMPONENT-ARCHITECTURE-DECISIONS.md` blob above says SOPS+age CURRENT_FOUNDATION; OpenBao FUTURE_GATED.
- `components/COMPONENT-REGISTRY.yaml` explicitly marks `sops` and `age` selected, while `openbao` is `target-candidate`, `native_future_gated`, and requires capability-gap/security/recovery/rotation/HA-or-local-mode evidence before activation.
- Official release metadata read-back: SOPS latest stable release `v3.13.3` (2026-07-23); age latest stable `v1.3.2` (2026-08-29); OpenBao latest stable `v2.7.2` (2026-10-26). These release refs support project maturity only; they do not qualify a deployment or key-management design.

Important limitation: SOPS/age are already selected inside the MediaHub architecture. Cloud Pool is a separate repository/control plane. This record treats that selection as a proven existing component to evaluate for compatible encrypted configuration, not an automatic cross-repository deployment authorization. The Cloud Pool default branch currently has no SOPS/age implementation or manifest found by repository-scoped code search.

## 3. Audit and recovery architecture already specified

Primary source evidence:

- `docs/architecture/MH-12-audit.md` blob `ab6e1c652790fd9088ac26b595050774611da2fc`: audit is distinct from ordinary logging; it records who/when/operation/capability/context/authorization/policy/result; requires integrity protection, access control, privacy-aware retention, bounded storage and controlled export; does not become State Authority.
- `docs/architecture/MH-12-recovery-security.md` blob `fdfb2ae6ecb7cc1ed1daecb18ad12aaf2a1c6149`: recovery is a separate security boundary with explicit recovery identity/authorization, trusted artifacts, credential/key/certificate recovery, operator separation, audit and post-recovery verification.
- `docs/architecture/MH-12-index.md` blob `8b2dba3d486df8284ac034145eb1f284b6d03bf7`: MH-12 is ARCHITECTURE COMPLETE / GOVERNANCE REVIEW REQUIRED; implementation NOT AUTHORIZED, governance acceptance NOT GRANTED and production qualification NOT GRANTED.
- `docs/architecture/MH-12-unknowns.md` blob `97f08824fb858dd4506876729ae37d610140c3e8`: authentication stack, authorization implementation, capability representation, PKI, certificate lifecycle, secret storage, hardware-backed security, recovery trust root, CI/CD signing path and cloud identity remain REQUIRES VERIFICATION.
- `architecture/SECURITY-TRUST-AUTHORIZATION-CONTRACT.md` blob `8d831c2a8fa333977dd86524099568bae2a8db0e`: SOPS+age are selected secret-protection primitives; secrets must not be committed as plaintext or exposed to unauthorized components. It remains a proposed architectural baseline, not evidence of production deployment.
- `docs/checkpoints/2026-09-30-cprg-bootstrap-revocation-recovery-protocol.md` blob `fe486dcc5723788a90351150f5a0484b74b30692`: defines logical Trust Root, CPRG Authority, Recovery Authority and Audit Verifier roles; the roles are distinct. It explicitly states architecture-only status, no production keys/trust-root generation, no implementation option selected, and requires a recovery quorum/custody process.
- `docs/checkpoints/2026-09-30-mediahub-architecture-gaps-and-pushback.md` blob `13c3a158ed9c925eaefcd6fe106577bc425f765b`: G04 key-management/root-of-trust profile, G25 audit failure behavior and G27 recovery quorum/custody remain gaps in that architecture record.
- MH-13 blob `e732ff9cacbc9c1189bd83306cdff30906326cf0` remains RECONSTRUCTED / PROPOSED, acceptance NOT VERIFIED; exact ownership/stewardship and retention/legal/deletion semantics unknown.
- MH-21 retention blob `8dfe3b619be593c3ec57948e350671895827ae8b` remains PROPOSED / provider evidence required.

## 4. Authority assignment findings

The evidence distinguishes three layers:

1. **Functional accountability exists in draft target decisions:** Wave 486/487 assigns Security Audit responsibility for security-event integrity/access and Privacy/Data Governance responsibility for classification/retention.
2. **Logical trust roles exist in architecture:** Trust Root, Recovery Authority, Audit Verifier, Security Trust Custodian and separate Security Issuer Authority are role boundaries, not deployed services or named operators.
3. **Operational ownership remains unresolved:** no accepted source found that names the issuer operator, trust-custodian team/on-call, principal-registry operator, revocation publisher, trusted-time service owner, audit-sink operator, privacy/legal approver or recovery quorum members.

The source documents themselves confirm the gap:
- Wave 486 explicitly leaves actual teams, deployed issuer/audit service, KMS/HSM, identity registry, audit sink and exact operational principals to later evidence/ADR.
- Wave 487 states that a concrete operational team is not assigned.
- Wave 485 skeleton listed GOV-CAP-01…07 and R-06 as TBD before Wave 486 selected target dispositions; Wave 486 selected roles/defaults but did not invent the missing operational identities or deployed services.
- Issue #127 remains a qualification queue, not qualification evidence.

Targeted GitHub repository search for `Security Audit`, `Trust Custodian`, `Security Issuer Authority owner`, `audit sink owner team operator` and `key custody dual control` found architecture descriptions but no accepted named operator assignment. This is a scoped source-search result, not proof about external organizational records.

## 5. Cross-domain separation and implications

- CPRG Trust Root/Recovery Authority apply to the Protected Registration Plane. They must not be reused as the Cloud Pool Projection Recovery Actor issuer merely because the role names resemble each other.
- MediaHub Product State Authority, ASTRA A0, Jarvis, CPRG, Cloud Pool task Resolver and Projection Recovery Actor remain separate authorities/consumers.
- SOPS/age protect encrypted configuration and secret material; they do not establish who is allowed to mint a capability, decide policy, publish revocation or atomically consume a nonce.
- Cosign proves artifact signatures/provenance according to its trust policy; it does not establish runtime permission to recover an outbox row.
- OpenBao remains target-candidate, not an implicit second vault. A future ADR must compare its exact capability gap against the accepted SOPS/age design, especially operator/key custody and hosting.
- immudb may provide tamper-evident storage mechanics, but the application must still own event semantics, access, privacy, retention, fail-closed policy and audit-verifier role. It is not accepted in the component registry.
- Rekor is a supply-chain transparency log, not a private event database. Its public transparency characteristics conflict with treating it as a default private operational audit sink.

## 6. Recommended bounded next step

1. Preserve SOPS+age as the existing selected encryption primitive; do not build a custom file-encryption workflow.
2. Keep OpenBao FUTURE_GATED until a concrete operational capability gap and free-only service-hosting proof are established; do not deploy it as a speculative second secret authority.
3. Keep Cosign for artifact provenance only; do not repurpose it as the Recovery Grant service.
4. Keep immudb as a later audit-storage candidate only. Before a selection, define the event schema, private reader roles, retention/deletion/legal hold, backup/restore, outage semantics and free-only durable hosting.
5. Continue a no-code search for an accepted named Security Issuer / Trust Custodian / Audit operator assignment in canonical governance records. If no such record exists, leave the blocker explicit rather than assigning a person/team by inference.
6. Do not implement Recovery Actor until the issuer, trust anchor/custody, subject registry, revocation source, trusted time, audit sink and retention owner are evidenced and accepted.

## 7. Status

- Existing selected secret-encryption components: SOPS + age — CONFIRMED IN ACCEPTED COMPONENT ARCHITECTURE; runtime deployment in Cloud Pool NOT VERIFIED.
- Artifact provenance: Cosign — SELECTED in MediaHub component architecture; not an issuer or private audit sink.
- OpenBao: TARGET-CANDIDATE / FUTURE-GATED; NOT DEPLOYED / NOT SELECTED for Recovery Actor.
- Audit sink: NOT SELECTED / NOT QUALIFIED.
- Named operational security owners and recovery quorum: NOT EVIDENCED.
- PR #60: OPEN / DRAFT / UNMERGED; 7 ahead / 16 behind current default; exact-head CI NOT VERIFIED; reviews 0.
- PR #63: OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED; reviews 0.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

No secret values, key material, live tokens, external provider endpoints or private user data were accessed. No dispatch, runtime/schema/permission/workflow change, merge, deployment or paid resource created.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
