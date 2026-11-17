# Cloud Development Pool — Canonical Reference Architecture

**Document ID:** CDP-RA-001  
**Version:** 1.0.0  
**Date:** 2026-11-17  
**Status:** CANDIDATE CANONICAL BASELINE / NOT DEPLOYED / NOT QUALIFIED / NOT ACCEPTED  
**Scope:** Contour A only. Contour B prohibited until Contour A is formally ACCEPTED.

> This document consolidates owner decisions and existing technical contracts. It is normative for implementation, not proof of deployment. A proposed or tested component is not operational until its own qualification evidence exists.

## 1. Authority and change control

1. This is the single architecture index and normative target for Cloud Pool implementation. The Owner Architecture Freeze remains the record of owner decisions.
2. Existing A0/D1 admission, qualified-route evidence, quota, lease/fencing, supervisor, worker, outbox, recovery and evidence contracts remain authoritative for their domains. This document does not replace or weaken them.
3. Owner decisions prevail over proposals. The stricter security/governance contract prevails over a conflicting convenience design until an ADR resolves it.
4. Changes require a dated ADR/change note: evidence, rationale, alternatives, affected contracts, threat analysis, migration/rollback, tests and owner impact.
5. Preserve historical IDs and immutable refs. Never rewrite history to make current status appear better.
6. This documentation branch is a candidate delivery branch. It is not the accepted default branch. Canonical status on default requires review, checks and merge.
7. Use statuses precisely: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

## 2. Release objective and frozen first profile

Initial release is one no-paid-fallback CODE executor:

**Claude Code CLI → pinned ECC toolkit → FCC loopback gateway → one positively qualified free API route.**

- No Anthropic API authentication.
- No secret-value reads. Existing secret names/presence do not prove provider identity, account ownership, free-tier eligibility, compatibility or remaining quota.
- No paid route, paid fallback, automatic key cycling, cross-account retry or quota-domain substitution.
- First release uses GitHub-hosted ephemeral Actions runners. No VPS, physical server, NAS, Mac mini or self-hosted runner is a launch dependency.
- Gemini, Codex, second CODE profile, MEDIA, YouTube and physical/local extensions are supplementary or deferred; none silently becomes a launch gate.
- GitHub's concurrency figure is a scheduling ceiling, not dedicated always-on machines or guaranteed capacity.
- If a capability cannot be delivered securely within the approved free/GitHub-hosted boundary, mark it BLOCKED. Do not invent a persistent service on an ephemeral runner or add paid infrastructure silently.

## 3. System topology and trust boundaries

```text
Owner / authenticated GitHub identity
              |
              v
       Jarvis Experience Plane
    static responsive PWA + GitHub UX
              |
              v
    Trusted Intake / Event Provenance
              |
              v
         Pool A0 Authority
 policy + issuer + subject + capability
 route qualification + quota admission
              |
              v
       Durable D1 State Boundary
 approval + task + attempt + outbox
 idempotency + lease + fencing + recovery
              |
              v
     Supervisor / Bounded Dispatcher
              |
              v
      Ephemeral Isolated Worker
 exact SHA + isolated worktree + minimal env
              |
              v
 Claude Code CLI -> ECC -> FCC loopback
              |
              v
    Qualified free provider route
              |
              v
 Patch / test evidence / digests / PR
              |
              v
      Independent A3 verification
              |
              v
       Jarvis status / owner decision
```

### 3.1 Jarvis experience and intelligence

- Jarvis is the only user-facing control surface, responsive on desktop and mobile.
- Initial hosting: static GitHub Pages if repository/account policy allows; task intake/status uses authenticated GitHub-native Issues, PRs, workflow runs and artifacts.
- The UI is a projection, never an authorization boundary. No privileged GitHub token, OAuth secret, provider key or execution credential may be embedded in browser assets, URLs, client storage, prompts or client-side API calls.
- Jarvis interprets intent, retrieves grounded context and proposes bounded plans. Model output is untrusted data, not authority.
- Planner cannot grant capabilities, modify policy, select arbitrary secrets, override quota, dispatch privileged jobs or self-certify results.
- A static site is not a durable authenticated backend. Any feature requiring an always-on backend is BLOCKED until an approved no-cost, secure persistence/control mechanism is qualified.

