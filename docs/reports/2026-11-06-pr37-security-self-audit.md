# PR #37 bounded security self-audit — 2026-11-06

## Scope and immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Base: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`
- Head: `5b45a29ed7869c091741c0037c68bfcd6640de7d`
- Working branch: `feat/reusable-pool-worker-boundary-2026-11-06`
- This is a same-session self-audit, NOT an independent review or acceptance.

## Live repository and PR read-back

- Default branch ref still resolves to `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37 is OPEN / DRAFT / UNMERGED; mergeable=true; head unchanged.
- Reviews: 0. Inline review comments/threads: 0.
- Active repository Ruleset ID `26550182` freshly read from GitHub API:
  - selector: `refs/heads/Основной`
  - enforcement: active
  - PR required; required approvals: 0
  - CODEOWNERS review: false
  - unattributed-change extra approval: false
  - required review-thread resolution: true
  - bypass actors: none; current-user bypass: never
- Ruleset therefore does NOT enforce an independent approval.
- Current Actions variables endpoint was not available through the authorized read-only connector. Do not claim a fresh live variable read. Exact-head CI run `42280875365` recorded `POOL_DISPATCH_ENABLED=false` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` empty/unset at its execution time. No variable was changed.

## Exact-head CI

- Reusable Pool Worker Boundary Validation: run `42280875294`, job `128109201815`, COMPLETED / SUCCESS.
- Pool Contract Validation: run `42280875365`, job `128109179508`, COMPLETED / SUCCESS.
- Both runs target the exact PR head above. Static authorization tests, Supervisor syntax, YAML parsing and pool contract validation passed.
- A separate run `42280863542` associated with the same head is marked failure and returned no jobs in the available jobs endpoint; it is not one of the two required successful validation runs and its failure cause is NOT VERIFIED.

## Bounded source review

Read back complete current versions of:
- `.github/workflows/pool-worker.yml`
- `.github/workflows/pool-supervisor.yml`
- `scripts/pool-supervisor.mjs`
- `tests/security/reusable-pool-worker-boundary.test.mjs`

Positive controls observed:
- Worker is `workflow_call` only and has no issue-write permission.
- Worker checks caller repository ID, caller workflow ref/SHA, reusable callee repository/path/SHA, and caller/callee SHA equality.
- Supervisor no longer uses `workflow_run`, `actions: write`, or REST workflow dispatch.
- Supervisor requires protected default ref and two separate fail-closed repository-variable gates.
- Worker receives only read permissions; Supervisor intake/finalizer own issue mutations.
- Ambiguous claim read-back throws; automatic stale-claim requeue is absent.
- Finalizer routes unsuccessful Worker outcomes to `pool:needs-review`.

Residual risks / qualification gaps:
1. GitHub Issues label updates are full-list PATCH operations, not compare-and-swap. A concurrent label edit can race with intake/finalization; read-back reduces ambiguity but cannot prove atomic single-use consumption or exactly-once execution. A durable conditional-write/receipt mechanism or a separately qualified concurrency proof is still required before enabling dispatch.
2. Static tests assert source patterns and strings. They do not execute a real reusable workflow to prove the runtime values of `github.workflow_ref`, `github.workflow_sha`, `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha` for this repository.
3. Worker validates task state and envelope but does not create a unique durable claim receipt tied to the specific Supervisor run. Current one-task serialized workflow plus label state is a bounded risk-reduction design, not a proven exactly-once authorization protocol.
4. The current workflow and finalizer have not been exercised end-to-end. Worker, DSH, Resource Probe, browser console, OAuth/session and cloud deployment remain NOT RUN / NOT IMPLEMENTED as applicable.

## Actions taken / prohibited actions

- Read-only GitHub inspection only; no repository source changes.
- No merge, no dispatch, no Worker execution, no DSH/Resource Probe, no provider/model calls, no secrets access, no deployment, no paid fallback.
- Both dispatch gates remain unmodified and fail-closed per latest exact-head CI evidence.

## Disposition

- Implementation on draft branch: SUCCEEDED.
- Exact-head static CI: VERIFIED.
- Live Ruleset: VERIFIED; governance is insufficient to require independent review.
- Independent security review: NOT RUN.
- Runtime / durable claim semantics: NOT QUALIFIED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Keep PR #37 draft and dispatch disabled. Obtain an actual independent security review; separately design and test a durable conditional single-use claim/receipt or explicitly qualify and accept the residual GitHub Issues race before any execution authorization. Then run exact-head CI again after any change.
