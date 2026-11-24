# Pass 67 — launch sequence correction and trusted event provenance audit

Date: 2026-11-24
Status: VERIFIED for source inspection and documentation; runtime qualification NOT VERIFIED.
Contour A: IN PROGRESS / NOT ACCEPTED. Contour B: DEFERRED.

## Decision recorded

The owner-directed sequence is:
1. Complete internal engineering, automated CI, security, governance and fail-closed qualification.
2. Launch the Cloud Development Pool only after the pre-launch technical/security gates and runtime checks pass.
3. Conduct independent review after launch as a distinct post-launch qualification stage, before final Contour A ACCEPTED.
4. Keep Contour B deferred until Contour A is formally ACCEPTED.

Independent human review is not a prerequisite to continuing implementation or the initial launch sequence. This does not waive pre-launch automated security checks, governance controls, provenance verification, or the requirement to keep dispatch disabled until its specific gates pass. Independent review is still required before final acceptance.

## Frozen scope and refs

- Default branch `Основной`: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- D1 candidate PR #170: OPEN/DRAFT/UNMERGED; head `7d900d9fe11b19f048548a3bed657b2549f8091f`; base `Основной`.
- Documentation PR #169: OPEN/DRAFT/UNMERGED; current head before this pass recorded as `36bba45bc9750eb4f09faef5aa92433d913abc89`.
- PR #168: OPEN/DRAFT/UNMERGED; remains non-canonical; its 33 changed paths overlap PR #170.
- Issue #96: exact owner-only /next control contract; first executor remains one Claude Code + ECC + FCC profile via a separately verified free route; Gemini optional.
- Issue #140: canonical D1 admission/lease proof-chain issue.

## Reuse First

Reuse existing GitHub Actions event/context APIs, the existing `proofs/d1-ledger` D1 admission/receipt chain, Vitest/Cloudflare Workers test harness and current workflow/contract validation. No new OSS dependency or service is justified for this bounded pass. The remaining workflow trust verification should use authoritative GitHub run/workflow/ref metadata and an explicit trust policy rather than adding a second event ledger or a new orchestration stack.

## Source inspection findings

Inspected PR #170 at its frozen head:
- `proofs/d1-ledger/src/github-next-event.mjs` blob `fdec14e9088fd1db186d0ee1541a6085ca84104a`.
- `proofs/d1-ledger/migrations/0017_github_next_source_comment_receipts.sql` blob `2d226a23e94cdf7a767eed989b8ef0b8781c69fb`.
- Unit test blob `a55733460d18974d8a965417ed6633a019fb4c5c`.
- Local D1 integration tests include source-comment uniqueness, immutable receipt, forged binding and replay/readback adversarial cases.

The adapter validates a supplied Actions context object and checks repository/owner/issue/comment/ref/workflow-ref/SHA shapes. It persists a source-comment receipt linked to the canonical admission and verifies primary-first readback. The SQL trigger binds receipt insertion to admission, consumed approval, task, prepared attempt, qualified route, task-ready outbox and commit receipt. Outputs remain `dispatch:false` and `executionAuthorized:false`.

Critical residual: the binder does not itself independently fetch/verify the GitHub workflow file bytes, validate workflow SHA ancestry against a trusted policy, or independently read the live default-ref head/race state. A caller-constructed context object can satisfy local predicate tests; these tests do not establish authenticity of a live GitHub event. Therefore controller activation/dispatch remains BLOCKED pending a concrete trusted workflow-verification design and runtime evidence. This is a technical gate, not a requirement to conduct independent human review before launch.

## CI and review evidence

- PR #170 associated workflow runs returned: D1 run 45274455569 SUCCESS; Pool Contract run 45274455577 SUCCESS.
- These are historical Pass 62 synthetic-merge results for `8b1c674c6fd2bdfaae55868fe75c13c6919fd047`, not current-head CI and not newly run in Pass 67.
- PR #170 formal reviews: 0.
- PR #169 exact-head workflow query for `36bba45bc9750eb4f09faef5aa92433d913abc89`: no runs returned; documentation CI NOT VERIFIED.
- No fresh test run in Pass 67.

## Scope / non-goals / DoD

Scope: reconcile launch-vs-review sequencing; inspect the current event binder, migration and tests; record exact technical trust gap and next bounded action.
Non-goals: no controller creation, dispatch, secrets/variables read, provider call, hosted D1, deployment, merge/close, production mutation, or Contour B work.
DoD for this pass: current refs re-read; source findings tied to blob SHAs; decision documented in report/checkpoint/Context Window and Issue #140; docs readback verified.

## Actions and metrics

- Source files inspected: 4 (adapter, migration, unit tests, integration tests).
- New code/schema/dependency changes: 0.
- New tests executed: 0.
- Existing CI re-read: 2 runs, both historical Pass 62 synthetic-merge evidence.
- Active engineering time: NOT MEASURED.
- Calendar time spent: NOT MEASURED.
- Risk: live workflow provenance and independent default-ref race policy remain unresolved; no dispatch is authorized.
- No secrets or credential values accessed. No external executor dispatched.

## Next

Implement and locally test a narrow trusted-workflow provenance verifier contract that obtains authoritative GitHub workflow/run/ref metadata, verifies workflow identity and ancestry/digest against an explicit trust policy, and fails closed on unavailable/racing reads. Keep it inside the canonical D1/controller design; do not introduce a second ledger. Then qualify the lease/trusted-clock integration and proceed to one CODE executor and remote UI/runtime qualification. Independent review remains post-launch and pre-ACCEPTED.

Links:
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- PR #169: https://github.com/VlDMlNSh/developer-cloud-pool/pull/169
- PR #168: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
- MediaHub canonical map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
