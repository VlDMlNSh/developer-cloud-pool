# Checkpoint — DSH dependency lockfile — 2026-11-05

## Immutable target
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16: https://github.com/VlDMlNSh/developer-cloud-pool/pull/16
- Branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Latest code head at this checkpoint: `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3`.
- Manifest blob: `54b3df47ce28f7c90c41266edc437f314271bea7`.
- Updated validation workflow blob: `5b44d28cab32d03cf83d93b6d7cd8f14551bbe2a`.

## New evidence: lockfile resolution succeeded
- Run [42039481919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42039481919), job `127287504135`, checked out PR merge SHA `394f202c2a31fb1de609eac5a1d97cc971f38803` (PR head `00bf891729de7c1092a5bde8b09fec6f4c4cbc66`).
- Pinned Node.js `24.9.0`; npm `11.6.0`.
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=45000 --prefix dsh-runtime --lockfile-version=3` completed successfully in 32 seconds.
- The following validation printed `LOCKFILE_VALIDATED packages=687`.
- This corrects the earlier assumption that registry resolution was blocked. Registry resolution succeeded; artifact capture was not completed.
- The workflow then streamed the entire lockfile as base64 into Actions logs. That output took about 2m36s; the job ended CANCELLED before artifact upload and subsequent contract checks. No lockfile artifact was created.

## Bounded remediation implemented
- Removed the base64 stdout dump.
- Replaced it with `sha256sum dsh-runtime/package-lock.json`.
- Kept the one-day artifact upload as the transfer mechanism.
- Added `dsh-runtime/**` to pull_request and push path filters so dependency manifest/lockfile changes trigger contract validation.
- Workflow readback verified: blob `5b44d28cab32d03cf83d93b6d7cd8f14551bbe2a`; base64 dump absent; sha256 and artifact upload present.
- Code commits: `89798bb5b900f18da670db3a42449e91605208bf` (initial adjustment), `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3` (final removal/readback).

## Exact-head CI
- Run [42095638148](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42095638148) targets intermediate head `89798bb5b900f18da670db3a42449e91605208bf`; it was IN_PROGRESS at last read.
- Run [42095679649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42095679649) targets current head `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3`; queued/pending with no job created at last read.
- Current-head CI: NOT VERIFIED.
- Artifact: NOT YET AVAILABLE.
- Lockfile bytes and full contents: NOT YET RETRIEVED OR REVIEWED.
- Do not treat package-count validation as full lockfile provenance/security review.

## Hard prohibitions
- Do not fabricate or hand-edit dependency versions/integrity values.
- Do not merge PR #16 without retrieving and reviewing the actual lockfile, exact-head CI, and independent security review.
- Do not run Worker, DSH, Resource Probe, browser, model/provider calls or paid fallback.
- Do not enable `POOL_DISPATCH_ENABLED`.

## Acceptance
1. Current-head workflow completes and uploads the actual lockfile artifact.
2. Retrieve artifact; inspect every package entry, integrity/resolved provenance, package scripts, and dependency graph.
3. Commit the reviewed lockfile.
4. Replace direct installs in both DSH workflows with `npm ci --ignore-scripts` using the shared lockfile.
5. Remove temporary lockfile generation from validation workflow.
6. Run exact-head CI and zizmor; resolve findings without suppressions.
7. Obtain independent security review before merge or any DSH execution.
