# Additive evaluation: OpenChamber, DeepSeek Harness, CUA Driver MCP and llama-modchip

**Date:** 2026-11-19  
**Contour:** A — Cloud Development Pool only  
**Status:** RESEARCH RECORDED / NOT ADOPTED / NOT DEPLOYED  
**Decision constraint:** ADDITIVE ONLY. Existing executor and provider routes must remain unchanged.

## 1. Owner decision — immutable compatibility constraint

The owner explicitly approved investigation and possible additional deployment only. This is not permission to replace, migrate, rename, disable, reconfigure, or reduce the availability of any existing executor or route.

- Claude Code remains an existing executor and must remain intact: same identity, registry entry, profile, routing, permissions, quota domain, secrets scope, and operational path.
- Gemini and all other existing approved routes remain unchanged.
- Candidate components must be introduced under new, distinct executor/provider/profile identifiers and isolated resources.
- No shared writable workspace, desktop session, credential scope, quota bucket, or mutable configuration with existing executors unless separately reviewed and explicitly approved.
- Rollback must remove only the newly added candidate resources and leave pre-existing routes byte-for-byte/configuration-equivalent.
- No migration of existing task ownership or historical IDs to candidate executors.
- This research branch does not authorize runtime execution, dispatch, provider calls, secret access, deployment, or production activation.

Any future proposal that requires modifying or replacing an existing executor is OUT OF SCOPE and must be rejected unless the owner gives a new explicit decision.

## 2. Candidates and source evidence

### 2.1 OpenChamber — additional user workspace/UI candidate

Source: https://github.com/openchamber/openchamber  
README: https://github.com/openchamber/openchamber/blob/main/README.md  
README blob: `183c364fa7b85a398b90a90f7a6d6ae619e76da9`

The upstream README describes a workspace for AI coding work across Desktop, Web/PWA, VS Code, iOS and Android, with sessions, multi-run, goals, GitHub issue/PR context and remote access. The CLI/Web and VS Code use an installed OpenCode CLI. Therefore, do not assume OpenChamber natively embeds or directly hosts DeepSeek Harness. Compatibility between OpenChamber and DSH is NOT VERIFIED.

Security source: https://github.com/openchamber/openchamber/blob/main/packages/docs/content/docs/security.mdx  
Private Relay source: https://github.com/openchamber/openchamber/blob/main/packages/docs/content/docs/private-relay.mdx

Security documentation describes UI password/passkeys, enterprise policy and paired-device tokens. Private Relay is documented as an end-to-end encrypted relay for paired devices. This is an upstream product feature, not proof that it meets Cloud Pool's owner authentication, authorization, audit, free-tier or deployment requirements. Do not expose a Cloud Pool control-plane endpoint through it without a separate threat model and qualification.

**Preliminary disposition:** ADAPT / EVALUATE as a separately hosted optional interface; do not replace the current Cloud Pool web-console architecture or treat it as its control plane.

### 2.2 DeepSeek Harness — additional agent runtime candidate

Source: https://github.com/deepseek-ai/deepseek-harness  
README: https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md  
README blob: `7941e30f7bdca9391befe39b9115d211157fa42d`  
Safety notice: https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md  
Safety blob: `2b76f00e0619ee69553afdc507df361080f4d3ac`

Upstream describes DSH as an open-source, plugin-oriented agent harness. README explicitly labels it Developer Preview and warns of compatibility-breaking changes. SAFETY.md says it has not undergone a security audit and must not be treated as secure or production-ready; it can execute model-generated code/commands, load plugins, and access files, processes, credentials and network resources available to it. Sandbox/approval controls are not guaranteed isolation.

**Preliminary disposition:** ADAPT / LAB-ONLY evaluation in a disposable, least-privilege environment. It is not qualified to replace Claude Code or any existing executor. Production admission is blocked pending independent security review, deterministic tool policy, isolation proof, supply-chain review, bounded egress, resource quotas, audit and recovery evidence.

### 2.3 CUA Driver MCP — additional desktop-control adapter

DeepSeek Harness provider package:
https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/computer-use-cua-driver-mcp/README.md  
Blob: `cb31a5d490bf55e7f9f2d0b9ff7097be9a8b042c`

The package bridges an already-installed Cua Driver executable into DSH through MCP stdio. The driver and desktop permissions remain external/upstream. The provider is experimental. The package documents exclusive computer-use provider registration; one desktop is shared between sessions, and the package itself does not serialize concurrent Session actions. Driver permissions and screenshot/image routing require separate qualification.

A distinct package exists for the bundled CUA MCP profile:
https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/cua-mcp/README.md  
Blob: `a4c7b4e6cb0477e38da30e8348e6108db55e703a`

This profile exposes computer-use tools over MCP stdio. The upstream documentation includes consent modes; unattended `allow` consent removes interactive approval and is not acceptable as a default Cloud Pool policy.

**Preliminary disposition:** ADAPT / isolated desktop-executor candidate only. Never attach it to the host, browser, files or credentials used by Claude Code or other existing executors. Require explicit per-action authorization, dedicated disposable desktop/VM, one active desktop workflow, screenshot data controls, and a tested kill/revoke path. No unattended consent bypass.

### 2.4 llama-modchip — additional local inference backend candidate

Source: https://github.com/synchopate/llama-modchip  
README: https://github.com/synchopate/llama-modchip/blob/main/README.md  
README blob: `b237355965107a2f39f2969a78d2327d2dfc9bbf`  
License: https://github.com/synchopate/llama-modchip/blob/main/LICENSE  
License blob: `d4a273041cabd59f1cbd3f12b9f89bfd3c922937`

