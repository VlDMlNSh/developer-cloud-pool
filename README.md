# Developer Cloud Pool

An independent project for a governed pool of ephemeral GitHub-hosted engineering runners.

## Status
- Repository: public.
- Runtime deployment: NOT RUN.
- Runner profiles: PLANNED; not installed or qualified.
- Resource probe: awaiting initial commit and manual execution.
- Durable Repository Hub and Pool Bridge: DESIGN ONLY.

## Architecture
See [20-runner architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md).

## Safety
- Hosted jobs are ephemeral and isolated; runner disks are not shared storage.
- Baseline probes do not require provider credentials.
- Default workflow permissions are read-only.
- Never print secrets or credential material.
- A green resource probe does not qualify an agent profile.
