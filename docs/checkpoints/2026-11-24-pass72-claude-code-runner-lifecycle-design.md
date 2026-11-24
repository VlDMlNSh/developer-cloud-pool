# Pass 72 Checkpoint — Claude Code-first executor and zero-loss runner lifecycle

- Date: 2026-11-24
- Frozen default SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Documentation branch: `docs/engineering-excellence-2026-11-23`
- PR #169: OPEN/DRAFT/UNMERGED; exact-head CI/reviews require refresh after this pass.
- Tracking Issue: #172 — https://github.com/VlDMlNSh/developer-cloud-pool/issues/172

## Owner-approved architecture
- Claude Code is the primary candidate engineering-agent runtime.
- Preserve toolchain lineage: local model/inference adapter → FCC → Claude Code → ECC.
- FCC/ECC acronym identity, canonical source, versions, licenses and supported auth semantics remain unresolved pending source verification.
- Free provider APIs and local models are inference routes only, subject to account/quota isolation, provider terms, paid-fallback denial and data policy.
- Mac mini 2011/2018 and future remote video server are separate candidate nodes; none is claimed connected or qualified.
- Microsoft Visual Studio Code is the human operator/admin workbench, not the control plane.

## Runner lifecycle
- Automatically refill released account-level GitHub Actions concurrency with next eligible task; each hosted job still receives a fresh ephemeral VM.
- No instant VM startup guarantee and no warm idle hosted runners assumed.
- Durable external task ledger, checkpoints, artifact digests, audit, idempotency, leases/fencing, reconciliation and bounded recovery are mandatory.
- UI state is independent from runner lifetime and supports reconnect/replay.
- Zero-loss claim is limited to committed state under the tested failure model; uncheckpointed work is replayed from the last committed checkpoint.

## Files
- `docs/architecture/CLAUDE-CODE-RUNNER-LIFECYCLE-AND-HYBRID-EXECUTION.md`
- `docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md`
- `docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md`
- `docs/reports/2026-11-24-pass72-claude-code-runner-lifecycle-design.md`
- Context Window updated below this checkpoint.

## Verification / limits
- Documentation-only; no runtime code/schema/dependency/workflow changes.
- No local tests/validators run: NOT RUN.
- PR #169 starting head `8198ab29f928429ddd70a43f9361ad741ace96e4` had no returned workflow runs and empty combined status contexts; final head must be rechecked.
- PR #171 Pool Contract Validation run `45448087868` SUCCESS, but workflow remains audit-only.
- Historical PR #170 runs `45274455569` and `45274455577` are not evidence for this pass.
- No Claude Code/FCC/ECC runtime, provider calls, secret reads, Gemini dispatch, local host, video server, VS Code remote session, deployment, merge or production writes.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next
Read back changed docs, validate links/Markdown, refresh PR #169 exact-head CI/reviews/governance, then no-secret source/compatibility assessment of Claude Code/FCC/ECC. Keep all execution fail-closed.
