# Jarvis Multi-Layer Agent Organization Roadmap

- Status: PLANNED / STRATEGIC ARCHITECTURE / NOT IMPLEMENTED
- Date: 2026-11-24
- Tracking: [Issue #173](https://github.com/VlDMlNSh/developer-cloud-pool/issues/173)
- Hard priority: Cloud Development Pool Contour A ACCEPTANCE before Contour B.

## Purpose

Evolve Jarvis from a multi-agent system into a governed AI Corporation and, later, an interoperable agentic ecosystem. Preserve stable interfaces and governance boundaries so each level can be added incrementally without granting agents unrestricted authority.

## Level 1 — Multi-Agent System

**Jarvis orchestration layer**
- User interaction, intent decomposition, planning, policy checks, task ledger, scheduler, observability and human escalation.
- Jarvis coordinates agents; it is not automatically the most privileged executor.

**Claude Code engineering execution layer**
- Claude Code is the primary candidate engineering-agent runtime.
- ECC is a required named component of the owner-approved Claude Code toolchain and must remain explicit in architecture, task profiles and qualification matrices.
- Preserve the proposed lineage: local model / inference adapter → FCC → Claude Code → ECC.
- FCC is the proposed authorization/compatibility component. Its exact identity and supported Claude Code authentication semantics are not yet verified.
- ECC exact source, product identity, license, version, security posture, permissions and integration contract are not yet verified. Do not guess or replace it with an assumed equivalent.
- Claude Code auth, provider inference and GitHub permissions are separate trust domains. A free provider API or local model is not automatically a valid Claude Code auth route.
- Specialist agents: architecture/research, engineering, verification/testing, security/provenance, documentation, browser automation, data and media.
- All agents operate under task-scoped capabilities, expiring leases, resource limits, durable checkpoints and independent verification.

**Compute topology**
- Cloud Development Pool: GitHub Actions ephemeral jobs, up to verified plan concurrency; automatic slot refill is scheduler behavior, not guaranteed instant VM provisioning.
- Cloud control plane: permanent UI/API, scheduler, model gateway, quota ledger, durable task state, checkpoint store, audit and recovery.
- Mac mini Server 2011 (owner-reported i7/16 GB): candidate low-intensity connector, metadata indexing, cache/backup helper after OS, disk, network and security qualification.
- Mac mini 2018 i3 (planned 32 GB): candidate local worker, document/indexing, development/test and small local inference after qualification.
- Remote powerful video server: future isolated media plane for storage, transcoding, indexing and accelerator-backed inference. Not a privileged control plane.
- Microsoft Visual Studio Code: human operator/admin workbench for repository review, diagnostics and approved remote-node administration. It is not the scheduler, identity provider, persistent state authority or agent runtime.
- Local models and free provider APIs are inference endpoints behind account-isolated routing and quotas. No paid fallback or quota evasion.

## Level 2 — AI Corporation

Introduce organization-level abstractions only after Level 1 is qualified and Contour A accepted:
- Departments: Engineering, QA/Verification, Security, Research, Operations, Documentation, Data and Media.
- Roles: Jarvis/Chief Coordinator, department lead, task planner, executor, reviewer, auditor and human owner.
- Organization-wide task intake, portfolio planning, dependencies, service objectives, escalation and incident response.
- Budget/quota envelopes per department, provider account and task class.
- Organizational knowledge/memory with provenance, retention, access control and correction workflows.
- Measured performance based on independently verified outcomes, reliability, quality, latency and quota efficiency.
- Human approval for production, external commitments, legal/financial decisions, identity/governance changes and irreversible actions.

AI Corporation describes an operational organizational model; it does not imply a legal corporate person or unrestricted autonomous authority.

## Level 3 — Agentic Ecosystem / Agent Economy

Long-term research direction, not current implementation:
- Multiple independently governed agent organizations.
- Authenticated capability/service registry and discovery.
- Delegation between organizations through explicit task contracts, budgets, data classifications and acceptance criteria.
- Provenance-backed outputs, independent verification, reputation/trust signals and incident/dispute handling.
- Policy-controlled resource exchange; economic mechanisms only after legal, security and human approval review.
- Federation without shared root credentials or implicit trust.

There is no single universally accepted name or settled standard for this level. "Agentic ecosystem", "agent economy", "multi-agent federation" and "network of AI organizations" are descriptive candidate terms. Select terminology and components only after a Reuse First standards review.

## Stable contracts across all levels

1. Agent identity and provenance.
2. Role and capability manifest.
3. Immutable task envelope and data classification.
4. Policy decision and human-approval requirement.
5. Provider/account-scoped quota reservation.
6. Lease, fencing generation and idempotency key.
7. Durable checkpoint and artifact digest.
8. Append-only audit events and redacted logs.
9. Independent verification and acceptance result.
10. Revocation, incident response and recovery contract.

Higher-level agents do not inherit broader permissions by default. Organization membership is not a credential. Discovery is not authorization.

## Progression gates

| Transition | Required evidence |
|---|---|
| Level 1 design → qualified multi-agent system | Verified runtime/auth, ECC/FCC contracts, executor identity, isolated execution, durable state, quota enforcement, recovery, audit, independent tests |
| Contour A → ACCEPTED | Working phone/desktop UI, qualified executors/routing, persistent state, quotas, isolation, security/governance gates, audit and independent acceptance |
| Level 1 → Level 2 AI Corporation | Stable role/dept contracts, measured operational reliability, human approval model, budget/quota controls, incident management and auditable organizational memory |
| Level 2 → Level 3 ecosystem | Federation identity/trust, inter-org contracts, data boundaries, provenance, dispute handling, legal review and explicit owner approval |

## Sequencing constraints

- Current work remains Contour A Cloud Development Pool only.
- Contour B MediaHub product work remains deferred until Contour A is ACCEPTED.
- It is permitted to record strategic architecture and extension points; it is not permission to begin implementation of later contours.
- No production deployment, paid service, external financial transaction, legal commitment, self-modifying governance or uncontrolled autonomous operation without explicit human authorization.
- Each /next pass must choose one bounded Contour A task, preserve ECC in the execution architecture and update Context Window/checkpoint.

## Related design

- Claude Code + runner lifecycle: [CLAUDE-CODE-RUNNER-LIFECYCLE-AND-HYBRID-EXECUTION.md](CLAUDE-CODE-RUNNER-LIFECYCLE-AND-HYBRID-EXECUTION.md)
- 20-runner architecture: [CLOUD-POOL-20-RUNNER-ARCHITECTURE.md](CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- Hybrid platform: [JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md](JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- Strategic tracking: [Issue #173](https://github.com/VlDMlNSh/developer-cloud-pool/issues/173)
