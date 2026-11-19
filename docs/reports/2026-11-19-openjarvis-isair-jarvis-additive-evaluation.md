# 2026-11-19 — OpenJarvis and isair/Jarvis additive evaluation

**Status:** RESEARCH RECORDED / NOT ADOPTED / NOT QUALIFIED / NOT DEPLOYED  
**Scope:** Contour A research only; Contour B remains deferred.  
**Owner decision:** ADDITIVE ONLY. Do not replace, disable, migrate, reconfigure or reduce the authority/identity/permissions/quotas/secrets/workspaces of Claude Code or any existing executor route.

## 1. Candidate identity and immutable upstream references

### A. Stanford OpenJarvis
- Repository: https://github.com/open-jarvis/OpenJarvis
- Default branch: `main`
- Observed upstream HEAD: `427c2dd11d180ac254a03e92c5fb01189fb4b23b` (2026-11-19; commit title: clone-traffic metadata update).
- README source: https://raw.githubusercontent.com/open-jarvis/OpenJarvis/427c2dd11d180ac254a03e92c5fb01189fb4b23b/README.md
- Repository license metadata: Apache-2.0; LICENSE file declares Apache License 2.0.
- Repository last pushed at observation: 2026-11-19T10:14:40Z.
- README describes a local-first personal AI framework, shared primitives for on-device agents, evaluation of energy/FLOPs/latency/cost, and a learning loop using local traces.
- README lists built-in agents/modes including deep research, scheduled digest, monitor/operative, orchestrator, native ReAct, and code-execution agents; engines include local and cloud paths, with Ollama and other serving backends documented.
- CLI and GUI entry points are documented; desktop release tag observed: `desktop-v1.0.5` (published 2026-11-11).
- Preliminary role: optional isolated local inference/agent runtime and evaluation substrate. It is not accepted as a Cloud Pool authority, scheduler, executor identity provider, sandbox, or policy engine.

### B. isair/Jarvis
- Repository: https://github.com/isair/jarvis
- Default branch: `main`
- Observed upstream HEAD: `9d902577fd7c8d4fe05df7e19c81aaec36c79902` (latest commit observed; commit title references pinning direct search-result HTTP(S) connections to validated public addresses while preserving hostname/TLS verification).
- README source: https://raw.githubusercontent.com/isair/jarvis/9d902577fd7c8d4fe05df7e19c81aaec36c79902/README.md
- LICENSE source: https://raw.githubusercontent.com/isair/jarvis/9d902577fd7c8d4fe05df7e19c81aaec36c79902/LICENSE
- Repository license metadata: NOASSERTION. The checked-in custom license permits personal/educational/research/non-commercial use; commercial use requires a separate commercial license from copyright holder. No commercial use, redistribution in a commercial offering, or incorporation into a revenue-generating product is authorized by this research note.
- Repository last pushed at observation: 2026-11-18T23:19:30Z.
- Latest release observed: `v2.9.0` (2026-11-12).
- README describes a local-first desktop voice/text assistant; local speech recognition, local model endpoints (Ollama or OpenAI-compatible server), local conversation diary/knowledge graph, optional MCP tools, web search and background tasks.
- README states Windows/macOS/Linux packages exist, but development is primarily on macOS and platform behavior may differ; no mobile app is available.
- README says free for personal use and commercial use requires contacting the author.
- Preliminary role: research-only reference for a future personal voice UI / desktop assistant, not a Cloud Pool executor or security boundary.

## 2. Preliminary architecture placement

- Cloud Development Pool remains the authority for admission, executor registry, capabilities, policy, quotas, audit, secrets scope, workspace isolation, leases, revocation and dispatch gating.
- OpenJarvis may be evaluated later as a separate local runtime/agent substrate behind a dedicated adapter and identity, if Contour A governance allows.
- isair/Jarvis may be evaluated later as a separate user-facing desktop voice client, not a privileged control plane. Any connection to Cloud Pool must use a narrow authenticated API and user-scoped capabilities; no direct access to executor credentials, D1, provider secrets or shared workspaces.
- These roles are hypotheses for evaluation, not confirmed integration compatibility.

