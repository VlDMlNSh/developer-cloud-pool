# MediaHub authority-source crosswalk for Projection Recovery — 2026-11-11

## Status and scope

- Status: SOURCE RECONCILIATION COMPLETED / CANONICAL NAMED CONTRACTS NOT FOUND / RELATED SEMANTICS IDENTIFIED / NO IMPLEMENTATION AUTHORIZED.
- Cloud Pool default target: Основной@221f216c00ca7e5596bcc682ba185ad155a10603.
- Cloud Pool documentation branch target before this report: docs/projection-stack-reconciliation-2026-11-11@e4a498521135489a3bf54e1ab270dd22cecb0526.
- MediaHub canonical documentation ref: docs/mediahub-chat-tree-map-20261012@d9a289b9113f7567711b641a7017eb814d6c259d.
- MediaHub main source snapshot: main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0.
- No runtime, schema, workflow, permission, secret, dispatch, hosted-resource, deployment, merge or provider/model action was performed.

## 1. Search result: exact contract titles

The Cloud Pool issuer/trusted-time contract at blob 6c8bc0a06f8eb0f354da397ba2bd9629b348c90c states that the repository contains a proposed backend-neutral Shared Immutable Claim Lifecycle Contract and Trusted Reconciliation Authority Contract.

A bounded source search was performed:
- Cloud Pool default branch and the PR #60 parent snapshot 864213e2ff5b4fa956ba405dea8137a44d812f49;
- MediaHub main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0;
- MediaHub canonical documentation branch docs/mediahub-chat-tree-map-20261012@d9a289b9113f7567711b641a7017eb814d6c259d;
- GitHub code search for exact titles and relevant name variants;
- full recursive Git trees for the Cloud Pool PR #60 parent and MediaHub canonical documentation branch.

**Result:** no file with either exact canonical title, and no exact-title source path/blob was identified in those inspected refs. The Cloud Pool PR #60 patch contains only the Projection Recovery ADR and issuer/trusted-time contract; it does not add either generic source contract. MediaHub PR #599/#600 changed-file lists likewise do not contain either named contract.

Therefore the exact named contracts' canonical repository/path/version/status remain NOT VERIFIED. The phrase in the Cloud Pool issuer contract is not sufficient proof of their exact contents or normative status. The earlier crosswalk's statement that they were not located remains valid; this pass improves the semantic source map below rather than pretending the exact titles were found.

## 2. Related MediaHub sources actually located

