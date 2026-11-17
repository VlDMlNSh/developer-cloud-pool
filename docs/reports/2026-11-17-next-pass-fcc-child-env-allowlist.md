# /next — FCC child environment allowlist qualification

**Date:** 2026-11-17  
**Contour:** A — Cloud Development Pool  
**Immutable implementation target:** PR #116 head `2b4b02b331b0dd4547baac11f7d38fe232872431`  
**Base:** `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`

## Objective

Close the inherited-environment exposure identified during the pinned FCC source review. The FCC launcher builds the Claude child environment from its parent process environment; by default it preserves unrelated variables. This pass adds a strict allowlist boundary before starting FCC and before the FCC launcher starts the synthetic Claude CLI.

## Changes

- Added `scripts/cloud_pool/exec_allowlist.py`.
  - Copies only explicit runtime variables required for HOME/PATH, locale/temp, loopback FCC settings and bounded provider attempt/concurrency settings.
  - Requires absolute HOME and PATH entries; rejects empty/relative PATH segments.
  - Rejects empty, NUL, CR and LF values for allowlisted variables.
  - Fails closed on missing required variables and uses `execvpe` with the reduced environment.
  - Does not accept caller-supplied variable names or arbitrary environment overrides.
- Added `scripts/cloud_pool/test_exec_allowlist.py`.
  - Covers allowlist-only forwarding, synthetic GitHub/provider/AWS credentials, HTTP(S) proxy removal, required variables, malformed values and relative PATH rejection.
- Updated PR #116 qualification workflow.
  - Runs unit tests.
  - Starts FCC server through the allowlist wrapper.
  - Starts FCC Claude launcher through the same wrapper.
  - Injects only synthetic credentials into the parent test shell and asserts the mock Claude executable cannot see them.
  - Verifies loopback-only listener, argument preservation, CLI exit-code propagation, clean shutdown and no synthetic credential text in logs.
- Updated the canonical reference architecture evidence table and implementation order. No historical source document was deleted.

## Exact-head evidence

- Runner qualification: [run 44083551665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083551665) — SUCCESS on exact head `2b4b02b331b0dd4547baac11f7d38fe232872431`.
- Job: `134040...` (see run page; completed all steps successfully).
- Unit test step: SUCCESS.
- FCC install/runtime steps: SUCCESS.
- Synthetic FCC → Claude CLI through environment allowlist: SUCCESS.
- Pool Contract Validation: [run 44083551660](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083551660) — SUCCESS on exact head.
- Artifact: [14328955413](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083551665/artifacts/14328955413), 13,718 bytes, GitHub digest `sha256:b796274db66f1ca17000e31c37ddc0133abbeae60db7c7b562c367ae1815bb3b`. Metadata/digest supplied by GitHub; archive bytes were not independently downloaded or inspected.

## Failure and correction retained

The first integrated attempt at head `279290da27fc87f440b7000d6824932143142887` failed only in the synthetic argument-file comparison because the mock printf format contained an extra escape. The environment unit tests, FCC loopback runtime and installation had passed. The mock output format was corrected and the exact-head workflow rerun; the corrected run above passed. The failed run remains in GitHub history and is not represented as success.

## Security interpretation and limits

**Verified:** the wrapper's unit tests and synthetic FCC server/launcher path demonstrate that selected synthetic GitHub/provider credentials and HTTP(S) proxy variables present in the parent shell do not reach the mock Claude child. Only the explicitly allowlisted environment is forwarded at that process boundary.

**Not verified:** actual provider credentials, free-route/account identity, provider quota, a real Claude model request, real task execution, production A0/D1 admission, durable leases/fencing/recovery, authenticated Jarvis PWA or Contour A acceptance. No GitHub Secret values were read. No provider/model API call was made. No production dispatch or deployment occurred.

This wrapper is a candidate implementation in PR #116, not yet merged to the default branch. Independent review is still required. Its allowlist must be revisited if the runtime adds a required environment variable; additions require a reason and tests. The allowlist is not a substitute for runner isolation, filesystem permissions, egress policy or A0 capability enforcement.

## Current state

- PR #116: OPEN / DRAFT / UNMERGED; head `2b4b02b331b0dd4547baac11f7d38fe232872431`.
- Default branch unchanged: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Worker dispatch remains disabled.
- Gemini dispatch: NOT RUN.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded implementation slice

Qualify one free FCC provider route and its account/quota evidence without reading secret values or making a provider call until the route contract and owner approval permit it. In parallel, continue integrated A0/D1 durable admission, lease/fencing and recovery. Keep all dispatch paths fail-closed.

## Links

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Issue #119](https://github.com/VlDMlNSh/developer-cloud-pool/issues/119)
- [Canonical Reference Architecture 1.0](../architecture/CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
