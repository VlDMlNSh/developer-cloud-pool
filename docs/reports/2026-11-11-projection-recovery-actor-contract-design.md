# Projection Recovery Actor capability contract — design pass

- Date: 2026-11-11
- Phase: Cloud Development Pool / Contour A
- Status: DESIGN RECORDED / IMPLEMENTATION NOT RUN / NOT QUALIFIED
- Immutable design base: `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`
- Design PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Design file: https://github.com/VlDMlNSh/developer-cloud-pool/blob/design/projection-recovery-actor-contract-2026-11-11/docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md

## Work performed

1. Re-read PR #59 source, tests, schema migrations, README, and Issue #38.
2. Confirmed the current `deadLetterExpiredProjection` adapter is same-owner-only. It requires the original worker identity and exact generation, so it cannot independently reap an orphaned fifth lease.
3. Read the installed Cloudflare D1 and Workflows product guidance and current official Cloudflare documentation for Durable Objects, Workflows retry semantics, and storage.
4. Compared D1 conditional SQL, SQLite-backed Durable Objects, and Cloudflare Workflows. D1 CAS does not authenticate callers; Durable Objects provide per-object serialized coordination and private storage; Workflows provide durable steps/retries, not authority.
5. Created a documentation-only ADR on a separate branch from immutable default-branch SHA. No runtime code, migrations, secrets, workflows, permissions, or dispatch gates changed.
6. Opened draft PR #60 against `Основной`.

## Design decision

Do not add a caller-supplied `recoveryActorId` string and treat it as authorization. Define a verified, one-use, narrowly scoped grant from a trusted issuer boundary. Bind it to repository, outbox, attempt, exact delivery generation, operation, expiry, and nonce. Consume it atomically with dead-letter transition and immutable event attribution. Recovery can only terminalize the projection outbox; it cannot requeue, dispatch, or mutate task/attempt state.

Retain the current local D1 proof. Durable Objects remain a candidate if per-entity serialization is needed. Workflows remain a candidate for durable orchestration/retries. No Cloudflare free-tier, cost, account entitlement, or production binding qualification was performed.

## PR #60 evidence

- PR #60: OPEN / DRAFT / UNMERGED.
- Head: `1da14b1f7bb9d5ff76055838a568674d584464e0`.
- Base: `Основной` at `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Changed files: one ADR.
- Reviews: 0; review threads: 0.
- Exact-head Actions runs: none returned; CI is NOT VERIFIED / not applicable to documentation-only change.
- ADR blob SHA after read-back: `046d5b2140604f95904bc8d9546c2f5b2f57a76e`.

## Related project state

- PR #58 and PR #59 remain OPEN / DRAFT / UNMERGED.
- PR #59 local D1 retry/dead-letter proof previously had exact-head CI SUCCESS; independent review remains NOT RUN.
- Issue #38 remains OPEN. Durable single-use Supervisor claim is not qualified.
- Main branch metadata previously reported `protected:false`; branch-protection detail endpoint returned 403, so full ruleset status remains NOT VERIFIED.
- No hosted D1, Durable Objects, Workflows, sender, deployment, Gemini/Claude dispatch, provider/model calls, or production workflow was exercised.
- Keep dispatch fail-closed. Contour A BLOCKED / NOT QUALIFIED / NOT ACCEPTED; Contour B DEFERRED.

## Next step

Review PR #60 and the recovery-actor ADR against Issue #38. Then choose the authorization issuer and backend only after proving least privilege, free-tier entitlement/cost, isolation, one-use grant consumption, and contention behavior. Add implementation/tests only after those boundaries are evidenced.


## Follow-up alignment audit — 2026-11-11

Read the existing [Trusted Reconciliation Authority Contract](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/contracts/TRUSTED-RECONCILIATION-AUTHORITY-CONTRACT.md), blob `32bce214a8a3577584f058fb5679b8cecf5f3309`. It already defines a task Resolver capability bound to task/attempt/generation/envelope/executor evidence, with operations `observe`, `resolve_no_retry`, and `propose_retry_candidate`.

Disposition: the existing task Resolver grant must NOT be reused directly for projection outbox recovery. Task reconciliation and projection-delivery terminalization are separate authority domains. Reuse only issuer/capability design patterns, with a distinct projection-recovery audience, operation, subject allowlist, exact outbox binding and one-use nonce. Do not widen the task Resolver operation allowlist.

Additional material finding: current local projection adapter functions accept caller-supplied `now`. This is deterministic test injection only, not a production trusted clock. ADR amended to require database-generated time inside the conditional transaction or a separately qualified trusted composition-root clock; caller timestamps must never prove lease expiry or grant validity. Existing resolver host-clock composition proof is synthetic; production clock provenance remains NOT QUALIFIED.

Updated ADR blob: `35dae9ef71eb0feed2977bfa30c2a079f6249c50`; design branch commit `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`. PR #60 body updated and re-read. PR #60 head is now `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`. Exact-head Actions runs: none returned; CI NOT VERIFIED. Reviews/threads remain 0/0.
