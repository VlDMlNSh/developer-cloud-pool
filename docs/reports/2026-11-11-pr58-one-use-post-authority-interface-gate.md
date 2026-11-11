# PR #58 One-use POST Authority Interface and Adversarial Test Gate — 2026-11-11

## Scope and immutable inputs

Read-only source/contract audit. No code, schema, workflow, permission, secret, branch, dispatch, deployment, merge, or live GitHub projection writes in this pass.

| Input | Immutable ref |
|---|---|
| PR #58 reconciler | `proof/fake-github-projection-reconciler-2026-11-11` @ `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; source blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0` |
| PR #58 tests | same branch; test blob `76b144bd067a42455b858345abec5ee3580c8ccf` |
| PR #59 outbox | `proof/projection-dead-letter-policy-2026-11-11` @ `22200226da4f1af30645cf441a639db6893e9310`; source blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11` |
| PR #59 retry migration | same branch; blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2` |
| PR #60 grant issuer contract | `design/projection-recovery-actor-contract-2026-11-11`; blob `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c` |
| PR #60 Recovery Actor ADR | same branch; blob `59a4be21516da0e005114acfe015aee7787524dc` |
| Default branch | `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7` |
| Issue #38 | OPEN; hosted claim service NOT SELECTED / NOT QUALIFIED |

PR #54 exact-head run `43010770730` SUCCESS (40/40); #58 run `42979949181` SUCCESS on its old base; #59 run `42981807825` SUCCESS on its old stack; #60 has no exact-head run (NOT VERIFIED). Formal reviews: #54 has an owner COMMENTED review and its known inline thread is resolved; #58/#59/#60 have no formal reviews or inline threads returned. This is not independent security approval.

## Observed gap

The PR #58 API is `reconcileTerminalProjection(api, envelope, { allowPost = false })`. The caller boolean is the only gate before `api.createComment`. No D1 outbox lease, lease generation, issuer, verified grant, nonce, trusted time, or persisted consumption is checked by the reconciler.

Existing tests prove:
- one POST inside one invocation when the fake API loses the response;
- a second read-only invocation can observe delayed marker visibility;
- reconciliation-only mode does not POST;
- digest conflicts and duplicate markers are denied.

They do **not** test:
- a second invocation using the same authority after the first invocation returned RETRYABLE;
- two concurrent invocations sharing one purported grant;
- stale/expired/wrong-resource/wrong-generation authority;
- grant nonce consumption and POST admission as one atomic state transition;
- crash/timeout after authority consumption but before/after the external POST.

Therefore current tests do not establish one-use POST authority across invocations.

## Required interface contract — design only

Do not implement a production-looking verifier or invent an issuer. The PR #60 issuer/time contract is explicitly PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED. Its required boundary is suitable as a prerequisite, not as an available runtime dependency.

A future trusted composition root should expose a narrow operation conceptually equivalent to:

`authorizeProjectionPost(opaqueGrant, immutableRequestBinding) -> VerifiedPostPermit | DENY`

Requirements:

1. **Opaque ingress:** accept an opaque grant at a trusted composition root. Never accept caller-selected issuer/key IDs, decoded claims, actor strings, arbitrary `now`, or a plain JSON object as proof.
2. **Verifier provenance:** only a configured `RecoveryGrantVerifier` may produce the internal verified descriptor. Runtime/module boundaries must prevent callers from forging it; TypeScript branding alone is insufficient.
3. **Exact binding:** bind issuer and key generation, subject allowlist, audience exactly `projection-terminal-comment` (separate from the Recovery Actor audience), operation exactly `create_terminal_projection_comment`, repository numeric ID, issue number, outbox ID, attempt ID, target SHA, payload/event digest, delivery lease generation, grant ID/nonce, policy version, not-before and expiry. Unknown or mismatched fields deny.
4. **Trusted time and revocation:** use the separately qualified trusted-time and revocation dependencies in PR #60's contract. No caller-provided clock. Fail closed on stale/unavailable revocation, expired/not-yet-valid grants, issuer/key/policy revocation, or invalid clock provenance.
5. **Atomic one-use admission:** before the network side effect, atomically verify that the exact D1 outbox lease is still current/unexpired and consume the unique grant nonce for that exact binding. Enforce uniqueness in storage. A stale generation, expired lease, reused nonce, mismatched digest, or concurrent second admission returns DENY. The authorization result is not a reusable bearer boolean.
6. **Narrow sender:** the sender accepts only the internal permit and immutable request constructed from the verified outbox row. It performs at most one GitHub POST for that permit. It cannot dispatch work or mutate task/attempt authority.
7. **Ambiguous outcome:** GitHub comment creation does not provide a transaction shared with D1. Consuming the permit before POST can leave an indeterminate event if the process crashes before the request; a timeout after send can also hide a successful write. Reconcile the deterministic marker read-only. Do not mint a replacement permit or retry POST merely because the marker is temporarily absent. If delivery cannot be resolved, record INDETERMINATE / manual recovery required. Do not claim exactly-once external effects.
8. **Retry budget semantics:** PR #59's five-attempt counter is not permission to issue five POSTs. Each externally side-effecting attempt requires a separately authenticated, policy-authorized grant and proof that retry is safe. With no GitHub idempotency key, safe automatic replay after an ambiguous POST is not established. Keep automatic POST retry disabled.
9. **Separate label mutations:** labels are a distinct side-effect class. They require their own exact ownership allowlist and bounded authorization. Do not let a comment grant authorize prefix-wide deletion of arbitrary `pool:*` labels.

