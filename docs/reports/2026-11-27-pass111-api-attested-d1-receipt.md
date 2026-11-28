# Pass 111 — API-attested Envelope v1 to D1 durable receipt

Date: 2026-11-27

## Frozen target and scope
- Implementation branch: `feat/pass111-d1-attested-receipt-2026-11-27`.
- Parent PR #179 head / frozen base for this stacked pass: `80705bae2dca1f928368429c17922787b86be4bc`.
- Canonical default at validation: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Final code/test HEAD: `88911e5a127b9345270b15da8e7cd3f8aa54293a`.
- Scope: forward-only D1 migration 0018, Workers adapter entrypoint that verifies serialized API-attested Envelope v1 against trusted Actions context, uses the recomputed canonical digest as the existing approval envelope digest, and persists/read-backs the full provenance in the existing append-only source-comment receipt.

## Reuse First
- Reused the single canonical D1 ledger and receipt table from migrations 0001–0017; no second database, ledger, outbox, controller or service.
- Reused Pass 110 Workers WebCrypto envelope verifier and strict duplicate-key JSON parser.
- Reused existing `admitQualifiedTask`, full admission-chain readback, first-primary receipt lookup, trusted clock injection and receipt replay/reconciliation behavior.
- Reused existing Workers/Vitest/Miniflare harness and pinned lockfile; no dependency changes.
- Kept `workflow_sha` mapped to GitHub Actions workflow commit SHA. Added a distinct workflow-file blob SHA and ref SHA; never conflate Git commit and Git blob identifiers.

## Implementation
- Added `proofs/d1-ledger/migrations/0018_api_attested_source_comment_receipts.sql`.
- Added immutable receipt fields: attestation schema/version, Issue/Comment node IDs, observed default HEAD, run HEAD, workflow ID/state, workflow commit SHA, workflow-file blob SHA and workflow-file ref SHA.
- New SQL insert guard accepts either historical empty-sentinel rows or a complete v1 attestation row. For v1, it binds observed default HEAD and run HEAD to the receipt target SHA, workflow-file ref SHA to run HEAD, and workflow commit SHA to the existing `workflow_sha`. Existing no-update/no-delete and admission full-binding guards remain active.
- Added `admitGitHubNextAttestedEvent`: parse strict serialized envelope, validate schema/provenance, recompute digest, cross-check event/run/workflow fields against trusted Actions context, then use that digest for existing atomic admission and durable receipt.
- Receipt readback/replay now compares every added attestation field. Exact replay returns the existing durable admission; conflicting/tampered inputs fail closed.
- Added local D1 integration tests for v1 receipt persistence + exact replay, comment-node substitution/digest mismatch, and workflow-file ref mismatch.
- Existing synthetic legacy binder path remains for the pre-existing proof tests only; no production workflow/controller callsite is connected in this pass. It remains a hardening item before controller activation.

## CI evidence
- An initial run exposed a source-formatting parse error (literal newline escapes). Corrected before final validation.
- A subsequent run exposed a duplicate fixture approval ID. Test fixture ID was made unique; no runtime/schema behavior changed in that correction.
- Final validation-only PR #182 on canonical base:
  - D1 run [45897059595](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45897059595), job `140173459403`: SUCCESS. Log confirms merge-result checkout `ac30d05` (merge of final head with canonical default), 9/9 test files and 137/137 tests passed.
  - Pool Contract run [45897059549](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45897059549), job `140173459315`: SUCCESS. Dispatch-disabled assertion, workflow YAML parsing and pool security contract validation completed.
- Exact implementation code/test SHA validated: `88911e5a127b9345270b15da8e7cd3f8aa54293a`; merge-result validation SHA prefix `ac30d05`.
- No code/test changes after validated SHA at report creation.

## PR and review state
- PR #181: OPEN / DRAFT / UNMERGED; base PR #179 branch at `80705bae2dca1f928368429c17922787b86be4bc`; mergeable=true; formal reviews 0; inline threads 0.
- PR #182: OPEN / DRAFT / UNMERGED; validation-only PR targeting canonical default; do not merge.
- Parent PR #179 and foundation PR #178 remain OPEN / DRAFT / UNMERGED. No branch protection or governance changes.

## Boundaries and residual risks
- Pass 111 local D1 adapter + migration + tests: VERIFIED by merge-result CI.
- Controller/API verifier same-run wiring, workflow creation, trusted API read-back execution, workflow-byte provenance authenticity and default-ref race policy: NOT IMPLEMENTED / NOT VERIFIED.
- Legacy synthetic non-attested adapter remains available for compatibility tests; production callsites must use only the attested entrypoint before controller activation.
- Hosted D1 behavior, production locking, live GitHub event authenticity, executor identity, free provider quotas, remote UI, state recovery and full Contour A acceptance remain NOT VERIFIED.
- No secrets read, hosted D1 provision/write, provider call, dispatch, executor, deployment, merge or production mutation. Dispatch and execution authorization remain false.
- Independent security review NOT RUN. Gemini/Claude/ECC/FCC NOT RUN. Active engineering time NOT MEASURED.

## Decision and next
- Pass 111 D1 attestation persistence/integration proof: VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next bounded pass: wire the API verifier and attested D1 adapter in one non-dispatching controller workflow on a clean current-base branch; remove/disable the legacy non-attested admission entrypoint from any production import surface; add same-run API-to-D1 E2E tests and verify exact-head/merge-result CI. Do not enable dispatch.

PR #181: https://github.com/VlDMlNSh/developer-cloud-pool/pull/181
Validation-only PR #182: https://github.com/VlDMlNSh/developer-cloud-pool/pull/182
Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Governance read-back — 2026-11-27

- Canonical default ref re-read via Git refs API: `refs/heads/Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Repository ruleset [26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182), `Основной — verified`: ACTIVE; applies to default branch; blocks deletion and non-fast-forward; requires pull requests; requires review-thread resolution; configured required approving review count is 0; code-owner review is not required; bypass actors empty and current integration cannot bypass.
- Branch-protection endpoint returned 403 (integration lacks permission): traditional branch protection NOT VERIFIED. Root and `.github/CODEOWNERS` paths returned NOT_FOUND; no CODEOWNERS file verified at those paths.
- PR #181 formal reviews 0 and inline threads 0. The ruleset does not require approvals, but project policy still requires an independent review before qualification/merge. No merge performed.
