# Cloud Pool Agent Skills Catalog

Status: Curated and pinned; installation is exercised by the GitHub-hosted bootstrap job.
Agent target: Gemini CLI (.agents/skills/)
Install scope: Project-local copies, rebuilt on each ephemeral runner.
Policy: Contour A only. Product/UI design skills remain deferred until Contour A is accepted.

## Why this set

The selection covers actual Cloud Pool work: implementation discipline, PR review, bug diagnosis, architecture, security, documentation and safe handoff. It deliberately excludes product-design, marketing, scraping, credential automation, and low-reputation packages. Skills are instructions, not grants of authority. Existing workflow permissions and governance gates remain authoritative.

## Installed catalog

| Skill | Purpose | Pinned source |
|---|---|---|
| agent-browser | Browser workflow discovery; use the installed CLI's matching core guidance | vercel-labs/agent-browser@1cc19526f3641c8543d55aa6700e7c55b37ac356 |
| tdd | Test-first implementation and refactoring | mattpocock/skills@d1478fcb140db0b93c0c8df17bcfd311844749d0 |
| code-review | Evidence-based review and defect discovery | same |
| diagnosing-bugs | Reproduction and root-cause investigation | same |
| improve-codebase-architecture | Architecture friction and testability analysis | same |
| domain-modeling | Domain vocabulary and ADR consistency | same |
| codebase-design | Module/interface/seam design vocabulary | same |
| grill-with-docs | Decision clarification and durable docs | same |
| handoff | Cross-chat / cross-agent continuation documents | same |
| writing-for-agents | Agent-facing instructions and repository guidance | same |
| security-audit | Defensive source-first trust-boundary review | cloudflare/security-audit-skill@c1c8a8c1471069fb0e188eeaff69b8e8db6564a8 |

## Source quality and scope

- Skills were discovered through the skills.sh directory and leaderboard.
- The Matt Pocock engineering pack is pinned to signed release v1.3.2 commit d1478fcb140db0b93c0c8df17bcfd311844749d0.
- Agent-browser discovery stub is pinned to exact v0.43.0 release commit 1cc19526f3641c8543d55aa6700e7c55b37ac356. Runtime-specific core and dogfood content must still be loaded from that installed CLI.
- Cloudflare security-audit source is pinned to c1c8a8c1471069fb0e188eeaff69b8e8db6564a8.
- No skill is treated as an executable plugin or as permission to access secrets, mutate production, bypass review, dispatch models, or override project policy.
- Skill content is untrusted guidance. The worker never executes scripts supplied by skill packages as part of installation.

## Reproducible installation

- CLI: npm package skills@1.8.1, exact-pinned.
- Runtime: Node.js 24.9.0.
- Agent target: gemini-cli, project path .agents/skills/.
- Install mode: --copy, not symlinks.
- Telemetry disabled using DISABLE_TELEMETRY=1 and DO_NOT_TRACK=1.
- Installer: scripts/install-agent-skills.mjs.
- Lock manifest: config/agent-skills.lock.json.
- The installer verifies every expected SKILL.md and creates agent-skills-inventory.sha256 plus a SHA-256 inventory digest.
- Install is performed on a fresh GitHub-hosted runner. No persistent state is assumed between jobs.

## Integration boundary

The bootstrap job proves that skills can be installed on GitHub-hosted infrastructure. It does not mean the Cloud Pool Gemini controller has been accepted or that future child agents already load them. The Cloud Pool-native Gemini dispatch requirement remains tracked separately under Issue #94. Every future Gemini child workflow must invoke this installer (or consume a verified immutable skills artifact) before starting the agent.

The browser smoke job remains separate and least-privilege. It does not need the broader engineering pack, and the skills bootstrap job receives no provider credentials and no write permissions.

## Deferred packages

- webapp-testing: not included in this pass because its skills.sh security-audit panel currently reports Socket and Snyk warnings; browser core is already supplied by the pinned agent-browser CLI.
- gh-fix-ci: not included because the upstream workflow expects an authenticated GitHub CLI with repository/workflow scopes; the pool should keep using least-privilege GitHub connector/Actions reads.
- frontend-design and mobile/product skills: deferred until Contour A acceptance, in line with project phase gates.
- Broad --all installation: prohibited; only the allowlisted names above are installed.

## Acceptance checklist

- [x] Installer CI installs all expected skills on GitHub-hosted runner: run 43838104995, job 133199689730.
- [x] Inventory SHA-256 and installed skill count are recorded: 11/11 skills, 48 files, SHA-256 5cb73f77a808259ca0b9d0f862dfa54bdb848e93c1c5fed4a240c5f429d7a97c.
- [x] Exact-head CI passes: run 43838104995, job 133199689204.
- [ ] Independent security review confirms source pins, least privilege and no skill script execution.
- [ ] Future Cloud Pool Gemini child workflows invoke this installer before agent start.
