# Checkpoint — DSH dependency lockfile — 2026-11-05

## Current state
- Active work: PR #16 — [security: pin DSH runtime dependency tree](https://github.com/VlDMlNSh/developer-cloud-pool/pull/16).
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch latest commit: `d1e0bc1f4a5b5b4abb0334b5419d7a62451d06e9`.
- Manifest blob: `54b3df47ce28f7c90c41266edc437f314271bea7`.
- Validation workflow blob: `143704d186e3b39a5300a603699e5de6ad3186a5`.

## Exact next action
Inspect GitHub Actions run [42038551072](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038551072). It was PENDING at checkpoint creation. If it succeeds, retrieve artifact `dsh-runtime-lockfile`, inspect all package resolutions and integrity values, and commit it. If it fails, inspect logs and correct only the demonstrated cause.

## Do not
- Do not merge PR #16 while the lockfile is absent or unverified.
- Do not leave the temporary npm lock-generation step in the final workflow.
- Do not suppress zizmor findings.
- Do not run Worker, DSH, Resource Probe, provider/model calls or paid fallback.
- Do not enable `POOL_DISPATCH_ENABLED`.

## Remaining acceptance
1. Reviewed shared `dsh-runtime/package-lock.json`.
2. Both DSH workflows use `npm ci --ignore-scripts`.
3. Temporary lock generation removed.
4. Exact-head contract CI and zizmor pass.
5. Independent review completed.
6. PR #16 accepted through normal governance.
