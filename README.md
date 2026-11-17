# Developer Cloud Pool

A governed, cloud-first engineering platform with a single Jarvis experience, isolated execution adapters, explicit authority boundaries, and a separately qualified persistent workspace.

## Canonical architecture

**System-level source of truth:** [Cloud Development Pool Reference Architecture 1.0](docs/architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).

Supporting normative contracts:
- [20-runner architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md) — logical profiles and resource qualification; 20 is a planning ceiling, not guaranteed capacity.
- [Jarvis hybrid platform architecture](docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md).
- [Supervisor and recovery](docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md).
- [Qualified route evidence and atomic A0/D1 admission](docs/contracts/QUALIFIED-ROUTE-EVIDENCE-AND-ATOMIC-A0-D1-ADMISSION.md).
- [D1 atomic admission implementation plan](docs/design/D1-ATOMIC-ADMISSION-MINIMAL-MIGRATION-PLAN.md).
- [Durable Supervisor claim protocol](docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md).
- [Architecture consolidation ADR](docs/decisions/2026-11-17-cloud-pool-architecture-consolidation-adr.md).
- [GitHub Context Window](docs/context/GITHUB-CONTEXT-WINDOW.md).

## Current verified disposition — 2026-11-17

- Repository default branch: `Основной`; observed HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Contour A: **NOT ACCEPTED**. Contour B remains DEFERRED.
- 20-slot GitHub-hosted execution architecture: DESIGN; not a running 20-worker pool.
- Supervisor/Worker: implementation scaffold and isolated proofs; hosted durable lease and end-to-end execution are not qualified.
- Atomic A0/D1: isolated local proof exists; hosted transactional authority, trusted issuer qualification and production admission are not qualified.
- Gemini: dispatch only through the approved controller; dispatch gates remain fail-closed. This documentation change did not dispatch agents or call providers.
- Claude Code + ECC + FCC PR #116: OPEN / DRAFT / UNMERGED. Latest observed head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`; two exact-head checks succeeded (install/resource proof and workflow/security contract). Earlier FCC loopback lifecycle smoke is evidence for that earlier head only. No provider route or Claude task execution qualification is implied.
- Jarvis Web: not deployed as an authenticated live control plane.
- Persistent Engineering Workspace: BLOCKED by Issue #118; no active authorized host, qualified Access ingress, or backup/restore evidence.
- Active default-branch ruleset ID `26550182`: PR required and review-thread resolution required, but required approving review count is zero and no required status-check contexts are configured. This is not sufficient independent governance for production acceptance.
- No paid hosting/provider fallback is permitted. GitHub-hosted runners are ephemeral and are not persistent web hosts or durable storage.

## Cloud Pool task control

Do not enable dispatch by setting `POOL_DISPATCH_ENABLED=true` merely because the repository has a task issue or `pool:ready` label. Issue labels and Actions concurrency are not authoritative locks. Dispatch remains disabled until the governance, admission, route, durable lease, worker, and security gates in the canonical architecture are satisfied and independently reviewed.

The task issue template is an intake mechanism only. A valid task must bind an exact immutable target SHA and be admitted through the approved authority. Never place shell commands, credentials, or provider secrets in issue bodies.

## Execution and workspace are different

- **Execution workers:** short-lived GitHub-hosted jobs, one bounded task per isolated runner, no provider secrets by default.
- **Engineering Workspace:** separate persistent host/service for browser IDE, terminal, Git worktrees and durable files. It requires independent owner authorization, zero-trust access, storage, backup/restore, isolation and free-tier qualification.

## Security baseline

- Worker profiles are allowlisted; issue text cannot choose arbitrary shell commands or workflow names.
- Default worker permissions are read-only and no provider keys are injected.
- Gemini dispatch is exclusively through the approved repository controller.
- Provider account, issuer, credential handle and quota domain remain independently identified.
- Secrets never appear in logs, artifacts, Git, issue text or evidence.
- Untrusted public PR code must not run on persistent local machines.
- Pin GitHub Actions and external tools to immutable versions/commits and verify provenance.
- A passing smoke test or CI check is not security qualification.

## Evidence and history

- [Architecture consolidation report — 2026-11-17](docs/reports/2026-11-17-cloud-pool-architecture-consolidation.md)
- [Claude Code + ECC + FCC PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Engineering Workspace qualification Issue #118](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118)
- [Pool Supervisor workflow](.github/workflows/pool-supervisor.yml)
- [Pool Worker workflow](.github/workflows/pool-worker.yml)

**Status vocabulary:** PLANNED, IMPLEMENTED, NOT RUN, NOT VERIFIED, VERIFIED, QUALIFIED, ACCEPTED, BLOCKED. Never promote a component's status without exact, independently inspectable evidence.
