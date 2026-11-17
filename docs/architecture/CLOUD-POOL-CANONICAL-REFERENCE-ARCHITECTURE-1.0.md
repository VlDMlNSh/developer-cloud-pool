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
- Persistent engineering workspace, VS Code Remote SSH, code-server/Open VSX, Cloudflare Tunnel/Access and server #3 are later optional extensions, not initial dependencies.
- Current inventory recorded in the workspace integration record: no qualified active server #3, no Cloudflare zone/tunnel and Access not enabled. Do not claim deployment until fresh inventory and qualification evidence exists.
- If later authorized: one authoritative filesystem; browser IDE and desktop VS Code attach to the same host; separate branch/worktree per attempt; code-server authentication retained and loopback-bound; SSH host keys verified; Cloudflare JWT verified at origin; internal A0 capabilities still enforced; no public SSH or raw model endpoint.

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
| Generic child environment sanitization | FCC preserves most base environment; no production allowlist | NOT VERIFIED / BLOCKER |
| Real free provider route | No provider call or quota proof | NOT VERIFIED |
| Integrated production A0/D1 | Isolated proofs/contracts; not fully integrated/hosted | NOT VERIFIED |
| Durable lease/fencing/recovery | Design and partial isolated proofs; backend not qualified | NOT VERIFIED |
| Real model task | No real task through qualified route | NOT RUN |
| Jarvis PWA | Draft UI/prototypes; not deployed/authenticated end-to-end | NOT VERIFIED |
| Persistent workspace/server #3 | Host/Cloudflare prerequisites absent | BLOCKED / NOT RUN |
| Gemini controller | Candidate/issues; no qualified default-branch controller | NOT QUALIFIED / NOT RUN |
| Independent acceptance | No complete end-to-end evidence package | NOT ACCEPTED |

## 12. Implementation order — do not reopen architecture routinely

1. Implement and test minimal FCC child environment allowlist.
2. Qualify one free FCC provider route and account/quota evidence without secret reads.
3. Complete integrated A0/D1 admission, durable lease/fencing, worker identity and recovery.
4. Integrate first Claude Code task worker with exact SHA, minimal environment and no paid fallback.
5. Deliver static GitHub-hosted Jarvis PWA and authenticated GitHub-native task/status flow.
6. Complete bounded end-to-end task, cancellation/recovery, A3 verification and Contour A acceptance.
7. Only after Contour A ACCEPTED: optional workspace/server #3, Gemini, Codex, MEDIA and Contour B in separate gates.

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