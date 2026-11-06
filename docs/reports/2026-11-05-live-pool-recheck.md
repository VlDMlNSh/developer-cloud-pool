# Developer Cloud Pool — live recheck and authorization gate

Date: 2026-11-05
Status: **SOURCE/PR/RULESET READ-BACK VERIFIED / PRODUCTION DISPATCH BLOCKED / RUNTIME NOT RUN**

## Immutable source

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD at start of pass: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Active Ruleset: [26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182)
- Audit note: [Issue #1 live recheck comment](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1#issuecomment-6668279252)

## 1. Governance

The active repository Ruleset has enforcement `active` and an exact selector for `refs/heads/Основной`. It requires pull requests, blocks deletion and non-fast-forward updates, and requires review-thread resolution.

However:
- `required_approving_review_count=0`;
- `require_code_owner_review=false`;
- `require_extra_approval_for_unattributed_changes=false`;
- bypass actors are empty and current-user bypass is `never`.

Therefore, governance is **not sufficient to enforce independent review**. Classic branch-protection read was denied with HTTP 403 to the connected integration; that endpoint's state is **NOT VERIFIED**. Ruleset evidence must not be conflated with classic branch protection.

`POOL_DISPATCH_ENABLED` was not read or changed during this pass. Do not infer its live value from earlier notes. Production dispatch remains blocked regardless.

## 2. PR and exact-head CI reconciliation

| PR | Scope | Exact-head evidence | Review / disposition |
|---|---|---|---|
| [#15](https://github.com/VlDMlNSh/developer-cloud-pool/pull/15) | Remove privileged `workflow_run` Supervisor trigger | Contract Validation SUCCESS, check 127281084983 | DRAFT; no formal review |
| [#18](https://github.com/VlDMlNSh/developer-cloud-pool/pull/18) | Single-use approval recovery; stacked on #15 change set | Contract Validation SUCCESS, check 127301328381 | DRAFT; no formal review |
| [#12](https://github.com/VlDMlNSh/developer-cloud-pool/pull/12) | Worker caller-context validator and fixtures | Contract Validation SUCCESS, check 127294775575; reusable context fixture SUCCESS, job 127294723519 | DRAFT; no formal review; validator not wired into production |
| [#16](https://github.com/VlDMlNSh/developer-cloud-pool/pull/16) | Pinned DSH consumer dependency graph | Contract Validation SUCCESS, job 127489590997 | DRAFT; no formal review; no runtime qualification |
| [#17](https://github.com/VlDMlNSh/developer-cloud-pool/pull/17) | Zizmor audit integration and readiness report | Run 42042364242 FAILED at zizmor; remaining validation steps skipped | DRAFT; audit is not clean |

All five PRs remain open and unmerged. The checks above are scoped to their exact reported heads, not to the default branch.

## 3. Production boundary findings

The default-branch Worker still exposes `workflow_dispatch`. The default-branch Supervisor still uses REST `POST /actions/workflows/pool-worker.yml/dispatches` and holds `actions: write`. PR #12's caller-context validator is not wired into the production Worker. The existing Worker runtime validates issue state, claim label, target SHA and profile, but these are not equivalent to trusted owner approval provenance.

The existing reusable Worker boundary contract correctly requires:
- Worker `workflow_call` only;
- static local invocation from Supervisor;
- caller context validation inside Worker before runtime;
- no REST workflow dispatch or arbitrary workflow/profile input;
- isolated validation/runtime/report permissions;
- race-safe, single-use approval semantics;
- independent review and exact-head CI.

The issue-label mechanism alone is not an atomic compare-and-swap ledger. A label must not be represented as cryptographic or exactly-once approval evidence.

## 4. DSH runtime dependency

PR #16 pins `@deepseek-ai/dsh@0.2.1-rc.5`, Node.js `24.9.0`, and pnpm `11.28.5`. Its exact-head CI verifies a frozen install with lifecycle scripts disabled and dispatch disabled. It does not yet prove:
- dependency lifecycle/native build requirements are safe;
- the generated consumer lockfile is committed and consumed by production DSH workflows;
- a harmless isolated `dsh --profile headless --dump-config` smoke succeeds;
- DSH is qualified for general agent tasks.

DSH remains a developer-preview candidate runtime, not the pool's authority, scheduler or security boundary.

## 5. Runtime and provider status

No secrets, variables, Environments, provider credentials, Worker, DSH, Resource Probe, browser, model/provider call, paid service, or runner lifecycle were accessed or executed in this pass. No dispatch, deployment, merge, or qualification occurred.

- Production dispatch: **BLOCKED**
- `POOL_DISPATCH_ENABLED`: **NOT READ IN THIS PASS**
- Worker runtime: **NOT RUN**
- DSH runtime: **NOT RUN / NOT QUALIFIED**
- Browser runtime: **NOT RUN**
- Model routing and renewable quotas: **DESIGN / NOT QUALIFIED**
- 20 logical runner slots: **DESIGN / NOT DEPLOYED**
- Jarvis mobile shell: **PROTOTYPE / NOT CONNECTED TO LIVE API**

## 6. Next bounded engineering unit

Prepare one integrated authorization-boundary implementation on a dedicated branch, based on the #18 Supervisor recovery lineage and #12 caller-context contract:

1. Convert Worker to `workflow_call` only.
2. Replace Supervisor REST dispatch with static local reusable workflow invocation.
3. Wire caller-context validation inside the called Worker before any runtime job.
4. Remove direct Worker dispatch and unnecessary `actions: write` capability.
5. Keep validation, runtime and report credentials isolated.
6. Add negative tests for direct invocation, foreign caller, SHA mismatch, PR refs, missing context and runtime/report permission leakage.
7. Preserve fail-closed behavior and fresh-approval recovery for ambiguous outcomes.
8. Do not dispatch Worker or DSH; run only read-only exact-head CI and static security checks.
9. Obtain independent security review and resolve the governance review requirement before any integration.

This unit is not authorized to enable `POOL_DISPATCH_ENABLED`, access provider secrets, call models, or perform runtime qualification.

## Canonical references

- [README / project status](https://github.com/VlDMlNSh/developer-cloud-pool/blob/%D0%9E%D1%81%D0%BD%D0%BE%D0%B9/README.md)
- [20-slot architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/%D0%9E%D1%81%D0%BD%D0%BE%D0%B9/docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Reusable Worker boundary contract](https://github.com/VlDMlNSh/developer-cloud-pool/blob/6c053bacff29ca8efb5fdb759edd44fcd416b749/docs/architecture/PRODUCTION-REUSABLE-WORKER-BOUNDARY-CONTRACT.md)
- [Issue #1 governance gate](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
