# Engineering Pass Protocol and Definition of Done

- Status: **MANDATORY PROCESS PROPOSAL; adoption pending PR review**
- Applies to every `/next` engineering pass in Contour A.
- This protocol governs evidence quality, not authorization to dispatch, deploy, merge or access secrets.

## Pass admission record

Before editing, record:

- Pass identifier and UTC start timestamp.
- Repository, base branch, immutable target SHA, working branch and related Issue/PR.
- One-sentence objective and explicit non-goals.
- Files/contracts in scope and files explicitly out of scope.
- Relevant security/governance gates and current observed state.
- Reusable-project research performed and decision (reuse/adapt/reject/defer).
- Acceptance criteria and exact tests/evidence expected.
- Whether the pass is documentation-only, test-only, code-changing or audit-only.

If the immutable target cannot be established, stop changes and report **BLOCKED**.

## Execution rules

1. One pass should solve one coherent, independently reviewable problem.
2. Do not mix unrelated cleanup, feature work and acceptance claims.
3. Preserve immutable IDs, event provenance, task identity, authority separation and existing fail-closed behavior.
4. No secret values in prompts, source, logs, artifacts or reports. Metadata-only checks require explicit authorization.
5. A green workflow on a stale SHA is not evidence for the current change.
6. Distinguish PR head SHA from synthetic PR merge-result SHA. State exactly what was tested.
7. An empty checks list, inaccessible log, missing artifact or skipped job is **NOT VERIFIED**, never PASS.
8. Do not mark an agent run successful based only on dispatch acknowledgement; verify child run/job, target SHA, output and artifact digests.
9. Do not merge, deploy, enable dispatch or make provider calls unless separate project gates explicitly authorize it.

## Definition of Done (DoD)

A pass is **VERIFIED** only when all applicable items below are satisfied:

- [ ] Live repository state and immutable target SHA were re-read.
- [ ] Objective, scope, non-goals and constraints are documented.
- [ ] Reuse-first research is recorded, or a reason why no external component is relevant is stated.
- [ ] Change is limited to the declared scope; diff and provenance are inspected.
- [ ] Relevant deterministic tests were actually run; commands, versions and outcomes are recorded.
- [ ] Exact resulting commit/PR merge-result CI was checked; relevant logs were inspected.
- [ ] Security and authority implications were reviewed; no secrets were exposed.
- [ ] Regression cases and negative/fail-closed cases were considered.
- [ ] Changed files were re-read and content/blob SHAs recorded.
- [ ] Dated report and Context Window were updated and re-read.
- [ ] Open findings, unavailable evidence and residual risks are explicit.
- [ ] Next action is a single bounded task with a measurable exit condition.

For a documentation-only pass, runtime tests may be not applicable; validate Markdown/link consistency and reread the published files instead. Do not claim software tests passed.

## Status semantics

- **PLANNED** — specified, not started.
- **DISPATCHED** — a permitted controller accepted a dispatch request; not proof of child execution.
- **RUNNING** — execution is observed in progress.
- **SUCCEEDED** — operation completed according to its own result.
- **VERIFIED** — evidence inspected and criteria met for the stated scope.
- **QUALIFIED** — all qualification requirements for a named capability/profile passed.
- **ACCEPTED** — formal project acceptance gate passed; never inferred from CI.
- **NOT RUN** — deliberately not attempted.
- **BLOCKED** — a known prerequisite prevents progress.
- **FAILED** — an attempted operation failed.
- **NOT VERIFIED** — evidence is missing, stale, inaccessible or insufficient.

Never collapse these statuses. A pass may be VERIFIED while the component remains NOT QUALIFIED and Contour A remains NOT ACCEPTED.

## Pass closeout record

Every pass report ends with: work performed; base/target/result SHAs; tests and exact run IDs; evidence links; findings; status by scope; actions not performed; blockers; next step; canonical Context Window and MediaHub map links.
