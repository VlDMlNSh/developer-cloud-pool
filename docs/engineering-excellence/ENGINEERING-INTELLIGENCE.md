# Engineering Intelligence — Learning and Optimization Loop

- Status: **PROCESS DESIGN / NOT AUTOMATED**
- Authority: advisory only. This system must never self-approve, dispatch, merge, deploy, access secrets or change governance.

## Objective

Use verified engineering history to reduce repeated defects, shorten diagnosis, improve sequencing and increase evidence quality without rewarding superficial pass counts.

## Inputs

- Dated pass reports and immutable code/test SHAs.
- GitHub Issues, PRs, review comments and exact-head workflow results.
- Test failure categories and regression findings.
- Blocker start/clear timestamps.
- Active work, CI queue/runtime, external wait and rework measurements.
- Reuse research decisions and component outcomes.
- Security findings, severity, recurrence and remediation evidence.

Only use records whose source and target SHA can be verified. Mark missing, stale or inferred fields explicitly.

## Analyses after each material pass

1. **Recurring defects:** cluster by root cause (identity, time, replay, fencing, persistence, provenance, quota, UI/auth, workflow permissions).
2. **Test effectiveness:** identify which deterministic/adversarial tests catch defects before integration; add tests where coverage gaps recur.
3. **Rework drivers:** separate unclear contracts, stale context, test instability, integration ancestry, missing runtime evidence and external waits.
4. **Critical path:** identify tasks whose completion unlocks the most dependent work; do not optimize non-blocking tasks at the expense of a HIGH blocker.
5. **Reuse opportunities:** revisit rejected/deferred candidates when assumptions change; never auto-add dependencies.
6. **Forecast calibration:** compare estimates with measured active effort and calendar elapsed time; record error ranges, not false precision.

## Suggested output

A concise monthly/pass-batch review:
- Top recurring root causes.
- Most effective tests and uncovered failure modes.
- Largest sources of rework and waiting.
- Critical-path changes and reason.
- Reuse candidates worth re-evaluating.
- Forecast calibration and confidence.
- One process experiment with an explicit success metric.

## Anti-gaming and safety

- Do not optimize pass count, line count, agent count or green-check count as standalone goals.
- Do not penalize discovery of defects; reward early detection and precise evidence.
- Do not hide blocked time or count it as active effort.
- Do not compare individual agents on raw throughput without task complexity and evidence quality.
- No autonomous modification of security policies, controller inputs, permissions, secrets or dispatch settings.
- Human/project-owner acceptance remains the final authority for Contour A.


## Owner-approved review cadence (2026-11-24)

Use the [Continuous Improvement Review Cadence](CONTINUOUS-IMPROVEMENT-REVIEW.md): review every 3–5 completed /next passes or every 7 calendar days during active work, plus event-triggered reviews after material security findings, repeated regressions, critical-path changes or failed integrations. Each review must produce evidence-backed decisions, not an unbounded idea list. Select at most one primary process experiment and one bounded engineering follow-up. Keep this loop advisory: it cannot dispatch, merge, deploy, change permissions or access secrets.
