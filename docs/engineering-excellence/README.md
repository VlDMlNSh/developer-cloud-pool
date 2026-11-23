# Cloud Pool Engineering Excellence 1.0

- Status: **DOCUMENTATION POLICY / PROPOSED FOR REVIEW / NOT RUNTIME IMPLEMENTED**
- Date: 2026-11-23
- Scope: Contour A only. Contour B remains deferred until Contour A is formally ACCEPTED.
- Baseline: default branch `Основной` at `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; this documentation branch is additive and unmerged.

## Purpose

Make each engineering pass faster to resume, smaller to review, easier to verify, and less likely to repeat prior work. This package adds process policy and navigation; it does not claim that telemetry, automation, agents, hosted services, or acceptance gates have been deployed.

## Canonical ownership and no-duplication rules

| Information | Canonical home | Do not duplicate |
|---|---|---|
| Current project state, refs, blockers, evidence pointers | [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md) | Do not create a competing status dashboard in reports |
| One-pass objective, target SHA, DoD and result | [Pass Protocol](ENGINEERING-PASS-PROTOCOL.md) + dated report | Do not repeat full pass history in this package |
| Acceptance gates and proof requirements | [Acceptance Matrix](ACCEPTANCE-CRITERIA-MATRIX.md) | Do not redefine gates in every issue |
| Dependencies and critical path | [Dependency & Critical Path](DEPENDENCY-AND-CRITICAL-PATH.md) | Do not maintain another hand-edited task roadmap |
| Metric definitions and time accounting | [Metrics & Time Accounting](METRICS-AND-TIME-ACCOUNTING.md) | Reports record observations, not new definitions |
| Component research | [Reuse First Register](REUSE-FIRST-REGISTER.md) | Do not treat candidates as approved dependencies |
| Agent roles and security qualification | [Agent & Security Qualification](AGENT-AND-SECURITY-QUALIFICATION.md) | Do not restate secret/controller contracts in each pass |
| Learning loop | [Engineering Intelligence](ENGINEERING-INTELLIGENCE.md) | Do not treat heuristic suggestions as authority |

Existing architecture, decision, contract, issue, PR, checkpoint and pass-report documents remain authoritative in their own domains. This package links to them and defines how to use them; it does not supersede them.

## Control Center

The operational control loop and dashboard minimum are defined in [ENGINEERING-MASTER-CONTROL.md](ENGINEERING-MASTER-CONTROL.md). This README is the package index and document-ownership map; the Master Control Center is the operating procedure. The [Context Window](../context/GITHUB-CONTEXT-WINDOW.md) remains the sole live recovery source.

## Operating model

1. Restore live GitHub state first; historical context is a lead, never a substitute for current refs.
2. Select one bounded pass on the current critical path.
3. Research mature reusable projects before custom implementation.
4. Freeze target SHA, scope, constraints, tests and acceptance evidence.
5. Implement only the approved bounded change; preserve fail-closed behavior.
6. Verify exact resulting commit/PR merge-result checks and inspect test logs.
7. Update the dated report and Context Window; record measured metrics only.
8. Keep draft/unmerged status and Contour A acceptance blockers explicit.

## Initial adoption status

- Documentation policy: **PROPOSED** on this branch.
- Metrics collection/automation: **NOT IMPLEMENTED**.
- Dependency graph automation: **NOT IMPLEMENTED**; first version is manually evidenced.
- Agent dispatch: governed by the existing controller only; no dispatch authorized by this document.
- Security qualification: policy defined; runtime qualification remains separate.
- Engineering Intelligence: analysis process defined; no autonomous write/dispatch authority.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## Versioning

Changes to metric definitions, DoD, acceptance gates, agent authority or security policy require a dated rationale and review. Historical pass reports are immutable evidence; corrections are additive and must identify the superseded statement rather than silently rewriting history.
