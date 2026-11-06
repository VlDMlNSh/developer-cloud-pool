# 2026-11-06 — Resource-aware agent placement and runner packing

## Objective

Advance Developer Cloud Pool from the one-logical-profile-per-runner mental model to resource-aware placement: combine multiple compatible agent workloads and multiple functions on one ephemeral runner job, while retaining task, trust, credential and review isolation.

## Immutable target and repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Base: Основной @ 64d2636d4500127e635c214ccfb722c6b3fcda80
- Working branch before this pass: feat/quota-ledger-state-machine-2026-11-06
- Parent HEAD: 3e84946b146704e471806c96f23b8ea6b9a12ccb
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29

## Work completed

1. Added config/agent-placement-policy.json to distinguish runner-job slots from provider credential slots and logical agent workloads.
2. Added scripts/agent-placement.mjs: a deterministic best-fit-decreasing planner using CPU millicores, RAM MiB, per-workload scratch disk and immutable runtime bundle disk.
3. Shared immutable runtime bundle disk is counted once per digest per runner. CPU/RAM reservations and scratch disk remain per workload.
4. Multiple functions in one agent process use one combined workload reservation. Separate agents can be co-located only when task ID, target SHA, trust domain, isolation class, platform, architecture and network class match.
5. Every workload must provide explicit CPU/RAM/scratch envelopes backed by verified, unexpired measurement evidence, a pinned SHA-256 runtime bundle digest, a separate workspace and explicit co-location permission.
6. Raw credential properties and raw-secret delivery modes are rejected. Gateway-scoped workloads must use unique opaque scope handles, never credential values.
7. Independent-review and security-audit function labels automatically make a workload exclusive; the caller cannot accidentally co-locate those roles.

7. Exclusive reviewer/security-auditor workloads cannot share a runner with implementation workloads. The planner does not override task/issuer/capability governance.
8. Added 16 deterministic tests and wired them into Pool Contract Validation. The workflow now also triggers on config/**.

## Mature component review

- Kubernetes kube-scheduler documents filter-then-score placement and resource-aware feasible-node selection; its Resource Bin Packing strategy scores utilization to pack workloads. This project's pure planner adopts the general filter/score pattern without adding Kubernetes to ephemeral GitHub-hosted runners.
- GitHub Actions Runner Controller (ARC) is the mature GitHub scale-set autoscaling path for Kubernetes/self-hosted runner infrastructure. It is not appropriate to deploy solely to share GitHub-hosted VMs; it becomes relevant only if Cloud Pool later operates its own Kubernetes-backed runner fleet.
- GitHub documents ephemeral self-hosted runner usage and one-job-per-runner isolation. Current design retains GitHub-hosted ephemeral jobs and performs logical workload packing only within one job.

## Verification boundaries

- The implementation is a pure planner only. It does not start a runner, spawn agents, create containers, acquire durable leases, persist placement, or invoke a model provider.
- No provider secrets or secret-presence metadata were read. No API keys or credential values were placed in manifests or artifacts.
- No provider API calls, paid fallback, DB/Redis provisioning, Gemini controller dispatch, Claude/server execution, or Worker dispatch.
- Runtime container isolation, host-level capacity measurement, persistent placement leases and actual agent profile qualification remain NOT IMPLEMENTED / NOT RUN.
- The 20 runner-job ceiling is a design planning cap pending account/runtime confirmation. The separate 20 active credential route cap does not represent agent count or VM count.

## External design references

- Kubernetes scheduler filter/score design: https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/
- Kubernetes resource bin packing: https://kubernetes.io/docs/concepts/scheduling-eviction/resource-bin-packing/
- GitHub Actions Runner Controller: https://docs.github.com/en/actions/concepts/runners/actions-runner-controller
- GitHub self-hosted runner/ephemeral guidance: https://docs.github.com/en/actions/reference/runners/self-hosted-runners

## Verification record

This report must be finalized after exact-head CI completes. Until then, status is IMPLEMENTED / CI NOT VERIFIED / NOT QUALIFIED / NOT ACCEPTED.

## Next step

Run the manual read-only runner resource probe, calibrate resource requests using actual runner metrics, then design a bounded no-secret pilot with one lightweight API-backed runtime and a separate independent auditor. Keep dispatch disabled until security/governance gates pass.
