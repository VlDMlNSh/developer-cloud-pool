# Ruleset governance recheck — 2026-11-04 17:26 +03:00

## Scope and immutable targets

Repository: https://github.com/VlDMlNSh/developer-cloud-pool  
Repository ID: `1445644538`  
Default branch: `Основной`  
Default branch HEAD: `4597617db0de7cc698cce936a540594ee3d25bf2`  
Documentation/evidence branch: `docs/continuation-context-2026-11-04` (HEAD before this report: `07fe631c158106f39282c63e9326bf4d70b079f4`).

This report is an evidence update on the documentation branch only. It does not modify the default branch, repository settings, Rulesets, Actions variables, workflows, or dispatch configuration.

## Governance API findings

### Ruleset inventory

GET `/repos/VlDMlNSh/developer-cloud-pool/rulesets?includes_parents=true` returned exactly one repository ruleset:

- ID: `26535481`
- Name: `Основной`
- Target: `branch`
- Enforcement: `active`
- Updated: `2026-11-04T16:59:39.343+03:00`

No replacement Ruleset is present in the returned inventory.

### Exact Ruleset configuration

GET `/repos/VlDMlNSh/developer-cloud-pool/rulesets/26535481` returned:

- `conditions.ref_name.include = []`
- `conditions.ref_name.exclude = []`
- `deletion`: enabled
- `non_fast_forward`: enabled
- `pull_request.required_approving_review_count = 0`
- `pull_request.require_code_owner_review = true`
- `pull_request.require_extra_approval_for_unattributed_changes = true`
- `pull_request.required_review_thread_resolution = true`
- `bypass_actors = []`
- `current_user_can_bypass = never`

**Governance result: BLOCKED / NOT VERIFIED.** The active Ruleset still does not prove an explicit selector for `refs/heads/Основной`; both selector arrays are empty. CODEOWNERS review and extra approval remain enabled, contradicting the owner statement in Issue #2. The deletion and non-fast-forward protections are enabled. No bypass actors are configured.

The branch collection reports `protected: false` for `Основной`; classic branch-protection endpoint access is not established by this read. Do not interpret that single field as overriding Ruleset behavior, but do record that branch protection is not independently verified.

### Owner statements rechecked

- Issue #1 comment: owner reported PR required, approvals 0, force-push block and deletion prevention enabled; `POOL_DISPATCH_ENABLED` not enabled.
- Issue #2 comment: owner reported Ruleset scoped to `Основной`, CODEOWNERS review disabled, extra approval disabled, and dispatch variable unset/false.

The current Ruleset API response contradicts the scope and two review-setting claims in Issue #2. Owner statements are not substitutes for API evidence.

### Dispatch variable

The available GitHub connection does not expose repository Actions variables. Actual value of `POOL_DISPATCH_ENABLED`: **NOT VERIFIED**. Owner stated it remains unset/false. Do not enable dispatch or assume the variable value.

## Repository refs, Issues, PRs and CI

### Branches

- `Основной`: `4597617db0de7cc698cce936a540594ee3d25bf2`
- `docs/continuation-context-2026-11-04`: `07fe631c158106f39282c63e9326bf4d70b079f4` before this report
- `fix/worker-shell-input-escaping-2026-11-04`: `9a21c52afae02ac2b446d4ac1b5ae33fbbdad6df`
- `feat/media-intelligence-skills-2026-11-04`: `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`

### Issues

Issues #1 and #2 remain open. Their latest owner comments are present, but neither issue's requested governance acceptance has been demonstrated by the live Ruleset API.

- https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- https://github.com/VlDMlNSh/developer-cloud-pool/issues/2

### PR #3

https://github.com/VlDMlNSh/developer-cloud-pool/pull/3

- State: OPEN; head `9a21c52afae02ac2b446d4ac1b5ae33fbbdad6df`; base `4597617db0de7cc698cce936a540594ee3d25bf2`.
- Review submissions: empty.
- Exact-head check-runs: 0.
- Exact-head workflow runs: 0.
- Independent review: NOT RUN.
- PR branch worker workflow was re-read. Blob SHA `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`. It declares `TASK_ISSUE` in the step environment and uses `$TASK_ISSUE` in the shell summary. The remaining `inputs.task_issue` expression in `run-name` is workflow metadata, not Bash source interpolation.
- Static read-back of the intended shell-input mitigation: VERIFIED. YAML/actionlint and exact-head CI: NOT VERIFIED.

### PR #4

https://github.com/VlDMlNSh/developer-cloud-pool/pull/4

- State: OPEN; head `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`; base `4597617db0de7cc698cce936a540594ee3d25bf2`.
- Review submissions: empty.
- Exact-head check-runs: 0.
- Exact-head workflow runs: 0.
- Independent review: NOT RUN.
- Documentation claims and profile qualification remain subject to review; no merge is authorized by this report.

### Default-branch CI

At default HEAD `4597617db0de7cc698cce936a540594ee3d25bf2`, the Checks API returned two completed successful runs of `Reconcile approved task queue` (job IDs `126621590227` and `126606814699`). These are supervisor reconciliation/heartbeat checks only. The combined commit status endpoint returned `pending` with zero status contexts. No worker, DSH evaluation, or resource probe evidence is implied.

## Static workflow observations

Files on `Основной` were re-read:

- `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`
- `.github/workflows/pool-worker.yml`, blob `3ddb0038a8336214acc74717804562173c8eaa25`
- `.github/workflows/dsh-runtime-evaluation.yml`, blob `df8a3788cd8ff4ba5c5b1009298f6bd81b80344d`
- `.github/workflows/runner-resource-probe.yml`, blob `3b925d2ff7db77b669a1056b6ec04d4028640edf`
- `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`

Supervisor code has an explicit `POOL_DISPATCH_ENABLED === "true"` gate and exits in heartbeat-only mode otherwise. The supervisor workflow maps the repository variable into that environment variable. Since the variable value cannot be independently read, this is not a substitute for checking its actual value. Worker/DSH/Resource Probe were not dispatched.

## Decision and next actions

1. Keep `POOL_DISPATCH_ENABLED` unset/false. Its actual repository value remains NOT VERIFIED.
2. Do not start Worker, DSH, Resource Probe, or model-provider calls.
3. Create a new active Ruleset with explicit exact branch selector `refs/heads/Основной`, PR required, approvals 0, CODEOWNERS review OFF, extra approval for unattributed changes OFF, deletion restriction ON, non-fast-forward restriction ON, and no bypass actors.
4. Independently GET the new Ruleset and verify every field before removing Ruleset `26535481`. Never delete the existing Ruleset first.
5. The available GitHub integration provides Ruleset GET only; it does not provide a Ruleset create/update/delete action. Therefore creation is **BLOCKED on owner-side GitHub settings/API action**. No Ruleset mutation was attempted.
6. Recheck both PRs after exact-head CI and independent reviews become available. Do not merge while checks/reviews are empty.
7. Continue with safe static validation and documentation-only work on a non-canonical branch while governance is blocked.

## Execution record

- Worker/DSH/Resource Probe: NOT RUN.
- Model/provider calls: NOT RUN.
- Dispatch enablement: NOT RUN.
- Ruleset mutation: NOT RUN (write capability unavailable through the connected GitHub interface).
- PR merges: NOT RUN.
- Secrets/credentials: not read or exposed.
- No changes made to the default branch.

## Next step

Owner creates the replacement Ruleset while retaining the current Ruleset. Afterward, an independent API re-read must prove the replacement is active and correctly scoped before any removal of ID `26535481`.
