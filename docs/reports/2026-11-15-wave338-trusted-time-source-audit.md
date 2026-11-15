# Wave 338 — Trusted-time source audit

Date: 2026-11-15
Status: source audit SUCCEEDED; trusted-time contract NOT IMPLEMENTED; supplementary Gemini event DISPATCHED / NOT VERIFIED.

## Trigger / supplementary execution
- Created exact owner-authored `/next` comment on MediaHub Issue #301: [comment 6900299252](https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6900299252).
- This is the supplementary MediaHub bridge, not the Cloud Pool-native controller required by Issue #94. Controller and child run IDs were not available through the exposed run-list interface; event DISPATCHED / controller outcome NOT VERIFIED.

## Immutable repository state
- Cloud Pool default branch `Основной` latest observed HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (recent commit search re-read).
- Clean isolated D1 proof branch `integration/d1-ledger-clean-main-2026-11-15`: ahead 6 / behind 0, merge base exactly the default HEAD. PR #87 remains OPEN / DRAFT / UNMERGED; its latest report records exact head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, D1 run `43712647597` SUCCESS (119/119 tests), Pool Contract Validation run `43712647615` SUCCESS, and push run `43712643907` SUCCESS. Formal reviews remain 0; aggregate status contexts empty / NOT VERIFIED.
- Documentation branch `docs/gemini-three-agent-next-bridge-2026-11-15`: ahead 72 / behind 0; documentation-only continuation, not default production state.
- Issue #94 remains OPEN. Cloud Pool-native controller is still a separate unimplemented requirement; the MediaHub #301 bridge does not satisfy it.

## Verified trusted-time gap
1. `proofs/d1-ledger/src/admit-qualified-task.mjs` on the clean integration branch requires caller-supplied `input.now` in `valid(input)`. First-admission batch binds that value as the registry assertion `checked_at`, approval `consumed_at`, admission time and route freshness/validity comparisons.
2. Exact-replay path also binds `input.now` repeatedly for route freshness, snapshot validity and issuer-key validity. No `unixepoch()`/database-derived timestamp is materialized in this adapter.
3. Migration `0014_atomic_admission_registry_assertion.sql` stores `checked_at` as a required caller-provided value and its trigger compares qualification, snapshot and issuer-key windows against `NEW.checked_at`; it does not independently establish trusted time.
4. `trusted-route-registry.mjs` verifies bundle freshness against caller-provided `now`. The persistence-capability revision in PR #93 changes persistence to accept only a verifier-issued WeakMap object, but the verifier's `verifiedAt` still derives from that supplied `now`; persistence stores it as `accepted_at` / `updated_at`. Capability integrity does not convert an untrusted clock input into trusted time.
5. The proposed Revocation Authority Contract v1 explicitly requires database-engine time, materialized once inside the D1 consistency boundary, for both event acceptance and admission. That requirement remains unmet.

## Security interpretation
- This is a qualification gap, not a demonstrated exploit in a deployed system. The package is an isolated local proof and all observed adapter responses retain `dispatch:false`.
- A caller able to choose `now` can influence freshness/expiry decisions in the proof adapter. Until database time is authoritative, passing tests with a synthetic `NOW` does not qualify trusted-time enforcement.
- Do not describe PR #87's 119 passing tests as proving the trusted-time contract. They prove the current local adapter behavior and its tested invariants.

## Next bounded implementation
1. Introduce a database-derived admission timestamp materialized once inside the D1 batch, then make approval expiry, route freshness, registry snapshot validity, issuer-key validity and immutable receipt/assertion all reference that same row/value.
2. Make exact replay use database time, not the original caller timestamp; preserve original receipt identity while rechecking current trust state.
3. Change root-registry verification/persistence so `accepted_at` is database-derived at the persistence consistency boundary, not copied from verifier caller input. Keep cryptographic signature validity checks parameterized by an explicit trusted-time provider and document the boundary.
4. Add adversarial tests for backdated/future caller clocks, expired route/snapshot/key, time unavailability, and batch rollback. A denied admission must leave approval ready and write no assertion/admission/receipt/task/attempt/outbox.
5. Keep revocation event verifier/ledger and external anti-rollback checkpoint separate; do not pretend the trusted-time fix alone completes revocation.

## Disposition
- ChatGPT source audit and documentation: SUCCEEDED.
- Gemini event: DISPATCHED / NOT VERIFIED.
- D1 exact-head historical evidence for PR #87: 119/119 tests PASS and Pool Contract Validation PASS at recorded head; independent review NOT RUN; current aggregate statuses NOT VERIFIED.
- Trusted DB clock: NOT IMPLEMENTED / NOT QUALIFIED.
- Revocation authority and same-batch revocation checks: NOT IMPLEMENTED / NOT QUALIFIED.
- Cloud Pool-native Gemini controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
