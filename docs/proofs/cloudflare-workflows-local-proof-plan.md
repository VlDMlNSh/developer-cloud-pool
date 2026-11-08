# Cloudflare Workflows local proof plan

**Status:** PLANNED — no Workflow code, binding, deployment, or executor dispatch is included in this document.  
**Immutable base:** `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` (PR #25 head, Hono prototype).  
**Branch:** `proof/cloudflare-workflows-vitest-2026-11-08`  
**Scope:** isolated local-only compatibility proof; no production qualification.

## Reuse-first decision

Use Cloudflare's maintained examples rather than inventing the test harness:

- Workers SDK official Vitest examples: https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples
- Workflow example: https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples/workflows
- D1 example with migrations: https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples/d1
- Official Workflows starter: https://github.com/cloudflare/workflows-starter

Use `@cloudflare/vitest-plugin` (not the renamed legacy `@cloudflare/vitest-pool-workers`) and Vitest `^4.1.0`, following the current Cloudflare docs. Reuse the existing D1 ledger schema/adapter semantics from PR #51 only after reviewing its stacked dependency chain and exact-head status. Do not copy its implementation blindly.

## Constraints

- No deployment, Cloudflare account mutation, production D1 binding, secrets, OAuth credentials, model/provider calls, live executors, dispatch, or outbound network side effects.
- Use only Miniflare/local Workers runtime and synthetic D1 fixtures.
- Keep D1 as the authority for Task, Attempt, lease generation, reconciliation and audit. Workflows is orchestration only.
- A Workflow retry must never interpret lease expiry as proof that an executor stopped.
- No merge, no PR promotion and no Contour A acceptance from this proof alone.

## Required proof cases

1. **Workflow binding/runtime:** instantiate a local Workflow using the official Vitest plugin and a synthetic D1 binding.
2. **Persisted step/replay:** verify a completed step's result is reused during replay and step structure/names remain deterministic.
3. **Commit-then-timeout duplicate:** simulate a D1 side effect committing before a step reports failure; prove retry is deduplicated by an atomic D1 uniqueness/conditional-write contract, not by read-then-write.
4. **Attempt fencing:** reject a stale Attempt ID or lease generation; verify no outbox or executor side effect is created.
5. **Indeterminate state:** pending reconciliation remains pending; no automatic retry, takeover, terminalization or dispatch occurs.
6. **Duplicate Workflow creation/event:** prove duplicate triggers cannot create a second authorized execution.
7. **Negative boundary:** no test path can reach real provider, model, remote D1, deployment, or dispatch.

## Acceptance gate

- Lockfile committed; exact package versions recorded.
- `npm ci --ignore-scripts --no-audit --no-fund` succeeds.
- Worker static checks, existing Hono tests, and the new Vitest Worker-runtime suite pass on the exact branch HEAD.
- Tests include assertions on final D1 rows, event counts, reconciliation state, lease generation and `dispatch: false`.
- Exact-head GitHub Actions run is completed/success and source/test files are reread at the resulting SHA.
- Any missing run, skipped test, empty status response or unobserved side effect is **NOT VERIFIED**.
- A separate security/provenance review is still required before qualification.

## Current baseline findings

- PR #25 currently has only a Hono Worker + Static Assets in `wrangler.jsonc`; it has no Workflow or D1 binding and no Vitest setup.
- PR #25 exact head before this branch: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`; its two PR workflow runs were completed/success at that exact head. This does not validate new code added here.
- PR #51 is a draft stacked on PR #50; current exact-head CI query returned no runs/statuses. Its migration only materializes pending reconciliation and explicitly grants no retry authority.
- Therefore the proof starts as PLANNED and does not imply adoption of Workflows.

## Next implementation action

Inspect the current official SDK Workflow and D1 fixtures at immutable upstream commit SHAs, select the minimal compatible test configuration, then implement only the isolated local proof. Do not use mutable `main` references as evidence in the final acceptance record; record the exact upstream commit SHAs used.
