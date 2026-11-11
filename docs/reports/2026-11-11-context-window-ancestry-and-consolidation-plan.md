# 2026-11-11 — Context Window ancestry and safe consolidation plan

## Scope
Bounded, read-only lineage comparison plus documentation of the result. No branch ref movement, merge, rebase, deployment, workflow dispatch, or secret access.

## Immutable refs inspected
- Default branch `Основной` HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation continuation branch latest recorded commit: `06229ee21934a7bf5d4e7b9b503ad785e11b467c`.
- Default Context Window blob: `560e9c7c3b58afa7fced1f87b3d65b7b9aec632b`.
- Continuation Context Window blob: `21a73d9585860d1117e2913cd859afb18df858bd`.
- Both files have the same path, but their blobs and content histories differ.

## Findings
1. The Context Window files are not a simple stale/current version of one shared file history. The compare operation shows the continuation commit is 408 commits ahead and 5 behind default HEAD, with merge base `64d2636d4500127e635c214ccfb722c6b3fcda80`. The path `docs/context/GITHUB-CONTEXT-WINDOW.md` appears as an added file in the continuation-side compare, which means the two copies were introduced independently after the common base.
2. Default copy: 1,524 lines / 228,590 characters. Its header says last refreshed 2026-11-08 and records stale default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
3. Continuation copy: 2,308 lines / 369,272 characters. It contains the PR #25/#52 lineage, PR #25 readiness, and the governance/context ownership audit through 2026-11-11. Its header timestamp is stale (2026-11-10), but the final appended entries contain the later passes.
4. PR #25 changed-file list does not include `docs/context/GITHUB-CONTEXT-WINDOW.md`; it is not the mechanism that will reconcile these two copies.
5. The continuation branch's 408-commit divergence includes a broad set of engineering proof, contract, report and test files absent from the default-side comparison. Merging this branch wholesale solely to promote the Context Window would therefore import far more than a single document and is not a safe minimal consolidation.
6. Exact-head workflow evidence re-read for previously recorded PR heads:
   - PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`: runs `42228269689` and `42228269676`, both completed/success.
   - PR #52 head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`: run `42507524428`, completed/success.
   - PR #25 and #52 remain OPEN/DRAFT; no new run was triggered in this pass.

## Safe consolidation decision
- Do NOT merge or rebase the 408-commit documentation continuation branch to solve this file-ownership issue.
- Preserve both existing blobs and their histories.
- The safer eventual path is a small, dedicated branch created from the then-current default HEAD, containing only a curated canonical Context Window refresh (or a concise current-state index plus links to evidence on the continuation branch) and its own reconciliation report. Open a PR against `Основной`; keep the continuation branch as the detailed historical/evidence archive until the selected reports/contracts are separately integrated.
- Before that PR is created, compare the two files' project decisions and identify references in the continuation copy that point to files not yet present on default. Do not copy broken relative links into the default canonical document.
- Update the default copy's observed HEAD and refresh date only in that dedicated PR. Do not edit `Основной` directly.

## Status
- Independent branch ancestry / large divergence: VERIFIED.
- Same-path independently introduced Context Window copies: VERIFIED.
- Safe minimal consolidation path: PROPOSED, not executed.
- Single canonical default-branch Context Window: NOT YET ESTABLISHED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Evidence and next step
- Compare base: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Default HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Continuation tip: `06229ee21934a7bf5d4e7b9b503ad785e11b467c`.
- Next: perform a content-level decision/reference reconciliation and draft the minimal default-based Context Window refresh branch; recheck default HEAD immediately before creating that branch.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
