# Qualified Route Evidence and Atomic A0/D1 Admission Contract

**Status:** IMPLEMENTED IN ISOLATED PROOF / NOT QUALIFIED  
**Date:** 2026-11-15  
**Contour:** A only  
**Dispatch:** MUST remain disabled

## 1. Purpose

Define the minimum evidence and transaction boundary required before a provider route can be admitted to a Cloud Development Pool task. This contract closes the gap between the pure quota ledger selector, the isolated A0 admission evaluator, and the isolated D1 approval/task/attempt/outbox proof.

This document is normative for subsequent implementation. It does not authorize provider calls, dispatch, deployment, or production use.

## 2. Trust boundaries

The following values are not authority by themselves:

- inventory declarations such as `declared_cost_class: free`;
- a caller-supplied route ID, provider ID, quota-domain ID, or billing class;
- presence of a credential handle or repository secret;
- a local quota-ledger state transition;
- a successful pure `verifyQuotaEvidence` callback whose implementation and provenance are not qualified;
- a successful isolated D1 proof test.

A route selector is a filter, not an authorization authority. Admission must resolve the requested route against a trusted, versioned qualification record.

## 3. QualifiedRouteEvidence record

The admission adapter must accept one immutable, schema-versioned evidence record with at least:

| Field | Requirement |
|---|---|
| schemaVersion | Exact supported integer version |
| qualificationId | Unique stable ID for this qualification revision |
| routeId | Exact route registry key |
| providerId | Canonical provider identity |
| modelId | Exact allowed model identifier |
| issuerId | Authority that issued the qualification |
| accountRef | Opaque, non-secret account identity; never raw credential material |
| credentialHandleRef | Opaque secret-manager handle reference; never secret value |
| quotaDomainId | Canonical quota/account scope; mandatory for external free-quota routes |
| costClass | Explicitly allowed class; free quota requires provider evidence |
| capabilityProfile | Exact allowlisted execution profile |
| evidenceRef | Immutable provider evidence reference or signed evidence digest |
| evidenceDigest | SHA-256 digest of canonical evidence bytes |
| observedAt | Provider-evidence observation time |
| validUntil | Expiry; must be later than admission time |
| revocationVersion | Monotonic revocation/version watermark |
| status | Must equal `qualified`; revoked/suspended/unknown deny |
| registryVersion | Immutable route registry revision |

The evidence verifier must authenticate issuer provenance, bind every identity field to the registry record, validate the evidence digest, enforce freshness and revocation, and return a typed result. Caller-provided fields must never override the registry record.

## 4. Admission binding

The evidence digest and qualification ID must be bound to the exact admission envelope:

- owner/tenant identity;
- repository ID and issue number;
- immutable target commit SHA;
- allowlisted capability profile;
- logical task key;
- attempt ID and attempt number;
- approval ID and envelope digest;
- route qualification ID and evidence digest;
- idempotency key.

Any mismatch, missing value, expired evidence, revoked qualification, unknown account/domain, ambiguous issuer, unsupported model/profile, or evidence-verification error must deny admission before consuming approval.

## 5. Atomic D1 transaction boundary

The desired single D1 transaction must perform the following ordered logical operations:

1. Read and validate the current route qualification/revocation version under the admission transaction's consistency boundary.
2. Conditionally consume the exact unexpired, unrevoked, single-use owner approval with matching owner/repository/issue/target SHA/profile/envelope digest.
3. Insert an immutable admission record containing the route qualification ID, evidence digest and all task/attempt bindings.
4. Create or attach the canonical logical task, rejecting task-key binding conflicts.
5. Create the immutable attempt row and update the task's current-attempt pointer using the existing trigger/fencing invariants.
6. Insert exactly one durable queue-intent/outbox record bound to the same admission/task/attempt/evidence digest.
7. Read back all rows and verify exact identity bindings before returning a queue-only success result.

All writes must commit or roll back together. A failed, partial, or ambiguous result must return DENY / NEEDS_RECONCILIATION with `dispatch:false`. A retry must resolve state by durable read-back and deterministic idempotency keys; it must not consume another approval or create a second attempt/outbox item.

