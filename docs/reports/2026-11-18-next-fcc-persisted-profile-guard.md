# /next — persisted FCC single-credential profile guard — 2026-11-18

## Immutable target and scope

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Parent PR: #116, first Claude Code + ECC + FCC runner qualification.
- Code branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Exact PR head: `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`.
- Base/default SHA: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Scope: inspect FCC's persisted managed configuration without disclosing credential values; prove single API-key credential owner, single key, one matching model and no fallback/custom-provider/tier override using synthetic test profiles only.

## Upstream source findings

Pinned FCC source: `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`.

Read-only source inspection identified:
- Managed configuration file: `~/.fcc/.env` (`config/paths.py`).
- OAuth/native credential state directory: `~/.fcc/auth/`.
- Managed configuration is parsed by `dotenv_values_from_file`, validated through the pinned `Settings` model and supports process-level overrides (`config/loader.py`).
- API-key fields are ordered collections; `MODEL_FALLBACKS` supports explicit `api_key_number` and fallback ordering.
- FCC configuration can also be redirected by `FCC_ENV_FILE` and legacy dotenv paths are migrated/recognized.

This is why checking only the parent process environment was insufficient.

## Bounded implementation

Added:
- `scripts/cloud_pool/fcc_profile_guard.py`, blob `2329e02424f407df57a6b4848991063da4f143e6`.
- `scripts/cloud_pool/test_fcc_profile_guard.py`, blob `141961313ff89ba28c0abc17fb7563a46979aef2`.
- Workflow integration in `.github/workflows/claude-code-fcc-runner-qualification.yml`, blob `8ce4999b08a16310eb44c355d481291412b7b005`.

The guard:
- requires a worker-owned private HOME/profile directory (0700) and a worker-owned managed file (0600);
- rejects symlinked config/profile/auth paths, alternate `FCC_ENV_FILE`, and known legacy dotenv sources;
- rejects process-level credential/model/fallback/custom-provider overrides;
- rejects non-empty FCC OAuth/native auth state;
- parses the managed config in memory using the pinned FCC dotenv and Settings code;
- rejects custom providers, more than one credential owner, more than one API key, model/provider mismatch, model-tier overrides and any `MODEL_FALLBACKS`;
- returns only non-secret metadata (provider/model IDs and boolean policy flags), never key values or key hashes;
- suppresses Settings/parser exception details to avoid accidental input disclosure.

The test fixtures contain only synthetic marker values. The CI test count is **13/13 PASS**.

## Exact-head CI evidence

- Runner Qualification [44260105806](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806), job [134651081368](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/job/134651081368): COMPLETED / SUCCESS on exact head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`; all 14 workflow steps SUCCESS.
- The FCC profile guard step reports `Ran 13 tests` / `OK`.
- Existing child environment allowlist tests passed.
- Pinned Claude Code 2.1.325 installation, uv bootstrap, FCC 6.19.35/Python 3.14.10 installation, FCC loopback health/readiness and clean shutdown, synthetic mock-only FCC-to-Claude bridge and selected ECC skill installation all passed in the same workflow.
- Pool Contract Validation [44260105903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105903): COMPLETED / SUCCESS on the same SHA; dispatch-disabled/security workflow checks passed.
- Artifact [14407638100](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/artifacts/14407638100): 27,378 bytes; GitHub ZIP digest `sha256:bfde13007c9db2385ddd57e7502736a5591d33a0f52197ff8be1647b57ab5dfa`; retention until 2026-11-25T07:36:30Z.
- Prior exact-head attempt `8a918b77306839cc58c581bad24d36fabcaa6300` failed because one test expected the previous error string. Job logs showed 12/13 tests passed; corrected the assertion only, then reran the full workflow at the new exact head above. Final run is SUCCESS.

## Security and qualification limits

- No real user's FCC profile was opened or inspected.
- No provider key or GitHub Secret value was read, printed, hashed, transmitted or placed in artifacts.
- No provider/model request or real Claude session occurred; the existing bridge uses a synthetic Claude mock.
- This guard covers FCC API-key provider catalog entries and FCC's own auth directory. It is not a host-level egress firewall and does not attest cloud SDK credentials outside the isolated worker HOME. A production worker must use a dedicated HOME and separately prove host identity, allowed credential source and egress controls.
- It verifies structural single-credential policy, not provider-account identity, entitlement, free quota or actual route behavior.
- FCC is pinned AGPL-3.0-only; network exposure remains blocked pending deployment-specific license review.
- PR #116 remains OPEN / DRAFT / UNMERGED. No independent A3 review, provider route qualification, deployment or production dispatch is implied.

## Status and next

- Persisted FCC profile guard: **VERIFIED** against 13 synthetic cases on exact PR head.
- No-secret runner installation/loopback/synthetic bridge: **SUCCESS** on exact PR head.
- Actual FCC user profile/account identity/free quota: **NOT VERIFIED / NOT QUALIFIED**.
- Issue #115 remains OPEN.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

Next bounded step: independently review the guard and test whether the worker launcher always creates and uses a dedicated HOME with no external credential stores; only then design a permitted free-provider route qualification. Do not access or expose real credential values.

## References

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Issue #115](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115)
- [Runner Qualification 44260105806](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806)
- [Pool Contract Validation 44260105903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105903)
- [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Canonical MediaHub Chat Tree Map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
