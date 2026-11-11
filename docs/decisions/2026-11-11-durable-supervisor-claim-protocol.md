# Durable single-use Supervisor claim protocol — decision record

- Date: 2026-11-11
- Status: DECISION / TARGET DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED
- Related blocker: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- Related authorization work: [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)
- Related local D1 proofs: [PR #39](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39), [PR #54](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54)
- Separate projection recovery design: [PR #60](https://github.com/VlDMlNSh/developer-cloud-pool/pull/60)
- Immutable source refs inspected: default Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; default Worker workflow blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; default Supervisor script blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`; PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`; PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.

## 1. Decision summary

Do not treat GitHub Issue labels plus workflow concurrency/read-back as a durable single-use claim primitive.

Preferred target for a future implementation: a dedicated, authenticated claim service backed by a transactional conditional-write store. The existing isolated Cloudflare D1 proof is the best currently demonstrated technical candidate because it uses a conditional `ready → consumed` update and creates claim/outbox rows in the same database transaction. This is a target architecture only; it is not approval to provision, deploy, or grant credentials to a hosted service.

No production backend is selected or qualified today. Keep both dispatch gates fail-closed until the hosted backend, issuer authentication, least-privilege access, concurrency/failure tests, recovery, governance and independent review are all accepted.

## 2. Current GitHub Issue-label design — rejected as the authoritative lock

The default Supervisor at the inspected immutable source refs:
- has workflow-level concurrency group `developer-cloud-pool-supervisor` with `queue: max`;
- has `issues: write` and `actions: write` permissions at workflow level;
- changes `pool:ready` to `pool:claimed` with an Issue PATCH;
- dispatches Worker after the label mutation;
- on dispatch exceptions may restore `pool:ready`;
- stale-claim recovery can return a claim to `pool:ready` based on issue age and a bounded recent-run search.

Workflow concurrency serializes runs in that group, but does not serialize other workflows, human/API actors, or other automation. Issue label PATCH is read/replace, not compare-and-swap. A successful read-back proves observed state at that instant, not exclusive ownership of a claim generation. A timeout after GitHub accepts a dispatch can be ambiguous; returning the task to ready can produce duplicate execution. A bounded recent-runs search cannot prove that no matching execution exists.

PR #37 removes direct Actions dispatch from the Supervisor and uses a reusable Worker boundary; it adds protected-ref and dual-gate checks and denies automatic requeue after ambiguous claim outcomes. However, it still claims by Issue label PATCH followed by read-back, so it reduces privilege and ambiguity but does not establish a durable atomic single-winner claim. PR #37 remains OPEN/DRAFT/UNMERGED. Its current head is `1be8672c1be1a720b6c813dcafff5c020b6456ae`; exact-head static boundary CI run `42484039940` succeeded. Formal review history contains prior CHANGES_REQUESTED entries by `maxkorolskiy88-ship-it` against earlier revisions; no current approval of the latest head was observed. Treat review status as NOT APPROVED.

## 3. Candidate comparison

| Candidate | Atomicity / concurrency | Authority and operational cost | Decision |
|---|---|---|---|
| A. Serialized Supervisor + Issue labels | Workflow concurrency helps only among runs in one group. PATCH/read-back is not CAS; no guaranteed one-winner against all actors. | Uses existing GITHUB_TOKEN but requires broad Issues write. Recovery and ambiguous dispatch remain hard to fence. | REJECT as authoritative claim lock. Retain labels only as a human-visible projection. |
| B. Dedicated state repository + immutable Git refs | Create-ref can provide a unique-name conflict response (201/409) as a reservation candidate; this must be tested for the exact API/token/backend semantics. | Requires Contents: write on a repository, which is broad repository-content authority rather than per-task/per-ref authority. Ref deletion/recreation and actor compromise must be controlled. | NOT SELECTED. Revisit only if narrowly scoped credentials and immutable ref lifecycle can be demonstrated without granting broad Supervisor write. |
| C. Dedicated claim service + transactional conditional-write store (D1 is current prototype) | Conditional UPDATE with a unique immutable claim key and transaction-backed trigger can produce one winner and atomic outbox. PR #39 tests 12 concurrent attempts; PR #54 tests 50 distinct approvals attached to one logical task/one outbox in local Workers/D1 runtime. | Requires a separately authenticated service boundary, per-consumer capability, trusted time, scoped database binding/credential, free-tier entitlement and isolation evidence. D1 SQL does not authenticate callers. | PREFERRED TARGET, NOT SELECTED AS A HOSTED SERVICE and NOT QUALIFIED. Local proof is not remote service evidence. |

## 4. Existing local proof evidence and limitations

### PR #39 — per-approval atomic claim/outbox
- Head: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- Adapter blob: `96ee60a06e7d37b51b999829fa223eba7488d9e4`.
- Test blob: `eb02a8edd0a748fb2c645457bded3be61dd87d60`.
- Migration blob: `44b8f7e0658296d287269770c5e91b1c3e25973c`.
- Exact proof run `42329993548`, job `128274072508`: SUCCESS; Workers-runtime D1 tests passed.
- Local test uses 12 concurrent attempts and expects exactly one `CLAIMED_ONCE`, 11 idempotent observations, one claim and one outbox. All results retain `dispatch:false`.

### PR #54 — logical task identity and 50-way contention
- Head: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Adapter blob: `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- Test blob: `5bcd6e42acc8ac7ee4f2cfec31e32a5e2d3b5499`.
- Exact proof run `42537241204`, job `128904147572`: SUCCESS; Workers-runtime D1 tests passed.
- Test seeds 50 distinct approvals and concurrently calls `claimLogicalTask`; expects one canonical task key, one task-level outbox, 50 attached approvals and all `dispatch:false`.

These are local Miniflare/workerd proofs using synthetic D1 fixtures and caller-supplied deterministic timestamps. They do not establish hosted Cloudflare D1 availability, production transaction/isolation semantics, account ownership, free-tier limits, credential custody, remote failure recovery, or authenticated issuer provenance. PR #39/#54 are stacked Draft PRs, not merged or deployed.

## 5. Required security and correctness contract for the target

1. **Separate authority:** a dedicated claim-service composition root verifies an issuer-signed or otherwise cryptographically authenticated capability. A caller-provided actor ID is audit metadata, not authentication.
2. **Exact scope:** bind repository numeric ID, issue/task identity, immutable target SHA, profile, canonical task-envelope digest, claim ID, operation, issuer, subject, audience, not-before, expiry, nonce and policy version.
3. **One-use atomic consume:** one conditional state transition consumes the approval and creates exactly one immutable claim and outbox event in the same transaction. Enforce uniqueness at the database layer.
4. **No blind retry:** ambiguous database or dispatch outcomes become `indeterminate` / reconciliation-required. Never return to ready based solely on timeout or absence from a bounded run listing.
5. **Fencing:** lease acquisition increments a monotonic generation. Renew/finalize/reclaim require exact owner + generation + expiry and immutable envelope digest. Stale workers cannot mutate newer generations.
6. **Outbox semantics:** delivery is at-least-once with deterministic idempotency identity and read/reconcile-before-retry. Do not claim exactly-once external side effects.
7. **Recovery separation:** projection Recovery Actor can only terminalize the projection outbox under its separate audience and one-use grant. It cannot requeue or dispatch tasks. It is not the task Supervisor, Worker, Jarvis, or ASTRA A0.
8. **Trusted time:** production issuer/revocation time must be independently qualified; test `now` injection is not a production clock.
9. **Least privilege:** Supervisor receives no D1 admin/API token or broad Contents: write. The claim service exposes a narrow authenticated operation; storage credentials remain server-side and are not passed to Worker or browser.
10. **Governance and audit:** append-only provenance records issuer/subject generation, envelope digest, claim/generation, decision, reason, trusted timestamp, workflow/run/job IDs and artifact digests. Require an independent security approval on the exact final head.

## 6. Mature components and reuse

- Reuse Cloudflare Workers + D1 + the official Workers Vitest integration already used in the local proof; do not build a custom database engine.
- Reuse the existing claim/outbox, immutable attempt, lease-generation and projection-outbox adapters as experimental reference implementations only. Do not copy them into production until schema and authority contracts are accepted.
- Reuse GitHub Issues for human intake/status projection, not as the authoritative lock.
- Reuse the separately proposed Security Issuer Authority contract as an authority prerequisite, but do not treat its draft as a deployed issuer.
- Do not introduce Durable Objects or Workflows merely for fashion: add them only if a demonstrated coordination/retry requirement cannot be met by the selected transactional design and the free-tier/authority evidence supports them.

## 7. Promotion gates — all mandatory

- [ ] Verify current free-tier D1 entitlement, quotas, retention, isolation and account ownership without reading secrets.
- [ ] Select and document the actual hosted service/account and deployment provenance.
- [ ] Implement a separate issuer-verified claim API; demonstrate revocation, nonce replay rejection, trusted time and exact resource binding.
- [ ] Run real hosted contention tests with 50+ independent requests and verify one winner, one claim and one outbox.
- [ ] Fault-inject lost responses before/after commit, service restart, worker loss, stale lease and stale finalizer.
- [ ] Prove no duplicate task execution on ambiguous GitHub dispatch; preserve indeterminate state until authoritative reconciliation.
- [ ] Verify all capability boundaries and secret isolation; no token in browser/Worker/artifacts.
- [ ] Reconcile PR stack bases and exact-head CI.
- [ ] Verify active Ruleset and required independent approvals.
- [ ] Obtain independent security review on the exact final source SHA.

Until all boxes are evidenced, status remains NOT QUALIFIED and dispatch remains disabled.

## 8. Disposition

- Issue-label lock: REJECTED as the sole atomic claim mechanism.
- Dedicated Git ref lock: NOT SELECTED; overbroad write authority and lifecycle proof unresolved.
- Transactional claim service backed by conditional-write storage: preferred target; D1 local proof is encouraging but not a hosted qualification.
- No runtime, schema, permissions, secrets, workflows, dispatch or deployment changed in this decision pass.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
