# 2026-11-11 — Projection Recovery Actor live readiness recheck

## Immutable target and scope

- Default branch `Основной` HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- Documentation branch created from that exact SHA: `docs/recovery-actor-live-readiness-2026-11-11`.
- Read-only recheck of Cloud Pool PR #60/#63 and MediaHub PR #599/#600 / Issue #301.
- Documentation only. No runtime, schema, workflow, permission, secret, token, resource, dispatch, deployment, provider call, merge, or branch-protection change.

## Current evidence

### Cloud Pool

- PR #60, `design/projection-recovery-actor-contract-2026-11-11`, head `234fb2ee40265e26fac00c69ac1b6192766602cb`, remains OPEN/DRAFT/UNMERGED. Against current default HEAD it is DIVERGED: 7 ahead / 59 behind, merge base `864213e2ff5b4fa956ba405dea8137a44d812f49`. It contains two design documents only. Exact-head check-runs: 0; CI NOT VERIFIED.
- PR #63, `docs/recovery-actor-component-fit-2026-11-11`, head `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`, remains OPEN/DRAFT/UNMERGED. Against current default it is DIVERGED: 48 ahead / 43 behind, merge base `6fdcedebeba62715122e43a75c6ad6d926321ce7`; 19 documentation paths. It must not be merged wholesale. Its source reports are useful evidence, not a current-base integration.
- The Recovery Grant + trusted-time contract blob `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c` is a proposal, not an implementation. It correctly requires a distinct issuer, audience `projection-outbox-recovery`, operation `dead_letter_expired_projection`, exact repository/outbox/attempt/generation/event-digest binding, one-use nonce, ≤300-second capability lifetime and ≤30-second revocation-state age. These limits are target defaults from draft MediaHub governance, not accepted production policy.
- The contract rejects caller-supplied actor IDs, decoded claims, arbitrary `now`, caller-selected issuers/keys and fabricated branded objects. It requires trusted composition-root verification, trusted time, atomic grant/nonce/dead-letter transition, and exact read-back. No production verifier, trusted clock, issuer, registry, revocation source or audit sink is evidenced.
- The local dead-letter proof still has no independent reaper: expired fifth-lease recovery requires the original worker identity. A recovery actor must remain unable to retry/requeue, dispatch, mutate task/attempt state or write GitHub.

### MediaHub governance dependency

- Issue #301 remains OPEN and orders A0 issuer/ingress/lease/cancel/recovery and R-06 audit/privacy gates before agent admission/dispatch.
- PR #599 (Wave 486) remains OPEN/DRAFT/UNMERGED at `824bb2568b2ac8bb3dceb3608366668e99bab95e`; it selects a separately governed Security Issuer Authority as a target, but explicitly does not evidence named teams/services, key custody, registry or audit sink.
- PR #600 (Wave 487) remains OPEN/DRAFT/UNMERGED at `05a873e82760d63c8b26dc496b43d3309f4cfbf9`; it is a technology-neutral normative candidate, NOT ACCEPTED / NOT IMPLEMENTED. Exact-head check-runs returned 0 for both heads. No accepted operational owner assignment or independent A3 review was established by this recheck.
- This Cloud Pool recovery consumer is distinct from Jarvis, ASTRA A0 ingress, task Resolver, CPRG and MediaHub Product State Authority. No cross-authority grant reuse is allowed.

## Reuse / mature-component decision

- Reuse existing selected SOPS + age for encrypted static configuration/secrets where compatible, and Cosign for artifact provenance only; neither is a grant issuer, online revocation authority or private operational audit sink.
- OpenBao remains FUTURE-GATED; do not add a second vault without a demonstrated capability gap and accepted operations/security plan.
- immudb remains an unselected audit-storage candidate; Rekor is not the private operational event sink; Ory Hydra is not a drop-in one-use resource/generation-bound grant + atomic D1 transition.
- No new dependency is justified. The current blocker is governance/authority ownership and production trust infrastructure, not a missing crypto library.

## Findings and disposition

1. **Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.**
2. **Issuer and trusted time: BLOCKED** by absent accepted operational issuer owner, trust/key custodian, subject registry/revocation owner, qualified clock, audit sink/operator and privacy/retention approval.
3. **PR #60/#63: do not merge as-is**; both are stale/diverged from current default and have no exact-head CI evidence in this recheck.
4. **Implementation is not the next safe step.** First obtain accepted governance/operational source records and a current-base contract reconciliation. Do not mint test credentials, request live OIDC tokens, add `id-token: write`, deploy OpenBao, or provision hosted D1/DO/Workers.
5. Keep the existing local D1 proof isolated and fail-closed. No new reaper path should be coded until its authority, identity lifecycle, trusted time and audit transaction are accepted.

## Status

- Read-only source recheck: VERIFIED for the refs and exact-head check-run queries listed above.
- Independent A3/security review: NOT RUN / NOT VERIFIED.
- Recovery grant issuer / trusted time / audit sink: NOT IMPLEMENTED / NOT QUALIFIED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Search the current canonical MediaHub governance tree and repository records for accepted named operational appointments and the actual issuer/audit/time service evidence. If absent, record the precise owner-assignment decision required; only after accepted appointments and trust-service evidence exist, transplant the minimal Recovery Actor contract onto current Cloud Pool HEAD and add negative-first interface tests. No runtime implementation before that gate.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
