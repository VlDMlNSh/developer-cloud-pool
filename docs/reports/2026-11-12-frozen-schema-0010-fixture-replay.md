# Frozen schema-0010 v1 fixture — deterministic local replay — 2026-11-12

## Status

FROZEN SCHEMA-0010 FIXTURE REPRODUCIBILITY VERIFIED IN TWO ISOLATED LOCAL D1 DATABASES / EXACT-HEAD CI VERIFIED / HISTORICAL UPGRADE PRESERVATION NOT YET TESTED / MIGRATION 0011 NOT CREATED.

This pass adds only test harness/config/workflow code on PR #67. It does not change SQL migrations, production runtime, dependencies, lockfile, secrets, permissions, hosted resources, dispatch, external GitHub state, deployment or merge. No real GitHub POST is made; marker bodies are synthetic fixture strings only.

## Immutable target and repository state

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67: `impl/receipt-bound-projection-2026-11-11@320e3c60c74fcec7cb0fb567cba8a48fdd45b616`, base current default; OPEN / DRAFT / UNMERGED; mergeable true.
- PR #66 documentation branch remains OPEN / DRAFT / UNMERGED; its exact-head CI is not part of this implementation pass.
- PR #67 formal reviews: 0; inline review threads: 0; combined status contexts empty.
- Open issue search still includes #1 governance gate, #22 secure web console, #38 durable single-use Supervisor claims, #26 provider routing/quota ledger, #5 ephemeral agent-browser and #21 native mobile scope. These remain separate tracks; no scope was switched to Contour B.

## Implementation

1. `proofs/d1-ledger/vitest.upgrade-smoke.config.ts`
   - Adds third synthetic Miniflare D1 namespace `REPLAY_DB` alongside `POOL_DB` and `UPGRADE_DB`.
   - All IDs are synthetic local UUIDs. No remote proxy, Cloudflare account resource or production binding is configured.
   - Includes only the binding smoke and frozen-fixture smoke files; normal Workers tests retain their separate config/setup.

2. `proofs/d1-ledger/test/d1-upgrade-fixture.smoke.ts`
   - Applies exactly the first ten pinned migration files (0001–0010) to each isolated DB; asserts exact ordered migration names before applying.
   - Seeds three terminal attempts via supported adapters/triggers: succeeded, failed and abandoned. Result and provenance digests are distinct; historical v1 event digest remains result-only by the existing trigger.
   - Drives the failed attempt's projection outbox through five fenced delivery generations, retryable states and terminal dead-letter.
   - Drives comment states across all three supported values: `not_attempted`, `indeterminate`, `verified`; comment-event evidence is included in the snapshot.
   - Seeds one separate nonterminal indeterminate attempt and its reconciliation queue row.
   - Captures explicit ordered column lists for task, attempt, attempt event, projection outbox, projection delivery event, comment event and reconciliation tables.
   - Constructs exact fake marker comment body strings from the persisted v1 event IDs/digests; no API call is made.
   - Builds the same fixture independently in `UPGRADE_DB` and `REPLAY_DB`, then deep-compares the complete snapshots and marker byte strings.

3. `proofs/d1-ledger/package.json`
   - Adds `test:upgrade-fixture` and scopes `test:upgrade-binding` to the separate namespace smoke test.
   - No dependency or lockfile change.

4. `.github/workflows/d1-ledger-proof-validation.yml`
   - Adds a dedicated frozen-fixture replay step after the binding smoke.

Blob SHAs:
- upgrade config: `6d16df978384d612d7c8a7139c0b965a57f45504`
- fixture test: `09e64e1752972c53c6db635251d63ad245c88beb`
- package manifest: `42602c2897e6cb47f7396b984068e94a302bef85`
- workflow: `5679a1a2702cade6f7265d7f6ea5d66235839e09`

## Exact-head CI evidence

For PR #67 head `320e3c60c74fcec7cb0fb567cba8a48fdd45b616`:

- [Isolated D1 Ledger Proof run 43180300405](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43180300405): COMPLETED / SUCCESS; job `131054355950`.
  - Syntax check: SUCCESS.
  - Standard Workers-runtime suite: 5 files / 69 tests passed.
  - Separate second-binding smoke: 1 test passed.
  - Frozen schema-0010 fixture replay: 1 test passed; 1 unrelated test skipped by name filter.
  - Fixture replay completed in 232 ms; the dedicated command completed in 909 ms.
  - Lockfile artifact ID `13925458432`, size 18,253 bytes, SHA-256 `5781f5e6874ec9dc21d8d795c6369c87cd37eb9ac4eaa83a8f2adc7b502c4cea`.
- [Pool Contract Validation run 43180300406](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43180300406): COMPLETED / SUCCESS; job `131054356221`.
- Combined commit status contexts: empty. Successful workflow runs are the available exact-head evidence; no separate status-context pass is inferred.
- No formal PR review or inline review thread was recorded.

## What is now proved — and what is not

VERIFIED:
- The pinned local Workers/Miniflare test runtime can instantiate three independent synthetic D1 namespaces.
- Migrations 0001–0010 can be applied to two separate disposable local D1 DBs.
- The deterministic seed sequence produces identical ordered table snapshots and identical fake marker body strings in both DBs.
- The fixture covers succeeded/failed/abandoned terminal outcomes, distinct result/provenance digests, delivery retry/dead-letter evidence, all three comment states, comment event evidence, a nonterminal indeterminate attempt and its reconciliation row.
- Existing v1 terminal event digest behavior is represented without rewriting it.

NOT PROVED:
- A migration 0011 exists or has been applied.
- Before/after preservation across an actual 0010→0011 upgrade.
- Static expected snapshot digests checked into source; this pass verifies independent replay equality, not a previously approved immutable golden digest.
- Failure atomicity for a deliberately invalid migration.
- Hosted/remote D1 semantics, production deployment, live GitHub consistency, executor routing or Contour A acceptance.

## Next bounded step

Freeze the replay baseline as a reviewable immutable artifact/digest (or checked-in expected canonical snapshot) and add a separate failure-atomicity proof on a fresh synthetic local D1 namespace. Then draft a candidate migration 0011 only in the isolated PR branch and verify populated schema-0010 before/after preservation against the frozen baseline. Do not enable a v2 writer or use hosted D1.

Independent technical/security/governance review remains deferred until actual pool launch per owner instruction. No Gemini dispatch or other independent audit was initiated.

## Disposition

- Frozen schema-0010 fixture replay: VERIFIED.
- Populated migration 0011 preservation: NOT RUN.
- Migration 0011: NOT CREATED / NOT APPLIED.
- Failure atomicity: NOT RUN.
- Hosted D1: NOT AUTHORIZED / NOT RUN.
- PR #67: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