| Source | Immutable evidence | Status | Reusable semantics / boundary |
|---|---|---|---|
| P0-07 D2 Trusted Authorization Context Authority and Lifecycle Proposal | canonical docs branch blob c0ae0d3fe340c3e50382b7d4aa8da7b6b5f56d9f | ARCHITECTURE PROPOSAL / GOVERNANCE REVIEW REQUIRED / NOT ACCEPTED / NOT FROZEN | Proposes identity provenance, issuer/attestation authority, audience, scope, expiry/freshness, revocation, replay, request/resource binding, transaction lifecycle and restart/recovery. It explicitly selects no technology, service, schema or API. Reuse as requirements vocabulary only, not as an accepted issuer contract. |
| WB-04 Capability Issuer / Trusted-Context Lifecycle Matrix | blob dac5e9eab9ec69ab7d15ac8eea45d7a1c8922387 | SOURCE-BOUND / NON-NORMATIVE / NOT IMPLEMENTED / NOT ACCEPTED | Enumerates principal lifecycle, issuer authority, capability binding, audience, attenuation, expiry, revocation, consumer verification, replay and audit gaps. Its key conclusion is that a typed context or tuple grant is not proof of issuer provenance. |
| WB-06 AuthorizationContext Producer/Consumer Source Inventory | blob 9bd850e869dbd19db9bde2ce08768aaf502c95a2 | BOUNDED SOURCE INVENTORY / NON-NORMATIVE / NOT IMPLEMENTED / NOT QUALIFIED | Confirms the existing in-process AuthorizationContext(principal, capability) + tuple-policy seam and a separate HMAC command-envelope seam. It does not establish an authenticated issuer-to-consumer chain. Do not treat the local context type or command HMAC as a Recovery Grant. |
| P0-05 Consumer Contract v1.1 candidate | blob 79e2b4865c47b5394ade266cd3cd7cfbe3097717 | NON-NORMATIVE / GOVERNANCE REVIEW REQUIRED / NOT ACCEPTED / NOT FROZEN | Preserves P0-04 as sole canonical transaction/mutation authority and P0-05 as sole consumer boundary; prohibits P0-07 capability translation/self-grant. It records unresolved D6 discrepancy between a DRAFT contract header and implementation acceptance record. It is not an issuer or Recovery Actor grant contract. |
| P0-06 Core Runtime Services Boundary + Service Contract | blobs 2f5f2d01cca82ce117fe39f499348bdfec3ff8fc and ff21515e589b10fcbe2b167c3aadb3f66b32b4ae; governance record add5bfa5a5d898f74622d925b125f14cd3d1452c | ACCEPTED — IMPLEMENTATION AUTHORIZED within bounded scope; production qualification NOT GRANTED | Reuse invariants: explicit operation/principal/capability, default deny, no self-grant, preserve P0-05/P0-04, deterministic generation/freshness and fail-closed behavior. It explicitly excludes durable persistence, databases, network transport/mutation and recovery/update engine. It cannot authorize Cloud Pool D1 recovery or an external issuer. |
| MediaHub Security / Trust / Authorization Contract | blob 8d831c2a8fa333977dd86524099568bae2a8db0e | PROPOSED ARCHITECTURAL BASELINE | General invariants: default deny, least privilege, operation/resource checks before mutation, stale/revoked credential rejection, recovery uses explicit capabilities, auditable security facts. Not a selected protocol or production authority. |
| MH-12 Audit and Recovery Security | blobs ab6e1c652790fd9088ac26b595050774611da2fc and fdfb2ae6ecb7cc1ed1daecb18ad12aaf2a1c6149 | Architecture-level requirements; governance/implementation not accepted | Audit must be distinct from ordinary logging, integrity protected, access controlled and privacy bounded. Recovery is a separate identity/authorization boundary with operator separation and post-recovery verification. Neither chooses a sink, issuer or operator. |
| Wave 486 issuer governance disposition | MediaHub PR #599, head 824bb2568b2ac8bb3dceb3608366668e99bab95e; decision blob 13e6745463dbc05a7c188423bb45ffb2b210c789 | OWNER-DIRECTED TARGET / NORMATIVE ACCEPTANCE PENDING / RUNTIME BLOCKED; PR OPEN/DRAFT/UNMERGED | Selects a separate Security Issuer Authority as a target and functional R-06 accountabilities. Explicitly does not evidence deployed service, named staff, key custodian, identity registry, audit sink or operational principals. |
| Wave 487 A0 Issuer and Verifier Contract | MediaHub PR #600, head 05a873e82760d63c8b26dc496b43d3309f4cfbf9; contract blob 1200d343139c8e67a826902b3ade09d4987c537d | DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED; PR OPEN/DRAFT/UNMERGED | Strongest reusable pattern for issuer lifecycle, principal generation, requester provenance, finite claims, audience, per-consumer verification, ≤300s lifetime, ≤30s revocation freshness, one-use/idempotency and audit. But it is specifically an A0 ingress contract; its audience and task/mission semantics are not the Cloud Pool projection recovery audience/operation. Do not reuse an A0 grant or treat it as an accepted common authority contract. |

## 3. Crosswalk: what the Projection Recovery Actor may reuse

| Concern | Reuse | Do not import / remaining condition |
|---|---|---|
| Issuer separation | Wave 486/487 target of a dedicated Security Issuer Authority separate from Jarvis, A0 and Product State Authority | No implementation or operational appointment is evidenced; the authority cannot be created by Cloud Pool itself |
| Principal identity | Wave 487 stable non-secret principal ID, explicit lifecycle state and identity generation | Cloud Pool Recovery Actor must have its own admitted service-principal record; an Actions workflow name, actor string or workerId is not authentication |
| Claim/capability semantics | Wave 487 format-neutral issuer, requester, subject, audience, operation, resource, constraints, expiry, policy version, revocation reference and immutable request binding | Do not copy the A0 audience, task grant, Jarvis requester or A0 ingress approval. Recovery must remain its own exact audience and one operation |
| Consumer verification | Each protected consumer verifies its own authority immediately before effect | Cloud Pool verifier must be independently admitted and cannot rely on A0's decision or typed caller object |
| Revocation | ≤30s maximum state age and monotonic generation are target defaults in Wave 486/487 | Defaults are not production-qualified. A real revocation publisher, freshness/version contract and owner are missing |
| Trusted time | P0-07 D2/WB-04 require expiry/freshness and fail-closed clock semantics; Wave 487 requires bounded time confidence | No production trusted-time source or owner. D1 transaction time is preferred only after exact D1 semantics are qualified; injected test clock is not production evidence |
| Replay/nonce | Wave 487 durable idempotency and one logical acceptance; Cloud Pool ADR requires nonce consumption atomic with dead-letter | Existing Cloud Pool D1 projection outbox is the state substrate, but no issuer-backed recovery nonce ledger/atomic integration exists |
| State authority | P0-04/P0-05 single authority and P0-06 no second canonical store are useful architectural guardrails | These MediaHub contracts do not govern Cloud Pool's D1 outbox or authorize a new cross-repository mutation path |
| Audit | MH-12 integrity, controlled access, privacy-aware retention; Wave 487 correlated tamper-evident security evidence | No accepted private sink/operator, privacy/legal retention approval or durable audit transaction is evidenced |
| Recovery semantics | MH-12 requires separate recovery identity/authorization, operator separation and post-recovery verification | Cloud Pool's allowed operation remains only dead_letter_expired_projection; no requeue, retry, task/attempt mutation, GitHub write or dispatch |

