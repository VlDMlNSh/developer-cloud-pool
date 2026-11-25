# Pass 95 — OSS reuse evaluation for CLI and media tooling

Date: 2026-11-25  
Contour: A — Cloud Development Pool  
Status: VERIFIED — repository/source inspection and architecture decisions; no dependency adoption

## Frozen project inputs

- Cloud Development Pool canonical default base: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Documentation working branch: `docs/engineering-excellence-2026-11-23`.
- Context Window prior blob: `f2b5e22b76c12de476b1003e79a7b3a21b1b6168`.
- Contour A remains the only active delivery priority. Contour B remains deferred until formal ACCEPTED.

## Scope

Evaluate the five projects shown by the user for reuse in Cloud Development Pool, with future MediaHub applicability noted only as deferred. Reuse First includes repository identity, source/license inspection, recent commit activity, architecture fit, operational risk, and whether adoption is justified now.

## Repository identity correction

- User-supplied `https://github.com/sigoden/rust-anything` returned GitHub API 404 during inspection.
- The active project matching the described tool is `erkamyaman/rust-anything`, default branch `main`, MIT license, latest inspected commit `6b588c37ae2172690d557cb21464b5dfb24b9c16`.
- This identity correction is not proof that the 404 URL redirects or that both names refer to the same owner. The inspected README identifies Erkam Yaman as author.

## Findings and decisions

### 1. rust-anything — ADAPT LATER / NOT ADOPTED NOW

Repository: `erkamyaman/rust-anything`  
License: MIT  
Inspected commit: `6b588c37ae2172690d557cb21464b5dfb24b9c16`

The project records behavior of an existing application, generates/coordinates a Rust rewrite, then replays recorded cases against the Rust implementation. The README describes N-API, PyO3 and wasm-bindgen bridges and says the tool only catches behavior represented by its recordings. Its own warning is material: recording/replay runs original code repeatedly; code that writes files, accesses a database or calls a network can repeat those side effects. The documented Prettier/json-server speedups are upstream-reported benchmarks, not independently reproduced here.

Decision:
- Do not install it in GitHub Actions, the Cloud Pool controller, D1 worker, or any runner.
- Do not port the GitHub event/admission path, D1 state machine, auth or security-sensitive orchestration to Rust. The current bottleneck is trust-boundary composition, not measured CPU cost.
- Consider a bounded offline evaluation only after Contour A acceptance, on a disposable worktree, synthetic fixtures, no credentials, no network, and a pinned upstream commit.
- Candidate later target: a deterministic, CPU-bound CLI/parser with a stable test corpus and byte-for-byte output contract. Require parity tests plus independent benchmarks before deciding to ship.

### 2. croc — DEFERRED; potential transfer utility, not a Cloud Pool dependency

Repository: `schollz/croc`  
License: MIT  
Inspected commit: `d77d59a8931d67460574f7603b9446470d475070`

The project offers cross-platform peer transfer with PAKE-based end-to-end encryption, relay fallback and resumable transfers. It is Go-based; current go.mod requires Go 1.27.3 and has a substantial networking/dependency surface. Its source README documents public relays and optional self-hosting.

Decision:
- No integration into Cloud Pool event, artifact, secret, or control-plane paths. GitHub artifacts remain the current auditable transport.
- A future isolated transfer evaluation for authorized large media assets between owned devices may be useful, but only after Contour A ACCEPTED and after checking relay policy, metadata leakage, firewall behavior, authentication, auditability, bandwidth and self-hosting cost.
- No relay, daemon, binary, or network connection started.

### 3. yt-dlp — NOT ADOPTED

Repository: `yt-dlp/yt-dlp`  
License: Unlicense for source/PyPI packages; bundled executables may carry additional GPLv3+ and third-party license obligations.  
Inspected current release: `2026.11.23`, release commit `6f73a8d`.

This is a broad media downloader, not a required Cloud Pool component. The upstream security page lists multiple recent high-severity advisories involving command injection, unsafe file creation and downloader behavior; the project README/release notes also emphasize verifying release checksums/signatures and component licensing.

