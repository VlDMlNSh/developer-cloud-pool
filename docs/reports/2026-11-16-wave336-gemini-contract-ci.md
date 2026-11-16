# Wave 336 — exact-head Gemini contract suite on default-targeted PR

Date: 2026-11-16  
Contour: A — Cloud Development Pool  
Status: EXACT-HEAD CI VERIFIED FOR FAKE-CLIENT CONTRACTS / LIVE PROVIDER QUALIFICATION NOT RUN

## Candidate and provenance

- PR #107 (four-account controller candidate): OPEN / DRAFT / UNMERGED; head `027492668e7721a5371b38997bc76a6cd6a50cd4`.
- PR #108 (stacked execution bounds): OPEN / DRAFT / UNMERGED; head `e0717d9d3daf1ef76db81f5e076728c5784b0896`, base PR #107 head.
- PR #109 (default-targeted validation candidate): https://github.com/VlDMlNSh/developer-cloud-pool/pull/109; OPEN / DRAFT / UNMERGED; head `371093fc646a22cf49e3baaa8984bc2e5d3622b7`; base branch `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; GitHub reports mergeable=true at final read.
- PR #109 contains three files; controller and test blobs match PR #108 exactly:
  - Controller blob `9c5377f58de9dd8dabb4f05c72479fad1f10e033`
  - Test blob `80f358197c2006105c902fd2d54c84f33e055d97`
  - Validator blob `3759d310dfb6af21edc43f89a138232cd0e3d182`
- The branch was based on default HEAD `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`; the PR base advanced to `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` while the PR was open. GitHub reports mergeable=true; recheck base and diff immediately before any merge.

## Work completed

1. Diagnosed why stacked PR #108 did not trigger exact-head CI: existing Pool Contract Validation pull_request filter targets only `Основной`.
2. Created PR #109 against the default branch so existing governance/workflow can validate the candidate without changing branch filters or workflow permissions.
3. Initial run #43871896948 passed only the pre-existing validator; log inspection showed the Gemini test suite was not invoked. This run is NOT evidence for the 11 tests.
4. Added a fixed `node --test` invocation to `scripts/validate-pool-contract.mjs`.
5. Corrected the validator ordering so test failures are added to the failure list before the final process exit decision. This ensures failed tests fail the workflow rather than being reported after an already-emitted PASS.
6. Re-ran exact-head CI after that correction.

## Final exact-head CI evidence

- Workflow: Pool Contract Validation
- Run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43872185972
- Run ID: `43872185972`
- Job ID: `133315933882`
- Head SHA: `371093fc646a22cf49e3baaa8984bc2e5d3622b7`
- Run/job: COMPLETED / SUCCESS
- Decoded job log confirms:
  - `# tests 11`
  - `# pass 11`
  - `# fail 0`
  - `PASS Gemini four-agent fake-client tests executed by Pool Contract Validation`
  - `POOL_CONTRACT_VALIDATION=PASS`
- The final validator source was read back and verified to run the test suite before the final failures/exit gate.
- PR #109 has zero formal reviews at final review-list read.

## Scope of this verification

The tests use injected fake clients and synthetic test credentials. They verify four distinct task envelopes, client-slot separation, missing/duplicate credential fail-closed behavior, quota failure isolation, API-key-shaped task rejection, no credential values in returned reports, model allowlist rejection, abort-signal propagation/timeout classification and output truncation.

This is **not** live Gemini execution, not proof of Google account identity, not proof of independent quota domains, and not proof that `gemini-2.5-flash` is free-tier eligible. No provider requests, secret reads, dispatch, merge or deployment occurred.

## Remaining blockers

- Official `@google/genai` package manifest and reproducible lockfile remain absent; SDK installation/runtime NOT VERIFIED.
- The current model allowlist is a route restriction, not proof of free quota eligibility or price.
- Four different credential strings do not prove four distinct Google account identities or independent quota ownership.
- Issue #96 exact owner-only /next admission, immutable target SHA binding, durable single-use lease/fencing, idempotency, crash recovery and child-run reconciliation remain NOT VERIFIED.
- Independent security review and formal PR review remain pending.
- No trusted-main no-secret controller admission/reconciliation probe.
- Live Gemini qualification remains NOT RUN.
- Contour A remains NOT ACCEPTED; Contour B remains deferred.

## Next bounded step

Pin and install the official Google Gen AI SDK reproducibly (manifest + lockfile) and add a no-secret CI install/import smoke test. Then implement Issue #96 admission and durable lease/reconciliation integration on trusted default-branch code. Keep dispatch disabled until every qualification gate in Issue #94 is independently evidenced.

Canonical MediaHub map (separate project/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
