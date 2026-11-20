# Multi-account Jarvis and shared GPU platform — architecture target

**Date:** 2026-11-19  
**Status:** PLANNED / future phase only  
**Priority:** Contour A first; this document does not authorize implementation.

## Decision summary

Cloud Development Pool must evolve beyond a single-account assumption. The initial target is two or three independent Jarvis accounts, with a design that can scale to additional tenants.

The preferred topology is **independent control planes with an optional shared compute plane**:

- Each account has its own Cloud Pool/Jarvis control plane, GitHub repository/deployment, profile, authentication, memory, conversation history, workspace, credentials, quota ledger and audit scope.
- A shared GPU platform may serve multiple accounts only through an authenticated gateway and scheduler that enforce tenant identity, capabilities, quotas, fair scheduling and data isolation.
- Sharing compute does not imply sharing memory, credentials, authority, workspaces or outputs.

## Logical architecture

```text
Jarvis / Account A ──┐
                     ├── Authenticated GPU API Gateway
Jarvis / Account B ──┘             │
                                   ▼
                          Tenant-aware Scheduler
                          ├── Queue A / quotas
                          ├── Queue B / quotas
                          └── Global fairness / admission
                                   │
                                   ▼
                           GPU Worker Pool
                          ├── LLM serving
                          ├── Image workflows
                          └── Video / rendering
```

GitHub remains the source and governance plane for each Cloud Pool. It is not a persistent GPU runtime. GPU hosts are a separate compute plane and must not be exposed as unrestricted public model endpoints.

## Isolation invariants

1. Stable tenant_id is distinct from GitHub repository ID, user identity, executor ID and capability profile.
2. Every job, approval, quota reservation, lease, attempt, receipt, artifact and audit event is tenant-bound.
3. Tenant identity is authenticated server-side; callers cannot self-assert another tenant.
4. Missing, malformed or mismatched tenant context fails closed at each trust boundary.
5. Each Jarvis has independent profile instructions, memory/history, credentials, storage namespace, quota and permission policy.
6. No cross-tenant prompt, memory, file, artifact, credential or audit visibility by default.
7. Explicit sharing, if ever needed, is a separate capability with scoped consent, provenance and revocation.

## Shared GPU scheduling requirements

- Separate bounded queues per tenant plus a global scheduler.
- Weighted fair scheduling or an equivalently testable starvation-resistant policy.
- Per-tenant concurrency, queue-depth, GPU-time and storage quotas.
- Priority classes and deadlines with anti-starvation safeguards.
- Reserved capacity for interactive work; long image/video jobs must not monopolize all capacity.
- Cancellation, timeout, retry, idempotency and crash recovery.
- VRAM-aware admission: installed model files are not the same as resident models.
- Model load/unload and warm-cache costs are explicit scheduler inputs.
- Concurrent model execution is allowed only when actual hardware/VRAM and runtime support it; otherwise serialize or use controlled model switching.
- Heavy video/rendering jobs may require exclusive GPU reservations by default.

## Portability / Golden Deployment Kit

Only after Contour A acceptance, prepare a reproducible deployment kit:
- pinned workflow and action versions;
- infrastructure and application manifests;
- database migrations and seed-free setup;
- policy and capability defaults;
- model/provider route registry templates without credential values;
- secret-name documentation only, never secret exports;
- isolated account bootstrap instructions;
- smoke, security and acceptance tests;
- backup, restore and revocation procedures.

A second deployment must receive fresh credentials, fresh memory/history, fresh tenant identity and its own quota/account mapping. Do not clone secrets, personal memory or account-bound identifiers.

## Research candidates (not adopted)

- ComfyUI: media workflow engine.
- vLLM: LLM serving and continuous batching.
- NVIDIA Triton: model serving, batching and instance scheduling.

No dependency is selected until license, maintenance, security posture, free-tier fit, API contract, resource needs and integration cost are verified.

## Phased delivery

1. Now: finish and independently accept single-control-plane Contour A.
2. After acceptance: produce and test the Golden Deployment Kit.
3. Deploy a second independent Jarvis control plane with fresh identity and isolated state.
4. Inventory actual GPU hardware (GPU model/count/VRAM, RAM, storage, network) and approved model/workflow requirements.
5. Qualify shared gateway, tenant-aware scheduler, per-tenant queues and GPU workers.
6. Run two/three-tenant isolation, fairness, concurrency, cancellation, recovery and audit tests.
7. Enable real workloads only after independent security review and explicit acceptance.

## Explicit non-goals before Contour A acceptance

No GPU provisioning, shared gateway, multi-tenant production schema, shared scheduler, second Jarvis deployment, provider calls, secrets access, paid fallback or Contour B work.

## Tracking

- Architecture issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/151
- Current engineering Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-19-integrated-contour-pass/docs/context/GITHUB-CONTEXT-WINDOW.md
- Contour A remains the sole active priority.
