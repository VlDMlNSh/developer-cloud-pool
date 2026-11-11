# PR #58 delayed-visibility retry authority adversarial gap — 2026-11-11

## Scope and target

Read-only source/test audit of the current draft projection sender. No code, workflow, branch, permissions, secrets, dispatch, deployment, merge, or live GitHub writes were changed.

Immutable refs:
- PR #58 HEAD: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`
- Reconciler blob: `2f83befc145d39ea60f06fe5b9e9033f89df40c0`
- Test blob: `76b144bd067a42455b858345abec5ee3580c8ccf`
- PR #59 HEAD: `22200226da4f1af30645cf441a639db6893e9310`
- D1 outbox adapter blob: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`
- PR #60 Recovery Issuer/Trusted-Time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`

## Adversarial gap

The existing test named `does not blindly repost while a successful marker is not yet visible` exercises:
1. first invocation with `allowPost: true`, where the fake GitHub accepts the POST but delays marker visibility;
2. second invocation with `allowPost: false`, which correctly avoids a second POST.

It does not test the same second invocation with `allowPost: true`.

Source inspection establishes the missing case:
- `reconcileTerminalProjection` accepts caller-controlled `allowPost`;
- if marker readback returns no marker and `allowPost` is true, it calls `api.createComment`;
- the D1 outbox lease, delivery generation, attempt budget, expiry, or consumed grant are not consulted by this function;
- a later invocation can therefore pass `allowPost: true` again for the same event after the prior POST's visibility was ambiguous.

In the existing fake, the delayed-visibility mode increments `posts` on each `createComment` and leaves the comment pending. Repeating the same reconciliation call with `allowPost: true` would increment posts to 2. This is a source-level deterministic counterexample; it was not executed as a test in this pass.

## Why PR #59 does not close this gap

PR #59's D1 adapter enforces a local five-attempt delivery budget and generation-fenced lease transitions. But PR #58's sender does not consume a verifier-issued lease-bound grant. The two APIs are disconnected. The retry counter therefore cannot bound actual GitHub POSTs.

## Safe engineering boundary

Do not add a fake verifier or caller-supplied branded object and claim it authenticates production authority. The PR #60 issuer/trusted-time contract itself says no concrete issuer or production clock is selected or qualified. It prohibits accepting caller-supplied `now`, actor ID, issuer selectors, or nonce-consumed flags and requires atomic nonce consumption with the terminal state transition.

Until the issuer and trusted-time boundary are selected and qualified:
- keep sender dispatch disabled;
- do not implement a production-looking grant issuer;
- do not treat `allowPost` as authority;
- keep tests local/fake-only and label them as design evidence, not production qualification.

## Required next proof once authority boundary is approved

Add an adversarial test matrix:
1. first POST accepted but marker delayed;
2. same event invoked again with same grant — DENY, zero additional POST;
3. same event invoked with a fresh lease generation — require an explicit policy decision; a fresh generation must not imply replay permission for an already ambiguous POST;
4. grant replay, stale generation, expired lease, wrong event digest/resource binding — DENY;
5. concurrent invocations with the same grant — at most one authorization consumption and one POST attempt;
6. lost POST response with marker later visible — reconciliation-only path verifies without another POST.

The authorization must be consumed atomically before the side effect, or the design must explicitly document that a crash between consumption and POST can lose delivery and require manual dead-letter/recovery. Exactly-once external side effects cannot be inferred from a D1 lease alone.

## Current governance evidence

- PR #54 exact-head CI run `43010770730`: SUCCESS; actor-attribution inline thread resolved.
- PR #58 exact-head CI run `42979949181`: SUCCESS, but it validates only its current old-base HEAD; no formal review or inline threads returned.
- PR #59 exact-head CI run `42981807825`: SUCCESS, but validates only the old stacked HEAD; no formal review or inline threads returned.
- PR #60: no exact-head CI; no formal review or inline threads returned.
- Issue #38 remains OPEN. Its acceptance criteria require a real one-winner backend proof and independent security review. Both dispatch gates remain fail-closed until accepted.
- No secrets were read; no provider/model calls, worker dispatch, DSH/Resource Probe execution, deployment, or live issue projection occurred.

## Reuse-first assessment

No additional queue, retry engine, or HTTP framework is required to demonstrate this interface flaw. Keep the existing D1 + Workers Vitest proof. Previously assessed Octokit / `actions/github-script` may be considered only for a narrowly authorized sender; neither supplies one-use D1 authority or semantic idempotency.

## Decision

**PR #58 remains BLOCKED.** Its delayed-visibility test covers only the caller's safe choice to set `allowPost: false`; it does not constrain a caller that sets it true again. PR #59 does not bind its durable retry budget to this POST path. Do not merge or enable writes.

Next step: resolve issuer ownership and trusted-time qualification under Issue #38 / the proposed PR #60 contract. Only then implement the grant-verifier composition boundary and adversarial one-use/concurrency tests. Until then retain fail-closed behavior.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
