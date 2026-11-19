# Pass 10 — current-base D1 source selection and migration safety gate

Date: 2026-11-19
Status: VERIFIED — dependency comparison and source-selection pass; migration implementation NOT RUN.
Contour: A only. Contour B remains DEFERRED.

## Immutable target

- Default branch: `Основной`
- Target/base SHA: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
- Work branch: `feat/issue140-canonical-admission-lease-2026-11-19`
- GitHub compare confirms the work branch is IDENTICAL to the target (0 ahead, 0 behind, 0 files changed) before this report was committed.
- Issue #140 is OPEN and explicitly limits work to local no-secret qualification. Hosted D1, secrets/variables inspection, provider calls, dispatch, deployment, merge and production actions remain prohibited.

## Fresh branch comparison evidence

GitHub compare against target SHA `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` returned:

| Candidate branch | Compare status | Ahead | Behind | Merge base | File-level observation |
|---|---:|---:|---:|---|---|
| `proof/d1-current-base-ledger-2026-11-18` | diverged | 55 | 1 | `68183828cf7934e89109310c8f99281be4eb7ed8` | Adds a single `proofs/d1-ledger` package; includes migrations 0001–0007, lease guard at 0006 and executor binding at 0007. |
| `proof/d1-github-actions-context-adapter-2026-11-18` | diverged | 57 | 3 | `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` | Adds a separate `proofs/d1-admission` package, migration 0001 and GitHub Actions adapter/workflows. |
| `proof/d1-lease-attempt-fencing-2026-11-18` | diverged | 82 | 144 | `197ba98d0dc7d8437d759dd25bee8750d02e59ae` | Historical D1 ledger package with different migration sequence; not a safe transplant base. |
| `integration/d1-current-base-2026-11-18` | diverged | 4 | 1 | `68183828cf7934e89109310c8f99281be4eb7ed8` | Only a 103-line integration-plan document in the compare result; no schema implementation in this delta. |
| `feat/atomic-next-admission-d1-2026-11-16` | diverged | 36 | 3 | `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` | Separate `proofs/d1-admission` schema and adapter. |

These comparisons establish divergence and path overlap, not merge readiness. Branch compare metadata did not provide immutable head SHAs in this response; those heads are NOT VERIFIED here and must be fetched before any transplant.

## Source-level conclusions

1. The D1 ledger and D1 admission branches are competing schema roots. The admission branch must not be layered as a second task/approval/outbox authority over the ledger.
2. The current-base ledger proof's migration 0006 is `0006_guard_running_attempt_requires_lease.sql`; historical PR #67's migration 0006 is the projection-outbox migration. The same ordinal is not semantically interchangeable.
3. The current-base ledger package README describes a local-only Workers/Miniflare D1 proof, not Supervisor/Worker production wiring.
4. The admission package README explicitly says the adapter does not independently fetch the trusted default-branch ref, authenticate webhook signatures, or qualify hosted D1/worker dispatch. Its adapter's required `trustedDefaultHeadSha` is a contract input, not provenance by itself.
5. Existing PR #146's profile/registry/OIDC work is useful evidence, but its reported D1 sequence creates multiple task/outbox representations and cannot be assumed to be the canonical schema.
6. The owner-confirmed executor identity `claude-code-1` must remain distinct from capability profile `jarvis-code-sandbox-v1`, provider route/account/quota, host, lease owner and issuer. Existing Claude Code routes/configuration remain unchanged.

## Pass 10 decision

Do NOT transplant a whole branch or create migration 0012 yet. Although a lease guard is present in one current-base proof branch, the branch is divergent from the target by one commit and its full table/trigger compatibility with the desired receipt/admission/projection chain has not been verified. Migration numbering cannot be finalized from filenames alone.

Selected safe direction:
- one `proofs/d1-ledger` persistence authority;
- one approval ledger and one logical-task authority;
- one canonical task-ready outbox, with projection delivery kept as a distinct purpose only if its contract is proven;
- immutable attempts and durable reconciliation for indeterminate work;
- lease owner + positive fencing generation enforced at every state transition;
- one-shot approval and source-event receipt semantics integrated into that same authority;
- read-only event predicate/context adapter kept separate from persistence;
- independent trusted default-ref SHA read, not equality of two values from one caller source.

## Work performed and limits

- Created and verified a clean work branch from the immutable current default SHA.
- Compared five candidate branches against that target and reviewed the current-base ledger/admission README contracts plus the prior Pass 9 file-overlap audit.
- No SQL, runtime, workflow, executor registry or route files changed.
- No local tests were run because no implementation was changed.
- No CI run exists for this documentation-only pass.
- No secrets or repository variables were inspected; no hosted D1, provider calls, dispatch, deployment, merge or production action occurred.

## Required next bounded pass

Fetch immutable commit SHAs and inspect full migration SQL, trigger definitions, adapters and tests from `proof/d1-current-base-ledger-2026-11-18` against the exact target tree. Produce a table/trigger compatibility map, then port only a minimal additive ledger spine onto this clean branch. Do not add admission or projection migrations until ownership and uniqueness invariants are proven. Run local Workers-runtime tests and exact-head CI after code changes, keeping `dispatch:false` and `executionAuthorized:false` invariant.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.
