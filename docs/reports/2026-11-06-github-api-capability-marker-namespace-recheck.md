# 2026-11-06 — GitHub API capability and marker namespace recheck

## Refreshed immutable state
- Default branch Основной HEAD: 64d2636d4500127e635c214ccfb722c6b3fcda80.
- PR #12: OPEN/DRAFT/UNMERGED, head 6c053bacff29ca8efb5fdb759edd44fcd416b749; exact-head fixture run 42041946049 SUCCESS and Pool Contract Validation 42041945700 SUCCESS; formal reviews empty.
- PR #15: OPEN/DRAFT/UNMERGED, head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; exact-head Pool Contract Validation 42038004176 SUCCESS; formal reviews empty.
- PR #27: OPEN/DRAFT/UNMERGED, current head f10db507660c2945642e99e23f957025058e27c5; exact-head PR-triggered workflow run query returned no runs, therefore CI NOT VERIFIED; formal reviews empty.
- Active ruleset 26550182: target=branch; condition includes refs/heads/Основной; enforcement=active; PR required; required_approving_review_count=0; require_code_owner_review=false; required_reviewers=[]; bypass_actors=[]; current_user_can_bypass=never. This is not tag protection.
- Branch endpoint reports protected=false / legacy branch protection disabled. This does not negate the active repository ruleset, which was separately read and is effective for the matching branch.
- Repository ruleset collection currently returns exactly one ruleset, ID 26550182. No tag ruleset is present in the returned collection.
- GET /git/matching-refs/tags/pool-consumed/ returned []: no matching marker refs currently exist.

## Environment API access boundary
- GitHub's official REST documentation says List Environments is readable by anyone with repository read access for public resources; fine-grained tokens need Actions: read. Public repository Environments and deployment protection rules are available across current plans.
- The connected GitHub action rejected GET /repos/VlDMlNSh/developer-cloud-pool/environments as a disallowed endpoint (HTTP 400 from connector allowlist). This is a connector restriction; it does NOT establish that the repository has no Environments.
- Actual Environment list/configuration, reviewer list, prevent-self-review and bypass state therefore remain NOT VERIFIED.
- Official docs: https://docs.github.com/en/rest/deployments/environments ; https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens

## Ruleset API capability
- Official GitHub repository ruleset API supports target values branch, tag and push; tag rulesets can match ref-name patterns. The current repo ruleset collection contains only a branch ruleset, no tag ruleset.
- Official docs: https://docs.github.com/en/rest/repos/rules ; https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- No ruleset write attempted.

## Conclusions
1. No marker refs or tag ruleset exist in current API read-back. The marker protocol remains design-only.
2. Environment configuration is not inspectable through the connected GitHub API action. Do not infer absent/present or ask for secret material.
3. The branch ruleset is active but does not require independent approval; it is not an acceptance-grade review gate.
4. PR #27 latest head has no discoverable PR-triggered CI runs; exact-head CI NOT VERIFIED.
5. No configuration mutation, tag creation, Environment creation, dispatch, Worker/DSH execution, provider/model calls, secret reads or deployment occurred.
6. Contour A NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Continue with read-only repository inspection and protocol validation: inspect current ruleset schema/branch-vs-tag semantics and production workflow contracts; do not create tags or Environments. Environment configuration remains NOT VERIFIED until an authorized read path is available.