No external provider or GitHub network call belongs inside this D1 transaction. Evidence is authenticated before transaction entry, then the immutable digest and registry/revocation version are checked within the transaction. If the current D1 consistency model cannot guarantee that version check, admission must fail closed until a suitable authority store/transaction boundary exists.

## 6. Required invariants and adversarial tests

- Unknown, stale, revoked, malformed, issuer-mismatched or account-mismatched evidence is denied.
- Route ID, model ID, accountRef, issuerId and quotaDomainId must all match one registry qualification.
- Caller billing allowlists cannot promote unknown quota evidence.
- A free-quota route without a verified quota domain is denied.
- A capability for one target SHA/profile/repository cannot be replayed against another.
- Concurrent admission attempts with the same approval have exactly one winner.
- A task-key collision with different immutable bindings rolls back approval consumption.
- Failure after approval update but before attempt/outbox insertion rolls back the whole transaction.
- Ambiguous transaction outcome returns no dispatch authorization; durable read-back resolves the result.
- Attempt IDs and execution idempotency keys are immutable and unique.
- Stale lease generations cannot finalize or renew.
- Outbox identity is unique per admitted attempt (or per explicitly defined task event); no duplicate dispatch intent.
- Revocation racing admission is deterministic and fail-closed.
- Every denial is auditable without logging secret material.

## 7. Compatibility with existing proof components

Reuse, do not duplicate, the isolated mechanisms where their contracts remain valid:

- A0 admission contract: immutable task binding and owner approval checks, but its callback-based quota verifier is not sufficient as final route authority.
- D1 consume adapter: conditional single-use approval transition; it must be composed into the larger transaction rather than invoked as a separate preflight.
- Logical task claim/outbox: task identity and durable intent trigger; extend its schema/binding to include admission and route evidence digests.
- Immutable task attempts: retain attempt identity, fencing and read-back checks.
- Quota Ledger: retain pure cooldown and provider outcome transitions; never treat its selector output as authorization.

## 8. Explicit non-goals

This contract does not create or reveal provider credentials, verify that any current provider account has usable free quota, provision hosted D1, enable dispatch, call a model/provider, deploy a Worker, or qualify any executor. No production route is admitted by this document.

## 9. Acceptance criteria for implementation

- Migration design reviewed for SQLite/D1 transactional semantics and trigger ordering.
- Typed evidence schema and canonical digest format published with fixtures.
- Atomic admission adapter implemented without external side effects inside the transaction.
- Adversarial concurrency, rollback, replay, revocation and ambiguous-outcome tests pass on exact head.
- Exact-head CI and required branch-protection checks verified.
- Independent review after the pool itself is operational.
- Dispatch remains false until separate explicit qualification and authorization.

## 10. Source evidence reviewed

- PR #67 A0 source blob: `14c31d66995d6f99ceb6ea5df060ba8e00848464`.
- PR #67 D1 consume source blob: `f71e559a7c13b9a0242a7f619eba998c5906d95e`.
- PR #67 logical-task migration blob: `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- PR #67 immutable-attempt migration blob: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- PR #67 A0 tests blob: `0070fffdf0595b5ebd9edced0b0e92bebf3af38c`.
- Quota Ledger fail-closed PR #71: https://github.com/VlDMlNSh/developer-cloud-pool/pull/71

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 11. Implementation evidence — 2026-11-15

An isolated local D1 proof has been implemented on stacked PR #72:
https://github.com/VlDMlNSh/developer-cloud-pool/pull/72

