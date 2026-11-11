# GITHUB CONTEXT WINDOW — CANONICAL DRAFT (NOT YET ADOPTED)

> **Status: DRAFT / NOT CANONICAL / NOT ON DEFAULT BRANCH.** This proposal is a compact candidate for a future PR against `Основной`. It does not replace either existing Context Window, does not change repository state authority, and does not authorize dispatch, deployment, merge, or Contour B. Detailed proof records linked below remain on the unmerged documentation branch `docs/cross-chat-continuation-2026-11-06`.

Last reconciled: 2026-11-11.
Repository: https://github.com/VlDMlNSh/developer-cloud-pool
Default branch: `Основной`.
Observed default HEAD at drafting: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
Documentation/evidence branch: `docs/cross-chat-continuation-2026-11-06`.
Continuation Context Window blob at drafting: `f2874c921a99eb44040f15abb8d85115fbbf6771`.

## 1. Priority and acceptance boundary

Contour A — Cloud Development Pool — must be deployed, operationally verified, independently qualified and accepted before any Contour B / MediaHub product development. Use GitHub-hosted infrastructure and free routes only; no paid fallback. The pool must be operable without local machines or user-owned devices.

Contour A is accepted only after evidence proves:
- a real remote web interface accessible from phone and desktop;
- authenticated, least-privilege control plane and fail-closed dispatch;
- actual executor availability and successful bounded execution;
- safe model routing with account identity, quota isolation and no silent paid fallback;
- secret isolation and auditable provenance;
- durable state, claims, leases, retry/recovery and side-effect reconciliation;
- security/governance gates and independent operational acceptance.

A green fixture CI run, local runtime proof, prototype UI or unmerged PR is not acceptance evidence.

## 2. Current state

**Overall: BLOCKED / NOT ACCEPTED.** Web console deployment and authentication are NOT VERIFIED. Hosted state backend is NOT SELECTED / NOT QUALIFIED. Production executor integration and model routing are NOT VERIFIED. Dispatch must remain disabled. Contour B remains DEFERRED.

