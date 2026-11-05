# DSH dependency lockfile generation — 2026-11-05

## Scope
Prepare one shared, reproducible npm dependency tree for the DSH headless probe and runtime evaluation workflows. No DSH runtime was launched.

## Findings
- Canonical base used by PR #16: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- DSH package is pinned directly to `@deepseek-ai/dsh@0.2.1-rc.5`.
- Both production workflows still install DSH ad hoc with `npm install --prefix`, so their transitive dependency trees are not reproducible.
- A shared manifest was added at `dsh-runtime/package.json`.
- First lockfile-generation attempt, run [42038280749](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038280749), remained IN_PROGRESS at the npm resolution step. Its job log endpoint returned NOT_FOUND while the job was active; no generated lockfile was retrieved. This is NOT VERIFIED, not a success.
- The generator was bounded with `--fetch-retries=0 --fetch-timeout=45000` and a one-day artifact upload was added for review.
- The new exact-head run [42038551072](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038551072) was PENDING at report time; no job result or artifact existed yet.

## Changes
- Manifest: `dsh-runtime/package.json`.
- Temporary generation step added to the existing `pool-contract-validation.yml` workflow.
- Added a pinned `actions/upload-artifact` step for `dsh-runtime/package-lock.json`, retention one day.
- Separate temporary workflow was removed; only the existing validation workflow remains as the generation instrument.
- The temporary npm install step is not intended to remain in the final branch.

## Provenance
- PR: [#16](https://github.com/VlDMlNSh/developer-cloud-pool/pull/16).
- Branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Latest code commit: `d1e0bc1f4a5b5b4abb0334b5419d7a62451d06e9`.
- Manifest blob: `54b3df47ce28f7c90c41266edc437f314271bea7`.
- Validation workflow blob: `143704d186e3b39a5300a603699e5de6ad3186a5`.

## Security boundary
- npm lifecycle scripts disabled during lockfile generation.
- No secrets, provider credentials, DSH execution, model calls, Worker dispatch or paid services used.
- `POOL_DISPATCH_ENABLED` remains fail-closed.
- The lockfile has not been committed or independently reviewed.
- PR remains DRAFT / OPEN / NOT MERGED / NOT QUALIFIED.

## Acceptance still required
1. Wait for run 42038551072 to complete.
2. Retrieve the artifact and verify lockfile v3, exact direct DSH version, complete resolved graph, and integrity fields.
3. Commit the reviewed lockfile.
4. Remove temporary generation code from contract validation.
5. Convert both DSH workflows to `npm ci --ignore-scripts` using the shared lockfile.
6. Re-run exact-head CI and zizmor; inspect every finding without suppressions.
7. Obtain independent security review before merge.
