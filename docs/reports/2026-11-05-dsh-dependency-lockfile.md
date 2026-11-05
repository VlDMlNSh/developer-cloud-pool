# DSH dependency lockfile generation — 2026-11-05 (recheck)

## Scope
Prepare one shared reproducible npm dependency tree for DSH workflows. No DSH runtime was launched.

## Verified state
- Canonical base `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16: [security: pin DSH runtime dependency tree](https://github.com/VlDMlNSh/developer-cloud-pool/pull/16), OPEN / DRAFT / NOT MERGED.
- PR branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Latest code commit: `f2836533e58954162924ff99e8e0a4a0e1e44c78`.
- Branch compare: 8 commits ahead, 0 behind the canonical base.
- Manifest: `dsh-runtime/package.json`, blob `54b3df47ce28f7c90c41266edc437f314271bea7`; direct dependency `@deepseek-ai/dsh@0.2.1-rc.5`.
- Temporary validation workflow blob: `f4e9656add68d72682fd90deeeff9b9b1a962fd0`.

## Lockfile generation evidence
- Run [42038801999](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038801999), run number 101, on exact code commit `f283653...`.
- Job `127283835661`: IN_PROGRESS at step "Generate temporary DSH lockfile without lifecycle scripts".
- Checkout and Node.js setup steps completed successfully.
- Artifact list is empty because upload step has not been reached.
- Job logs API returns NOT_FOUND while the job is active; no package-resolution output is available.
- Previous attempt [42038551072](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038551072) ended CANCELLED and produced no artifact.
- Earlier attempt [42038280749](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038280749) remains reported IN_PROGRESS at npm resolution; no lockfile was retrieved.
- Result: lockfile generation BLOCKED / NOT VERIFIED. No claim of generated lockfile.

## Security boundary
- npm lifecycle scripts disabled; retry count and fetch timeout bounded.
- One-day artifact retention configured.
- No DSH runtime, Worker, Resource Probe, model/provider call, repository secret or paid service used.
- `POOL_DISPATCH_ENABLED` was not changed.
- No independent review exists for PR #16.

## Why no lockfile was fabricated
npm resolution has not completed in repeated GitHub-hosted runs and the job log is unavailable while active. Manually inventing transitive package versions or integrity hashes would undermine reproducibility and provenance. Do not create a synthetic lockfile.

## Next decision
1. Let run 42038801999 reach a terminal state and inspect artifact/logs.
2. If it times out/fails, stop repeating the same npm-resolution mechanism.
3. Investigate the package's upstream published lockfile/provenance or use a verified npm registry mirror/cache mechanism already available in GitHub-hosted runners; document exact origin and integrity.
4. Only then commit a real lockfile, remove temporary generation, switch both DSH workflows to `npm ci --ignore-scripts`, and rerun zizmor.
5. Keep PR draft until exact-head CI and independent review pass.

## Related security PRs
- PR #14 zizmor audit: OPEN / DRAFT; latest recorded run failed due remaining dangerous-trigger and npm lockfile findings.
- PR #15 removes privileged `workflow_run`: OPEN / DRAFT; tested code-head CI succeeded, but independent review is absent.
