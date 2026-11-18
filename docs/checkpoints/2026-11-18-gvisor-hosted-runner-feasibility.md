# Checkpoint — gVisor hosted-runner feasibility decision — 2026-11-18

## Scope
One bounded Contour A pass: decide whether gVisor can be safely qualified on the measured GitHub-hosted runner. No runtime installation or production activity.

## Immutable refs
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 head: `aea59ae536358a827f05c2262647601ec53c8b33`; OPEN/DRAFT/UNMERGED.
- Base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.

## Evidence
- Runner Qualification [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103), job [134666618686](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/job/134666618686): SUCCESS on exact PR head.
- Pool Contract Validation [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929): SUCCESS on exact PR head.
- Artifact [14409921197](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/artifacts/14409921197), ZIP SHA-256 `c158ce33dcb612bafba409ef7cf829a8028bd84264806436a5488c0949a800c3`.
- Ubuntu 24.04, kernel `7.0.0-1014-aws`, x86_64, Docker 28.0.4, cgroup v2 present.
- User, mount, PID and network namespace probes denied; /dev/kvm inaccessible; runsc/nsjail/bwrap absent.

## Decision
- gVisor on current shared GitHub-hosted runner: **REJECT**. Nominal kernel/architecture/Docker versions are compatible, but required host isolation primitives were not demonstrated and actual namespace probes failed. Official Docker integration requires runtime registration and daemon reload/restart. No safe alternate execution path was established.
- nsjail: blocked by namespace prerequisites.
- bubblewrap: insufficient as a standalone hostile-task boundary.
- Firecracker: blocked by inaccessible KVM.
- No runtime selected, installed or integrated.

## Safety and governance
No secrets read, provider calls, privileged containers, daemon changes, production dispatch, deployment or merge. Gemini NOT RUN. Issue #118 remains OPEN/BLOCKED by no active authorized host and no verified Access/Tunnel/persistence/restore. Ruleset #26550182 active but requires zero approving reviews; independent A3 review of PR #116 current head NOT VERIFIED.

## Status
Runner capability inventory VERIFIED. Current-runner gVisor feasibility decision REJECT. Actual hostile-task isolation NOT VERIFIED. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## Next
Qualify a dedicated, explicitly authorized Linux host if one becomes available; otherwise investigate a genuinely free per-task sandbox/ephemeral-VM architecture with verified tenancy, retention, cost and governance. Do not deploy to unqualified hosts.

Detailed report: [2026-11-18 gVisor hosted-runner feasibility decision](../reports/2026-11-18-next-gvisor-hosted-runner-feasibility-decision.md).
Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md).
Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
