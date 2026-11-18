# 2026-11-18 — PR #124 ancestry and exact-head revalidation

## Scope
One bounded pass: reconcile PR #124's live head/base, branch ancestry, mergeability, checks, and formal review state. No rebase, force-push, merge, deployment, provider call, secret access, or runtime dispatch.

## Immutable observations
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120: OPEN / DRAFT; head `e93fb34a1f3430ca2db32fbf2e631903aac9570f`; base default HEAD; GitHub reports `mergeable=true`, `mergeable_state=clean`.
- PR #124: OPEN / DRAFT / UNMERGED; head `dd5b52b2ac28afc00354dcb6e017898ec8b1db86`; base ref `docs/cloud-pool-reference-architecture-2026-11-17`; recorded PR base SHA `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; GitHub reports `mergeable=false`, `mergeable_state=dirty`.
- Current base branch head is `e93fb34a1f3430ca2db32fbf2e631903aac9570f`, i.e. PR #120 head. The base branch has advanced 3 commits beyond PR #124's recorded base SHA.
- Compare current base branch vs PR #124 head: `status=diverged`, `ahead_by=125`, `behind_by=3`, merge base `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`.
- Compare old recorded base SHA to current base branch: exactly 3 commits ahead, 0 behind. This establishes stale base ancestry; it does not by itself prove which file conflicts cause GitHub's `dirty` result.
- PR #124 formal review API: 0 reviews.
- PR #124 exact-head commit status: `pending`, `total_count=0`; check-runs: 0; commit-associated PR workflow runs: empty. Therefore exact-head CI is NOT VERIFIED. Prior successful runs on older SHAs do not qualify this head.
- Ruleset #26550182 remains active on `Основной`, but requires 0 approving reviews and 0 status checks. Thread resolution is required. This is insufficient critical-path governance.
- Issue #118 remains OPEN; its recorded host/Cloudflare/persistence/restore blockers remain unresolved.
- Issue #96 remains the only Cloud Pool owner-only `/next` control surface. Gemini is optional supplementary capacity; do not dispatch absent controller and security gates.

## Finding
PR #124's current base branch is 3 commits ahead of its recorded base, and the PR branch is 125 commits ahead / 3 behind with a diverged ancestry. GitHub currently reports `dirty`. The PR body contains stale head/base/CI/mergeability claims and must not be treated as current evidence. The exact conflicting paths/root cause of `dirty` remain NOT VERIFIED; do not rewrite history or merge.

## Evidence
- PR #124: https://github.com/VlDMlNSh/developer-cloud-pool/pull/124
- PR #120: https://github.com/VlDMlNSh/developer-cloud-pool/pull/120
- Compare: https://github.com/VlDMlNSh/developer-cloud-pool/compare/67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8...dd5b52b2ac28afc00354dcb6e017898ec8b1db86
- Exact-head status: https://github.com/VlDMlNSh/developer-cloud-pool/commit/dd5b52b2ac28afc00354dcb6e017898ec8b1db86
- Ruleset: https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182
- Persistent workspace blocker: https://github.com/VlDMlNSh/developer-cloud-pool/issues/118

## Acceptance / safety
No tests were run in this pass. No code or workflow behavior changed. No secrets, providers, runners, or persistent infrastructure were touched. PR #124 remains DRAFT and unmerged. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next step
Inspect the three commits added to the PR #124 base branch and compare the exact changed paths against PR #124's current head; establish concrete conflict paths before deciding whether to create a non-destructive synchronization commit. Then obtain independent exact-head review and configured required CI before any merge.
