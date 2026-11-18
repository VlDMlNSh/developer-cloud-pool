# FCC fallback isolation hardening and PR #116 source review — 2026-11-18

## Target and scope
- Repository: `VlDMlNSh/developer-cloud-pool`
- PR #116 immutable target head before this pass: `aea59ae536358a827f05c2262647601ec53c8b33`
- Updated PR head after this pass: `754f42b0b7fa84c73e90cececc6f3d8a65877fab`
- Base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Scope: strengthen synthetic no-secret FCC account/fallback regression tests and review the exact PR head. No production dispatch, live provider calls, secrets, deployment or merge.

## Code changes
1. Added `test_rejects_numbered_fallback_selecting_unconfigured_second_key` to `scripts/cloud_pool/test_fcc_profile_guard.py`. It uses one synthetic Groq key and a `MODEL_FALLBACKS` entry with `api_key_number=2`; the pinned upstream Settings validation must reject the invalid key index. The test also asserts the synthetic key marker is absent from the error.
2. Added `test_rejects_process_level_fallback_and_custom_provider_overrides`, covering process-level `MODEL_FALLBACKS`, `FCC_CUSTOM_PROVIDERS`, and `ANTHROPIC_AUTH_TOKEN` overrides with inert sentinels.
3. Updated the qualification workflow assertion from 13 to 15 FCC profile-guard tests.

## Exact-head verification
- Current PR #116 head: `754f42b0b7fa84c73e90cececc6f3d8a65877fab`.
- Runner Qualification [44273710771](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771): COMPLETED / SUCCESS on exact head. Job [134696398899](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771/job/134696398899): 16/16 steps SUCCESS, including the 15-test profile guard, loopback readiness/shutdown, synthetic CLI bridge, pinned ECC installation and artifact publication.
- Pool Contract Validation [44273710870](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710870): COMPLETED / SUCCESS on exact head.
- Artifact [14412609174](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771/artifacts/14412609174), 28,061 bytes, SHA-256 `840c11c473077a2e819b5cf1b1d41cffe2512a856deed9c9fa074d163ed74eb`, not expired at inspection.
- PR review COMMENT [5953625731](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116#pullrequestreview-5953625731) is anchored to the exact head. It is a bounded source review, not an approval or independent third-party security sign-off.
- PR remains OPEN / DRAFT / UNMERGED.

## Security interpretation
The pinned upstream FCC model contract defines `api_key_number` as 1-based and validates it against the configured credential-list length. The Cloud Pool guard already rejects more than one configured credential owner, more than one key, non-empty model fallbacks, tier-specific model overrides, custom providers, process-level credential/routing overrides, alternate env-file sources, legacy config and OAuth/native auth state. The new tests exercise the numbered-key and process override cases explicitly.

This closes the previously identified *configuration-level cross-account key cycling path for the tested managed FCC profile contract*. It does not establish provider-account identity or prevent a malicious/rewritten remote proxy from substituting credentials. One account per isolated profile and separate quota ledgers remain mandatory.

## Remaining blockers — NOT VERIFIED
- Real provider route, account identity, free-tier entitlement and quota behavior.
- Claude Code installer/binary cryptographic provenance; the version-pinned native installer proof is not signature/hash verification of the downloaded installer or binary.
- Permission/compliance for hosted Claude Code execution; no live Claude session or agent task was run.
- FCC AGPL-3.0-only network-use compliance review before any network-exposed FCC deployment. Keep FCC loopback-only.
- Independent third-party security approval and all Contour A acceptance criteria.
- Persistent web console, durable production state, and production dispatch remain unqualified.

## Safety posture
No GitHub Secret values or metadata were read. No provider API call, real Claude session, paid fallback, Gemini dispatch, production dispatch, remote FCC exposure, deployment or merge occurred. Keep `POOL_DISPATCH_ENABLED=false`; PR #116 remains Draft.

## Next step
Continue the Contour A vertical slice with installer provenance and hosted-use compliance gates, then qualify the real permitted free provider route only after legal, account isolation and secret-boundary requirements are approved. Do not infer acceptance from this synthetic CI proof.

## References
- PR #116: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- Runner Qualification: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771
- Pool Contract Validation: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710870
- Current Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-16-current-state-refresh/docs/context/GITHUB-CONTEXT-WINDOW.md
