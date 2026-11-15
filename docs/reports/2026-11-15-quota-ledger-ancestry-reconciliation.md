# Quota-ledger ancestry reconciliation — 2026-11-15

## Scope

Reconcile the fail-closed provider quota ledger from stale PR #71 onto the current default branch without importing its divergent history. Preserve the independent A0→D1 proof stack and keep dispatch disabled.

## Immutable target and source

- Default branch at start: `Основной` @ `55d9af7c71b4b51c2b886176f1d65da192900423`.
- Source: PR #71, branch `fix/quota-ledger-fail-closed-2026-11-15`, HEAD `40a49acabd12aa178d3aa136244fb4f42231fbde`.
- PR #71 exact-head Pool Contract Validation run `43685547993`: COMPLETED / SUCCESS. Its branch is stale relative to current default (3 ahead / 27 behind), so the branch itself was not merged or rebased.
- Reconciled branch: `reconcile/quota-ledger-fail-closed-2026-11-15`.
- Reconciled PR #74: https://github.com/VlDMlNSh/developer-cloud-pool/pull/74
- Exact PR #74 HEAD: `e1b51e7165f96c8c459c672943dfa8b862879db4`; at initial immutable base the compare was 5 ahead / 0 behind. After canonical documentation refresh advanced default to `c424e62c89ce40a6fb72202e41659ce27c168f03`, compare is 5 ahead / 1 behind; GitHub PR API reports mergeable=true.

## Changes

Only three paths were transplanted onto the current default base:

1. `scripts/provider-quota-ledger.mjs` — pure, secret-free route quota state machine. Eligibility requires `quotaEvidence=provider_verified` and a non-empty quota domain; caller billing-class allowlists cannot bypass those checks. Shared quota-domain cooldown effects require provider-scope evidence. Missing Retry-After on 429 moves the route to reconciliation; auth and billing terminal states are not cleared by quota reset.
2. `scripts/provider-quota-ledger.test.mjs` — 13 tests covering account/quota-domain isolation, unknown evidence, unknown domain, quota-domain scope, cooldown/reconciliation, auth/billing terminal states, source immutability and prototype-sensitive route identifiers.
3. `.github/workflows/pool-contract-validation.yml` — existing validation workflow now executes the quota-ledger regression suite.

Additional hardening in this pass: route identifiers are installed as own data properties via `Object.defineProperty`, preventing the special `__proto__` key from mutating the route map prototype. The regression test exercises creation, lookup, quota reset, outcome recording and eligibility for that identifier.

Blob SHAs at the final branch head:
- Source: `419f010a18c61abefafbb4845c55ea7c6bb1ab90`.
- Tests: `d5291729bdcf9261fcdb9be97998a9b8158bea23`.
- Workflow: `4e47b8e8850833d930cdd457bea91c2cec507576`.

## Verification

- Exact-head PR workflow: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43692093254
- Run `43692093254`: COMPLETED / SUCCESS at exact PR head `e1b51e7165f96c8c459c672943dfa8b862879db4`.
- Job `132744702990`: completed successfully.
- Pool contract validator: PASS.
- Workflow YAML parsing: PASS.
- Quota ledger: 13 tests passed, 0 failed.
- Dispatch gate observed `POOL_DISPATCH_ENABLED=false`.
- Combined commit-status endpoint returned zero contexts. The workflow result is verified; required status contexts remain NOT VERIFIED because the active ruleset does not define them.
- No independent review has been performed; PR #74 remains OPEN / DRAFT / UNMERGED.

## Stack and governance reconciliation

- PR #72 remains OPEN / DRAFT / UNMERGED at `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`, stacked on PR #67. Exact-head workflow `43690143805` remains SUCCESS (7 Workers-runtime files / 93 tests; 9 atomic-admission tests; upgrade smoke 1; frozen schema-0010 fixture 2).
- Current default → PR #72: DIVERGED 67 ahead / 32 behind. PR #67: DIVERGED 47 ahead / 32 behind. Do not merge or transplant either full stack wholesale.
- PR #71 remains OPEN / DRAFT on its stale branch; PR #74 is the clean, current-base replacement candidate.
- PR #73 is documentation-only, OPEN / DRAFT, and diverged from current default (4 ahead / 5 behind); do not merge it wholesale. Its documentation is being reconciled directly into the canonical default-branch files.
- Active ruleset `26550182` applies only to `refs/heads/Основной`; it requires PR and review-thread resolution but has zero required approving reviews and no required status-check contexts. Branch-protection endpoint returned 403, so any additional branch protection remains NOT VERIFIED.
- No merge, provider login/call, secret read, hosted D1, Worker deployment, external executor dispatch or production resource creation occurred.

## Trust limits and status

This pure quota ledger is a selector/state machine, not a qualification authority. The string `authority: "provider"` and evidence reference are data supplied to the pure function; this module does not authenticate provider signatures, issuer identity, account ownership, evidence bytes or live quota. It must not be treated as route qualification.

- Quota-ledger correction: IMPLEMENTED / exact-head CI VERIFIED in Draft PR #74.
- Qualified Route Evidence writer/verifier: NOT IMPLEMENTED / NOT QUALIFIED.
- Atomic A0→D1 isolated proof: IMPLEMENTED / exact-head CI VERIFIED in Draft PR #72.
- Dispatch: DISABLED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next

Implement the trusted route-qualification writer/verifier boundary: canonical evidence serialization and digest verification, authenticated issuer/provenance, exact provider/model/account/quota-domain binding, monotonic revocation and freshness. Then connect only its verified immutable result to the existing A0→D1 transaction. Keep external provider login/calls and dispatch disabled until executor and route qualification gates are passed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
