# Gemini controller routing gap for Cloud Pool independent review — 2026-11-08

## Scope
Read-only inspection of the approved MediaHub Gemini controller, its fixed review child, Cloud Pool PR/Issue state, and current cross-project constraints. No workflow dispatch, child run, secret read, provider/model invocation, repository source change, merge, deployment or infrastructure action occurred.

## Immutable evidence
- Cloud Pool default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Cloud Pool PR #36: OPEN/DRAFT/UNMERGED, head `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- Cloud Pool PR #37: OPEN/DRAFT/UNMERGED, head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Cloud Pool PR #39: OPEN/DRAFT/UNMERGED, head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- Issue #38 remains OPEN; it requires independent review, exact-head CI, one-winner backend qualification and recovery tests before acceptance.
- MediaHub canonical map blob on `docs/mediahub-chat-tree-map-20261012`: `75f62685459ec99ebf8be478f4e9096cdb842b1d` (Contents response empty; blob fetched and read successfully).
- MediaHub Bootstrap blob: `75f30750183efe8c6877368e9f0ada48f8e81ea7`.
- Accepted Baseline 2.0 blob on `main`: `1147ecd39cfe6f0e6ba2d7a62b6bf68c71c0e24f`.
- Approved controller on MediaHub `main`: `.github/workflows/gemini-batch-dispatch-controller.yml`, blob `0a1246f6755020faf8b7e48d07bfff790bbaece3`.
- Fixed review child: `.github/workflows/gemini-fcc-independent-review-wave409.yml`, blob `168da7bfd4d2be1bf316b7dd2d968361949feddc`.
- Controller contract test: `tests/test_gemini_transport_controller_contract.py`, blob `5ae0e8db9465ce36bd4020df69b552c659cd6187`.

## Finding — approved controller cannot currently review Cloud Pool PRs
1. Controller `review` mode is hard-pinned to target SHA `074f20eb495666946a14410ab88d566aaa754f24`; it refuses any other target. Its fixed task reviews MediaHub FCC PR #506 and #508 only.
2. The review child requires repository `VlDMlNSh/mediahub-os`, trusted `refs/heads/main`, base `main`, scope `contour-a`, and checks out the MediaHub target. It cannot be redirected to `VlDMlNSh/developer-cloud-pool` or PR #36/#37/#39 using caller-supplied task text.
3. Controller `agents` mode dispatches three fixed MediaHub workflows with task prompts scoped to MediaHub Issue #301 and its canonical docs. This is not an authorized Cloud Pool review task.
4. The `issue_comment` bridge accepts only an OWNER-authored exact `/next` comment on MediaHub Issue #301. A `/next` message in this ChatGPT conversation is not that GitHub event and does not dispatch anything.
5. A batch-admission repository variable and two controller secrets are referenced by workflow code. Their values/presence/scope were not read; live admission status remains NOT VERIFIED. No secret values were accessed.

## Disposition
- Gemini controller implementation and fixed task routing: source VERIFIED.
- Cloud Pool-specific independent Gemini review route: NOT IMPLEMENTED / NOT AUTHORIZED.
- Gemini dispatch for this pass: NOT RUN.
- Independent architecture/security review of Cloud Pool: NOT RUN.
- Cloud Pool implementation, remote D1 qualification and dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Both dispatch gates remain fail-closed.

## Required next step
The owner/governance authority must approve a narrowly scoped Cloud Pool review task contract and a trusted transport route. Any future controller change must pin the exact Cloud Pool repository, immutable PR/base/head SHAs, read-only permissions, no-secret review tools, artifact provenance and allowed outputs; it must not broaden the existing MediaHub fixed FCC review task. After that route exists, verify exact-head controller CI and effective governance, then run only the approved review. Do not route Gemini through SentinelX, local servers, or any alternate transport.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
Cloud Pool context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md


## Cloud Pool exact-head and reviewer recheck
- PR #36 exact head `e11fc90e50bd20b166207af64551c49cfa80ffb4`: Pool Contract run `42329438308` and Isolated D1 Ledger Proof run `42329438351`, both COMPLETED/SUCCESS.
- PR #37 exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`: Reusable Pool Worker Boundary Validation run `42484039940` and Pool Contract Validation run `42484039932`, both COMPLETED/SUCCESS.
- PR #39 exact head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`: Isolated D1 Ledger Proof run `42329993548`, COMPLETED/SUCCESS.
- Formal review submissions: PR #36 = 3 COMMENTED; PR #37 = 3 CHANGES_REQUESTED + 1 COMMENTED; PR #39 = 3 COMMENTED. All observed submissions are by the same linked account `maxkorolskiy88-ship-it`; inline review threads = 0 on all three. These are not independent organizational approvals.
- Therefore named exact-head CI is VERIFIED for the listed workflows only; independent review remains NOT RUN / NOT VERIFIED. Green CI does not close authorization, provenance, durable claim, lease/fencing, outbox recovery or remote D1 qualification.
