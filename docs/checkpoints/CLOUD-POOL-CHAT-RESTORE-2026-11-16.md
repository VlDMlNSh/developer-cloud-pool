# Cloud Development Pool — chat restore and operational handoff

**Updated:** 2026-11-16  
**Purpose:** Restore the Cloud Pool engineering context in a new ChatGPT conversation without relying on prior chat history.  
**Primary scope:** Contour A only. MediaHub OS / Contour B product work remains deferred.

## 1. Canonical repositories and working state

- Cloud Pool repository: https://github.com/VlDMlNSh/developer-cloud-pool
- MediaHub OS repository (separate project): https://github.com/VlDMlNSh/mediahub-os
- Current working PR: [PR #106](https://github.com/VlDMlNSh/developer-cloud-pool/pull/106)
- Working branch: `feat/agent-browser-ephemeral-worker-2026-11-16`
- Latest branch tip when this handoff was written: `8ed8b6c05f24bdfd4c106b02714c458aa7a961b9` (re-read PR metadata before relying on this SHA).
- PR #106 base branch: `Основной`, observed base SHA `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`.
- PR #106 remains OPEN / DRAFT / NOT MERGED. No formal review has been claimed.
- All recent browser/skills implementation and evidence updates are on the feature branch. They are not yet on the default branch.

## 2. What is actually verified

### Ephemeral agent-browser public Web smoke

Exact tested implementation SHA: `90b88dd94d595dda65365a09396693804671cab3`.

Exact-head GitHub Actions run:
- [Pool Contract Validation run 43841574699](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43841574699) — COMPLETED / SUCCESS.
- Contract/security job: `133211349732` — SUCCESS.
- Browser smoke job: `133211350185` — SUCCESS.
- Skills install/content job: `133211350252` — SUCCESS.

Browser job performed:
1. Installed exact `agent-browser@0.43.0` on GitHub-hosted `ubuntu-24.04`.
2. Installed Chromium using the CLI installer.
3. Loaded `core` and `dogfood` CLI-owned skill instructions.
4. Opened fixed public URL `https://example.com`.
5. Verified page title `Example Domain`.
6. Captured a screenshot.
7. Closed the browser session.

Browser job used `permissions: {}`, no checkout, no repository secrets, no provider credentials, no cookies, no authenticated profile and a fresh temporary HOME. Runner/browser state is destroyed after the job.

**Claim boundary:** VERIFIED only for one ephemeral, unauthenticated public-Web smoke job. This does NOT prove a persistent browser server, interactive remote browser, authenticated website sessions, saved cookies, arbitrary-site navigation, browser-task dispatch through the Pool queue, or production browser worker qualification.

### Curated agent skills

11 allowlisted skills are installed and content-validated in the ephemeral CI bootstrap:
- agent-browser discovery stub (runtime core/dogfood are loaded from the pinned CLI)
- tdd
- code-review
- diagnosing-bugs
- improve-codebase-architecture
- domain-modeling
- codebase-design
- grill-with-docs
- handoff
- writing-for-agents
- security-audit

Skills CLI is pinned to `skills@1.8.1`; Node.js to `24.9.0`; target is Gemini CLI; installation is project-local. CI checks the expected count, frontmatter name, non-empty description, non-trivial body and SHA-256 inventory. Skill-provided scripts are not executed.

**Claim boundary:** 11/11 installed and content-validated. Behavioral execution of all skills by Gemini has NOT RUN because the Cloud Pool-native Gemini controller is missing. Installation in ephemeral CI does not imply persistent installation in a long-lived agent environment.

## 3. Important files in PR #106

- `config/agent-skills.lock.json` — immutable skill source pins and allowlist.
- `scripts/install-agent-skills.mjs` — reproducible installer and inventory hashing.
- `scripts/validate-pool-contract.mjs` — contract/security checks, including browser smoke workflow assertions.
- `.github/workflows/pool-contract-validation.yml` — skill installation/content checks and public Web browser smoke job.
- `.github/workflows/pool-worker.yml` — browser and skill bootstrap worker profiles; still subject to the Pool dispatch and lifecycle gates.
- `.github/ISSUE_TEMPLATE/pool-task.yml` — task intake.
- `docs/architecture/AGENT-SKILLS-CLOUD-POOL.md` — skill catalog and governance.
- `docs/architecture/AGENT-BROWSER-CLOUD-POOL-INTEGRATION.md` — browser architecture and verified smoke evidence.

## 4. Gemini three-agent dispatch — current blocker

The requested three supplementary Gemini agents are attempted as an explicit requirement on every `/next`, but must only run through the Cloud Pool-native controller.

- Parent implementation issue: [#94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94).
- Dedicated exact owner-only control issue: [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96).
- `.github/workflows/gemini-batch-dispatch-controller.yml` was checked on default branch `Основной` and returned 404 / NOT FOUND.
- Therefore Gemini wave status: NOT RUN / BLOCKED. No controller run ID, child run/job IDs or child artifact digests exist.
- Do not substitute MediaHub OS Issue #301/controller. It is a separate repository and control plane.
- Do not read secret values, enable dispatch, call providers, rotate keys to bypass quotas, or use paid fallback.
- Dispatch must remain fail-closed until the exact owner-only admission, durable idempotency/admission, immutable target SHA, least-privilege child isolation, reconciliation, adversarial tests, exact-head CI and governance gates pass.

## 5. Owner's acceptance policy

The owner explicitly deferred independent external review and acceptance until the Cloud Pool is running and can perform its own independent checks.

This defers independent review/acceptance only. It does NOT waive internal CI, deterministic tests, security/governance gates, least privilege, provenance, fail-closed behavior or required exact-head evidence.

Contour A is BLOCKED / NOT ACCEPTED. Contour B / MediaHub OS product development is DEFERRED.

## 6. Infrastructure availability

Last checked during the 2026-11-16 pass:
- SentinelX: zero online hosts. Voktors-Mini enrolled but offline; mh-dev-01 and mh-dev-02 disabled.
- Desktop Commander: all three registered devices offline.
- Consequently no persistent self-hosted browser host is currently available. The verified browser compute is GitHub-hosted and ephemeral.

## 7. Issues and next engineering priorities

1. [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94): implement Cloud Pool-native Gemini dispatch and reconciliation.
2. [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96): exact owner-only `/next` admission contract.
3. [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38): durable single-use Supervisor task claims / lease guarantees.
4. [Issue #5](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5): agent-browser ephemeral worker integration. Public smoke is now proven; durable queue/lease/heartbeat/recovery integration, task URL policy, provenance, bounded artifacts and independent qualification remain outstanding.
5. [Issue #22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22): secure remote web console; preserve Contour A priority and do not jump to mobile/product work.

Suggested next bounded pass: inspect existing PRs and current default-branch state for durable claims and controller prerequisites; avoid duplicate controller implementations. Continue implementing Cloud Pool-native exact owner admission/controller and durable state, with dispatch disabled until all gates pass.

## 8. New-chat recovery procedure

At the beginning of a new chat:
1. Read this handoff file from the current PR branch.
2. Re-read the live PR #106 metadata, branch HEAD, default branch HEAD, Issues #94/#96/#38/#5/#22, open PRs and exact-head CI. This handoff contains observed state, not a substitute for live GitHub checks.
3. Re-read the current Context Window and continuation checkpoint.
4. Check whether the native controller now exists on the default branch; never infer it from this feature branch or from MediaHub OS.
5. On every `/next`, attempt the three-agent Gemini wave through the Cloud Pool-native controller only. If the controller/gates are absent, state NOT RUN / BLOCKED with the precise reason, and continue ChatGPT's primary engineering pass.
6. Do one bounded, verifiable engineering pass; update dated report, Context Window, checkpoint and this handoff when material state changes.
7. Read back changed files and verify blob/commit SHAs and exact-head CI.
8. Never claim PLANNED/DISPATCHED as SUCCEEDED/VERIFIED/ACCEPTED.

## 9. Key continuity links

- [PR #106](https://github.com/VlDMlNSh/developer-cloud-pool/pull/106)
- [Context Window](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/agent-browser-ephemeral-worker-2026-11-16/docs/context/GITHUB-CONTEXT-WINDOW.md)
- [Continuation checkpoint](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/agent-browser-ephemeral-worker-2026-11-16/docs/checkpoints/CLOUD-POOL-CONTINUATION-CHECKPOINT-2026-11-11.md)
- [Browser integration decision and evidence](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/agent-browser-ephemeral-worker-2026-11-16/docs/architecture/AGENT-BROWSER-CLOUD-POOL-INTEGRATION.md)
- [Latest browser/skills validation report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/agent-browser-ephemeral-worker-2026-11-16/docs/reports/2026-11-16-next-agent-browser-and-skills-validation.md)
- [Canonical MediaHub OS map — separate project](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