The current web prototype (PR #25) is fail-closed: health endpoint reports service health only; protected API reads return 503 until authentication is qualified; mutations are rejected; dispatch disabled. Dashboard is static/demo-only. It is not deployed and does not provide persistent live state.

Local D1/Cloudflare Workflow tests establish only local Workers-runtime behavior. They do not establish Cloudflare account entitlement, hosted D1/Workflow or Durable Objects qualification, production recovery, or an accepted state authority. The connected account inventory previously showed zero D1 databases, Worker scripts and Durable Objects namespaces; subscription entitlement query returned 403, so Free/Paid plan is NOT VERIFIED.

## 3. Active proof stacks (all OPEN / DRAFT / UNMERGED at last read)

### Web console / local Workflow stack
- [PR #25 — Hono web prototype](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25), head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`, base default `Основной`.
- [PR #52 — local D1 attempt ledger + Workflow compatibility](https://github.com/VlDMlNSh/developer-cloud-pool/pull/52), head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`, stacked on PR #25.
- Exact-head CI: PR #25 runs `42228269689` and `42228269676` SUCCESS; PR #52 run `42507524428` SUCCESS.
- Limits: demo UI only; auth/deployment absent; local Miniflare/Workers proofs only; no hosted state backend qualification.

### Immutable attempt / reconciliation proof stack
- [PR #51 — durable indeterminate reconciliation queue](https://github.com/VlDMlNSh/developer-cloud-pool/pull/51), head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- [PR #56 — deny expired attempt lease takeover](https://github.com/VlDMlNSh/developer-cloud-pool/pull/56), head `0769b6b5d5eda9c7821804b93db21ded6e0985ef`, stacked on PR #51.
- Exact-head CI: PR #51 run `42536377720` SUCCESS; PR #56 run `42825872826` SUCCESS.
- Limits: durable queue is intake only; no trusted resolver, production Supervisor/Worker integration, hosted contention qualification or effect reconciliation.

### GitHub Actions evidence proof
- [PR #57 — read-only run-attempt evidence verifier](https://github.com/VlDMlNSh/developer-cloud-pool/pull/57), head `2c263e8a9915f0bc8e0698cde816e87cb2376538`.
- Exact-head CI: `42838193405` and `42838193384` SUCCESS.
- Limits: read-only proof; no live API qualification, resolver capability, production integration or retry authority.

All listed CI evidence qualifies only the stated exact SHA and proof/test scope. Recheck refs and CI before merge, deployment or dispatch.

## 4. Authority, state and security

- Immutable Task / Attempt / Lease and reconciliation contracts exist as proposals/proofs; no production state backend has been selected or qualified.
- GitHub Issue labels are not compare-and-swap. Git refs remain deferred pending a separate Contents:write, retention, delete/recreate and recovery threat model.
- D1 remains a hosted qualification candidate, not a selected backend. Durable Objects SQLite is a prototype candidate only; account plan/eligibility and hosted resource state are NOT VERIFIED.
- Trusted reconciliation requires authenticated native executor identity, fixed-origin read-only evidence, trusted clock, single-use resolver capability, side-effect reconciliation and atomic terminal transition + append-only receipt/outbox. No retry is authorized by lease expiry or absence from a list query.
- Do not read or reveal secrets. Do not mix credentials, account identities, quotas or permissions. Registration alone does not prove a credential works.
- Gemini may run only through the approved `.github/workflows/gemini-batch-dispatch-controller.yml` after every contract and governance gate passes. If not, status is NOT RUN with the exact blocker. No controller bypass.
- No paid fallback. Do not run local Claude Code except on the explicitly approved third server after host/capability/allowlist verification. Do not use server 3 for Gemini.

## 5. Repository governance

Active ruleset [26550182 — Основной — verified](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182):
- PR required; deletion and non-fast-forward prohibited; review-thread resolution required.
- Required approving reviews = 0; CODEOWNERS review disabled; last-push approval disabled; no required status-check rule appears in the ruleset.
- Thus PR-only protection is VERIFIED, but independent approval and required CI enforcement are NOT CONFIGURED by this ruleset.
- Do not merge based on green CI alone. Resolve governance and independent review requirements before acceptance.

## 6. Current blockers

1. Authentication/session implementation and qualification for the web console.
2. Actual deployment and mobile/desktop reachability.
3. Selection and hosted qualification of a free durable State Authority.
4. Production Supervisor→Worker identity/attempt integration.
5. Trusted executor-run evidence provenance and resolver authority.
6. Side-effect reconciliation, atomic terminal receipt/outbox and recovery tests.
7. Provider/account-isolated routing, quota accounting and free-only enforcement.
8. Executor availability and real bounded execution evidence.
9. Effective branch governance and independent security/operational acceptance.

## 7. Evidence archive (unmerged documentation branch)

These records are intentionally branch-qualified because they are not present on default branch:
- [Backend State Authority decision study](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/decisions/2026-11-11-backend-state-authority-decision-study.md)
- [PR #25/#52/#51/#56 lineage audit](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-pr52-pr51-pr56-lineage-audit.md)
- [Five-commit default delta](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-pr52-five-commit-default-delta.md)
- [PR #25 parent readiness](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-parent-readiness-review.md)
- [Governance and Context Window ownership audit](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-repository-governance-context-ownership-audit.md)
- [Context Window ancestry and consolidation plan](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-context-window-ancestry-and-consolidation-plan.md)
- [Relative-link portability audit](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-context-window-relative-link-portability-audit.md)

## 8. Next step

Before creating a default-based branch, verify this draft against the current Cloud Pool contracts and source files, refresh default HEAD, re-read all active PR heads/CI, and confirm no important accepted decision is omitted. Then create a dedicated branch from that immutable default SHA containing only the curated Context Window and a dated reconciliation report. Preserve the continuation branch as an evidence archive. No merge, deployment or dispatch is authorized by this draft.

## 9. Cross-project navigation
- MediaHub bootstrap: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CONTEXT-BOOTSTRAP-INSTRUCTION.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
- MediaHub continuation checkpoint: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/mediahub-next-continuation-checkpoint-2026-10-12-current.md
- MediaHub master roadmap: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/MEDIAHUB-MASTER-DEVELOPMENT-ROADMAP-1.0.md
