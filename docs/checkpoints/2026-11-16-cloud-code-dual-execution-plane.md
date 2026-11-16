# Checkpoint — 2026-11-16 Dual Cloud Code architecture

- Unified Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)
- Architecture decision: [Cloud Code Dual Execution Plane ADR](../architecture/2026-11-16-cloud-code-dual-execution-plane-adr.md)
- Evidence report: [2026-11-16 architecture synchronization](../reports/2026-11-16-cloud-code-dual-execution-plane-sync.md)

## Decision
One Jarvis control plane; two isolated future execution profiles:
- Development Cloud Code — software engineering and GitHub work.
- Media Cloud Code — media workflows, generation adapters and remote GPU jobs.

The runtime orchestrates; video/image/audio models and render tools do the actual generation. FCC/ECC are not assumed to be interchangeable model gateways.

## Current phase
Contour A — Cloud Development Pool qualification. **BLOCKED / NOT ACCEPTED.** Contour B and media/GPU rollout remain deferred.

## Safety and verification
Documentation-only pass. No secrets read, provider calls, dispatch, paid resources, GPU provisioning, runtime code changes, tests, merge or deployment. Compatibility and live execution remain NOT VERIFIED.

## Next step
Resume the current Contour A blockers and acceptance gates. Do not deploy either Cloud Code profile or media workers before Contour A ACCEPTED.
