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
