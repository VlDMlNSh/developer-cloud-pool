# Engineering report — 2026-11-04: Pool Worker input boundary and governance recheck

## Scope and immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Base branch: `Основной`
- Base SHA: `4597617db0de7cc698cce936a540594ee3d25bf2`
- Work branch: `fix/worker-shell-input-escaping-2026-11-04`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/3

## Security finding

The original `.github/workflows/pool-worker.yml` embedded the untrusted `${{ inputs.task_issue }}` expression directly inside the Bash source of the DSH probe step's summary block. Workflow-dispatch inputs are strings and must not be interpolated into shell program text. A crafted value could be interpreted by Bash before the validation job's separate runtime checks can protect the probe step.

## Change prepared

- Added `TASK_ISSUE: ${{ inputs.task_issue }}` to the probe step environment.
- Replaced direct expression interpolation in the Bash body with `$TASK_ISSUE`.
- Kept the task issue input as data rather than shell source.
- No dispatch permissions, feature gates, worker profiles, DSH version, or model routing were changed.

## Evidence

- Original worker workflow blob: `3ddb0038a8336214acc74717804562173c8eaa25`.
- Updated worker workflow blob after patch: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Commit initially containing the fix: `530efe43cedf19177145cda735f5f15b4e290a98`.
- Re-read the updated file from the work branch and confirmed the probe step uses the environment variable and the unsafe direct interpolation is absent from the shell body.
- Exact PR-head check-runs at the time of this report: 0; combined status: pending with no contexts. CI is NOT VERIFIED.
- PR remains open and unmerged.

## Governance recheck

Ruleset ID `26535481`, name `Основной`, reports active enforcement, but the latest API response still shows:
- `conditions.ref_name.include = []` and `exclude = []`; exact branch scope is NOT VERIFIED.
- `require_code_owner_review = true`.
- `require_extra_approval_for_unattributed_changes = true`.
- `required_approving_review_count = 0`.
- deletion and non-fast-forward restrictions are present.

This differs from the owner's Issue #2 comment stating that branch scope and the two review options were corrected. The API configuration remains the authoritative observed state; the comment alone is not proof of a saved configuration change. The default branch API still reports `protected: false`; classic branch-protection detail is unavailable to this integration.

The owner has stated that editing the settings is not possible. No additional owner action is required for this security patch; governance remains NOT VERIFIED and dispatch remains BLOCKED.

## Runtime and dispatch status

- Pool Supervisor runs observed on target base SHA: two successful heartbeat/reconciliation runs.
- Resource Probe: NOT RUN.
- DSH headless evaluation: NOT RUN.
- Pool Worker lifecycle: NOT RUN.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED through the available API; owner comment says unset/false.
- No model call, provider secret access, paid fallback, local deployment, or agent dispatch was performed.

## Verification and acceptance status

- Change implementation: COMPLETE ON PR BRANCH.
- File re-read and blob SHA verification: VERIFIED.
- Static source inspection for the identified shell interpolation: VERIFIED.
- YAML parser / actionlint validation: NOT RUN.
- Exact-head GitHub Actions CI: NOT VERIFIED.
- Independent security review: NOT RUN.
- Merge / acceptance: NOT ACCEPTED.

## Next step

Inspect PR #3, run or await exact-head workflow validation, and merge only after review and applicable repository governance checks. Separately resolve ruleset scope/review configuration through an authorized GitHub settings path before enabling supervisor dispatch.
