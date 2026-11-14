# Projection Recovery Actor Capability v1 — corrected narrow-scope contract

Date: 2026-11-11

## Status and precedence

- Status: DESIGN RECONCILIATION / NOT IMPLEMENTED / NOT QUALIFIED.
- This corrected version supersedes the earlier draft of this file. The earlier draft incorrectly included task-attempt resume and new-attempt authorization. Those permissions are expressly out of scope and must not be implemented.
- Scope: **one operation only** — terminalize one exact, expired and exhausted projection-delivery outbox lease as `dead_letter`.
- Immutable implementation candidate: PR #67 head `dea09ffe94059f446c74fada37971087ec4878eb`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Existing design sources: PR #60 and its parent ADR at design branch head `234fb2ee40265e26fac00c69ac1b6192766602cb`; issuer/time contract blob `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`.
- Governance evidence source: PR #63 head `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`.
- Documentation-only branch: `docs/projection-stack-reconciliation-2026-11-11`; not merged to default.
- No code, schema, permission, workflow, secret, resource, deployment or dispatch change is authorized by this document.

## 1. Normative authority boundary

The Projection Recovery Actor is separate from the Delivery Worker and Task Supervisor/Worker.

**Allowed capability:** `dead_letter_expired_projection` for one exact projection outbox row only.

**Explicitly prohibited:**
- task execution retry, task attempt resume, retry-candidate creation or new attempt creation;
- changes to `pool_tasks`, `pool_attempts`, task/attempt terminal status, result/provenance digest or task lease;
- GitHub writes, comments, labels, repository/target binding changes, or external projection replay;
- task dispatch, Worker/Supervisor invocation, or broad repository permissions;
- batch scanning or wildcard resource access.

The Recovery Actor can only terminalize a projection-delivery outbox row after its delivery attempt budget is exhausted and its current lease has expired. Lease expiry alone does not prove that an external effect did not occur and is not permission to retry the task or repeat a GitHub side effect.

This is narrower than the generic task Resolver capability. Do not reuse a task Resolver grant, expand its operation allowlist, or treat a caller-provided actor ID as proof of authority.

## 2. Exact grant profile

The trusted issuer/verifier boundary must validate a signed or otherwise cryptographically authenticated grant with at least:

| Claim | Required constraint |
|---|---|
| Schema/version | Exact supported profile version; unknown versions deny |
| Issuer and key/version | Resolve from trusted issuer/key configuration; never trust caller-selected key material |
| Subject | One enrolled Projection Recovery Actor principal, checked against authoritative subject lifecycle |
| Audience | Exactly `projection-outbox-recovery` |
| Operation | Exactly `dead_letter_expired_projection` |
| Repository | Exact immutable numeric repository ID |
| Outbox | Exact `outbox_id` |
| Attempt | Exact immutable `attempt_id` associated with the outbox row |
| Delivery generation | Exact expected `lease_generation_delivery` |
| Event digest | Exact immutable projection event digest |
| Attempt ceiling | Exact configured maximum delivery-attempt precondition (currently 5 in the isolated proof; do not treat this as a universal production setting without configuration evidence) |
| Validity | `not_before` and `expires_at`, evaluated by qualified trusted time |
| Replay | Unique grant ID and nonce; one use only |
| Policy | Policy version / authority epoch where required by the issuer governance contract |

Reject unknown or duplicate claims, malformed/non-canonical encodings, unsupported schema, wrong audience/subject/operation, mismatched resource, revoked issuer/key/policy, stale revocation state, not-yet-valid or expired grants, and replay.

A registered GitHub secret, repository variable, environment name, actor string, workflow identity, or D1 binding is not by itself an issuer or grant. Do not add `id-token: write` to the Supervisor or request a live OIDC token until the issuer trust policy and accountable owners are accepted. GitHub Actions OIDC is only a possible workload-authentication input, not the Recovery Grant issuer itself.

## 3. Required atomic transition

