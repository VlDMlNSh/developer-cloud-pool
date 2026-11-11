# Default-branch Supervisor / Worker / Claim / Recovery source audit — 2026-11-11

## Scope and immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной` @ `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Read-only source audit. No code, workflow, permission, secret, variable, schema, runtime, dispatch, or deployment changes.
- Audited blobs:
  - `scripts/pool-supervisor.mjs`: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`
  - `.github/workflows/pool-supervisor.yml`: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`
  - `.github/workflows/pool-worker.yml`: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
  - `docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md`: `830a549809d10015d5662da562cff82710c3aa11`
  - `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md`: read at exact target SHA.

## Findings

### F1 — Issue label mutation is not an atomic claim

Supervisor reads an Issue and later replaces labels via PATCH from `pool:ready` to `pool:claimed`, then posts a comment and dispatches Worker. The API mutation is not compare-and-swap and has no immutable claim ID/generation. Workflow concurrency `developer-cloud-pool-supervisor` serializes only this workflow group; it does not fence humans, other workflows, API clients or a second control plane.

Severity: BLOCKER for single-winner / exactly-once claim acceptance.

### F2 — Ambiguous dispatch can requeue an already accepted task

If the Worker dispatch request throws, the Supervisor reloads the Issue and changes `pool:claimed` back to `pool:ready`. A transport timeout can occur after GitHub accepted the dispatch, so the caller cannot infer that no Worker was created. This can create duplicate execution. The durable-claim decision record already rejects this behavior and requires an `indeterminate` state plus authoritative reconciliation.

Severity: BLOCKER for duplicate-execution prevention.

### F3 — Stale-claim recovery relies on bounded absence

`recoverStaleClaims()` lists at most 100 recent Worker runs. If it finds no matching run and Issue age exceeds 15 minutes, it changes `pool:claimed` to `pool:ready`. Absence from a bounded listing is not proof that no run exists; issue `updated_at` is also a mutable projection timestamp, not a lease clock. No lease owner, expiry, fencing generation or authoritative run-to-claim relation exists.

Severity: BLOCKER for safe recovery/requeue.

### F4 — Worker validates projection state, not issuer authority

Worker checks open Issue, `pool:claimed`, a matching 40-hex Target SHA in the body and allowlisted profile. It does not verify an issuer-signed capability, issuer identity, audience, subject, nonce, one-use consumption, revocation, trusted time, task-envelope digest or claim generation. The label is therefore a state assertion, not cryptographic proof of permission.

Severity: BLOCKER for authorization boundary.

### F5 — Worker report can overwrite a newer task state

The report job fetches the Issue and then PATCHes the managed labels to a terminal state. It does not re-check that the task is still claimed by this exact run/generation, nor compare the current immutable envelope with the dispatched SHA/profile before replacing the labels. A stale Worker report can overwrite a later recovery or operator decision.

Severity: BLOCKER for stale-writer fencing and projection integrity.

### F6 — Supervisor has broad workflow-level write permissions

`.github/workflows/pool-supervisor.yml` declares workflow-level `issues: write` and `actions: write`. The script both mutates task Issues and dispatches Worker workflows. The current fail-closed variable prevents dispatch when not literal true, but it does not reduce the token's granted permission set. Split claim/reconciliation from dispatch authority and minimize each job's permissions before activation.

Severity: HIGH; least-privilege remediation required before any live dispatch.

### F7 — Current runtime is only a DSH smoke profile

Worker checks out the immutable target SHA and installs pinned `@deepseek-ai/dsh@0.2.1-rc.5`, then runs a headless `--dump-config` probe. It has no provider credentials and makes no model call. This is a package/configuration smoke test, not general-purpose agent execution or production pool qualification.

Severity: acceptance-scope limitation, not a defect in the intentionally narrow probe.

## Existing implementation and reusable components

- PR #37 proposes a narrower reusable Worker boundary and reduces Supervisor dispatch privilege, but remains OPEN/DRAFT/UNMERGED and does not turn Issue label PATCH into CAS.
- PR #39 and PR #54 contain local Workers/D1 conditional-claim and transactional outbox proofs; both remain OPEN/DRAFT/UNMERGED. Local Miniflare/workerd evidence is not hosted D1 qualification.
- The existing project decision selects a dedicated authenticated claim service backed by conditional-write storage as the preferred target; D1 is the current prototype candidate. Reuse existing D1 adapters, migrations, tests and Workers Vitest integration as experimental reference code. Do not create another queue engine or deploy D1 without account-specific free-tier, issuer, trusted-time, credential-custody and governance qualification.
- Repository searches did not identify a stronger drop-in component that resolves this project's specific issuer-bound, single-use claim + atomic outbox + fencing contract. Do not introduce Temporal/another orchestrator merely to replace a small claim primitive; it would not supply the missing project issuer authority or free-hosting evidence.

## Required remediation sequence

1. Keep `POOL_DISPATCH_ENABLED` false/unset and both dispatch paths disabled.
2. Treat Issue labels as a human-visible projection only, never authoritative claim ownership.
3. Add a dedicated claim API that verifies issuer authority and consumes a one-use grant atomically with claim + outbox creation.
4. Persist immutable claim ID, envelope digest, issuer/subject/audience, nonce, trusted timestamp, generation and outbox idempotency key.
5. Replace timeout-to-ready with `indeterminate`; only authoritative reconciliation may resolve it.
6. Require owner + monotonic generation + expiry for lease renew/finalize/reclaim; stale generations cannot mutate state.
7. Make Worker report conditional on exact run/claim/generation/envelope; reject stale finalizers.
8. Split job permissions: read-only validation/runtime; narrowly scoped claim-service credential only in the service; no broad Supervisor token in untrusted execution.
9. Qualify hosted D1 with 50+ independent HTTP requests, fault injection around commit/response loss, restart/worker loss and stale finalizer tests.
10. Obtain independent security review and exact-head CI on the final integrated source before any dispatch enablement.

## Live governance and acceptance boundary

- Active ruleset #26550182 targets `refs/heads/Основной`; PR required, deletion/non-fast-forward protections and review-thread resolution active, but required approving reviews = 0 and bypass actors = none.
- PR #63 and #64 remain OPEN/DRAFT/UNMERGED; documentation branch is not the default branch.
- PR-triggered workflow runs and combined status contexts for the current documentation HEAD were empty at this audit. Exact-head CI = NOT VERIFIED.
- Issue #38 remains OPEN. Issue #63 and Issue #1 remain OPEN.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1: NOT QUALIFIED / NOT PROVISIONED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

No secrets, key material or token values were accessed. No provider calls, dispatch, resource creation, billing, merge or deployment occurred.

## Next bounded step

Prepare a source-bound remediation contract and negative test matrix for F1–F6, mapped to the existing D1 claim/outbox proof and issuer boundary. Keep it documentation/test-design only until the independent issuer/trust/revocation/time/audit owners and hosted service authorization are evidenced. Do not change the default branch or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
