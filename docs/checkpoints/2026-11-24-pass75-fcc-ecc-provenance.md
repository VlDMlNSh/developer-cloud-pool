# Pass 75 Checkpoint — FCC/ECC provenance and runner proof

- Date: 2026-11-24
- Priority: Contour A only; Contour B DEFERRED.
- Current default base observed from open PRs: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Working branch: `docs/engineering-excellence-2026-11-23`.

## Canonical identities resolved
- FCC = Free Claude Code, `Alishahryar1/free-claude-code`.
- ECC = Everything Claude Code, canonical repo `affaan-m/ECC` (old URL redirects).
- Owner-approved source: Issue #115.
- FCC pin `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`, AGPL-3.0-only, Python exactly 3.14.10.
- ECC pin `e413166c50e85fb205b988b5e78874b5a88ea4d2`, MIT. Current `ecc-universal` package version 2.2.3, MIT; SECURITY.md supports 2.x / RC.

## Security / quota findings
- FCC supports ordered multi-key and numbered selection; tests cover fallback across 403/429. One credential/account per FCC profile, one model, no MODEL_FALLBACKS/key cycling/cross-account mixing/provider or paid fallback.
- FCC remains loopback-only until AGPL network-use/legal review.
- ECC security policy exists but is not an independent audit.
- Claude Code hosted-use entitlement remains NOT VERIFIED.

## Existing PR #116 evidence
- OPEN/DRAFT/UNMERGED; head `2e944f13818f434cf135602c1c0e82051f1d3fa8`.
- Exact-head Runner run `44286955337` SUCCESS (18 steps); Pool Contract run `44286955360` SUCCESS (7 steps).
- Artifact `14420066410`, 34,605 bytes, digest `sha256:17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a`, expiry 2026-11-25.
- PR #116 diverged from current base: 74 ahead / 12 behind. Historical install proof only; no actual worker-in-sandbox, provider egress allowlist, real Claude session or provider route/quota proof.

## Pass75 work
- Verified upstream source/license/package/security metadata and historical CI/jobs/artifact metadata.
- Updated runner lifecycle, Jarvis roadmap and hybrid architecture docs with canonical identity/provenance addendum.
- Added report and checkpoint; Context Window update pending final PR head refresh.
- No install/runtime/provider call/secrets/dispatch/deployment/merge.
- Local validators NOT RUN; actual time NOT MEASURED.

## Status
FCC/ECC identity and pinned license evidence VERIFIED; historical installation feasibility VERIFIED; current-base runtime integration NOT QUALIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next
Port the minimal no-secret proof from PR #116 to a clean branch from current default; re-pin all dependencies and prove actual CODE worker executes inside no-egress sandbox, with one-account FCC profile guard. Keep FCC loopback-only pending legal review. No provider calls or dispatch.
