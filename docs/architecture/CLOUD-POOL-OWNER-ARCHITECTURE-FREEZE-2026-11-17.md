> SUPPORTING OWNER DECISION RECORD. The current system-level architecture is `CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md`; apply its later owner-boundary reconciliation where wording differs.

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


## 9. Implementation lock — 2026-11-17

This owner-approved architecture is the fixed implementation baseline. Routine /next passes must execute the ordered plan in [CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md), not reopen architecture selection. Revisions are permitted only for evidence-backed implementation incompatibility, security findings, or a failed acceptance gate; every such correction must be narrowly scoped and recorded with evidence.

**First deliverable:** one GitHub-hosted ephemeral Claude Code + ECC toolkit + FCC + one explicitly qualified free API route. No Anthropic API authentication. No secret reads. No provider calls from pull_request workflows.

**Current first-runner evidence:** PR #116 head `c5c14f6a11782e5787a38b1edd5e7983f15bf2e2`, run `44066723324`. At the last job read, Claude Code CLI and uv installation passed; FCC installation was still running; ECC and final checks were pending. This is RUNNING / NOT VERIFIED, not an installation pass.

**FCC policy finding:** at pinned FCC commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`, `MODEL_FALLBACKS` defaults to `None`, while `PROVIDER_MAX_ATTEMPTS` defaults to 5. Before any provider call, explicitly set a bounded retry policy and preserve no-fallback/no-key-cycling behavior. The Admin UI must remain loopback-only; never expose FCC admin endpoints publicly.

**Execution order:** first runtime proof → FCC policy and one free route qualification → durable A0 admission/lease/worker identity → first Claude Code task integration → GitHub-only Jarvis static/status experience → browser/connectors → quota-gated second CODE → deferred local-only MEDIA and physical extensions. Contour B remains prohibited until Contour A is ACCEPTED.

**Hosting boundary:** GitHub Actions runners are ephemeral, not persistent web hosts. Jarvis starts as static GitHub-hosted PWA plus GitHub-native task/status primitives. No privileged tokens in browser assets. If a requested always-on authenticated API cannot be safely implemented on GitHub-native primitives, mark it BLOCKED rather than silently adding an external server or misrepresenting runner persistence.

Canonical implementation roadmap: [CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md).  
Latest checkpoint: [2026-11-17-next-claude-code-runner-installation.md](../checkpoints/2026-11-17-next-claude-code-runner-installation.md).


## CURRENT OWNER /next OPERATING UPDATE — FOUR GEMINI AGENTS — 2026-11-17

The latest owner instruction now requests **four isolated Gemini task assignments for every ChatGPT /next**, supplementary to the primary Cloud Pool engineering pass. This supersedes the earlier 2026-11-17 scope note that treated Gemini as optional per /next. It does not waive any controller, admission, quota, security or governance gate.

Fixed roles: (1) researcher, (2) implementation designer, (3) adversarial tester, (4) security auditor. Each child must receive only its own unique bounded task and separately attributed account slot. No cross-account retry, key cycling, paid fallback, tool execution, repository writes or privilege escalation.

**Current dispatch disposition: NOT RUN.** Default branch `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` has no `.github/workflows/gemini-batch-dispatch-controller.yml`; current default workflow inventory is only DSH evaluation, Pool Contract Validation, Pool Supervisor, Pool Worker and Resource Probe. The four-account helper candidate PR #107 is OPEN/DRAFT/UNMERGED and its base `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b` is two commits behind default; it contains an in-process four-client helper/fake-client tests, not an Actions dispatcher. PR #109 is OPEN/DRAFT/UNMERGED on current default base and its exact-head fake-client suite passed 11/11, but does not add workflow dispatch, durable leases/fencing/recovery, production caller authorization or free-route proof. PR #112 is read-only event validation; PR #114 is atomic admission proof with `dispatch:false` and `executionAuthorized:false`. PR #107/#109 have zero formal reviews. The MediaHub three-agent bridge is a separate control plane and is not a substitute for a four-child Cloud Pool controller.

Current Pool Contract Validation run `44075999524` explicitly read back `POOL_DISPATCH_ENABLED=false`. Keep it false. Four secret slots do not prove four distinct Google accounts or quota domains; never read secret values. The latest owner request is recorded on Cloud Pool Issues #94 and #96 in comments `6947028166` and `6947031522`.

**FCC runtime lifecycle pass:** pinned FCC source `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` confirms `fcc-server` entrypoint, `HOST` default `0.0.0.0`, `PORT` default `8082`, browser auto-open default true, and local-only `GET /admin/api/status` guarded by loopback client/Host/Origin. PR #116 workflow now explicitly sets HOST=127.0.0.1, FCC_OPEN_BROWSER=false, PROVIDER_MAX_ATTEMPTS=1 and uses only a read-only loopback GET. No provider credentials/calls or completion endpoint. First run #44075802559 failed due an escaped runner.temp expression; second #44075999516 reached HTTP 200 but SIGTERM exited 143. Both defects were corrected (runner path and SIGINT graceful shutdown). Latest PR #116 head `596c03e19b4662f69a9b40791299f55afb9a928e`; Pool Contract Validation run `44076256865` SUCCESS; runtime run `44076256742` RUNNING at this update. Do not mark lifecycle proof successful until its job, listener, shutdown and artifact are rechecked.

Next: verify exact-head run `44076256742`; correct any remaining issue with evidence; then finish Issue #117. Four-agent live dispatch remains NOT RUN until the Cloud Pool-native controller gates are qualified. Contour A remains NOT ACCEPTED; Contour B deferred.


## FINAL /next RECONCILIATION — 2026-11-17

- Full dated report: [2026-11-17 FCC loopback runtime and four-Gemini gate](../reports/2026-11-17-next-pass-fcc-loopback-and-four-gemini-gate.md), report commit `d8e62ee93cb5861c5a37550b33cedd272004b58a`.
- PR #116 final head `596c03e19b4662f69a9b40791299f55afb9a928e`; workflow blob `3786d3c23d434f9af39c40203b0a53f888c2b12a`.
- Runner lifecycle run [44076256742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742): SUCCESS; job `134014928455`. Readiness GET returned 200, exact loopback listener asserted, SIGINT shutdown exit 0 and listener removal asserted by the passing job.
- Artifact [14325645831](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742/artifacts/14325645831), 12,548 bytes, GitHub SHA-256 `6eced8c6b355f89a39c897a2ad5daab4e93b4055d73067ff7ceef7ac0bd1c9eb`.
- Pool Contract Validation [44076256865](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256865): SUCCESS; job `134014929136`; log read-back `POOL_DISPATCH_ENABLED=false` and `POOL_CONTRACT_VALIDATION=PASS`.
- Two earlier failed runtime attempts (`44075802559`, `44075999516`) are retained historically and superseded by the successful final run.
- Current owner instruction: four Gemini assignments requested for every `/next`; comments are recorded on Issue #94 (#6947028166) and Issue #96 (#6947031522). Actual Gemini dispatch remains NOT RUN: no default-branch Cloud Pool Gemini dispatch workflow, PR #107 candidate is based two commits behind default, PR #109 is fake-client tests only, PR #112 read-only, PR #114 dispatch:false, and no independent review/account quota proof. Do not use the MediaHub three-agent bridge as a substitute. Keep `POOL_DISPATCH_ENABLED=false`.
- PR #116 and PR #113 remain OPEN / DRAFT / UNMERGED; PR #116 formal reviews 0 / threads 0. Contour A NOT ACCEPTED; Contour B deferred.
- Next bounded step: synthetic FCC-to-Claude CLI bridge test with mock provider/no credentials, then independent review of PR #116. Gemini controller qualification continues behind Issues #94/#96.


## Canonical reference architecture adoption — 2026-11-17

The consolidated normative implementation baseline is now [CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md](CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md). It does not change the owner decisions above; it resolves component boundaries, authority, execution, route/quota, persistence, security and acceptance order. Where an older proposal conflicts, this reference and the latest owner decision supersede it; existing A0/D1 contracts remain authoritative for their domains.

Routine /next passes must implement the ordered roadmap and must not repeatedly reopen architecture selection. A change requires a dated ADR and evidence. This document and the reference architecture are candidate docs-branch artifacts until PR #113 is reviewed and merged. No deployment or Contour A acceptance is implied.


## Owner scope and implementation reconciliation — 2026-11-17 (latest)

This amendment supersedes the earlier section titled **CURRENT OWNER /next OPERATING UPDATE — FOUR GEMINI AGENTS** wherever it states that four Gemini assignments are mandatory for every `/next`. The later owner scope corrections in Issues #94 and #96 govern: Gemini is an optional supplementary capability, not a mandatory per-/next wave and not a first-release or Contour A launch gate. When a specific task benefits from Gemini, use only the approved Cloud Pool controller after its authority, durable admission, lease/fencing/recovery, identity, quota, security and governance gates pass. Otherwise record NOT RUN; never bypass the controller. Keep `POOL_DISPATCH_ENABLED=false` until qualification.

**Updated exact-head implementation evidence:**
- PR #116 exact head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`.
- No-secret Claude Code + ECC + FCC qualification [44083961406](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961406): SUCCESS.
- Pool Contract Validation [44083961455](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961455): SUCCESS.
- Synthetic bridge artifact [14329030788](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961406/artifacts/14329030788): available.
- Independent review [5938432852](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116#pullrequestreview-5938432852): COMMENTED, not an approval for production use.
- Issue #119: CLOSED for mock-only bridge qualification. Issue #115 remains OPEN pending remaining provenance/license and real free-route/account/quota gates.
- PR #116 and PR #113 remain OPEN/DRAFT/UNMERGED. The canonical architecture and owner freeze are on the documentation candidate branch, not yet default-branch accepted.
- The mock bridge is not a real Claude session or provider-route proof. No secret read, provider call, Gemini dispatch, deployment or merge occurred.
- Engineering Workspace remains part of Contour A target but BLOCKED on host #3 identity/authorization, Cloudflare Access/Tunnel, persistent storage, backup/restore and same-workspace desktop/browser qualification.

Contour A remains NOT ACCEPTED; Contour B remains DEFERRED. Next bounded priority is qualify one actual free provider route and account/quota identity, while completing A0/D1 authority and recovery gates. Do not reopen architecture selection absent evidence-backed incompatibility or security finding.


## Third-party license gate — 2026-11-17

Pinned source inspection: FCC `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` is `AGPL-3.0-only`; ECC `e413166c50e85fb205b988b5e78874b5a88ea4d2` is MIT. Claude Code CLI is vendor-distributed proprietary software, not an open-source component. Do not expose FCC as a network-facing service until AGPL network-use/source-offer implications and notices are reviewed for the intended deployment. The PR #116 workflow now verifies and captures the pinned FCC/ECC LICENSE files and their SHA-256 digests. The latest exact-head CI for that change is pending at recording time; no license-compliance approval is implied.


## FCC account/quota isolation restriction — 2026-11-17

Pinned FCC source and tests show support for numbered API-key lists and `MODEL_FALLBACKS` entries that can move between keys after rate-limit/permission failures. Cloud Pool must not use this behavior across accounts. Each qualified FCC executor profile must contain exactly one provider credential/account, one selected model route, no fallback-model list and no key cycling. Distinct accounts require distinct isolated profiles and independent quota ledgers. Verify configuration metadata without reading or logging secret values. This is an unresolved gate for Issue #115; installation/mock success does not qualify it.


## Claude Code hosted-use and installer provenance gate — 2026-11-18

- The latest PR #116 exact-head CI is green, but the workflow still executes mutable `https://claude.ai/install.sh` and verifies only the installed version string `2.1.325`. It does not verify the installed binary against Anthropic's signed manifest. Installer/binary provenance is NOT VERIFIED.
- First-party Anthropic docs now document signed release manifests and SHA-256 binary verification; implement this before calling the CLI binary provenance-qualified: https://code.claude.com/docs/en/setup#binary-integrity-and-code-signing.
- First-party Anthropic legal docs state hosted sandboxes/agent infrastructure running Claude Code require agreement to Commercial Terms; each end user must authenticate with their own permitted credential; platform may not pay/resell/intermediate usage; Claude.ai login credentials/session tokens must not be collected, stored or intermediated: https://code.claude.com/docs/en/legal-and-compliance#can-customers-offer-claude-code-in-their-products.
- Official setup docs state Free claude.ai plan does not include Claude Code: https://code.claude.com/docs/en/setup#authenticate.
- Therefore no free shared Claude Code route is assumed. No real session, login, provider call, or credential proxy until vendor-compliant contract and per-user identity model are confirmed. If incompatible with free-only constraints, remove Claude Code from free executor eligibility.
- This does not invalidate the existing synthetic mock/loopback qualification; it limits its scope. Keep `POOL_DISPATCH_ENABLED=false`.
