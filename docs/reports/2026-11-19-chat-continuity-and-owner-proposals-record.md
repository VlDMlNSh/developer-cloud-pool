# 2026-11-19 — Chat continuity and owner-proposed architecture register

**Purpose:** preserve the decisions and project proposals from the current conversation so a future ChatGPT session can restore context without relying on chat history alone.  
**Status:** RECORDED / DOCUMENTATION ONLY / NOT A DEPLOYMENT AUTHORIZATION.

## Owner's explicit request

The owner asked that all projects and architectural schemes proposed for consideration be recorded in GitHub, that the current chat be preserved in the persistent project context/files, and that a master prompt be prepared for continuation in a new chat.

The owner-approved compatibility principle is **ADDITIVE ONLY**. Existing Claude Code and other approved executor/provider routes must not be replaced, migrated, renamed, disabled, reconfigured or weakened.

## Candidate projects raised in the project discussions

| Candidate | Repository/source | Possible role | Current disposition |
|---|---|---|---|
| OpenChamber | https://github.com/openchamber/openchamber | Optional developer workspace / web/PWA/Desktop UI | ADAPT/EVALUATE; not adopted |
| DeepSeek Harness | https://github.com/deepseek-ai/deepseek-harness | Experimental agent runtime | LAB-ONLY; not qualified |
| CUA Driver MCP | https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/experimental/computer-use-cua-driver-mcp | Dedicated isolated computer-use adapter | Not qualified; separate disposable desktop required |
| CUA MCP profile | https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/experimental/cua-mcp | MCP computer-use tool profile | Not qualified; unattended allow-consent rejected |
| llama-modchip | https://github.com/synchopate/llama-modchip | Optional local inference backend | ADAPT/EVALUATE; not qualified |
| Stanford OpenJarvis | https://github.com/open-jarvis/OpenJarvis | Local AI/agent runtime and evaluation substrate | ADAPT/EVALUATE; not qualified |
| isair/Jarvis | https://github.com/isair/jarvis | Local desktop voice/text assistant reference | Research only; commercial use blocked pending separate license |

The user previously typed “DeepSeek-Ilama-modchip”; existing research treated that as two separate repositories (DeepSeek Harness and llama-modchip), not a confirmed third project. Ask for an exact URL only if the user later clarifies a different repository.

## Proposed scheme recorded

The proposal is an additive candidate plane behind the existing Cloud Pool policy-controlled adapter boundary:

- Cloud Development Pool remains the only authority for admission, executor identity, capability grants, routing, quotas, leases, revocation, audit and dispatch.
- Existing Claude Code, Gemini and other approved routes remain unchanged.
- OpenChamber is a possible optional UI/workspace.
- DeepSeek Harness is an experimental runtime; CUA Driver/MCP, if ever approved, uses a separate disposable desktop/VM.
- llama-modchip is a possible local inference backend on approved owner-controlled compute.
- Stanford OpenJarvis is a possible separate local AI/agent runtime and evaluation framework.
- isair/Jarvis is a possible future desktop voice UI reference, not a control plane or executor.

This is a conceptual topology only. No compatibility between candidates is assumed. MCP is not authorization or sandboxing.

## Non-negotiable controls

1. ADDITIVE ONLY: preserve all existing executor IDs, profiles, routes, quotas, credentials, secrets scopes, permissions, workspaces, runtime paths and historical task IDs.
2. Each candidate requires its own immutable identity, capabilities, quota/budget, workspace, network boundary, credentials scope, audit and revocation.
3. No candidate can self-register, self-authorize, read existing secrets or bypass Cloud Pool policy.
4. Rollback removes only newly added candidate resources.
5. No install, execution, model download, MCP connection, provider call, dispatch, hosted resource, deployment or production action is authorized by this record.
6. Candidate adoption requires pinned upstream revisions, license review, supply-chain review, threat model, compatibility tests, isolation proof and independent qualification.
7. isair/Jarvis checked-in license is non-commercial by default; written commercial license and review are required before commercial adoption.
8. Contour A remains first priority. Contour B remains deferred until formal Contour A ACCEPTED.

## Governance snapshot carried into this record

Issue #140 was observed OPEN on 2026-11-19 and restricts work to local no-secret qualification; hosted D1, secrets/variables inspection, provider calls, dispatch, deployment, merge and production actions remain prohibited. Always refresh the live issue before work.

PR #147 was observed OPEN / DRAFT / UNMERGED, documentation-only and stacked on PR #146. Its branch is a working documentation branch, not canonical default branch. Refresh head/base/CI and branch protection before relying on the snapshot.

## Files created/updated for continuity

- Master prompt: `docs/prompts/MASTER-PROMPT-CONTINUE-CLOUD-POOL-AND-RESEARCH-REGISTER-2026-11-19.md`
- Candidate review: `docs/reports/2026-11-19-additive-openchamber-deepseek-cua-llama-modchip-evaluation.md`
- Candidate review: `docs/reports/2026-11-19-openjarvis-isair-jarvis-additive-evaluation.md`
- Checkpoint: `docs/checkpoints/2026-11-19-additive-runtime-candidates-checkpoint.md`
- Context Window: `docs/context/GITHUB-CONTEXT-WINDOW.md`

## Current chat work record

This conversation requested a durable GitHub record of all candidate projects and schemes and a continuation prompt for a new chat. The work is documentation-only. The new master prompt instructs the next chat to restore live GitHub state, read the project records, refresh governance/CI, and continue one bounded Contour A engineering pass.

No tests were run for this documentation-only pass. No code or runtime changed. No secrets were accessed. No providers were called. No agent dispatch, deployment, merge or hosted D1 operation occurred.

**Acceptance status:** Contour A NOT ACCEPTED. Contour B DEFERRED.
