# CODE worker sandbox upstream fit and next implementation boundary — 2026-11-18

## Scope and immutable inputs

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged in this pass).
- PR #116 current observed head: `570d78b7d3f7972b7458de9e69f6117ae642896a`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, OPEN/DRAFT/UNMERGED.
- PR #126 head: `f69f286b5b5a3de8dfdd80ed581859851ce271e5`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, OPEN/DRAFT/UNMERGED.
- Independent/external reviews remain deferred by owner direction. This pass uses source inspection, upstream license inspection and exact-head CI only.

## Current exact-head CI

- PR #116 Pool Contract Validation [44284859281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859281): COMPLETED/SUCCESS on `570d78b7d3f7972b7458de9e69f6117ae642896a`.
- PR #116 Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244): IN_PROGRESS at observation time; NOT VERIFIED. Do not treat it as passed.
- PR #126 Pool Contract Validation [44275194245](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44275194245): COMPLETED/SUCCESS on `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- PR #126 changed files are limited to supervisor/worker workflows, supervisor code, contract validator and its dated report. Exact-head job completed all seven steps successfully.
- PR #126 is not merged; the legacy DSH path remains on default branch until integration. Do not claim the default branch is already remediated.

## Repository findings

- The default-branch `.github/workflows/pool-worker.yml` is the legacy DSH workflow. It accepts `workflow_dispatch`, reads issue labels, installs DSH and includes a write-enabled report job. PR #126 makes that workflow inert and removes the corresponding supervisor dispatch path, but has not merged.
- PR #116 changes the runner qualification workflow and Python runtime guard/test modules; it does not yet replace the legacy default-branch worker with a CODE container worker.
- PR #116's latest runner run was still active at observation time. The previous checkpoint records recurring FCC shutdown diagnostics; current run 44284859244 is the authoritative attempt for the current head.

## Upstream component research

### 1. Eclipse Enclave — strongest reusable candidate for a later persistent workspace

- Repository: https://github.com/eclipse-enclave/enclave
- Inspected upstream README blob: `36b937f0206068b988079783bc78ba20cfe9582e`.
- Inspected LICENSE blob: `09ea0c61d381fba5fe0bea1815e2d9d670d7e665` (MIT).
- Upstream describes per-session Docker/Podman containers, allowlist gateway with audit log, credentials held outside the container and substituted by the gateway, persistent host-side session history/configuration, and Theia-based IDE integration.
- Fit: promising reference or later integration candidate for the persistent Engineering Workspace / interactive agent session.
- Not selected for immediate GitHub-hosted worker adoption: it is a broader host-oriented session/IDE product with Docker/Podman prerequisites and persistent host-side state. No compatibility proof exists for running its control plane inside a disposable GitHub Actions runner or fitting the existing A0/D1 task envelope. Do not import it wholesale before a no-secret compatibility spike and threat-model review.

### 2. Anthropic defending-code-reference-harness — strongest directly relevant isolation pattern

- Repository: https://github.com/anthropics/defending-code-reference-harness
- Inspected `docs/agent-sandbox.md` blob: `51aa087742a6337bc9d3743348def9e18be6fdee`.
- Inspected LICENSE blob: `84b83dc8f7700461f3d1917234a03b84cedc63ac` (Apache-2.0).
- The documented pattern separates trusted orchestration from arbitrary agent commands; runs agent and target code inside gVisor; attaches the agent to an internal Docker network without direct internet route; sends egress through a small allowlist proxy; defaults to `api.anthropic.com:443`.
- Fit: use as the primary implementation reference for the CODE worker's isolation topology and verification assertions.
- Limitation: its documented setup installs/configures gVisor and Docker on a Linux machine; no evidence yet that the exact runtime setup is compatible with GitHub-hosted Actions. The existing Cloud Pool proof establishes Docker `--network none` only, not gVisor availability or the complete proxy path. No direct adoption claim.

### 3. Docker Agent — useful sandbox feature reference, not the Cloud Pool worker

- Repository: https://github.com/docker/docker-agent
- Inspected README blob: `d3daeb8ead7e59d1acc0b453d034429d5e0449a7`.
- Inspected LICENSE blob: `7a4a3ea2424c09fbe48d455aed1eaa94d9124835` (Apache-2.0).
- Its sandbox documentation describes default-deny network policy with per-run host allowlists and restrictions on mounted host paths.
- Fit: reference for declarative network policy and audit-friendly allowlist handling.
- Not selected as the worker orchestrator: it is a separate multi-agent/provider framework, requires its own configuration/model/tool abstractions, and would duplicate Cloud Pool's existing task authority and A0/D1 control plane.

## Architecture decision for the next slice

**Decision: reuse the Anthropic reference harness's security topology as a design input; do not import a second agent framework or deploy a persistent sandbox product yet.**

The next CODE worker slice must be a vertical, no-provider-call qualification:

1. Keep trusted admission/orchestration outside the agent container. The container receives only an immutable task envelope, a bounded worktree and the minimum runtime environment.
2. Run the actual CODE executor process inside the isolated container, not merely a network probe in a throwaway container.
3. Keep container root filesystem read-only except explicit task/work/temp mounts; drop all Linux capabilities; enable no-new-privileges; run non-root; bound CPU, memory, PIDs, disk, time and output.
4. Start with no egress. Then test a separately routed gateway with a positive hostname/port allowlist and explicit denial tests for direct outbound bypass, DNS abuse, redirects and unapproved hosts. Do not add provider domains until account/entitlement/legal gates are resolved.
5. Keep credentials outside the worker. If a later provider route is approved, use a broker that injects narrowly scoped credentials at the gateway boundary; do not mount host credential files or pass repository secrets to PR-controlled code.
6. Persist only sanitized task results and digests outside the sandbox. No write-capable GitHub token enters the executor container.
7. The first pass remains synthetic/no-secret. No real Claude session, model call, provider credential, production dispatch or paid fallback.

## Immediate blockers

- PR #116 current Runner Qualification 44284859244: IN_PROGRESS / NOT VERIFIED.
- Actual CODE worker has not run inside the sandbox.
- Provider-specific egress gateway is not implemented or qualified.
- GitHub-hosted runner host egress remains public; container isolation does not isolate the host.
- Claude Code hosted-use entitlement/account authority is NOT VERIFIED.
- FCC AGPL-3.0-only network-exposure legal review is NOT VERIFIED.
- PR #126 legacy-dispatch retirement remains proposed and unmerged.
- Hosted D1, live owner-only controller, durable leases/recovery, Jarvis web API and persistent workspace remain unqualified.

## Next concrete engineering step

After run 44284859244 reaches a terminal state, inspect its exact-head job logs and artifact digests. Then implement one new no-secret worker-container qualification workflow that launches a synthetic executor inside the actual restricted container and verifies (a) exact target SHA and task envelope, (b) no secret/token visibility, (c) read-only filesystem and capability restrictions, (d) no direct egress, (e) deterministic termination and artifact integrity. Keep provider egress disabled. Only then add the separately testable allowlist gateway.

## Safety and status

- No secrets read; no provider calls; no real agent session/task; no Gemini dispatch; no production dispatch; no deployment; no merge; no Contour B.
- PR #116 remains OPEN/DRAFT/UNMERGED; latest runner CI NOT VERIFIED at cutoff.
- PR #126 remains OPEN/DRAFT/UNMERGED; exact-head contract CI SUCCESS.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
