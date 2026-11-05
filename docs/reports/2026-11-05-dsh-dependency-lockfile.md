# DSH dependency lockfile — artifact pipeline correction (2026-11-05)

## Scope
Recover a real lockfile from the existing GitHub-hosted generation path without printing the lockfile contents into Actions logs. No Worker or DSH runtime was executed.

## Repository and provenance
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical branch: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16: https://github.com/VlDMlNSh/developer-cloud-pool/pull/16 — OPEN / DRAFT / NOT MERGED.
- Working branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Current branch head: `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3`.
- Manifest blob: `54b3df47ce28f7c90c41266edc437f314271bea7`.
- Validation workflow blob after change: `5b44d28cab32d03cf83d93b6d7cd8f14551bbe2a`.

## Finding
Earlier checkpoint text incorrectly characterized npm resolution as blocked. The decoded GitHub Actions log for run [42039481919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42039481919), job `127287504135`, proves:
- Node `v24.9.0`, npm `11.6.0`.
- The bounded `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=45000 --prefix dsh-runtime --lockfile-version=3` command completed in 32 seconds.
- Lockfile validation passed and reported 687 package entries.
- The job then emitted the entire lockfile as base64 to stdout. The log shows this output taking approximately 2m36s; the job was cancelled before artifact upload, YAML parsing, and project contract validation.
- Therefore dependency resolution succeeded; the failure was in the artifact/log transfer stage, not evidence of registry unavailability.

## Change implemented
- Removed the multi-megabyte base64 stdout dump.
- Replaced it with a SHA-256 summary line.
- Retained the existing one-day artifact upload step as the only lockfile transfer path.
- Added `dsh-runtime/**` to workflow path filters so changes to dependency manifests/lockfiles trigger validation.
- Re-read the workflow from GitHub. Blob `5b44d28cab32d03cf83d93b6d7cd8f14551bbe2a` confirms no base64 command, a SHA-256 command, and the artifact upload step.

Commits:
- `89798bb5b900f18da670db3a42449e91605208bf` — initial artifact/log pipeline adjustment.
- `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3` — removed base64 dump and added checksum output.

## Verification state
- Source readback: VERIFIED.
- Lockfile generation/structural check: SUCCESS on earlier PR head; 687 package entries.
- Artifact capture: NOT VERIFIED; no artifact has yet been retrieved.
- Exact-current-head run [42095679649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42095679649): PENDING at last read, no job created yet.
- Intermediate run [42095638148](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42095638148): IN PROGRESS at last read; it targets the preceding commit, not current HEAD.
- Lockfile full provenance review: NOT RUN.
- DSH/Worker/browser/model execution: NOT RUN.
- Independent review and qualification: NOT ACCEPTED / NOT QUALIFIED.

## Security boundaries
- No repository secrets or variables changed.
- `POOL_DISPATCH_ENABLED` not changed.
- No provider credentials, paid services, model calls, DSH runtime, Worker, or browser used.
- No lockfile was fabricated, converted from pnpm, or manually edited.

## Next step
Wait for run 42095679649 to complete. Retrieve its `dsh-runtime-lockfile` artifact and review the actual bytes, package count, integrity and resolved URLs, lifecycle scripts, optional dependencies, and package graph. Only then commit the lockfile and switch both runtime workflows to `npm ci --ignore-scripts`. Keep PR #16 draft until exact-head CI, zizmor, and independent security review pass.