### 3.2 Trusted intake and A0

- Cloud Pool Issue #96 is the intended owner-only control surface unless a reviewed ADR changes it.
- Automated admission verifies repository ID, exact issue number, exact top-level comment body, owner identity/association, trusted default-branch controller and immutable target SHA.
- Source comment ID is the idempotency key. Reject replay, edited/deleted comments, PR comments, wrong issue, wrong author, untrusted refs and caller-supplied commands/prompts/workflow settings.
- A0 is the only authority for issuer, subject, capability, repository scope, route qualification, quota and policy decision.
- Missing, stale, revoked, ambiguous or unverifiable evidence fails closed before consuming approval or dispatching.

### 3.3 D1 durable state and dispatch

- Reuse existing D1 contracts; do not introduce a parallel task registry or second state machine.
- One transaction binds owner approval, target SHA, task identity, attempt, route qualification/evidence digest, quota reservation and exactly one outbox intent.
- Durable single-winner admission requires transactional conditional write, idempotency and read-back. GitHub labels, Actions concurrency or recent-run searches alone are not authoritative locks.
- Leases require monotonic fencing generations, expiry, renewal rules, owner identity and terminal transition constraints.
- Ambiguous dispatch outcomes must be reconciled against durable admission and child run IDs before retry. Never requeue merely because an API call timed out.
- Attempt ledger records immutable attempt ID, target SHA, worker identity, lease generation, start/end, outcome, usage and evidence references.
- Recovery must be bounded, idempotent and tested for crashes before/after admission, dispatch, execution and finalization.
- Actions artifacts/cache are not a system of record. Issues are human-visible projections, not transactional state.

### 3.4 Execution boundary

- First runtime: GitHub-hosted ephemeral Ubuntu runner; one task per isolated checkout/worktree/attempt.
- Verify exact immutable target SHA before execution. No two agents share a mutable worktree.
- Enforce allowlisted profile, tools, paths, commands, network destinations, runtime, resource budget and output schema.
- Default-deny filesystem and egress beyond the task envelope. No Docker socket, root, arbitrary workflow dispatch or ambient broad GitHub token.
- Worker identity binds task, attempt, target SHA, profile, lease/fencing generation and A0 policy decision.
- Mandatory timeout, cancellation, cleanup and terminal evidence. Never expose a persistent self-hosted runner to untrusted PR code.

### 3.5 Provider route and quota boundary

- FCC is the first-profile gateway and must bind loopback-only inside the trusted runner; never expose FCC admin endpoints publicly.
- A route is eligible only with immutable evidence binding provider, model, issuer, opaque account reference, credential-handle reference, quota-domain identity, cost class, capability profile, evidence digest, observation time, validity and revocation version.
- Secret presence/name is not evidence of account identity, route compatibility, free-tier status or remaining quota.
- Credentials are injected only after trusted A0 admission into a minimal trusted executor environment. Never put values in task envelopes, prompts, browser code, logs, caches, artifacts or issue comments.
- One credential reference maps to one provider account/quota domain. No account mixing, key cycling or silent fallback.
- Require explicit request/token/time caps, bounded retries, cooldown/reset handling and quota reserve/settle. Unknown route/quota means deny.
- Paid routes and paid fallback are hard-denied.
- FCC source inspection found that its child environment replaces inherited ANTHROPIC_* values but otherwise preserves most base environment variables. Production therefore requires a trusted minimal environment allowlist or separately qualified scrubber. The synthetic bridge test does not prove generic secret sanitization.

### 3.6 Evidence and A3 verification

