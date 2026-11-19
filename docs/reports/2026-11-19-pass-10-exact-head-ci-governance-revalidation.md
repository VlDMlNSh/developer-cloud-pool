# 2026-11-19 — Pass 10: exact-head CI and governance revalidation

**Status:** VERIFIED — GitHub state/CI/governance read-back; no runtime or schema changes.
**Contour:** A only. Contour B remains DEFERRED.
**Default baseline:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145 OPEN / DRAFT / UNMERGED.
**Issue:** #140 OPEN; local no-secret qualification only.

## 1. Immutable ref and governance

- Default branch API re-read: HEAD `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; commit signature verified by GitHub.
- Branch API reports `protected=false`; classic branch-protection detail is not established by this field.
- Repository ruleset #26550182 is ACTIVE and targets exactly `refs/heads/Основной`.
- Ruleset requires pull requests, review-thread resolution, disallows deletion and non-fast-forward updates, has zero required approving reviews, no bypass actors, and current-user bypass `never`.
- The ruleset does not provide independent review by itself: formal review remains a separate qualification gate.
- Combined commit status for the default HEAD returned an empty status collection; do not interpret empty as green CI.

## 2. Exact-head workflow revalidation

| PR | Exact head inspected | Workflow evidence | Result |
|---|---|---|---|
| #143 current-base D1 proof | `3d189df6a4242325ad6261fb38d6e03d7ac6eebd` | Isolated D1 Ledger Proof run `44367978517`; Pool Contract Validation run `44367978376` | Both COMPLETED / SUCCESS |
| #146 CODE profile + D1 variant | `9d32c4943ae87f5855ab05d42a4ba12d1c205211` | Pool Contract Validation `44522152749`; Isolated D1 Ledger Proof `44522152799` | Both COMPLETED / SUCCESS |
| #145 documentation continuation | `bbec30424ecf2c59152ac96b8daefd176715c0b9` | PR-triggered workflow lookup returned no runs | NOT VERIFIED; documentation-only |
| Default branch | `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` | Combined status endpoint returned no contexts | NOT VERIFIED |

Important: earlier run IDs for PR #143 attached to SHA `4fff8eb...` are stale relative to its current head. The two run IDs above were queried against the current exact head. PR #146's CI proves only its isolated local D1 proof and repository contract checks; it does not qualify the canonical #67/#72 lineage or hosted D1.

## 3. D1 integration decision remains unchanged

Issue #140 remains OPEN. The source-level overlap audit in Pass 9 remains controlling:
- PR #67 migrations 0001–0010 plus PR #72 migration 0011/composite adapter are the selected historical lineage, but their source branches are stale and require selective transplant.
- PR #111's lease guard cannot be stacked as its migration 0006 collides semantically with PR #67 migration 0006 (projection outbox); if reused, reconcile it as a new migration after schema/trigger review.
- PR #114/#125 form a competing admission authority and must not be mixed into the selected ledger.
- PR #146 is a current-base A1 candidate with a separate D1 variant, not yet the integrated canonical chain.
- CODE capability profile `jarvis-code-sandbox-v1` remains separate from executor ID, route/account/quota, host, workflow and lease identities.

No automatic merge, cherry-pick, or schema transplant is authorized by this pass. First implementation step remains a clean-base, file-by-file transplant plan with explicit migration map and compatibility tests.

## 4. Safety and execution boundary

No secret/variable values were read. No hosted D1 was provisioned or written. No provider call, executor launch, Gemini controller dispatch, GitHub dispatch, deployment, merge, or production mutation occurred. No tests were run by this documentation-only pass; cited CI is GitHub's existing exact-head evidence for the listed PR heads.

All proof paths must retain `dispatch:false` and `executionAuthorized:false`. No executor is qualified by these results.

## 5. Next bounded pass

On a clean branch from `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, perform a read-only migration/trigger inventory of PR #67/#72 and PR #111's lease guard, then publish a transplant manifest mapping every migration, table, index, trigger, adapter and test. Do not write runtime/schema code until the manifest proves one owner per authority/table and a collision-free migration sequence.