The conditional transaction must re-check all predicates against current database state:
- exact outbox ID and immutable repository/attempt/event-digest binding;
- row status is `leased`;
- exact current delivery generation;
- lease expiry is at or before qualified trusted time;
- delivery attempts meet the configured exhaustion ceiling;
- grant issuer/subject/audience/operation and every resource claim match the same row;
- grant validity window is current;
- nonce/grant ID has not already been consumed.

The same atomic database unit must:
1. mark only the projection outbox row `dead_letter`;
2. clear delivery lease owner and expiry;
3. persist a bounded reason code and separately authenticated recovery actor attribution;
4. persist grant ID/digest and recovery timestamp;
5. consume the grant nonce exactly once under a database uniqueness constraint;
6. append one immutable `delivery.dead_letter` event attributed to the Recovery Actor.

A zero-row conditional update is DENY / stale / already handled. Database error, ambiguous commit or failed read-back is NOT VERIFIED. Read-back must prove the exact terminal row and unique event. Do not assume an ambiguous write failed and blindly retry it.

No mutation of task or attempt state may be included in this transaction.

## 4. Trusted-time boundary

The preferred time source is database-generated UTC time evaluated in the same transaction as lease expiry, grant validity and nonce consumption, but only if the exact pinned local and hosted D1 semantics are demonstrated. Otherwise, a separately qualified trusted composition-root clock must document provenance, skew bounds, monotonicity/backwards-jump handling and fail-closed behavior.

The source must govern both outbox lease expiry and grant `not_before`/`expires_at`. Caller-supplied timestamps are not authoritative. Test clock injection is allowed only behind a test-only adapter, never through a production public API.

The issuer/time contract records target limits of grant lifetime no greater than 300 seconds and revocation-state age no greater than 30 seconds from the Wave 486/487 draft target. These are not accepted production settings: PR #599/#600 remain draft and governance/operational owners are unresolved. Treat them as proposed constraints pending acceptance, not deployed guarantees.

## 5. Issuer and R-06 governance gates

Wave 486/487 documents select a separately governed Security Issuer Authority as an owner-directed target, distinct from Jarvis, ASTRA A0, executors and Product State Authority. They remain DRAFT / NOT ACCEPTED / NOT IMPLEMENTED. Functional accountability is assigned to Security Audit (integrity and controlled access) and Privacy/Data Governance (classification and retention), but no named operational owners or deployed services are evidenced.

Before implementation, accepted source evidence must identify:
1. issuer service/operator and issuance principal authentication;
2. trust-anchor/key custodian, dual control, rotation, revocation and compromise response;
3. enrolled subject registry and lifecycle/suspension semantics;
4. authoritative revocation-state publisher and freshness/version guarantees;
5. qualified trusted-time source;
6. private audit sink, operator, read-access control, integrity, backup/restore and outage behavior;
7. Privacy/Data Governance and legal approval for classification, retention, deletion and legal hold;
8. recovery activation/quorum and independent reviewer;
9. hosting, durability and availability model consistent with free-only infrastructure or an explicitly accepted exception.

Do not invent names or services to fill these gaps. Absence in project GitHub evidence does not prove absence outside the repositories; it means the accepted project source of record does not yet evidence the appointment.

## 6. Mature-component disposition

Existing project research establishes:
- SOPS + age are selected MediaHub encrypted configuration/secrets primitives; reuse their existing role, but they do not issue dynamic Recovery Grants or provide online revocation/nonce consumption.
- Cosign is selected for artifact signing/provenance; it does not authorize runtime recovery.
- OpenBao is TARGET-CANDIDATE / FUTURE-GATED, not an approved second vault or Recovery Grant issuer.
- immudb is a possible future tamper-evident audit-storage candidate, not a selected authority or deployed free-tier sink.
- Rekor is a supply-chain transparency log, not the default private operational audit sink.
- Ory Hydra, Keycloak, ZITADEL and authentik are general identity products, not complete one-use consumer-bound D1 recovery transitions.
- SPIRE provides workload identity/attestation, not the operation-bound one-use grant.
- Biscuit and Cedar may inform capability/policy implementation, but neither replaces issuer governance, revocation state, durable nonce uniqueness and atomic D1 transition.