- Each attempt records task/attempt IDs, target SHA, admission receipt, route qualification ID/digest, worker/runtime/tool versions, timestamps, policy decision, tests, exit code, artifact hashes, usage/quota outcome and terminal status.
- Artifacts contain bounded scrubbed evidence only; never credentials, full environment dumps, unrelated workspace contents or private data.
- Executor cannot self-certify. Independent A3 verifies provenance, scope, diff, tests, security and acceptance criteria.
- Missing run IDs, logs, artifacts, digests, review or source provenance means NOT VERIFIED, never inferred success.

## 4. First CODE executor contract

| Element | Normative requirement |
|---|---|
| Runner | Ephemeral GitHub-hosted Ubuntu |
| CLI | Pinned Claude Code CLI |
| Toolkit | ECC pinned commit; selected reviewed skills/rules/hooks only |
| Gateway | FCC pinned version, loopback only |
| Authentication | Qualified FCC API route; no Anthropic API auth |
| Route | One verified free route, account and quota domain |
| Fallback | None; paid fallback and key cycling denied |
| Retry | Explicit low bounded retry; quota consumption accounted |
| Environment | Minimal allowlist; unrelated inherited secrets denied |
| Workspace | Isolated attempt directory/worktree and exact target SHA |
| Permissions | Minimal file paths, commands, network and time |
| Output | Patch/branch/PR, test summary, provenance and digests |
| Verification | Independent A3 and exact-head CI |
| Cleanup | Process, listener, temporary credentials and workspace cleanup |

Second CODE profile is quota-gated and deferred. MEDIA is deferred until remote local video inference exists; it must be API-key-free and have no external API fallback. Codex and Gemini are optional supplementary profiles. No physical server is a first-release dependency.

## 5. Jarvis UI and later workspace

- Initial UI: static responsive PWA with authenticated GitHub-native task/status workflow, approval prompts, run/PR/artifact links and evidence display.
- No privileged client-side secrets. All privileged actions pass through A0.
- The persistent Engineering Workspace is part of the final Contour A acceptance target, but it is staged after the first secure CODE executor and integrated A0/D1 gates. It is not a prerequisite for the first GitHub-hosted ephemeral runner smoke.
- Target workspace: one authoritative filesystem exposed to official VS Code Desktop via Remote SSH and browser code-server/Open VSX behind Cloudflare Access/Tunnel. Jarvis remains the only user-facing control plane; workspace IDEs are execution surfaces, not alternate authorities.
- Browser and desktop clients attach to the same filesystem. Every task/agent gets a separate branch/worktree and single-writer lease with expiry and monotonic fencing; concurrent writes to one worktree are prohibited.
- Server #3 is NOT RUN until exact SentinelX identity, authorization, capabilities, resources, persistent storage, network, allowlist and free-cost boundary are verified. The workspace integration record currently reports no qualified active server #3.
- Cloudflare is BLOCKED until zone, Tunnel, Access IdP/policy, origin JWT validation, WebSocket path and cost ceiling are qualified. Do not expose raw SSH, code-server or model endpoints publicly.
- Claude Code on server #3 is distinct from GitHub-hosted installation evidence and requires its own host, free-route and quota qualification.
- Workspace acceptance includes phone/desktop authentication, shared filesystem, Git, SSH, WebSockets, lease/fencing, isolation, restart, encrypted backup/restore, audit and independent A3 evidence.

## 6. Optional profile registry

- Claude Code + ECC + FCC: first priority.
- Gemini: optional supplementary workers only through a qualified Cloud Pool-native controller. Issues #94/#96 are control requirements, not evidence of a qualified controller or live dispatch.
- Codex CLI: optional after runner resource, auth and route qualification.
- Aider, Goose, OpenHands, mini-SWE-agent, browser automation, Playwright, research and document ingestion are candidates, not global preinstalls. Qualify each profile separately.
- Bound fan-out by concurrency, quota, cost, priority and independent reviewer capacity. Never dispatch merely to fill slots.

## 7. Data, memory and persistence

