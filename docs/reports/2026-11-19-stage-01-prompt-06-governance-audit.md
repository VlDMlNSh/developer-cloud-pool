# Stage 1 — Master Prompt 6: Rulesets and branch protection audit
Date: 2026-11-19
Status: VERIFIED for repository ruleset and branch metadata; classic branch-protection details and ruleset history NOT VERIFIED due connector permission denial.

## Immutable target
- Repository: VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Default HEAD: b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5
- Ruleset ID: 26550182

## Active repository ruleset
- Name: Основной — verified
- Enforcement: active; target branch refs/heads/Основной
- Rules: prevent branch deletion; prevent non-fast-forward updates; require pull requests.
- Pull request parameters: required approving review count = 0; stale reviews dismissed on push; required review thread resolution = true; no code-owner review; no last-push approval; allowed merge methods merge, squash, rebase.
- Bypass actors: empty; current_user_can_bypass = never.
- Created/updated: 2026-11-04 20:22:47 +03:00.

## Branch metadata and classic protection
- GET branch metadata reports protected=false and protection.enabled=false; required status checks enforcement is off and contexts/checks are empty.
- Direct GET /branches/Основной/protection returned HTTP 403 Resource not accessible by integration. Therefore detailed classic protection settings cannot be independently inspected.
- Ruleset history endpoint also returned HTTP 403.
- Ruleset listing with includes_parents=true returned one repository ruleset. This does not prove organization-level policies outside the accessible scope are absent.

## Assessment
- Positive: PR required; deletion and force-push blocked; bypass list empty; current actor cannot bypass; review-thread resolution required; stale approvals dismissed after push.
- Gap: approving review count is zero. Independent human approval is not enforced by this ruleset. Code-owner review and last-push approval are also disabled.
- Gap: required status checks are not enforced by branch metadata (protection disabled / enforcement off). Do not assume CI success is a merge gate.
- Qualification: ruleset is active, but this is not equivalent to full governance qualification. Classic protection details and ruleset history remain NOT VERIFIED due 403.

## Decision
Master Prompt 6 is VERIFIED for the active ruleset and branch metadata. Governance qualification is PARTIAL; recommend a later owner-approved policy change to require at least one independent approval and selected required status checks, after confirming available reviewer capacity and exact required check names. No settings changed.
PR #146 remains OPEN / DRAFT / UNMERGED. No merge, ruleset mutation, deployment, dispatch, or secret access occurred.
Actual elapsed duration: NOT MEASURED.
Next: Master Prompt 7 — reconcile Context Window and checkpoint against current GitHub state.