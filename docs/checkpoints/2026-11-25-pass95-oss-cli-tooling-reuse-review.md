# Pass 95 checkpoint — OSS reuse evaluation — 2026-11-25

- Status: VERIFIED for repository/source inspection and architecture decisions; no dependencies adopted.
- Canonical Cloud Pool base: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- rust-anything URL correction: user-supplied `sigoden/rust-anything` returned 404; active matching project inspected at `erkamyaman/rust-anything`, MIT, commit `6b588c37ae2172690d557cb21464b5dfb24b9c16`. Decision: ADAPT LATER only for deterministic CPU-bound CLI with offline fixture corpus; never run record/replay with credentials or production side effects.
- croc: MIT, commit `d77d59a8931d67460574f7603b9446470d475070`; potential future owned-device media transfer only; no relay/service started.
- yt-dlp: release `2026.11.23` / `6f73a8d`; no adoption due unnecessary untrusted download/file-write surface and recent upstream high-severity advisories.
- Espanso: GPL-3.0, commit `80d9e353e3c0a58c77feb72671cec4a61958366f`; not relevant to Cloud Pool backend.
- Material You New Tab: corrected repository `prem-k-r/MaterialYouNewTab`, GPL-3.0, commit `066bdc603198c04c47d7e745a60ba5c7576215a7`; visual reference only, no code reuse.
- Reuse-first decision table: rust-anything ADAPT LATER; croc DEFERRED; yt-dlp NOT ADOPTED; Espanso NOT ADOPTED; Material You VISUAL REFERENCE ONLY.
- No dependencies, binaries, credentials, services, relays, extension installs, code changes, tests or benchmarks. Source execution NOT RUN. Full supply-chain audit NOT RUN.
- Active time NOT MEASURED.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: resume API-attested GitHub event envelope → immutable D1 admission/receipt binding, resolve workflow identity mismatch, add race/replay/adversarial tests; dispatch stays disabled.
- Report: `docs/reports/2026-11-25-pass95-oss-cli-tooling-reuse-review.md`.
- MediaHub canonical map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
