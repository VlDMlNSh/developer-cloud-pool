# Engineering Excellence — Master Control Center

Status: **DOCUMENTATION BASELINE CREATED / PROCESS NOT YET AUTOMATED**  
Scope: Cloud Development Pool, Contour A only. Contour B remains deferred until Contour A is ACCEPTED.

## Purpose
Provide one operational index for engineering work. This document does not replace GitHub as source of truth, the Context Window, Issues, PRs, immutable commits, workflow evidence, or security contracts.

## Control loop
1. Restore current repository metadata, default HEAD, active branches, open Issues/PRs, exact-head CI, rulesets, and relevant controller gates.
2. Read the Context Window and the current checkpoint; resolve stale or conflicting summaries against primary GitHub evidence.
3. Select one bounded pass on an immutable target SHA. State objective, scope, exclusions, acceptance criteria, and rollback/containment.
4. Search for mature reusable components before custom implementation; record REUSE / ADAPT / REJECT with evidence.
5. Implement the smallest useful change. Keep dispatch, provider calls, deployment, paid fallback, and authority changes disabled unless separately authorized and qualified.
6. Run relevant tests and exact-head CI; inspect logs and artifacts, not only green badges.
7. Obtain independent review for security-sensitive or authority-bearing changes.
8. Publish a dated report, update the Context Window/checkpoint, and identify the next critical-path action.

## Current control-plane facts
- Contour A is the only active development objective.
- Contour B is DEFERRED until Contour A is ACCEPTED.
- PR #168 / Issue #140 are the current D1 admission/lease proof chain. Pass 50 recorded F-50-01 (caller-controlled lease time) as a HIGH blocker; remediation and requalification remain required.
- The documentation branch created for this baseline is not the default branch and is not accepted until reviewed and merged under repository governance.
- No documentation-only pass qualifies runtime execution, web hosting, worker execution, model routing, persistence, or security acceptance.

## Status vocabulary
Use PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED. Never collapse these states. A successful test is not system qualification; qualification is not acceptance.

## Decision record requirements
For material decisions record: decision ID/date, immutable target SHA, context, options, rationale, authority, security implications, evidence, status, and reconsideration trigger.

## Dashboard minimum
The Context Window remains the durable dashboard. Its current-state section should expose:
- current phase and objective;
- default branch/HEAD and documentation branch/HEAD;
- active implementation PR and issue;
- exact-head CI and formal review state;
- security/governance gate state;
- critical blockers and dependency chain;
- latest report/checkpoint;
- cumulative engineering-time estimate with confidence and data coverage;
- next bounded pass.

## Non-goals
Do not introduce a new database, service, paid SaaS, agent framework, or production dispatch merely to automate metrics or documentation. Start with GitHub-native Markdown, Actions evidence already available, and deterministic scripts only when separately reviewed.
