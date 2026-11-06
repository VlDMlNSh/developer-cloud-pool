# 2026-11-06 — GitHub-native Environment and single-use marker design review

## Scope and immutable observations
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`; this report is documentation-only.
- PR #12: OPEN / DRAFT / UNMERGED; exact head `6c053bacff29ca8efb5fdb759edd44fcd416b749`; fixture run `42041946049` SUCCESS; Pool Contract Validation run `42041945700` SUCCESS; formal reviews empty.
- PR #15: OPEN / DRAFT / UNMERGED; head `c57f2ab3f2b91bf6b3e413640f65ec518008b75e`; formal reviews empty.
- PR #27: OPEN / DRAFT / UNMERGED; head `e289e97bbffeb0196a03226f9a052856dfa5567f`; formal reviews empty.
- Active repository ruleset `26550182` targets only `refs/heads/Основной`. It enforces PRs, deletion and non-fast-forward restrictions; required approving reviews = 0, CODEOWNERS review = false, required reviewers = [], bypass actors = []. It does not target tags.
- Environment-list API read was not available through the current read connector. Environment existence/configuration therefore remains NOT VERIFIED; no Environment or ref was created and no setting changed.

## GitHub-native options

### 1. Actions Environment — human approval gate, not nonce storage
GitHub documents Environments, deployment protection rules and required reviewers as available in public repositories on GitHub Free. Required reviewers can include up to six people/teams; only one needs to approve. Prevent-self-review is configurable. GitHub Free's required reviewers are only available for public repositories.
- Official docs: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- Protection behavior: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- Review/bypass behavior: https://docs.github.com/en/actions/how-tos/managing-workflow-runs-and-deployments/managing-deployments/reviewing-deployments

Implications:
- This repository is public, so the documented plan boundary does not rule out a required-reviewer Environment.
- Environment approval gates a particular waiting workflow job; it is not a durable, application-defined nonce ledger and does not atomically consume an Issue comment ID.
- The current repository ruleset's empty bypass list is not evidence that Environment bypass is disabled. Environment has its own bypass setting; it must be read back explicitly. GitHub documents that administrators can bypass by default unless the Environment is configured to disallow bypass.
- Prevent-self-review blocks the workflow initiator from approving their own deployment, but the project has not established an independent second reviewer. A one-owner approval model may therefore deadlock or fail the intended owner-only flow.
- Do not configure an Environment until the identity/reviewer model, bypass policy and actual API read-back are accepted.

### 2. Git reference — potential uniqueness primitive, not a complete transaction
GitHub's Create a reference endpoint documents HTTP 201 for creation, 409 for conflict and 422 for validation/spam. A unique precomputed ref name can therefore provide a useful create-if-absent race boundary. The endpoint requires Contents: write for fine-grained credentials.
- Create ref API: https://docs.github.com/en/rest/git/refs#create-a-reference
- Git tag objects: https://docs.github.com/en/rest/git/tags
- Tag rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets

Limitations and requirements:
- Create a signed/annotated tag object containing a canonical, bounded payload (owner numeric ID, repository/issue identity, approval comment ID, immutable task SHA, profile/capability, envelope digest, expiry, schema version); then create one uniquely named `refs/tags/pool-consumed/<approval-id>` reference.
- A tag object is immutable content-addressed data, but the tag ref can still be moved/deleted unless an active tag ruleset restricts updates/deletions. The current active ruleset applies only to the default branch; no tag protection is evidenced.
- A 409 means the name already exists, not that the existing object is the correct authorization marker. On 409 or timeout, fetch the exact ref and tag object, validate every payload field and expected object type/SHA, and treat mismatch, missing data or read failure as BLOCKED / needs-review. Never interpret conflict as successful consumption by itself.
- Create-if-absent serializes competing attempts for the same ref name, but does not make the subsequent dispatch part of the same transaction. A crash after marker creation and before invocation leaves a consumed approval without a Worker run; recovery must remain needs-review or require a fresh approval, not silently replay.
- The marker does not prove who approved the issue comment. Trusted owner identity, trusted API retrieval, repository/issue association, comment edit/deletion re-fetch and expiry checks must precede marker creation.
- Do not claim exactly-once execution. At most, the ref can act as a durable single-name claim if tag protections and read-back semantics are proven.

## Decision matrix

| Mechanism | What it provides | What it does not provide | Current decision |
|---|---|---|---|
| Actions Environment required reviewer | Human gate for a workflow job; public-repo GitHub Free eligibility | Durable app nonce, atomic comment consumption, transaction with dispatch | Candidate secondary gate; reviewer and bypass policy unresolved |
| Unique Git ref/tag | Create-if-absent name collision boundary; durable Git object/reference | Trusted owner approval, immutable ref without tag ruleset, atomic dispatch, exactly-once | Stronger candidate for single-use claim after tag ruleset and race tests |
| Actions concurrency group | Serializes/limits concurrent jobs | Transactional CAS, durable nonce ledger, exactly-once | Coordination aid only |
| Issue comment alone | Human-readable approval evidence | Atomic consumption or replay prevention | Insufficient |

## Required acceptance tests before implementation
1. Concurrent duplicate attempts: exactly one successful ref creation; loser reads and validates same marker.
2. Pre-created marker with wrong object/payload: BLOCKED, no dispatch.
3. API timeout after create: read-back reconciliation; no blind retry.
4. Crash after marker creation and before invocation: remains needs-review; no implicit replay.
5. Marker ref update/delete attempts are denied by a read-back-verified active tag ruleset with no inappropriate bypass.
6. Wrong repository, issue URL, author ID, comment ID, target SHA, profile, envelope digest, expired/deleted/edited comment all fail closed.
7. Production Worker caller context and workflow identity are validated before checkout/install; direct workflow_dispatch is impossible.
8. Environment reviewer, prevent-self-review, deployment branch restrictions and admin bypass settings are independently read back if Environment is retained.
9. Exact-head CI, independent security review, governance read-back and owner acceptance before any runtime dispatch.

## Status and conclusion
- Environment Free/public eligibility: VERIFIED from current official docs; actual repository Environment configuration: NOT VERIFIED.
- Ruleset: VERIFIED active branch-only ruleset with zero required approvals; no tag protection evidenced.
- Git ref create semantics: VERIFIED from official REST docs (201/409/422); application-level race/recovery behavior NOT IMPLEMENTED / NOT TESTED.
- No environment/ref/ruleset mutation, no dispatch, no Worker/DSH, no model/provider calls, no secret reads, no deployment.
- PR #12/#15/#27 remain DRAFT / UNMERGED / zero formal reviews.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Draft a minimal tag-ruleset and marker protocol specification plus adversarial test matrix; inspect the actual Environment API through an authorized read path before deciding whether to add it. Keep all runtime dispatch disabled.
