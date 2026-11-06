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

The profile converter intentionally returns qualificationStatus=not_qualified and capacityEvidence.status=observed. One probe run is not a repeated benchmark and is not accepted by the placement planner, which requires verified evidence. Manual review and repeated measurements on the same runner image are required before any candidate is promoted.

## Verification

This report is created before the new code's exact-head CI. Final run ID, SHA, check result, test totals and blob SHAs must be appended after verification.

## Owner action

The GitHub Actions connector available in this session can inspect runs but does not expose workflow_dispatch. The probe remains manual and was not triggered. Run it from Actions -> Runner Resource Probe, select this branch, and choose Run workflow. Expected result: a read-only run with a runner-capacity-probe artifact. Do not enable worker dispatch or provide credentials.
