# Engineering Workspace Integration Record — 2026-11-17

**Status:** PROPOSED / NOT DEPLOYED / NOT QUALIFIED. **Scope:** Contour A only.

## Decision
The owner-requested target is one Jarvis Control Plane, one persistent Engineering Workspace, and an isolated Agent Execution Plane. This is a proposal to integrate into Cloud Pool, not a second Jarvis and not MediaHub OS product development. It does not authorize installation or deployment. The current Contour A baseline and A0/Gemini contracts remain fail-closed until separately qualified.

## Reconciliation
The earlier 2026-11-17 owner freeze chose GitHub-hosted ephemeral runners and GitHub-native Jarvis primitives as the first Contour A path, with no persistent physical host or external always-on service required. This newer instruction requests a persistent workspace, server #3, VS Code Remote SSH, browser IDE and Cloudflare Zero Trust. Record it as a new target proposal; do not silently rewrite accepted contracts or claim the new components exist. Contour A is NOT ACCEPTED; Contour B remains deferred.

## Live inventory — 2026-11-17
- Default branch Основной: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845.
- PR #113 docs branch head: 052011b031907ec834c6311a28c570e0080118d0; OPEN/DRAFT/UNMERGED.
- PR #116 Claude Code + ECC + FCC install proof head: f7d490a63aefa007ff8d74e7de961349f54a27e9; exact-head runner and contract CI both SUCCESS. This is an install/resource smoke only, not a qualified operational route.
- PR #6 Jarvis static shell, PR #25 Hono prototype, PR #30 synthetic OAuth proof remain OPEN/DRAFT/UNMERGED. None proves deployed/authenticated Jarvis.
- SentinelX: 0 active hosts; Free plan allows 1 active host. Mac mini host_5f7264034bdf0b51 is offline. mh-dev-01 and mh-dev-02 are disabled by user. No server #3 appears in the active inventory. No saved compute integrations.
- Desktop Commander: all three listed devices offline.
- Cloudflare: account connection available, but no zones and no tunnels were returned; Access applications endpoint reports Access is not enabled. No configuration changed.
- No persistent workspace, shared storage, backup/restore evidence or production Jarvis deployment is verified.
- No secret values were read.

## Component decision matrix
| Component | Decision | Reason / constraint |
|---|---|---|
| Official VS Code Desktop + Remote SSH | Preferred desktop client, conditional | Official VS Code Server installs on the remote host; needs qualified OpenSSH host, SSH host-key verification, resources and persistent storage. Microsoft recommends 2 CPU / 2 GB RAM. |
| Coder code-server | Preferred browser IDE candidate, conditional | MIT, Open VSX default; keep built-in authentication and loopback binding. Microsoft Marketplace must not be substituted. Closed-source/remote extensions may be unavailable; Claude Code/Copilot compatibility unverified. |
| Coder Workspace Platform | Defer | Self-hosted Terraform/provisioner control plane and compute required; excessive for one initial workspace until lifecycle/multi-workspace needs justify it. |
| VS Code Remote Tunnels | Alternative transport | Uses Microsoft dev-tunnels; remote VS Code must remain running; Microsoft documents one client per server instance. Does not provide a separate code-server UI. |
| Cloudflare Tunnel + Access | Required by new target, currently BLOCKED | No zone/tunnel and Access disabled. Must use origin JWT validation plus app-level authorization; no public SSH port. |
| Claude Code | Server #3 NOT RUN | Existing GitHub-hosted installation smoke is separate; no confirmed/authorized third host, FCC free route or quota proof for that host. |
| Gemini | Existing controller only | Keep .github/workflows/gemini-batch-dispatch-controller.yml as the only route; never run Gemini on server #3 or directly from IDE/Claude. |
| GitHub Copilot | Optional | Free plan is limited; exact entitlement and remaining allowance unverified. No paid/metered fallback and no shared quota with Claude/Gemini. |

## Target topology (PROPOSED)
~~~text
Mobile/Desktop browser -> Cloudflare Access -> Tunnel -> Jarvis / code-server (loopback)
Desktop VS Code -> SSH via client-side cloudflared -> same persistent workspace
Jarvis -> existing A0/GitHub contracts -> isolated executor jobs
Claude Code: server #3 only after qualification; Gemini: approved controller only; Copilot: optional desktop tool
~~~

Browser IDE and desktop VS Code must use one authoritative filesystem, not divergent copies. Each task gets its own branch and Git worktree/attempt directory. Never allow two agents to write to one worktree.

## Security and data boundaries
- Jarvis remains the only user-facing control plane; no second UI.
- Cloudflare Access is perimeter authentication, not authorization. Validate JWT signature, issuer, audience, expiry and subject; apply internal capabilities/policy.
- Preserve code-server authentication, loopback binding, SSH host-key checks and client-side private key custody.
- GitHub is source of truth for accepted code; workspace holds active files; task/session metadata, audit logs and secret material remain separate.
- No secrets in browser, URLs, workspace settings, task envelopes, logs or artifacts. No Docker socket or root privileges by default.
- Reuse existing A0 task contracts; do not create a parallel dispatcher or state machine.

## Gates and order
1. Finish Issue #117 FCC loopback runtime/lifecycle proof and A0 admission/lease/worker/evidence qualification first.
2. Qualify exact server #3 host ID, allowlist, capabilities, OS, CPU/RAM/disk, persistence, network and security. Current BLOCKED: no active hosts.
3. Qualify approved domain/zone, Cloudflare Access, Tunnel, IdP, policies, WebSockets, origin JWT validation and free-cost ceiling. Current BLOCKED: no zones/tunnels; Access disabled.
4. Approve workspace ADR and persistence/backup/restore design before install.
5. Only then qualify code-server + VS Code Remote SSH, shared storage, worktree isolation and mobile/desktop access.
6. Claude Code on server #3 only after host and free FCC route qualification. No Anthropic API, paid fallback or Gemini on that host.
7. Integrate links/status into existing Jarvis; optional Copilot only after free entitlement and spend controls are checked.
8. Independent acceptance of desktop/mobile, shared filesystem, Git, SSH, WebSockets, auth, isolation, quotas, backup/restore and secret non-disclosure.

## Sources
- VS Code Remote SSH: https://code.visualstudio.com/docs/remote/ssh
- VS Code Server: https://code.visualstudio.com/docs/remote/vscode-server
- VS Code Remote Tunnels: https://code.visualstudio.com/docs/remote/tunnels
- code-server: https://github.com/coder/code-server and https://coder.com/docs/code-server
- Coder: https://github.com/coder/coder and https://coder.com/docs
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/access-controls/
- Cloudflare client-side cloudflared: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/non-http/cloudflared-authentication/
- Claude Code: https://code.claude.com/docs/en/getting-started and https://code.claude.com/docs/en/vs-code
- Copilot plans: https://docs.github.com/en/copilot/get-started/plans

**Final status:** PROPOSED / BLOCKED / NOT DEPLOYED. Historical IDs and existing contracts are preserved.