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
