# Cloud Pool acceleration audit — checkpoint

Date: 2026-11-23  
Status: **AUDIT COMPLETE / RECOMMENDATIONS PROPOSED / CONTOUR A BLOCKED**

## Main finding

The project has a substantial D1 security/proof foundation, but too many parallel stacked PRs and a large historical Context Window are increasing integration and review cost. The decisive gap is from isolated local proofs to one authenticated, deployed and independently reviewed vertical slice.

## Evidence snapshot

- Default branch `Основной` HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #168: OPEN/DRAFT/UNMERGED; head `ec1caca61caa453d4e0ce5405890e8791f6bfd29`; base `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`; 33 files; +6,877. Exact-head D1 CI 68/68 and Pool Contract Validation SUCCESS; merge-result CI NOT VERIFIED; reviews 0.
- PR #169: OPEN/DRAFT/UNMERGED; head `d7cdee8bdff5dd1d11fc0b042a1d544c433d15c7`; base current default; 16 files; +1,019. Exact-head CI NOT VERIFIED; reviews 0.
- 175 branches returned over two pages; 100 open PR records returned by the requested search page size. Treat the PR list as a capped sample.
- Context Window: approximately 332k characters on default and 352k on the documentation branch. The default copy's refresh marker is stale; the documentation copy includes Pass 51.
- Earliest inspected UI PR #6 created 2026-11-04; this snapshot 2026-11-23 gives an observed calendar span of at least 19 days, not active labor time.
- Verified engineering hours and remaining hours are NOT AVAILABLE from the available telemetry.
- Runtime Worker remains intentionally inert; actual controller clock, deployed UI, qualified executor and end-to-end runtime remain NOT VERIFIED.

## Adoptable recommendations

1. One vertical-slice MVP; no feature expansion before Contour A acceptance.
2. Issue #140 is the sole D1 integration objective; pause competing D1 PRs pending overlap/migration map.
3. Synchronize PR #168 to current default, verify exact merge-result CI and obtain independent review; qualify actual runtime clock before any execution.
4. Keep PR #169 documentation-only and review separately.
5. Reuse Hono + Workers Static Assets + D1; verify current free entitlement before deployment.
6. Use GitHub-hosted public runners for bounded ephemeral work; do not treat them as persistent web hosting.
7. Do not add Temporal, Coder, OpenHands Agent Server or LiteLLM as MVP runtime dependencies; selectively reuse patterns.
8. Apply Issue #96 owner correction: qualify Claude Code + ECC + FCC as first CODE executor via verified free route; Gemini is optional, not a launch dependency.
9. Defer multi-account/GPU (Issue #151), broad model routing (Issue #26), browser automation and all Contour B work.
10. Compact Context Window into active summary plus linked historical archive; preserve all history.
11. Start pass-level time accounting; no retrospective hours invented.

Detailed audit and citations: [Cloud Pool acceleration and architecture audit](../reports/2026-11-23-cloud-pool-acceleration-audit.md).

No provider calls, dispatch, secret reads, Cloudflare mutation, deployment, merge or production action occurred in this audit.

Next: use the audit's dependency order to plan one bounded Pass 52: current-base D1 PR consolidation and trusted-clock runtime qualification. Keep Contour B deferred.


## Pass 52 correction

The earlier three-vs-four Gemini conflict claim was incorrect. Issue #96's 2026-11-17 owner correction explicitly makes Gemini optional and identifies Claude Code + ECC + FCC as the first CODE executor via a separately verified free route. See [Pass 52 consolidation report](../reports/2026-11-23-pass52-canonical-d1-consolidation.md).