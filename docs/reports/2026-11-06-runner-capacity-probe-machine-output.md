# 2026-11-06 — Machine-readable runner capacity probe

## Objective

Make the existing read-only GitHub-hosted runner inventory consumable by the placement workflow without promoting a single observation into a qualified capacity profile.

## Changes

- Updated .github/workflows/runner-resource-probe.yml to emit runner-capacity.json with repository/ref/commit/run provenance, image identity, CPU, available/total memory, workspace filesystem capacity, observedAt and validUntil.
- Added a short-lived 3-day artifact named runner-capacity-probe. No secrets, agents, provider credentials, or installation steps are accessed.
- Added scripts/runner-capacity-profile.mjs to compute conservative candidate capacity after explicit CPU/RAM/disk reserves.
- Added tests for expiry, immutable commit provenance, insufficient capacity and secret-bearing properties.
- Wired the new tests into Pool Contract Validation.

## Critical qualification boundary

The profile converter intentionally returns qualificationStatus=not_qualified and capacityEvidence.status=observed. One probe run is not a repeated benchmark and is not accepted by the placement planner, which requires verified evidence. Manual review and repeated measurements on the same runner image are required before any candidate is promoted. No real runner capacity has yet been measured in this pass.

## Verification

- Corrected a test-fixture validation regex after the first run exposed 2 failing tests; the correction requires numeric-only GitHub run IDs and attempt IDs.
- Exact code/test target SHA: 10b74421aa5ab4d94fed1664ebf0a87109e9d4d5.
- GitHub Actions run #218: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42211249689 — SUCCEEDED on the exact target SHA.
- Job: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42211249689/job/127870137847.
- Validation: POOL_CONTRACT_VALIDATION=PASS; all 39 tests passed, 0 failed. Workflow YAML parsing and existing security invariants passed.
- The earlier run #217 on 3ef1abcb90d4f23bccff271cb6ecfe79a565b209 failed 2 tests because the numeric run-ID regex was over-escaped; this was corrected and the final exact-head run passed.
- Local isolated Node test execution of the candidate converter: 4/4 passed. A local repository clone was unavailable because github.com DNS resolution failed; the authoritative result is the GitHub Actions exact-head run above.
- Current PR #29 remains OPEN / DRAFT / UNMERGED. Canonical Основной remains 64d2636d4500127e635c214ccfb722c6b3fcda80.
- Manual Runner Resource Probe execution: NOT RUN. The workflow has workflow_dispatch only; this session's GitHub connector does not expose workflow dispatch.
- The code emits an observation-only candidate; no single run is promoted to verified or qualified capacity.

## Owner action

The GitHub Actions connector available in this session can inspect runs but does not expose workflow_dispatch. The probe remains manual and was not triggered. Run it from Actions -> Runner Resource Probe, select this branch, and choose Run workflow. Expected result: a read-only run with a runner-capacity-probe artifact. Do not enable worker dispatch or provide credentials.
