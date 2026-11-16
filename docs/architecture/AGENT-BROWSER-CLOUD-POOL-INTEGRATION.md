# Agent-browser in the Cloud Pool — ephemeral GitHub-hosted worker

**Date:** 2026-11-16  
**Status:** IMPLEMENTATION PROPOSAL / NOT DEPLOYED  
**Base SHA:** `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`

## Decision

Run Vercel Labs `agent-browser` and Chrome for Testing directly on GitHub-hosted `ubuntu-24.04` runners. No physical device, SentinelX host, self-hosted runner, or paid browser provider is required for this mode.

The browser worker is a bounded, ephemeral GitHub Actions job. It is not a persistent browser server and does not expose a dashboard or interactive remote desktop.

## Runtime and skills

- CLI package pinned to `agent-browser@0.43.0`.
- Node.js pinned to `24.9.0`.
- Chromium/Chrome for Testing installed by `agent-browser install --with-deps`.
- Core instructions loaded at runtime using `agent-browser skills get core`.
- Optional exploratory QA instructions loaded using `agent-browser skills get dogfood`.
- `agent-browser skills list` is captured so the installed release's available skills are auditable.
- The Skills CLI discovery stub is not required for this shell-only worker. If a future AI harness is added, install the official stub using the documented Skills CLI command and continue loading version-matched instructions from the pinned CLI.

Official references:
- https://github.com/vercel-labs/agent-browser
- https://agent-browser.dev/installation
- https://skills.sh/vercel-labs/agent-browser

## Worker profile contract

The new allowlisted profile is `agent-browser-headless`. It is deliberately limited to a harmless smoke test against the hard-coded public page `https://example.com`:
1. Validate the owner-approved task issue, exact target SHA and profile name.
2. Start a fresh GitHub-hosted runner with no GitHub token permissions and no provider secrets.
3. Install the pinned CLI and browser.
4. Load the CLI's core and dogfood skill instructions.
5. Open the fixed public smoke page, verify its title, capture and hash a screenshot.
6. Close the browser session and report the run ID and result from a separate issue-write job.

The browser job does not check out or execute task-repository code, does not accept arbitrary URLs or shell commands, and does not receive cookies or credentials. Its only network navigation target is fixed in the workflow.

## Session model and limits

- A browser session remains available across sequential CLI commands during the worker job.
- The browser process and GitHub-hosted VM are destroyed when the job finishes.
- The job has a bounded timeout and consumes the repository's GitHub Actions minutes/concurrency.
- This avoids the need for a physical device or continuously running host, but does not create unlimited compute or permanent sessions.
- Persistent interactive sessions, a public dashboard, session handoff between jobs, and durable browser state are out of scope for this profile.

## Governance

- Dispatch remains behind the existing supervisor's owner-approved task issue and `POOL_DISPATCH_ENABLED` gate.
- The profile is added to the worker allowlist and issue intake; it is not activated by merely opening this PR.
- Browser runtime has `permissions: {}`; only the separate report job can write issue status.
- No provider credentials, GitHub write token, user cookies, or authenticated account state enter the browser job.
- No arbitrary URL, user-supplied script, upload, or download operation is permitted.
- Exact package and action versions are pinned; smoke evidence is hashed.
- Do not use concurrent job capacity as a claim of unlimited parallel browser sessions.

## Acceptance

- [ ] PR exact-head workflow syntax and pool security contract validation pass.
- [ ] An owner-approved task is dispatched only after default-branch governance and dispatch gate are verified.
- [ ] Browser worker runs on GitHub-hosted infrastructure without physical/self-hosted nodes.
- [ ] CLI and Chrome install, core/dogfood skill loading, public-page smoke, screenshot hashing and cleanup succeed.
- [ ] Job permissions prove the browser job has no token scopes and no secrets.
- [ ] Independent review verifies isolation, profile validation and result reporting.
- [ ] Persistent/interactive remote session requirements are evaluated separately and are not represented as delivered by this ephemeral worker.

**Current state:** workflow and contract changes proposed in PR; no dispatch or browser installation has been executed. Runtime success remains NOT VERIFIED.
