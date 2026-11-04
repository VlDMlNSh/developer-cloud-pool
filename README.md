# Developer Cloud Pool

An independent project for a governed, cloud-first agent platform and Jarvis runtime.

## Current status
- Repository: public.
- 20-slot GitHub-hosted execution architecture: DESIGN.
- Jarvis hybrid reference architecture: DESIGN.
- DeepSeek Harness: selected as primary candidate agent runtime; developer-preview evaluation only.
- DSH headless evaluation workflow: IMPLEMENTED, NOT RUN.
- Baseline runner resource probe: IMPLEMENTED, NOT RUN.
- Cloud runtime deployment: NOT RUN.
- Only current local hardware: Mac mini Server 2011, 4 CPU cores, 16 GB RAM, Linux; not yet inventoried.
- Mac mini 2018 and remote GPU server: FUTURE equipment, design only.
- Pool Bridge, model gateway and durable database: DESIGN ONLY.

## Architecture
- [20-slot cloud architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Jarvis hybrid platform reference architecture](docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [DeepSeek Harness adoption and cloud-first build plan](docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md)

## First cloud evaluations
1. Run [Runner Resource Probe](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/runner-resource-probe.yml).
2. Run [DeepSeek Harness Runtime Evaluation](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/dsh-runtime-evaluation.yml).

Both workflows are manual, read-only, and require no provider secrets. The DSH workflow installs a pinned npm package in an isolated ephemeral runner and inspects the headless composition without making a model call. It is a smoke test, not a security qualification.

## Safety
- Hosted jobs are ephemeral and isolated; runner disks are not shared storage.
- DSH is in developer preview and has not undergone a security audit.
- Do not run DSH with unrestricted credentials or untrusted plugins.
- Local nodes must not execute untrusted public pull-request code.
- Default workflow permissions are read-only.
- Never print secrets or credential material.
- A green smoke test does not qualify an agent profile.
