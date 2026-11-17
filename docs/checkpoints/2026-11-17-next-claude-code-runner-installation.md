# Cloud Pool /next checkpoint — first Claude Code runner qualification

**Date:** 2026-11-17  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Default branch:** Основной  
**Default HEAD:** 35208f0ef28f0ac031a7acdf35fc90ccc9b16845  
**Current phase:** Contour A — first CODE executor installation qualification  
**Status:** SUCCEEDED — no-secret installation/resource smoke; operational profile NOT QUALIFIED

## Owner baseline

The owner-approved target architecture is recorded in [CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md). The ordered implementation plan is [CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md).

First priority is one GitHub-hosted ephemeral Claude Code + ECC + FCC + verified free API route profile. No Anthropic API auth. Second CODE is quota-gated. MEDIA is deferred, local-model-only, and must not receive API keys. Mac mini, remote video server, Codex, Gemini and YouTube are not initial launch dependencies. No physical compute for initial Contour A.

## GitHub state revalidated

- Default branch Основной HEAD 35208f0ef28f0ac031a7acdf35fc90ccc9b16845.
- Documentation branch docs/next-2026-11-16-current-state-refresh is active and unmerged; see latest Context Window/roadmap commit records.
- Owner architecture decision record blob d9d95c34a73120b3ce36ec60b20f5e783889bc7e.
- Context Window latest recorded blob before this checkpoint update: a40f49e0be871d27261901926cc14c2db27ff3cd.
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
- Superseded job 133982177116 on old head was CANCELLED after the workflow branch update. It did not qualify installation.
- No artifact was published by the cancelled attempt.
- Do not mark installation qualified until exact-head run concludes successfully, full logs are inspected, evidence artifact/digests are verified, and independent review is complete.

## Upstream qualification notes

- FCC pinned source commit eb92e4c07af0d6ad8881dce1cd958c3d072c27c5; exact Python requirement ==3.14.10; license AGPL-3.0-only.
- FCC Settings.model_fallbacks maps to MODEL_FALLBACKS and defaults to None; fallback models/credential key numbers are explicitly configured.
- FCC PROVIDER_MAX_ATTEMPTS defaults to 5. Before live provider use, configure a bounded retry policy and test quota implications; do not assume one failed request equals one provider attempt.
- ECC pinned source commit e413166c50e85fb205b988b5e78874b5a88ea4d2; MIT. Only selected skills are copied in the proof: search-first, tdd-workflow, security-review.
- Claude Code 2.1.325 is now installed in the proof through the official native installer with an explicit version pin; official docs support version-specific native installs.
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


## Latest /next implementation correction — 2026-11-17

**Current candidate**
- PR #116 latest head: `f7d490a63aefa007ff8d74e7de961349f54a27e9`.
- Workflow blob: `4264048f004404847ccada72e03c3165abebf321`.
- Exact-head qualification run: [44070499717](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717), COMPLETED / SUCCESS.
- Exact-head Pool Contract Validation: [44070499842](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499842), COMPLETED / SUCCESS.
- Old run [44066723324](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44066723324) was CANCELLED by PR concurrency after the workflow correction; no install success is claimed.

