# MediaHub Security Issuer Authority Reconciliation — 2026-11-11

## Scope and immutable evidence

Read-only reconciliation of MediaHub issuer governance PRs and Cloud Pool Recovery Actor dependency.

### MediaHub PR #599 — Wave 486 owner-directed governance target
- URL: https://github.com/VlDMlNSh/mediahub-os/pull/599
- Head SHA: `824bb2568b2ac8bb3dceb3608366668e99bab95e`
- Base SHA: `37254c9f4ff09c39943f6924534a63dd44b5a431`
- State: OPEN / DRAFT / UNMERGED; mergeable=true is not acceptance.
- Formal reviews: 0.
- Exact-head PR workflow runs returned empty.
- Decision blob: `13e6745463dbc05a7c188423bb45ffb2b210c789`.

Wave 486 records an owner-directed selection of WB-05 Option A: a dedicated Security Issuer Authority separate from Jarvis and ASTRA A0. It specifies service-principal lifecycle, per-consumer verification, independent trust-anchor custody, short-lived grants, revocation freshness, attenuating Jarvis→A0 delegation, durable acceptance evidence and independent A3 review. It explicitly does not claim that the issuer, identity registry, KMS/HSM, audit sink, endpoints or operational principals exist.

### MediaHub PR #600 — Wave 487 issuer/verifier normative candidate
- URL: https://github.com/VlDMlNSh/mediahub-os/pull/600
- Head SHA: `05a873e82760d63c8b26dc496b43d3309f4cfbf9`
- Base SHA: `824bb2568b2ac8bb3dceb3608366668e99bab95e` (stacked on PR #599).
- State: OPEN / DRAFT / UNMERGED; mergeable=true is not acceptance.
- Formal reviews: 0.
- Exact-head PR workflow runs returned empty.
- Current contract blob independently read from PR branch: `1200d343139c8e67a826902b3ade09d4987c537d` (26,868 bytes).

The current contract preserves the three-authority split:
1. Jarvis coordinates bounded mission requests; it does not mint A0 grants or own A0 lifecycle.
2. Dedicated Security Issuer Authority owns issuer identity, grant policy, principal admission and revocation governance.
3. ASTRA A0 independently verifies authority and owns its queue, claim, lease, retry, cancellation and recovery.
4. Each protected consumer independently verifies its own audience and protected effect.
5. MediaHub Product State Authority remains the sole canonical product-state mutation authority.

The contract adds authenticated original requester provenance, mission authorization, approval evidence where policy requires it, immutable task/correlation/request digest binding, durable receipts, R-06 audit, and acceptance fixtures AUTH-15…AUTH-21 / AUD-05. Its qualification section still requires independent A3 review, protocol/identity/trust-anchor/audit ADR, canonical strict schema and Draft 2020-12 validation, positive/negative/replay/concurrency/crash/expiry/revocation/fencing/audit-outage tests, per-consumer source proof, exact-head CI and reviewer independence evidence.

It remains explicitly DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED. No algorithm, token format, KMS/HSM vendor, identity source, database, queue, audit sink, endpoint, clock-skew policy or operational team is selected.

### Upstream runner manifest PR #603
- URL: https://github.com/VlDMlNSh/mediahub-os/pull/603
- Head SHA: `cb9f3a1f60ad3ceafb2f5b15b8ae4771c487cc5f`
- OPEN / DRAFT / UNMERGED.
- Manifest records account-specific concurrency, artifact retention and destination-level egress enforcement as NOT VERIFIED; A0 issuer, R-06, schema validation, independent review and controller admission remain open.
- This is another separate Issue #301 gate, not evidence of an operational issuer.

### Issue #301
- OPEN; last updated 2026-11-02T12:33:45Z.
- It continues to order A0 issuer/ingress/lease/cancel/recovery and R-06 authority gates first, then runner/workspace/network manifest, standards-compliant Draft 2020-12 validation, independent review, read-only worker hardening and only then controlled dispatch.
- It expressly says it is a tracker, not a grant of credentials, provider calls, dispatch, infrastructure change, merge or deployment authority.

## Cloud Pool cross-project implications

### PR #60 — Projection Recovery Actor
- Head `234fb2ee40265e26fac00c69ac1b6192766602cb`, OPEN/DRAFT/UNMERGED, formal reviews 0.
- The Recovery Actor contract is compatible with the MediaHub model only as a distinct narrowly scoped capability audience. It must not reuse Jarvis, ASTRA A0 Task Resolver, Supervisor, Worker or Product State Authority grants.
- The issuer target in PR #599 and contract candidate in PR #600 provide a governance direction, but do not yet provide an accepted issuer/verifier implementation, operational principal registry, signing trust anchor, revocation source, trusted clock, or durable audit sink.
- Therefore PR #60 remains DESIGN / NOT IMPLEMENTED / NOT QUALIFIED. Do not create a local substitute issuer or invent issuer identity/keys.

### PR #37 — Supervisor → Worker
- Head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, OPEN/DRAFT/UNMERGED.
- Exact-head static CI runs #42484039940 and #42484039932 are SUCCESS; no live reusable Worker execution proof.
- Formal CHANGES_REQUESTED reviews remain recorded against prior reviewed revisions; no approval of current head was observed.
- F2 finalizer task/claim/envelope fencing and F10 atomic terminal-state/audit-event coupling remain open. Issue #38 still rejects Issue-label PATCH + Actions concurrency as an atomic claim.

## Status and safety disposition

- Owner-directed issuer governance target selected: VERIFIED as a published decision.
- Normative issuer/verifier contract: read-back VERIFIED, but DRAFT / NOT ACCEPTED.
- Independent A3 review of exact PR #600 head: NOT RUN / NOT VERIFIED.
- Exact-head CI for PR #599/#600: NOT VERIFIED (workflow-run lookup returned empty).
- Protocol/identity/trust-anchor/audit ADR: NOT SELECTED.
- Canonical schema / Draft 2020-12 format assertion / negative fixtures: NOT RUN.
- Operational issuer, key custody/rotation, principal registry, revocation and trusted time: NOT VERIFIED.
- Hosted claim/recovery backend and production isolation: NOT VERIFIED.
- No secret reads, provider calls, Gemini/Claude dispatch, workflow dispatch, runtime changes, deployment, merge or production mutation were performed.
- Keep Cloud Pool dispatch fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Do not implement an issuer in Cloud Pool. The next valid step is a source-bound independent review of the exact Wave 487 contract head and Wave 486 parent decision, then a technology-neutral protocol/identity/trust-anchor/audit ADR only after independent findings are resolved. In parallel, keep PR #37 F2/F10 and Issue #38 on their separate durable task-claim track. Once issuer acceptance is evidenced, update the Recovery Actor grant contract to reference the exact issuer audience and trusted-time guarantees; do not conflate task and projection grants.

## References

- [MediaHub PR #599](https://github.com/VlDMlNSh/mediahub-os/pull/599)
- [MediaHub PR #600](https://github.com/VlDMlNSh/mediahub-os/pull/600)
- [MediaHub PR #603](https://github.com/VlDMlNSh/mediahub-os/pull/603)
- [Issue #301](https://github.com/VlDMlNSh/mediahub-os/issues/301)
- [Cloud Pool PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)
- [Cloud Pool PR #60](https://github.com/VlDMlNSh/developer-cloud-pool/pull/60)
- [Cloud Pool Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
