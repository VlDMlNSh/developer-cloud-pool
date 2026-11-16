# 2026-11-16 — PR #106 agent-browser exact-head audit (Wave 327)

## Scope and immutable refs

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной` at `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- PR #106: OPEN / DRAFT / UNMERGED; branch `feat/agent-browser-ephemeral-worker-2026-11-16`.
- PR head: `15de4aa015493aec7ee5137f1e4dae9591c4ab4f`.
- PR base SHA: `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`.
- Audit is read-only. No merge, deployment, production dispatch, provider call, or secret read.

## Exact-head CI evidence

- Pool Contract Validation run: [43848661335](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43848661335), COMPLETED / SUCCESS, associated with the exact PR head.
- Job 133235280917 — pinned Gemini CLI skills installation: SUCCESS.
- Job 133235281414 — agent-browser installation and public Web smoke: SUCCESS.
- Job 133235281584 — workflow syntax and pool security contract validation: SUCCESS.
- Combined commit status contexts returned an empty list. The named exact-head Actions run is positive CI evidence; empty status contexts are not an additional pass.
- Workflow artifact inventory for run 43848661335 returned zero artifacts. The screenshot was generated and hashed in the job, but it was not retained as a downloadable artifact.

## Verified implementation behavior

- Worker accepts three explicit profiles: DSH headless, agent-browser headless, and agent-skills bootstrap.
- Task validation checks numeric issue number, 40-character lowercase target SHA, allowlisted profile, open non-PR issue, `pool:claimed` label, and exact SHA/profile envelope.
- Browser job has `permissions: {}`, does not checkout repository code, and receives no provider credentials or user cookies.
- Browser runtime installs `agent-browser@0.43.0` with Node.js 24.9.0, installs its browser runtime, opens only the fixed public smoke URL `https://example.com`, checks the page title, creates a screenshot hash, and closes the browser.
- The successful job demonstrates outbound access to this fixed public smoke target from one ephemeral GitHub-hosted runner. It does not demonstrate arbitrary-site coverage, authenticated Web sessions, persistent browser state, or a user-facing remote browser.

## Findings and residual blockers

1. **Worker report TOCTOU / multiple-writer boundary remains open.** The report job has `issues:write`. It re-fetches the issue and reads labels, but before applying its terminal label it does not revalidate the open state, exact target SHA, selected profile, and current claim/approval envelope. A task can change after validation and before report mutation. This remains incompatible with a strict single-writer Supervisor lifecycle until corrected and adversarially tested.
2. **No retained browser evidence artifact.** The Actions run has no artifacts; screenshot hash is in the job summary only. Visual result cannot be independently inspected from a retained artifact.
3. **No persistent or authenticated session.** This profile is an ephemeral CI smoke worker, not the persistent remote browser/Web console.
4. PR #106 has zero formal reviews and zero review threads. It remains DRAFT / UNMERGED.
5. The exact-head PR workflows currently show `action_required` on subsequent PR validation workflows for the three Gemini-produced MediaHub evidence PRs. This is not a green PR CI state and must not be described as accepted.

## Gemini bridge reconciliation — latest observed owner /next

The most recent owner-authored exact `/next` comment visible on MediaHub Issue #301 was comment `6914858101`. It correlated with controller run [43856030589](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43856030589), target SHA `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.

- Controller run 43856030589: COMPLETED / SUCCESS.
- Readiness gate job 133260399666: SUCCESS.
- Dispatch/monitor job 133260449731: SUCCESS.
- Probe/assertion jobs were SKIPPED, as expected for `/next`.
- Agent 1 run [43856062054](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43856062054): SUCCESS; authorization job 133260515012 SUCCESS; execution job 133260548869 SUCCESS; artifact 14220348279, `sha256:4eebac6defc9f419cd2e537d48f032192425ceaab12a0113e2251049bed2c512`; resulting draft PR #756, head `8a5bd472db450a7d11a7e17965a63dc547ad475d).
- Agent 2 run [43856065717](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43856065717): SUCCESS; authorization job 133260527835 SUCCESS; execution job 133260582460 SUCCESS; artifact 14221362859, `sha256:28fcad99e4241deb789a670195b12d3f3cb68e41ed2a759ff8ef8b90a8970d23`; resulting draft PR #754, head `67671a2a1f8ff2d28277935d0500735bbdef28f7`.
- Agent 3 run [43856070228](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43856070228): SUCCESS; authorization job 133260544040 SUCCESS; execution job 133260595666 SUCCESS; artifact 14219444674, `sha256:62109f7c901c09b472b8cae25674c58bb5e71bea5bd21557498ef1a5a13e77cd`; resulting draft PR #755, head `c58c8a3bd27b3cc39c4cf0f944f3fd57e823bbd5`.
- All three child PRs are OPEN / DRAFT / UNMERGED; formal reviews are empty. Their current PR-triggered validation runs report `action_required`, not SUCCESS. Gemini dispatch/execution is verified; PR acceptance and qualification are not.
- No new `/next` comment was created for this chat-restore prompt; it was not an exact `/next` command. No duplicate controller dispatch was initiated.

## Status and next bounded step

- PR #106 exact-head CI: VERIFIED (static contracts + ephemeral browser smoke only).
- PR #106 independent review: NOT RUN.
- Persistent browser session / authenticated access: NOT VERIFIED.
- Worker report TOCTOU / sole-writer correction: BLOCKED pending a coherent, tested Supervisor/Worker lifecycle change.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.
- Next: fix and test the Worker report revalidation/single-writer boundary, preserve evidence artifacts, then re-run exact-head CI and obtain independent review before any dispatch or merge.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
