# First Claude Code + FCC + ECC Runner Proof — 2026-11-17

**Scope:** Contour A / first CODE profile only  
**Status:** INSTALLATION STEPS SUCCEEDED; CLEAN NO-SERVER QUALIFICATION NOT YET VERIFIED  
**Repository:** `VlDMlNSh/developer-cloud-pool`

## Summary

A GitHub-hosted `ubuntu-24.04` runner successfully installed the pinned Claude Code CLI, FCC and selected ECC skills. The run also exposed an unexpected side effect: invoking `fcc-claude --help` auto-started the local FCC server. The workflow then cleaned up the orphaned server process, but the uploaded manifest incorrectly recorded `fcc_server_started=false`. Therefore the run is useful installation/resource evidence but is **not accepted as the clean no-server qualification**. The current workflow revision removes the launcher invocation and must be rerun.

## Exact evidence

- PR #116: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- Successful installation attempt head: `bddcdc3f27044d8a5115556d9913a6dd839ddc1a`
- Runner workflow run: [44069967928](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069967928), conclusion SUCCESS.
- Runner job: `133993407197`, all workflow steps SUCCESS.
- Pool Contract Validation: [44069967918](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069967918), conclusion SUCCESS on the same head.
- Artifact: [14321204259](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069967928/artifacts/14321204259), 17,140 bytes.
- GitHub artifact digest: `sha256:091f106411763030c56ef01ee5b96752f6ba5cef98eb6b9d636be5c660b6324a`.
- Downloaded ZIP SHA-256 independently recomputed: `091f106411763030c56ef01ee5b96752f6ba5cef98eb6b9d636be5c660b6324a` — exact match.

## Installed component evidence

- Claude Code CLI: `2.1.325`, official native installer, version check succeeded.
- FCC: `6.19.35`, pinned upstream commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`.
- FCC Python: `3.14.10`.
- FCC dependency install: `uv sync --frozen --no-dev --python 3.14.10`; `uv.lock` and `pyproject.toml` Git blob identities were checked before install.
- uv: `0.13.7`.
- ECC: pinned commit `e413166c50e85fb205b988b5e78874b5a88ea4d2`; selected skills `search-first`, `tdd-workflow`, `security-review` were copied and SHA-256 hashed.
- FCC virtual environment: 200 MB.
- Claude installation footprint: 349 MB.
- uv cache: 12 MB.
- Selected ECC skills: 68 KB.
- FCC locked sync time: 1.39 seconds; maximum RSS recorded by `/usr/bin/time -v`: 105,768 KiB.

## Runner measurement

This specific ephemeral runner reported:
- Ubuntu 24.04.5 LTS, x86_64.
- 4 vCPU.
- 15 GiB RAM.
- Root filesystem: 145 GiB total, 89 GiB available at baseline and 88 GiB after installation.

These are observations from one job only; do not treat them as a guaranteed capacity contract for every runner allocation.

## Side-effect finding and correction

FCC source at the pinned commit defines `fcc-claude` as a launcher. The launch path starts the FCC server automatically if one is not already available. The workflow invoked:

`fcc-claude --help`

The job log then recorded:

`Starting Free Claude Code at http://127.0.0.1:8082 (it keeps running after this client exits).`

The Actions cleanup later terminated orphan processes `fcc-server` and `python`. This was a loopback-only process in the ephemeral runner; no provider/model request or credential injection occurred. However, the uploaded manifest's `fcc_server_started=false` field was inaccurate for this attempt. Do not use that field as proof of no server start.

The latest workflow revision removes `fcc-claude --help` entirely. It retains only the metadata-only `fcc-server --version` and `fcc-doctor --version` checks. A subsequent exact-head run must confirm that no FCC server process starts and that the artifact reports the correct state.

## Security and scope

- No GitHub Secret values were read or injected.
- No provider API/model call was made.
- No Anthropic API authentication was used.
- No paid fallback or key rotation occurred.
- No agent coding task was executed.
- No production dispatch was enabled.
- No deployment or merge occurred.
- PR #116 remains Draft and unmerged; independent review is still absent.

## Latest candidate after correction

- Latest workflow branch head: `fda850b4f77800873c93b76dcd55ec362656d844`.
- Workflow blob: `2b6f542ad6d1b1a855a317bb01ccfc0b365fd844`.
- The launcher call has been removed; exact-head CI for this revision must be checked before treating the no-server condition as verified.

## Next step

1. Inspect the exact-head runner and contract runs for `fda850b4f77800873c93b76dcd55ec362656d844`.
2. Verify all three installs, actual versions, resource measurements and artifact digest.
3. Confirm logs contain no FCC server startup and that the manifest says the launcher was not invoked.
4. Obtain independent review; keep PR #116 Draft until all criteria pass.
5. Only after this proof is clean, begin FCC's explicit free-route configuration and compatibility qualification. Do not read secret values or make provider calls before the route-specific security/quota gate is approved.

**Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.**