## 4. Corrected interpretation of the two referenced generic contract names

The inspected evidence does not justify treating "Shared Immutable Claim Lifecycle Contract" and "Trusted Reconciliation Authority Contract" as exact, canonical, accepted MediaHub document names. The closest source-backed semantic material is distributed across P0-07 D2, WB-04/WB-06, the P0-05 candidate, the proposed Security/Trust contract, MH-12, and the Wave 486/487 issuer sequence.

These are not interchangeable:
- P0-07 D2 and WB-04/WB-06 are proposals/inventories, not accepted issuance authority.
- P0-05 v1.1 is a non-normative consumer-boundary candidate with D6 unresolved.
- P0-06 is accepted only within a scope that explicitly excludes persistence, networking and recovery implementation.
- Wave 487 is an A0-specific draft, not a universal issuer contract.
- Wave 486 selects a governance target, not a deployed issuer or named operator.
- MH-12 provides audit/recovery principles, not a selected audit backend or trust service.

Accordingly, do not write a new "shared contract" or rename one of these artifacts to imply canonicality. If the two generic names refer to documents in another repository/ref or an external governance package, their authoritative refs must be supplied by the source owner or discovered through the exact source lineage. Until then, record them as unresolved references.

## 5. Projection Recovery profile — retained narrow design

The Cloud Pool-specific profile in PR #60 remains the right scope boundary:
- audience exactly projection-outbox-recovery;
- operation exactly dead_letter_expired_projection;
- exact repository ID, outbox ID, attempt ID, delivery generation and immutable event digest;
- exact admitted Recovery Actor subject and identity generation;
- grant ID/nonce, policy/authority epoch and revocation generation;
- expiry/not-before evaluated by qualified trusted time;
- one transaction consumes nonce, terminalizes only the outbox, clears lease and appends an immutable event attributed to Recovery Actor;
- read-back of exact terminal row and unique event before reporting success.

Wave 487's 300s/30s values may be carried as proposed target ceilings only. They are not a production policy until issuer/revocation/time owners and the governance acceptance are established.

## 6. Current governance and CI state

- Cloud Pool PR #60: OPEN/DRAFT/UNMERGED; head 234fb2ee40265e26fac00c69ac1b6192766602cb; base 864213e2ff5b4fa956ba405dea8137a44d812f49.
- Cloud Pool PR #63: OPEN/DRAFT/UNMERGED; head 4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6; exact-head workflow list empty in current check; NOT VERIFIED.
- Cloud Pool PR #66: OPEN/DRAFT/UNMERGED; head e4a498521135489a3bf54e1ab270dd22cecb0526; exact-head workflow list empty; NOT VERIFIED.
- Cloud Pool PR #67: OPEN/DRAFT/UNMERGED; head dea09ffe94059f446c74fada37971087ec4878eb; runs 43064261520 Isolated D1 Ledger Proof and 43064261551 Pool Contract Validation COMPLETED/SUCCESS. These are local proof/contract workflows, not Recovery Actor or hosted qualification.
- MediaHub PR #599: OPEN/DRAFT/UNMERGED at 824bb2568b2ac8bb3dceb3608366668e99bab95e; exact-head CI NOT VERIFIED, review NOT RUN.
- MediaHub PR #600: OPEN/DRAFT/UNMERGED at 05a873e82760d63c8b26dc496b43d3309f4cfbf9; exact-head CI NOT VERIFIED, review NOT RUN.
- Ruleset #26550182 active on refs/heads/Основной; PR required, deletion/non-fast-forward blocked, review-thread resolution required, zero required approvals, no bypass actors, current user cannot bypass. Zero approvals is not independent review.
- Issue #301 remains OPEN and prioritizes Contour A qualification/operation of the cloud-agent development fabric.

## 7. Disposition and next step

- Shared Immutable Claim Lifecycle Contract exact source: NOT LOCATED / NOT VERIFIED.
- Trusted Reconciliation Authority Contract exact source: NOT LOCATED / NOT VERIFIED.
- Related MediaHub semantic source map: LOCATED; acceptance status varies as stated above.
- Projection Recovery issuer/trusted-time contract: PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Independent review remains deferred until after actual Cloud Pool launch, per owner direction.

Next: resolve whether the two generic contract names point to an external or unindexed source by tracing the authoring provenance of PR #60's issuer contract. If no such source can be produced, correct the issuer contract's generic reference in a controlled docs-only revision to cite the actual P0-07/WB-04/WB-06/Wave487 source artifacts and their statuses, without claiming they are accepted common contracts. Do not implement issuer/recovery runtime before governance ownership and service evidence.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
