# Current execution checkpoint — 2026-11-17 (supersedes stale next-step pointers below)

The canonical implementation target is [CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md](../architecture/CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md).

- Latest executor candidate: PR #116 head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`; synthetic FCC environment allowlist and bridge pass exact-head CI (run 44083961406) and Pool Contract Validation (run 44083961455). One repository-owner COMMENTED review is recorded; it is not an independent external approval. PR remains OPEN / DRAFT / UNMERGED.
- Next immediate engineering work: close production runner hardening findings (trusted pinned PATH directories, HOME/XDG credential review, integrity-pinned Claude installer and actual egress enforcement); then qualify one free FCC route/account/quota without secret-value reads and integrate production A0/D1 admission, lease/fencing and recovery.
- Final Contour A includes the persistent Engineering Workspace: after initial CODE and A0/D1 gates, qualify server #3, Cloudflare Access/Tunnel, one shared filesystem for desktop VS Code and browser code-server/Open VSX, per-attempt worktrees/leases/fencing, backup/restore and independent A3 evidence. It is not required for the first ephemeral-runner smoke, but it is required before Contour A can be ACCEPTED.
- Contour B remains prohibited until formal Contour A ACCEPTED.
- Gemini/Codex/MEDIA remain supplementary and separately gated. Gemini dispatch is NOT RUN; keep `POOL_DISPATCH_ENABLED=false`.
- PR #116 and PR #113 remain OPEN / DRAFT / UNMERGED. No independent PR #116 review is recorded.

Historical notes below are retained as dated evidence and are superseded where their “next step” wording conflicts with this checkpoint.

---

**Canonical reference architecture:** [CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md](../architecture/CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md).

# Cloud Development Pool — Implementation Roadmap

**Date:** 2026-11-17  
**Owner baseline:** [Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)  
**Status:** Active implementation plan; work is in progress; Contour A is not accepted.  
**Repository:** VlDMlNSh/developer-cloud-pool

## 1. Operating rule: architecture is frozen

The owner-approved architecture is the implementation baseline. Do not reopen component selection, profile topology, provider strategy, or physical infrastructure as a recurring design exercise. Changes are allowed only when an implementation test, security review, upstream incompatibility, or acceptance gate produces concrete evidence that a bounded technical correction is necessary. Such corrections must be recorded as an ADR/change note and must not silently change owner intent.

The first deliverable is **one CODE executor** on GitHub-hosted ephemeral runners:

**Claude Code CLI → ECC toolkit → FCC → one explicitly qualified free API route**

Claude Code is not authenticated through Anthropic API. API key values remain GitHub Secrets and must never be read, logged, copied, exposed to browser code, task prompts, artifacts or untrusted pull-request workflows.

The following are deferred:
- Second CODE Claude Code profile: only after measured first-profile usage proves adequate free daily quota and rate-limit headroom.
- MEDIA profile: Claude Code + ECC + OmniRoute to a remote local model only; no API credentials and no API/paid fallback. Requires the future remote video server.
- Mac mini 2018 local model: optional future route into first CODE profile.
- Codex CLI: optional after runner resource and OpenAI API qualification.
- Gemini agents: supplementary only; not a prerequisite or fixed mandatory four-agent wave.
- YouTube connector: later connector phase, not a first-executor dependency.
- MediaHub OS / Contour B: prohibited until Cloud Pool Contour A is ACCEPTED.

## 2. Hard platform constraints

- Initial execution uses GitHub-hosted runners only. No self-hosted runners, NAS, local PC, Mac mini or remote GPU server is required for first launch.
- GitHub Actions runners are ephemeral jobs, not persistent VMs or web servers. The account's 20-job concurrency allowance is a maximum scheduling ceiling, not 20 always-on machines or guaranteed simultaneous capacity.
- Jarvis must therefore begin as a GitHub-hosted static web/PWA experience with GitHub-native event/task/status primitives. No OAuth secret, PAT, provider key or privileged workflow token may be embedded in browser assets.
- A static GitHub Pages frontend is not a trusted API/control plane. If a feature requires an always-on authenticated backend and cannot be securely expressed using GitHub-native primitives, mark that feature BLOCKED; do not pretend an Actions runner is a persistent host or silently add a paid/external service.
- All production dispatch and provider calls remain fail-closed until their separate gates are qualified.