No new dependency is selected. Do not build a bespoke IAM server, vault, policy engine or append-only log before a concrete accepted gap and operational ownership are demonstrated.

## 7. Negative-first test matrix

Every denial must leave the outbox, task and attempt unchanged; must not consume a nonce unless the transaction definitively committed; and must not leak grant/key/secret material into logs.

| ID | Adversarial case | Expected result |
|---|---|---|
| N01 | Caller supplies arbitrary `recoveryActorId` or `verified: true` object | DENY |
| N02 | Worker or Supervisor invokes recovery operation | DENY |
| N03 | Missing, malformed or unsupported grant | DENY |
| N04 | Unknown issuer/key, revoked/retired key or policy epoch | DENY |
| N05 | Signature tampering, algorithm substitution or caller-selected key | DENY |
| N06 | Wrong subject, audience or operation | DENY |
| N07 | Wrong repository ID, outbox ID, attempt ID, generation or event digest | DENY |
| N08 | Wildcard, batch or extra task/attempt permissions | DENY |
| N09 | Non-exhausted attempt count, live lease or non-leased row | DENY |
| N10 | Stale generation or already terminal row | DENY |
| N11 | Not-before/expiry boundary invalid, stale revocation state or clock failure | DENY |
| N12 | Reused nonce/grant ID, including concurrent duplicate requests | At most one commit |
| N13 | Two valid grants race on one row | At most one commit |
| N14 | Changed immutable outbox binding/event digest | DENY |
| N15 | Database failure before commit | No state mutation |
| N16 | Ambiguous commit or failed read-back | NOT VERIFIED; no blind retry |
| N17 | Audit append or immutability constraint fails | Entire atomic transition fails |
| N18 | Attempt to mutate `pool_tasks` or `pool_attempts` | DENY; invariant test |
| N19 | Attempt to retry, requeue, dispatch or call GitHub API | DENY; invariant test |
| N20 | Oversized, duplicate-key, unknown-field or non-canonical input | DENY |
| N21 | Grant/evidence/log path contains secret material | Redacted; no secret leakage |
| N22 | Capability lifetime/revocation freshness exceeds accepted policy limits | DENY |

Positive controls: one successful terminalization of an exact expired exhausted outbox row; exact read-back; one nonce-consumption record; one immutable audit event; proof that task/attempt state and GitHub remain untouched.

## 8. Existing repository evidence and disposition

- PR #60 parent ADR blob: `59a4be21516da0e005114acfe015aee7787524dc`; issuer/time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`. Both are on an older design branch based at `864213e2ff5b4fa956ba405dea8137a44d812f49`; PR #60 is OPEN / DRAFT / UNMERGED and its exact-head workflow list is empty.
- PR #63 component/authority audit branch head: `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`; exact-head PR workflow list empty; reviews 0. It documents the absence of accepted operational issuer, key custodian, principal registry, revocation source, trusted time, audit sink and privacy/legal operator appointments.
- PR #67 implementation candidate head: `dea09ffe94059f446c74fada37971087ec4878eb`; exact-head runs #43064261520 and #43064261551 SUCCESS. Combined status contexts remain empty; formal reviews 0. These runs do not test a Recovery Actor.
- Active ruleset #26550182 applies to `refs/heads/Основной`: PR required, deletion and non-fast-forward blocked, review-thread resolution required, zero required approvals, no bypass actors; current user cannot bypass. Zero approvals is not independent review.
- Documentation branch default is not; this contract is a draft document and not merged. No source implementation, tests, secrets, hosted D1, dispatch, deployment or provider/model calls were made in this pass.
- Independent review remains deferred until after actual Cloud Pool launch by owner direction.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Next: continue source-only authority/ownership reconciliation and exact-state transition review. Do not implement issuer or recovery runtime until issuer, custodian, registry, revocation, time, audit/privacy owners and hosting model have accepted evidence.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
