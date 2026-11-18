# 2026-11-18 — PR #124 exact conflict-path diagnosis

## Scope
Inspect the three commits added to PR #124's base branch since its recorded base and compare their changed paths with the current PR #124 diff. No history rewrite, merge, code change, deployment, dispatch, or secret access.

## Immutable refs
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120 / current base branch `docs/cloud-pool-reference-architecture-2026-11-17`: HEAD `e93fb34a1f3430ca2db32fbf2e631903aac9570f`; OPEN / DRAFT; GitHub mergeability clean.
- PR #124 head: `87f5768391f6bfa545d5ca6792a07982b3a9b40f`; recorded base/merge-base `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; OPEN / DRAFT; `mergeable=false`, `mergeable_state=dirty`.
- Base branch commits since merge-base:
  - `023a6d5ed16585148cb5b388902fec51587407ca` — GitHub Actions D1 admission context audit.
  - `7df5482ad7324974ffdcb384cdc09b7b9e3f2ef3` — Claude hosted-use and installer provenance gate.
  - `e93fb34a1f3430ca2db32fbf2e631903aac9570f` — final verification of Claude gate.

## Exact path-overlap result
Compared all paths changed from merge-base to current base against all paths changed from merge-base to PR #124 head. The intersection contains exactly one path:
- `docs/context/GITHUB-CONTEXT-WINDOW.md`

The three base commits update the context window with current PR #125 admission findings, Claude Code installer provenance and hosted-use restrictions, and verification evidence. PR #124 also modifies this same context window, independently appending its architecture/integration snapshot and subsequent /next status. This shared mutable canonical context file is the only path-level overlap in the compared diffs and is the concrete conflict candidate consistent with GitHub's `dirty` mergeability.

No other changed path overlaps between the two branches. The API path intersection does not prove every hunk conflict, but the same-file concurrent edits explain the merge conflict; GitHub continues to report `dirty`.

## Disposition
Do not merge, rebase, force-push, or replace either branch. Resolution requires a deliberate content-level reconciliation of the two context-window histories: preserve both the architecture integration decisions and the later admission/vendor-gate findings, then validate links, chronology, and current authoritative snapshot. A naive whole-file overwrite would lose evidence. No write to PR #124 head was made in this pass.

## Governance / CI
- PR #124 formal review count: 0; review threads: 0.
- Exact-head PR workflow runs/check-runs/statuses remain absent/empty on the inspected head; CI NOT VERIFIED.
- Active ruleset #26550182 still has 0 required approving reviews and 0 required status checks; thread resolution is required. Governance remains insufficient for critical acceptance.
- Issue #118 remains OPEN with persistent host, Cloudflare Access/Tunnel, storage and restore qualification incomplete.
- Gemini dispatch remains NOT RUN: no approved Gemini controller on default branch. Gemini is optional supplementary capacity, not a per-pass requirement.

## Tests and side effects
No application tests were run; this was a Git path/ancestry audit. No code or workflow behavior changed. No secrets, provider calls, hosted resources, dispatch, merge, deployment, or history rewrite.

## Result
PR #124 conflict candidate isolated to one path: `docs/context/GITHUB-CONTEXT-WINDOW.md`. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next step
Reconcile the overlapping Context Window content into one chronological authoritative snapshot on the PR #124 branch, preserving both histories, then run documentation validation and obtain exact-head CI plus independent review before considering merge.