- Exact implementation HEAD: `16aa4cc2d3265bd4d7a10e4581a57cfe0baf5875`.
- Additive migration 0011 introduces schema-versioned route qualification rows, immutable admission records, commit receipts and one-way task-outbox binding to admission ID, attempt ID and evidence digest.
- The composite adapter performs approval consumption, existing task/outbox trigger, admission insertion, existing immutable attempt trigger, outbox binding and a CHECK-backed commit receipt in one D1 batch. The final receipt assertion aborts the batch if any required row/binding is missing. Durable read-back follows commit.
- The persisted route row includes schemaVersion, qualificationId, routeId, providerId, modelId, issuerId, accountRef, credentialHandleRef, quotaDomainId, costClass, capabilityId, capabilityProfile, evidenceRef, evidenceDigest, observedAt, validUntil, revocationVersion, registryVersion and qualification status. Freshness is capped at 300 seconds. Revocation is monotonic.
- One admission per logical task is enforced in this proof to preserve the existing task-level outbox's one-to-one admission binding.
- Exact-head workflow run 43689591339: SUCCESS at the exact HEAD above. Workers-runtime: 7 files / 91 tests passed, including rollback, replay, revocation, stale-evidence, binding-substitution and concurrency cases. Upgrade-binding smoke 1 passed; frozen schema-0010 fixture smoke 2 passed.
- Dispatch remains false. No provider call, secret access, hosted D1, deployment or executor qualification.

### Remaining acceptance blockers

This is not a qualified route or production admission. The proof assumes route qualification rows were inserted by a trusted authority. It does not implement or qualify that writer, cryptographically authenticate issuer provenance, prove canonical evidence-byte serialization/digest generation, verify current provider-account identity or establish live quota availability. Synthetic evidence fixtures are not provider evidence. Combined commit status has zero contexts and required status checks remain NOT VERIFIED. No independent technical/security/governance review has been performed; per project decision, independent review remains deferred until the pool is operational.

Therefore Sections 3–9 remain normative acceptance requirements. Status remains NOT QUALIFIED; dispatch must remain disabled; Contour A is not accepted.


### Final exact-head correction — 2026-11-15