- Git is authoritative for source code, accepted architecture, ADRs, contracts and reviewed runbooks.
- A qualified transactional store is authoritative for approvals, task state, attempts, leases, quota reservations, outbox and reconciliation. Exact backend must pass atomicity, identity, recovery, free-tier and governance qualification.
- GitHub Issues/PRs are human-facing projections and references. Actions artifacts are bounded evidence with retention; cache is optimization only.
- Workspace files are mutable until committed and reviewed. Vector indexes are derived retrieval data, never authority.
- Memory records require source, timestamp, confidence, access scope, retention and deletion policy. Retrieved content is untrusted input.
- Backups require encrypted independent target and tested restore. One disk or one artifact is not resilient persistence.

## 8. Network, secrets and resource policy

- Default-deny egress; allow only GitHub APIs and the exact qualified provider endpoint required for the task.
- No public FCC admin, Ollama or internal service endpoint.
- Third-party Actions pinned to full commit SHAs; permissions declared per job with least privilege.
- The allowlist wrapper is a child-process boundary only. It does not scrub the runner host, unrelated FCC processes, files, inherited file descriptors or the whole workflow environment.
- Production PATH must be constructed only from trusted pinned directories whose ownership and integrity are verified; absolute/non-empty path validation alone is insufficient. HOME/XDG configuration locations must be reviewed for unintended credentials and writable-path attacks.
- The current synthetic bridge is not an egress firewall. Production execution requires an independently verified network egress policy that permits only GitHub control endpoints and the qualified provider route.
- The official Claude installer is version-pinned but its downloaded installer-script bytes are not currently hash-pinned. Production qualification requires an integrity-pinned installer or equivalent independently verifiable supply-chain evidence.
- Prefer GitHub App short-lived installation tokens and OIDC federation where supported; avoid broad long-lived PATs.
- Separate credentials by provider account, task audience and execution profile. Untrusted PRs receive no provider credentials or privileged tokens.
- GitHub hosted concurrency is a ceiling, not reserved capacity. Begin with one executor until route/quota evidence supports parallelism.
- Reserve capacity for tests/security/A3; use explicit timeout, cancellation, disk and memory guardrails. Do not download large model weights to hosted runners.

## 9. Operational lifecycle

1. Owner submits a request through Jarvis.
2. Planner proposes a bounded plan; owner confirms when needed.
3. Trusted intake verifies owner/event/repository and pins target SHA.
4. A0 verifies issuer, subject, capability, route qualification, quota and policy.
5. D1 atomically consumes single-use approval and records task, attempt and outbox.
6. Scheduler obtains fenced lease and dispatches one allowlisted worker.
7. Worker validates bindings, checks out exact SHA, prepares minimal environment and executes.
8. Worker emits scrubbed evidence, digests and terminal status.
9. Supervisor reconciles run state and handles ambiguous outcomes without duplicate execution.
10. Independent A3 verifies provenance, patch, tests, policy and acceptance criteria.
11. Jarvis projects status and requests owner acceptance.
12. Cleanup and retention run; unresolved tasks remain visible and recoverable.

## 10. Release gates

**Gate A — architecture/governance:** canonical docs, owner decisions, exact refs, active ruleset, formal review and required checks.

**Gate B — first runtime:** reproducible pinned Claude/ECC/FCC install; loopback startup/health/shutdown; synthetic bridge; minimal environment allowlist and negative leak tests.

**Gate C — provider route/quota:** verified Claude Code compatibility, provider/account/free-tier/quota evidence, reserve/settle, cooldown, bounded retries, no paid fallback or key cycling.

**Gate D — A0/D1 execution authority:** trusted owner event, atomic single-use admission, immutable SHA/idempotency, durable lease/fencing/recovery/outbox, worker identity, cancellation and adversarial replay/race/crash tests.

**Gate E — Jarvis experience:** responsive desktop/mobile UI, authenticated task/status/PR/run/artifact navigation, no client secrets, all privileged actions via A0, free-cost model verified.