README advertises a v3.0 inference engine, CPU/Metal/CUDA/Vulkan/Windows support, RAM tiers, a local server and SSE gateway. It includes model-size and performance claims for DeepSeek-V4 and other checkpoints. These are upstream project claims and are NOT independently verified by Cloud Pool. The advertised DeepSeek-V4 284B checkpoint footprint is about 57.99 GiB; this is not a fit for ordinary free GitHub-hosted runners. The Apache-2.0 repository license does not automatically settle the separate licenses/redistribution terms of model weights and bundled third-party artifacts.

**Preliminary disposition:** ADAPT / optional local inference backend on an explicitly approved owner-operated compute host; not a replacement for existing cloud provider routes. First qualify binary provenance, reproducible build/install, checksum/signature chain, model-weight licenses, API compatibility, auth/TLS, resource isolation, memory/disk/thermal behavior, concurrency, cancellation, context limits, telemetry and benchmark reproducibility. No cloud-hosted deployment or model download is authorized by this research note.

## 3. Proposed additive topology

```text
Existing Cloud Pool control plane (unchanged)
  ├── existing Claude Code executor (unchanged)
  ├── existing Gemini route/controller (unchanged)
  └── existing provider routes / quotas / secrets (unchanged)

New optional candidate plane — separately identified and isolated
  ├── OpenChamber UI candidate
  │     └── OpenCode CLI compatibility to be tested; DSH direct compatibility unknown
  ├── DeepSeek Harness candidate runtime
  │     └── CUA Driver MCP -> dedicated disposable desktop executor
  └── llama-modchip inference endpoint
        └── explicit provider adapter -> existing policy/routing gateway
```

Cloud Pool Gateway/Registry/Policy remain the only authority for task admission and routing. A candidate cannot self-register, grant itself capabilities, read existing executor secrets, share another executor's identity, or bypass quotas. Distinct identity, credential reference, provider account/quota domain, capability digest, workspace, network policy and audit stream are required.

MCP is a tool protocol/adapter boundary; it is not itself authorization or sandboxing. Tor is not required by any of these upstream integrations and is not included in this adoption decision. If considered later, it must be a separately reviewed transport option with explicit threat model, egress controls and operational owner; it must not be used to bypass provider policy or conceal execution provenance.

## 4. Non-regression and acceptance gates

Before any code integration:
1. Freeze current Cloud Pool and Claude Code executor identifiers/configuration as the comparison baseline.
2. Produce an explicit additive component ADR and threat model.
3. Confirm licenses for code, dependencies, binaries and model weights independently.
4. Pin immutable upstream commit/tag and verify signatures/checksums/build provenance.
5. Demonstrate isolated runtime/workspace/network/secret scopes.
6. Register each candidate as a new executor/provider identity with independent lifecycle, capability, quota and revocation state.
7. Prove no route fallback or task migration into existing Claude Code/Gemini routes.
8. Run negative tests: identity substitution, cross-workspace access, secret access, quota crossover, unauthorized MCP tool, desktop contention, network egress, revoke/kill and rollback.
9. Benchmark only on approved compute with no-cost constraints confirmed.
10. Independent review must verify old executor configs and routes are unchanged before and after the candidate test.

## 5. Current decision

- Owner-approved: further research and possible additional deployment only.
- Claude Code replacement: explicitly prohibited.
- Existing route/config changes: explicitly prohibited.
- OpenChamber: EVALUATE / ADAPT candidate, not adopted.
- DeepSeek Harness: LAB-ONLY / NOT QUALIFIED.
- CUA Driver MCP: isolated desktop candidate / NOT QUALIFIED.
- llama-modchip: local inference candidate / NOT QUALIFIED.
- Tor: NOT IN SCOPE / NOT REQUIRED by current candidate set.
- Runtime deployment, dispatch, provider calls, secrets access: NOT RUN.
- Contour A: remains primary and NOT ACCEPTED.
- Contour B: remains DEFERRED.

## 6. Research limitations and next steps

This is a source-level documentation review, not an installation, benchmark, penetration test, integration test or independent audit. Upstream README claims are not treated as proof. Next bounded research pass should inspect OpenChamber's OpenCode integration and provider configuration contracts, DSH's model adapters and plugin execution policy, CUA Driver platform/permission model, and llama-modchip's API compatibility, release artifacts, build provenance and model-weight licensing. Then prepare an additive-only ADR and a no-side-effect compatibility matrix.

## 7. Source revision evidence

| Project | Path | Observed blob |
|---|---|---|
| OpenChamber | README.md | `183c364fa7b85a398b90a90f7a6d6ae619e76da9` |
| DeepSeek Harness | README.md | `7941e30f7bdca9391befe39b9115d211157fa42d` |
| DeepSeek Harness | SAFETY.md | `2b76f00e0619ee69553afdc507df361080f4d3ac` |
| DSH CUA Driver MCP | package README | `cb31a5d490bf55e7f9f2d0b9ff7097be9a8b042c` |
| DSH CUA MCP profile | package README | `a4c7b4e6cb0477e38da30e8348e6108db55e703a` |
| llama-modchip | README.md | `b237355965107a2f39f2969a78d2327d2dfc9bbf` |
| llama-modchip | LICENSE | `d4a273041cabd59f1cbd3f12b9f89bfd3c922937` |
