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
