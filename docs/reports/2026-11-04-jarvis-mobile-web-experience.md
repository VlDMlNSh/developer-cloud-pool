# Engineering report — 2026-11-04: Jarvis mobile web experience architecture

## Immutable references
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch Основной HEAD: 4597617db0de7cc698cce936a540594ee3d25bf2
- Documentation branch: docs/continuation-context-2026-11-04
- Architecture commit: aecfcf2e41b72b29034db26d3cc28ffb69befb11
- Architecture file blob SHA: d7ece420f7185fa7f2c821523e3738472cfba03b
- Default branch and runtime configuration unchanged.

## Product decision
Jarvis is intended to be remotely accessible from a phone through a responsive HTTPS web application. First target: mobile-first PWA compatible with iOS Safari and Android browsers. Native mobile apps are not a prerequisite. The PWA is an experience surface, not policy authority, credential store, scheduler or execution host.

## Architecture
Phone browser/PWA -> HTTPS authentication edge -> Jarvis Experience API -> Pool Bridge -> GitHub control plane -> ephemeral GitHub-hosted Runner -> evidence/artifact store -> authenticated status updates.

The frontend must never hold privileged GitHub/provider credentials, call workflow dispatch directly, connect to a runner, or expose CDP. Task intake and privileged actions pass through Pool Bridge policy.

The mobile IA covers Chat, Tasks, Agents, Cloud Pool, Browser, Approvals, Audit and Settings. Security design covers OIDC authorization-code + PKCE, secure cookies, CSRF, short sessions, MFA/passkeys where supported, revocation, server-side authorization, rate limits, immutable task envelopes, approvals bound to envelope digest, authenticated SSE and short-lived artifact links.

Delivery sequence: define API/identity/threat model; read-only responsive UI; authenticated task intake; approval/cancellation; live status and artifact access; independent security/accessibility testing; HTTPS deployment only after operational gates.

## Live state and gates
- Ruleset 26550182: ACTIVE; exact selector refs/heads/Основной; PR required; 0 approvals; review-thread resolution required; no bypass actors.
- Issue #1 OPEN; Issue #5 OPEN.
- PR #3 OPEN/unmerged. Branch/check-run evidence identifies head 7aa5b27b6e826918eeaa6397afe0378d14359022; exact-head run 41881360241/job 126754359530 SUCCESS; reviews empty. PR body contains conflicting stale head text 9a21c52afae02ac2b446d4ac1b5ae33fbbdad6df; confirm live metadata before integration.
- PR #4 OPEN/unmerged; head ab43af86b63a731202fa0f8fa6f27f009b0d4aac; exact-head checks 0; NOT VERIFIED.
- POOL_DISPATCH_ENABLED: prior evidence says false, but current direct SentinelX GitHub CLI read was blocked by tool safety layer; current read NOT VERIFIED. No mutation attempted.
- SentinelX host host_5f7264034bdf0b51: ping PASS, capabilities summary PASS; agent 0.23.30; Free plan 1 active/0 available.
- New architecture document read-back VERIFIED. Its commit has 0 check-runs and combined status pending with zero contexts: CI NOT VERIFIED.
- PWA implementation/deployment/security qualification NOT DONE.
- Browser runtime, Resource Probe, DSH, Worker and model calls NOT RUN.

## Safety decision
Do not deploy a public PWA or expose task controls before authentication, server-side authorization, Pool Bridge policy, CSRF/session protection, artifact authorization and independent security review. Do not connect the phone browser directly to GitHub Actions or any runner. Keep dispatch disabled.

## Next bounded step
Update the project context and checkpoint with this architecture, then design a read-only responsive status shell using non-privileged data. Keep documentation branch distinct from default branch.

## Links
- [Mobile web architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/continuation-context-2026-11-04/docs/architecture/JARVIS-MOBILE-WEB-EXPERIENCE.md)
- [Canonical default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [Documentation branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/docs/continuation-context-2026-11-04)
- [PR #3](https://github.com/VlDMlNSh/developer-cloud-pool/pull/3)
- [PR #4](https://github.com/VlDMlNSh/developer-cloud-pool/pull/4)
- [Issue #5](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
