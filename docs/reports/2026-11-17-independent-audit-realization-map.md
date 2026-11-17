# Independent Audit Reconciliation — Cloud Pool Realization Map

**Date:** 2026-11-17  
**Status:** DOCUMENTATION PASS COMPLETE / REVIEW AND CI NOT VERIFIED  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Work branch:** `docs/cloud-pool-realization-map-2026-11-17`  
**Immutable parent:** PR #120 head `d717c999906341efbdcb65a25dfd73269220e691`

## Objective

Translate the supplied independent audit into an implementation-ready architecture map while preserving the existing Cloud Pool architecture and all security/governance invariants. Avoid another broad redesign.

## Reconciliation decisions

1. Retain the Control Plane / Execution Plane split, Jarvis as the single user-facing UI, GitHub Actions as ephemeral workers, Supervisor/Worker, atomic admission, immutable SHA, account-specific quota identity, fail-closed policy, evidence provenance and Gemini's approved-controller-only path.
2. Reduce implementation complexity: Planner, Policy, Admission, Registry, Quota, Scheduler, Supervisor, Outbox, Projection and Recovery are logical responsibilities. They do not each require a separate service or network hop. Separate only where authority, consistency, failure isolation or measured scale requires it.
3. Define exactly one canonical integration route from Jarvis through API, policy/admission, transactional state, scheduler/supervisor, approved dispatch, worker adapter and evidence back to Jarvis.
4. Keep Cloud Execution Pool and persistent Engineering Workspace as separate systems. GitHub-hosted runners are ephemeral; Workspace requires authorized host, identity-aware ingress, persistent storage, per-task isolation and restore evidence.
5. Keep one transactional authority for execution state. GitHub remains authoritative for code and reviewed documentation; Workspace storage owns durable working files; evidence is immutable/digest-bound. D1 remains preferred candidate, not production-selected; PostgreSQL is an alternative only by ADR.
6. Replace fixed agent slots with capability-based dynamic scheduling over individually qualified profiles. “20 slots” remains a planning ceiling, not guaranteed concurrency or machines.
7. Consolidate Jarvis into one responsive application with Chat, Agents, Tasks, Workspace, Models, Artifacts, Infrastructure and Security & Audit surfaces.
8. Adopt upstream Claude Code, Codex CLI, agent-browser, Playwright, LangGraph, Hono, code-server/Open VSX, D1/PostgreSQL and Git worktrees only through a license/provenance/security/free-tier/compatibility/exit decision record. No generic plugin framework or duplicate orchestration layer before a demonstrated need.
9. Promote runner egress limitations, PATH/executable trust and cryptographic installer provenance to explicit pre-production qualification blockers.

## GitHub evidence checked

- PR #120 OPEN/DRAFT, head `d717c999906341efbdcb65a25dfd73269220e691`, mergeable=true at read.
- PR #122 OPEN/DRAFT, head `4f5b2e9d5b7c434dcbd18d056fbaea6ee3f4b406`, mergeable=false at read; its base branch SHA was `435a1838f7e22f0f5ec08611bd24608066fd5d79`. It remains a separate dependent branch requiring reconciliation.
- PR #116 OPEN/DRAFT, head `6d4a4c518d44aa4a79d8396390623f424499011a`. Exact-head workflow runs `44086419084` and `44086419002` were COMPLETED/SUCCESS. The workflow evidence is bounded no-secret install, FCC loopback runtime and synthetic CLI bridge evidence; it is not a real Claude task or provider route.
- Issue #117 CLOSED (FCC loopback lifecycle); Issue #119 CLOSED (synthetic bridge); Issue #118 OPEN/BLOCKED (persistent Workspace).
- Ruleset #26550182 was last documented active with zero required approvals and no required checks; exact current ruleset read-back remains required before merge/dispatch.

## Changes published on branch

- Added `docs/architecture/CLOUD-POOL-UNIFIED-REALIZATION-MAP-2026-11-17.md`.
- Linked the map from Section 23 of `docs/architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md`.
- Linked the map from `README.md`.
- Prepended a current pass snapshot to `docs/context/GITHUB-CONTEXT-WINDOW.md`.

## Validation and limits

- GitHub writes returned commit/blob identities; read-back verification is pending in this report's initial state and must be performed before PR submission.
- No runtime source or workflow changed.
- Runtime tests NOT RUN; documentation validator NOT RUN locally.
- Exact-head CI NOT VERIFIED for the new branch.
- Independent review NOT RUN.
- No secrets read, no provider calls, no Gemini dispatch, no deployment, no merge.
- Contour A remains NOT ACCEPTED; Contour B remains DEFERRED.

## Next step

Read back all changed files and their blob SHAs, create a dependent Draft PR against PR #120's current branch, then obtain exact-head documentation CI and independent review. After architecture integration, prioritize an authenticated Jarvis read path instead of further architecture expansion.
