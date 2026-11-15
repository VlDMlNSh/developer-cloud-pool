# Wave 327 — D1 migration ancestry reconciliation for revocation ledger

Date: 2026-11-15
Status: RECONCILIATION VERIFIED; no schema/code mutation.

## Immutable baseline

- Cloud Pool default branch `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Canonical clean integration candidate: `integration/d1-ledger-clean-main-2026-11-15`.
- Existing accepted migration ancestry on that candidate is additive and linear through:
  `0011_atomic_qualified_admission.sql`,
  `0012_durable_route_registry_snapshots.sql`,
  `0013_persist_verified_route_registry.sql`,
  `0014_atomic_admission_registry_assertion.sql`.
- Migration 0013 blob: `40b93551c787078e5c65c8861569bb428bd2eb8b`.
- Migration 0014 blob: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.

## Branch ancestry comparison against default

| Branch | Ahead | Behind | Merge base | Disposition |
|---|---:|---:|---|---|
| `integration/d1-ledger-clean-main-2026-11-15` | 6 | 0 | default HEAD | CLEAN CANDIDATE |
| `fix/verified-registry-capability-clean-stack-2026-11-15` | 15 | 0 | default HEAD | CLEAN CANDIDATE, contains same 0013/0014 |
| `impl/route-registry-d1-cas-schema-2026-11-15` | 101 | 64 | `221f216c00ca7e5596bcc682ba185ad155a10603` | DIVERGED; DO NOT TRANSPLANT |
| `fix/qualified-route-replay-binding-v2-2026-11-15` | 60 | 64 | `221f216c00ca7e5596bcc682ba185ad155a10603` | DIVERGED; DO NOT TRANSPLANT |

The two diverged branches contain an alternate migration 0013 (`0013_route_registry_rows_and_cas_guard.sql`) rather than the canonical clean-chain migration 0013 (`0013_persist_verified_route_registry.sql`). This is a migration identity collision, not a safe additive continuation. The searched migration names 0015/0016 do not exist on the default, clean integration candidate, or the inspected divergent branches.

## Verified current SQL constraints

- Migration 0013 binds qualified routes to issuer key + registry epoch + bundle digest when those fields are supplied; it retains a legacy all-NULL compatibility path.
- Issuer key rows and qualification registry identity are append-only/immutable.
- Migration 0014 performs the current registry snapshot, active issuer key, qualification validity, and evidence identity checks inside the admission assertion trigger.
- It does not consult a separate route/issuer revocation event ledger or monotonic revocation head.
- No independent trusted-time attestation is added by these migrations.

## Engineering decision

Use `integration/d1-ledger-clean-main-2026-11-15` as the only migration ancestry candidate for a future additive migration 0015. Do not transplant files from the diverged `impl/route-registry-d1-cas-schema` or `fix/qualified-route-replay-binding-v2` branches.

Do not create migration 0015 yet. The revocation authority trust root, authorized REVOKE/REINSTATE roles, subject identity canonicalization, event signing format, trusted-time authority, and external restore anchor are not yet bound to an accepted contract. A schema-only migration would prematurely freeze those security semantics and could create a false claim of revocation enforcement.

## Next bounded step

Resolve and document the revocation authority trust-root and signer lifecycle against the existing root-signed registry model. Define exact subject keys for route qualifications and issuer keys, signed canonical event bytes, strict sequence/digest CAS, and trusted-time evidence. Then implement verifier + migration 0015 + same-batch admission guard on the clean candidate, with D1 adversarial tests. Keep dispatch disabled.

## Execution boundaries

No branch created, no schema/code/workflow changes, no tests, no secret reads, no provider/model calls, no dispatch, deployment, or merge. Gemini Cloud Pool agents NOT RUN; Issue #94's Cloud Pool-native controller remains absent.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
