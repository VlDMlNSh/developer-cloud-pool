# Transactional route registry D1 schema and CAS proof

Date: 2026-11-15

Status: PR #82 EXACT-HEAD PR-CI VERIFIED / DATABASE TRANSACTION PRIMITIVES VERIFIED IN WORKERS RUNTIME / TYPED PERSISTENCE ADAPTER NOT IMPLEMENTED / CONTOUR A NOT ACCEPTED

## Immutable refs

- Default branch: `Основной` @ `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Documentation branch before this report: `docs/next-2026-11-15-route-registry-revalidation` @ `f8eb501c1beb4dc606d2993b0d62ab9af25900d2`.
- PR #80 remains OPEN / DRAFT / UNMERGED at `4dc81a377004502e8cae35583a734be5cc74cce6`.
- PR #82 is OPEN / DRAFT / UNMERGED; base PR #80 at `4dc81a377004502e8cae35583a734be5cc74cce6`; head `6a088b63a5f068665db286301bd6d360204fa288`; compare is 6 ahead / 0 behind.
- PR #82 formal reviews: 0. Inline review threads: 0.
- PR #79 is a separate documentation PR on `docs/next-2026-11-15-registry-epoch-hardening`; it is not the active documentation continuation branch used for this report.

## Work completed

Added migration `proofs/d1-ledger/migrations/0013_route_registry_rows_and_cas_guard.sql`:
- Immutable issuer-key rows bound by registry epoch to the accepted snapshot.
- Immutable qualified-route rows bound to issuer/key rows through a composite foreign key.
- SQL CHECK-backed CAS guard. A stale expected epoch yields a constraint failure before snapshot or child-row writes.
- Child-row insert triggers reject late additions after a registry epoch has become the active watermark.

Added Workers-runtime proof `proofs/d1-ledger/test/route-registry-transactional-cas.test.ts`:
- Initial snapshot + issuer + route + watermark installation in one D1 batch.
- Child-row update/delete rejection and late route insertion rejection.
- Monotonic watermark advance.
- Stale writer rejection with proof that snapshot, issuer and route tables contain no orphan rows and the CAS guard is empty.
- Competing writers started from the same expected epoch; exactly one batch succeeds in the local Workers runtime.

Extended `.github/workflows/d1-ledger-proof-validation.yml` so both push and stacked PR events can execute the proof.

## Verification evidence

Exact-head PR run [43709327229](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709327229), job `132797255446`: SUCCESS at `6a088b63a5f068665db286301bd6d360204fa288`.

Exact-head push run [43709322278](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709322278), job `132797240505`: SUCCESS at the same HEAD.

Completed steps: pinned Node setup, dependency install, syntax check, Workers-runtime D1 tests, isolated second D1 binding/migration smoke, frozen schema-0010 fixture smoke and artifact upload.

Artifact `14160225386`, 18,253 bytes, SHA-256 `7bdcb411dc43a8a39028339bf1e81f00737cbc3813aa04038098b154ec7990b9`.

Cloudflare's D1 Workers API documentation states that `D1Database.batch()` executes statements sequentially and non-concurrently and that a statement failure aborts/rolls back the entire batch: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch. The proof exercises this contract in the local Workers runtime. It does not qualify remote/hosted D1 deployment or cross-request production contention.

## Limits and governance

The PR establishes persistence schema and transaction primitives only. The typed adapter that consumes only `getVerifiedTrustedRouteRegistryBundle(result)` is NOT IMPLEMENTED. No production root/key lifecycle, cross-process authenticity, current-watermark check inside A0 admission, immutable receipt binding or end-to-end supervisor/worker execution is established.

Default branch still reports `protected=false`. Active ruleset #26550182 applies to `refs/heads/Основной`, requires PR and review-thread resolution but requires 0 approvals and has no required status checks. Formal review for PR #82 is absent. Do not merge this stacked PR independently.

No hosted D1, deployment, secret read, provider call, dispatch, Gemini, independent audit or Contour B work. `dispatch:false` remains. Contour A remains IN PROGRESS / NOT ACCEPTED; independent qualification is deferred until after an actual pool launch, as instructed.

## Next step

Implement the typed D1 persistence adapter. It must accept only a genuine verifier-issued result via `getVerifiedTrustedRouteRegistryBundle(result)`; derive the digest from the verifier result; map the exact immutable bundle to prepared statements; persist snapshot, issuer keys, routes and watermark in one D1 batch using the tested CAS guard; reject forged/copied/denied results and storage errors; read back and verify epoch/digest/row counts. Then bind registry epoch, bundle digest, root key ID and issuer key ID to Qualified Route Evidence, A0/D1 admission and immutable receipt in the same transaction.

Do not merge PR #80/#82 independently or enable dispatch.

## Links

- PR #80: https://github.com/VlDMlNSh/developer-cloud-pool/pull/80
- PR #82: https://github.com/VlDMlNSh/developer-cloud-pool/pull/82
- Exact-head PR CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709327229
- Exact-head push CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709322278
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/context/GITHUB-CONTEXT-WINDOW.md
- Checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/checkpoints/2026-11-15-a0-admission-route-qualification.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Historical status update — 2026-11-15

This report records the earlier standalone CAS-schema pass. Its proposed next step (typed persistence adapter) has since been implemented in the canonical PR #81 → #84 stack, and registry-bound A0 admission has been implemented in PR #85. PR #82's parallel migration 0013 was closed because it conflicts with PR #81's migration 0013. See the current report for live status and evidence: [verifier capability and atomic registry-bound admission](2026-11-15-verifier-capability-and-atomic-admission-registry.md).