The implementation evidence above was superseded by final head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`. Exact-head workflow run `43690143805` completed SUCCESS: 7 Workers-runtime test files / 93 tests passed, including 9 atomic-admission tests; upgrade-binding smoke 1 passed; frozen schema-0010 fixture smoke 2 passed. Artifact `14152082768`, SHA-256 `be9cc8ff9c1d88525eebe5504cf78cfbd3650d0d785917a08f2764ef3401a098`.

The final migration/adapter also binds the existing task outbox one-way to admission ID, attempt ID and evidence digest, and checks that binding in the transaction receipt and post-commit read-back. PR #72 remains OPEN/DRAFT/UNMERGED. At later immutable comparison snapshot `a0200d102f25771bbb52e6dcacaa663dd46da6f8`, default → PR #72 was DIVERGED 67 ahead / 40 behind.

No change to qualification status: trusted qualification writer, cryptographic issuer/evidence verification, canonical evidence-byte serialization/digest generation and live provider/account/quota proof remain NOT IMPLEMENTED/NOT QUALIFIED. Combined status has zero contexts. Dispatch remains false.


## Quota-ledger ancestry reconciliation — 2026-11-15

- Current default at start of reconciliation: `Основной` @ `55d9af7c71b4b51c2b886176f1d65da192900423`.
- Stale PR #71 source branch `fix/quota-ledger-fail-closed-2026-11-15` @ `40a49acabd12aa178d3aa136244fb4f42231fbde` was 3 commits ahead / 27 behind current default. It was not merged.
- Clean reconciliation branch `reconcile/quota-ledger-fail-closed-2026-11-15`; Draft PR #74: https://github.com/VlDMlNSh/developer-cloud-pool/pull/74
- PR #74 exact HEAD `e1b51e7165f96c8c459c672943dfa8b862879db4`; at the initial immutable base compare was 5 ahead / 0 behind. After canonical docs refresh, default HEAD reached `c424e62c89ce40a6fb72202e41659ce27c168f03`; compare was 5 ahead / 1 behind and PR API reported mergeable=true. Three paths only: pure quota ledger, its test suite, and the existing pool-contract workflow extended to run that suite.
- Added safe own-property route-key construction and a `__proto__` regression. Exact-head run https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43692093254 COMPLETED / SUCCESS; job `132744702990`; contract validator PASS; YAML parse PASS; 13 quota tests passed; dispatch gate observed false.
- Combined commit-status contexts remain empty; required contexts NOT VERIFIED. PR #74 remains OPEN / DRAFT / UNMERGED; no independent review.
- Quota ledger remains a pure selector/state machine, not a trusted provider evidence verifier. It does not authenticate issuer, signature, provider account, evidence bytes or live quota. Qualified Route Evidence remains NOT QUALIFIED.
- PR #72 remains OPEN / DRAFT / UNMERGED at `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`, exact-head run `43690143805` SUCCESS, stacked on PR #67. At snapshot `a0200d102f25771bbb52e6dcacaa663dd46da6f8`, default → PR #72 was DIVERGED 67 ahead / 40 behind; default → PR #67 was DIVERGED 47 ahead / 40 behind. Do not transplant either full stack.
- At snapshot `a0200d102f25771bbb52e6dcacaa663dd46da6f8`, PR #73 documentation branch was OPEN / DRAFT and diverged 4 ahead / 13 behind; its docs are being reconciled directly into canonical files, not merged wholesale.
- Active ruleset `26550182` applies only to default branch, requires PR and review-thread resolution, but has 0 required approvals and no required status contexts. Branch-protection endpoint remains NOT VERIFIED (403).
- No provider login/call, secret read, hosted D1, Worker deployment, dispatch, merge or production resource creation.
- Report: [Quota-ledger ancestry reconciliation](../reports/2026-11-15-quota-ledger-ancestry-reconciliation.md).
- Next: implement authenticated trusted route-evidence writer/verifier (canonical serialization/digest, issuer/provenance, exact provider/model/account/quota-domain binding, freshness and monotonic revocation), then bind its immutable verified result into the existing atomic A0→D1 transaction. Dispatch remains disabled.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Rebased PR #74 exact-head correction — 2026-11-15

This section supersedes the earlier PR #74 head and workflow run recorded above.

- The three-file quota-ledger change was re-anchored onto the then-current default HEAD `f36c733ed528b0cd1050f05965a5de3154766b13` using a new tree based on that exact commit and a force-with-lease update of only the owned reconciliation branch. Default branch was not changed by the rebase operation.
- Rebased PR #74 HEAD: `ebcdaeb3421889be0b710a4b6b6e83deeafa0144`; parent is the immutable default snapshot above. Compare at that snapshot: 1 ahead / 0 behind; GitHub PR API reports mergeable=true.
- Exact-head PR workflow: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43692828719 — COMPLETED / SUCCESS at exact head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144`; job `132746870777`.
- Pool contract validator PASS; YAML parse PASS; quota-ledger tests 13 PASS / 0 FAIL; dispatch gate observed `POOL_DISPATCH_ENABLED=false`.
- Final blobs unchanged: source `419f010a18c61abefafbb4845c55ea7c6bb1ab90`; tests `d5291729bdcf9261fcdb9be97998a9b8158bea23`; workflow `4e47b8e8850833d930cdd457bea91c2cec507576`.
- PR #74 remains OPEN / DRAFT / UNMERGED. Combined status contexts are empty and no independent review exists. Required status contexts remain NOT VERIFIED.
- No provider login/call, secret read, hosted D1, Worker deployment, dispatch, production resource creation or merge.
- This quota ledger remains non-authoritative: it does not authenticate issuer/provider/account/evidence or prove live quota. Qualified Route Evidence remains NOT QUALIFIED.


## Qualified Route Evidence verifier proof — 2026-11-15

This section supersedes the previous "trusted route evidence writer/verifier NOT IMPLEMENTED" detail only for the isolated cryptographic verifier component. It does NOT qualify the registry trust source or any live provider route.

