# PR #60 issuer and trusted-time governance gate

- Date: 2026-11-11
- Status: BLOCKED / DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED
- Immutable target: PR #60 `234fb2ee40265e26fac00c69ac1b6192766602cb`
- Default branch observed: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- Scope: verify whether the proposed projection Recovery Actor has an implementable issuer, trusted-time, revocation and audit authority source.
- Non-goals: code changes, migrations, secret/variable inspection, key provisioning, dispatch, provider/model calls, deployment, merge, or live GitHub projection writes.

## 1. Fresh GitHub state

| Item | Observed state |
|---|---|
| PR #54 | OPEN / DRAFT / UNMERGED; HEAD `15a09c910f52553c59796260131a6b5a4a39c15f`; exact-head run `43010770730` SUCCESS |
| PR #58 | OPEN / DRAFT / UNMERGED; HEAD `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; exact-head run `42979949181` SUCCESS on its old base |
| PR #59 | OPEN / DRAFT / UNMERGED; HEAD `22200226da4f1af30645cf441a639db6893e9310`; exact-head run `42981807825` SUCCESS on its old stack |
| PR #60 | OPEN / DRAFT / UNMERGED; HEAD `234fb2ee40265e26fac00c69ac1b6192766602cb`; no exact-head workflow run, therefore NOT VERIFIED |
| Issue #38 | OPEN |
| Default branch | `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7` |
| Active ruleset collection | Ruleset `26550182`, `Основной — verified`, enforcement active; detailed rules not re-read in this pass |

PR #58/#59/#60 returned no formal review submissions or inline review threads. PR #54 returned a COMMENTED review. A successful workflow run is not a security qualification or acceptance.

## 2. Contract inspection

PR #60 changes only:
- `docs/contracts/PROJECTION-RECOVERY-GRANT-ISSUER-AND-TRUSTED-TIME-CONTRACT.md` (blob `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`)
- `docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md` (blob `59a4be21516da0e005114acfe015aee7787524dc`)

The contract correctly requires a separately governed Security Issuer Authority, exact audience/subject/operation/resource binding, key lifecycle, revocation freshness, trusted time, one-use nonce consumption and an atomic outbox terminal transition. It explicitly does not select or evidence a deployed issuer, key custody service, revocation source, production clock, or audit sink.

The contract's preferred database-time approach remains conditional on proving the pinned D1 runtime and hosted D1 semantics. The local adapter's caller-supplied `now` is a deterministic test seam, not production trusted time. The existing task Resolver grant is not interchangeable with a projection recovery grant.

## 3. Reuse-first assessment

No new dependency or infrastructure is justified by the evidence in this pass:
- Keep the existing D1 + Workers Vitest proof for local conditional state transitions; D1 does not authenticate the caller.
- Durable Objects and Cloudflare Workflows are documented as candidates only. Neither supplies the missing issuer identity, grant scope, revocation, trusted-time or GitHub side-effect idempotency guarantees by itself.
- Do not introduce a token library, policy engine, queue, KMS/HSM, database, or audit service until the issuer owner and trust model are selected and the free-tier/cost/isolation constraints are verified.
- Do not widen task Resolver permissions or use GitHub Actions workflow identity as an implicit issuer.

## 4. Blocking findings

1. **Issuer ownership unresolved:** no accepted service/principal is named as the authoritative issuer for `projection-outbox-recovery`.
2. **Credential lifecycle unresolved:** no qualified key custody, rotation, revocation, compromise response or policy-epoch source is evidenced.
3. **Trusted time unresolved:** neither D1 transaction time nor a trusted host clock is qualified for the lease-expiry and grant-validity boundary.
4. **Audit boundary unresolved:** no durable audit sink/operator and retention authority is selected.
5. **Hosted backend unresolved:** local D1 tests do not qualify hosted D1 behavior, concurrency, transaction semantics or service isolation.
6. **PR #60 has no exact-head CI or formal review:** its design remains NOT VERIFIED.

## 5. Decision

Do not implement a verifier, mint fake grants, accept caller-supplied actor/time/claims, or add a production Recovery Actor. Keep recovery NOT IMPLEMENTED / NOT QUALIFIED and all dispatch/projection side-effect paths fail-closed. PR #58 and #59 remain blocked by the previously documented POST-authority and integration gaps.

No code, schema, workflow, permissions, secrets, deployment, merge, provider/model call, dispatch, or live projection write was performed.

## 6. Next bounded step

Resolve the governance prerequisite by identifying an owner-approved issuer authority and its operational principal, then prove its revocation and audit interfaces and select a qualified trusted-time source. Only after those sources are evidenced should a narrow verifier composition prototype and adversarial one-use/concurrency tests be implemented. If no qualifying authority exists, preserve the fail-closed design and record the explicit non-selection.

- Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
