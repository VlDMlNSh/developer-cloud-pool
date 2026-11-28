# Plan: Controller → API Envelope → attested D1 composition

## Frozen baseline
Default branch: Основной  
Target SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca  
Pass 115 branch: docs/pass115-spec-kit-adoption-2026-11-28  
Pass 115 is documentation/specification only; no controller or D1 code changed.

## Reuse First
- Reuse PR #176 read-only controller/verifier only if current ancestry and tests prove fit.
- Reuse Pass 110/111 envelope validator and attested D1 adapter only after source-level compatibility review.
- Reuse Node built-in test runner and existing Workers/D1 local harness.
- Add no alternative ledger, duplicate workflow, runtime, package, hosted service or provider SDK.

## Planned architecture
1. Controller obtains trusted workflow context and performs bounded read-only GitHub API reads.
2. API verifier validates immutable source and workflow identifiers.
3. Versioned canonicalizer builds envelope and recomputes digest.
4. Single attested D1 adapter is called only after all predicates pass.
5. Full primary-first readback determines observed result.
6. All outputs remain non-dispatching and unauthorized for execution.

## Implementation gates
Reconcile ancestry and file/migration overlap; confirm schemas from source; identify legacy admission callers; add negative-first tests and invocation-spy assertions; run exact-head D1 and Pool Contract workflows; inspect logs for checked-out SHA; keep PR Draft/unmerged pending independent review and governance.

## Risks
Stacked PRs may contain incompatible migration histories. Separate API reads may be stale/non-atomic. Workflow SHA and target event SHA are distinct provenance fields. Local fixtures do not establish hosted D1 or live event authenticity.