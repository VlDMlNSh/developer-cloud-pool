# Durable single-use claim design review — 2026-11-06

## Scope and immutable baseline

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Tracking issue: [#38 — Design and qualify durable single-use Supervisor task claims](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38).
- Authorization implementation: [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37), OPEN / DRAFT / UNMERGED; exact reviewed head recorded in issue #38 is `5587a4e013507b5be330fd0c49ce1fc836faa946`; exact-head CI runs `42284044591` and `42284051311` succeeded. Independent review remains NOT RUN.
- D1 proof source branch inspected: `proof/d1-single-use-ledger-retry-2026-11-06`; comparison against the immutable default baseline: 37 ahead / 0 behind. This is an isolated proof branch, not the canonical default branch.

## New evidence verified in this pass

The D1 proof implementation was read directly from GitHub:

- `proofs/d1-ledger/src/consume.mjs`, blob `ef4f9693e1e2a378c08e974a65a8deb486af8712`.
- `proofs/d1-ledger/test/consume.test.ts`, blob `8c4af56fffd40e716a4f1f16632b99c0c4f72f33`.
- `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql`, blob `a80524ed839b63dd6483978118619495fa550877`.
- `proofs/d1-ledger/package-lock.json`, blob `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`.
- `.github/workflows/d1-ledger-proof-validation.yml`, blob `09b143c21d560d7eef93930da8f8f93bda378799`.
- The committed lockfile has SHA-256 `73381e38dbec1ce06c8dcc79dc7b6c2008269713b632f6edb0ad18c8f31b0` according to the proof report; the Git blob was independently fetched.

Exact code/workflow commit `4229d8701f8ee79692619f481cef1d9d9483ff16` was fetched and its diff confirms CI no longer regenerates the lockfile before `npm ci`.

- D1 Workers-runtime run `42276825199`, job `128095160084`: COMPLETED / SUCCESS. Read-back shows checkout, pinned Node, `npm ci`, syntax check, Workers-runtime D1 tests and artifact upload all succeeded.
- Pool Contract Validation run `42276825193`, job `128095160288`: COMPLETED / SUCCESS. Read-back shows dispatch-disabled assertion, YAML parse and security-contract validation succeeded.
- The proof report records 13/13 Workers-runtime tests, including 12 concurrent consumers with exactly one winner, replay, binding mismatches, expiry, malformed input, storage failure and batch rollback.

Qualification boundary: this is a local Miniflare/workerd D1 runtime proof. No Cloudflare D1 account resource was provisioned, no live account quota/entitlement was checked, and no production Worker or Supervisor integration was performed. The proof does not establish production authorization.

## Source-level security findings

Positive:
1. A single conditional SQL UPDATE binds approval ID, owner numeric ID, repository ID, issue number, immutable target SHA, allowlisted profile, envelope digest, ready state, unconsumed state and expiry.
2. Only a successful storage result with exactly one changed row returns `ALLOW_ONCE`.
3. Replay, mismatch, expiry, missing storage and ambiguous storage exceptions deny.
4. The proof returns `dispatch: false` even on successful consumption.
5. The HTTP Worker entrypoint is inert; the proof has no GitHub, provider, dispatch or secret integration.
6. CI is pull-request-only, read-only, uses pinned action SHAs and a committed lockfile; no secret or deployment step is present.

Blocking gaps:
1. `ownerNumericId` is a caller-supplied binding, not derived from an authenticated GitHub identity in this adapter.
2. The ledger row's issuer and approval provenance are not authenticated. Matching `approvalId` and `envelopeDigest` is not proof of an owner-signed approval.
3. `now` is supplied by the caller. Production must use a trusted server-side clock.
4. No production issuance/revocation protocol, immutable audit trail, quota reservation/accounting, backup/restore qualification or live account-limit evidence exists.
5. The profile is a proof placeholder, not a production-approved executor.
6. The proof does not test Cloudflare account-level contention, deployed Worker identity, D1 availability/limits, recovery after real process interruption, or operational restore.

This source-level review is not an independent security review.

## Candidate comparison and disposition

| Candidate | Evidence | Main limitation | Disposition |
|---|---|---|---|
| A. Supervisor concurrency + Issue labels | PR #37 implements one-task serialized Supervisor and exact read-back | Issue label PATCH is not CAS; other writers are outside the concurrency group | Defense in depth only; insufficient for enabling untrusted/provider execution |
| B. Dedicated state repository + immutable refs | GitHub Create Ref documents 201/409/422 | Requires Contents: write; formal atomicity and delete/recreate resistance still need qualification; current Supervisor must not receive this permission | Not selected; isolated authority would need separate review |
| C. Conditional-write store (D1 candidate) | Local D1 proof demonstrates one-winner conditional consume under 12-way contention | Account entitlement, real isolated backend, caller/issuer provenance, trusted clock, audit, quota and recovery are unqualified | Strongest technical candidate; conditional selection only, NOT production-qualified |

## Decision

Advance candidate C to a bounded qualification stage because it has the clearest demonstrated conditional single-use behavior and avoids broadening the current Supervisor's GitHub permissions. This is a research/qualification decision only, not authorization to provision, deploy, integrate or dispatch.

Before production selection, require:
- verified free/card-free entitlement and account-specific quota limits from an authorized non-secret source;
- a dedicated isolated D1 database and narrowly scoped Worker identity, if entitlement is confirmed;
- server-derived authenticated owner identity and a verified owner-approval issuer/provenance chain;
- server-side trusted time;
- explicit issuance, revocation, immutable audit, idempotency and ambiguous-outcome recovery semantics;
- real backend contention test with two or more independent requests, durable receipts and request IDs;
- interruption/retry tests, backup/restore test and quota/failure-mode tests;
- exact-head CI, independent security review and governance requiring independent approval.

If free/card-free entitlement or least-privilege isolation cannot be proven, do not provision or use a paid fallback. Keep both dispatch gates fail-closed and retain the proof as non-production evidence.

## Actions not taken

No Cloudflare resource provisioning, billing change, deployment, OAuth, secrets access, provider/model call, GitHub dispatch, Worker/DSH/Resource Probe execution, permission change, merge or Contour B work.

## Status

- Local D1 single-use proof: VERIFIED for the tested code/workflow commit.
- Production claim backend: NOT SELECTED / NOT QUALIFIED.
- Caller and approval provenance: NOT IMPLEMENTED.
- Independent security review: NOT RUN.
- PR #36: OPEN / DRAFT; reviews and inline threads 0/0.
- PR #37: OPEN / DRAFT / UNMERGED; independent review NOT RUN.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical context window (working documentation branch, unmerged): https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