## 3. Ordered implementation phases

### Phase 0 — baseline and owner decision freeze

**Status:** DOCUMENTED on the documentation branch; not yet merged to default.

- Re-read default branch, immutable SHA, open PRs/issues, exact-head CI and active ruleset.
- Publish the owner architecture freeze, this roadmap, Context Window and dated checkpoint.
- Amend controlling issues where historical Gemini/Jarvis wording conflicts with the 2026-11-17 owner baseline.
- Keep documentation branch and default branch clearly distinguished.

**Exit:** all current owner decisions have one canonical document and linked implementation issues.

### Phase 1 — first CODE runtime installation proof

**Status:** SUCCEEDED for no-secret installation/resource smoke; operational profile remains NOT QUALIFIED.

- PR #116: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- Branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Latest exact head: `f7d490a63aefa007ff8d74e7de961349f54a27e9`.
- Workflow file blob: `4264048f004404847ccada72e03c3165abebf321`.
- Exact-head workflow run: [44070499717](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717), COMPLETED / SUCCESS.
- Exact-head Pool Contract Validation: [44070499842](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499842), COMPLETED / SUCCESS.
- Evidence artifact [14323205257](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717/artifacts/14323205257), 11,460 bytes; SHA-256 `cc692d5a31360da5c0cb82dab633a5fa995aa230614df7de5b0482974c679121` independently verified against GitHub digest.
- Artifact binds PR head `f7d490a63aefa007ff8d74e7de961349f54a27e9`, event/checkout merge SHA `1bf87d450eece31cfb4591dfd8f4842e03f1610b`, and base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` separately.
- Verified versions: Claude Code 2.1.325, FCC 6.19.35/Python 3.14.10, uv 0.13.7, ECC pinned commit with three selected skills. No FCC server startup or launcher invocation in logs.
- Runner snapshot: 4 vCPU, 15 GiB RAM, 145 GiB root, 89 GiB free baseline / 88 GiB after; Claude 349 MB, FCC venv 176 MB, uv cache 12 MB, ECC skills 68 KB. One-run evidence only.
- Earlier run 44069967928 installed components but invoked `fcc-claude --help`, which auto-started FCC on loopback; cleanup terminated it and its manifest was inaccurate. This was fixed and superseded by the clean exact-head run. Full history: `docs/reports/2026-11-17-first-claude-code-fcc-ecc-runner-proof.md`.
- Prior runner run [44069573932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069573932) on head `7dcd58f73a87156c614ebf543c756ece6715762a` FAILED at Claude Code install. Exact log cause: `DISABLE_UPDATES=1` was present during native installation; installer reported updates disabled and the `claude` command was not found. This was a workflow environment mistake, not evidence that the runner lacks disk or memory.
- Prior Pool Contract Validation run `44069573866` completed SUCCESS on head `7dcd58f73a87156c614ebf543c756ece6715762a`; it is not exact-head evidence for the current candidate.
- Artifact [14320969240](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44069573932/artifacts/14320969240) was downloaded. ZIP size 3,361 bytes; SHA-256 `d8dbe5a96d3f16b5dedd639d5c0b6ddbc5579bb2f605c0074ec52304a790327c`, matching GitHub's artifact digest. It contains runner baseline/provenance only because installation failed; it does not prove component installation.
- The failed run's actual runner baseline: Ubuntu 24.04.5, 4 vCPU, 15 GiB RAM, root filesystem 145 GiB with 89 GiB available at baseline. These are measurements for that job only, not a guarantee for every future runner.
- Latest workflow removes `DISABLE_UPDATES`, retains `DISABLE_AUTOUPDATER=1`, discovers the native binary path, verifies the actual installed version and records `NOT_INSTALLED` rather than assuming a version if installation fails.
- FCC source commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`; `pyproject.toml` Git blob `5eed9ea28040cf54ca87e8f48b8ef38c5b33d80b`; `uv.lock` Git blob `ee8490c29a36f8302f5c1f1d42b465f6271c10f2`; Python `3.14.10`; install command `uv sync --frozen --no-dev --python 3.14.10`.
- FCC source inspection confirmed `fcc-server --help` starts the server; metadata-only proof uses `fcc-server --version` and `fcc-doctor --version`. ECC is pinned to `e413166c50e85fb205b988b5e78874b5a88ea4d2`, with only `search-first`, `tdd-workflow`, and `security-review` installed.
- Workflow remains `contents: read`; no GitHub Secret values read, no provider calls, no FCC server startup, no agent task and no production dispatch.

