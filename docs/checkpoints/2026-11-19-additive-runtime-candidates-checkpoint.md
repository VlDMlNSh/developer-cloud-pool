# 2026-11-19 — Additive runtime candidates checkpoint

**Status:** RESEARCH RECORDED / NOT ADOPTED / NOT DEPLOYED  
**Base A1 PR:** #146, OPEN / DRAFT / UNMERGED  
**Working base SHA:** `9d32c4943ae87f5855ab05d42a4ba12d1c205211`  
**Decision:** ADDITIVE ONLY; Claude Code and every existing route/configuration remain unchanged.

## Owner decision

The user explicitly authorizes investigation and possible additional deployment only. Replacing Claude Code, disabling/reconfiguring an existing executor, migrating task identity, or changing existing provider routes is prohibited. New candidates must have separate IDs, credentials, quotas, capabilities, workspaces, network boundaries and rollback.

## Candidate status

- OpenChamber: ADAPT/EVALUATE optional UI candidate; it uses OpenCode CLI in CLI/Web and VS Code paths. Direct DSH compatibility NOT VERIFIED.
- DeepSeek Harness: LAB-ONLY / NOT QUALIFIED; developer preview and upstream safety notice says unaudited/not production-ready.
- CUA Driver MCP: isolated desktop executor candidate / NOT QUALIFIED; shared desktop concurrency and platform permissions require qualification.
- llama-modchip: optional local inference candidate / NOT QUALIFIED; benchmark claims and compatibility unverified; model-weight licenses separate.
- Tor: NOT REQUIRED by these candidates; separate future security decision only.

Detailed source evidence and acceptance gates: [evaluation report](../reports/2026-11-19-additive-openchamber-deepseek-cua-llama-modchip-evaluation.md).

## Work performed

- Read upstream READMEs, safety notice, CUA MCP package docs, OpenChamber security/private relay docs and llama-modchip license.
- Recorded immutable upstream blob SHAs in the report.
- Updated Context Window with the non-regression decision.
- No application code, workflows, existing executor config, secrets, providers, model calls, dispatch, hosted resources or deployment changed.
- Tests: not run; documentation-only research pass.

## Next

Inspect OpenChamber's OpenCode/provider contracts, DSH model adapters/plugin permissions, CUA Driver platform permissions, llama-modchip API/build/release provenance and model-weight licenses. Produce additive-only ADR and old-route non-regression test plan. Do not begin integration until Contour A gates and applicable governance allow it.

Contour A remains NOT ACCEPTED. Contour B remains DEFERRED.


## 2026-11-19 — Live GitHub state refresh (follow-up)

- Default branch `Основной` was independently re-read from `refs/heads/Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #146 is OPEN / DRAFT / UNMERGED; head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`, base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; formal reviews: 0.
- PR #147 is OPEN / DRAFT / UNMERGED; head `447ed051926eea32deb754b0e2387ef345611a38`, base branch PR #146 head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`; formal reviews: 0. It remains a stacked documentation proposal.
- Exact-head CI for PR #146 head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`: Pool Contract Validation run [44522152749](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44522152749) SUCCESS; Isolated D1 Ledger Proof run [44522152799](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44522152799) SUCCESS.
- Issue #140 remains OPEN and continues to prohibit hosted D1, secrets/variables inspection, provider calls, dispatch, deployment and merge. No relaxation inferred.
- Active ruleset #26550182 targets `refs/heads/Основной`; PR required, review-thread resolution required, required approving reviews = 0, code-owner review disabled, bypass actors empty. Classic branch protection remains NOT VERIFIED in this refresh.
- No source/config/workflow/secret/provider/runtime/hosted-resource change; no tests run in this docs-only refresh; no dispatch, deployment or merge.
- Contour A remains NOT ACCEPTED; Contour B remains DEFERRED. Next Contour A work remains the Stage 2 executor identity/admission hardening and Issue #140's local-only canonical proof requirements. Candidate integrations remain research-only until governance permits qualification.


## 2026-11-19 — OpenJarvis / isair-Jarvis candidates recorded

- New report: [OpenJarvis and isair/Jarvis additive evaluation](../reports/2026-11-19-openjarvis-isair-jarvis-additive-evaluation.md).
- Owner decision remains ADDITIVE ONLY; Claude Code and all existing executor/provider routes, identities, permissions, quota domains, secrets scopes, workspaces and runtime paths remain unchanged.
- Stanford OpenJarvis: `open-jarvis/OpenJarvis`, observed upstream main SHA `427c2dd11d180ac254a03e92c5fb01189fb4b23b`, Apache-2.0; preliminary ADAPT/EVALUATE, NOT QUALIFIED.
- isair/Jarvis: `isair/jarvis`, observed upstream main SHA `9d902577fd7c8d4fe05df7e19c81aaec36c79902`; checked-in custom license permits non-commercial use and requires a separate commercial license. Commercial adoption BLOCKED pending written license review; candidate remains RESEARCH ONLY / NOT QUALIFIED.
- No candidate is an authority, sandbox or executor admission mechanism. No registry entries, profiles, deployments, installs, model downloads, MCP connections, provider calls, secrets, dispatch or hosted resources were created or used.
- Evidence is source-level desk review only; no runtime/security/license qualification and no tests run.
- Issue #140 remains OPEN and controlling; Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: continue Contour A admission/identity hardening. If later authorized, evaluate OpenJarvis API/sandbox first in an isolated no-secret harness; do not commercially adopt isair/Jarvis without separate written commercial license.
