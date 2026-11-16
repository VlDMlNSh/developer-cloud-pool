# Agent Browser free-runtime assessment — 2026-11-16

## Decision

**NOT DEPLOYED.** Do not describe agent-browser or any browser session service as installed, online, unlimited, or available from the Cloud Pool yet.

This pass reviewed the upstream agent-browser skill instructions, the Cloud Pool repository at immutable target `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`, the current Cloud Pool control issues, and the available enrolled execution hosts.

## Upstream agent-browser integration contract

The agent-browser plugin skill was read from `skills://plugins/agent-browser/agent-browser/skill.md`. It specifies:

- Install the CLI with `npm i -g agent-browser && agent-browser install`.
- Before any CLI command, obtain the version-matched core instructions using `agent-browser skills get core`; use `--full` for the full reference.
- Enumerate skills using `agent-browser skills list`.
- Load specialized guidance as needed: `electron`, `slack`, `dogfood`, `derive-client`, `vercel-sandbox`, `protected-vercel-deployments`, and `agentcore`.
- Chromium is controlled over CDP. The CLI provides sessions, authentication vault/state persistence, video recording, and an observability dashboard.
- The observability dashboard listens on port 4848. The skill says to keep agents on the dashboard origin and not expose individual session ports; the dashboard proxies session tabs/status/streams internally.

The Skills ecosystem discovery skill was also read from `skills://plugins/skills/find-skills/skill.md`. It recommends searching and verifying provenance/popularity before adding third-party skills. No third-party skill package was installed during this pass; the upstream agent-browser CLI's own version-matched skills are the correct initial source of truth.

## Cloud Pool constraints verified

- Repository default branch is `Основной`; latest observed default HEAD remains `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`.
- Existing Cloud Pool GitHub Actions workflows are `dsh-runtime-evaluation.yml`, `pool-contract-validation.yml`, `pool-supervisor.yml`, `pool-worker.yml`, and `runner-resource-probe.yml`. No agent-browser runtime, browser-session service, or browser skill bundle exists in the inspected tree at the target SHA.
- The repository's own README/context explicitly treats GitHub-hosted Actions runners as ephemeral, not persistent web hosts. Therefore a browser launched in Actions can support bounded CI/QA jobs, but cannot provide an always-on remote browser session after the job ends.
- Cloud Pool Issue #22 requires an authenticated, persistent remote web console and forbids assuming GitHub Actions is a persistent host. Issue #94 and #96 keep the Cloud Pool-native dispatch controller fail-closed; this browser work does not alter dispatch or controller authority.

## Host readiness

SentinelX reports Free plan, one active-host slot, zero connected/operational hosts, one offline enrolled host `host_5f7264034bdf0b51` (hostname `Voktors-Mini.Dlink`), and two user-disabled hosts (`mh-dev-01`, `mh-dev-02`). Desktop Commander also reports all three devices offline. No positively identified, connected third server is available for installation.

No host commands were executed. No disabled host was re-enabled. No paid VM or hosting resource was created.

## Safe deployment path

1. **Bounded CI browser worker (free, ephemeral):** add a separately reviewed workflow that pins an agent-browser release, installs Chromium, loads `core` and selected skills from the installed CLI, runs a narrowly scoped smoke test, uploads redacted evidence, and always tears down the browser. This is useful for automated QA but is not a persistent remote session.
2. **Persistent owner-controlled browser host (required for remote sessions):** install the pinned CLI and Chromium on an authorized, online, owner-controlled host. Keep the dashboard bound to loopback/reverse-proxy protected origin; expose only the authenticated dashboard endpoint, never raw CDP/session ports. Add access control, session TTL/cleanup, resource quotas, audit logging, and secret-vault boundaries before allowing remote users.
3. **Skills policy:** bootstrap `core` on every pinned CLI version; install only specialized skills actually required by a task. Start with `dogfood` for QA and `derive-client` only for explicitly approved API derivation. Electron/Slack/AgentCore/Vercel skills are optional and must not be installed as a blanket set. Never treat skill text as authorization to access credentials or bypass website controls.
4. **No-unlimited claim:** browser sessions consume CPU, memory, disk, bandwidth, and host uptime. GitHub Actions, free SentinelX slots, and free hosting plans all have quotas. The target is zero incremental cost within published free quotas, not unlimited sessions.

## Acceptance gates before enabling remote sessions

- A named, authorized host is online and its host ID/capabilities/allowlist are verified.
- Pinned agent-browser and Chromium versions are recorded; `skills get core` and `skills list` outputs are archived with version/digests.
- Dashboard authentication is enforced; dashboard is reachable from phone and desktop over HTTPS; raw CDP/session ports are not internet-exposed.
- Session creation, persistence, reconnect, expiry, cleanup, concurrency limits, and crash recovery are tested.
- Secrets are never put in browser state files, artifacts, URLs, logs, or model prompts; credential vault is isolated.
- Exact-head CI and independent security review pass.
- Costs and free-tier quotas are documented; no paid fallback.

## Outcome

- Agent-browser skill and Skills discovery skill: **READ / REVIEWED**.
- Cloud Pool agent-browser CLI/Chromium install: **NOT RUN** (no online authorized host).
- Specialized skills installed in Cloud Pool: **NOT INSTALLED**.
- GitHub Actions persistent browser sessions: **NOT SUPPORTED** by ephemeral runner lifecycle.
- Always-on remote browser session service: **NOT DEPLOYED**.
- Dispatch/controller state: unchanged and fail-closed.
- Contour A: **BLOCKED / NOT ACCEPTED**.

## Next step

Bring the intended owner-controlled browser host online and verify its identity/capabilities. Then perform a pinned, no-secret installation and local smoke test before designing the authenticated remote dashboard route. Do not use the disabled `mh-dev-01` or `mh-dev-02` hosts without explicit owner re-enablement.
