# Pass 36 checkpoint — issuer-bound indeterminate reconciliation evidence

Date: 2026-11-21

## Restore point
- Default `Основной`: `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`.
- Pass 35 parent: `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`.
- Pass 36 branch: `feat/pass36-issuer-bound-attempt-reconciliation-2026-11-21`.
- Final Pass 36 HEAD: `9bbf3fabf1f9284c58c1dc69cf696d8f3ef4ba79`.
- PR #165 implementation OPEN/DRAFT/UNMERGED.
- PR #166 validation-only OPEN/DRAFT/UNMERGED; CI checkout merge SHA `4b98be179411163f57051df567f4b3b424816311`.

## Pass 36 result
- Migration 0015 creates an append-only reconciliation decision ledger, unique by attempt/generation and issuer/JTI, SQL-bound to current indeterminate attempt and expired lease.
- Adapter requires injected verifier with issuer/audience pinned in trusted runtime config and exact `pool.attempt.reconcile` capability.
- Adapter requires injected trusted clock; no caller-supplied timestamp is accepted.
- Decisions: `safe_to_retry`, `result_confirmed`, `effects_unknown`.
- Recording a decision does not mutate task/attempt/lease/queue/outbox and never authorizes retry or execution.
- Six local synthetic D1 tests added.
- Exact-head D1 run 44881132353 SUCCESS: 6 files / 60 tests.
- Exact-head Pool Contract run 44881132342 SUCCESS: six workflow YAML files; POOL_CONTRACT_VALIDATION=PASS; dispatch disabled.
- Reused current D1 queue and pinned Workers/Vitest harness; no new dependencies.

## Do not overstate
- Verifier/clock are injected test seams; production OIDC, issuer/key registry and capability provisioning NOT VERIFIED.
- No owner retry approval or state transition. Safe-to-retry is evidence only.
- Pass 35 lease adapter still has caller-supplied `input.now`; trusted-clock gap remains OPEN.
- Not wired to deployed runtime; hosted D1 and actual executor termination/effect evidence NOT VERIFIED.
- PR #165 has no formal review; independent review NOT VERIFIED.
- Default combined status empty; default CI NOT VERIFIED. Ruleset not re-read this pass.
- Gemini/Claude NOT RUN; no secrets read; no dispatch, deployment, merge or production writes.

## Next
Pass 37: inject trusted time into Pass 35 lease acquisition, add stale/future/expiry boundary tests and run exact-head CI. Then qualify a production issuer verifier and separately authorized retry transition.

Report: `docs/reports/2026-11-21-pass-36-issuer-bound-reconciliation.md`
Snapshot: `docs/context/PASS-36-CURRENT-SNAPSHOT.md`
Context Window: `docs/context/GITHUB-CONTEXT-WINDOW.md`
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