**Exit:** latest exact-head run succeeds; full logs show reproducible Claude Code/FCC/ECC installation and resource headroom; artifact and digests are verified; no secret/provider calls; independent review passes. This proves installation only, not model-route health or free quota.

### Phase 2 — FCC security and routing policy qualification

**Status:** PLANNED — Issue #117 is OPEN for the first loopback runtime smoke; provider-route qualification is NOT STARTED.

- Inspect the exact pinned FCC config schema and runtime behavior. Do not assume README marketing descriptions are defaults.
- Source inspection at the pinned FCC commit shows MODEL_FALLBACKS defaults to None; fallback model/key selections are explicit configuration. Preserve an empty fallback list for the initial route.
- Source inspection shows PROVIDER_MAX_ATTEMPTS defaults to 5. Set an explicit bounded retry policy before any live request; retry behavior must not multiply quota consumption unexpectedly.
- Bind each selected provider/model/credential reference to verified account and quota-domain evidence. Do not infer separate quotas from different secret names or suffixes.
- Keep paid routes and paid fallback disabled. No cross-provider fallback, no automatic key cycling, no unverified route IDs.
- Keep FCC Admin UI loopback-only inside the runner. Do not expose its admin interface to the public internet. Use an explicit proxy auth token if the qualified client path requires it; do not reuse the GitHub token.
- Determine the exact FCC env/config contract for the owner's existing secret names without reading secret values. Secret values are injected only into a trusted default-branch execution boundary after admission gates; never in pull_request jobs.

**Exit:** route registry contains one positively allowlisted free route; secret references and account/quota domains are mapped; FCC fallback/retry settings are explicit; tests prove no-paid-fallback, no-key-cycling and fail-closed behavior. Any unknown route remains disabled.

### Phase 3 — Pool A0 durable admission and execution authority

**Status:** PARTIAL PROOFS EXIST; NOT INTEGRATED / NOT QUALIFIED.

Required components:
- Issue #96: exact owner-only top-level /next control event.
- PR #112: read-only event envelope/controller proof, 21/21 tests at its recorded head; no durable admission.
- PR #114: local Workers-runtime D1 atomic admission proof, 12/12 tests at its recorded head; caller-supplied trusted metadata remains a production provenance gap.
- PR #111: local D1 lease/attempt ledger proof, 37/37 tests at its recorded head; not yet integrated/hosted.
- Issue #38: durable single-use claims, monotonic fencing, expiry, crash recovery and one-winner contention proof.
- Issue #1: governance. Current active ruleset #26550182 requires PRs but has zero required approvals and no required status contexts. Independent review remains necessary. Pool Contract Validation run 44066723253 / job 133982176620 on PR #116 head observed POOL_DISPATCH_ENABLED=false at 2026-11-17 10:38:50 UTC; re-read before any future dispatch because this is a timestamped value, not a permanent guarantee.

