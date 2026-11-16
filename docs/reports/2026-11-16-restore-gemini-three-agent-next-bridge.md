# 2026-11-16 — Restore per-/next Gemini three-agent bridge

## Finding
The three-agent path was not absent. It was incorrectly treated as unavailable because the previous pass searched only the Cloud Pool default workflow directory and did not reconcile the persisted bridge procedure. The authoritative controller is intentionally in MediaHub OS and is supplementary to the Cloud Pool Contour A main pass.

## Current source evidence
- MediaHub repository default branch: main; current controller blob SHA 7799f0fc713c5bd772ce6820df40a926a83445c8.
- Controller: .github/workflows/gemini-batch-dispatch-controller.yml, issue_comment.created event for exact /next on Issue #301 by OWNER, plus workflow_dispatch modes.
- Controller has explicit batch admission variable MEDIAHUB_GEMINI_BATCH_ENABLED; dispatch is fail-closed unless it is true. It requires MEDIAHUB_GITHUB_TOKEN and MEDIAHUB_DISPATCH_HMAC_KEY at runtime; secret values must never be read or printed.
- The controller HMAC-signs three distinct child tasks, binds a common immutable target SHA, generates unique correlation IDs, suppresses duplicate source-comment dispatches, and monitors child runs/jobs/artifacts.
- Agent 1 workflow blob: ed9ae2200debe76e39e3e5dfb5816ba94db3950c.
- Agent 2 workflow blob: fa3b4c407d3c583cbd33133aea89e4bd8a496b69.
- Agent 3 workflow blob: bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e.
- All three child workflows require controller-generated dispatch ID, immutable target SHA, bounded task, allowlisted base_ref/scope and HMAC signature; each verifies signature before provider credentials.

## Persisted operational procedure discovered
Cloud Pool branch docs/gemini-three-agent-next-bridge-2026-11-15 contains:
- docs/operations/CHATGPT-GEMINI-NEXT-WORKING-CONFIGURATION.md blob 0dbc603fcf06bf869a9316bebbe046e7cd2fedbb.
- docs/reports/2026-11-15-gemini-three-agent-next-bridge-recovery.md blob 918ce46af07b60325f7ddc09695c8cd0f46f5400.
The procedure says: on each exact ChatGPT /next, reconcile Issue #301 and existing controller runs first; if no current-turn event exists, create exactly one owner-authored comment with exact body /next using the authorized GitHub issue-comment action; never directly dispatch child workflows or call Gemini APIs; then reconcile controller and exactly three child run/job/artifact records. Continue Cloud Pool work independently; Gemini must not block it.

## Current-turn handling
This user message requests restoration of the operating convention and is not the exact command /next. Therefore no new Issue #301 comment was created for this turn. Latest fetched Issue #301 comments include owner-authored exact /next events through comment ID 6914365822; do not treat any prior comment as this turn's event.
The authorized GitHub action mcp__GitHub__add_comment_to_issue is available and creates an issue conversation comment. Use it on Issue #301 only after confirming no duplicate current-turn event. No controller/child run for this non-/next turn was initiated.

## Correct per-/next behavior going forward
1. Refresh Cloud Pool and MediaHub source state; pin immutable target SHA for this wave.
2. Fetch Issue #301 comments and controller run history; correlate by comment ID and title next-comment-<comment-id>. Reuse an event only if demonstrably created for the current turn; never double-post.
3. For an exact new /next with no matching event, create one owner-authored Issue #301 comment with body exactly /next via mcp__GitHub__add_comment_to_issue. This is the approved controller event bridge; do not use workflow_dispatch directly.
4. Verify controller run, readiness/admission and dispatch monitor. Verify exactly three child run IDs, authorization and execution jobs, completed conclusions and non-expired artifact SHA-256 digests. Record DISPATCHED/RUNNING/SUCCEEDED/VERIFIED distinctly. Missing or inaccessible evidence is NOT VERIFIED.
5. Assign bounded Contour A tasks: Agent 1 implementation/research; Agent 2 contract/tests; Agent 3 security/provenance. All share same immutable target SHA. The controller's built-in task prompts are already bounded; do not dispatch child tasks outside that contract.
6. In parallel, complete one independent Cloud Pool engineering pass. Do not wait for Gemini; incorporate verified outputs on later turns.
7. Update Cloud Pool Context Window and report with source comment ID, controller run ID, child run/job IDs, artifact digests, and independent Cloud Pool SHA/test evidence.

## Scope boundary
This is a MediaHub-hosted event bridge for supplementary Gemini agents, not a Cloud Pool-native Supervisor/Worker and not proof of Contour A acceptance. Keep Cloud Pool POOL_DISPATCH_ENABLED fail-closed. No provider/secret values, no paid fallback, no merge/deploy/qualification by default. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Historical proven baseline
The configuration branch records five previous successful controller waves, including wave 332:
- Source comment 6899094688; controller 43746281426.
- Agent runs 43746301766, 43746303789, 43746305744.
- All three child authorization/execution jobs succeeded; non-expired artifacts had SHA-256 digests recorded in the persisted config.
These are historical proofs of the bridge at that time, not current-turn execution.

## References
- MediaHub Issue #301: https://github.com/VlDMlNSh/mediahub-os/issues/301
- Controller: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- Cloud Pool operating configuration: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/gemini-three-agent-next-bridge-2026-11-15/docs/operations/CHATGPT-GEMINI-NEXT-WORKING-CONFIGURATION.md
- Cloud Pool bridge recovery report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/gemini-three-agent-next-bridge-2026-11-15/docs/reports/2026-11-15-gemini-three-agent-next-bridge-recovery.md
- Cloud Pool Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
