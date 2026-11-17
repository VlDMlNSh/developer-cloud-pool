# Cloud Pool /next Engineering Pass — Synthetic FCC-to-Claude CLI Bridge

**Date:** 2026-11-17  
**Scope:** Contour A only; Issue #119; no provider credentials, provider/model calls, real Claude session, or production dispatch.  
**Disposition at record time:** WORKFLOW CHANGE PUSHED TO PR #116; exact-head runner qualification RUNNING; Contour A NOT ACCEPTED.

## 1. Immutable repository state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Work item: [Issue #119](https://github.com/VlDMlNSh/developer-cloud-pool/issues/119)
- Executor qualification PR: [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- PR #116 branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`
- PR #116 head after this pass: `4aa172a1efdc1081cf71509c9bc52fc3140e92fe`
- PR #116 base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Workflow path: `.github/workflows/claude-code-fcc-runner-qualification.yml`
- Workflow blob after change: `71e7219e9406012757e25fcaf626012705de96af`
- Docs branch: `docs/next-2026-11-16-current-state-refresh`
- Active ruleset #26550182 is enforced on the default branch; it requires a PR, blocks deletion/non-fast-forward, and currently specifies zero required approving reviews. Formal independent review remains a separate acceptance gate.

## 2. Source contract inspection — pinned FCC

FCC source target: `Alishahryar1/free-claude-code@eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`.

Inspected source paths and immutable Git blob IDs:

| Source | Blob SHA | Verified behavior relevant to the bridge |
|---|---|---|
| `pyproject.toml` | `5eed9ea28040cf54ca87e8f48b8ef38c5b33d80b` | Registers `fcc-claude = free_claude_code.cli.launchers.claude:launch`; Python pin 3.14.10; AGPL-3.0-only metadata |
| `src/free_claude_code/cli/launchers/claude.py` | `70d7a5e72c5f9763b6455647056c75e76ff8e97a` | Resolves the native `claude` executable, appends original argv and builds the proxy environment |
| `src/free_claude_code/cli/launchers/runner.py` | `74b848a38e602fcf4abdcaab36f43bdc11cd20b4` | Reads settings/token, derives local proxy URL, runs proxy readiness preflight, configures and launches the child process |
| `src/free_claude_code/harnesses/claude.py` | `47db87e66455439e13b85cd0e0aac99250c219fd` | Sets `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`; replaces inherited `ANTHROPIC_*` keys; adds Claude runtime settings |
| `src/free_claude_code/harnesses/environment.py` | `13de82c716bb42c897706c664549c645fbb36518` | Preserves the base process environment except explicitly removed keys/prefixes; adds local proxy bypass |
| `src/free_claude_code/cli/launchers/common.py` | `fedbaaa032d4ad66b6174882d22ecc5d516605c0` | Readiness preflight is `GET /health`; resolves `claude` via PATH; starts child with prepared env and propagates exit code |
| `src/free_claude_code/config/server_urls.py` | `5b0882937a9ced9df105e72cae2b23012a92c766` | Local proxy root URL derives from configured host/port and normalizes wildcard bind to loopback for client URL |

The bridge path is therefore: `fcc-claude` → settings + synthetic FCC token → local `GET /health` → resolve `claude` through PATH → child receives prepared proxy env and original CLI args → child exit code is propagated.

## 3. Security finding

The pinned FCC environment builder removes inherited `ANTHROPIC_*` variables and replaces the proxy-specific values, but it does **not** generically remove every other provider credential namespace. The child environment otherwise inherits the base environment.

The test runner therefore provides no provider credentials or GitHub token to this qualification job, and the mock checks that no `*_API_KEY`, `*_API_TOKEN`, `GITHUB_TOKEN`, or `GH_TOKEN` variables reach it. This proves the no-secret test setup, not a generic credential-scrubbing guarantee inside FCC. Production execution must use a trusted minimal environment allowlist or a separately reviewed scrubber before credentials can be made available to any unrelated child process. Do not inject production credentials into this test.

## 4. Implemented workflow slice

PR #116 workflow now includes a new step, **Qualify synthetic FCC-to-Claude CLI handoff without provider access**.

The step:
- creates a dedicated temporary HOME and synthetic token;
- starts FCC on `127.0.0.1:18766`;
- asserts exactly one listener bound to that loopback address;
- places a synthetic executable named `claude` first on PATH;
- invokes the actual installed `fcc-claude` entrypoint with benign arguments;
- asserts expected proxy base URL and non-empty proxy auth token without printing/persisting the token value;
- rejects credential-like environment variable names at the mock boundary;
- asserts original arguments and exact non-zero exit-code propagation (37);
- records only booleans/status metadata, not token contents;
- shuts FCC down and asserts clean exit and listener removal;
- does not invoke a real Claude process, completion/chat/messages endpoint, provider, or model.

No GitHub Secrets are referenced by the workflow. The job retains `contents: read` only. The workflow does not set `POOL_DISPATCH_ENABLED` or enable dispatch.

## 5. Exact-head verification

- Workflow run [44080654490](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44080654490): **COMPLETED / SUCCESS** on PR #116 head `4aa172a1efdc1081cf71509c9bc52fc3140e92fe`.
- Job [134030122492](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44080654490/job/134030122492): SUCCESS. Every step passed, including **Qualify synthetic FCC-to-Claude CLI handoff without provider access**.
- The successful bridge step ran FCC readiness on loopback, validated the exact listener, invoked the actual `fcc-claude` entrypoint against the synthetic `claude` executable, validated the proxy URL/token presence and absence of credential-like variable names, preserved the argument vector, propagated exit status 37, and verified clean shutdown/listener removal.
- Pool Contract Validation [44080654630](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44080654630): **COMPLETED / SUCCESS** on the same exact head; YAML syntax and pool security invariants passed; dispatch remains disabled.
- Artifact [14326213275](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44080654490/artifacts/14326213275): 13,959 bytes; GitHub-reported digest `sha256:b04d13dcbd493752e519bec627535ee1ce6f9d82c20f5b545a8d1564fbb58a6a`; retained until 2026-11-24. Artifact metadata verified; archive contents were not downloaded/independently inspected in this pass, so token absence inside the complete ZIP is NOT VERIFIED beyond the workflow's explicit pre-upload token checks.
- Earlier runner attempt [44080611186](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44080611186) was cancelled when the workflow was revised; it is not qualification evidence.
- Previous FCC install/runtime proof [44076256742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742) remains successful on earlier PR #116 head `596c03e19b4662f69a9b40791299f55afb9a928e`; it proves install and loopback lifecycle, not this bridge.

Issue #119 has a successful synthetic handoff qualification slice. Do not equate this with real Claude task execution, provider route qualification, or production readiness.

## 6. Four Gemini roles for this /next

Recorded on Cloud Pool Issue #94 comment [6947647001](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94#issuecomment-6947647001):
1. Researcher — pinned FCC source contract and launcher flow.
2. Implementation designer — review the mock-only bridge test.
3. Adversarial tester — negative cases and cleanup/token leakage.
4. Security auditor — environment inheritance, least privilege, egress assumptions and provenance.

**All four: NOT RUN / NOT DISPATCHED.** The default branch still has no qualified Cloud Pool-native four-child controller; Issues #94/#96 gates are not complete. Four assignments recorded are not evidence of agent execution. Keep `POOL_DISPATCH_ENABLED=false`; no secret values were read.

## 7. Remaining blockers and status

- Synthetic bridge exact-head runner: RUNNING at report creation; final result pending.
- FCC child environment generic provider-key scrubbing: NOT VERIFIED; production must use minimal environment allowlisting or separately qualified sanitization.
- Provider route/account/quota evidence: NOT VERIFIED.
- Real Claude task execution through FCC: NOT RUN.
- Independent review of PR #116: NOT VERIFIED.
- Four-child Gemini controller and account/quota isolation: NOT QUALIFIED; dispatch NOT RUN.
- Durable production A0/D1 admission and worker lifecycle integration: NOT ACCEPTED.
- Persistent Engineering Workspace/server #3 and Zero Trust deployment: NOT VERIFIED.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## 8. Next step

Re-read exact-head run 44080654490, inspect the synthetic bridge step and artifact metadata, then fix only demonstrated failures. If it passes, record the exact artifact digest and request independent review of PR #116. Keep live provider routing and production dispatch disabled until route/quota, environment isolation, governance and independent review are qualified.

## 9. Project navigation

- [Cloud Pool Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Cloud Pool PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Cloud Pool Issue #119](https://github.com/VlDMlNSh/developer-cloud-pool/issues/119)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