Implementation:
1. Reconcile PR #112 event fields with actual trusted GitHub Actions context.
2. Compose event provenance, owner approval, D1 single-use admission, task/attempt/outbox and lease/fencing into one trusted flow.
3. Prove duplicate/replay/ambiguous response recovery and one-winner contention.
4. Qualify a real hosted persistence backend and workload identity. Local Workers-runtime tests are not hosted D1 evidence.
5. Keep dispatch:false and do not enable any production worker until the full gate is satisfied.

**Exit:** trusted owner event; durable idempotent admission; fenced lease/attempt; recovery; authenticated worker identity; exact-head CI; independent review; governance gate.

### Phase 4 — first Claude Code task executor integration

**Status:** BLOCKED on Phases 1–3.

- Run one task per ephemeral GitHub-hosted job.
- Checkout exact immutable target SHA; separate workspace per attempt.
- Install the qualified pinned runtime; start FCC loopback-only; launch Claude Code through FCC.
- Provide only task-scoped file/command/network capabilities.
- Inject only the specific provider credentials required for the selected route, inside the trusted job after admission. Do not pass them to untrusted code, child agents, browser, task text, logs or artifacts.
- Capture stdout/stderr with secret-safe redaction, exit status, tests, changed paths, commit/PR, run/job IDs and artifact digests.
- Support cancellation, timeout, attempt fencing and reconciliation.
- No arbitrary command execution from browser input. No model output may expand its own permissions.

**Exit:** bounded end-to-end CODE task produces a reviewed PR and complete evidence without secret leakage, quota bypass or paid fallback.

### Phase 5 — Jarvis remote web experience

**Status:** PLANNED; constrained by GitHub-only hosting.

- Deliver a mobile/desktop static PWA shell, using the existing graphite design direction where reusable.
- Show only real GitHub-backed repository, task, PR, CI and evidence state; unknown telemetry must display UNKNOWN/UNAVAILABLE, never fabricated metrics.
- Use GitHub-native Issues/PRs/Actions links and owner-authenticated GitHub interaction for initial task commands.
- Do not place PATs, GitHub App private keys, OAuth client secrets or provider keys in the browser.
- No direct browser-to-workflow privileged dispatch. A0 remains the only execution authority.
- If secure server-side OAuth/session/API behavior cannot be implemented without an always-on non-GitHub host, keep those operations blocked and document the boundary. Static Pages alone is not an authenticated backend.

**Exit:** usable mobile/desktop read-only console and safe GitHub-native task navigation; privileged operations remain unavailable until A0 is accepted.

### Phase 6 — browser and connector perimeter

**Status:** DEFERRED until the first executor and A0 are qualified.

- agent-browser and pinned Chromium run inside isolated ephemeral runner jobs, clean profile per task, loopback-only CDP, no secrets by default, host allowlist and bounded downloads.
- Playwright provides deterministic browser QA.
- YouTube Data API is a later connector: API key for public metadata; OAuth with narrowly scoped consent for channel operations. Upload/publish requires explicit owner approval.
- Add other connectors only through versioned contracts, scoped auth, quota limits, audit and independent tests.

### Phase 7 — capacity expansion

- Measure actual daily and per-provider quota use of the first CODE profile across representative development work.
- Add a second Claude Code profile only when verified free quota headroom, runner capacity and isolated workspace/credential budgets justify it.
- Codex CLI is optional after disk/memory and OpenAI API route qualification.
- Gemini agents remain optional supplementary workers; no four-agent wave is a prerequisite.

### Phase 8 — local MEDIA profile and physical extensions

- MEDIA profile is not part of the initial cloud-only pool. When a remote video server with local model is available, qualify network identity, access, model capability, capacity and recovery.
- MEDIA route must be API-key-free and local-model-only through OmniRoute. No API fallback or paid provider.
- Mac mini 2018 may later provide a local model route to CODE after owner acquisition and separate qualification.
- Physical nodes must never become hidden dependencies for the initial Contour A acceptance.

