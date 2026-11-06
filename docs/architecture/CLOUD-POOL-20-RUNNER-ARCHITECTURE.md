# Developer Cloud Pool — 20 Runner Architecture

**Status:** DESIGN / NOT DEPLOYED  
**Date:** 2026-11-06  
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Objective and placement terminology

Build a governed engineering workforce from on-demand GitHub-hosted jobs. Twenty concurrent jobs are a planning ceiling, not twenty persistent machines. Each standard hosted job receives a fresh isolated VM; local disks, processes, credentials and machine identity do not persist between jobs.

Keep three independent units distinct:

1. **Credential slot** — one provider credential route identity and its quota/cooldown state. It does not require a dedicated VM. The API key itself is not an execution workload and must never be copied into an agent workspace.
2. **Runner slot** — one GitHub Actions job environment (normally one ephemeral hosted VM). A runner slot can host multiple compatible agent workloads inside one job when the resource and security gates pass. It cannot be shared across independent GitHub Actions jobs.
3. **Agent workload / function** — one process or isolated container carrying a measured resource envelope. Multiple functions may share one workload reservation when they execute inside the same runtime process. Multiple workloads may share a runner slot when policy permits.

A credential route does not consume one runner slot per key. The pool-wide limit of 20 active credential route leases is separate from runner-job concurrency and from the number of logical agents/functions. Do not multiply one category by another.

## 2. Resource envelope and measurement

Earlier planning baseline for standard Linux hosted runners was 4 vCPU / 16 GB RAM / 14 GB SSD. Do not treat those figures as a guaranteed current entitlement or as wholly available to workloads. Actual image, capacity and free disk must be measured on the exact runner image before profile qualification.

Resource packing dimensions:
- CPU millicores: peak sustained/requested CPU for each workload;
- memory MiB: measured peak RSS plus a safety reserve;
- scratch disk MiB: per-workload writable files, caches and temporary artifacts;
- runtime bundle disk MiB: immutable runtime/tool bundle installed once per pinned digest per runner slot, then mounted read-only into eligible workloads.

The inference workload for hosted API models runs on the provider side. A lightweight API client often has a small local footprint, but agent runtimes, browser binaries, language toolchains, repository checkout, context files and temporary artifacts may dominate local disk/RAM/CPU. Do not use API-key size as a proxy for agent runtime footprint.

The planner consumes measured usable capacity after host/system reserves, never nominal hardware capacity. Unknown resource envelopes are not eligible for multi-agent co-location. Do not overcommit CPU, memory or disk.

## 3. Resource-aware workload placement

Implementation reference: scripts/agent-placement.mjs; policy: config/agent-placement-policy.json.

The deterministic best-fit-decreasing planner:
- packs compatible workloads onto the fullest feasible runner while preserving capacity in CPU, RAM and disk;
- counts a pinned immutable runtime bundle once per digest per runner and scratch disk per workload;
- keeps separate CPU and memory reservations for every agent;
- requires the same task ID, target SHA, trust domain, isolation class, platform, architecture and network class;
- requires separate workspaces and explicit co-location permission;
- rejects raw credentials; only no-credential or per-workload gateway-scoped access is permitted;
- leaves independent reviewers/security auditors exclusive and separate from implementation;
- creates another runner slot up to the planning cap, or returns an explicit unplaced reason rather than overcommitting.

This is a pure planning component. It does not launch agents, create containers, acquire durable leases, read secrets, or enable dispatch. Actual co-location requires per-workload process/container isolation, separate workspaces, distinct short-lived gateway capabilities and a qualified runtime. Containers share a host kernel; do not co-locate mutually untrusted workloads or independent reviewers on the same host.

## 4. Proposed logical profiles

All profiles below are planned profiles/functions, not twenty mandatory separate VMs and not proof of installation or qualification.

| ID | Profile / function | Responsibility |
|---:|---|---|
| 01 | Dispatch / intake validation | Validate task envelope, target SHA and allowlisted operation |
| 02 | Policy / provenance | Permissions, policy checks, provenance and evidence |
| 03 | Gemini Research | Bounded research against immutable target |
| 04 | Gemini Implementation | Isolated implementation task |
| 05 | Gemini Independent Audit | Independent contract, test and security review |
| 06 | Ollama → FCC → Claude Code → ECC | One sequential toolchain on one runner profile |
| 07 | Codex CLI | Bounded coding and review tasks |
| 08 | Aider + Goose | Sequential toolbox; avoid concurrent heavyweight installs by default |
| 09 | mini-SWE-agent | Issue-to-patch experiments |
| 10 | OpenHands SDK | SDK-based agent tasks |
| 11 | Repository Intelligence | Indexing and repository analysis |
| 12 | agent-browser + Chromium | Browser operator tasks and evidence capture |
| 13 | Playwright UI QA | Deterministic browser tests |
| 14 | MCP / API integration | Connector and API contract tests |
| 15 | Research / documentation | Documentation and source verification |
| 16 | Unit tests | Fast test suite |
| 17 | Integration tests | Service and component integration |
| 18 | Build / performance | Build, package and performance checks |
| 19 | Security audit | Dependency, static and configuration checks |
| 20 | Independent review / evidence | Verify outputs, hashes, tests and provenance |

