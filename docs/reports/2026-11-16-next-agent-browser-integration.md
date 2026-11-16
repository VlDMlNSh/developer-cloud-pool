# /next report — agent-browser integration assessment

**Date:** 2026-11-16  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Base SHA:** `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`  
**Working branch:** `docs/agent-browser-cloud-pool-integration-2026-11-16`  
**Documentation commit:** `f62cb19916400121f9f77849bb312285cd57e1d6`

## Work completed

- Read the official installed agent-browser skill stub and the Skills discovery/install skill.
- Confirmed vendor workflow: install CLI + Chromium separately; install the official Vercel Labs skill via Skills CLI; load `agent-browser skills get core` from the installed CLI before browser commands.
- Identified `dogfood` as the only additional generally relevant specialized skill for exploratory QA. Electron, Slack, derive-client, Vercel Sandbox, protected Vercel deployments, and AWS AgentCore are conditional and are not baseline dependencies.
- Inspected the Cloud Pool default-branch worker and supervisor: worker allowlist currently contains only `dsh-headless-probe`; supervisor is event-driven and ephemeral; no browser runtime/skill/package is installed.
- Checked SentinelX and Desktop Commander inventory: zero connected SentinelX hosts; one enrolled host offline; two hosts user-disabled; Desktop Commander devices all offline. No persistent host is available for deployment.
- Added an architecture decision describing ephemeral GitHub Actions browser workers vs persistent remote browser sessions, security requirements, acceptance gates, and honest resource limitations.

## Evidence

- Base HEAD: `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`.
- Existing `.github/workflows/pool-worker.yml` blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; allowlist is DSH-only.
- Existing `.github/workflows/pool-supervisor.yml` blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; no persistent browser service.
- New ADR: `docs/architecture/AGENT-BROWSER-CLOUD-POOL-INTEGRATION.md`; commit `f62cb19916400121f9f77849bb312285cd57e1d6`.
- SentinelX inventory: 0 connected hosts; Free plan limit 1 active host; `Voktors-Mini.Dlink` offline since 2026-11-09; `mh-dev-01` and `mh-dev-02` disabled by user.
- Official vendor references: https://github.com/vercel-labs/agent-browser and https://agent-browser.dev/installation.

## Status

- Agent-browser CLI installation: NOT RUN.
- Agent-browser skill installation into a runtime: NOT RUN.
- Browser worker profile: NOT IMPLEMENTED.
- Ephemeral browser worker: PLANNED / NOT VERIFIED.
- Persistent remote browser service: BLOCKED — no connected host or approved persistent free hosting target.
- "Unlimited free sessions": NOT VERIFIED and cannot be promised. GitHub Actions, host capacity, time, storage, bandwidth, and site-side limits remain.
- Cloud Pool controller dispatch: remains fail-closed; this documentation does not authorize dispatch or runtime changes.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

When an approved host is online, validate its exact host ID/capabilities/allowlist and install the pinned agent-browser CLI + Chromium + official skill there. In parallel, implement a separate allowlisted ephemeral browser-worker profile only after the Cloud Pool admission and governance gates are satisfied. Do not expose dashboard port 4848 publicly; remote access requires authenticated TLS ingress, per-session isolation, expiry/revocation, audit, and resource quotas.
