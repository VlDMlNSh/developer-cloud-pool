# Pass 12 — current-base integration gate and profile authority reconciliation

Date: 2026-11-19
Status: VERIFIED repository-state and source-lineage audit; implementation NOT RUN.
Issue: #140 OPEN; local no-secret qualification only.
Immutable current default baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
Documentation work branch: `feat/issue140-canonical-admission-lease-2026-11-19`.

## Live repository state checked

- Default branch: `Основной`.
- PR #145: OPEN, DRAFT, unmerged; docs-only branch `docs/next-2026-11-19-integrated-contour-pass`.
- PR #146: OPEN, DRAFT, unmerged; code/proof branch `feat/a1-jarvis-code-sandbox-profile-2026-11-19`.
- PR #147: OPEN, DRAFT, unmerged; documentation branch stacked on PR #146.
- Issue #140: OPEN. Scope prohibits hosted D1 writes, secrets/variables inspection, provider calls, dispatch, deployment, merge and production actions.
- PR #146 exact-head workflow evidence previously returned for SHA `9d32c4943ae87f5855ab05d42a4ba12d1c205211`: Pool Contract Validation run `44522152749` SUCCESS; Isolated D1 Ledger Proof run `44522152799` SUCCESS. These runs prove only the PR's isolated proof at that old exact head; they do not prove current-default integration or live executor operation.
- Current default baseline `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` returned no PR-triggered workflow runs through the commit-runs query. This is not evidence of failure; exact-head CI is NOT VERIFIED by that query.
- `.github/pool-executor-registry.json` is absent on the current default branch (GitHub Contents API returned 404). No registry activation is present on the baseline.

## Candidate branch ancestry against current default

| Candidate | Ahead | Behind | Merge base | Decision |
|---|---:|---:|---|---|
| `proof/d1-current-base-ledger-2026-11-18` | 55 | 1 | `68183828cf7934e89109310c8f99281be4eb7ed8` | Diverged; do not stack wholesale |
| `proof/d1-github-actions-context-adapter-2026-11-18` | 57 | 3 | `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` | Diverged; adapter input is not provenance |
| `proof/d1-lease-attempt-fencing-2026-11-18` | 82 | 144 | `197ba98d0dc7d8437d759dd25bee8750d02e59ae` | Deeply diverged; source transplant only after file-level audit |
| `integration/d1-current-base-2026-11-18` | 4 | 1 | not returned in compact result | Diverged; only a plan document in compare delta |
| `feat/atomic-next-admission-d1-2026-11-16` | 36 | 3 | not returned in compact result | Diverged; separate admission package |

The candidate branches do not establish a clean, current-default integration lineage. The previously reported 5-branch comparison is now refreshed and still blocks a safe wholesale merge.

## Profile authority reconciliation

The PR #146 contract blob `21b04b125349441f6296696a4f780d44c33ef896` states:
- `profileId=jarvis-code-sandbox-v1` is an immutable identifier confirmed in conversation on 2026-11-19;
- `profileStatus=proposed`, `NOT QUALIFIED`, `NOT ENABLED`;
- CPU/memory/workspace/time ceilings are proposed, not runtime-enforced or production-approved;
- network default deny and no dispatch remain mandatory;
- provider route, account, quota, host and runtime remain separate qualification dimensions.

Older Issue #140 comments saying the literal profile ID had not yet been owner-authored predate the PR #146 contract. The current contract records the conversational confirmation of the identifier, but this must not be misread as approval to enable the runtime. The identifier is frozen; the profile and executor are still NOT QUALIFIED / NOT ENABLED.

## Decision and next work

Do not start a code transplant in this pass. The selected source candidates remain divergent, and a code patch against PR #146 would risk making its competing claim/outbox and lease APIs canonical by accident. Keep the current work branch documentation-only.

Next implementation gate:
1. Select one source lineage and pin exact immutable commit SHAs for the relevant PR #67/#72 (or explicitly justify a different lineage).
2. Build a file/table/trigger/API ownership map against current default, including migration IDs and both claim/outbox paths.
3. From a fresh branch at the current default SHA, transplant only the smallest coherent adapter/lease slice after proving no duplicate authority.
4. Add contract tests asserting every exported result has both `dispatch === false` and `executionAuthorized === false`; test legacy-path denial and attempt-bound lease fencing.
5. Run local Workers-runtime tests and exact-head CI; preserve NOT VERIFIED for any unavailable result.

No code, SQL, workflow, registry, executor route or secret was changed. No local tests were run. No hosted D1, provider call, dispatch, deployment, merge or production action occurred.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.