These are logical functions, not a fixed one-profile-per-runner mapping. Combine functions into one workload when they share a runtime process; combine separate workloads on one runner only through the resource-aware placement contract.

## 5. Architecture boundaries

### Control plane

Dodaios is a candidate operator cockpit, not yet a qualified GitHub Actions controller. A separate Pool Bridge / policy gate is required before mission dispatch. No unrestricted agent-to-GitHub dispatch is assumed.

### Execution plane

Every dispatched task must include:
- immutable target commit SHA;
- task ID and explicit role;
- allowlisted repository paths and operations;
- input references and expected output format;
- timeout and measured resource budget;
- minimum required permissions;
- acceptance criteria and independent verification requirements.

One GitHub Actions job may invoke a supervisor that runs multiple pre-approved workloads in isolated workspaces/processes/containers. This remains design-only until dispatch governance and runtime isolation gates are accepted.

### Repository Hub and evidence

Git is the source of truth for code and durable specifications. Runner-local storage is ephemeral. Actions cache is an optimization, not durable shared storage. Artifacts are bounded transient evidence and must not contain secrets or sensitive data. A durable Repository Hub requires a separately selected and qualified storage service.

### Browser execution

Headless Dodaios does not itself provide desktop screen control. Browser work is delegated to an ephemeral browser profile. Keep agent-browser and its Chromium installation together; use Playwright separately for deterministic UI tests unless measurements justify consolidation.

## 6. Resource qualification gates

For each candidate profile, collect:
1. runner image, OS release, architecture and kernel;
2. CPU, memory total/available and swap;
3. disk capacity/free space before installation;
4. tool versions and installation footprint;
5. peak memory and disk after representative workload;
6. execution duration and exit status;
7. cleanup behavior and residual state;
8. report digest and immutable target SHA.

Initial guardrails (to be tuned from measurements, not GitHub guarantees):
- warn if available disk is below 5 GiB before profile installation;
- warn if free disk after installation is below 3 GiB;
- record memory pressure; do not assume all RAM is available to one process;
- set explicit job timeouts;
- do not install unrelated heavyweight toolchains during baseline probing.

A profile is QUALIFIED only after representative workload, cleanup, security controls and independent review pass. A green resource probe does not qualify an agent profile or authorize provider credentials.

## 7. Security and governance

- Default workflow token permission: contents: read.
- Pin third-party Actions to reviewed full commit SHAs before production use.
- Never echo secrets, environment dumps, credential files or authorization headers.
- Untrusted pull-request code must not receive secrets or privileged write tokens.
- Distinguish PLANNED, IMPLEMENTED, TESTED, VERIFIED, QUALIFIED and ACCEPTED.
- No paid fallback, secret aliases or privilege escalation without explicit policy approval.
- Independent audit/review workloads remain on a separate runner slot from the implementation they assess.
- A shared runtime bundle is immutable/read-only; each workload gets a separate workspace and scratch directory.

## 8. Current status

| Component | Status | Evidence |
|---|---|---|
| Public repository | VERIFIED | Repository metadata, 2026-11-04 |
| Initial README | IMPLEMENTED | README.md |
| Architecture specification | IMPLEMENTED | This file |
| Runner resource probe | IMPLEMENTED, NOT RUN | .github/workflows/runner-resource-probe.yml |
| Twenty logical profiles | PLANNED | Section 4 |
| Pure agent placement planner | IMPLEMENTED in PR branch / exact code-head CI SUCCEEDED | scripts/agent-placement.mjs; Actions run 42209187115 on 8506de25ce52f9dd2a0db2ad7886898c5ef6c2b1 |
| Runtime co-location / container supervisor | NOT IMPLEMENTED | No qualified runtime |
| Dodaios control-plane bridge | NOT VERIFIED | No qualified bridge evidence |
| Durable Repository Hub | DESIGN ONLY | No service selected |
| Agent installation / qualification | NOT RUN | No runner jobs executed |

## 9. Next bounded step

Run the manual read-only runner resource probe and measure one minimal API-client profile plus one browser profile independently. Do not install all agent toolchains, connect real provider credentials, enable dispatch, or place independently trusted agents on a shared host. Only then calibrate profile envelopes and approve a bounded co-location pilot.

## References

- GitHub-hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- Actions limits: https://docs.github.com/en/actions/reference/limits
- Dependency caching: https://docs.github.com/en/actions/reference/dependency-caching
- GitHub Actions Runner Controller: https://github.com/actions/actions-runner-controller
- Kubernetes resource bin packing: https://kubernetes.io/docs/concepts/scheduling-eviction/resource-bin-packing/
- Dodaios: https://github.com/Dodaios/Dodaios
- agent-browser: https://github.com/vercel-labs/agent-browser
