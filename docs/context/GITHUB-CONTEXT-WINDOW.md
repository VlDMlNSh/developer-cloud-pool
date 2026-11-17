# GITHUB CONTEXT WINDOW — DEVELOPER CLOUD POOL

## CURRENT RECONCILED SNAPSHOT — 2026-11-17 19:04 Europe/Vilnius

**Latest daily report:** [2026-11-17-1904-daily-audit.md](../reports/2026-11-17-1904-daily-audit.md)  
**Latest continuation checkpoint:** [2026-11-17-runner-policy-audit.md](../checkpoints/2026-11-17-runner-policy-audit.md)

This is a recovery snapshot on a working documentation branch. Re-read live GitHub refs before every engineering pass. It is not default-branch state and is not accepted project architecture.

## Immutable repository baseline

- Repository: `VlDMlNSh/developer-cloud-pool`; public; not archived.
- Default branch: `Основной`.
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- GitHub search returned 11 open Issues and 88 open PRs.
- Working docs branch: `docs/next-2026-11-17-runner-policy-audit`, created from PR #124 head `7b18b7c857ae7de9d7f26b8394e3a4a93e913d77`; no PR; not canonical.
- Previous docs PR #113 is CLOSED / UNMERGED. PR #120 and #124 are the current open documentation integration stack.

## Current integration PRs

- PR #120: OPEN / DRAFT / UNMERGED; head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; 98 ahead / 0 behind default; 48 files. Exact-head Architecture Documentation Validation [44094756333](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094756333) and Pool Contract Validation [44094756250](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094756250) SUCCESS. Formal reviews 0.
- PR #124: OPEN / DRAFT / UNMERGED; head `7b18b7c857ae7de9d7f26b8394e3a4a93e913d77`; base exactly PR #120 head; 54 ahead / 0 behind parent; mergeable=true. Exact-head runs 0; combined statuses empty; formal reviews 0. Its realization map/addendum/scorecard still contain stale PR/head/base references. Scorecard is a standard, not an independent score or review.
- PR #122/#123 are CLOSED as superseded.
- Do not merge documentation stacks without exact-head CI, independent review, provenance and effective governance.

## Priority Issues and PRs

- Issues #1 governance, #22 secure web console, #26 provider/account isolation, #94 optional Gemini controller, #96 owner-only /next admission, #115 first CODE runner and #118 persistent Workspace remain OPEN. Issue #117 FCC loopback lifecycle proof is CLOSED.
- Issue #22 owner boundary: initial experience GitHub-hosted only; no physical/self-hosted host or external always-on service as a launch dependency. Use static read-only/native GitHub surface if no secure server-side auth/API can be delivered with GitHub-native primitives.
- Issue #26 first profile only: Claude Code + ECC + FCC and one explicitly qualified free route. Second CODE deferred; MEDIA local-only; inventory slots are not qualified routes.
- PR #24/#25/#30/#31 remain OPEN / DRAFT / UNMERGED, 143 behind default, formal reviews 0. Exact-head runs remain historical SUCCESS: #24 42982847600/42982847694; #25 42228269689/42228269676/42228263346; #30 push run 42216422883; #31 42229917555. No current integration qualification.
- Path-segment branch exists, 38 ahead / 143 behind default, merge base `64d2636d4500127e635c214ccfb722c6b3fcda80`. Exact current branch tip SHA NOT VERIFIED; last known tip `dee17350864cb49e8c5dd41cf61859d77d3affca`; exact-tip CI NOT VERIFIED. Diff includes the old 19-file Jarvis stack; reconstruct only the minimal guard on a fresh default base.

## Admission and execution proofs

- PR #111 head `687196738782432797bf394f1342cb9df19f478f`: local D1 and contract runs 43881396386/43881396272 SUCCESS; per-task/attempt lease only.
- PR #112 head `c9a4c0ab2001f01a09632795283071c521e1c99d`: runs 43882090833/43882090867 SUCCESS, but event-admission job SKIPPED; no real webhook or durable admission.
- PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`: local D1 admission run 43935827714 and contract run 43935827741 SUCCESS. One transaction creates source-comment receipt, consumes a matching one-shot approval, creates logical task/task approval/outbox; exact replay is stable. All outcomes remain `dispatch:false` and `executionAuthorized:false`. Caller-supplied event, trustedDefaultHeadSha and `now` are not authenticated; no hosted D1, outbox delivery, worker identity, lease/fencing or recovery.
- PR #116 head `d93e75df74e7213f96dc3e2cb335a73dc6710e19`: runner run 44094382662 and contract run 44094382669 SUCCESS; artifact 14333840752, digest `sha256:96fb613956842b30015e659c662c799af363eb3bfbf8fa54179b5d51df3acafa`. Three review submissions are COMMENTED by repository owner, not independent approvals. No real Claude task or provider route.
- New source review residual: PR #116 `exec_allowlist.py` blob `f98ba421ec98e020b28fefb71083d65bd27213d4` passes through HOST/PORT/FCC_OPEN_BROWSER/PROVIDER_MAX_ATTEMPTS/PROVIDER_MAX_CONCURRENCY without semantic validation. Current workflow sets safe explicit values; production reuse needs profile-specific fixed values/validators and negative tests. No code change or local test in this pass.
- Official Claude installer bytes are not hash-pinned; runner-level egress enforcement remains NOT VERIFIED.

## Governance, dispatch and runtime

- Ruleset #26550182 active on `refs/heads/Основной`: PR required, deletion/non-fast-forward blocked, review-thread resolution required, 0 required approvals, no required status checks, no bypass actors. Classic branch-protection read returned 403: NOT VERIFIED.
- `POOL_DISPATCH_ENABLED=false` observed in PR #116 contract-run log at 2026-11-17 13:36:27Z only. Re-read before any future authorized execution.
- Default-head Supervisor scheduled run [44065644314](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44065644314) and issue run [44078065204](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44078065204) SUCCESS. No Pool Worker run appeared in the exact-default-head run listing. Supervisor heartbeat is verified for those runs; worker execution is NOT RUN / NOT VERIFIED.
- SentinelX: 0 connected hosts; Mac mini offline; mh-dev-01/02 disabled; no integrations; default host offline.
- Cloudflare read-only inventory: 0 Worker scripts, 0 D1 databases, 0 Tunnels; Access apps GET returns 403 “Access is not enabled.” No deployed Worker/D1 runtime found.
- Authenticated Jarvis, hosted transactional authority, production A0/D1, real free provider route/account/quota, durable recovery, persistent Workspace/restore and independent acceptance remain NOT VERIFIED / BLOCKED.

## Next bounded step

Harden the FCC child environment with profile-specific semantic constraints and negative tests; keep dispatch disabled. Then bind trusted webhook provenance and trusted time to the D1 admission path and compose durable repository-wide lease/fencing, attempt lifecycle, outbox delivery and recovery. Reconcile PR #124 stale references and obtain independent review before integration.

## Safety and disposition

No secret/token/API-key values were read. No provider/model calls, Gemini agents, DSH, Resource Probe, manual workflow invocation, dispatch, deployment, merge, variable/ruleset change or production mutation was performed. Contour A **BLOCKED / NOT ACCEPTED**. Contour B / MediaHub OS **DEFERRED**.