**Source-backed correction**
- FCC pinned source commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` has an entrypoint where `fcc-server --help` falls through to server startup; only `--version` exits before server composition. The old workflow could therefore hang by accidentally starting FCC. The corrected workflow uses `fcc-server --version` and `fcc-doctor --version` and never starts the server.
- FCC dependencies are now installed from the exact source checkout using the committed lockfile: `uv sync --frozen --no-dev --python 3.14.10`. The workflow verifies Git blob identities for `pyproject.toml` (`5eed9ea28040cf54ca87e8f48b8ef38c5b33d80b`) and `uv.lock` (`ee8490c29a36f8302f5c1f1d42b465f6271c10f2`).
- Claude Code uses the official native installer with version pin `2.1.325`; ECC remains pinned to `e413166c50e85fb205b988b5e78874b5a88ea4d2`, with only three selected skill markdown files.
- The corrected workflow uploads a bounded no-secret provenance/resource artifact using a pinned upload-artifact action. No provider API calls or GitHub Secret reads are part of this proof.

**Next**
1. Inspect exact-head run 44069573932 and contract run 44069573866.
2. If successful, inspect logs and download/verify the artifact digest. If failed, make one evidence-based correction only.
3. Obtain independent review; keep PR #116 Draft and unmerged.
4. Proceed to FCC fail-closed routing policy and one verified free-route contract only after install proof passes.

No production dispatch, provider call, secret read, deployment, merge, or Contour A acceptance occurred.

## Latest exact-head result — 2026-11-17

- Attempt on prior head `7dcd58f73a87156c614ebf543c756ece6715762a`: run [44069573932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069573932) FAILED at the native Claude Code install step. The log shows `DISABLE_UPDATES=1`, installer message “Updates are disabled by your administrator”, then `claude: command not found`. The workflow environment was corrected by removing `DISABLE_UPDATES`, retaining only `DISABLE_AUTOUPDATER=1`, and adding explicit binary discovery and actual version reporting.
- Pool Contract Validation [44069573866](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069573866) on that prior head completed SUCCESS. It does not validate the current head.
- Artifact [14320969240](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069573932/artifacts/14320969240) was downloaded. ZIP size 3,361 bytes. Local SHA-256 `d8dbe5a96d3f16b5dedd639d5c0b6ddbc5579bb2f605c0074ec52304a790327c` exactly matches GitHub's artifact digest. The artifact contains baseline/provenance files only; no component installation succeeded in that attempt.
- Runner facts from that exact ephemeral job: Ubuntu 24.04.5, 4 vCPU, 15 GiB RAM, root filesystem 145 GiB total / 89 GiB available at baseline. This is a measurement of one job, not a guaranteed capacity for every future runner.
- Latest branch head `bddcdc3f27044d8a5115556d9913a6dd839ddc1a`; workflow blob `e39fb7f6c3866824dad43ae6a27804f6a7d9ac76`. Corrected qualification run [44069967928](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069967928) and Pool Contract Validation [44069967918](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069967918) were RUNNING at last read.
- No secret values read, no provider/model requests, no FCC server startup, no agent task, no production dispatch, no deployment and no merge occurred.


## Final exact-head success — 2026-11-17

- PR #116 head `f7d490a63aefa007ff8d74e7de961349f54a27e9`; workflow blob `4264048f004404847ccada72e03c3165abebf321`.
- Runner workflow [44070499717](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717) COMPLETED / SUCCESS; job `133995194615`, all steps succeeded.
- Pool Contract Validation [44070499842](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499842) COMPLETED / SUCCESS; job `133995194255`.
- Artifact [14323205257](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717/artifacts/14323205257), 11,460 bytes; SHA-256 `cc692d5a31360da5c0cb82dab633a5fa995aa230614df7de5b0482974c679121` matches GitHub's digest and was recomputed from the downloaded ZIP.
- Provenance: PR head `f7d490a63aefa007ff8d74e7de961349f54a27e9`; event/checkout merge SHA `1bf87d450eece31cfb4591dfd8f4842e03f1610b`; base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Artifact verifies Claude Code 2.1.325, FCC 6.19.35/Python 3.14.10, uv 0.13.7, ECC commit `e413166c50e85fb205b988b5e78874b5a88ea4d2` and hashes for selected skills search-first, tdd-workflow and security-review.
- FCC commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`; pyproject Git blob `5eed9ea28040cf54ca87e8f48b8ef38c5b33d80b`; uv.lock Git blob `ee8490c29a36f8302f5c1f1d42b465f6271c10f2`; locked install `uv sync --frozen --no-dev --python 3.14.10`.
- Logs show no FCC server startup, no `fcc-claude` invocation and no orphan server cleanup. Manifest no-server flags match the logs.
- Runner: Ubuntu 24.04.5, 4 vCPU, 15 GiB RAM, 145 GiB root, 89 GiB available baseline / 88 GiB after. Installed sizes: Claude 349 MB, FCC venv 176 MB, uv cache 12 MB, ECC skills 68 KB. FCC sync 1.48 seconds, max RSS 108,764 KiB. Single-job measurement.
- No GitHub Secret values read or injected; no provider calls; no Anthropic auth; no agent task; no production dispatch; no deployment.
- Earlier failed/side-effect attempts are retained in `docs/reports/2026-11-17-first-claude-code-fcc-ecc-runner-proof.md`; they are superseded by this clean run.

**Interpretation:** the no-secret installation/resource smoke is SUCCEEDED. The operational Claude Code profile is NOT QUALIFIED until a separate FCC loopback runtime/health/start-stop test, synthetic FCC-to-Claude bridge test, verified free API route/quota, and independent review pass.

**Next:** loopback-only FCC runtime smoke on a GitHub-hosted runner, with no provider credentials and no provider calls.
