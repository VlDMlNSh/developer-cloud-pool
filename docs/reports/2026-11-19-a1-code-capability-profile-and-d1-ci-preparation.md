# 2026-11-19 — A1 CODE capability profile and D1/CI preparation

**Status:** A1 contract proposal committed; integration NOT VERIFIED; Contour A BLOCKED / NOT ACCEPTED.  
**Base:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Working branch:** `feat/a1-jarvis-code-sandbox-profile-2026-11-19`.  
**Latest commit at report creation:** `53ad46704e283b4e010d0276c9437ae9e16ebfb8`.  
**Dispatch:** MUST remain disabled.

## Work completed

1. Re-read current default branch, open PRs, ruleset, workflow runs, D1 PR #143 and current branch contents before editing.
2. Created a clean branch directly from immutable current default SHA `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; no old PR branch was merged or used as base.
3. Added `docs/contracts/CODE-CAPABILITY-PROFILE-JARVIS-CODE-SANDBOX-V1.md` defining the owner-confirmed immutable ID `jarvis-code-sandbox-v1`, schema version, CODE capability class, identity separation, allowed/denied operations, sandbox requirements, proposed resource ceilings, deny-by-default network policy, artifact controls, revocation/lease fencing, D1 binding requirements and qualification tests.
4. Marked resource ceilings explicitly PROPOSED and NOT OWNER-APPROVED. The conversational confirmation approved the identifier only; it did not approve runtime limits or network exceptions.
5. Kept dispatch disabled and made no provider calls, secret reads, deployments, executor launches, or production changes.

## D1 substrate findings

- PR #143 is an existing isolated D1 ledger/lease proof. Its exact historical head was `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`; it is not based on current default HEAD and must not be merged directly.
- Historical exact-head CI for that PR reported success for Isolated D1 Ledger Proof and Pool Contract Validation. Those runs do not validate this new branch.
- Selective source inspection found `dsh-headless-probe` references in the historical D1 README, migration `0001`, `claim-outbox.mjs`, `consume.mjs`, and `trusted-executor-registry.mjs`. The first ten and next ten core files inspected also show profile concerns are not confined to one SQL migration.
- Repository-wide code search returned zero with `incomplete_results=true`; this is NOT evidence that no other references exist. A complete local checkout/search or exhaustive Git tree/blob scan remains required.
- Existing integrated route/D1 contract requires route qualification evidence, account/quota identity, exact SHA/profile/task/attempt bindings, atomic approval consumption + admission + attempt + outbox, and fail-closed reconciliation. This remains normative; the new profile contract complements rather than replaces it.

## CI and governance

- No test suite has been run on this branch yet.
- No exact-head CI result exists for commit `53ad46704e283b4e010d0276c9437ae9e16ebfb8` at report time.
- PR #143 historical CI is not transferable evidence.
- The current ruleset is active, but its complete enforcement behavior and required checks must be re-read before merge.
- No merge, deployment, live executor, provider route, or independent acceptance is claimed.

## Blockers

1. Profile runtime ceilings need owner review before they can become authoritative.
2. D1 source needs selective transplant onto this clean branch, including migration ordering and exact profile/version constraints.
3. Repository-wide legacy-profile inventory is incomplete.
4. Negative tests for null/legacy/unknown/disabled/revoked/mismatched profile and stale lease replay are not yet implemented or run.
5. Exact-head CI and independent security review are NOT VERIFIED.
6. Live CODE executor, provider egress, hosted-use entitlement, persistent worker and remote UI remain NOT QUALIFIED / NOT ACCEPTED.

## Next bounded step

Complete an exhaustive profile-reference inventory, then transplant the D1 ledger substrate onto this branch without re-enabling legacy dispatch. Add database-level positive and negative profile tests, connect the proof workflow to the branch, run exact-head CI, inspect job logs and artifacts, and update the context window/checkpoint. Keep production dispatch disabled.
