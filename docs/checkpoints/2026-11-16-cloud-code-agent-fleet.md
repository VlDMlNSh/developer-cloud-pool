# Checkpoint — 2026-11-16 Cloud Code agent fleet architecture

- Repository: VlDMlNSh/developer-cloud-pool
- Branch: docs/cross-chat-continuation-2026-11-06 (documentation branch; not merged to default)
- ADR: [Dual Cloud Code execution-plane ADR](../architecture/2026-11-16-cloud-code-dual-execution-plane-adr.md)
- Report: [Agent fleet architecture pass](../reports/2026-11-16-cloud-code-agent-fleet-architecture-pass.md)
- Unified context: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)

## Target model
One Jarvis control plane; two isolated leads: Development Cloud Code and Media Cloud Code. Each lead may coordinate specialist subagents and external workers. Role count is elastic and bounded by qualified concurrency, account quotas, runner capacity and budgets.

## Development fleet
Research, architecture, bounded implementation, test/CI, security/dependency audit, documentation/evidence. Code writers use isolated worktrees/branches; integration and final verification are separate responsibilities.

## Media fleet
Script/storyboard, asset continuity, generation workers, render/transcode, quality and packaging. Actual generation occurs in qualified media models/tools/GPU workers, not in Claude Code itself.

## Provider and product boundaries
Claude Code subagents are a candidate for specialist coding tasks. Other model vendors require separate qualified adapters and account/quota identities. FCC and ECC are not selected. No secret values in task envelopes; no paid fallback.

## Status
Architecture documented / proposed / not implemented / not qualified. Contour A remains NOT ACCEPTED and is the only active engineering priority. No runtime deployment, model dispatch, GPU provisioning or executable tests in this pass.

## Next
Resolve Contour A's live admission, executor, routing, web-console and governance evidence. Only after formal ACCEPTED begin a minimal Development Cloud Code pilot; Media Cloud Code requires a separate later approval.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
