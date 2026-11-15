# Durable Qualified Route Registry and D1 Admission Binding — Design Contract v1

Date: 2026-11-15
Status: DESIGN / NOT IMPLEMENTED / NOT QUALIFIED
Target code ancestry: PR #76 HEAD `096737ec5e1a335b367fc7af67c29f7b71541e66`
Base A0/D1 proof: PR #72 HEAD `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`

## 1. Findings from source inspection

The current proof has three distinct layers:
- `0011_atomic_qualified_admission.sql` persists route qualification rows and binds their evidence digest, registry version, evidence reference, observation/expiry timestamps and revocation version into admission.
- `trusted-route-registry.mjs` verifies a root-signed bundle, its issuer keys and route signatures. The returned immutable result includes `registryEpoch` and `bundleDigest`, and always sets `dispatch:false`.
- `admit-qualified-task.mjs` reads the persisted qualification row and checks it during the D1 batch. It does not receive or check the root-verified bundle result.

Consequently, the current schema/admission does not persist or compare `registryEpoch`, `bundleDigest`, or `keyId`. The route row stores `registryVersion` only. There is no durable monotonic watermark. A valid root signature therefore does not yet establish that the qualification row was admitted from the currently authoritative registry snapshot.

The two replay-fix branches are not merged:
- `fix/qualified-route-replay-binding-2026-11-15` @ `da9a82e780c14c425f3feb4c01f10ec0daa6bc52`
- `fix/qualified-route-replay-binding-v2-2026-11-15` @ `923710ac9e67e0aca2680e020db2dc8c46d2437d`

The v2 commit adds schema/evidence/observed/revocation bindings to the admission comparison, but it still does not bind the root-signed registry epoch or bundle digest. Do not cherry-pick either branch without a full file-level and exact-head test reconciliation.

## 2. Required data model (additive migration 0012 proposal)

Use the existing D1 database and existing migration chain; do not create a parallel registry store.

Proposed append-only records:
- `pool_route_registry_snapshots`: `registry_epoch INTEGER PRIMARY KEY`, `registry_version TEXT`, `root_key_id TEXT`, `bundle_digest TEXT UNIQUE`, `issued_at INTEGER`, `valid_until INTEGER`, `accepted_at INTEGER`, `issuer_key_count INTEGER`, `route_count INTEGER`.
- `pool_route_registry_state`: exactly one row (`state_id=1`) with `current_epoch`, `current_bundle_digest`, `current_registry_version`, `updated_at`. Initialize only through a guarded first-accept operation; never silently reset it.
- Extend `pool_route_qualifications` with `registry_epoch`, `registry_bundle_digest`, and `issuer_key_id`. These must be copied only from the root-verified immutable result, not caller-provided values.
- Add an immutable snapshot-to-qualification relation or equivalent composite FK/trigger ensuring each qualification belongs to the referenced accepted snapshot.

Append-only triggers must prevent snapshot update/delete. State advancement is the only mutable operation and must be monotonic. A trigger or conditional update must reject epoch regression, same-epoch digest substitution, and any epoch reuse with a different digest.

## 3. Registry acceptance protocol

Cryptographic verification is performed before the D1 write using platform-pinned root configuration. The caller passes the verifier's immutable result plus the original verified route data to a narrow persistence adapter; never accept caller-constructed `verified:true`.

The persistence batch must:
1. Insert the snapshot only if its epoch is greater than the currently stored epoch (or no state exists for the first accepted snapshot).
2. Advance the singleton state with compare-and-swap against the exact previously read epoch and digest.
3. Insert the snapshot's issuer/route qualification records bound to that epoch and bundle digest.
4. Assert that exactly one state advancement and the expected number of immutable records occurred.
5. Commit all operations atomically; any failed assertion must abort the batch.

Concurrent registry writers must produce one winner. Equal epoch + equal digest is an idempotent no-op only if the complete snapshot already exists; equal epoch + different digest is a hard conflict. Lower epoch is always rejected. A caller must not be able to delete/reset the watermark through normal adapter APIs.

