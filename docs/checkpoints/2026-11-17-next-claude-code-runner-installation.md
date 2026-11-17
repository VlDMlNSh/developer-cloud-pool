# Cloud Pool /next checkpoint — first Claude Code runner qualification

**Date:** 2026-11-17  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Default branch:** Основной  
**Default HEAD:** 35208f0ef28f0ac031a7acdf35fc90ccc9b16845  
**Current phase:** Contour A — first CODE executor installation qualification  
**Status:** RUNNING / NOT YET VERIFIED

## Owner baseline

The owner-approved target architecture is recorded in [CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md). The ordered implementation plan is [CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md).

First priority is one GitHub-hosted ephemeral Claude Code + ECC + FCC + verified free API route profile. No Anthropic API auth. Second CODE is quota-gated. MEDIA is deferred, local-model-only, and must not receive API keys. Mac mini, remote video server, Codex, Gemini and YouTube are not initial launch dependencies. No physical compute for initial Contour A.

## GitHub state revalidated

- Default branch Основной HEAD 35208f0ef28f0ac031a7acdf35fc90ccc9b16845.
- Documentation branch docs/next-2026-11-16-current-state-refresh HEAD ce90cf7a1394ec1bc45ac5951b4712177333fce9.
- Owner architecture decision record blob d9d95c34a73120b3ce36ec60b20f5e783889bc7e.
- Context Window blob before this checkpoint update 50aecfa9f6946986074be99ee35903caa38e45ee.
- PR #113: OPEN / DRAFT / UNMERGED; documentation changes remain on its branch.
- PR #116: OPEN / DRAFT / UNMERGED; first runner qualification branch feat/claude-code-fcc-runner-qualification-2026-11-17, head c5c14f6a11782e5787a38b1edd5e7983f15bf2e2.
- PR #111: OPEN / DRAFT; D1 lease/attempt proof, 37/37 local Workers-runtime tests documented in PR body; not integrated/hosted.
- PR #112: OPEN / DRAFT; read-only owner-event controller proof, 21/21 tests documented; no durable admission.
- PR #114: OPEN / DRAFT; D1 atomic admission proof, 12/12 local Workers-runtime tests documented; no trusted production event provenance/hosted D1.
- Active ruleset #26550182: PR required, zero required approvals, no required status contexts, bypass actors empty. Independent review is still required by project acceptance policy.
- Current POOL_DISPATCH_ENABLED value was not read in this pass: NOT VERIFIED. All production dispatch remains fail-closed.

## First runner qualification execution

- Workflow: .github/workflows/claude-code-fcc-runner-qualification.yml.
- Workflow blob SHA: e88cc9a95975f0876df6887b815636eda4988d11.
- Run: [44066723324](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44066723324).
- Exact head: c5c14f6a11782e5787a38b1edd5e7983f15bf2e2.
- Runner: ubuntu-24.04; workflow permission contents: read; no Secret references in workflow; no provider calls.
- At last job read (job 133982177116): checkout SUCCESS; runner baseline SUCCESS; Claude Code CLI install SUCCESS; uv install SUCCESS; FCC install RUNNING; ECC install and final verification PENDING.
- No workflow artifact was listed at last read. Job logs were not yet available while the job was running.
- Do not mark installation qualified until exact-head run concludes successfully, full logs are inspected, evidence artifact/digests are verified, and independent review is complete.

## Upstream qualification notes

- FCC pinned source commit eb92e4c07af0d6ad8881dce1cd958c3d072c27c5; exact Python requirement ==3.14.10; license AGPL-3.0-only.
- FCC Settings.model_fallbacks maps to MODEL_FALLBACKS and defaults to None; fallback models/credential key numbers are explicitly configured.
- FCC PROVIDER_MAX_ATTEMPTS defaults to 5. Before live provider use, configure a bounded retry policy and test quota implications; do not assume one failed request equals one provider attempt.
- ECC pinned source commit e413166c50e85fb205b988b5e78874b5a88ea4d2; MIT. Only selected skills are copied in the proof: search-first, tdd-workflow, security-review.
- Claude Code npm package version 2.1.325 is only the current pinned compatibility probe. Confirm the current official install method before production.
- No secrets were read, no provider call was made, no FCC server was started, no agent task executed, no dispatch/deployment/merge occurred.

## Next concrete step

1. Wait for run #44066723324 to complete; retrieve job logs and final resource measurements.
2. If installation succeeds, improve the proof to emit a bounded provenance/resource artifact and verify cleanup; run exact-head CI again.
3. If installation fails or exceeds runner resources, isolate the precise failure and adjust only the installation proof, retaining immutable upstream pins where compatible.
4. Obtain independent review of PR #116; keep it Draft until all evidence is available.
5. Then move to Phase 2: FCC configuration policy and one explicit free-route contract, still without exposing secrets or enabling production dispatch.
6. Integrate the existing D1/event/lease proofs only through a clean-base, tested, reviewed path. Keep dispatch disabled.

## Acceptance status

- First CODE profile installation: RUNNING / NOT VERIFIED.
- FCC free API route: NOT RUN.
- Secret identity and quota mapping: NOT VERIFIED; values not read.
- Pool A0 durable production admission: NOT INTEGRATED.
- Jarvis deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md).  
Canonical repository: https://github.com/VlDMlNSh/developer-cloud-pool  
Separate MediaHub OS map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Documentation reconciliation — 2026-11-17

The implementation baseline is now linked across:
- Owner architecture blob: `d0019528b3c233e3f450909b1ab5752d041d6f79`.
- Implementation roadmap blob: `5c2158e8189f46a9d8286a6729152718b7b3be37`.
- Context Window blob: `a40f49e0be871d27261901926cc14c2db27ff3cd`.
- Master continuation prompt blob: `03a7404ce403ad7d44c7d66832d9655a599d2f8c`.
- All are on documentation PR #113 branch only; default branch is unchanged.

Controlling issue amendments published:
- #1: active ruleset revalidated; current dispatch variable NOT VERIFIED.
- #22: GitHub-only Jarvis hosting boundary.
- #26: first-profile-only provider qualification scope.
- #94 and #96: Gemini four-child wave is optional, not a launch/per-/next requirement.

These amendments supersede conflicting historical planning text; old candidate PRs remain historical, open and unmerged until individually reconciled. Do not bulk merge or cherry-pick them.