**Gate F — end-to-end acceptance:** one bounded real CODE task via verified free route, patch and provenance bound to SHA, exact-head CI, independent A3 review, durable state recovery and formal ACCEPTED record.

Installation smoke, mock bridge, static UI or successful CI alone never constitutes Contour A acceptance.

## 11. Current evidence and status — 2026-11-17

| Capability | Evidence | Status |
|---|---|---|
| Claude Code + ECC + FCC install | Earlier exact-head runner installation proof | VERIFIED — install only |
| FCC loopback runtime | Readiness, loopback listener and clean shutdown CI | VERIFIED — runtime only |
| FCC → Claude CLI | Synthetic mock-only bridge exact-head CI | VERIFIED — synthetic only |
| Child environment allowlist | `scripts/cloud_pool/exec_allowlist.py` added on PR #116; unit tests and synthetic FCC server/launcher handoff pass with synthetic GitHub/provider credentials present only in parent test shell | VERIFIED — synthetic boundary only; production integration/review NOT VERIFIED |
| Real free provider route | No provider call or quota proof | NOT VERIFIED |
| Integrated production A0/D1 | Isolated proofs/contracts; not fully integrated/hosted | NOT VERIFIED |
| Durable lease/fencing/recovery | Design and partial isolated proofs; backend not qualified | NOT VERIFIED |
| Real model task | No real task through qualified route | NOT RUN |
| Jarvis PWA | Draft UI/prototypes; not deployed/authenticated end-to-end | NOT VERIFIED |
| Persistent workspace/server #3 | Host/Cloudflare prerequisites absent | BLOCKED / NOT RUN |
| Gemini controller | Candidate/issues; no qualified default-branch controller | NOT QUALIFIED / NOT RUN |
| Independent acceptance | No complete end-to-end evidence package | NOT ACCEPTED |

## 12. Implementation order — do not reopen architecture routinely

1. Implemented and synthetic-tested `scripts/cloud_pool/exec_allowlist.py` on PR #116. Production route admission, real task use and independent review remain open; do not mark production credential isolation QUALIFIED until those gates pass.
2. Qualify one free FCC provider route and account/quota evidence without secret reads.
3. Complete integrated A0/D1 admission, durable lease/fencing, worker identity and recovery.
4. Integrate first Claude Code task worker with exact SHA, minimal environment and no paid fallback.
5. Deliver static GitHub-hosted Jarvis PWA and authenticated GitHub-native task/status flow.
6. Complete bounded end-to-end task, cancellation/recovery, A3 verification and Contour A acceptance.
7. After first CODE and A0/D1 gates, qualify and deliver the persistent Engineering Workspace/server #3, Cloudflare Access/Tunnel, shared filesystem, leases/fencing and backup/restore as required final Contour A scope. Then complete end-to-end A3 review and formally ACCEPT Contour A. Only after that may Contour B begin; Gemini, Codex and MEDIA remain separately gated supplementary profiles.

Routine /next passes execute this order. Architecture selection is closed unless a test, security finding or acceptance failure proves a bounded correction is required.

## 13. Normative linked documents