## 4. Admission consistency protocol

Extend the existing A0→D1 admission input and SQL predicates to include `registryEpoch`, `registryBundleDigest`, and `issuerKeyId`. In the same D1 batch that consumes approval and creates admission/attempt/outbox/receipt:
- require the qualification row to match all three values;
- require `pool_route_registry_state.current_epoch` and `current_bundle_digest` to equal the qualification's registry binding;
- require the corresponding append-only snapshot to exist and match;
- require issuer key identity/status and revocation version to be current under the accepted snapshot;
- record epoch, bundle digest, issuer key ID and revocation watermark in the immutable admission receipt.

An admission retry must compare the full persisted identity, including registry epoch/digest and issuer key ID. A registry advance between preflight verification and admission must fail closed. The SQL check inside the transaction is authoritative; an earlier JavaScript read is advisory only.

Do not make a separate D1 read followed by a later write and call it atomic. Do not accept the verifier result as a substitute for the transactional watermark check.

## 5. Revocation and rotation semantics

The accepted snapshot is the authoritative complete view. A newer snapshot can revoke an issuer key or route; the D1 current pointer advances atomically with its snapshot. Admission is allowed only against the current snapshot. Old evidence is invalidated by epoch/digest mismatch even if its timestamp has not expired.

Root key rotation is out of scope for v1. The platform root key remains pinned by deployment configuration. Root-key custody, dual-control rotation, rollback protection for the platform environment binding and recovery from accidental root compromise require a separate reviewed contract.

## 6. Required adversarial tests

- First snapshot initializes the singleton exactly once.
- Epoch N+1 advances from N; N or lower is rejected.
- Same epoch/same digest retry is idempotent; same epoch/different digest conflicts.
- Concurrent N+1/N+2 writers cannot leave the state at N+1 after N+2 has committed.
- Snapshot insert, pointer CAS, qualification inserts and assertion failure roll back as one unit.
- Missing snapshot, mismatched digest, issuer key substitution and route not present in snapshot deny admission.
- Admission using old epoch/digest after registry advancement is denied.
- Revoked issuer key or increased revocation version denies admission.
- Registry advancement racing with admission has only serializable outcomes: admission committed against the still-current snapshot before advancement, or admission denied after advancement.
- Exact retry returns the original receipt only when all registry identity fields match.
- Every result preserves `dispatch:false`.

## 7. Integration and acceptance gates

1. Reconcile replay-v2 changes against PR #72/#75/#76 file-by-file; do not merge stacks blindly.
2. Implement migration 0012 and adapter behind the isolated proof boundary.
3. Add the adversarial tests above and update frozen schema-0010 fixture/upgrade smoke to prove migration compatibility.
4. Wire root-verifier output to the persistence adapter through a typed internal interface.
5. Wire the persisted registry binding into A0→D1 admission and receipt.
6. Run exact-head Workers-runtime tests, syntax checks, D1 upgrade-binding smoke and frozen fixture smoke.
7. Re-read changed files/blobs and verify exact-head CI, PR ancestry, governance and reviews.
8. Only after independent review may this become a qualified implementation candidate. Production issuer trust, provider account identity, live quota, hosted D1, deployment and dispatch remain separate gates.

## 8. Explicit non-goals

No provider/model calls, secrets, hosted D1 provisioning, Worker deployment, dispatch, quota inference, root-key rotation, or Contour B work. The design does not claim that GitHub branch protection, successful local CI, or a registered key proves operational trust.

## 9. Source refs

- PR #72: https://github.com/VlDMlNSh/developer-cloud-pool/pull/72
- PR #75: https://github.com/VlDMlNSh/developer-cloud-pool/pull/75
- PR #76: https://github.com/VlDMlNSh/developer-cloud-pool/pull/76
- Issue #70: https://github.com/VlDMlNSh/developer-cloud-pool/issues/70
