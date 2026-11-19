# 2026-11-19 — Stage 1 / Master Prompt 4: PR ancestry against frozen default HEAD

**Status:** VERIFIED for the 13 high-priority integration PRs listed below; NOT a complete ancestry audit of all 106 open PRs.
**Repository:** VlDMlNSh/developer-cloud-pool
**Frozen target default HEAD:** `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (branch `Основной`).
**Method:** GitHub compare-commits API, target `base=default HEAD`, `head=PR head SHA`. No branch, PR, or repository state was changed.

## Results

| PR | PR base SHA | Head SHA | Compare vs frozen default | Ahead | Behind | Merge base |
|---:|---|---|---|---:|---:|---|
| #146 | b81d2b5 | acd7a3d | ahead | 40 | 0 | b81d2b5 |
| #145 | b81d2b5 | dced541 | ahead | 7 | 0 | b81d2b5 |
| #143 | 6818382 | 3d189df | diverged | 55 | 1 | 6818382 |
| #142 | 6818382 | 02514eb | diverged | 4 | 1 | 6818382 |
| #141 | 6818382 | 8c88a38 | diverged | 4 | 1 | 6818382 |
| #135 | 35208f0 | 5554c3f | diverged | 58 | 3 | 35208f0 |
| #116 | 35208f0 | 2e944f1 | diverged | 74 | 3 | 35208f0 |
| #114 | 35208f0 | ab9461e | diverged | 36 | 3 | 35208f0 |
| #112 | 35208f0 | c9a4c0a | diverged | 3 | 3 | 35208f0 |
| #111 | 35208f0 | 6871967 | diverged | 4 | 3 | 35208f0 |
| #125 | ab9461e | 69398d4 | diverged | 57 | 3 | 35208f0 |
| #72 | a53f623 | a391f5c | diverged | 67 | 82 | 221f216 |
| #67 | 221f216 | a53f623 | diverged | 47 | 82 | 221f216 |

Abbreviated SHAs in the table are prefixes of the exact values recorded in the execution evidence. Full exact SHAs are in the GitHub PR metadata and compare responses.

## Findings
1. Only #146 and #145 among the 13 selected priority PRs are directly based on the frozen current default HEAD; both have `behind_by=0` and the merge base equals the default HEAD.
2. #143/#142/#141 share an older base `6818382...`; each is one commit behind the current default and diverges from it. A retarget/rebase is not automatic approval: preserve review context and re-run qualification after any transplant.
3. #135/#116/#114/#112/#111 were based on `35208f0...`; each diverges and is three commits behind current default. Their proofs are not directly merge-ready.
4. #125 is stacked on #114's head lineage, not directly on default; it is 57 commits ahead and 3 behind current default, with merge base `35208f0...`.
5. #67/#72 are an older stacked lineage rooted at `221f216...`; the current default has advanced 82 commits since that merge base. These are unsuitable for direct merge and require selective clean-base port/requalification, not blind retargeting.
6. This pass covered 13 high-priority integration PRs, not all 106 open PRs. Other open PRs remain NOT VERIFIED for ancestry in this pass.

## Integration decision
- Preserve #146 as the current-base capability-profile contract candidate; it is not an executor qualification or dispatch authorization.
- Preserve #145 as current-base documentation-only evidence.
- Do not merge #143/#142/#141/#135/#116/#114/#112/#111/#125/#72/#67 as-is.
- Next useful bounded work is to inspect PR #146's exact diff and current-head CI, then map the CODE profile contract to the canonical D1 integration prerequisites without enabling dispatch.
- Issue #140 remains the controlling integration task; Contour A remains NOT ACCEPTED; Contour B remains DEFERRED.

## Evidence
- Default branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BE%D0%B9
- PR #146: https://github.com/VlDMlNSh/developer-cloud-pool/pull/146
- PR #145: https://github.com/VlDMlNSh/developer-cloud-pool/pull/145
- PR #143: https://github.com/VlDMlNSh/developer-cloud-pool/pull/143
- PR #142: https://github.com/VlDMlNSh/developer-cloud-pool/pull/142
- PR #141: https://github.com/VlDMlNSh/developer-cloud-pool/pull/141
- PR #135: https://github.com/VlDMlNSh/developer-cloud-pool/pull/135
- PR #116: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- PR #114: https://github.com/VlDMlNSh/developer-cloud-pool/pull/114
- PR #112: https://github.com/VlDMlNSh/developer-cloud-pool/pull/112
- PR #111: https://github.com/VlDMlNSh/developer-cloud-pool/pull/111
- PR #125: https://github.com/VlDMlNSh/developer-cloud-pool/pull/125
- PR #72: https://github.com/VlDMlNSh/developer-cloud-pool/pull/72
- PR #67: https://github.com/VlDMlNSh/developer-cloud-pool/pull/67

## Time
Estimate: 10 minutes. Actual elapsed time: NOT MEASURED.
