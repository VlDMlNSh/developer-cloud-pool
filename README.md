# Developer Cloud Pool

An independent project for a governed pool of ephemeral GitHub-hosted engineering runners.

## Current status
- Repository: public; initial repository structure committed on 2026-11-04.
- Architecture specification: IMPLEMENTED.
- Manual runner resource probe: IMPLEMENTED, NOT RUN.
- Runtime deployment: NOT RUN.
- Runner profiles: PLANNED; not installed or qualified.
- Durable Repository Hub and Pool Bridge: DESIGN ONLY.

## Architecture
See [20-runner architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md).

## First measurement
Open [GitHub Actions](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/runner-resource-probe.yml) and run **Runner Resource Probe** manually on the default branch. It performs read-only host inspection and writes results to the job summary.

## Safety
- Hosted jobs are ephemeral and isolated; runner disks are not shared storage.
- Baseline probes do not require provider credentials.
- Default workflow permissions are read-only.
- Never print secrets or credential material.
- A green resource probe does not qualify an agent profile.