- Owner decision freeze: [CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md](CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- Implementation roadmap: [CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md)
- Historical component catalogue (subordinate): [JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md](JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- Workspace extension: [CLOUD-POOL-ENGINEERING-WORKSPACE-INTEGRATION-2026-11-17.md](CLOUD-POOL-ENGINEERING-WORKSPACE-INTEGRATION-2026-11-17.md)
- Qualified route/A0-D1: [QUALIFIED-ROUTE-EVIDENCE-AND-ATOMIC-A0-D1-ADMISSION.md](../contracts/QUALIFIED-ROUTE-EVIDENCE-AND-ATOMIC-A0-D1-ADMISSION.md)
- Supervisor/recovery: [GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md](GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)
- Durable claim ADR: [2026-11-11-durable-supervisor-claim-protocol.md](../decisions/2026-11-11-durable-supervisor-claim-protocol.md)
- Gemini control requirements: [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94), [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- First executor: [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- Synthetic bridge report: [2026-11-17 report](../reports/2026-11-17-next-pass-synthetic-fcc-claude-bridge.md)
- Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## 14. Acceptance statement

This is a normative architecture baseline, not a deployment certificate. Architecture review, security review, exact-head CI, owner acceptance and Contour A end-to-end acceptance are separate. Until the document is reviewed and merged to default and all release gates pass, status remains NOT ACCEPTED.

## 15. Normative amendment — integrated Engineering Workspace target (2026-11-17)

**Authority:** This section incorporates the owner-requested Engineering Workspace design in `CLOUD-POOL-ENGINEERING-WORKSPACE-INTEGRATION-2026-11-17.md`. It supersedes conflicting earlier wording in Sections 5, 10 and 12 that classified the workspace as merely optional or outside final Contour A. It does not claim infrastructure exists, authorize premature installation, or weaken A0/D1, quota, runner or security gates.

### 15.1 Three-plane target

Contour A has one product/control surface and three cooperating planes, not multiple competing interfaces:
1. **Jarvis Control Plane:** sole responsive phone/desktop web UI for projects, task intake, approvals, agents, status, logs/evidence, workspace links, quotas, audit and recovery. Browser UI is a projection, never an authorization boundary.
2. **Engineering Workspace Plane:** one persistent authoritative filesystem. Official VS Code Desktop connects through Remote SSH. Browser IDE uses code-server/Open VSX behind Cloudflare Access/Tunnel, after qualification. Both attach to the same host/filesystem; no divergent sync copies.
3. **Agent Execution Plane:** isolated task attempts pinned to exact target SHA, separate branches/worktrees, least-privilege credentials, policy-bound executors and independent verification. Initial GitHub-hosted ephemeral Claude Code + ECC + FCC remains the first execution slice; an Actions runner is not a persistent server.

### 15.2 Canonical access paths and component decisions

- Mobile/desktop browser: authenticated Cloudflare Access → Tunnel → Jarvis and, when qualified, browser IDE. No public origin ports.
- Desktop engineering: official VS Code Desktop → SSH using client-side cloudflared/Access where supported → verified remote SSH host → same persistent workspace. Verify SSH host keys; never expose public SSH.
- VS Code Remote Tunnels is a separately reviewed alternative transport, not a synonym for Cloudflare Tunnel and introduces Microsoft dev-tunnels as another trust dependency.
- code-server binds loopback behind the tunnel and retains built-in authentication unless a reviewed origin-auth/JWT design demonstrably replaces it. Use Open VSX. Do not substitute Microsoft Marketplace or bypass its terms.
- Coder Workspace Platform is deferred unless measured workspace lifecycle/multi-user needs justify its added provisioner/control plane. Do not deploy competing workspace managers.
- Jarvis links to the existing workspace and tasks; it must not create a second Jarvis or bypass A0.

### 15.3 Filesystem consistency, worktrees and concurrency

- One authoritative filesystem per qualified workspace identity; browser and desktop are clients of the same workspace, not separate copies.
- Every task/agent receives a distinct branch and Git worktree/attempt directory pinned to immutable repository SHA.
- Every mutable worktree requires a single-writer lease with owner, task/attempt ID, expiry, monotonic fencing generation and renewal/release semantics. Jarvis/workspace broker must reject stale fencing generations.
- Other clients may use another worktree or read-only access; concurrent writes to the same worktree are prohibited. Advisory filesystem locks alone are insufficient unless crash recovery and fencing are proven.
- Disconnect, crash, expiry and stale-writer recovery must be tested. Git remains source of truth for committed code; workspace files are mutable until committed and reviewed.

### 15.4 Executor placement and identity

- Initial CODE qualification remains Claude Code CLI → pinned ECC → loopback FCC → one independently qualified free route, first on GitHub-hosted ephemeral runners. Do not move this executor to server #3 without separate ADR and host/route/security qualification.
- Server #3 is a future interactive/optional executor host only after exact SentinelX host ID, authorization, capabilities, OS, CPU/RAM/disk, persistent storage, network, allowlist and cost ceiling are verified. Current inventory does not prove it exists or is available.
- Claude Code on server #3 is NOT RUN until host identity and a permitted free route are independently verified. GitHub-hosted installation smoke is not evidence of server #3 installation.
- Gemini remains exclusively behind the approved Cloud Pool controller `.github/workflows/gemini-batch-dispatch-controller.yml`, with all input/security/governance gates. No direct IDE/terminal dispatch, no Gemini on server #3, no cross-account quota mixing. If controller is absent/unqualified on trusted default, dispatch remains NOT RUN and `POOL_DISPATCH_ENABLED=false`.
- Copilot is optional only after actual entitlement, free allowance, extension compatibility and spend controls are verified. No paid fallback or automatic metered upgrade.
- Claude CLI, Claude VS Code Agent Harness and Copilot cloud partner-agent sessions are distinct execution/authentication routes; do not infer shared sessions, identities or quotas.

### 15.5 Security, persistence and operations

- Cloudflare Access is perimeter authentication, not application authorization. Validate JWT signature, issuer, audience, expiry and subject at origin, then enforce Jarvis/A0 capabilities.
- Preserve code-server authentication and loopback binding until a reviewed replacement is proven. Qualify WebSocket upgrades, CSRF/session boundaries, origin routing and rate limits.
- SSH private keys remain client-side; verify host keys. Do not expose raw SSH, FCC admin, Ollama or model endpoints publicly.
- Workspace files, task state, audit records, credentials and backups are separate security domains. Backups must be encrypted, independent and restore-tested.
- GitHub is authoritative for code, architecture, ADRs and accepted runbooks; qualified transactional D1 is authoritative for approvals, tasks, attempts, leases, quotas and outbox. Labels/Actions concurrency are not transactional locks.
- Monitor host health, disk, memory, CPU, sessions, leases, quota, backup, tunnel and audit. Provide restart, cleanup, rollback and recovery runbooks.

### 15.6 Staged delivery and Contour A acceptance

Engineering Workspace is part of the final Contour A target, but must not destabilize or bypass first secure CODE/A0/D1 qualification:
A. Complete first CODE path and integrated A0/D1 security/authority gates.  
B. Qualify persistent host identity and free resource envelope; otherwise workspace deployment is BLOCKED, not simulated.  
C. Qualify domain, Cloudflare Tunnel, Access IdP/policies, origin JWT validation, WebSockets and no-cost limits.  
D. Approve persistence, backup/restore, workspace lease/fencing and threat model before installation.  
E. Install/qualify code-server and official VS Code Remote SSH on the same authoritative workspace; verify mobile/desktop, Git, single-writer leases, isolation, restart and restore.  
F. Qualify Claude Code on server #3 only if separately approved; Gemini only via approved controller; Copilot remains optional.  
G. Integrate workspace links/status into Jarvis and complete independent A3 review.

Final Contour A acceptance covers secure core execution/control plane and owner-approved workspace experience: authenticated Jarvis on phone/desktop, verified workspace access, executor routing/identity, durable state, quota isolation, audit, recovery, secret non-disclosure and independent security review. Missing server, tunnel, route or restore proof blocks its gate; it is never represented as complete.

### 15.7 Known blockers and evidence boundary

Detailed comparison and inventory remain in the [Engineering Workspace Integration Record](CLOUD-POOL-ENGINEERING-WORKSPACE-INTEGRATION-2026-11-17.md) and [Issue #118](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118). The recorded inventory is zero active SentinelX hosts, no confirmed/authorized server #3, zero Cloudflare zones/tunnels, Access unavailable in inspected account context, and no verified persistent workspace/backup/restore. These are BLOCKED/NOT VERIFIED prerequisites.

This amendment is documentation-only: no installation, deployment, secret read, provider call, Gemini dispatch or merge. Contour A remains NOT ACCEPTED; Contour B remains DEFERRED.
