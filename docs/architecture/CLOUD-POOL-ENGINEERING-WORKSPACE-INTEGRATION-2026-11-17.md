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

## CURRENT OWNER /next OPERATING UPDATE — FOUR GEMINI AGENTS — 2026-11-17

The latest owner instruction now requests **four isolated Gemini task assignments for every ChatGPT /next**, supplementary to the primary Cloud Pool engineering pass. This supersedes the earlier 2026-11-17 scope note that treated Gemini as optional per /next. It does not waive any controller, admission, quota, security or governance gate.

Fixed roles: (1) researcher, (2) implementation designer, (3) adversarial tester, (4) security auditor. Each child must receive only its own unique bounded task and separately attributed account slot. No cross-account retry, key cycling, paid fallback, tool execution, repository writes or privilege escalation.

**Current dispatch disposition: NOT RUN.** Default branch `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` has no `.github/workflows/gemini-batch-dispatch-controller.yml`; current default workflow inventory is only DSH evaluation, Pool Contract Validation, Pool Supervisor, Pool Worker and Resource Probe. The four-account helper candidate PR #107 is OPEN/DRAFT/UNMERGED and its base `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b` is two commits behind default; it contains an in-process four-client helper/fake-client tests, not an Actions dispatcher. PR #109 is OPEN/DRAFT/UNMERGED on current default base and its exact-head fake-client suite passed 11/11, but does not add workflow dispatch, durable leases/fencing/recovery, production caller authorization or free-route proof. PR #112 is read-only event validation; PR #114 is atomic admission proof with `dispatch:false` and `executionAuthorized:false`. PR #107/#109 have zero formal reviews. The MediaHub three-agent bridge is a separate control plane and is not a substitute for a four-child Cloud Pool controller.

Current Pool Contract Validation run `44075999524` explicitly read back `POOL_DISPATCH_ENABLED=false`. Keep it false. Four secret slots do not prove four distinct Google accounts or quota domains; never read secret values. The latest owner request is recorded on Cloud Pool Issues #94 and #96 in comments `6947028166` and `6947031522`.

**FCC runtime lifecycle pass:** pinned FCC source `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` confirms `fcc-server` entrypoint, `HOST` default `0.0.0.0`, `PORT` default `8082`, browser auto-open default true, and local-only `GET /admin/api/status` guarded by loopback client/Host/Origin. PR #116 workflow now explicitly sets HOST=127.0.0.1, FCC_OPEN_BROWSER=false, PROVIDER_MAX_ATTEMPTS=1 and uses only a read-only loopback GET. No provider credentials/calls or completion endpoint. First run #44075802559 failed due an escaped runner.temp expression; second #44075999516 reached HTTP 200 but SIGTERM exited 143. Both defects were corrected (runner path and SIGINT graceful shutdown). Latest PR #116 head `596c03e19b4662f69a9b40791299f55afb9a928e`; Pool Contract Validation run `44076256865` SUCCESS; runtime run `44076256742` RUNNING at this update. Do not mark lifecycle proof successful until its job, listener, shutdown and artifact are rechecked.

Next: verify exact-head run `44076256742`; correct any remaining issue with evidence; then finish Issue #117. Four-agent live dispatch remains NOT RUN until the Cloud Pool-native controller gates are qualified. Contour A remains NOT ACCEPTED; Contour B deferred.


## FINAL /next RECONCILIATION — 2026-11-17

- Full dated report: [2026-11-17 FCC loopback runtime and four-Gemini gate](../reports/2026-11-17-next-pass-fcc-loopback-and-four-gemini-gate.md), report commit `d8e62ee93cb5861c5a37550b33cedd272004b58a`.
- PR #116 final head `596c03e19b4662f69a9b40791299f55afb9a928e`; workflow blob `3786d3c23d434f9af39c40203b0a53f888c2b12a`.
- Runner lifecycle run [44076256742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742): SUCCESS; job `134014928455`. Readiness GET returned 200, exact loopback listener asserted, SIGINT shutdown exit 0 and listener removal asserted by the passing job.
- Artifact [14325645831](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742/artifacts/14325645831), 12,548 bytes, GitHub SHA-256 `6eced8c6b355f89a39c897a2ad5daab4e93b4055d73067ff7ceef7ac0bd1c9eb`.
- Pool Contract Validation [44076256865](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256865): SUCCESS; job `134014929136`; log read-back `POOL_DISPATCH_ENABLED=false` and `POOL_CONTRACT_VALIDATION=PASS`.
- Two earlier failed runtime attempts (`44075802559`, `44075999516`) are retained historically and superseded by the successful final run.
- Current owner instruction: four Gemini assignments requested for every `/next`; comments are recorded on Issue #94 (#6947028166) and Issue #96 (#6947031522). Actual Gemini dispatch remains NOT RUN: no default-branch Cloud Pool Gemini dispatch workflow, PR #107 candidate is based two commits behind default, PR #109 is fake-client tests only, PR #112 read-only, PR #114 dispatch:false, and no independent review/account quota proof. Do not use the MediaHub three-agent bridge as a substitute. Keep `POOL_DISPATCH_ENABLED=false`.
- PR #116 and PR #113 remain OPEN / DRAFT / UNMERGED; PR #116 formal reviews 0 / threads 0. Contour A NOT ACCEPTED; Contour B deferred.
- Next bounded step: synthetic FCC-to-Claude CLI bridge test with mock provider/no credentials, then independent review of PR #116. Gemini controller qualification continues behind Issues #94/#96.
