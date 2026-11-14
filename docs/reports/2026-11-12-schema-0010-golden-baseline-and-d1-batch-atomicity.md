# Schema-0010 golden baseline and local D1 batch atomicity — 2026-11-12

## Status

**GOLDEN FIXTURE DIGEST FROZEN / D1 BATCH FAILURE-ATOMICITY PROOF VERIFIED / EXACT-HEAD CI VERIFIED / MIGRATION 0011 NOT CREATED OR APPLIED.**

This is an author-side local Workers-runtime proof only. It does not qualify hosted D1, Cloudflare production behavior, a real 0010→0011 upgrade, or Contour A.

## Immutable target and changes

- PR: [#67 — receipt-bound D1 projection delivery orchestration](https://github.com/VlDMlNSh/developer-cloud-pool/pull/67)
- Base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Exact tested head: `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`
- Working branch: `impl/receipt-bound-projection-2026-11-11`
- Golden fixture file: `proofs/d1-ledger/fixtures/schema-0010-v1-golden.json`, blob `7b5a560a28e1669624981b55141176c393b68191`.
- Fixture test: `proofs/d1-ledger/test/d1-upgrade-fixture.smoke.ts`, blob `d2f875700243c1874fd0c1bd251b4257ba2bb48f`.
- Isolated test config: `proofs/d1-ledger/vitest.upgrade-smoke.config.ts`, blob `74a6f1ecbffb1ef2a83f8574606db66094dce0ff`.
- Four synthetic local D1 namespaces are configured for the fixture/replay and isolated failure probe. No remote proxy, hosted D1 ID, Cloudflare account resource, or credential is configured.

## Frozen canonical fixture

- Canonicalization: recursively sort object keys lexicographically; preserve array order; serialize with `JSON.stringify`; encode UTF-8; hash SHA-256.
- Golden SHA-256: `afbf1445c6d2fa0b51cdbd0da932d158aa2850832ca8297f83b103c00d8b2187`.
- Canonical UTF-8 length: `16160` bytes.
- The test independently builds the schema-0010 fixture in two local D1 databases, deep-compares snapshots and fake marker bodies, then asserts the canonical digest and byte length against the checked-in JSON artifact.
- Fixture includes succeeded, failed, abandoned and nonterminal indeterminate paths; retry generations through dead-letter; all comment states and append-only comment events; reconciliation queue state; synthetic marker bodies only.

## Failure atomicity proof

- A separate fresh synthetic local D1 namespace runs a failing D1 `batch()`: CREATE TABLE, first unique insert, then duplicate unique insert.
- The batch rejects; a read-back of `sqlite_master` confirms the table itself is absent. Thus earlier DDL and DML in that batch were rolled back in the pinned local Workers/Miniflare D1 runtime.
- This proves local D1 batch transaction atomicity for the tested sequence. It does **not** prove `applyD1Migrations` behavior for an arbitrary malformed migration file, migration 0011 semantics, or hosted D1 behavior.

## Exact-head CI evidence

- [Isolated D1 Ledger Proof run 43182768560](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43182768560): COMPLETED / SUCCESS on exact head `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`; job `131062534343`.
  - Syntax check passed.
  - Standard Workers suite: 5 files / 69 tests passed.
  - Separate binding smoke passed.
  - Golden fixture + batch atomicity suite: 2 tests passed.
  - Golden SHA and byte count were emitted and matched the checked-in artifact.
  - Artifact ID `13927451100`, size 18,253 bytes, SHA-256 `99ac207c743903f1b3aff8d53d58a12c719284b0970a90b456bfcf7b402bfde3`.
- [Pool Contract Validation run 43182768593](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43182768593): COMPLETED / SUCCESS on the same exact head.
- Combined status contexts: empty. The two exact-head workflow runs are evidence; no claim is made that combined status contexts are green.

## Pull request and governance state

- PR #67 remains OPEN / DRAFT / UNMERGED; mergeable=true; formal reviews 0; inline review threads 0.
- PR #66 documentation branch: head `5e8399ccaa6e8044f51c857ec08da3af93338f92`, OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED.
- PR #60 remains OPEN at `134fe6fe739a09b181fee88463ac848a6b059206`; exact-head CI NOT VERIFIED.
- PR #63 remains OPEN at `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`, mergeable=false; exact-head CI NOT VERIFIED.
- Default branch remains `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Effective ruleset details were not re-read: no ruleset/branch-protection action is exposed in the connected GitHub tool inventory. Governance status beyond the previously recorded evidence is NOT VERIFIED.
- Independent technical/security/governance audit remains deferred until after Cloud Pool launch, per owner direction. No Gemini dispatch, executor invocation, secret access, hosted D1, live GitHub write, deployment, merge or pool dispatch was performed.

## Explicit non-proofs and next step

- No populated schema-0010 → schema-0011 before/after preservation test exists.
- Migration 0011 is NOT CREATED / NOT APPLIED.
- No static migration checksum, hosted D1 qualification, production GitHub consistency proof, Recovery Actor, or Contour A acceptance is established by this report.
- Next bounded step: build a populated schema-0010 fixture, capture its full immutable v1 state, draft migration 0011 only on an isolated candidate branch, apply it to a copy, and compare all historical rows/IDs/digests/marker bytes plus schema invariants. Keep v1 writer semantics unchanged; no v2 writer.

## Canonical project references

- [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Continuation checkpoint](../checkpoints/2026-11-11-projection-stack-continuation.md)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
