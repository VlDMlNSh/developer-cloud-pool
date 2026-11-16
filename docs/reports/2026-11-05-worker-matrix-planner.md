# 2026-11-05 — Bounded reusable Worker matrix planner

## Immutable target and result

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Base branch: `Основной`
- Base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Implementation branch: `feat/reusable-worker-matrix-plan-2026-11-05`
- PR: [#20](https://github.com/VlDMlNSh/developer-cloud-pool/pull/20)
- Tested implementation head: `52093f1fefa2c46a0ed85c732054f6b6418a37c2`
- Exact-head run: [42102538333](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42102538333)
- Job: `127508820199`, terminal status **COMPLETED / SUCCESS**

## Scope implemented

Added a pure planner `scripts/pool-worker-matrix.mjs` and six tests in `scripts/pool-worker-matrix.test.mjs`. The planner converts a trusted, already-fetched issue snapshot into a deterministic GitHub Actions matrix `{ include: [...] }` capped at 20 entries.

Fail-closed cases covered:
- malformed issue identifiers;
- pull requests and closed issues;
- missing `pool:ready` label;
- missing/malformed target SHA;
- unsupported worker profile;
- duplicate issue identifiers;
- unsafe configured batch limits and fan-out overflow.

Updated Pool Contract Validation to execute the planner tests. Exact-head workflow evidence:
- dispatch gate assertion: SUCCESS;
- YAML parsing: SUCCESS;
- matrix planner tests: SUCCESS;
- existing pool security contract validator: SUCCESS;
- overall check: SUCCESS.

## Security and integration limits

This is a pure planning component, **not an authorization mechanism**. It does not:
- verify owner-authored approval provenance;
- consume a durable single-use approval marker;
- atomically claim issues;
- mutate GitHub state;
- call Worker, DSH, browser or any model/provider;
- access secrets or change `POOL_DISPATCH_ENABLED`.

No production workflow was changed. Canonical Worker still exposes `workflow_dispatch`; canonical Supervisor still uses REST workflow dispatch and `workflow_run`. The caller-context helper in PR #12 remains standalone. PR #15/#18 authorization and recovery changes remain unmerged. This PR must not be merged as a complete authorization boundary.

## Design confirmation from GitHub documentation

GitHub documents that jobs using a matrix can call a reusable workflow, and that a job can consume a matrix object produced by a prior job output using `fromJSON`. This supports a static Supervisor → reusable Worker fan-out design without REST workflow dispatch. References:
- [GitHub: Reuse workflows — matrix strategy](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [GitHub: Running variations of jobs — define matrices from outputs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
- [GitHub: Contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)

The implementation still needs a separate authorization/claim design before this matrix can be wired to execution. In particular, the planner must receive a candidate set only after trusted owner approval and durable single-use consumption are proven, and the Worker must validate reusable caller/callee context before any runtime job.

## Next bounded step

Design and test a pure claim/approval gate adapter that produces the matrix only from independently verified owner approval and a durable single-use marker outcome. Do not connect it to live dispatch until marker atomicity, permissions, caller-context validation, independent review and repository governance are qualified.

## Status

- Planner implementation: **IMPLEMENTED**
- Planner exact-head CI: **VERIFIED**
- Integrated reusable Worker boundary: **NOT IMPLEMENTED**
- Independent security review: **NOT RUN**
- Runtime / DSH / browser / provider calls: **NOT RUN**
- Production dispatch: **BLOCKED**
- PR #20: **DRAFT / NOT MERGED / NOT ACCEPTED**
