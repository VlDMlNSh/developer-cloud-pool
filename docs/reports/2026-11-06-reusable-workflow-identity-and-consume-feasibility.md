# 2026-11-06 — Reusable workflow identity and durable-consume feasibility pass

## Scope and immutable refs
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Latest default-branch commit search result: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- That commit is a revert removing a misplaced report only; compare `64d2636d4500127e635c214ccfb722c6b3fcda80...197ba98d0dc7d8437d759dd25bee8750d02e59ae` is 2 commits ahead / 0 behind, and production workflow/script blobs remain unchanged.
- Production Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Production Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Production Supervisor script blob: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- PR #32 remains OPEN / DRAFT / UNMERGED; head `75c83a288d865f1bbeda4905cf817e00084bcc2d`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; reviews 0, inline threads 0.

## Reusable-workflow context correction
Official GitHub Actions documentation distinguishes two identity contexts:
- The `github` context in a called reusable workflow remains associated with the caller workflow. Caller identity evidence includes `github.repository`, `github.repository_id`, `github.workflow_ref`, and `github.workflow_sha`.
- The `job` context identifies the workflow file defining the current job. In a reusable workflow this is the called workflow; useful fields are `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha`.
- Therefore caller and callee identity must be checked separately. Do not treat `job.workflow_*` as caller identity or `github.workflow_*` as the called file identity.
- Official sources: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts and https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows

## Test harness update
- Added an eighth negative-first assertion requiring the production Worker source to validate both caller and callee identity from their distinct contexts.
- Test blob: `6bf7cf9583766fb57972a0b82ec27cc2b6e90eeb`.
- Integrated contract updated with the same context distinction; contract blob: `efb2fa99346d8020361cb41c4fc03786da2e36be`.
- Exact-head CI for final PR head `75c83a288d865f1bbeda4905cf817e00084bcc2d`: NOT VERIFIED; current workflow-run lookup returned no runs.
- Earlier run `42235842885` / job `127953095784` failed 8/8 at a preceding head. Seven failures reflected existing production gaps; the eighth caller-context assertion itself was over-escaped at that head and was corrected afterward. Do not use that run as evidence for the corrected eighth assertion.
- Same preceding head's Pool Contract Validation run `42235843082` / job `127953098082` completed SUCCESS; this is not authorization qualification.
- No local test run was possible from this GitHub-only source view. The latest head's tests remain NOT VERIFIED until exact-head CI is observed.

## Durable single-use marker feasibility
- GitHub documentation confirms tag rulesets can target tag patterns and independently restrict creation, update and deletion. Sources: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets and https://docs.github.com/en/rest/repos/rules
- Candidate design to investigate (not implemented): approval-event-ID-derived tag name; allow creation by the Supervisor token; restrict updates and deletions; no bypass actors; create the ref once and require exact payload read-back. An unauthorized/preemptive tag collision must fail closed and become needs-review, never dispatch.
- This is only a candidate. No repository tag ruleset was read back, no disposable tag operation was attempted, no create/update/delete behavior was tested, and effective token permissions were not verified. Git tags are NOT VERIFIED as the project's durable consume primitive.
- The available GitHub connector actions in this session expose no repository-ruleset read/write operation. No ruleset, variable, Environment or secret setting was changed or read.

## Safety and scope
- No production workflow or script changed.
- No dispatch, Worker, Supervisor runtime, DSH, provider/model call, secret read, variable/Environment/ruleset mutation, deployment or paid resource.
- PR #32 remains draft and unmerged. Independent security review NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step
1. Obtain exact-head CI for PR #32 at `75c83a288d865f1bbeda4905cf817e00084bcc2d`; confirm the corrected caller/callee assertion fails only because production Worker lacks the required identity checks.
2. Independently obtain authorized read-only tag-ruleset and Actions permission metadata. If unavailable, keep the durable consume design BLOCKED rather than assuming tag immutability.
3. Only after the consume primitive is proven, implement the Worker reusable boundary and Supervisor-only state machine together. Keep all execution disabled.


## Final-head CI read-back
- PR #32 final head `75c83a288d865f1bbeda4905cf817e00084bcc2d`, merge commit `86fbe64076bb67307409a7584bd2e2d7bfd05954`.
- Exact-head Pool Authorization Negative-First Validation: run `42236017811`, job `127953700048`, COMPLETED / FAILURE. Node summary: 8 tests, 0 passed, 8 failed. The eighth caller/callee-context assertion is now correctly expressed and fails because production Worker contains no explicit `github.repository/repository_id/workflow_ref/workflow_sha` caller checks and no `job.workflow_repository/workflow_file_path/workflow_sha` callee checks. The other failures reproduce the already-known Worker/Supervisor authorization gaps. This is a red baseline, not an authorization pass.
- Same exact head Pool Contract Validation: run `42236017724`, job `127953700415`, COMPLETED / SUCCESS. This validates the existing static pool contract only; it does not override the authorization failure.
- The previous run `42235842885` at a preceding head is superseded. Its caller-context assertion was over-escaped; final-head run above contains the corrected assertion.
- PR remains OPEN / DRAFT / UNMERGED; reviews 0, inline threads 0; independent review NOT RUN.
