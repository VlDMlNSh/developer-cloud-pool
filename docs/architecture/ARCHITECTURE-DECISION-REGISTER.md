# Architecture Decision Register — Developer Cloud Pool

Snapshot: 2026-11-14  
Status: Binding project constraints and accepted direction.  
Project: VlDMlNSh/developer-cloud-pool

This register records decisions that must survive chat changes. A proposal is not an accepted decision unless marked ACCEPTED. A test result does not by itself change an architecture decision.

## Accepted decisions

### ADR-001 — Separate Developer Cloud Pool from MediaHub OS

Status: ACCEPTED  
Decision: Developer Cloud Pool is an independent project and repository. MediaHub OS remains separate.  
Rationale: Different product boundary, lifecycle, control plane and qualification.  
Allowed reuse: A pattern or component may be reused only after independent review of code, license, security, integration and operational fit. Shared credentials, queues, workers or authoritative state are not implied.

### ADR-002 — A0 admission authority and A3 independent verifier

Status: ACCEPTED  
Decision: A0 is the admission/control authority. A3 independently verifies outputs and evidence.  
Rationale: Admission and acceptance must not be self-certified by the same execution actor.  
Consequence: Keep A3 as an explicit qualification gate; do not omit it from architecture, test matrices or roadmap.

### ADR-003 — Durable ledger is authoritative; GitHub Issues are not a transactional queue

Status: ACCEPTED  
Decision: GitHub Issues may provide intake and human-visible audit projection, but may not be treated as atomic lease/lock authority.  
Rationale: Labels and issue-body read-modify-write operations do not provide compare-and-swap, generation fencing or transactional retry state.  
Consequence: Task/attempt/lease/outbox authority belongs in a durable transactional ledger. GitHub projection must be derived from ledger events and reconciled with read-back.

### ADR-004 — Immutable identity and generation fencing

Status: ACCEPTED  
Decision: Execution authorization and state transitions must bind immutable task ID, attempt ID, target SHA, profile, tenant and current lease generation/owner.  
Rationale: Prevent stale actors and ambiguous retries from mutating a newer execution.  
Consequence: A stale worker must update zero rows and be denied. Lease expiry alone does not prove the prior executor stopped.

### ADR-005 — Single-use, owner-verifiable approval

Status: ACCEPTED  
Decision: Owner approval must be authenticated, single-use and cryptographically/authoritatively bound to the exact task tuple and allowlisted profile.  
Rationale: Issue labels or untrusted body text are not self-authenticating owner approval.  
Consequence: Missing, invalid, replayed, expired or mismatched approval fails closed. The current A0 contract tests use injected mocks and do not qualify the real authority.

### ADR-006 — Free quota and local-only initial provider policy

Status: ACCEPTED  
Decision: Initial allowed cost classes are free_quota and local. Unknown or paid routes fail closed.
Specific constraints:
- Claude: Free Claude Code route only; no Anthropic API key, API or billing.
- Gemini/DeepSeek and other providers: official free routes/quotas only, with verified quota-domain evidence.
- Ollama/Llama: local route only, once the local profile is measured and qualified.
- OpenAI API: deferred until separate explicit owner approval.
- No paid fallback and no quota evasion through account/key rotation.
Consequence: Exhausted or unverified quota means queue/deny, not hidden substitution.

### ADR-007 — Secrets and credential boundaries

Status: ACCEPTED  
Decision: Secret values remain in GitHub Secrets or separately qualified credential references.  
Consequence: Never read or print values for convenience; never put values in source, logs, matrices, task payloads or handoff docs. Non-secret identifiers may be recorded only when useful and safe.

### ADR-008 — Cloud-first, ephemeral execution; no assumed capacity

Status: ACCEPTED  
Decision: GitHub-hosted runners are the initial evaluation substrate. Capacity is ephemeral, account-wide and not reserved.  
Consequence: Runner observations do not prove guaranteed concurrency, persistent workers, multi-agent packing or production capacity. Measure pinned profiles before admitting capacity.

### ADR-009 — No dispatch or production side effects without separate approval

Status: ACCEPTED  
Decision: Keep POOL_DISPATCH_ENABLED=false and all real worker/provider execution disabled during current proof work.  
Consequence: All local proof adapters must return dispatch:false. Do not merge, deploy, provision hosted services, call providers or trigger live writes without explicit authorization.

### ADR-010 — Reuse mature components; avoid unnecessary custom infrastructure

Status: ACCEPTED  
Decision: Prefer maintained, license-compatible, security-reviewed GitHub projects and components where they meet the contract.  
Consequence: Evaluate maintenance, license, threat model, resource footprint, CI and integration boundaries before adoption. Do not install every agent stack in every runner.

### ADR-011 — Jarvis is a later operator interface, not a trust boundary

Status: ACCEPTED  
Decision: Jarvis is the remote web/mobile operator experience for task intake, approvals, progress and artifacts. Backend authorization remains authoritative.  
Consequence: Browser UI state cannot authorize execution; every privileged operation must be re-authorized server-side.

## Current implementation status — not decisions

- PR #67 contains a local Workers-runtime D1 ledger proof and an isolated A0 admission contract harness.
- PR #67 exact head at this snapshot: a53f6232bd5b50d3e150addf528b8e722002f9dd; open Draft, not merged.
- PR #68 contains architecture consolidation and qualification documentation.
- PR #68 exact head at this snapshot: 96e6821993858d8741bced6861f575296e81aaa2; open Draft, not merged.
- Neither PR is production qualification. The A0 contract is not integrated into Supervisor/Worker or backed by production cryptographic authority.
- Dispatch remains disabled.

## Change control

Any change to an accepted decision requires:
1. explicit owner approval;
2. a written rationale and impact analysis;
3. security/cost/operational review;
4. an updated qualification gate and tests;
5. a dated session-log entry.

Do not silently weaken or reinterpret these decisions in a later chat.
