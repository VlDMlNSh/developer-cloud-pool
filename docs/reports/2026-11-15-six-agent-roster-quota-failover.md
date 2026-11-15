# Six-agent roster and compliant quota failover — 2026-11-15

## Decision
Use six logical roles rather than deploying 24 credential slots as separate agents. A role is a responsibility; credential slots are separately qualified routes and are never conflated with workers.

## Roster
1. Task planner — decomposes the immutable target and allocates independent work.
2. Primary engineer — owns the main bounded implementation slice.
3. Parallel engineer — owns a disjoint implementation/research slice.
4. Architecture researcher — read-only component/interface research unless explicitly assigned otherwise.
5. Test verifier — independently tests the implementation and contracts.
6. Security/provenance auditor — exclusive review role, not co-located with implementation.

ChatGPT retains integration, evidence reconciliation and acceptance recommendation. Each /next evaluates the roles, but dispatches only when useful, independent tasks exist; it must not manufacture no-op or duplicate tasks.

## Quota and failover decision
Do not rotate API keys to evade provider rate or usage limits. When quota exhaustion applies to a shared provider/account quota domain, cool down the whole domain and wait for its authoritative reset. When the domain is unknown, treat same-provider slots as shared and fail closed. Fail over only to a different provider or independently evidenced quota domain that has a currently free-eligible allowlisted model, accepted unexpired route qualification, credential availability, permitted data policy and remaining quota.

- 401/403: authentication/authorization failure; no key rotation.
- 402: billing block; paid fallback prohibited.
- 429: cooldown only for the scope supported by provider evidence; unknown scope/reset means reconciliation and fail closed.
- No paid fallback under any circumstance.

## Implementation and evidence
- PR #89: https://github.com/VlDMlNSh/developer-cloud-pool/pull/89
- Branch: `feat/six-agent-roster-policy-2026-11-15`
- Base SHA: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`
- Head SHA: `a51b47c8d2168df30033559424d06a906cb551b8`
- Policy blob: `d6d087d3f0351e263e3c05d00589a58f93d66818`
- Test blob: `74924d21631b3baa474b312de82f143f69c682b2`
- Workflow blob: `27c57b86ecd1c9fc1aad7bd10bbdc4a75539dd3e`
- Exact-head Actions run #43715132359: SUCCESS; job #132814903034 completed YAML parsing and pool security-contract validation. https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43715132359
- PR #89 remains OPEN / DRAFT / UNMERGED; no independent review claimed.
- PR #29 quota ledger remains OPEN / DRAFT / UNMERGED at head `e4c8d642bbc054e7c52b391356965b492dad32b4`, with stale base `64d2636d4500127e635c214ccfb722c6b3fcda80`; ledger integration is pending review and rebase.

## Safety boundary
No secrets were read or copied. No provider API calls, worker dispatch, live agent deployment or Gemini controller changes occurred. The roster is a policy contract, not a claim that six live agents are running.

## Status and next step
Roster/failover policy: IMPLEMENTED IN PR / EXACT-HEAD CI VERIFIED. Runtime router and provider qualification: NOT IMPLEMENTED / NOT QUALIFIED. Contour A: BLOCKED / NOT ACCEPTED. Next: reconcile PR #29 quota ledger against current default branch, reuse rather than duplicate compatible state-machine logic, and implement a fail-closed adapter/router vertical slice with quota-domain tests.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
