# Cloud Pool architecture consolidation — 2026-11-17

**Status:** PR #120 OPEN / DRAFT / UNMERGED; REVIEW REQUIRED  
**Contour:** A only  
**Immutable base:** `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
**Working branch:** `docs/cloud-pool-reference-architecture-2026-11-17`  
**PR:** https://github.com/VlDMlNSh/developer-cloud-pool/pull/120

## Scope

Consolidate prior independent architecture reviews into one normative system-level reference architecture, record the architectural decisions, and refresh the repository's source-of-truth navigation. No runtime code, workflow, secret, repository variable, dispatch gate, provider route, host, or infrastructure resource was changed.

## Repository facts revalidated

- Default branch: `Основной`.
- Default HEAD at start: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Active ruleset: ID `26550182`, applies to `refs/heads/Основной`; PR required, review-thread resolution required, required approving review count is 0, and no required status-check contexts are configured.
- Open PR #116: Claude Code + ECC + FCC hosted-runner qualification; draft and unmerged. Its latest observed head is `367c583a508061cebe41bb8d33e98c24a0dd8ba6`; exact-head Pool Contract Validation run `44083961455` succeeded. PR description records earlier exact-head FCC loopback runtime lifecycle run `44076256742` at `596c03e19b4662f69a9b40791299f55afb9a928e`, but this is not the latest PR head and does not prove provider routing or Claude task execution.
- Issue #118 states no active/authorized server #3, no Cloudflare zone/tunnel, Access not enabled, and no persistence/backup/restore evidence. Workspace deployment is blocked.
- Default README still describes an earlier stage and needs alignment with current PR evidence; Context Window last-refresh field was 2026-11-08 and is stale.
- Local A0/D1 proofs and route evidence contracts remain isolated proof/target design, not hosted production qualification.
- Dispatch remains fail-closed; this documentation pass did not invoke Gemini, a worker, provider calls or resource probes.

## Changes in this pass

1. Added `docs/architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md` as the normative target architecture.
2. Added `docs/decisions/2026-11-17-cloud-pool-architecture-consolidation-adr.md`.
3. Added this dated report.
4. Updated README architecture navigation and current status to distinguish design, proof, hosted runtime, and acceptance.
5. Refreshed Context Window with current observed baseline, PR/issue/governance state, canonical architecture link, and explicit not-verified limitations.

## Architectural decisions consolidated

- Jarvis is the single user-facing console, not an authority.
- Control plane and ephemeral execution plane are separate trust domains.
- Persistent Engineering Workspace is separate from GitHub-hosted workers.
- One transactional authority owns mutable admission/lease/outbox/quota state; D1 is a preferred candidate, not a production selection.
- GitHub Issues/labels and Actions concurrency are not authoritative locks.
- Atomic admission, durable fenced leases, outbox/inbox, idempotency and ambiguity reconciliation are mandatory.
- Route identity includes provider, model, issuer, account, quota domain, credential handle, capability and qualification revision.
- Gemini uses only the approved controller.
- Worker jobs receive no provider credentials by default.
- Mature upstream components are integrated behind narrow adapters; no proprietary IDE/agent runtime is to be built without a documented gap.
- Contour A acceptance requires authenticated Jarvis, real end-to-end task execution, a qualified free route, persistence/recovery, secret isolation, independent review and published evidence.

## Validation

- Source baseline, branch, PR #116, Issue #118, active ruleset and exact-head check-run metadata were read from GitHub.
- No local checkout or executable test environment was available in this connector pass; Markdown link validation, contract tests and full CI remain NOT RUN until the PR head is available to GitHub Actions.
- No code or workflow behavior was changed.
- No Gemini controller dispatch was attempted. Agent dispatch status: NOT RUN (documentation-only pass; no need to invoke model agents).

## Blockers

1. Default ruleset has zero required approving reviews and no required status checks; governance strengthening requires owner-approved change.
2. D1 production service/identity/free-tier/backup-restore qualification is incomplete.
3. Durable fenced Supervisor lease is not qualified.
4. Jarvis Web is not deployed/authenticated.
5. No qualified free provider route or real agent task execution is demonstrated.
6. Persistent Workspace is blocked by Issue #118.
7. Independent Contour A acceptance has not occurred.

## Next step

PR #120 is open as Draft. Next, repair or formally archive the 31 legacy Context Window links, obtain independent architecture/security review, and run any available exact-head documentation/contract validation before merge. Keep dispatch disabled. Keep dispatch disabled and Contour B deferred.

Canonical map: [Cloud Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).  
Canonical context: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md).


## Follow-up: normative documentation CI gate

- Added `scripts/validate-architecture-docs.mjs` to check repository-relative Markdown links in README, the canonical reference architecture, ADR-0015, the dated report and this checkpoint.
- Added `.github/workflows/architecture-documentation-validation.yml`, triggered by pull requests that modify those normative files. It uses read-only contents permission and a commit-pinned checkout action with credential persistence disabled.
- Historical Context Window snapshots are deliberately excluded from this validator; their legacy links remain historical records and are not silently rewritten.
- GitHub write commits: validator `447d58ec00d6858e09dee34bcf2dab25c1381a37`; workflow `cf8c72ca6e58bdef6af7d8a370525ace3b5d1c38`; Context Window update `eaffc96dd949850713b9cad1aaed88408690cb0f`.
- Exact-head Actions result is pending re-read. No local execution of the validator is claimed in this connector-only pass. Documentation CI is not security qualification and does not qualify Contour A.
