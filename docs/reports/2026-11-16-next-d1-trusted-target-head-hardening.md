# Admission target and one-shot approval hardening — 2026-11-16

## Result

Security review of PR #114 found two related gaps in the D1 admission proof:

1. Target SHA was syntax-checked but not required to equal an independently supplied trusted default-branch HEAD.
2. The approval-consumption trigger checked only the resulting row state. A pre-consumed approval with a matching timestamp/task binding could therefore satisfy the postcondition for a new receipt.

The adapter now requires `trustedDefaultHeadSha` and rejects if it is invalid or differs from `targetSha`. The D1 trigger now requires the approval UPDATE itself to change exactly one row (`changes() = 1`), so a previously consumed approval cannot authorize a new receipt. Adversarial tests cover stale target and pre-consumed approval replay. The pre-consumed approval row remains unchanged; no receipt/task/outbox is created.

The exact-head CI is green after correcting a test fixture ID collision.

## Immutable target and PR state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD / immutable target: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (rechecked; unchanged)
- Working branch: `feat/atomic-next-admission-d1-2026-11-16`
- PR #114: OPEN / DRAFT / UNMERGED; formal reviews: 0
- Exact verified PR head: `8e9e2e602ea6f3b069222b6e3c2c2d0b88cd76b5`
- PR base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- No default-branch change, merge, deployment, provider call, secret read/write or dispatch.

## Exact-head source evidence

- `proofs/d1-admission/src/admission.mjs` blob `e37eef052de0a5daff36c0ffbf873a2fd49d942b`: `trustedDefaultHeadSha` validation.
- `proofs/d1-admission/migrations/0001_atomic_next_admission.sql` blob `20bd330c4c6fe01752e64abb5d3f8b6112e5a66c`: trigger verifies exactly one approval row was newly consumed using `changes() = 1`.
- `proofs/d1-admission/test/admission.test.ts` blob `208119e50985bca41161327afd6ebe717ef85b1d`: stale target and matching pre-consumed approval adversarial cases.
- The test fixture identity for stale-target case was moved to a unique source comment ID after the first run exposed a collision. The corrected exact-head suite passes.

## Exact-head CI

All runs below correspond to PR head `8e9e2e602ea6f3b069222b6e3c2c2d0b88cd76b5`:

- D1 PR run [43935042451](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43935042451), job `133537313544`: COMPLETED / SUCCESS.
- D1 push run `43935030103`: COMPLETED / SUCCESS.
- Pool contract validation [43935042490](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43935042490), job `133537341737`: COMPLETED / SUCCESS.
- Workers-runtime: 1 file, **12 passed / 0 failed**.
- `node --check src/admission.mjs`: PASS.
- All six workflow YAML files parsed; pool contract/security invariants PASS; dispatch gate observed false.
- Artifact `d1-admission-proof-package-lock.zip`, ID `14258369393`, SHA-256 `28e389bc053f7b0dfce0631197bc9ef6c920b539457c63255edb2fc0c287684a`; [artifact](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43935042451/artifacts/14258369393).

The immediately preceding head `642ac80ecd87f49ad895154b00dbd04b5228fb30` failed 1/11 because the new stale-target test reused an approval replay fixture ID. Commit `051f972a44bdfb610b17554dd51340c34700e6f6` isolated the ID; exact-head 11/11 passed there. Subsequent commits added the pre-consumed approval replay guard and test, yielding 12/12 on the current head. Failures are retained transparently.

## Critical trust boundary

The pure admission function checks equality between `targetSha` and `trustedDefaultHeadSha`, but cannot authenticate either caller-provided value. The production adapter must derive the trusted head from trusted GitHub workflow/event metadata or an independently authenticated default-branch ref read. This proof does not authenticate GitHub webhook signatures, prove controller run/code-SHA provenance, or integrate a live event adapter.

## Governance and blockers

- Issues [#94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94) and [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) remain OPEN.
- PRs #111/#112/#113 remain OPEN / DRAFT / UNMERGED. PR #114 remains OPEN / DRAFT / UNMERGED, 0 formal reviews.
- Active ruleset `26550182` applies to `refs/heads/Основной`, blocks deletion/non-fast-forward and requires PR/thread resolution; it requires 0 approving reviews. Branch-protection API remains NOT VERIFIED.
- Cloud Pool-native `.github/workflows/gemini-batch-dispatch-controller.yml` is NOT VERIFIED on default. Gemini dispatch NOT RUN.
- Hosted D1, live webhook signature/event provenance, approval issuance authority, authenticated worker identity, immutable attempt/fencing, outbox delivery/reconciliation, Supervisor integration, model routing/quota qualification and remote Jarvis UI remain NOT VERIFIED / NOT IMPLEMENTED.
- No secret values read, provider calls, paid fallback, dispatch, merge or deployment.

## Next single step

Define and adversarially test the trusted production adapter boundary that authenticates the GitHub issue_comment event and obtains the current default-branch HEAD independently before invoking this D1 admission function. Keep PR Draft and all dispatch disabled.

## Status

Local D1 admission proof: VERIFIED at exact-head CI. Live admission provenance: NOT VERIFIED. Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
