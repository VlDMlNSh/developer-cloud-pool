# Cloud Code Dual Execution Plane — Architecture Decision Record

- Date: 2026-11-16
- Status: **PROPOSED / DOCUMENTED / NOT IMPLEMENTED / NOT QUALIFIED**
- Scope: future extension of Developer Cloud Pool; no change to Contour A acceptance criteria.
- Decision owner: repository owner.
- Related: Issues [#22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22), [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26), [#94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94), [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96).

## 1. Decision summary

Adopt one Jarvis control/experience plane with two logically and operationally isolated execution profiles:

1. **Development Cloud Code** — software engineering tasks: repository work, code changes, tests, CI diagnosis and documentation.
2. **Media Cloud Code** — media-production tasks: planning and orchestration of image/video/audio workflows, remote GPU jobs, media processing and final assembly.

The two profiles may use separate processes, workspaces, runtime identities, model/provider configurations, queues, budgets and credentials. They are not two independent Jarvis installations. Jarvis remains the common task-intake and status surface, while every privileged operation is delegated to a narrowly scoped execution service and existing authority boundary.

The phrase “Cloud Code” in this ADR means a Claude Code-compatible coding-agent runtime/profile where that compatibility is demonstrated. It does **not** imply that Claude Code itself is a video model, GPU renderer, model router or durable job scheduler.

## 2. Why two profiles

Development and media workloads have different risk and resource characteristics:

- Development workers modify source code, execute tests and interact with GitHub. They need repository-scoped permissions, immutable target SHAs, branch/PR provenance and CI evidence.
- Media workers orchestrate potentially expensive and long-running GPU tasks, handle large assets, and need explicit compute budgets, storage lifecycle, job cancellation and output provenance.
- Sharing one mutable process, credential context or queue would create avoidable cross-workload authority and cost risks.

Separate profiles are preferred over one overloaded installation that continually switches credentials. Separate installations are not mandatory if process-level isolation, configuration isolation, workspace isolation and identity isolation can be proven. Start with separate runtime profiles; split hosts only when capacity or threat modelling requires it.

## 3. Logical topology

```text
User
  |
Jarvis Experience / Task Intake
  |
Policy + Authorization + Audit + Task Router
  |                                  |
  v                                  v
Development Execution Profile       Media Execution Profile
  |                                  |
Claude-Code-compatible runtime      Claude-Code-compatible runtime
  |                                  |
GitHub adapter / test runners       Media workflow adapters
  |                                  |
Repository-scoped workers           GPU workers / media tools
                                     |
                              Asset store / render outputs
```

Shared services may include task identity, audit event format, health/status projection and policy definitions. Shared services must not imply shared secrets, unrestricted file access, common mutable workspaces or inherited privileges.

Jarvis is not the source of authority for GitHub repository state, provider billing, MediaHub product state or GPU-provider account ownership. It requests work through explicit contracts and reports evidence from the relevant authority.

## 4. Runtime and model-provider boundaries

- Keep model selection behind a versioned provider adapter/router. A runtime profile is not itself a provider.
- Each provider account/credential slot is a distinct identity. Store only secret references and non-sensitive metadata in manifests. Never copy credential values into documentation, task payloads, logs, reports or artifacts.
- A separate API key is not automatically proof of a separate account or independent quota. Track provider, account/slot identity, model, billing mode, quota evidence, rate-limit state, cooldown and qualification status independently.
- Do not rotate keys to evade quotas. Do not use paid fallback. Routes remain disabled until free eligibility, account separation, endpoint compatibility, budgets and security are evidenced.
- The existing four Gemini key slots remain subject to Issue #94/#96's qualification contract. Their presence does not establish four account identities or live dispatch readiness.
- **FCC / Free Claude Code** is a candidate compatibility/gateway path only. Its exact repository, supported API shape, tool calling, streaming, model routing, credential storage and security must be audited before selection. No FCC integration is approved by this ADR.
- **ECC / Everything Claude Code** is an extension/skills/rules bundle, not a model provider or standalone multi-provider gateway. It may be evaluated as a runtime extension after compatibility and supply-chain review; it is not required for the two-profile topology.
- Different model profiles do not necessarily require different CLI installations. Distinct processes/config directories and credentials may suffice, but per-profile isolation must be tested rather than assumed.

## 5. Media execution boundary

Media Cloud Code coordinates work; it does not perform neural video generation by itself. Actual generation and rendering are delegated to explicit workers and tools, for example:

- workflow orchestration and generation graph (candidate: ComfyUI);
- 3D/animation/rendering (candidate: Blender);
- deterministic media transformation, muxing and encoding (candidate: FFmpeg);
- provider-hosted or self-hosted video/image/audio models;
- remote GPU nodes exposed through a narrow authenticated job adapter.

These are candidates, not installed or qualified dependencies. Before adoption, compare maturity, license, supported models, API stability, GPU requirements, security posture and no-cost/paid status. No GPU host or paid compute is authorized here.

Long-form content (including feature-length material) must be treated as a resumable production pipeline: script and scene plan, asset/character continuity, shot-level generation, audio, edit/timeline, render, quality checks and final packaging. Persist job manifests, asset references, checksums, model/version provenance, costs/usage and resumable checkpoints. Do not represent a single 90-minute generation request as a realistic baseline.

## 6. Security, authority and resource controls

- Separate runtime identities, secret references, filesystem/workspace boundaries, task queues and budget limits between Development and Media.
- Use least privilege. Development workers receive only approved repository scope; Media workers receive only approved asset and GPU-job scope.
- Browser clients never receive provider keys, PATs, GitHub App private keys or privileged workflow tokens.
- Treat prompts, generated files, model outputs, logs and media metadata as untrusted input. Do not execute instructions embedded in model outputs or media metadata.
- Every task binds to an immutable target/config version and records requester, runtime profile, model/provider slot, job/run IDs, timestamps, input/output digests and terminal status.
- Require explicit budget approval before any paid GPU, hosted model or storage operation. Default is fail-closed.
- Cancellation, timeout, retry and ambiguous-dispatch reconciliation must be explicit and idempotent.
- Do not bypass issuer/capability controls or merge Jarvis, ASTRA A0, MediaHub Product State Authority or GitHub repository authority.

## 7. Phasing and non-goals

**Phase A — current priority:** finish and independently accept Cloud Development Pool Contour A. This includes the secure remote web console, trusted task admission, worker execution, account-isolated routing, quota accounting, durable state, secret isolation, recovery, audit and governance. Current status remains BLOCKED / NOT ACCEPTED.

**Phase B — after Contour A ACCEPTED:** qualify Development Cloud Code as a governed execution profile and connect it through Jarvis using approved task and repository contracts.

**Phase C — after its own security and budget approval:** add Media Cloud Code, media workflow adapters, asset storage and remote GPU workers. Media execution must not weaken Contour A controls.

Non-goals of this ADR: deploying Claude Code/FCC/ECC, selecting a paid provider, provisioning GPU servers, enabling model calls, connecting external servers, implementing a video-generation pipeline, changing GitHub dispatch gates, or starting MediaHub product development.

## 8. Acceptance gates for future implementation

1. Runtime identity and isolation tests prove that the two profiles cannot read each other's secrets, workspaces or queues.
2. Model/provider adapter contract tests prove supported tool calls, streaming, timeouts, cancellation and bounded output.
3. Account/slot ledger proves per-account quota separation and no-paid-fallback behavior.
4. Development profile proves immutable GitHub target binding, PR-only changes and exact-head CI evidence.
5. Media profile proves authenticated GPU job submission, resource ceilings, cancellation, resumability, asset provenance and cost reporting.
6. Jarvis API exposes only authorized task/status operations; it does not bypass underlying authorities.
7. Independent security/governance review and rollback plan are recorded.
8. Contour A must already be ACCEPTED before Phase B or C production rollout.

## 9. Current disposition

The two-profile architecture is **DOCUMENTED / PROPOSED**. No new runtime, provider, credential, GPU resource, model call, dispatch, deployment or production change was made. Contour A remains the sole active engineering priority and is **NOT ACCEPTED**.
