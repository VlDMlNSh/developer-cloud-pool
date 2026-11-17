# Cloud Development Pool — Owner Architecture Freeze and First Implementation Order

**Date:** 2026-11-17  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Status:** OWNER-DIRECTED TARGET ARCHITECTURE / IMPLEMENTATION BASELINE — NOT DEPLOYED, NOT QUALIFIED, NOT ACCEPTED  
**Scope:** Contour A only. MediaHub OS / Contour B remains out of scope until Contour A is ACCEPTED.

## 1. Owner decisions

This document records the owner's current explicit deployment decisions. It supersedes conflicting earlier Cloud Pool planning notes only where stated below. It does not claim that the referenced credentials, services, routes, or runtimes have been independently verified.

1. Start with **one primary Claude Code executor profile**.
2. The first profile is **Claude Code + Everything Claude Code (ECC toolkit) + Free Claude Code (FCC) + approved API routes**. Claude Code is not authenticated through the Anthropic API in this design. FCC is the model gateway for this profile.
3. Existing GitHub Actions Secrets are owner-reported as already populated with API keys. Secret values must never be read, copied, logged, or exposed. Presence, provider identity, account ownership, route compatibility, free-tier eligibility, and remaining quotas are **NOT VERIFIED** until safely proven through metadata or bounded no-secret tests.
4. The first executor is the immediate implementation priority. Do not block its preparation on Gemini agents, Codex, the second Claude Code profile, a physical server, or Mac mini.
5. A second Claude Code profile using the same general FCC/ECC pattern may be added later **only if measured first-profile daily usage leaves sufficient verified free quota and capacity**. It is not part of the initial launch.
6. The separate MEDIA profile is deferred until a remote video server with a local model is available and qualified. Its intended route is **Claude Code + ECC toolkit → OmniRoute → remote local model/Ollama**. This profile must not receive provider API keys and must not use paid or external API fallback. It is not part of the initial cloud-only deployment.
7. A future Mac mini 2018 local model may be connected as an additional route to the first CODE profile after that hardware is acquired and separately qualified. It is not a launch dependency.
8. Codex CLI with OpenAI API is an optional additional executor, subject to runner disk, memory, installation, authentication and task-smoke qualification. It is not a launch dependency.
9. Gemini and other agents are optional supplementary workers. The four-agent Gemini candidate is not the core executor architecture and must not gate first Claude Code implementation.
10. YouTube integration is included in the wider target architecture as a separate connector, with public-data API-key access separated from channel-management OAuth permissions. It is not a prerequisite for first executor qualification.
11. The initial cloud pool, first Claude Code/FCC/ECC/API profile, Jarvis web surface, orchestration and state must use GitHub-hosted infrastructure only. No self-hosted runner, physical computer, NAS, local server or external compute is required for initial Contour A.
12. The GitHub-hosted runner concurrency target is up to the account's available 20-job ceiling. This is a concurrency ceiling, **not** twenty permanent machines or a guarantee that twenty jobs are simultaneously available.

## 2. Initial implementation target

The first deliverable is a working, bounded, auditable CODE execution path:

`Owner → Jarvis web surface → GitHub-native task intake → Pool A0 admission/policy → GitHub Actions ephemeral runner → Claude Code + ECC → FCC → verified free API route → result branch/PR/artifacts → independent verification → Jarvis status`

The first implementation must remain fail-closed until admission, runner identity, secret isolation, route allowlisting, quota policy, cancellation, recovery, evidence publication and independent review are qualified.

### First executor profile — CODE

- Runtime: GitHub-hosted ephemeral Ubuntu runner.
- Executor: pinned Claude Code CLI.
- Toolkit: selectively installed and pinned Everything Claude Code (ECC) skills/rules/hooks; no broad automatic permission grant.
- Gateway: FCC, run inside the isolated executor job unless a separately qualified hosting arrangement is later approved.
- Model routes: only explicitly allowlisted API routes with verified provider/account/quota metadata and confirmed Claude Code compatibility.
- Authentication: no Anthropic API authentication. FCC/provider credentials are injected only into the trusted job boundary and never into untrusted task content, browser assets, logs, child payloads or artifacts.
- Work area: isolated checkout/worktree bound to immutable repository and target SHA.
- Output: bounded patch/branch/PR, test summary, provenance manifest and artifact digests.
- Billing: free routes only; paid fallback disabled; no key cycling or quota-domain mixing.

## 3. Deferred profiles and extensions

### Second CODE executor

A second Claude Code profile is a capacity expansion, not a launch dependency. Admission requires measured first-profile usage across representative work, remaining daily quota, concurrency and rate-limit headroom, plus independent workspace and credential isolation. No second profile should be dispatched merely because a second runner slot exists.

### MEDIA executor

The MEDIA profile is deferred until a remote video server and its local model are available. It must be API-key-free. The intended chain is Claude Code + ECC → OmniRoute → remote Ollama/local model. Network identity, server authorization, model capability, latency, capacity, data boundaries and recovery must be qualified before activation. No MediaHub physical topology or credentials are implicitly imported into Cloud Pool.

### Codex and Gemini

Codex CLI and Gemini agents remain optional. Codex is considered only after a runner resource probe confirms it fits the standard runner and the OpenAI API route is verified. Gemini can be used as a supplementary model/agent route, but the first Claude Code executor does not depend on a four-agent Gemini wave.

### Mac mini