## 3. Security and governance gates

1. Preserve Claude Code and all existing executor/provider routes, IDs, profiles, permissions, quota domains, secrets scopes, workspaces and runtime paths without modification.
2. Each new candidate, if ever qualified, gets a new immutable identity, dedicated capability profile, isolated workspace, separate quota/budget, least-privilege credentials, network egress policy, audit trail and revocation path.
3. MCP connectivity is not authorization, sandboxing or process attestation. Review each server/tool and its exact permissions.
4. OpenJarvis code-execution and tool-enabled agents require explicit sandboxing and network/filesystem restrictions before any execution.
5. isair/Jarvis custom license is non-commercial by default. Obtain and review a written commercial license before any commercial product/service use; until then, treat commercial adoption as blocked.
6. Review dependency/model licenses separately from repository license; model weights, speech models, external services and bundled binaries may have separate terms.
7. Verify supply-chain provenance, signed/tagged releases, dependency lockfiles, SBOM, update channel, telemetry/network behavior, data retention and security advisories before qualification.
8. No model downloads, install, execution, MCP connection, provider call, hosted resource, dispatch, deployment or production action is authorized by this research record.

## 4. Compatibility questions to answer before adoption

### OpenJarvis
- Stable programmatic API and adapter surface; supported runtime/OS matrix; headless/server deployment and multi-tenant isolation.
- Agent/tool permission model, code-execution sandbox guarantees, filesystem/network boundaries, cancellation, timeouts, resource accounting and concurrency behavior.
- Whether model routing can be constrained to approved free/local routes with no paid fallback.
- Trace/memory storage format, encryption, deletion/export, per-user separation and retention controls.
- Reproducible build, dependency lock, release signing/provenance, SBOM and security response process.

### isair/Jarvis
- Exact IPC/API and remote-control surface; whether a headless or server mode exists and can be safely disabled if unnecessary.
- MCP server trust model, credential storage, tool allowlisting and per-tool confirmation.
- Local memory/diary data model, redaction behavior, backup/deletion/export and multi-user separation.
- Supported OS behavior, microphone/audio permission boundaries, update mechanism and network egress inventory.
- Commercial license availability, scope, derivative-work terms, distribution rights, and whether a written license covers intended deployment.

## 5. Preliminary disposition

| Candidate | Disposition | Rationale |
|---|---|---|
| OpenJarvis | ADAPT / EVALUATE; NOT QUALIFIED | Strong local-first runtime and agent/evaluation direction; security, isolation and stable adapter contracts remain to be proven. |
| isair/Jarvis | RESEARCH ONLY / NOT QUALIFIED | Useful voice-first local assistant reference; custom license is non-commercial by default and commercial permission is unresolved; no mobile app. |

Neither candidate replaces Claude Code. Neither is enabled or deployed. No executor registry entry or capability profile is created by this report.

## 6. Evidence and limits

- Upstream metadata, README, LICENSE and releases were read through GitHub at the observation time above.
- This is a source-level desk review, not an independent security audit, runtime test, license opinion, compatibility test or qualification.
- Upstream default branches are mutable; the recorded commit SHAs are the immutable references for this review. Re-pin before any later implementation.
- No tests run. No code, workflow, secrets, providers, hosted resources, model downloads, dispatch or deployment changed.
- Cloud Pool governance remains controlling. Issue #140 is OPEN and its local-only/no-secret scope and prohibitions remain in force.
- Contour A remains NOT ACCEPTED. Contour B remains DEFERRED.

## 7. Next step

Continue Contour A work first. When governance permits candidate qualification, perform a separate, no-secret compatibility/security review with pinned source commits and isolated test harnesses. Start with OpenJarvis runtime/API/sandbox analysis. Keep isair/Jarvis blocked from commercial adoption until an adequate commercial license is obtained and reviewed.
