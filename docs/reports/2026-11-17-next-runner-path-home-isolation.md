# /next report — Runner PATH and HOME/XDG isolation hardening

**Date:** 2026-11-17  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Scope:** Contour A / first CODE executor profile / PR #116  
**Status:** PARTIAL — source/tests updated; exact-head runner qualification FAILED; production remains disabled.

## 1. Target and precedence

- Owner baseline: [Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md).
- Implementation sequence: [Roadmap](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md).
- Immutable implementation base: PR #116 head `6d4a4c518d44aa4a79d8396390623f424499011a`.
- New candidate head after this pass: `caa4a9b80f598d08087a6fd5bedfb7d90c08e5bc`.

The current owner freeze and roadmap supersede stale /next notes that prioritized the Gemini durable-lease issue as the immediate task. First CODE executor preparation and runner hardening remain the current implementation priority. Gemini is supplementary and its controller file is absent from default branch; dispatch was NOT RUN.

## 2. Work completed

Updated in PR #116:
- `scripts/cloud_pool/exec_allowlist.py`: PATH entries must resolve to existing directories; ownership must be root or current runner identity; group/world-writable directories are rejected; canonical duplicate PATH entries are rejected; HOME and XDG directories must be private, current-user-owned directories; XDG paths must be inside isolated HOME.
- `scripts/cloud_pool/test_exec_allowlist.py`: expanded to eight unit tests covering allowlist behavior, secret/proxy removal, required values, relative/empty/missing/duplicate PATH entries, non-directory and unsafe PATH directories, private HOME, XDG confinement and malformed values.
- `.github/workflows/claude-code-fcc-runner-qualification.yml`: FCC runtime and synthetic bridge now use dedicated private HOME/XDG trees and a deliberately constructed PATH. Removed the duplicate `/bin` alias after it resolved to `/usr/bin` on the hosted runner.

Local verification: Python unittest suite **8/8 PASS** in an isolated temporary directory.

## 3. Exact-head CI

- Candidate head `846fd556b8726cc88b4fead7f071a8a002f464e9`: Pool Contract Validation run `44091723935` SUCCESS; runner qualification `44091723923` FAILED at step 8, “Start FCC on loopback and verify local readiness and shutdown”. Step 3 unit tests passed; install Claude, uv and FCC steps passed. Synthetic bridge and ECC steps were skipped due to failure. Initial duplicate canonical PATH alias was found and removed in the next commit.
- Latest candidate head `caa4a9b80f598d08087a6fd5bedfb7d90c08e5bc`: Pool Contract Validation run `44091902882` SUCCESS; runner qualification run `44091902840` FAILED again at step 8. Unit tests, Claude install, uv install and FCC install passed. Synthetic bridge and ECC steps skipped.
- The available GitHub job-step metadata does not expose the failing step's stderr/annotations through the connected read interface. Exact runtime failure cause is therefore **NOT VERIFIED**; do not infer that the duplicate PATH alias was the only cause.
- Exact-head workflow syntax/security check passed on `caa4a9b80f598d08087a6fd5bedfb7d90c08e5bc`.

## 4. Security and qualification boundary

- No GitHub Secret values were read or injected; no provider/model calls; no Claude agent task; no Gemini dispatch; no paid fallback; no deployment; no merge.
- The allowlist is a child-process environment boundary, not a host-level egress firewall. Real provider egress isolation is still NOT VERIFIED.
- The official Claude installer script is version-pinned at invocation but its downloaded bytes are not integrity-pinned; this remains open.
- FCC account identity, one-key/no-fallback effective configuration, free entitlement and quota are NOT VERIFIED.
- FCC AGPL network-use compliance requires review before any remote/network deployment; FCC remains loopback-only.
- PR #116 remains OPEN/DRAFT/UNMERGED. Existing reviews are owner-authored COMMENTs, not independent approval.
- Active default ruleset #26550182 requires PR and review-thread resolution but has zero required approvals and no required status checks. Independent review is still required by project policy.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## 5. Next bounded step

