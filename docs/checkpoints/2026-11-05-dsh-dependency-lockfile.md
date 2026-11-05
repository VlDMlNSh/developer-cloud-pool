# Checkpoint — DSH dependency lockfile — 2026-11-05 recheck

## Immutable target
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16 branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Latest code commit: `f2836533e58954162924ff99e8e0a4a0e1e44c78`.
- Compare: 8 ahead / 0 behind.
- Manifest blob: `54b3df47ce28f7c90c41266edc437f314271bea7`.
- Validation workflow blob: `f4e9656add68d72682fd90deeeff9b9b1a962fd0`.

## Current run
- [Run 42038801999](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038801999), job `127283835661`.
- IN_PROGRESS at npm lockfile resolution; checkout and Node setup passed.
- No artifact exists yet. Active job logs unavailable through API.
- Previous run 42038551072 CANCELLED; no artifact.
- Lockfile: NOT GENERATED / NOT VERIFIED.

## Next action
Wait for run 42038801999 to finish. If it fails or times out, do not repeat the same generator unchanged. Research the package's upstream published lockfile/provenance or a verified npm registry/cache route, and capture integrity hashes from authoritative package metadata.

## Hard prohibitions
- Do not fabricate lockfiles or integrity hashes.
- Do not merge PR #16 without a real inspected lockfile and exact-head CI.
- Do not suppress zizmor findings.
- Do not run Worker, DSH, Resource Probe, browser, model calls or paid fallback.
- Do not enable `POOL_DISPATCH_ENABLED`.

## Acceptance
1. Real lockfile with complete versions and integrity fields.
2. Both DSH workflows use shared `npm ci --ignore-scripts`.
3. Temporary lockfile-generation code removed.
4. Exact-head CI and zizmor pass.
5. Independent security review.


## Upstream dependency-source research
- Official npm package: `@deepseek-ai/dsh@0.2.1-rc.5`, 86 declared dependencies, linked upstream repository: https://www.npmjs.com/package/%40deepseek-ai/dsh?activeTab=dependencies
- Upstream repository root manifest blob: `c4f130943ddfee2d8d8040c6dd679f5b0e12312a`; declares `pnpm@11.28.5`, Node >=24.9.0, and workspaces.
- Upstream pnpm workspace blob: `59b31eb46b90e35251cbf3c26b20556892c4aa52`.
- Upstream pnpm lockfile retrieval returned empty content through connector; content not verified.
- No authoritative npm lockfile/transitive dependency graph recovered. Upstream pnpm lockfile is not interchangeable with npm lockfile.
- Exact npm version tag lookup in upstream GitHub failed; no source-tag provenance inferred.
- Decision: npm lock generation remains BLOCKED / NOT VERIFIED. Do not fabricate or convert an incomplete lockfile. Research registry/cache/network path next.
