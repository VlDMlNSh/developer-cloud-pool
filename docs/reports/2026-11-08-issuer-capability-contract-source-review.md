# Issuer/capability contract source review — 2026-11-08

**Disposition: CONTRACT GAP CONFIRMED / RESOLVER NOT AUTHORIZED / NO RUNTIME CHANGE.**

## Immutable targets

- Cloud Pool default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #51 head: `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; base: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- MediaHub source snapshot: `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.

## Sources and pinned identities

### Cloud Pool
- [Supervisor/recovery architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/864213e2ff5b4fa956ba405dea8137a44d812f49/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md), blob `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`.
- [PR #51](https://github.com/VlDMlNSh/developer-cloud-pool/pull/51), head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`.
- [Migration 0005](https://github.com/VlDMlNSh/developer-cloud-pool/blob/4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7/proofs/d1-ledger/migrations/0005_create_attempt_reconciliation_queue.sql), blob `7a19897f6197c79517170e101e4cbf1db233cac6`.
- [Attempt adapter](https://github.com/VlDMlNSh/developer-cloud-pool/blob/4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7/proofs/d1-ledger/src/task-attempts.mjs), blob `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`.
- Issue #1 OPEN; active ruleset 26550182 requires zero approvals; Gemini controller absent from current default-branch workflow tree.

### MediaHub authority sources
- [MH-12 Capability Security](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/architecture/MH-12-capability-security.md), blob `8723cdb100b7ca5526616464f9fcdef60f4c61b7`.
- [MH-12 Security Architecture](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/architecture/MH-12-security-architecture.md), blob `cf4ebfd5bf471ca676f075c51d3a24906504e490`.
- [Compute Wire Protocol v1](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/checkpoints/2026-09-30-mediahub-compute-wire-protocol-v1.md), blob `7a741c7cac9934bb56cf95a79071230a6c5e809b`.
- [Wave 205 truth-ranked audit](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/checkpoints/MEDIAHUB-CONTOUR-A-TRUTH-RANKED-AUDIT-READINESS-WAVE-205-2026-10-19.md), blob `b6e57e06dd256bb150af2b3e19017dd70283b847`.
- [WB-14 source reconciliation](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/checkpoints/MEDIAHUB-CONTOUR-A-WB-14-JARVIS-A0-AND-DIRECT-LOCAL-ROUTE-SOURCE-RECONCILIATION-2026-10-15.md), blob `048376919db64de57e96e3ca56207eaf8a82f295`.
- [Issue #301](https://github.com/VlDMlNSh/mediahub-os/issues/301) remains OPEN and explicitly gates issuer/ingress/lease/cancel/recovery authority.

## Findings

### What PR #51 enforces
Migration 0005 creates a pending-only reconciliation row for `running → indeterminate`. It records task key, attempt ID, input digest, lease generation, expired lease owner and timestamp. The trigger requires the task's current attempt and generation to match. Earlier migration logic validates lease expiry. The queue does not contain an authenticated issuer, principal, capability, authorization decision, policy version, authority epoch, signed grant, revocation reference or evidence-verification result.

The adapter preserves the prior lease context and denies blind takeover/new attempt creation. This is a persistence boundary, not a resolver. It cannot establish whether the executor stopped, whether an external result exists, or who may decide a terminal outcome.

Supervisor architecture also says issue text is not an authority source beyond strict schema/profile validation. The current owner label is a narrow bootstrap dispatch approval for the scaffold, not a general delegated capability for retry or terminalization.

### What MediaHub defines
MH-12 requires capabilities to be bound to principal, issuer, operation, resource/target, scope, constraints, provenance, lifetime and revocation context. Attenuation may only narrow authority; a capability cannot self-grant. Identity, authentication, trust, capability, authorization and policy remain distinct; ambiguity must deny. Security cannot bypass Consumer Boundary or State Authority.

Compute Wire Protocol v1 provides conceptual signed envelopes, sender identity, authority epoch, expiry, payload digest, AdmissionRequest/Decision, signed ComputeLease, fencing, immutable artifact binding, idempotency and revocation. It is normative architecture, but production deployment is prohibited until qualification. It does not prove an implemented Cloud Pool issuer/verifier or settle final cryptographic profile, issuer enrollment/key ownership/rotation, trust-root distribution, online revocation source/propagation or concrete policy-epoch source. MH-12 explicitly leaves cryptographic technology choices UNKNOWN pending evidence and ADR.

MediaHub `AuthorizationContext(principal, capability)` plus allow-list policy is only a local policy seam. WB-14 documents no authenticated edge from FileTaskIngress into that context. The separate `mediahub.astra.control-command.v1` HMAC signer is a narrow node-specific operational command path with a freshness window; it is not proof of a general Cloud Pool admission capability or of integration with PR #51.

Wave 205 explicitly ranks issuer/capability authority P0 and says governance must settle it; do not invent issuer/key semantics.

## Contract decisions still required

These are unresolved questions, not semantics selected by this report:
1. Canonical issuer identity, enrollment/authorization, trust-root distribution, key ownership, rotation and compromise response.
2. Principal classes and proof of possession; keep principal, credential, session and capability distinct.
3. Exact operation, task/attempt/resource, repository/ref/target SHA, input digest, allowed transitions, constraints and maximum scope.
4. Issued-at/not-before/expiry, clock tolerance, unique grant ID, nonce/idempotency binding and replay retention.
5. Authoritative revocation source, propagation bound, outage behavior and treatment of in-flight work.
6. Delegation rules and cryptographic attenuation verification.
7. Authority epoch/fencing source of truth and relation to D1 lease generation.
8. Trusted evidence types, signature/provenance checks, conflict handling, decision issuer and audit record.
9. Domain separation: Cloud Pool execution authority must not become Jarvis, ASTRA A0 or MediaHub Product State Authority.
10. Failure behavior for unknown issuer, malformed signature, stale epoch, replay, wrong resource/operation, unavailable policy/revocation service and audit outage: deny/quarantine; no implicit retry or paid fallback.

## Mature GitHub components checked — candidates only

- [Cedar](https://github.com/cedar-policy/cedar): Apache-2.0 policy language/authorization engine with schema validation and formal-analysis tooling. Candidate for policy evaluation after principal/action/resource/context schema approval; it is not an issuer, signature verifier, key lifecycle or revocation service. See https://docs.cedarpolicy.com/ and https://github.com/cedar-policy/cedar.
- [libmacaroons](https://github.com/rescrv/libmacaroons): existing capability-token implementation supporting delegation and contextual caveats. Candidate for a later proof-of-fit only if governance selects macaroon-style attenuation; it does not decide issuer trust, root-key custody/rotation, revocation service or application-specific action/resource semantics.
- LiteLLM Proxy remains the separate provider-gateway candidate recorded in Cloud Pool Issue #26; its spend ledger is not an upstream provider-quota oracle and it is unrelated to issuer authority.

No candidate was installed, integrated, configured or adopted. No custom cryptographic format is proposed.

## Verification and disposition

- PR #51 exact-head run [42495716401](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495716401): COMPLETED / SUCCESS on exact SHA `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; job `128777501915` succeeded.
- PR #51 OPEN / DRAFT / UNMERGED; review submissions = 0; independent review NOT RUN.
- Issue #301 and Cloud Pool Issue #1 remain OPEN.
- No workflow dispatch, provider/model call, secret access, remote Cloudflare operation, deployment, merge or authority-state mutation occurred.
- Cloud Pool default branch remains `864213e2ff5b4fa956ba405dea8137a44d812f49`. This is a documentation-only report on the unmerged documentation branch.

**Decision: do not implement reconciliation resolver, retry, lease release, terminalization or provider dispatch from this queue.** The existing persistence evidence preserves uncertainty; it does not authorize resolving it.

Next gate: governance-owned issuer/capability contract decision for the Cloud Pool ↔ MediaHub compute boundary, explicitly mapping MH-12 and Compute Wire Protocol v1 and resolving the ten items above. Only then run a pinned proof-of-fit using mature components and negative tests for forged, expired, revoked, replayed, wrong-resource, wrong-operation and stale-epoch grants, plus policy/revocation/audit outages.

## Canonical references
- Cloud Pool Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Cloud Pool checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/checkpoints/2026-11-06-cloud-pool-next-checkpoint.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
