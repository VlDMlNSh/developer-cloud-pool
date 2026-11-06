# GitHub-native single-use consume alternatives — 2026-11-06

## Scope and immutable target

Read-only assessment of alternative GitHub-native primitives for one-time consumption of owner approval before Supervisor invokes Worker.

- Production default branch: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #32: OPEN / DRAFT / UNMERGED; head `75c83a288d865f1bbeda4905cf817e00084bcc2d`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- No production mutation, dispatch, workflow run, deployment, provider call, secret read, or paid resource use was performed.

## Candidate assessment

| Candidate | Useful property | Disqualifying limitation for durable one-time authorization | Decision |
|---|---|---|---|
| Actions concurrency `queue: max` | Serializes runs in a concurrency group; permits up to 100 pending | Queue is scheduler state, not a durable nonce ledger. FIFO is based on when runs begin waiting, not dispatch order; queue overflow cancels extra runs. | REJECT as consume primitive |
| Actions cache reservation | Cache save path can reject a duplicate reservation for the same key | Cache is dependency state, not authorization state; entries can be deleted and are evicted after inactivity/size pressure; cache scope is branch/ref constrained; access controls are not equivalent to an immutable approval ledger. | REJECT |
| Artifacts v4 | Uploaded artifact is immutable after upload and duplicate names within the same workflow run are rejected | Uniqueness is scoped to a workflow run, not repository-wide across concurrent Supervisor runs; artifacts can be deleted and are retention-bound. | REJECT |
| Deployments API | Creates durable-looking deployment records and status events | API permits multiple deployments; deployments can be deleted under documented conditions; no unique approval-ID constraint or immutable anti-delete property. | REJECT |
| Issues/comments/labels | Native, auditable task metadata | Mutable; no atomic compare-and-set/unique consume; issue write authority currently exists in Worker and Supervisor. | REJECT |
| Git refs/tags | Git ref creation can be a create-if-absent candidate | A dedicated active tag ruleset is VERIFIED ABSENT in the last complete ruleset collection; effective Actions token identity/permissions are NOT VERIFIED. No disposable race/immutability test was run. | BLOCKED / NOT PROVEN |

## Evidence

1. GitHub Actions workflow syntax documents the concurrency queue limit (100) and that ordering is based on when runs start waiting, not dispatch order:
   https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
2. GitHub dependency caching documentation describes cache keys, branch/default-branch scope, and eviction after seven days without access; the cache management API permits cache deletion:
   https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
   https://docs.github.com/en/rest/actions/cache
3. GitHub's artifact v4 documentation states artifacts are immutable after upload and disallows multiple same-named artifacts within the same workflow run:
   https://github.blog/news-insights/product-news/get-started-with-v4-of-github-actions-artifacts/
   https://github.com/actions/upload-artifact/blob/main/docs/MIGRATION.md
4. GitHub Deployments API documents create and delete operations, multiple deployments and deployment statuses, but no unique approval-event constraint:
   https://docs.github.com/en/rest/deployments/deployments

## Current authorization baseline

- PR #32 is OPEN / DRAFT / UNMERGED; no formal reviews and no inline review threads.
- Exact-head Authorization Negative-First run `42236017811`, job `127953700048`: COMPLETED / FAILURE. Eight assertions failed in the previously inspected job summary; this is an expected red baseline against current production code.
- Exact-head Pool Contract Validation run `42236017724`: COMPLETED / SUCCESS; this is not authorization qualification.
- Current production Supervisor still has `workflow_run: completed`, `issues: write`, and `actions: write`.
- Current production Worker still exposes `workflow_dispatch`; its report job has `issues: write`.
- The complete ruleset read recorded in the previous governance report found only active branch ruleset #26550182 scoped to `refs/heads/Основной`; no tag-target ruleset. Actions workflow permissions/effective token identity remain NOT VERIFIED because the available read connector rejects those endpoints.

## Decision

No reviewed GitHub-native candidate presently satisfies all required properties: atomic uniqueness across concurrent workflow runs, durable retention, immutable payload, anti-delete/update governance, verifiable caller identity, and owner-bound approval semantics.

Do not replace the consume primitive with cache, artifacts, deployments, concurrency, labels, comments, or unprotected refs. Do not dispatch or enable Worker. If a durable free-tier external state store is later considered, it must be explicitly admitted under the no-paid-fallback constraint and independently qualified for transactions, unique constraints, persistence, access isolation, recovery and audit. No such store is selected or provisioned in this pass.

## Status and next step

- Alternative GitHub-native consume candidate: NOT QUALIFIED.
- Durable single-use consume: NOT VERIFIED.
- Effective Actions token identity/permissions: NOT VERIFIED.
- Production authorization remediation: NOT IMPLEMENTED.
- PR #32 independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: obtain an owner-authorized metadata-only read of Actions default permissions and effective Supervisor token identity, while separately comparing a free, transaction-capable persistence option without provisioning or billing. If neither path can be proven, retain the blocker and keep dispatch fail-closed.
