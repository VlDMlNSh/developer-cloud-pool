# Claude Code provenance and Docker no-egress hardening — 2026-11-18

## Scope and immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`
- Base: `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- PR #116 head: `76fa4859503c377ab8122b61223fe809133a3057`
- Independent/external reviews remain deferred until Cloud Pool can execute its own bounded review workflow.

## Implemented changes
1. Added `scripts/cloud_pool/verify_claude_release.py` and synthetic unit tests for exact version, platform, manifest checksum, malformed checksum, missing files and digest mismatch.
2. Replaced execution of the unverified native installer script with the official signed stable APT repository.
3. Verified Anthropic release key fingerprint `31DDDE24DDFAB679F42D7BD2BAA929FF1A7ECACE`.
4. Installed signed stable package `claude-code 2.1.311-1` (CLI `2.1.311`). The previously pinned `2.1.325` was not available in the stable repository; selection is taken from signed repository Candidate metadata and the exact release version is recorded.
5. Verified detached signature of the version-specific release manifest and compared the installed Linux x64 binary SHA-256 to its signed manifest checksum.
6. Added Docker `--network none` capability qualification with an immutable image digest resolved for the run, read-only root filesystem, dropped capabilities, no-new-privileges, PID/memory/CPU limits and an outbound TCP denial assertion.
7. Retained and re-ran existing PATH/HOME/XDG policy tests, task HOME tests, FCC profile guard and loopback runtime proof.

## Exact-head CI evidence
- Runner Qualification [44277244612](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244612): COMPLETED / SUCCESS on `76fa4859503c377ab8122b61223fe809133a3057`.
- Pool Contract Validation [44277244629](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244629): COMPLETED / SUCCESS on the same SHA.
- Artifact [14415785535](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244612/artifacts/14415785535), 33,315 bytes, SHA-256 `afd97c64a8ac02b9719565e3a5a57443916d2c1e15cd1286c49c3abdb42c0d02`.
- Downloaded ZIP SHA-256 independently matched GitHub's artifact digest. All 38 entries in `SHA256SUMS.txt` matched their artifact files.
- Signed binary result: Claude Code `2.1.311`, Linux x64, SHA-256 `86dc1fcc69498159eaf15f446613e847010f9036bfbbdffd4c49350be8489ada`, manifest signature verified, checksum match PASS.
- Anthropic APT key fingerprint: `31DDDE24DDFAB679F42D7BD2BAA929FF1A7ECACE`.
- Docker image used for no-egress probe: `ubuntu@sha256:73b999393d07f2bf65a40373778a44dc9a6d54ad7718d29247d8ff9413c4d6a8`.
- Docker proof: external TCP blocked, no default route, read-only root filesystem, capabilities dropped.
- Existing FCC guard: 15/15 synthetic tests PASS.
- FCC loopback: health HTTP 200, exactly `127.0.0.1:18765`, clean shutdown, listener absent after shutdown.
- Synthetic FCC-to-CLI bridge: mock CLI only, arguments preserved, no provider calls, no real Claude session.

## Security boundaries and NOT VERIFIED
- The Docker no-egress test proves the container primitive only. The real CODE executor has not yet run inside the container.
- Provider-specific allowlisted egress proxy/gateway is NOT IMPLEMENTED. Do not run authenticated model calls until it exists and is tested.
- GitHub-hosted runner itself has public internet egress; that host boundary is NOT isolated.
- Linux user/mount/PID/network unshare probes all returned exit code 1; do not rely on user namespaces on this hosted runner.
- Claude Code hosted-use entitlement/account authority has not been checked.
- FCC is AGPL-3.0-only; legal review for network-exposed operation remains outstanding.
- No provider account identity, free quota, live provider route, live task execution or persistent worker has been qualified.

## Safety boundary
- No GitHub secret values read; no provider credentials or provider calls.
- No live Claude session or agent task; no production dispatch.
- No paid fallback, Gemini dispatch, deployment, merge or Contour B work.
- PR #116 remains OPEN / DRAFT / UNMERGED.
- Independent/external reviews remain deferred per owner direction.

## Next bounded step
Build the actual CODE worker container profile around the verified Docker isolation primitive, then design a dedicated provider egress gateway that allows only the selected provider endpoints. Keep live provider calls disabled until account entitlement, quota, legal and egress gates are separately verified.