Decision:
- Do not install it in Cloud Pool or wire it into automated agents.
- No download workflow, shell execution, extractor integration or media-source automation was implemented.
- For the current Cloud Pool objective it adds an unnecessary untrusted-input and file-write surface. Revisit only in a separately scoped, legally authorized media-ingestion design after Contour A acceptance, with strict source allowlists, sandboxing, file-type validation and patched pinned versions.

### 4. Espanso — NOT ADOPTED

Repository: `espanso/espanso`  
License: GPL-3.0  
Inspected commit: `80d9e353e3c0a58c77feb72671cec4a61958366f`.

A mature Rust text-expansion utility with OS-level input/clipboard integration. The inspected commit specifically scopes Windows named pipes by runtime directory to isolate multi-user sessions.

Decision:
- Not relevant to Cloud Pool's server-side workflow orchestration or D1 admission.
- GPL-3.0 and desktop input-injection behavior make it a poor dependency for this scope.
- Potential personal desktop productivity use is outside the current engineering scope; no installation or configuration performed.

### 5. Material You New Tab — VISUAL REFERENCE ONLY / DEFERRED

Correct repository: `prem-k-r/MaterialYouNewTab` (not the exact `materialYouNew` spelling supplied).  
License: GPL-3.0.  
Inspected commit: `066bdc603198c04c47d7e745a60ba5c7576215a7`.

It is a browser extension with theme customization, clock, weather, shortcuts, bookmarks and task widgets.

Decision:
- Not a Cloud Pool application framework and not adopted as a dependency.
- GPL-3.0 requires a separate compatibility review before any code reuse/distribution.
- Its information hierarchy and theme behavior may be used as non-code UX inspiration for a future dashboard, but the Cloud Pool's responsive authenticated UI must be designed against its own security/session/state contracts.
- No extension installed, browser permissions granted or UI code copied.

## Reuse-first outcome

| Project | Decision | Current action |
|---|---|---|
| rust-anything | ADAPT LATER | no install; candidate offline parity experiment after acceptance |
| croc | DEFERRED | no transfer daemon/relay; GitHub artifacts remain |
| yt-dlp | NOT ADOPTED | no downloader or execution integration |
| Espanso | NOT ADOPTED | desktop-only utility, GPL-3.0 |
| Material You New Tab | VISUAL REFERENCE ONLY | no code reuse or extension install |

No new dependencies, licenses, binaries, secrets, services, runners, relays, or external accounts were introduced. No application code changed. This is an architecture/reuse decision pass, not a performance qualification.

## Verification and limitations

- GitHub repository metadata and source files were inspected through the GitHub integration.
- MIT/GPL-3.0/license texts were read for rust-anything, croc, Espanso and Material You New Tab.
- Current commit metadata inspected for rust-anything, croc, Espanso and Material You New Tab.
- yt-dlp current release and published security advisories inspected.
- No source code was cloned or executed; no tests or benchmarks were run.
- Repository security policy/CI provenance for all five projects was not independently audited. Do not interpret this review as a full supply-chain audit.
- Exact dependency transitive SBOMs and license obligations were not computed.

## Impact on Contour A

No change to the critical path. The D1/API attestation composition blocker from Pass 94 remains the next engineering task. A Rust rewrite would be premature until profiling identifies a stable hot path; file-transfer tooling and desktop utilities do not close the current acceptance gaps.

No merge, deployment, dispatch, provider call, credential access, hosted D1 operation, production write, or Contour B work.

## Metrics

- Projects reviewed: 5.
- Dependencies adopted: 0.
- Code files changed: 0.
- Tests/benchmarks run: 0 (source/repository inspection only).
- Active engineering time: NOT MEASURED.
- Decision: reuse-first review VERIFIED; Contour A remains BLOCKED / NOT ACCEPTED.

## Next step

Resume Pass 96 on the existing critical path: implement the canonical API-attested GitHub event envelope and bind its immutable full tuple to D1 admission/receipt, resolving the workflow identity mismatch and adding race/replay/adversarial tests. Keep dispatch disabled.

References:
- Cloud Pool Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
- rust-anything inspected source: https://github.com/erkamyaman/rust-anything
- croc: https://github.com/schollz/croc
- Espanso: https://github.com/espanso/espanso
- Material You New Tab: https://github.com/prem-k-r/MaterialYouNewTab
- MediaHub canonical map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