### Phase 9 — Contour A acceptance

Acceptance requires evidence for:
- Jarvis remote interface and authenticated status behavior within the approved GitHub-only boundary.
- First Claude Code + ECC + FCC executor working through one verified free route.
- Durable owner-only task admission, leases/fencing, worker identity, cancellation and recovery.
- Secret isolation, explicit quota ledger, no paid fallback and no key cycling.
- Independent A3 verification and exact-head CI.
- Reproducible deployment and state recovery.
- No physical hardware or paid service required for the initial contour.

Until every criterion is independently verified, Contour A is NOT ACCEPTED and Contour B remains DEFERRED.

## 4. Current live state (2026-11-17)

- Default branch Основной HEAD: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845.
- Documentation PR #113: OPEN / DRAFT / UNMERGED; head ce90cf7a1394ec1bc45ac5951b4712177333fce9.
- First executor PR #116: OPEN / DRAFT / UNMERGED; latest head bddcdc3f27044d8a5115556d9913a6dd839ddc1a.
- Latest runner qualification run 44069967928 and latest Pool Contract Validation run 44069967918 are RUNNING at last read; exact-head results NOT VERIFIED.
- Prior runner run 44069573932 FAILED because DISABLE_UPDATES=1 was incorrectly applied during native installation; the failure is documented and corrected on the current head.
- Prior contract run 44069573866 succeeded only on superseded head 7dcd58f73a87156c614ebf543c756ece6715762a.
- Earlier run 44066723324 was CANCELLED after the first workflow correction; it is not an install pass.
- Artifact 14320969240 from run 44069573932 was downloaded and SHA-256 verified against GitHub's digest; it records baseline/provenance only, not successful installation.
- Current workflow uses official pinned Claude Code native install, FCC locked dependency sync, metadata-only FCC version checks, selected ECC skills and a bounded evidence artifact. No secret values or provider calls were used.
- Active ruleset #26550182: PR required, zero approvals, no bypass actors, no required status contexts.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## 5. Source-of-truth and update policy

- Owner decisions: this roadmap + [Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md).
- Current state: [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md).
- Each /next: one bounded engineering slice; update this roadmap only when evidence changes a phase status; append a dated checkpoint and update Context Window.
- Keep historical drafts and old PRs visible as historical evidence. Do not silently cherry-pick or merge large divergent branches.
- Never claim a test, installation, deployment, provider route, dispatch, qualification or acceptance without exact-head evidence.

## 2026-11-17 /next result reconciliation — first CODE runner

**Latest result:** no-secret installation/resource proof SUCCEEDED on exact head `f7d490a63aefa007ff8d74e7de961349f54a27e9`. The first executor profile is not yet fully QUALIFIED because FCC runtime/Claude bridge, free provider route, quota evidence and independent review remain outstanding.

