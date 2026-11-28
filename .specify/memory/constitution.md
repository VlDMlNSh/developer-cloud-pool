# Cloud Development Pool Constitution

Version: 1.0 — 2026-11-28
Scope: Contour A only

## Non-negotiable principles
1. Contour A first. Contour B, MediaHub product features, native apps, local assistants and external compute remain deferred until Contour A is ACCEPTED.
2. Authority is explicit. A tool, workflow, credential or technical capability does not grant execution authority. Preserve Jarvis, ASTRA A0 and MediaHub Product State Authority boundaries.
3. Fail closed. Unknown commands, incomplete provenance, unavailable stores, stale leases, ambiguous writes and unqualified routes reject or remain indeterminate.
4. Never read, print, copy, log, commit or forward secret values. Never mix provider accounts, credentials, quota domains or billing identities.
5. No implicit production actions: no dispatch, provider calls, hosted D1 writes, deployment, billable resource creation, merge or production mutation without explicit authorization and gates.
6. Evidence before status. CI proves only the checks that ran on the exact SHA. Documentation and fixtures do not prove runtime readiness.
7. Reuse first; minimize dependencies. Evaluate license, maintenance, security, compatibility and cost. Prefer existing Node.js ESM, GitHub Actions and Workers/D1 contracts.
8. Test first and adversarially: replay, substitution, stale state, concurrency, ambiguity, privilege escalation and data leakage.
9. Traceability is mandatory: target SHA, scope, FR/SEC/AC IDs, tests, run IDs, report, checkpoint, risks and residual tasks.
10. One bounded /next pass: one target, one scope, measurable DoD; no adjacent-project scope creep.
11. Free-tier discipline: no paid fallback, account blending or unbounded workload.
12. ACCEPTED requires phone/desktop UI, routing, qualified executors, persistent state/recovery, quotas, isolation, security/governance, audit and independent acceptance.

## Required workflow
1. Refresh Context Window, refs, PRs, issues, CI and governance.
2. Freeze target SHA, scope, exclusions, risks and DoD.
3. Record Reuse First decisions.
4. Specify observable requirements and acceptance criteria.
5. Plan architecture, trust boundaries, migration and rollback.
6. Create ordered test-first tasks including negative cases.
7. Implement only authorized scope; inspect diff and rerun tests.
8. Verify exact-head/merge-result CI, reviews, ruleset and provenance.
9. Publish report/checkpoint/context update.

## Status semantics
PLANNED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, NOT VERIFIED, BLOCKED and FAILED are distinct. Never promote a status without evidence.