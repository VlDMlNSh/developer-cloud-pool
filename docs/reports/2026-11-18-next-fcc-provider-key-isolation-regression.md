# /next — FCC provider-key and fallback environment isolation regression — 2026-11-18

## Immutable target and scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Parent PR: #116 — first Claude Code + ECC + FCC no-secret runner qualification.
- Branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Exact PR head: `a956129f6cf426c887e755c563740fe1813161d9`.
- Base/default SHA: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Changed file: `scripts/cloud_pool/test_exec_allowlist.py`, blob `dcf6000f9475a0bef598f175663475a12a787927`.
- Scope: explicit regression coverage proving provider credentials and FCC fallback configuration from the parent environment cannot enter a Cloud Pool child process through the exec allowlist. No runtime policy or workflow production behavior changed.

## Upstream research — pinned FCC source
Pinned FCC commit: `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`.

Read-only source inspection established:
- `src/free_claude_code/config/api_keys.py` accepts one API key or an ordered list/tuple and normalizes them into `SecretStr` entries.
- `src/free_claude_code/providers/runtime/config.py` supports selecting a numbered key from the provider credential list.
- `tests/config/test_fallback_key_settings.py` covers explicit `api_key_number` and model fallback settings.
- `tests/api/test_fallback_key_requests.py` exercises fallback sequences that move across numbered keys after upstream 403/429 responses.

These upstream capabilities create a quota-isolation hazard when different provider accounts are stored in one FCC provider key list or fallback chain. Cloud Pool policy remains: one account/credential per isolated FCC profile; no `MODEL_FALLBACKS`, no numbered-key fallback/key cycling, no provider or paid fallback. Separate accounts require separate profiles and quota ledgers.

Pinned source links:
- [FCC API-key normalization](https://github.com/Alishahryar1/free-claude-code/blob/eb92e4c07af0d6ad8881dce1cd958c3d072c27c5/src/free_claude_code/config/api_keys.py)
- [FCC numbered credential selection](https://github.com/Alishahryar1/free-claude-code/blob/eb92e4c07af0d6ad8881dce1cd958c3d072c27c5/src/free_claude_code/providers/runtime/config.py)
- [FCC fallback setting tests](https://github.com/Alishahryar1/free-claude-code/blob/eb92e4c07af0d6ad8881dce1cd958c3d072c27c5/tests/config/test_fallback_key_settings.py)
- [FCC fallback HTTP request tests](https://github.com/Alishahryar1/free-claude-code/blob/eb92e4c07af0d6ad8881dce1cd958c3d072c27c5/tests/api/test_fallback_key_requests.py)

## Bounded change
Added `test_fcc_provider_keys_and_fallback_settings_never_cross_child_boundary` to the Cloud Pool child environment allowlist tests.

The test:
- uses the known FCC setting alias names from the pinned Settings schema;
- covers `MODEL`, `MODEL_FALLBACKS`, `FCC_CUSTOM_PROVIDERS`, supported provider API-key aliases and `ANTHROPIC_AUTH_TOKEN`;
- supplies only inert `synthetic-placeholder` values;
- asserts that none of those names or marker values appears in the returned child environment.

The test explicitly protects the **inherited process-environment boundary**. It does not validate FCC configuration stored on disk or in its Admin UI/database. Therefore it is not sufficient by itself to guarantee a production profile contains only one configured credential.

## Exact-head CI evidence
- Claude Code + ECC + FCC Runner Qualification [44257088134](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134), job [134641259169](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134/job/134641259169): COMPLETED / SUCCESS on exact `a956129f6cf426c887e755c563740fe1813161d9`.
- Job log explicitly shows the new test passed and Python unit suite `Ran 9 tests` / `OK`.
- Full no-secret runner qualification completed all steps successfully: pinned Claude Code install, pinned uv/FCC install, FCC loopback readiness and clean shutdown, synthetic mock-only FCC-to-Claude handoff, selected ECC skills install, resource/provenance manifest generation and artifact upload.
- Pool Contract Validation [44257088139](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088139), job [134641259701](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088139/job/134641259701): COMPLETED / SUCCESS; dispatch-disabled invariant and workflow security validation passed.
- Artifact [14406183728](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134/artifacts/14406183728): 26,805 bytes; GitHub-reported ZIP digest `sha256:17e510f0d5c8b45862bc0f34e9bf7e33cf82ccfa5f9bf292c07bd70900dafad8`; available until 2026-11-25T07:13:22Z.
- PR #116 was read back at the same exact head after the write. The new test function was present in the fetched blob.
- Evidence comment: [PR #116 comment 6971812220](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116#issuecomment-6971812220).

## Qualification boundary and blockers
- This proves the no-secret installation/resource/lifecycle slice and synthetic mock handoff only. No real Claude session, model request, free-provider route, account identity or quota entitlement was tested.
- No provider calls or GitHub Secret-value reads occurred. The test and workflow use synthetic markers/mock invocation only.
- No network-level egress firewall is proven; process-environment allowlisting is not a host/network firewall.
- The allowlist does not sanitize persisted FCC configuration. A later real route must independently verify the single-account profile configuration without disclosing key values.
- FCC pinned license is AGPL-3.0-only; remote/network exposure remains blocked pending review of intended deployment and applicable source-offer/notice obligations. ECC pinned license is MIT; Claude Code CLI remains subject to vendor terms.
- Issue #115 remains OPEN until one actual permitted free provider route, provider/account identity and quota behavior are qualified.
- PR #116 remains OPEN / DRAFT / UNMERGED. The visible review submissions are COMMENTED, not APPROVED; this pass does not create an independent A3 approval.
- Production dispatch remains disabled. No Gemini controller is present on default. Gemini is supplementary, not a mandatory per-/next launch gate under the later owner scope correction in Issue #94; no task was dispatched in this pass.
- Hosted D1, trusted production admission, lease/fencing/recovery, worker identity, real routing, remote Jarvis UI, persistent workspace/restore and independent Contour A acceptance remain NOT QUALIFIED / NOT VERIFIED.

## Status and next
- Provider-key/fallback inherited-environment isolation regression: **VERIFIED** on exact PR head.
- Unit tests: **9/9 PASS**.
- No-secret Claude Code + ECC + FCC runner qualification: **SUCCESS** on exact PR head.
- Live provider route/account/quota: **NOT QUALIFIED**.
- Issue #115: **OPEN**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

Next bounded step: define and verify a one-account FCC profile configuration boundary that can be checked without retrieving or printing credential values; only after that proceed to a separately authorized free-route/account/quota qualification. Do not expose FCC remotely until AGPL deployment obligations are resolved.

## References
- [Issue #115 — first Claude Code + ECC + FCC runner qualification](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115)
- [PR #116 — first executor runner qualification](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Exact-head runner run 44257088134](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134)
- [Exact-head Pool Contract Validation 44257088139](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088139)
- [Current Cloud Pool Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