- PR #116 remains OPEN / DRAFT / UNMERGED: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- Workflow blob: `4264048f004404847ccada72e03c3165abebf321`.
- Runner run [44070499717](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717): COMPLETED / SUCCESS; job `133995194615` all steps succeeded.
- Pool Contract Validation [44070499842](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499842): COMPLETED / SUCCESS; job `133995194255`; YAML and pool security contract passed.
- Artifact [14323205257](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44070499717/artifacts/14323205257), 11,460 bytes. GitHub and locally recomputed SHA-256: `cc692d5a31360da5c0cb82dab633a5fa995aa230614df7de5b0482974c679121`.
- Artifact binds PR head `f7d490a63aefa007ff8d74e7de961349f54a27e9`, GitHub event/checkout merge SHA `1bf87d450eece31cfb4591dfd8f4842e03f1610b`, and base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` separately.
- Verified installs: Claude Code `2.1.325`; FCC `6.19.35` on Python `3.14.10`; uv `0.13.7`; ECC commit `e413166c50e85fb205b988b5e78874b5a88ea4d2`, with three selected skills.
- FCC pinned source commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`; pyproject Git blob `5eed9ea28040cf54ca87e8f48b8ef38c5b33d80b`; uv.lock Git blob `ee8490c29a36f8302f5c1f1d42b465f6271c10f2`; installation used `uv sync --frozen --no-dev --python 3.14.10`.
- Log inspection found no FCC server startup, no `fcc-claude` launcher invocation and no orphan FCC server cleanup. The artifact manifest's `fcc_server_started=false` and `fcc_client_launcher_invoked=false` agree with the logs.
- Runner snapshot: Ubuntu 24.04.5, 4 vCPU, 15 GiB RAM, 145 GiB root filesystem, 89 GiB available before and 88 GiB after. Installed sizes: Claude 349 MB, FCC venv 176 MB, uv cache 12 MB, selected ECC skills 68 KB. FCC sync 1.48 seconds, maximum RSS 108,764 KiB. Single-job measurements only.
- No GitHub Secret values read or injected; no provider/model calls; no Anthropic authentication; no production dispatch; no deployment.
- Earlier failed/side-effect attempts 44069573932 and 44069967928 are retained in `docs/reports/2026-11-17-first-claude-code-fcc-ecc-runner-proof.md` and superseded by the clean f7d... run.

**Next implementation slice:** separate loopback-only FCC runtime/health/start-stop smoke with no provider credentials or provider calls; then a synthetic FCC-to-Claude CLI bridge test. Only after those pass should the first real free API route be qualified.

**Contour A:** BLOCKED / NOT ACCEPTED. **Contour B:** DEFERRED.

## Next bounded implementation issue

