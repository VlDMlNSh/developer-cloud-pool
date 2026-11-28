# Owner /next issue_comment activation contract

Date: 2026-11-28
Scope: Cloud Pool owner-only read-only event controller. This contract does not authorize dispatch or execution.

## Platform activation precondition

GitHub Actions does not trigger an `issue_comment` workflow unless the workflow file exists on the repository's default branch. A copy present only in a pull request or feature branch is not active for that event.

For this repository the default branch is `Основной`. Pass 127 re-read the default-branch Contents API for `.github/workflows/next-event-controller.yml` and received `NOT_FOUND`. Therefore the controller is present in the working PR branch but is not eligible to receive live `issue_comment` events yet. Status: **BLOCKED / NOT RUN**.

Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

## Required safe activation sequence

1. Keep the workflow restricted to `issue_comment: created`; do not add `workflow_dispatch`, `workflow_run`, `workflow_call`, schedule or alternate dispatch triggers.
2. Keep the job bound to the exact repository, Issue #96, exact body `/next`, numeric owner identity and owner association.
3. Keep workflow permissions read-only (`contents: read`, `issues: read`, `actions: read`); keep `dispatch=false` and `executionAuthorized=false`.
4. Integrate the workflow only through the repository's approved PR and effective governance gates. Do not copy it directly to the default branch or create a bypass.
5. After approved integration, re-read the default-branch workflow blob and verify its SHA. Only then may a genuine owner-authored top-level Issue #96 comment be used to test event activation. A test event is not authorization to dispatch workers.
6. Reconcile the resulting controller run, target SHA, source comment idempotency key and read-only outputs. Missing evidence remains NOT VERIFIED.

## Machine-checked contract

`scripts/owner-next-controller.test.mjs` checks the single permitted trigger, absence of alternate trigger declarations, immutable Node 24 action pins, and presence of this activation precondition. `scripts/validate-pool-contract.mjs` separately enforces the controller's action pin allowlist and cache-disabled setup-node configuration.

These checks validate repository policy text and workflow structure. They do not prove the workflow is present on the default branch; that remains a live GitHub Contents API precondition and must be rechecked before activation.

## Current status

- Default-branch workflow presence: **NOT FOUND**.
- Live `issue_comment` execution: **NOT RUN**.
- Dispatch and execution authority: **false**.
- Merge, deployment, provider calls, hosted D1 writes and executor launch: **not authorized by this contract**.
