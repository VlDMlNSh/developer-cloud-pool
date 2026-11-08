# 2026-11-06 — PR #12 approval and reusable Worker traceability audit

## Scope and immutable targets
- Repository: VlDMlNSh/developer-cloud-pool.
- PR #12 exact head: 6c053bacff29ca8efb5fdb759edd44fcd416b749; base: 64d2636d4500127e635c214ccfb722c6b3fcda80.
- Review submissions: empty. PR remains OPEN / DRAFT / UNMERGED.
- Exact-head CI: Reusable Worker Context Fixture Caller run 42041946049 SUCCESS; Pool Contract Validation run 42041945700 SUCCESS.
- This is a source/contract audit only. No changes to runtime workflows, no dispatch, no secrets, no model calls.

## Traceability matrix

| Security property | PR #12 artifact | Evidence / gap | Status |
|---|---|---|---|
| Owner principal | scripts/pool-owner-approval.mjs | Compares numeric comment author ID to supplied ownerId. Trusted ownerId derivation and API fetch provenance are not wired into Supervisor. | PARTIAL |
| Approval bound to task | strict command parser | Checks issue number, target SHA, fixed profile, envelope digest in comment body. Does not verify comment's repository/issue URL association; caller must fetch from trusted issue endpoint. | PARTIAL |
| Edited approval rejection | parser | Requires updated_at === created_at. Unit test covers edited timestamp; no live API/event integration. | TESTED PURELY |
| Single-use approval | consumedCommentIds input + planApprovalConsumption | Consumed IDs are caller-supplied; no durable ledger, atomic claim, Git ref creation or transaction is implemented. Planner returns dispatchAllowed=true after validation without itself consuming durable state. | NOT IMPLEMENTED |
| Environment approval | ADR proposal + gated planner | Pure booleans/outcomes only. No Environment creation/configuration, reviewer/bypass/branch policy read-back or live post-gate revalidation. | NOT IMPLEMENTED |
| Immutable consume marker | ADR proposal + gated planner | Planner branches on string markerOutcome; no API adapter creates/reads an immutable tag/ref, verifies payload, handles 409/422 or races. | NOT IMPLEMENTED |
| Fail-closed dispatch reconciliation | pool-gated-dispatch.mjs | Pure state helper rejects ambiguous/rejected/no-run-ID outcomes; caller must supply trusted facts. No production dispatch adapter. | TESTED PURELY |
| Caller repository/ref | pool-worker-caller.mjs | Exact repository and Supervisor workflow_ref checked by pure helper. Not imported by Worker. | TESTED PURELY |
| Called workflow identity | pool-worker-caller.mjs | Checks job.workflow_repository and job.workflow_file_path, caller/callee SHA format and equality. Does not validate job.workflow_ref explicitly; same-SHA assumption is documented but not proven by fixture in all cases. | PARTIAL |
| Workflow_call-only Worker | production workflow | Default Worker still exposes workflow_dispatch and does not expose workflow_call. | NOT IMPLEMENTED |
| Static Supervisor invocation | production workflow | Supervisor still calls REST workflow_dispatch endpoint; no static `uses: ./.github/workflows/pool-worker.yml` job. | NOT IMPLEMENTED |
| Supervisor sole state writer | production Worker | Worker report job still has issues:write and mutates labels/comments. | NOT IMPLEMENTED |
| Remove privileged workflow_run | default Supervisor | Still present on Основной; PR #15 proposes removal but is not merged. | NOT IMPLEMENTED |
| Independent review/governance | PR and ruleset | PR review list empty; active ruleset has zero required approvals and CODEOWNERS review disabled. | NOT VERIFIED / BLOCKED |

## Additional implementation observations
1. The reusable context fixture invokes `reusable-worker-context-fixture.yml`, not the production `pool-worker.yml`; it validates GitHub context availability for the fixture only.
2. `pool-worker-caller.mjs` requires six string fields but does not require or compare `job.workflow_ref`; the contract should either explicitly validate it or explain why repository/path/SHA checks fully constrain the callee.
3. `parseOwnerApproval` checks numeric owner ID and command binding, but not the comment's `issue_url` / `html_url` repository and issue identity. That association must be enforced by trusted API retrieval and/or parser inputs/tests.
4. The parser accepts no expiry/age policy. Comment edit detection is timestamp equality only; deleted/edited comments must be re-fetched immediately before consumption.
5. `planApprovalConsumption` is a pure planner. It accepts a caller-provided consumed-ID list and does not persist/atomically consume the ID. `dispatchAllowed: true` is not an authorization to wire into production.
6. `planGatedDispatch` trusts caller-supplied booleans and marker outcome strings; there is no GitHub Environment/ref-marker API integration or proof that `created` marker payload binds to the expected owner/comment/task envelope.
7. Existing production Worker validates issue state/label/body SHA/profile only. Its report job writes issue state. Supervisor continues REST dispatch and stale-claim recovery on default branch.

## Required next implementation boundary
- Treat PR #12 as useful pure design/test material, not a deployable authorization implementation.
- Build one coherent production transition: trusted owner identity and comment retrieval; issue/repository binding; expiry and edit/deletion revalidation; durable single-use marker with race-safe create/read-back; protected Environment gate if selected; static local reusable Worker; caller/callee context verification before checkout/install; no Worker issue-write; Supervisor-only queue transitions; no REST dispatch; no privileged workflow_run; ambiguous state => needs-review.
- Add tests for wrong comment issue/repository URL, expired approval, deleted comment, API race/timeout, marker payload mismatch/precreation, marker creation conflict, crash between marker and invocation, actual production Worker context, wrong job.workflow_ref, direct invocation impossible, and duplicate Supervisor events.
- Do not merge PR #12/#15, enable dispatch, or run Worker/DSH until exact-head CI, independent security review and governance gates pass.

## Status
- PR #12 static CI: SUCCESS on exact observed head.
- PR #12 formal review: NOT RUN.
- Approval provenance: PARTIAL pure helper; production integration NOT IMPLEMENTED.
- Durable single-use: NOT IMPLEMENTED.
- Production reusable Worker boundary: NOT IMPLEMENTED.
- Dispatch / Worker / DSH / model / secrets / deployment: NOT RUN.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## Canonical MediaHub map
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