- Report: [Qualified Route Evidence verifier proof](../reports/2026-11-15-qualified-route-evidence-verifier.md).
- PR #75: https://github.com/VlDMlNSh/developer-cloud-pool/pull/75
- Feature branch: `proof/qualified-route-evidence-verifier-2026-11-15`; exact HEAD `f253f68194e65912a91c91f2d158525b97927749`.
- Base branch is the existing atomic A0→D1 PR #72 at `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`. PR #75 is OPEN / DRAFT / UNMERGED.
- Added `proofs/d1-ledger/src/qualified-route-evidence.mjs` (blob `0d5b97ad0bc59173fe8c4c7de28c67965bd09ad0`) and `proofs/d1-ledger/test/qualified-route-evidence.test.ts` (blob `7624eedcb13884982ae434819e50882163de4cff`). Package check blob `e7f9e9967032e94f4d15a1008353e558375a6d52`; D1 workflow blob `9e40f72298bf07dd7928154eba75b28033ac2ec6`; README blob `b1d2b092bc9df9d0a0ce2addd64d24f839d8754c`.
- Canonical v1 evidence bytes are UTF-8 JSON for a fixed-position array with exact field allowlist and explicit null; SHA-256 fixed test digest `3d409b69df838b6ba0826a950c7d43940b5127aba25fc320b192d9c2b33d43da`.
- Detached ES256 verification (ECDSA P-256 / SHA-256) checks signature, issuer/key ID, provider/model/account/credential/quota-domain/capability/registry/revocation binding, maximum evidence age 300s, expiry and key validity. Unknown fields fail closed.
- Ten new adversarial test cases. Exact-head run `43694628561`, job `132752333196`: COMPLETED / SUCCESS at exact HEAD `f253f68194e65912a91c91f2d158525b97927749`; syntax check PASS; Workers-runtime suite 103 PASS / 0 FAIL; upgrade-binding smoke PASS; frozen schema-0010 fixture smoke PASS; lockfile artifact `14153962592`.
- Combined commit-status contexts remain empty (0); required status contexts NOT VERIFIED. No independent review. Active ruleset `26550182` applies only to default branch and configures 0 required approvals / no required status contexts; branch protection endpoint remains NOT VERIFIED (403).
- At default snapshot `3f3d4a25024f6d3475f16c46bee383c174b5756c`: default → PR #72 DIVERGED 67 ahead / 50 behind; default → PR #74 DIVERGED 1 ahead / 5 behind; default → PR #75 DIVERGED 72 ahead / 50 behind (PR #75 is stacked on #72).
- CRITICAL TRUST LIMIT: verifier accepts caller-supplied `trustedRoute` and `trustedIssuer` snapshots and verifies their consistency; it cannot establish that those snapshots are authoritative. Pinned/access-controlled trust root, registry loader, key custody/rotation, durable revocation writer and atomic D1 re-check are NOT IMPLEMENTED. Verifier output is not wired into `admitQualifiedTask`.
- No provider login/call, secret access, hosted D1, Worker deployment, dispatch, production resource creation, executor qualification or merge. Test keys are ephemeral only. Dispatch remains disabled.
- Next: implement the trusted registry source and key lifecycle; then bind verified digest plus exact registry/revocation watermark into the same D1 transaction as approval consumption. Add revocation-race and rollback tests. Do not treat caller-supplied trust snapshots as production authority.

Status: verifier component IMPLEMENTED / exact-head CI VERIFIED; trust root and durable registry NOT IMPLEMENTED; Qualified Route Evidence NOT QUALIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 10. Root-signed registry bundle authority boundary (proof extension)

A registry bundle verifier MUST NOT accept its trust root from the request or from the bundle being verified. The isolated proof loads `ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK` from platform environment bindings and verifies the bundle's detached ES256 signature against that configured public key. The bundle signature covers its canonical versioned issuer-key set and route evidence/signatures; each route evidence signature is then checked against the corresponding issuer key from the root-signed bundle.

Bundle v1 uses fixed-position canonical JSON, exact nested field allowlists, uniquely ordered issuer and route records, a maximum age of 300 seconds, and a maximum lifetime of one hour. The verified result is immutable and non-dispatching.

**This verifier does not complete the production authority boundary.** It does not prove that environment/deployment configuration is access-controlled, implement root-key custody or rotation, persist the registry bundle, enforce a durable monotonic epoch/revocation watermark, prevent replay/rollback across requests, or re-check that watermark in the same D1 consistency boundary as approval consumption. Until those controls are implemented and qualified, this bundle verifier output MUST NOT be treated as production route qualification or passed to admission as authoritative. Dispatch remains false.
