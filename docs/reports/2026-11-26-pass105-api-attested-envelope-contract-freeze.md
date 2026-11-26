# Pass 105 — API-attested envelope contract freeze

Date: 2026-11-26

## Status

- **VERIFIED:** clean working branch created from canonical default SHA `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- **VERIFIED:** inspected Controller verifier/workflow from PR #176, D1 binder/Actions context adapter, migration 0017 and receipt path from PR #175.
- **SUCCEEDED (documentation):** proposed v1 envelope contract, canonical digest rules, migration 0018 requirements, workflow boundary and end-to-end DoD documented.
- **NOT IMPLEMENTED:** no runtime or migration changes.
- **NOT RUN:** tests, CI, live issue_comment, hosted D1, executor/provider calls, independent security review.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Key finding

The controller's API verifier and D1 binder currently have different contracts. Controller API output includes workflow-file Git blob SHA and its ref SHA but only writes a step summary. D1 derives a digest from flat Actions context. Migration 0017 has a `workflow_sha` column but no separate workflow blob SHA, Issue/Comment node IDs, explicit envelope schema/version, or separate API-observed run-head field. GitHub workflow commit SHA and Contents API blob SHA must remain distinct.

## Reuse First

Reuse PR #176's API read-backs and blob attestation, PR #175's D1 admission ledger, append-only receipt, primary read-back, replay reconciliation and Workers/Vitest harness. No new dependencies, service or parallel ledger.

## Frozen base and branch

- Base/default `Основной`: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Working branch: `integration/pass105-api-attested-envelope-contract-2026-11-26`.
- Scope: documentation-only contract freeze; no authority, workflow permissions, D1 runtime or migration changed.

## Deliverables

- `docs/contracts/2026-11-26-owner-next-api-attested-envelope-v1.md`: proposed strict schema, fixed ordered-array canonical SHA-256, D1 migration 0018 columns, workflow crossing-boundary validation and adversarial end-to-end DoD.
- `docs/reports/2026-11-26-pass105-api-attested-envelope-contract-freeze.md`
- `docs/checkpoints/2026-11-26-pass105-api-attested-envelope-contract-freeze.md`
- Context Window update on this working branch.

## Risks and gates

- Contract is a proposal and requires implementation/security review.
- Passing a JSON file between workflow steps does not authenticate it; D1 must independently validate schema/provenance and recompute digest.
- Hosted D1 binding, same-run callsite and production trust chain remain NOT VERIFIED.
- No merge, dispatch, deployment, provider calls, secret reads or production writes.
- Gemini/Claude/ECC/FCC NOT RUN. Independent security review NOT RUN. Active engineering time NOT MEASURED.

## Next

Implement the versioned envelope and migration on this clean integration branch, then wire the API verifier into the D1 adapter in one mocked Workers-runtime end-to-end test. Preserve fail-closed behavior and dispatch=false. Do not merge or enable execution.
