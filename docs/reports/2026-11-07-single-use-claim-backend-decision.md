# Single-use Supervisor claim backend decision — 2026-11-07

## Status

**DECISION: NO BACKEND IS CURRENTLY ADMITTED FOR DISPATCH. Keep both dispatch gates fail-closed.**

This is a bounded architecture decision for Issue #38, based on the current repository evidence. It is not independent security approval, runtime qualification, or authorization to provision infrastructure or enable dispatch.

## Immutable evidence reviewed

- Default branch: `Основной`; latest recorded HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Issue #38: [Design and qualify durable single-use Supervisor task claims](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38).
- PR #37: [Reusable Supervisor→Worker authorization boundary](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37), head recorded by Issue #38: `5587a4e013507b5be330fd0c49ce1fc836faa946`; exact-head static CI runs `42284044591` and `42284051311` recorded SUCCESS; independent review 0.
- PR #36: [Local D1 single-use ledger proof](https://github.com/VlDMlNSh/developer-cloud-pool/pull/36), latest parent head recorded in PR #39: `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- PR #39: [Atomic D1 claim and transactional outbox proof](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39), immutable child head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c).
- PR #39 exact-head PR run `42329993548`, job `128274072508`, and push run `42329991471`, job `128274065481`: COMPLETED / SUCCESS. Read-back shows npm ci, syntax, Workers-runtime tests and artifact upload all succeeded; 2 test files / 19 tests.
- PR #39 submitted reviews: 0; inline review threads: 0. PR #36 submitted reviews: 0. Independent security review NOT RUN.
- Ruleset `26550182` is recorded as targeting only `refs/heads/Основной`, with zero required approvals and CODEOWNERS review disabled. PR #39 is stacked on PR #36's proof branch, not directly protected by that default-branch ruleset.
- Current default-branch HEAD, ruleset and dispatch variable were not freshly re-read in this pass; the HEAD and ruleset details above are the latest recorded evidence, not a fresh governance attestation.

## Backend comparison

### A. Serialized Supervisor + GitHub Issue labels

**Guarantee:** workflow concurrency can reduce simultaneous Supervisor executions within one configured concurrency group. Exact label read-back can detect some conflicting or ambiguous outcomes.

**Does not guarantee:** atomic compare-and-swap on Issue labels, exclusion of other actors/workflows, or database-grade exactly-once claims. GitHub Actions pending-run ordering is not a durable FIFO queue. A serialized workflow is not a global lock.

**Authority/cost:** stays closest to the existing GitHub control plane and does not require a new database. However, it relies on a documented single-writer governance rule and residual race acceptance.

**Disposition:** acceptable only as an explicitly documented, fail-closed interim intake mechanism for non-dispatch/read-only validation. **Not acceptable as the durable single-use dispatch claim primitive.** No dispatch enablement.

### B. Dedicated GitHub state repository with immutable per-task refs

**Candidate primitive:** one unique ref per immutable task/approval identity; concurrent creation attempts may race on the same ref name, with the Git refs API returning a conflict for an already-existing ref. This is a candidate reservation pattern, not yet a qualified CAS contract.

**Required proof:** exact behavior under concurrent create attempts; deterministic ref naming and content binding; retry/read-back semantics; recovery after ambiguous responses; protection against deletion/recreation or mutation; audit provenance; and a narrowly scoped authority design.

**Authority risk:** GitHub's create-reference endpoint requires repository Contents write. Giving that permission to the current Supervisor would be an unacceptable privilege expansion. A separate state repository and distinct, narrowly scoped credential would be required, and its effective scope and protection against ref deletion/recreation must be demonstrated. A separate repository alone does not prove immutability.

**Disposition:** retain as a GitHub-native alternative for a later proof. Do not grant Contents write to the current Supervisor and do not treat HTTP 409 behavior alone as complete qualification.

### C. Conditional-write database/store (Cloudflare D1 candidate)

**Candidate primitive:** conditional SQL state transition with a transactionally coupled claim/outbox write. The current local proof implements a `ready -> consumed` conditional update and an SQLite trigger that creates claim and outbox rows in the same transaction. The adapter returns `dispatch: false` on every result.

**Evidence:** PR #36/#39 local Workers-runtime tests exercise concurrent attempts, deterministic retry, immutable-binding mismatch, pre-consumed replay rejection and rollback on outbox insertion failure. PR #39 exact-head CI passed 19 tests across two files.

**Limitations:** this is Miniflare/local D1 evidence, not a provisioned remote D1 concurrency/operational test. Identity and issuer fields are still caller-supplied in the proof; authenticated owner derivation, signed issuer provenance, repository authorization, trusted clock, key rotation/revocation, audit, quota, lease/fencing, crash recovery, dead-letter and production Supervisor integration are not qualified. Cloudflare Workers/D1 Free entitlement and card-free eligibility are NOT VERIFIED.

**Authority/cost:** strongest transactional model among the three candidates if the actual remote service and account eligibility can be qualified. It introduces a separate state service, credentials, operations and data-retention obligations; no paid fallback is permitted.

**Disposition:** preferred target **only conditionally**, after card-free/free-tier eligibility, account ownership, least-privilege access and remote D1 behavior are independently verified. Current local proof is a design/implementation proof, not production approval.

## Decision and ordered next steps

1. Keep `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` fail-closed. Do not dispatch Worker, DSH or Resource Probe.
2. Obtain an independent security review of immutable PR #36/#39 heads and their stacked governance boundary. The implementation-side review and passing CI are not substitutes.
3. Verify Cloudflare Workers/D1 Free entitlement and card-free eligibility using non-secret account metadata only. If eligibility cannot be established, do not provision or incur cost.
4. If eligible, design a remote D1 qualification plan with authenticated issuer/owner binding, trusted time, migrations, concurrency, rollback, retry, backup/restore, audit, quota and recovery tests. No production integration until separately approved.
5. If D1 is not eligible, run a separate GitHub ref reservation proof in a dedicated state repository, including actual contention and immutability/deletion controls. Do not give Contents write to the existing Supervisor as a shortcut.
6. Until either B or C passes all tests, governance and independent review, retain A only as a documented non-dispatch interim pattern and keep the pool blocked.

## Current status

- PR #36/#39 local proof: **VERIFIED** for the recorded local Workers-runtime test scope.
- PR #36/#39 independent review: **NOT RUN**.
- Remote D1 and Free/card-free eligibility: **NOT VERIFIED / NOT RUN**.
- GitHub ref reservation backend: **PLANNED / NOT QUALIFIED**.
- Durable Supervisor claim protocol: **NOT QUALIFIED**.
- Cloud Development Pool: **BLOCKED**.
- Contour A: **NOT ACCEPTED**.
- Contour B: **DEFERRED**.

No secrets were read. No database was provisioned. No dispatch, Worker execution, DSH, Resource Probe, provider/model call, deployment, paid resource or external server was used.

## Next concrete action

Secure an independent reviewer for PR #36/#39 and verify the Cloudflare Free/card-free entitlement through non-secret account metadata. Only after those facts are established should the remote D1 qualification plan proceed.

Canonical references:
- [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- [PR #36](https://github.com/VlDMlNSh/developer-cloud-pool/pull/36)
- [PR #39](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39)
- [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
