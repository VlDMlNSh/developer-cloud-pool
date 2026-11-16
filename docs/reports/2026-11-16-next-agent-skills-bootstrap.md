# /next report — Cloud Pool curated agent skills bootstrap

**Date:** 2026-11-16  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Base SHA:** `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`  
**PR:** #106 (OPEN / DRAFT; not merged)  
**Feature branch:** `feat/agent-browser-ephemeral-worker-2026-11-16`

## Scope

Curate and pin the engineering skills needed by Cloud Pool workers, add a reproducible Gemini CLI installer, and validate installation on GitHub-hosted infrastructure without physical/self-hosted devices or provider credentials.

## Curated skill set

11 skills are pinned to immutable upstream commit SHAs:

- Vercel agent-browser discovery stub (CLI-specific core/dogfood instructions remain loaded from agent-browser 0.43.0 at runtime).
- Matt Pocock engineering pack: tdd, code-review, diagnosing-bugs, improve-codebase-architecture, domain-modeling, codebase-design, grill-with-docs, handoff, writing-for-agents.
- Cloudflare security-audit.

Sources and install references are in `config/agent-skills.lock.json`. CLI is exact-pinned to `skills@1.8.1`; Node.js 24.9.0; target Gemini CLI; project-local copy mode into `.agents/skills/`. Telemetry disabled. Broad `--all` installs are prohibited.

## Changes

- `config/agent-skills.lock.json`: pinned allowlist, source refs, purposes and install policy.
- `scripts/install-agent-skills.mjs`: installs pinned packages, verifies all 11 SKILL.md files and hashes the inventory.
- `docs/architecture/AGENT-SKILLS-CLOUD-POOL.md`: catalog, source quality, install and governance model.
- `.github/workflows/pool-worker.yml`: new owner-approved `agent-skills-bootstrap` profile and least-privilege GitHub-hosted job; no provider credentials, no write permission, no execution of installed skill scripts.
- `.github/ISSUE_TEMPLATE/pool-task.yml`: task intake option.
- `scripts/validate-pool-contract.mjs`: profile, source pin, count, permissions, telemetry and reconciliation assertions.
- `.github/workflows/pool-contract-validation.yml`: separate hosted-runner install validation job.

## Verification

- Pool Contract Validation run `43837927634` is pending at exact head `b6adae6cc8a9650749e301c1dd7306c766b0b420`; jobs include real skill install validation and static contract validation. Final conclusion must be recorded after completion.
- Earlier run `43837909224` was cancelled by superseding commit; not counted as validation.
- Browser smoke runtime remains NOT RUN.
- Skill installation into a persistent Cloud Pool environment is not claimed: workers are ephemeral. The installer is ready to run in each future Gemini child job.
- Cloud Pool-native Gemini controller remains a separate open requirement (Issue #94); this PR does not implement or enable Gemini dispatch.
- Independent PR review: pending. PR #106 remains OPEN/DRAFT, no merge.

## Security and scope decisions

- Skill contents are untrusted instructions; installation does not execute scripts from skill packages.
- No secrets, model/provider credentials, user cookies, or authenticated browser profiles are passed to the skill bootstrap job.
- Existing dispatch gate remains fail-closed.
- `webapp-testing` was not selected because the skills.sh audit panel reports Socket/Snyk warnings; agent-browser is already included.
- `gh-fix-ci` was not selected because upstream guidance expects an authenticated GitHub CLI with repo/workflow scopes.
- Product/mobile/frontend design skills are deferred until Contour A acceptance.

## Next

1. Confirm exact-head CI including actual skill installation.
2. Inspect generated skill inventory and digest.
3. Obtain independent security review.
4. Integrate this installer into the Cloud Pool-native Gemini child executor when Issue #94 is implemented; do not enable dispatch before governance gates.
5. Continue Cloud Pool durable lease and admission work. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
