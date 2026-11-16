# 2026-11-16 — Clean D1 source transplant manifest

## Scope and immutable target
Bounded source-selection and provenance pass. Repository `VlDMlNSh/developer-cloud-pool`; default branch `Основной` exact HEAD `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`. No source-code changes, workflow changes, merge, dispatch, secret/variable reads, hosted provisioning or deployment.

## Refreshed repository and governance
- Repository metadata: public, default branch `Основной`; exact HEAD re-read from paginated Branch API page 2: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Active ruleset ID `26550182`, name `Основной — verified`, enforcement active, applies to `refs/heads/Основной`; no bypass actors; current user cannot bypass. Rules: prevent deletion and non-fast-forward; PR required; 0 required approvals; review-thread resolution required. Thus PR-only is enforced, but independent human approval is not required by this ruleset.
- Branch API reports `protected=false`; this does not negate the active ruleset.
- Open PRs #27, #37, #39, #54, #60, #63–#68, #87, #92, #93, #95, #97–#106 etc. remain open and unmerged. Most D1 stack PRs are Draft.
- Current default workflow directory contains `dsh-runtime-evaluation.yml`, `pool-contract-validation.yml`, `pool-supervisor.yml`, `pool-worker.yml`, `runner-resource-probe.yml`. The approved `.github/workflows/gemini-batch-dispatch-controller.yml` is NOT PRESENT on current default (404); therefore Gemini Agent 1/2/3 dispatch is NOT RUN. No alternate controller is substituted.
- Current default Supervisor workflow/script remain as reported in the prior crosswalk. Actual repository variable values and secrets were not read.

## Selected D1 source lineage — selective transplant only
The best existing local proof source is the clean D1 chain, not a new implementation:
1. PR #87 head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, base `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (older than current default). It introduces the isolated package and migrations 0001–0014 plus local Workers-runtime tests. PR #87 is OPEN/DRAFT/UNMERGED.
2. PR #92 head `7014961587759b27d2ef6e91c60ce098d077ae83`, based on #87. It changes `proofs/d1-ledger/src/admit-qualified-task.mjs` and `proofs/d1-ledger/test/atomic-admission.test.ts` to verify the exact admission receipt on replay. OPEN/DRAFT/UNMERGED.
3. PR #93 head `e200838d038b9cd48635233187819302bba6a33e`, based on #92. It changes `.github/workflows/d1-ledger-proof-validation.yml`, `proofs/d1-ledger/src/trusted-route-registry.mjs`, and `proofs/d1-ledger/test/trusted-route-registry-persistence.test.ts` to require verifier-issued persistence capability. OPEN/DRAFT/UNMERGED.
4. PR #101 head `ae9cf5d4fd76134136b9af8b5498e90a65509722`, based on #93. It changes only `proofs/d1-ledger/test/atomic-admission.test.ts` to fence exact replay against active registry advancement. OPEN/DRAFT/UNMERGED.

**Transplant order:** start from current default HEAD above, selectively copy PR #87's `proofs/d1-ledger/**` and `.github/workflows/d1-ledger-proof-validation.yml`; then apply #92 patch; then #93 patch; then #101 test patch. Do not merge old branch ancestry or use the PR merge commits as target. Rebase/review each patch against the current target and resolve conflicts explicitly. Preserve package lockfile and all source/migration checksums.

### Package manifest and test contract
- Package `proofs/d1-ledger/package.json` blob `334011c6b7db5c92cc4c43256d3b43115833b5a9` on #87 source branch. Exact dev dependencies: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`; committed package-lock must be retained.
- Scripts: `npm run check`, `npm test`, `npm run test:upgrade-binding`, `npm run test:upgrade-fixture`.
- Workflow blob `ab2613a776f1b17daf8d2934528e62bb95fbe9bc`: Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, syntax check, local Workers-runtime D1 tests, isolated upgrade binding, frozen schema-0010 fixture, lockfile artifact. Permissions contents:read; no account credentials or deployment.
- Migration order in the source chain: 0001 approval ledger; 0002 claim/outbox; 0003 logical task identity; 0004 immutable attempts; 0005 attempt reconciliation queue; 0006 projection outbox; 0007 bounded projection retries; 0008 projection attempt monotonicity; 0009 immutable projection identity; 0010 at-most-once projection comment; 0011 atomic qualified admission; 0012 durable route registry snapshots; 0013 verified route registry persistence; 0014 atomic admission registry assertion.
- Golden frozen fixture: `proofs/d1-ledger/fixtures/schema-0010-v1-golden.json`. Migration 0014 blob `cb8a47d83faba62981daa8f7320da87baa2c55e2` was inspected and binds qualification, issuer/key, current registry epoch/digest/version, freshness and active key status inside an admission trigger.
- README blob `c7d78c857c15cdf67009af51cdb9beff8d87d430` explicitly says local-only, no Hono/production Supervisor/Worker/deployed Worker wiring; `dispatch:false`; no GitHub, provider, secret, OAuth, remote D1 or production integration.

