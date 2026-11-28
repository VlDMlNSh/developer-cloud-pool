# Spec Kit adoption — Cloud Development Pool

Date: 2026-11-28  
Status: VERIFIED — repository-local spec-driven artifacts created; CLI installation NOT RUN  
Scope: Contour A only

## Decision
Adopt GitHub's MIT-licensed Spec Kit as the reference process for specification-driven changes. Adapt Constitution → Specify → Plan → Tasks → Implement → Converge to the Cloud Pool governance and bounded /next protocol.

This is a brownfield adoption, not a rewrite. GitHub Context Window, Issues, PRs, contracts, tests, exact-head CI and reports remain authoritative evidence.

## Added artifacts
- .specify/memory/constitution.md — project principles.
- .specify/templates/spec-template.md — requirements, security, acceptance and evidence.
- .specify/templates/plan-template.md — Reuse First, architecture, trust boundaries and verification.
- .specify/templates/tasks-template.md — ordered test-first tasks.
- specs/115-controller-api-d1-composition/ — concrete spec, plan and tasks for next blocked Contour A integration.

## Adaptation decisions
| Capability | Decision | Reason |
|---|---|---|
| Constitution/spec/plan/tasks/converge concepts | ADAPT | Preserve authority, free-tier, fail-closed and evidence rules |
| Templates | ADAPT | Markdown in Git; no generated runtime code |
| specify-cli | DEFER installation | No authorized local build environment established; avoid Python/uv runtime dependency |
| Community extensions/presets/bundles | REJECT initially | Third-party execution adds supply-chain/authority surface |
| GitHub Issues/PRs | REUSE | Existing governance and traceability |

Upstream documents Python 3.11+ and recommends uv for CLI installation. This pass does not claim CLI installation or execution.

## Operating sequence
1. Refresh Context Window, refs, PRs, issues, CI and governance.
2. Create/refresh feature spec with FR/SEC/AC identifiers.
3. Clarify underspecified areas and analyze consistency before implementation.
4. Produce plan and Reuse First assessment.
5. Create ordered tasks with negative-first tests.
6. Implement one bounded pass.
7. Converge actual diff/tests/evidence against spec and create residual tasks.
8. Update report/checkpoint/context with explicit NOT VERIFIED items.

## Guardrails
Spec Kit does not grant dispatch, execution, provider, secret or production authority. A task list is not approval. Convergence cannot promote VERIFIED/QUALIFIED/ACCEPTED without evidence. Contour B remains deferred until Contour A is ACCEPTED.

## Upstream
https://github.com/github/spec-kit — MIT; current README documents constitution, specify, plan, tasks, implement, converge and optional clarify/analyze/checklist. Support for 30+ agents is an upstream claim, not qualification of our agents.