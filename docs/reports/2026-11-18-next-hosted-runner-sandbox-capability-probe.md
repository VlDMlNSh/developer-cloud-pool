# /next — hosted runner sandbox capability probe instrumentation — 2026-11-18

## Immutable target and scope

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #116 branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Previous tested code target: `a95700c0bf562aa3b0a142720892cff118dfeb9f`.
- New instrumentation head: `aea59ae536358a827f05c2262647601ec53c8b33`.
- Base/default observed: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Workflow path: `.github/workflows/claude-code-fcc-runner-qualification.yml`.
- Workflow blob after final edit: `d281af95da5b2f775c5e8f5dce5eff0420c7044d`.

## Evidence from previous successful hosted run

Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443), job [134662967919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443/job/134662967919), is COMPLETED / SUCCESS on the previous target `a95700c...`.

The job log proves:
- GitHub-hosted runner image `ubuntu-24.04`, image version `20261111.127.1`.
- Ubuntu `24.04.5 LTS`.
- AWS hosted compute region `us-west-2`.
- Runner version `2.338.2`.
- Existing workflow recorded CPU, RAM, filesystem, OS and language runtime baseline.

The log does NOT contain a recorded result for kernel/user namespaces, cgroup v2 controllers, Docker daemon/runtime, `/dev/kvm`, gVisor, nsjail or bubblewrap. These capabilities cannot be inferred from the runner image name.

## Change performed

Added a no-secret, no-install diagnostic step to the existing PR #116 Runner Qualification workflow. It records:
- kernel release/version and runner architecture;
- effective UID, user namespace sysctls, seccomp and no-new-privileges status;
- cgroup v2 presence/controllers;
- `/dev/kvm` existence/read/write access;
- Docker client/server availability and security options, without dumping full daemon configuration;
- presence/version of `runsc`, `nsjail`, and `bwrap`;
- bounded 5-second user/mount/PID/network namespace probes, recording denial rather than failing the workflow.

The diagnostic output is written under the existing qualification artifact directory with mode 0600. It does not install or execute a sandbox runtime, does not call external providers, does not read secrets, and does not change production dispatch.

The namespace probe was corrected so expected permission denial is captured as a result instead of triggering shell `set -e`. Final workflow file was reread from GitHub and verified to contain the probe and fail-safe status handling.

## CI disposition

The new commit `aea59ae...` was re-read as PR #116's current head. At the time of this report, the commit-associated workflow-runs query returned no runs. Therefore the new diagnostic has **NOT RUN / NOT VERIFIED**. Do not reuse the previous successful CI as evidence for this changed workflow head.

## Reuse-first decision remains

- gVisor: first candidate for evaluation after capability evidence.
- nsjail: second candidate if gVisor is unavailable/incompatible.
- bubblewrap: supplemental building block only.
- Firecracker: defer until KVM-capable host is qualified.

No runtime selected, installed or integrated.

## Governance and blockers

- PR #116 remains OPEN / DRAFT / UNMERGED.
- Independent A3 review is NOT VERIFIED on the new head.
- Default branch remains observed at `35208f0...`; no merge.
- Issue #118 persistent workspace remains BLOCKED by prior recorded evidence (no active authorized host, no verified Access/Tunnel/storage/restore).
- Default branch governance settings were not re-fetched in this pass; acceptance governance NOT VERIFIED.
- Gemini controller availability and dispatch gates were not requalified; no Gemini dispatch.
- No secrets read, provider calls, deployment or Contour B work.

## Status and next step

- Capability-probe instrumentation: **IMPLEMENTED**, workflow file reread and blob verified.
- New-head CI: **NOT RUN / NOT VERIFIED** at report time.
- Actual sandbox capabilities: **NOT VERIFIED**.
- PR #116: **OPEN / DRAFT / UNMERGED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

Next: wait for/read the exact-head workflow result on `aea59ae...`; inspect the published redacted capability artifact; select gVisor only if prerequisites are proven. If the workflow does not trigger, investigate event/path filters without dispatching any production worker.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