## Adversarial test matrix required before implementation qualification

| Case | Expected result |
|---|---|
| Valid, exact, unexpired grant + current D1 lease | One admission; one POST maximum |
| Same grant invoked again after first admission | DENY; zero additional POSTs |
| Two concurrent invocations with same grant/nonce | Exactly one admission winner |
| Wrong repository, issue, outbox, attempt, SHA, digest, audience, operation, subject, issuer or generation | DENY; zero POSTs |
| Expired / not-yet-valid grant or stale revocation snapshot | DENY; zero POSTs |
| Expired/stale D1 lease or generation superseded | DENY; zero POSTs |
| Forged plain object / caller-supplied actor / caller-supplied time | DENY; zero POSTs |
| Crash after nonce consumption but before POST | INDETERMINATE; no reuse of same grant |
| POST accepted but response lost / marker delayed | Read-only reconciliation; no blind repost |
| Database consume result ambiguous | NOT VERIFIED; no POST unless a later read proves safe unused state under an accepted protocol |
| Concurrent duplicate marker / conflicting digest | DENY; no acknowledgement |
| Unowned `pool:*` label present | Preserve it; do not delete |

These are acceptance tests, not evidence that any production issuer or remote D1 backend exists.

## Reuse-first disposition

Retain the existing Cloudflare D1 + Workers Vitest proof and current pinned Vitest / `@cloudflare/vitest-plugin` dependencies. No new queue, capability framework, token library, or HTTP client is justified before issuer governance and production backend selection. Cloudflare Workflows, Durable Objects and Octokit do not themselves provide the missing issuer identity, one-use capability, or cross-system exactly-once side-effect guarantee. Do not add a dependency to simulate security.

## Governance and disposition

- PR #60 issuer contract explicitly says PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED; issuer ownership, key custody, trusted time, revocation source and audit sink remain unresolved.
- MediaHub Wave 486/487 Security Issuer Authority is itself a target design; referenced PRs #599/#600 are OPEN/DRAFT/UNMERGED and their exact-head CI/A3 review is NOT VERIFIED. Do not treat the future issuer as deployed.
- Issue #38 remains OPEN. Both dispatch gates remain FAIL-CLOSED.
- No code or tests changed because no approved issuer/verifier exists to produce a non-forgeable permit. Adding a fake token verifier would risk giving an unimplemented trust boundary false legitimacy. The actionable output of this pass is the precise interface and adversarial acceptance matrix above.

## Decision

**POST authority remains BLOCKED / NOT IMPLEMENTED / NOT QUALIFIED.** Keep `allowPost` proof-only and do not promote it to production. Do not merge PR #58/#59/#60. A subsequent implementation pass may begin only after issuer authority, trusted time, revocation, nonce-consumption storage and audit ownership are accepted and available as real dependencies.

## Next bounded action

Resolve the upstream Security Issuer Authority prerequisites and name an implementable trusted-time/revocation/audit boundary; otherwise continue with non-authoritative fake tests only and preserve the dispatch gates. Revisit exact lifecycle label ownership separately.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
