# Developer Cloud Pool — 20 Runner Architecture

**Status:** DESIGN / NOT DEPLOYED  
**Date:** 2026-11-04  
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Objective

Build a governed engineering workforce from on-demand GitHub-hosted jobs. Twenty concurrent jobs are a planning ceiling, not twenty persistent machines. Each standard hosted job receives a fresh isolated VM; local disks, processes, credentials and machine identity do not persist between jobs.

## 2. Resource envelope

Planning baseline for standard public-repository Linux x64 hosted runners:
- 4 vCPU
- 16 GB RAM
- 14 GB SSD
- Up to 20 concurrent standard jobs on GitHub Free, subject to account and platform limits
- Public standard-runner usage is free under the applicable GitHub policy

Theoretical aggregate for twenty simultaneous jobs is 80 vCPU, 320 GB RAM and 280 GB ephemeral SSD, distributed across isolated VMs. This is not a shared machine, RAM pool or filesystem. ubuntu-slim is a lightweight container profile, not a standard VM.

Re-check current GitHub documentation and measure actual assigned images before operational commitments.

## 3. Proposed logical profiles

All profiles below are PLANNED, not installed or qualified. They are reusable workflow/job definitions, not persistent servers.

| ID | Profile | Responsibility |
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

Consolidate or split profiles only after measuring CPU, memory, disk, startup time and compatibility. Do not install every toolchain into every image.

## 4. Architecture boundaries

### Control plane
Dodaios is a candidate operator cockpit, not yet a qualified GitHub Actions controller. A separate Pool Bridge / policy gate is required before mission dispatch. No unrestricted agent-to-GitHub dispatch is assumed.

### Execution plane
Every dispatched task must include:
- immutable target commit SHA;
- task ID and explicit role;
- allowlisted repository paths and operations;
- input references and expected output format;
- timeout and resource budget;
- minimum required permissions;
- acceptance criteria and independent verification requirements.

### Repository Hub and evidence
Git is the source of truth for code and durable specifications. Runner-local storage is ephemeral. Actions cache is an optimization, not durable shared storage. Artifacts are bounded transient evidence and must not contain secrets or sensitive data. A durable Repository Hub requires a separately selected and qualified storage service.

### Browser execution
Headless Dodaios does not itself provide desktop screen control. Browser work is delegated to an ephemeral browser profile. Keep agent-browser and its Chromium installation together; use Playwright separately for deterministic UI tests unless measurements justify consolidation.

## 5. Resource qualification gates

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
- record memory pressure; do not assume all 16 GB are available to one process;
- set explicit job timeouts;
- do not install unrelated heavyweight toolchains during baseline probing.

A profile is QUALIFIED only after representative workload, cleanup, security controls and independent review pass.

## 6. Security and governance

- Default workflow token permission: contents: read.
- Pin third-party Actions to reviewed full commit SHAs before production use.
- Never echo secrets, environment dumps, credential files or authorization headers.
- Untrusted pull-request code must not receive secrets or privileged write tokens.
- Distinguish PLANNED, IMPLEMENTED, TESTED, VERIFIED, QUALIFIED and ACCEPTED.
- A green resource probe does not qualify an agent profile or authorize provider credentials.
- No paid fallback, secret aliases or privilege escalation without explicit policy approval.

## 7. Current status

| Component | Status | Evidence |
|---|---|---|
| Public repository | VERIFIED | Repository metadata, 2026-11-04 |
| Initial README | IMPLEMENTED | README.md |
| Architecture specification | IMPLEMENTED | This file |
| Runner resource probe | IMPLEMENTED, NOT RUN | .github/workflows/runner-resource-probe.yml |
| Twenty logical profiles | PLANNED | Section 3 |
| Dodaios control-plane bridge | NOT VERIFIED | No qualified bridge evidence |
| Durable Repository Hub | DESIGN ONLY | No service selected |
| Agent installation / qualification | NOT RUN | No runner jobs executed |

## 8. Next bounded step

Run the manual resource probe on ubuntu-24.04, record actual runner characteristics, then build a single-profile install/measurement harness. Do not launch model agents or configure secrets during baseline measurement.

## References

- GitHub-hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- Actions limits: https://docs.github.com/en/actions/reference/limits
- Dependency caching: https://docs.github.com/en/actions/reference/dependency-caching
- Dodaios: https://github.com/Dodaios/Dodaios
- agent-browser: https://github.com/vercel-labs/agent-browser
