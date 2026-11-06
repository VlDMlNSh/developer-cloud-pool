# Cloud Pool continuation checkpoint — provider quota and placement — 2026-11-06

## Active workstream

Continue Developer Cloud Pool account-isolated AI model routing, quota-resumable agents and resource-efficient runner placement. All work described here remains in an unmerged PR branch until review and acceptance.

## Canonical baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Canonical HEAD at start of current pass: 64d2636d4500127e635c214ccfb722c6b3fcda80
- Working branch: feat/quota-ledger-state-machine-2026-11-06
- Parent HEAD at start of current pass: 3e84946b146704e471806c96f23b8ea6b9a12ccb
- PR #29: OPEN / DRAFT / UNMERGED before this pass.

## Placement model

Three separate units must not be conflated:

1. Credential slot — provider route identity and quota/cooldown state. It does not require a dedicated VM. Pool hard limit of 20 active credential route leases applies only here.
2. Runner slot — one ephemeral GitHub Actions job environment. Planning concurrency ceiling 20 is a separate dimension and needs current account/platform confirmation before deployment.
3. Agent workload/function — logical runtime process. Multiple functions may share one process reservation; multiple compatible workloads may share one runner when resource and security controls permit.

Local API-client footprint may be small because inference runs on the provider side. Runner capacity is still bounded by measured peak CPU, RAM, runtime bundle disk and per-workload scratch disk. API key size does not measure agent runtime footprint.

## Added in this pass

- config/agent-placement-policy.json
- scripts/agent-placement.mjs
- scripts/agent-placement.test.mjs
- Updated .github/workflows/pool-contract-validation.yml to execute the placement tests and validate config-path changes.
- Updated docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md with the three-unit terminology, security constraints and resource packing model.
- Detailed pass report: docs/reports/2026-11-06-agent-placement-and-runner-packing.md

## Safety invariants

- All workloads in a placement plan use the same task ID, immutable target SHA, trust domain, isolation class, platform, architecture, network class and separate workspace.
- Require explicit co-location consent, measured resource envelopes and pinned SHA-256 runtime bundle.
- Reuse runtime bundle disk once per digest per runner slot; scratch disk, CPU and memory are reserved per workload.
- Each process/container must keep separate workspace and per-workload gateway capability. Raw provider keys never enter placement metadata or worker environments.
- Independent review/security audit is exclusive and never shares a runner with implementation.
- No resource overcommit. Missing measurements reject co-location or keep work queued for isolated fallback.

## Current status

- Pure placement planner: IMPLEMENTED in PR branch; exact-head CI status to be recorded after run.
- Runtime multi-agent supervisor/containers: NOT IMPLEMENTED.
- Host resource probe: existing manual workflow; NOT RUN in this pass.
- Durable placement/credential lease store: NOT IMPLEMENTED.
- Provider quota-domain reconciliation: next bounded workstream.
- PR #29: OPEN / DRAFT / UNMERGED; independent review NOT RUN.
- Canonical branch: unchanged at start of pass; verify final ref after commit.
- Provider calls, secret access, agent dispatch and paid fallback: NOT RUN.

## Project references

- PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- Issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Runner architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/quota-ledger-state-machine-2026-11-06/docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md
- Quota assessment: https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/quota-ledger-state-machine-2026-11-06/docs/architecture/SLOT-ACTIVATION-AND-DAILY-QUOTA-ASSESSMENT-2026-11-06.md
- Continuation checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/quota-ledger-state-machine-2026-11-06/docs/checkpoints/2026-11-06-provider-quota-ledger-continuation.md

## Next step

Finalize the placement tests through exact-head CI, then calibrate profile envelopes with a read-only runner probe. Implement quota-domain reconciliation afterward. Do not enable agent/worker dispatch or use provider credentials until lease, isolation, budget and governance gates qualify.
