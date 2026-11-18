# /next — Claude Code provenance and hosted-use compliance gate — 2026-11-18

**Disposition:** CURRENT MOCK QUALIFICATION REMAINS VALID; INSTALLER INTEGRITY NOT QUALIFIED; HOSTED CLAUDE CODE USE BLOCKED PENDING VENDOR TERMS / ACCOUNT MODEL REVIEW  
**Contour:** A only  
**Default branch:** `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
**Reviewed candidate:** PR #116, head `a956129f6cf426c887e755c563740fe1813161d9` (OPEN / DRAFT / UNMERGED).  
**Docs branch starting head:** `023a6d5ed16585148cb5b388902fec51587407ca` (PR #120 OPEN / DRAFT / UNMERGED).

## Scope and method

One bounded pass reviewed the latest PR #116 runner workflow, environment boundary and tests; refreshed exact-head CI; and checked current first-party Anthropic installation, integrity, authentication and legal documentation. No secrets were read, no real Claude session or provider call was started, no merge/deployment/dispatch was performed.

## Repository and CI state

- Default branch is `Основной`, HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 current head: `a956129f6cf426c887e755c563740fe1813161d9`; OPEN / DRAFT / UNMERGED.
- Exact-head check run [44257088134](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134) — `No-secret install and resource proof`, SUCCESS.
- Exact-head check run [44257088139](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088139) — `Validate workflow syntax and security invariants`, SUCCESS.
- Both check runs report the exact PR head SHA. PR #116 review submissions currently consist of three owner-authored COMMENTED reviews, not an independent approval.
- Active ruleset #26550182 still requires a PR and review-thread resolution, but has 0 required approving reviews and 0 required checks. Independent A3 review remains a project requirement.
- PR #125 remains OPEN / DRAFT / UNMERGED at `2ca95775982c711a289881e94eb664d5fe14ed5a`; PR #120 remains OPEN / DRAFT / UNMERGED. PR #124 is OPEN / DRAFT and its base is behind the latest docs candidate; do not merge without a deliberate base update and revalidation.
- Issue #96 remains OPEN. Gemini controller is absent from default branch; Gemini dispatch NOT RUN. No alternate dispatch path used.

## Finding 1 — the current Claude installer path is not integrity-pinned

The current PR #116 workflow:
1. downloads `https://claude.ai/install.sh` at runtime;
2. executes the downloaded script;
3. passes exact version `2.1.325`;
4. checks that the installed CLI reports `2.1.325`.

This pins the requested version string, but it does **not** pin or authenticate the installer script bytes, and the workflow does not verify the installed binary against a signed release manifest. The script is executed before any post-install verification. Therefore installer provenance/integrity is **NOT VERIFIED** and must not be described as qualified.

First-party Anthropic setup documentation supports exact-version native installs and separately documents a stronger binary-integrity process:
- release `manifest.json` contains platform SHA-256 values;
- `manifest.json.sig` is verified using Anthropic's published GPG signing key;
- the imported key fingerprint must equal `31DDDE24DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE`;
- the installed native binary can be compared to the manifest checksum;
- signed manifest verification is available from release `2.1.89` onward.

Source: [Anthropic Claude Code advanced setup — Binary integrity and code signing](https://code.claude.com/docs/en/setup#binary-integrity-and-code-signing). The current workflow version `2.1.325` is above the documented signed-manifest floor, but no verification is currently performed.

**Next implementation choice:** prefer Anthropic's signed apt repository on the Ubuntu runner with pinned repository key fingerprint and explicit package version, or directly retrieve the versioned release manifest + signature + Linux x64 binary and verify signature and SHA-256 before executing the binary. Do not merely add a checksum of the mutable install script unless the expected digest has an independently authenticated source. If continuing with the native installer, explicitly record that the installer script itself remains unverified even after the installed binary passes a signed-manifest check.

## Finding 2 — intended hosted-pool use requires a vendor terms and identity gate

Anthropic's first-party legal/compliance page says that preinstalling or running Claude Code in a product/service, including hosted sandboxes or other agent infrastructure, requires agreeing to Anthropic's Commercial Terms of Service and complying with its conditions. It says each end user must authenticate with their own Anthropic API key, Claude subscription credentials, or supported third-party provider credential; the platform may not pay for, resell, or intermediate Claude usage on end users' behalf. It also says Claude.ai login credentials/session tokens must not be collected, stored, or intermediated by third-party developers. Source: [Anthropic Claude Code — Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance#can-customers-offer-claude-code-in-their-products).

The official setup page additionally says the free claude.ai plan does not include Claude Code access; eligible paths include paid Claude plans or Console accounts, with supported third-party providers also listed. Source: [Anthropic Claude Code — Advanced setup, Authenticate](https://code.claude.com/docs/en/setup#authenticate).

This is a material constraint for a multi-user hosted Cloud Pool and the project's free-only/no-paid-fallback objective. The previous assumption that a shared hosted executor can simply use a free Claude.ai plan is not supported by the current first-party documentation. No live Claude Code session, subscription login, API credential, session token, or proxy route may be used until the project has a documented vendor-compliant account/contract model. A user-owned credential must never be collected or shared across tenants. This is a compliance gate, not legal advice; obtain appropriate vendor/legal confirmation for the intended operating model.

## Finding 3 — the current PR #116 proof remains narrowly valid

The two latest exact-head CI checks remain SUCCESS. They qualify only:
- no-secret installation/runtime resource profile;
- FCC loopback-only startup/readiness/shutdown;
- synthetic mock bridge and environment allowlist behavior;
- pinned FCC/ECC source commits and license capture.

They do **not** qualify:
- authenticated real Claude task execution;
- a free Claude Code entitlement;
- any hosted multi-tenant use permission;
- installer script or installed binary cryptographic integrity;
- provider account identity, quota, or no-fallback enforcement;
- host-level egress isolation;
- production executor deployment.

The child-process environment allowlist is not a host firewall. Keep FCC loopback-only and dispatch disabled.

## Decisions

- PR #116 no-secret mock qualification: **VERIFIED within its stated synthetic scope**.
- Claude installer script integrity: **NOT VERIFIED**.
- Installed binary signed-manifest verification: **NOT IMPLEMENTED**.
- Hosted Claude Code commercial-use permission and compliant end-user identity model: **BLOCKED / NOT VERIFIED**.
- Free claude.ai plan as a Claude Code execution entitlement: **NOT AVAILABLE according to current official docs**.
- No live session, provider call, account login, secret read, merge, deployment or dispatch occurred.
- Keep `POOL_DISPATCH_ENABLED=false`.
- Contour A: **BLOCKED / NOT ACCEPTED**. Contour B: **DEFERRED**.

## Next bounded step

Do not make a live Claude call. First implement a reproducible binary provenance proof for the pinned version using Anthropic's signed manifest and key fingerprint (or signed apt repository), then separately document an approved vendor-compliant account/contract route. If that route cannot meet the free-only/no-intermediation constraints, remove Claude Code from the eligible free executor set rather than weakening the constraints. Continue qualifying another independently permitted free route only after A3 review, identity/quota separation and egress controls.
