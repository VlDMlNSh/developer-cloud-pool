# Developer Cloud Pool

An independent project for a governed hybrid agent platform: GitHub-hosted ephemeral execution, persistent local compute, Jarvis orchestration, model routing, memory and evidence.

## Current status
- Repository: public.
- 20-runner cloud architecture: DESIGN.
- Jarvis hybrid reference architecture: DESIGN, committed.
- Manual runner resource probe: IMPLEMENTED, NOT RUN.
- Runtime deployment: NOT RUN.
- Local host inventory: NOT RUN.
- Agent profiles: PLANNED; not installed or qualified.
- Pool Bridge, model gateway and durable storage: DESIGN ONLY.

## Architecture
- [20-runner cloud architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Jarvis hybrid platform reference architecture](docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)

## First measurement
Open [GitHub Actions](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/runner-resource-probe.yml) and run **Runner Resource Probe** manually on the default branch. It performs read-only host inspection and writes results to the job summary.

## Safety
- Hosted jobs are ephemeral and isolated; runner disks are not shared storage.
- Local nodes must not be exposed as persistent self-hosted runners to untrusted public pull-request workflows.
- Baseline probes do not require provider credentials.
- Default workflow permissions are read-only.
- Never print secrets or credential material.
- A green resource probe does not qualify an agent profile.
