# Cloud Pool continuation checkpoint — 2026-11-17

**Checkpoint status:** PR #120 OPEN / DRAFT / UNMERGED; REVIEW REQUIRED  
**Contour:** A only  
**Default branch:** `Основной`  
**Immutable default base at pass start:** `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
**Working branch:** `docs/cloud-pool-reference-architecture-2026-11-17`  
**PR:** https://github.com/VlDMlNSh/developer-cloud-pool/pull/120

## Restore first

1. Read [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md), especially CURRENT AUTHORITATIVE SNAPSHOT.
2. Read [Cloud Development Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).
3. Read [ADR-0015](../decisions/2026-11-17-cloud-pool-architecture-consolidation-adr.md).
4. Re-read current default HEAD, open PRs, Issues, exact-head CI and ruleset. The working branch is not canonical until merged.
5. Do not enable dispatch, invoke Gemini, call providers, deploy hosts or touch secrets during documentation review.

## Changes recorded

- Added the canonical system-level reference architecture.
- Added ADR-0015 to explain the consolidation and rejected alternatives.
- Added dated architecture consolidation report.
- Replaced README with current verified disposition and safe task-control guidance.
- Refreshed Context Window metadata and added a current authoritative snapshot while preserving historical sections.

## Evidence at pass start

- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED; head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`.
- PR #116 exact-head checks: No-secret install/resource proof SUCCESS (run 44083961406); workflow syntax/security invariants SUCCESS (run 44083961455); Pool Contract Validation SUCCESS (run 44083961455).
- FCC loopback runtime lifecycle smoke: run 44076256742, head `596c03e19b4662f69a9b40791299f55afb9a928e`; this is earlier than current PR head and is not provider-route or Claude task qualification.
- Active ruleset ID 26550182: PR and thread resolution required; zero required approvals and no required status checks.
- Issue #118: persistent workspace blocked; no active authorized server #3, no Cloudflare Access/Tunnel and no backup/restore proof.
- A0/D1 evidence is isolated local proof, not hosted production qualification.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Validation status

- GitHub baseline and source documents: VERIFIED READ.
- Branch creation from exact default SHA: VERIFIED.
- File writes: GitHub returned commit SHAs; final read-back still required.
- Runtime tests: NOT RUN (documentation-only).
- Authored/updated docs local relative-link validation: 0 missing links across 9 files.
- Preserved historical Context Window body: 31 relative links target files absent from the current default-branch tree; recorded for separate provenance/link repair.
- PR #120 exact-head check-runs: 0; combined status contexts: 0; CI NOT VERIFIED / NOT RUN.
- Independent architecture/security review: NOT RUN.
- No agent dispatch, provider call, secret read, resource provisioning or deployment.

## Blockers

- Governance does not require any approving review or status check.
- No hosted transactional state authority is qualified.
- No durable fenced lease/recovery is qualified.
- No free provider route or real task execution is qualified.
- Jarvis Web is not deployed/authenticated.
- Persistent Engineering Workspace is blocked by Issue #118.

## Next step

Read back every changed file and verify blob/commit identities, PR #120 is open as Draft. Next repair or archive the 31 legacy Context Window links, obtain independent architecture/security review, and run available exact-head validation. Resolve conflicting legacy architecture wording before merge. Keep dispatch disabled.

Canonical architecture: [Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).


## Follow-up: normative documentation CI gate

- Added `scripts/validate-architecture-docs.mjs` to check repository-relative Markdown links in README, the canonical reference architecture, ADR-0015, the dated report and this checkpoint.
- Added `.github/workflows/architecture-documentation-validation.yml`, triggered by pull requests that modify those normative files. It uses read-only contents permission and a commit-pinned checkout action with credential persistence disabled.
- Historical Context Window snapshots are deliberately excluded from this validator; their legacy links remain historical records and are not silently rewritten.
- GitHub write commits: validator `447d58ec00d6858e09dee34bcf2dab25c1381a37`; workflow `cf8c72ca6e58bdef6af7d8a370525ace3b5d1c38`; Context Window update `eaffc96dd949850713b9cad1aaed88408690cb0f`.
- Exact-head CI on `9d0fb4cd6728a160c056aa63967568a38e2bb440` completed SUCCESS: Architecture Documentation Validation run `44086971389`; Pool Contract Validation run `44086971299`. No local execution of the validator is claimed in this connector-only pass. Documentation CI is not security qualification and does not qualify Contour A.


## /next checkpoint — chat architecture decisions reconciled into PR #120 — 2026-11-17

- Canonical candidate PR #120: branch `docs/cloud-pool-reference-architecture-2026-11-17`, head before this checkpoint `6379fb7f1201752d2406c89a081baa87823825c0`, OPEN/DRAFT/UNMERGED.
- Added normative Section 21 to Reference Architecture 1.0 to preserve the detailed chat-session Workspace, Jarvis three-plane, shared filesystem, VS Code Remote SSH, code-server/Open VSX, Cloudflare transport distinctions, single-writer fencing, backup/restore, first Claude/FCC/ECC profile, Gemini optionality and GitHub-only first-launch boundary.
- Refreshed Context Window and ADR with current PR #116 exact-head evidence and latest owner scope corrections.
- PR #116 latest head `6d4a4c518d44aa4a79d8396390623f424499011a`: runner proof run 44086419084 SUCCESS; workflow/security validation run 44086419002 SUCCESS; job 134049913469 all 14 steps SUCCESS. Mock only; no real Claude/provider task.
- Issue #117 CLOSED. Issue #118 remains BLOCKED. Issue #115 remains OPEN pending independent review/source provenance and real route scope as applicable.
- PR #113 is an older parallel docs candidate and remains OPEN/DRAFT; its content is not merged and is not assumed automatically included in PR #120.
- No secrets/provider calls/Gemini dispatch/host deployment/merge. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: read back all amended files, independently review PR #116 at exact head, validate PR #120 links/contracts and obtain architecture/security review. Keep dispatch disabled.


## /next checkpoint — FCC identity/fallback review — 2026-11-17

- PR #116 exact head `6d4a4c518d44aa4a79d8396390623f424499011a`; exact-head runner run 44086419084 SUCCESS (14/14 steps); workflow/security run 44086419002 SUCCESS; artifact 14329776221 available.
- Independent review comments 5938684495 (license provenance) and 5938737463 (FCC key cycling/model fallback) are COMMENT, not APPROVE.
- New normative requirement: one credential/account per FCC profile; disable `MODEL_FALLBACKS`, numbered-key selection, key cycling and provider/paid fallback; separate profile and quota ledger for each distinct account. No real account/quota proof yet.
- FCC pinned license AGPL-3.0-only; ECC MIT. Remote/network legal obligations require review before external deployment.
- Issue #115 remains OPEN. No secrets/provider calls/real Claude session/Gemini dispatch/production deployment. Contour A NOT ACCEPTED.
- PR #120 head at this checkpoint before these updates: `f016247a9886df904042000a26f17beabfbb8727`; OPEN/DRAFT/UNMERGED.
