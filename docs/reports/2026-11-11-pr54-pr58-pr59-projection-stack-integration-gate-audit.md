# PR #54 → #58 → #59 Projection Stack Integration Gate Audit — 2026-11-11

## Scope and immutable refs

Read-only compatibility and authority audit. No code, workflow, permission, secret, branch, dispatch, deployment, merge, or live GitHub issue-projection changes in this pass.

| PR | Head | Base | Exact-head CI |
|---|---|---|---|
| #54 | `15a09c910f52553c59796260131a6b5a4a39c15f` | `b9067dc7d06245893cd4e208f6215438efe5ca64` | run `43010770730` SUCCESS; 40/40 tests |
| #58 | `6f7953e4abec3cc564984ee3635cdb7717ae5d5e` | `ec3f3266ca28c4fb5633a9475cc6f396a4677974` | run `42979949181` SUCCESS on its old base |
| #59 | `22200226da4f1af30645cf441a639db6893e9310` | `6f7953e4abec3cc564984ee3635cdb7717ae5d5e` | run `42981807825` SUCCESS on old stack |
| #60 | `234fb2ee40265e26fac00c69ac1b6192766602cb` | `864213e2ff5b4fa956ba405dea8137a44d812f49` | no exact-head run returned: NOT VERIFIED |

All four PRs are OPEN / DRAFT / UNMERGED. #58 and #59 are a stacked chain. #60 is a design branch based on the default branch and is not an implementation dependency proven in CI.

GitHub compare `ec3f3266ca28c4fb5633a9475cc6f396a4677974...15a09c910f52553c59796260131a6b5a4a39c15f` returned `ahead`, 3 commits ahead, 0 behind. Thus PR #58's old base is an ancestor of the corrected PR #54 head. This is a linear ancestry update, not evidence of integrated compatibility. PR #58/#59 exact-head CI must be rerun after a controlled base update.

## Findings and integration gates

### G58-01 — managed-label deletion is prefix-wide

PR #58 `projection-reconciler.mjs` computes all current labels beginning `pool:` as managed and removes every one not in the envelope's desired set. This can delete labels not owned by this reconciler. It violates least-authority label ownership and the previously documented lifecycle ownership uncertainty.

**Gate:** replace prefix-wide deletion with an exact, approved allowlist of labels owned by this projection component. Preserve every unknown `pool:*` label. Add tests with an unowned `pool:custom` label.

### G58-02 — terminal lifecycle vocabulary is not aligned with the current Supervisor

PR #58 accepts `pool:probe-complete`, `pool:needs-review`, `pool:completed`, and `pool:failed`, and allows 1–3 terminal labels. The inspected default Supervisor source currently creates/uses `pool:ready`, `pool:claimed`, `pool:probe-complete`, `pool:needs-review`, and `pool:invalid`; `pool:completed` and `pool:failed` were not evidenced as canonical. The current architecture distinguishes a narrow DSH probe from general task/Contour A acceptance.

**Gate:** resolve lifecycle ownership and exact-one terminal state in an accepted contract before hardcoding a label set. A successful DSH probe must not imply general task completion or Contour A acceptance.

### G58-03 — caller boolean is still POST authority

The reconciler accepts `{ allowPost: true }` from its caller. The function itself does not verify a D1 lease, one-use capability, trusted issuer, or consumed generation. A caller can repeat a call with `allowPost: true` after an ambiguous/delayed-visibility result. The local fake tests show that a single invocation does not blindly repost, but do not prove cross-invocation single-use authority.

**Gate:** the actual side-effecting POST must require a verifier-backed, one-use authorization tied to the exact outbox event, repository/issue, target SHA, payload digest, lease generation, attempt, and expiry. Consume/persist the authorization under an atomic condition. A boolean must never confer authority.

### G59-01 — durable retry budget is not connected to POST authorization

PR #59 adds a D1 retry budget (maximum five attempts), retry-after times, dead-letter terminal state, append-only event evidence and generation-fenced delivery leases. This is useful local state-machine work. However, PR #58 does not consume a verified D1 lease/capability; its `allowPost` boolean remains independent. Therefore the five-attempt budget does not govern actual external GitHub POSTs.

PR #59's migration 0007 recreates the status-event trigger with `COALESCE(NEW.lease_owner, OLD.lease_owner)`, which preserves actor attribution when the update clears the lease owner. It is compatible with the PR #54 attribution correction in intent. This does not authenticate the actor; it is still audit attribution only.

**Gate:** integrate a single authorization path from a fresh D1 lease to exactly one side-effecting POST per lease generation, with persisted consumed/ambiguous outcome and rejection of stale, expired, mismatched, or reused grants.

### G60-01 — recovery capability remains proposed, not implemented

PR #60's contract correctly separates Delivery Worker from Projection Recovery Actor and limits recovery to dead-lettering an expired, exhausted delivery lease. It explicitly rejects caller-supplied actor strings as authentication and proposes exact repository/outbox/attempt/generation/operation scope, expiry, nonce, issuer and audience. But the contract is PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED; no trusted issuer, production clock, revocation source, or hosted D1 authorization path is evidenced.

**Gate:** retain this as the design constraint. Do not grant a recovery actor authority until issuer identity, credential lifecycle, trusted time, revocation freshness, nonce consumption, and least-privilege storage access are implemented and independently tested.

## Reuse-first review

No new generic queue, retry engine, event framework, or HTTP client is justified. Retain the existing Cloudflare D1 + Workers Vitest local proof. The GitHub REST/Octokit reuse assessment remains relevant for a future narrowly scoped sender, but Octokit retry/throttling does not provide semantic idempotency, D1 lease authority, or exactly-once external writes.

## Review and governance state

- PR #54 inline actor-attribution thread resolved; exact-head CI passed 40/40.
- PR #58 and #59 have no formal reviews or inline threads returned in this check; their old exact-head CI is not transferable to an updated stack.
- PR #60 has no exact-head CI and no formal/inline review evidence returned.
- Issue #38 remains OPEN; hosted authenticated transactional claim service is a target design only, NOT SELECTED / NOT QUALIFIED.
- Dispatch remains FAIL-CLOSED. No secrets read, no permission changes, no dispatch, no deployment, no merge, no live GitHub projection writes.

## Decision

**Do not merge or promote PR #58/#59/#60.** PR #54's actor-attribution fix is verified locally, but the projection sender still lacks a lease-bound single-use POST grant, the lifecycle label contract is unresolved, and recovery authority is only proposed. The PR #58 → #59 chain requires controlled base update and exact-head CI after the above code/contract gates are addressed.

## Next bounded action

Inspect the PR #58/59 test seams and implement a fake-only adversarial test proving that a D1 lease generation, not a caller boolean, gates exactly one POST across repeated invocations. If the current interface cannot accept a verifier-issued grant without introducing an unapproved issuer, publish the interface design and keep sender dispatch disabled. Resolve exact label ownership separately; do not silently adopt unaccepted labels.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