Mac mini 2018 is a future owner-operated extension. The initial pool must operate without it. The local model connection will be a separately authorized and qualified route, not a reason to move the initial control plane or secrets onto physical hardware.

## 4. GitHub-only hosting boundary and Jarvis

The owner requires the initial pool and Jarvis to be based on GitHub-hosted infrastructure, without physical hardware or an external always-on server.

GitHub Actions runners are ephemeral and are not persistent web servers. Therefore the GitHub-only first release must use a GitHub-native interaction pattern:

- Jarvis frontend may be published as a static GitHub Pages site, if repository/account settings and security requirements permit.
- GitHub Issues / Discussions / pull requests and authenticated GitHub actions are the initial task-intake and status primitives.
- Actions workflows provide event-driven execution and bounded APIs/jobs; they must not be represented as a continuously running backend.
- Persistent task state must be stored in a qualified durable GitHub-native mechanism or a separately owner-approved no-cost hosted persistence service. GitHub labels alone are not an atomic lock or durable lease.
- Do not put OAuth client secrets, provider keys or privileged GitHub tokens in static browser code.
- If a required Jarvis feature cannot be implemented securely with GitHub-native primitives, mark that capability BLOCKED and document the minimum hosting dependency. Do not silently deploy an always-on process on a runner or claim that an ephemeral runner is a persistent host.

This hosting constraint is an implementation boundary, not permission to weaken authentication, task admission, state durability or secret isolation.

## 5. Security and quota invariants

- Never inspect or print GitHub Secret values.
- Treat owner-reported secret presence as unverified until a safe metadata-only or no-secret test proves the necessary contract.
- Maintain one credential reference, provider account reference and quota-domain identity per credential; never infer separate quotas from secret suffixes.
- Reserve quota before execution; settle actual usage after execution; honor provider-specific cooldown and reset semantics.
- Do not automatically rotate keys, cross-fallback between accounts, or route to paid models.
- Separate profile workspaces, browser profiles, credentials, provider budgets, memory namespaces and artifact namespaces.
- Treat model output and browser content as untrusted data, never as authority to modify policy or expand permissions.
- Use immutable target SHA, bounded paths/commands/domains/egress/time, unique attempt IDs, fenced leases, cancellation and auditable reconciliation.
- Keep user-facing read/status plane separate from privileged task-control plane.
- Independent A3 verification is required; an executor cannot self-certify its own output.

## 6. First implementation sequence

1. Revalidate current default branch, governance, open PRs, exact-head CI and existing contracts.
2. Inspect mature upstream Claude Code, FCC and ECC sources; pin versions/commits and licenses. Verify FCC's actual runtime requirements and Claude Code protocol compatibility without reading secret values.
3. Build a no-secret runner resource/install proof for Claude Code + ECC + FCC. Measure disk, memory, startup, cleanup and reproducibility on the actual GitHub-hosted runner class.
4. Define and test the first profile's isolated secret-reference contract and explicit free-route allowlist. Do not make provider calls until security and quota gates are satisfied.
5. Complete Pool A0 task admission, durable single-use state, immutable attempt/lease/fencing/recovery, runner workload identity, cancellation and evidence lifecycle.
6. Integrate the first Claude Code executor behind the qualified A0 boundary.
7. Deliver the GitHub-native Jarvis web surface and authenticated status/task workflow within the hosting limits above.
8. Run bounded end-to-end smoke tasks, independent security review and acceptance matrix.
9. Only after first profile is stable, measure daily quota headroom and decide whether to add a second CODE executor.
10. Add MEDIA, Codex, Gemini, YouTube operations and physical/local extensions only in their stated order and with separate qualification.

## 7. Acceptance gates for first CODE profile

The first profile is not QUALIFIED until all of the following have evidence:

- Reproducible pinned installation on a GitHub-hosted runner.
- Claude Code starts and uses FCC rather than Anthropic API authentication.
- A positively allowlisted free model route responds through FCC with verified compatibility.
- Secret values are never exposed to model prompts, untrusted code, logs, browser or artifacts.
- Quota reservations, usage accounting, cooldown and paid-fallback denial are tested.
- Task admission is owner-authorized, single-use and bound to immutable target SHA.
- Runner identity, workspace isolation, allowed operations, cancellation and recovery are tested.
- Output is published with provenance and artifact digests.
- Independent A3 review passes.
- Jarvis displays real authenticated status without exposing privileged tokens.
- No paid resource or physical machine is required for the initial path.

## 8. Current status and evidence boundary

This document records owner-directed architecture decisions only. It does not prove that any API key exists or is valid, that FCC/OmniRoute/FreeLLMAPI is deployed, that Claude Code or ECC is installed, that a free provider route is available, that Jarvis is hosted, or that any executor has run.

At the time of this decision record:
- First Claude Code/FCC/ECC profile: **PLANNED**.
- GitHub-only Jarvis: **PLANNED**.
- Second CODE profile: **DEFERRED — quota-gated**.
- MEDIA local-only profile: **DEFERRED — remote local model required; API keys prohibited**.
- Mac mini local model: **DEFERRED — future extension**.
- Codex: **CONDITIONAL / NOT QUALIFIED**.
- Gemini supplementary agents: **OPTIONAL / NOT QUALIFIED**.
- YouTube connector: **PLANNED / NOT IMPLEMENTED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

Canonical project context: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md).  
Canonical repository: https://github.com/VlDMlNSh/developer-cloud-pool  
Separate MediaHub OS repository: https://github.com/VlDMlNSh/mediahub-os
