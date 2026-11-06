# 2026-11-06 — Single-use Git marker protocol and adversarial acceptance specification

## Refreshed evidence
- Default branch Основной: 64d2636d4500127e635c214ccfb722c6b3fcda80.
- Active ruleset 26550182 targets refs/heads/Основной only; PR required, approvals=0, CODEOWNERS review=false, no bypass actors. No tag protection evidenced.
- PR #12 OPEN/DRAFT/UNMERGED; head 6c053bacff29ca8efb5fdb759edd44fcd416b749; fixture 42041946049 SUCCESS and contract 42041945700 SUCCESS; reviews empty.
- PR #15 OPEN/DRAFT/UNMERGED; head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; contract 42038004176 SUCCESS; reviews empty.
- PR #27 OPEN/DRAFT/UNMERGED; current head 7a7b05ec3a1581303c6207aaeaadba2ba3305a88; exact-head run lookup empty => CI NOT VERIFIED; reviews empty.

## Protocol proposal — not implemented

### A. Trusted approval preconditions
Before marker creation, Supervisor must resolve the owner numeric ID from trusted repository configuration/API metadata; fetch the comment from the canonical repository/issue API endpoint; verify repository ID, issue number/URL, comment ID, author numeric ID and owner identity; validate the immutable task envelope (target SHA, allowlisted profile/capabilities, bounded scope, budget, expiry and canonical digest); reject edited/deleted/expired/duplicate/malformed/wrong-owner/wrong-repository/wrong-issue comments; re-fetch immediately before consumption. Event payload and user-supplied fields are not authority.

### B. Marker identity and content
- Namespace: refs/tags/pool-consumed/<approval-comment-id>, derived only from the trusted comment ID.
- Create an annotated tag object with canonical payload: schema version, repository ID, issue number, approval comment ID, owner numeric ID, target SHA, profile/capability digest, envelope digest, expiry and timestamp. It points to the exact immutable task commit.
- Creating a tag object does not create its ref. Create the ref only after all approval checks.
- GitHub Create Reference documents 201 Created, 409 Conflict and 422 validation/spam outcomes. On 201, read back the exact ref and tag object and verify every field. On 409, do not infer success: read and compare exact object/payload. Any mismatch, missing object, timeout, 403/404/5xx, malformed response or inaccessible read => needs-review, no dispatch.
- A deterministic unique ref name is a create-if-absent collision boundary, not a transaction.

### C. Proposed tag ruleset
- Dedicated active tag ruleset targeting refs/tags/pool-consumed/*.
- Restrict tag update and deletion; leave tag creation unrestricted; bypass list empty.
- Do not add the creating App as a bypass actor: bypass could defeat the immutability restriction.
- Verify with a disposable non-production tag: ordinary authorized creation succeeds, update/delete are denied. If the effective ruleset semantics do not permit this exact combination, stop and choose another primitive; do not weaken protection.
- Current branch ruleset 26550182 does not cover tags. No tag ruleset is evidenced.

### D. Crash and dispatch semantics
Marker creation and workflow dispatch are separate API operations. Crash after marker creation but before dispatch means consumed approval without proven execution: mark needs-review and require fresh owner approval; never replay automatically. Timeout after create requires exact read-back, not blind retry. Timeout after dispatch requires reconciliation of the expected run/task identity; ambiguity means needs-review and no second dispatch. This is not exactly-once execution.

## Adversarial acceptance matrix
| Case | Expected outcome |
|---|---|
| Concurrent duplicate attempts | One ref creation wins; loser verifies same payload; no second dispatch |
| Existing marker with different payload/object | BLOCKED; no dispatch |
| Existing marker with exact payload | Already consumed; never dispatch again |
| 409 from Create Ref | Exact read-back; not success by status alone |
| 422/403/404/5xx/timeout/truncated response | Fail closed; no dispatch until authoritative reconciliation |
| Tag object created but ref creation fails | Orphan object harmless; no dispatch |
| Ref created, process crashes before dispatch | needs-review; fresh approval required |
| Dispatch timeout | Reconcile expected run; ambiguity => needs-review |
| Comment edited/deleted/expired before consume | Re-fetch detects; no marker/no dispatch |
| Wrong repository/issue/author/comment/task SHA/profile/budget/digest | Reject before marker |
| Marker update/delete attempted | Denied by verified active tag ruleset, otherwise NOT QUALIFIED |
| Direct Worker workflow_dispatch possible | Gate fails |
| Caller repo/workflow/path/ref/SHA mismatch | Reject before checkout/install |
| Bypass actor unexpectedly present or protection disabled | Governance gate fails |

## Implementation boundary
Implement only after tag ruleset behavior is verified on a disposable non-production tag and Environment/reviewer design is resolved. Supervisor is sole queue-state writer; Worker must not mutate issue labels/comments. Convert Worker to workflow_call-only and Supervisor to static local reusable invocation in one coherent reviewed transition. Remove privileged workflow_run and stale-claim auto-requeue; ambiguous state => needs-review. Test actual production Worker context, not a fixture. Require exact-head CI, independent security review, governance read-back and explicit acceptance before runtime dispatch.

## Status
- Protocol DESIGN PROPOSED; not implemented.
- Tag ruleset NOT CONFIGURED / NOT VERIFIED.
- Environment configuration NOT VERIFIED.
- PR #12/#15 static CI SUCCESS on observed heads; reviews NOT RUN.
- PR #27 exact-head CI NOT VERIFIED; reviews NOT RUN.
- Dispatch, Worker, DSH, provider/model calls, secret reads and deployment NOT RUN.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Official references
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/rest/git/refs#create-a-reference
- https://docs.github.com/en/rest/git/tags
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments

## Next bounded step
Read-only verify tag-ruleset and Environment API capabilities/configuration through an authorized path. If read access is unavailable, keep this design-only. Do not create tags, Environments or rulesets in this pass.