- [Issue #117 — loopback-only FCC runtime health and lifecycle smoke](https://github.com/VlDMlNSh/developer-cloud-pool/issues/117) is the next implementation slice.
- It starts FCC intentionally only on 127.0.0.1, uses a source-verified read-only health/readiness endpoint, checks listeners and clean shutdown, and makes no provider calls or secret reads.
- No FCC Claude launcher, Claude session, completion endpoint, model route, external hosting or production dispatch is in scope.
- After #117 passes, the next slice is a synthetic FCC-to-Claude CLI bridge test; real free-provider routing follows only after these no-secret runtime checks.


## Owner-requested Engineering Workspace integration — 2026-11-17

**Status: PROPOSED / BLOCKED / NOT DEPLOYED.** See [Architecture Integration Record](../architecture/CLOUD-POOL-ENGINEERING-WORKSPACE-INTEGRATION-2026-11-17.md) and [Issue #118](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118).

The target adds one Jarvis Control Plane, one persistent shared workspace, official VS Code Desktop + Remote SSH, a conditional code-server/Open VSX browser IDE, independent executor identities, and Cloudflare Tunnel + Access. This proposal does not replace current A0/Gemini contracts or authorize deployment. Keep the first FCC/A0 qualification sequence ahead of workspace installation.

Live gate results (2026-11-17): zero active SentinelX hosts; current Mac mini enrollment offline; other two known hosts disabled; no authorized server #3; no saved compute integration; Cloudflare returned zero zones and zero Tunnels, and Access is not enabled. Therefore host qualification, server-3 Claude Code, persistent storage, code-server, Coder, Remote SSH and Cloudflare deployment are NOT RUN/BLOCKED.

Minimum candidate stack after gates: official VS Code Desktop + Remote SSH for desktop; code-server + Open VSX for browser; one shared persistent filesystem with per-task Git worktrees; Cloudflare Access/Tunnel for perimeter access with origin JWT validation. Coder Workspace Platform and Remote Tunnels remain alternatives, not simultaneous installs. Copilot is optional, subject to free entitlement and spend controls. Gemini stays only behind the approved controller.


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


## 8. Normative target update — Engineering Workspace integrated into Contour A (2026-11-17)

Engineering Workspace is part of the final Contour A target, not a separate MediaHub OS product and not a competing Jarvis. Delivery is staged behind first secure CODE/A0/D1 gates and explicit host/network/persistence qualification.

- Jarvis remains the sole responsive mobile/desktop control plane.
- One persistent authoritative workspace serves official VS Code Desktop via Remote SSH and browser code-server/Open VSX behind Cloudflare Access/Tunnel. code-server uses loopback binding and retains authentication; no Microsoft Marketplace workaround.
- Desktop SSH uses verified host keys and client-side cloudflared/Access where supported. Remote Tunnels is a separately reviewed alternative transport.
- Browser and desktop attach to the same filesystem. Each task/agent has its own branch/worktree. Every mutable worktree requires a single-writer lease with expiry and monotonic fencing; concurrent writes to one worktree are prohibited.
- Server #3 is NOT RUN until exact SentinelX identity, authorization, capabilities, resources, persistent storage, network, allowlist and free-cost boundary are verified. Issue #118 records zero active hosts and no confirmed server #3.
- Cloudflare is BLOCKED until zone, Tunnel, Access IdP/policy, origin JWT validation, WebSocket path and cost ceiling are qualified. Current inventory records no zones/tunnels and Access unavailable.
- Claude Code on server #3 is separate from GitHub-hosted installation evidence and needs its own free-route/quota and host qualification.
- Gemini remains controller-only; no direct IDE dispatch and no server #3 Gemini. Four child assignments are NOT RUN unless approved controller and admission/security/quota gates pass. Copilot is optional pending free-entitlement proof.
- Workspace acceptance covers phone/desktop auth, shared filesystem, Git, SSH, WebSockets, lease/fencing, isolation, restart, encrypted backup/restore, audit and independent A3 evidence.

Ordered delivery: (1) synthetic no-secret Claude/FCC bridge and independent runner review; (2) qualify free route/account/quota and integrated A0/D1/lease/fencing/recovery; (3) qualify host #3, Cloudflare, persistence and backup/restore; (4) install/qualify browser code-server and desktop Remote SSH on the same workspace; (5) integrate links/status into Jarvis and independently accept. This supersedes earlier wording that treated the workspace as permanently optional or outside Contour A; it does not weaken first CODE/A0/D1 gates or claim deployment.


## 9. Latest status reconciliation — 2026-11-17

- The synthetic Claude Code + ECC + FCC installation and mock-only CLI bridge are now qualified on PR #116 exact head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`: qualification [44083961406](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961406) SUCCESS; contract validation [44083961455](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961455) SUCCESS; artifact [14329030788](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44083961406/artifacts/14329030788) available.
- Independent review [5938432852](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116#pullrequestreview-5938432852) is COMMENTED, not APPROVED. It does not qualify a real Claude session, provider route, free account or quota.
- Issue #119 is CLOSED for the mock-only bridge objective. Issue #115 remains OPEN for remaining source/license provenance and real free-route/account/quota qualification.
- Gemini is optional supplementary capability, not a mandatory every-/next dispatch or Contour A launch gate; this supersedes earlier roadmap text requiring four children per /next. All Gemini use remains controller-only after qualification. `POOL_DISPATCH_ENABLED=false`.
- PR #116 and PR #113 remain OPEN/DRAFT/UNMERGED. Documentation changes are on the docs candidate branch and have not yet been accepted into default branch `Основной`.
- Engineering Workspace remains part of the final Contour A target, staged behind A0/D1 and real free-route gates. Issue #118 host, Cloudflare and persistence blockers remain open.
- No secrets read, real provider calls, Gemini dispatch, persistent deployment or merge occurred. Contour A NOT ACCEPTED; Contour B DEFERRED.

Next: qualify one real free provider route and account/quota identity under A0/D1, while preserving fail-closed dispatch. Then return to Workspace host/access/storage gates.
