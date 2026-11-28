# Continuous Improvement Review Cadence — Contour A

- Status: **OWNER-APPROVED PROCESS; DOCUMENTATION CHANGE IN REVIEW**
- Effective date: 2026-11-24
- Scope: Cloud Development Pool / Contour A only.
- Authority: advisory analysis may recommend work; normal repository governance authorizes code, merge, dispatch and deployment.
- Contour B remains prohibited until Contour A is formally ACCEPTED.

## Purpose

Turn periodic architecture discussions into a repeatable engineering feedback loop. Each accepted recommendation must become one of: a bounded implementation task, a documented decision, a deferred candidate with an explicit trigger, or a rejected option with evidence. Conversation agreement is not proof of implementation.

## Review cadence

Run a structured improvement review:
- after every **3–5 completed /next passes**, or
- once per **7 calendar days** during active development,
- and immediately after a material security finding, repeated regression, critical-path change or failed integration.

A review is a decision checkpoint, not a reason to interrupt a high-priority critical-path fix. If no meaningful evidence changed, record “no change” rather than inventing recommendations.

## Required review agenda

1. **Progress and critical path:** compare current verified evidence with Contour A acceptance criteria; identify the single highest-leverage blocker.
2. **Quality:** review exact-head CI, first-pass success, regression/rework causes, test gaps and review findings.
3. **Architecture:** check trust boundaries, identity, event provenance, durable state, leases/fencing, recovery, quotas, UI and audit.
4. **Reuse First:** search maintained OSS projects and platform-native capabilities before building; assess license, maintenance, security, compatibility, free-tier cost, permissions and rollback.
5. **Efficiency:** separate active work, test runtime, CI queue/runtime, external wait and rework. Do not turn estimates into measured facts.
6. **Security/governance:** verify least privilege, action pinning, secret isolation, provenance, branch/ruleset enforcement and fail-closed behavior.
7. **Decision:** select at most one primary process experiment and one bounded engineering follow-up; state expected benefit and measurable exit criteria.

## Recommendation lifecycle

Each recommendation receives:
- unique reference and date;
- problem/evidence and affected acceptance criterion;
- proposed change and alternatives considered;
- reuse decision: REUSE / ADAPT / BUILD / DEFER / REJECT;
- implementation scope, owner/authority boundary and non-goals;
- risk, free-tier/resource impact and rollback;
- tests and evidence required;
- status: PLANNED, RUNNING, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED or NOT VERIFIED.

Statuses apply only to the stated scope. A documentation decision is not a code implementation; a passing test is not runtime qualification; neither implies Contour A acceptance.

## Current improvement backlog (ordered, not yet runtime-integrated)

| Priority | Candidate work | Expected benefit | Entry gate / proof |
|---|---|---|---|
| P0 | Restore and reconcile the canonical Context Window against live refs; keep PR #169/#170/#171 and Issues #96/#140 synchronized | Prevent stale-context and duplicate-work errors | Readback of exact refs, reports, CI and governance |
| P1 | Add workflow static analysis pilot using actionlint and zizmor | Catch workflow syntax and security anti-patterns before merge | Reuse/license/maintenance review; pinned or reproducible tool versions; synthetic fixtures; exact-head CI |
| P1 | Evaluate OpenSSF Scorecard as scheduled/advisory repository posture evidence | Identify supply-chain and repository-hardening gaps | Confirm public-repo/free-tier behavior, permissions and score interpretation; no auto-remediation |
| P1 | Expand Workers/D1 tests with supported Workers Vitest integration harness | Improve runtime fidelity for D1/Workers behavior | Pin compatible versions; local no-secret fixtures; prove deterministic tests and no remote bindings |
| P1 | Qualify artifact provenance/attestation path (GitHub artifact attestations / SLSA model) | Bind outputs to workflow/source identity | Verify current plan eligibility, permissions, trust model and artifact verification; no claim based on workflow YAML alone |
| P2 | Engineering Control Center operational view | Reduce context restoration time and expose blockers/evidence | Build only from canonical GitHub sources; read-only first; no duplicate authority/state |
| P2 | Multi-account bootstrap profile | Repeatable rollout to two or three isolated GitHub accounts | Separate identity, quotas, repositories, secrets and governance; never share credentials or infer account equivalence |
| P2 | Improve measured time/rework and critical-path forecast | Better remaining-effort estimates | Capture timestamps and comparable samples; label estimates and confidence |

This backlog is a research/implementation queue, not a claim that any listed tool is installed or qualified.

## Current first implementation experiment

The next suitable bounded experiment is a **workflow security static-analysis pilot**:
1. inspect the existing workflow inventory and current CI contracts;
2. evaluate actionlint and zizmor versions, licenses, maintenance and invocation model;
3. run them without secrets or repository mutations, preferably as pinned local/CI tools;
4. classify findings; distinguish true positives, accepted exceptions and tool limitations;
5. add CI enforcement only after false-positive behavior and least-privilege permissions are understood;
6. record exact tool versions, target SHA, logs and outcome.

Do not add unpinned third-party GitHub Actions, auto-fix workflows, change permissions, or enable dispatch as part of the pilot. If a tool cannot be run reproducibly within free constraints, record DEFER/NOT RUN and use a justified alternative.

## Review record template

- Review date / pass range:
- Target default SHA and relevant PR heads:
- Verified progress since prior review:
- Top blockers and critical-path change:
- Quality/rework observations:
- OSS candidates researched and decisions:
- Security/governance deltas:
- Recommendation decisions:
- One process experiment and success metric:
- Next bounded pass:
- Evidence links: