# Supervisor claim protocol qualification pass — 2026-11-06

## Work performed

- Re-read live default branch, PR #37, its reviews/comments, exact-head workflow runs and active Ruleset.
- Enumerated all five workflow files on default branch and inspected permission/mutation patterns.
- Confirmed PR #37 remains the only current correction for the privileged Supervisor/Worker chain; it is still DRAFT / UNMERGED.
- Reviewed official GitHub Actions concurrency and Git references documentation.
- Created tracking Issue #38 and design decision record.

## Live state

- Default HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37: `5b45a29ed7869c091741c0037c68bfcd6640de7d`, OPEN / DRAFT / UNMERGED.
- Reviews / inline comments: 0 / 0.
- Exact-head CI: runs `42280875294` and `42280875365`, SUCCESS.
- Ruleset `26550182`: active, but 0 required approvals and CODEOWNERS review disabled.
- Default Supervisor/Worker still retain privileged legacy behavior pending PR #37 merge; no merge performed.
- DSH runtime evaluation and Resource Probe workflows have manual dispatch triggers but no issue-write permission or issue mutation in their current default versions.

## Key technical conclusion

GitHub Actions concurrency gives at most one running workflow in a concurrency group; `queue: max` allows 100 pending runs, but FIFO order is not guaranteed and excess runs are rejected/cancelled. This is a useful Supervisor-run mutex, not a lock against human or unrelated workflow Issue mutations.

GitHub Issues label PATCH is not CAS. GitHub Create a reference returns documented 201/409/422 outcomes and requires Contents: write, but the docs do not establish a formal transactional claim guarantee. Adding Contents: write to current Supervisor would expand authority materially. A separate state repository or conditional-write database would need its own least-privilege and free-tier qualification.

## Durable artifacts

- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Design decision record: [DURABLE-SUPERVISOR-CLAIM-DESIGN-2026-11-06](../architecture/DURABLE-SUPERVISOR-CLAIM-DESIGN-2026-11-06.md)
- Related PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37

## Actions not taken

No source/workflow changes, no merge, no dispatch, no Worker/DSH/Resource Probe run, no provider/model calls, no secrets read, no credentials created, no permissions changed, no service provisioned, no deployment, no paid fallback.

## Disposition

- Design record: CREATED.
- Issue #38: CREATED / PLANNED.
- PR #37 exact-head CI: VERIFIED.
- Independent review: NOT RUN.
- Claim backend: NOT SELECTED / NOT QUALIFIED.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step

Select and qualify a least-privilege conditional claim backend, or formally accept a limited single-writer prototype that does not run provider/model or untrusted-code workloads. Keep PR #37 draft and dispatch gates fail-closed.


## Additional PR #37 hardening — exclusive managed task state

- During source-level review, Worker validation was found to accept an Issue carrying `pool:claimed` together with another managed lifecycle label (for example `pool:ready`). Supervisor read-back rejected this conflict, but Worker should independently enforce the invariant.
- Updated Worker validation to require exactly one managed state among `pool:ready`, `pool:claimed`, `pool:probe-complete`, `pool:needs-review`, `pool:invalid`, and require that state to be `pool:claimed`.
- Added a focused security test and added the same invariant to the pool contract validator.
- New PR #37 HEAD: `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- Exact-head checks:
  - Reusable Pool Worker Boundary Validation: run `42284044591`, job `128120166723`, SUCCESS.
  - Pool Contract Validation: run `42284051311`, job `128120184802`, SUCCESS.
- GitHub also emits a push run named `.github/workflows/pool-worker.yml` (run `42284042173`) with no jobs and conclusion failure because the Worker is intentionally `workflow_call`-only. This is not a Worker execution and not one of the two PR validation checks. No Worker was run.
- This is same-session implementation and self-review, not independent review. PR remains DRAFT / OPEN / UNMERGED; reviews/comments 0/0.
- No merge, dispatch, provider/model call, secret access, deployment, or change to dispatch gates.


## Claim design reconciliation — 2026-11-06

- Refreshed Issue #38 immutable context to PR #37 HEAD `5587a4e013507b5be330fd0c49ce1fc836faa946` and exact-head validation runs `42284044591` / `42284051311` (both SUCCESS).
- Updated durable-claim ADR baseline and added the exclusive managed-state implementation delta. It is a consistency guard only, not CAS/exactly-once.
- PR #37 remains OPEN / DRAFT / UNMERGED; reviews and inline comments 0/0; independent review NOT RUN.
- Live Ruleset `26550182` active but requires zero approvals and does not enforce CODEOWNERS review. Governance still does not guarantee independent approval.
- Issue-label updates remain non-CAS; no claim backend selected. Dispatch remains BLOCKED / FAIL-CLOSED.
- No merge, dispatch, Worker/DSH/Resource Probe execution, provider/model calls, secrets, deployment, credentials, permissions or paid services.