Retrieve the full failing runner-step diagnostics (annotations/logs) for run `44091902840`, identify the exact path/ownership/XDG/runtime rejection, then fix only the evidenced cause and rerun exact-head CI. Keep `POOL_DISPATCH_ENABLED=false`. Do not proceed to provider calls until installer integrity, FCC single-account/no-fallback configuration, route/free-quota evidence and independent security review are complete.

## 6. Canonical links

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Run 44091902840](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44091902840)
- [Run 44091902882](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44091902882)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Implementation Roadmap](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md)
- [Canonical architecture](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)

## 7. Follow-up — root cause fixed and exact-head proof passed

### Root cause evidence

Retrieved complete job logs for run `44092881008`. The exact rejection was:

```text
Cloud Pool child environment rejected: PATH entry directory is group/world writable: /usr/local/bin (mode=0777, uid=0)
```

The hosted runner's `/usr/local/bin` is root-owned but world-writable. The allowlist correctly rejected it. The fix was to remove `/usr/local/bin` from both FCC runtime and synthetic bridge PATH definitions; retain the ownership and write-bit checks. No security policy was relaxed.

### Provenance manifest integrity correction

The first passing runtime artifact exposed duplicate/ambiguous fields because synthetic mock invocation and FCC server lifecycle both used `fcc_client_launcher_invoked`. The workflow now writes `synthetic_bridge_claude_mock_invoked`, prefixes FCC lifecycle fields with `fcc_runtime_`, and fails on duplicate manifest keys. An intermediate sed implementation failed due to an incorrectly escaped backreference; it was replaced with awk and exact-head CI rerun.

### Final exact-head qualification

- Candidate head: `e58211dfe82a885d7718ebbc89d66188087cdcc4`.
- Runner qualification [44093612344](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44093612344): SUCCESS; job 134074878247; all 14 steps succeeded.
- Pool Contract Validation [44093612348](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44093612348): SUCCESS.
- Artifact [14331114755](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44093612344/artifacts/14331114755), 26,657 bytes; GitHub SHA-256 `74d11af0039a856d4aebd72c01d0f403e05e1adaa8879b126706e41575c2f479`. Downloaded archive digest independently matched; all 22 internal SHA256SUMS entries matched; provenance manifest duplicate-key count was zero.
- Versions: Claude Code 2.1.325; FCC 6.19.35 / Python 3.14.10; uv 0.13.7; ECC pinned commit `e413166c50e85fb205b988b5e78874b5a88ea4d2`, skills search-first, tdd-workflow, security-review; FCC pinned commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`.
- Resource observation: 4 vCPU, 15 GiB RAM, 145 GiB root disk, 88 GiB free after install; Claude 349 MB, FCC 200 MB, uv cache 12 MB, ECC skills 68 KB.
- FCC loopback: status HTTP 200, exactly 127.0.0.1:18765, clean SIGINT exit 0, no listener afterward. Synthetic bridge: health HTTP 200 at 127.0.0.1:18766, argument preservation verified, synthetic mock exit 37 propagated, bridge process exit 0 and listener absent afterward.

### Qualification boundary and remaining gates

This is a bounded no-secret installation, loopback lifecycle and synthetic mock bridge proof only. The Claude executable was a mock: `real_claude_session=false`, `agent_task_executed=false`. No provider calls or GitHub Secret reads occurred; production dispatch remains false. It does not prove real Claude task execution, provider route health, account identity, free quota, single-account/no-fallback effective FCC configuration, host deployment, egress isolation, or Contour A acceptance.

PR #116 remains OPEN/DRAFT/UNMERGED. Existing review submissions are owner-authored COMMENTs, not independent approval. Ruleset #26550182 does not enforce an approving review or required status checks; project policy still requires independent A3 review. FCC remains loopback-only pending AGPL-3.0-only network-use review. Keep `POOL_DISPATCH_ENABLED=false`.

### Next step

Complete installer-byte integrity and FCC one-account/no-fallback configuration review without reading secrets. Then, only after independent A3 review and route/account/quota/egress gates, qualify one actual free provider route. Do not interpret this synthetic proof as a live agent qualification.