## Exact-head CI evidence (local-only)
- #87 exact head: runs `43712647615` Pool Contract Validation SUCCESS; `43712647597` Isolated D1 Ledger Proof SUCCESS.
- #92 exact head: runs `43718679251` Pool Contract Validation SUCCESS; `43718679258` Isolated D1 Ledger Proof SUCCESS.
- #93 exact head: run `43736264768` Isolated D1 Ledger Proof SUCCESS.
- #101 exact head: run `43764995448` Isolated D1 Ledger Proof SUCCESS.
- #67 earlier D1 core head `a53f6232bd5b50d3e150addf528b8e722002f9dd`: runs `43600901063` and `43600901068` SUCCESS; superseded by the clean #87+ stack for this manifest.
- Combined commit status API returned empty status contexts for these commits; the above are GitHub Actions run evidence, not a claim that all required checks/rules are satisfied.
- No current-head CI was triggered by this documentation-only pass.

## Explicit exclusions / not selected
- PR #37 authorization boundary is useful for least-privilege comparison but is based on old default SHA `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; it still uses label claim/read-back and is not a durable D1 claim implementation. Do not transplant blindly.
- PR #65 hosted D1 plan remains PLANNED / NOT AUTHORIZED / NOT RUN; it is design-only and based on old base `c3add54d3409122eedaa697f0af5e7ec43753426`.
- PR #98 / #97 / #102 / #95 are separate Cloud Pool `/next` controller/admission/documentation work, not D1 claim service integration; their bases are stale relative to current HEAD. Do not combine these tracks in this transplant.
- PRs #104–#106 agent-browser integration are a separate browser-worker track and are not part of D1 ledger transplant.
- Durable Supervisor claim protocol remains TARGET DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED. Hosted claim API, production issuer/trusted time/revocation, hosted D1 and Supervisor wiring are absent.
- Existing Gemini controller file absent from current default. Three agents NOT RUN. No secret values or repository variable values read.
- Hosted D1/account Free entitlement/quota NOT VERIFIED; no explicit authorization for named test resources in this pass.

## Next exact bounded step
Create a new integration branch from exact current default HEAD `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b` and selectively transplant the #87 → #92 → #93 → #101 file patches only, retaining the proof's inert/local-only behavior. Before creating that implementation branch, obtain a full diff-level review of each patch and compare migration checksums; after assembly, run the four package scripts and exact-head CI. Do not mount it in Supervisor or provision hosted D1. Hosted qualification remains separately gated by verified free entitlement/quota and explicit owner authorization.

## Status
- Source lineage and manifest: VERIFIED (documentation/source readback).
- Local D1 tests: previously VERIFIED on exact PR heads, not rerun in this pass.
- Current-default integrated D1 proof: NOT IMPLEMENTED.
- Hosted D1/claim API: NOT RUN / NOT QUALIFIED.
- Gemini agents: NOT RUN (approved controller file absent from default).
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Links
- PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87
- PR #92: https://github.com/VlDMlNSh/developer-cloud-pool/pull/92
- PR #93: https://github.com/VlDMlNSh/developer-cloud-pool/pull/93
- PR #101: https://github.com/VlDMlNSh/developer-cloud-pool/pull/101
- Durable Supervisor claim decision: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md
- Hosted D1 plan (Draft): https://github.com/VlDMlNSh/developer-cloud-pool/pull/65
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
