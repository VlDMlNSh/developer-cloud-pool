# Developer Cloud Pool

An independent project for a governed, cloud-first agent platform and Jarvis runtime. This repository is the durable project record; see the cross-chat handoff before continuing work.

## Start here — restore project context

1. [Master Handoff](docs/operations/MASTER-HANDOFF.md) — current verified state, PR heads, CI evidence and next engineering task.
2. [Continuation Protocol](docs/operations/CONTINUATION-PROTOCOL.md) — how every new chat must restore context, verify GitHub and complete a pass.
3. [Architecture Decision Register](docs/architecture/ARCHITECTURE-DECISION-REGISTER.md) — binding project boundaries, security and cost decisions.
4. [Session Log](docs/reports/SESSION-LOG.md) — append-only engineering history.
5. [Unified Cloud Pool + Jarvis Build Plan](docs/architecture/UNIFIED-CLOUD-POOL-JARVIS-BUILD-PLAN-2026-11-14.md) — full target architecture and delivery order.

## Current status (snapshot: 2026-11-14)

- Default branch: Основной; baseline SHA: 221f216c00ca7e5596bcc682ba185ad155a10603.
- PR #67: local Workers-runtime D1 ledger and A0 admission contract proof; OPEN, DRAFT, NOT MERGED.
- PR #68: architecture consolidation and qualification documentation; OPEN, DRAFT, NOT MERGED.
- Pool Supervisor has run in heartbeat-only / dispatch-disabled mode. A successful heartbeat is not worker execution.
- Pool Worker is implemented only for the allowlisted DSH headless probe profile; it is not a qualified general-purpose agent runtime.
- Runner resource observations exist, but do not qualify reserved capacity, multi-agent packing or production worker profiles.
- D1 ledger proof is local-only; it is not integrated into production Supervisor/Worker and is not hosted D1 qualification.
- Jarvis UI/API is a prototype/reference architecture, not a deployed production control plane.
- General-purpose execution, durable production checkpoint/resume, tenant isolation and independent A3 acceptance remain incomplete.

## Component qualification

- [Component qualification matrix](docs/qualification/COMPONENT-QUALIFICATION-MATRIX.md) — 30 component records at this snapshot.
- [Machine-readable matrix](config/component-qualification-matrix.json)
- [Build and launch estimate](docs/qualification/BUILD-AND-LAUNCH-ESTIMATE-2026-11-14.md)

## Architecture

- [Unified Cloud Pool + Jarvis Build Plan](docs/architecture/UNIFIED-CLOUD-POOL-JARVIS-BUILD-PLAN-2026-11-14.md)
- [20-slot cloud architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Jarvis hybrid platform reference architecture](docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [DeepSeek Harness adoption and cloud-first build plan](docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md)
- [GitHub Pool Supervisor and recovery architecture](docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)

## Engineering proofs and contracts

- [Isolated D1 ledger proof](proofs/d1-ledger/README.md)
- [Attempt Outbox → GitHub Projection Integration Contract](docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md)
- [Task Identity and Fenced Delivery Proof](docs/contracts/TASK-IDENTITY-AND-FENCED-DELIVERY-PROOF.md)

The D1 package uses local Workers-runtime tests and always returns dispatch:false. It does not provision hosted D1, call providers, dispatch workers or authorize production use.

## Dispatch and authorization status

**Dispatch is disabled.** Do not enable POOL_DISPATCH_ENABLED, apply pool:ready as an execution approval, dispatch a worker, or run a provider-backed agent as part of routine continuation.

The current work is proof and qualification only. A future live-execution gate requires a separately reviewed A0 admission boundary, owner-verifiable single-use approval, durable task/attempt ledger, quota/cost verification, trusted identity/time, A3 independent verification, branch governance and explicit owner authorization. A green CI run or successful Supervisor heartbeat does not satisfy that gate.

For the historical issue-based bootstrap workflow, see the Supervisor architecture document; do not treat it as current authorization to execute work.

## First cloud evaluations

- [Runner Resource Probe](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/runner-resource-probe.yml)
- [DeepSeek Harness Runtime Evaluation](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/dsh-runtime-evaluation.yml)
- [Pool Supervisor](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/pool-supervisor.yml)

Baseline probes require no provider secrets and make no model calls. A passing smoke test is not security qualification.

## Security and cost invariants

- Worker profiles are allowlisted; issue text cannot provide shell commands or arbitrary workflow names.
- Worker execution must not receive provider keys unless a separately qualified profile explicitly requires a narrowly scoped credential.
- Never print API keys, private keys, tokens or authorization headers.
- Secrets stay in GitHub Secrets or qualified credential references; never put values in source, logs, matrices, task payloads or documentation.
- Initial cost classes are free_quota and local only. Paid or unknown routes fail closed; no paid fallback.
- Do not evade quotas by rotating accounts or keys.
- Claude is limited to Free Claude Code; no Anthropic API key/API/billing. OpenAI API remains deferred pending explicit approval.
- DSH is a developer-preview candidate and has not undergone a complete security qualification.
- Do not run untrusted public pull-request code on persistent local machines.
- Cross-repository dispatch is deferred until GitHub App allowlisting and scoped credentials are implemented.
- GitHub-hosted runner location and data residency are managed by GitHub; this design does not promise a selected execution country.

## Latest engineering reports

- [Cloud Pool continuation audit — 2026-11-14](docs/reports/2026-11-14-cloud-pool-continuation-audit.md)
- [D1 ledger proof implementation — 2026-11-06](docs/reports/2026-11-06-d1-ledger-proof-implementation.md)
- [DeepSeek Harness evaluation and cloud-first bootstrap — 2026-11-04](docs/reports/2026-11-04-deepseek-harness-cloud-first-bootstrap.md)
- [Pool Supervisor implementation — 2026-11-04](docs/reports/2026-11-04-pool-supervisor-implementation.md)
