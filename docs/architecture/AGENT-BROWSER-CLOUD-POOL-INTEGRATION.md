# Agent Browser for Developer Cloud Pool

**Date:** 2026-11-16  
**Status:** ARCHITECTURE DECISION / NOT DEPLOYED  
**Target base:** `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`  
**Scope:** Contour A only. This document does not enable task dispatch, browser access to owner accounts, or a persistent browser service.

## Decision

Adopt **Vercel Labs `agent-browser`** as the preferred browser automation CLI for a future allowlisted Cloud Pool browser-worker profile. Keep the CLI/runtime separate from agent skills:

- Runtime: the native `agent-browser` CLI plus its managed Chromium installation.
- Agent instructions: the official `vercel-labs/agent-browser` skill installed through the Skills CLI. Do not copy a `SKILL.md` out of `node_modules`; the official skill is a discovery stub that directs the agent to load version-matched instructions from the installed CLI.
- Initial required skill: `agent-browser` (core workflow).
- Additional skill only when needed: `dogfood` for exploratory QA / bug hunts. `electron`, `slack`, `derive-client`, `vercel-sandbox`, `protected-vercel-deployments`, and `agentcore` are conditional and are not part of the baseline browser worker.

Official references:
- https://github.com/vercel-labs/agent-browser
- https://agent-browser.dev/installation
- https://skills.sh/vercel-labs/agent-browser

## Verified repository baseline

At target SHA above:
- `.github/workflows/pool-worker.yml` allows only `dsh-headless-probe`; there is no browser-worker profile.
- `pool-supervisor.yml` is a best-effort event-driven workflow, not a persistent daemon.
- `README.md` describes the worker as a DSH-only smoke profile and explicitly says general-purpose agent execution is not implemented.
- The 20-runner model is a concurrency ceiling of ephemeral GitHub-hosted jobs, not 20 persistent machines or a shared browser host.
- No `agent-browser` package, install manifest, browser skill directory, or browser runtime is present in the default-branch tree.

## Installation model

The vendor-documented installation sequence is:

```bash
npm install -g agent-browser
agent-browser install
```

For an agent harness, install the official skill from the vendor repository:

```bash
npx skills add vercel-labs/agent-browser
```

Before the first browser command, load the version-matched core workflow from the installed CLI:

```bash
agent-browser skills get core
```

For exploratory app QA, additionally load:

```bash
agent-browser skills get dogfood
```

The exact CLI version must be pinned and recorded when the browser-worker profile is implemented. The official skill should be installed at worker bootstrap (or in a controlled agent image) rather than manually copied into the repository. The CLI's own `skills list` is the authoritative list for the installed release; do not assume specialized skills exist in a different release.

## Two distinct operating modes

### A. Ephemeral browser worker — feasible on GitHub-hosted Actions

A future, separately approved worker profile can install the CLI and Chromium inside a fresh GitHub-hosted runner, run bounded headless browser tasks, capture screenshots/log summaries, hash non-sensitive evidence, and terminate. The browser session can persist across sequential CLI commands during that one job.

Limitations:
- The VM and browser process disappear when the job ends.
- There is no stable public endpoint for interactive remote sessions.
- No continuity across runner jobs unless state is explicitly and safely persisted.
- GitHub scheduling, job-duration, concurrency, storage, and network limits still apply.
- A successful smoke test is not proof of secure authenticated browsing or a production browser service.

This mode is suitable for deterministic UI tests, public-page checks, and bounded QA; it is not a continuously available browser desktop.

### B. Persistent remote browser sessions — requires a persistent host/service

The `agent-browser` observability dashboard uses port `4848`; session traffic is proxied through the dashboard origin, so individual session ports need not be exposed. A production remote service still needs a continuously running process, authenticated ingress, session isolation, resource controls, state encryption, audit, and cleanup.

GitHub-hosted Actions runners cannot provide that always-on process. A persistent host or a separately qualified free hosting service is required. No free, unlimited persistent compute entitlement has been established. Self-hosting may avoid a cloud-provider session fee, but still consumes owner hardware, electricity, bandwidth, and maintenance capacity.

## Current infrastructure blocker

The current SentinelX inventory read on 2026-11-16 returned:
- Connected hosts: 0.
- `Voktors-Mini.Dlink`: enrolled but offline; last connection 2026-11-09.
- `mh-dev-01` and `mh-dev-02`: disabled by the user.
- SentinelX plan: Free, one active-host slot, currently unused.

Therefore no online persistent host is available for browser installation or service deployment in this pass. Do not attempt a remote install against offline/disabled hosts. Do not create a paid VM or upgrade a plan.

## Security and governance requirements before enabling a browser profile

1. Add a dedicated allowlisted profile and exact-head CI tests; do not expand the existing DSH profile implicitly.
2. Keep browser workers isolated from controller and reporting jobs; grant no write token to the browser process.
3. Never pass GitHub/provider secrets, browser session cookies, or authentication vault contents into prompts, logs, screenshots, or artifacts.
4. Use per-task isolated browser profiles and explicit domain allowlists; block arbitrary URL/file access unless separately approved.
5. Bind each run to an immutable task ID and target SHA; record run IDs, job IDs, tool/CLI version, browser version, evidence digests, and terminal state.
6. Enforce bounded session count, wall time, CPU/RAM/disk, navigation limits, and cleanup. No "unlimited" session claim.
7. For remote interactive access, require authenticated owner-only ingress, TLS, CSRF/origin protections, session revocation/expiry, encrypted state at rest, and an auditable access log.
8. Keep the controller dispatch gate disabled until the existing Cloud Pool admission/governance gates pass. Browser installation is not authorization to dispatch arbitrary agents.

## Acceptance sequence

- [ ] Online host or approved persistent hosting target is positively identified; free-tier terms and actual resource limits are verified.
- [ ] Vendor CLI and official skill are installed from trusted sources; versions and integrity are recorded.
- [ ] `agent-browser skills get core` is loaded and a harmless public-page headless smoke test passes.
- [ ] Browser profile has exact-head CI and security tests, including domain allowlist and cleanup.
- [ ] Ephemeral worker evidence is verified separately from persistent remote-session evidence.
- [ ] If persistent sessions are required, authenticated dashboard access, session isolation, state persistence/revocation, and resource exhaustion controls pass independent review.
- [ ] No paid fallback, secret exposure, or quota evasion is used.

**Current status:** design documented; installation NOT RUN; browser worker NOT IMPLEMENTED; persistent remote sessions NOT AVAILABLE; unlimited/free capacity NOT VERIFIED. Cloud Pool dispatch remains fail-closed.
