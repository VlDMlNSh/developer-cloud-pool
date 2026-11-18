# /next — gVisor feasibility decision for GitHub-hosted runner — 2026-11-18

## Immutable targets and scope

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`, observed HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- PR #116 code head: `aea59ae536358a827f05c2262647601ec53c8b33`.
- PR #116 base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- This pass is an evidence-based runtime feasibility decision only. No runtime installation, Docker daemon modification/restart, privileged container, provider call, secret read, production dispatch or deployment was performed.

## Fresh GitHub reconciliation

- Repository metadata: public; default branch `Основной`.
- Default branch ref re-read: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED; current head `aea59ae536358a827f05c2262647601ec53c8b33`; base default SHA above; mergeable reported true at read time.
- Exact-head Runner Qualification [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103), job [134666618686](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/job/134666618686): COMPLETED / SUCCESS on exact head.
- Exact-head Pool Contract Validation [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929): COMPLETED / SUCCESS on exact head.
- Qualification artifact [14409921197](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/artifacts/14409921197), 28,019 bytes; GitHub ZIP SHA-256 `c158ce33dcb612bafba409ef7cf829a8028bd84264806436a5488c0949a800c3`.
- Ruleset #26550182: ACTIVE, targets `refs/heads/Основной`, requires PR and review-thread resolution, but `required_approving_review_count=0`; no bypass actors. Classic branch API reports `protected=false`. Governance is active but insufficient for critical acceptance.
- PR #116 reviews include repository-owner COMMENTED reviews anchored to older heads. No independent A3 approval of current head was verified.
- Issue #118 remains OPEN. Its latest recorded evidence says zero active authorized SentinelX hosts, no Cloudflare zones/Tunnels, Access not enabled, and no persistence/backup/restore proof. Workspace remains BLOCKED.
- The approved Gemini controller workflow is absent from default branch per current Context Window; Gemini dispatch remains NOT RUN.

## Runner capability evidence (exact head)

The exact-head qualification artifact and job output establish:
- Ubuntu 24.04 hosted runner, Linux x86_64.
- Kernel `7.0.0-1014-aws`.
- Effective UID 1001.
- Docker client/server 28.0.4.
- cgroup v2 present with controllers including cpuset, cpu, io, memory, hugetlb, pids, rdma, misc and dmem.
- `/dev/kvm` exists but is not readable or writable.
- User, mount, PID and network namespace probes all failed with exit code 1.
- `runsc`, `nsjail` and `bwrap` are absent.
- `userns_clone=1` and a positive `max_user_namespaces` value do not override the actual denied namespace operations.
- Seccomp status 0 and NoNewPrivs 0 are observations of the probe process, not evidence of sandboxing.

## Reuse-first evaluation

### gVisor / runsc — REJECT for this runner execution path

Official sources reviewed:
- gVisor installation guide: https://gvisor.dev/docs/user_guide/install/
- gVisor Docker Quick Start: https://gvisor.dev/docs/user_guide/quick_start/docker/
- gVisor rootless guide: https://gvisor.dev/docs/user_guide/rootless/
- gVisor security introduction: https://gvisor.dev/docs/architecture_guide/intro/
- Docker daemon runtime configuration: https://docs.docker.com/reference/cli/dockerd/

Compatibility positives:
- Official gVisor documentation supports x86_64 and Linux 5.6+; observed kernel 7.0.0 is above that minimum.
- Docker 28.0.4 meets the documented Docker version floor.
- gVisor is a mature OCI runtime/application kernel and remains a valid candidate on a suitably provisioned Linux host.

Blocking facts:
- All four relevant unshare probes were denied on the actual runner.
- gVisor's security model relies on host kernel isolation primitives including user and mount namespaces, seccomp and cgroups. The documented rootless route explicitly relies on user namespace initiation; the documented security model describes an isolated user namespace and mount namespace.
- The standard Docker integration registers runsc in daemon configuration and requires daemon reload/restart. The current qualification pass is not authorized to alter the shared runner daemon, and doing so would not resolve the denied namespace operations.
- No evidence establishes a safe alternate direct OCI path that bypasses these missing host capabilities. No attempt was made to bypass them.
- No runsc binary was installed and no sandbox was launched.

Decision: **REJECT** gVisor-on-this-GitHub-hosted-runner as the current isolation implementation route. This is a scoped rejection of the execution environment, not a rejection of gVisor as a product or of a future dedicated host.

### Other candidates
- nsjail: REJECT as an immediate runner workaround; its namespace/cgroup-based isolation cannot be presumed usable while actual namespace operations are denied. Re-evaluate only on a host with proven prerequisites.
- bubblewrap: REJECT as a standalone task boundary; it is a building block, not a sufficient substitute for independently isolated hostile tasks, and namespace availability remains unproven.
- Firecracker: REJECT on this runner because /dev/kvm is inaccessible.
- Docker default runtime: REJECT as a hostile multi-tenant boundary without additional independently verified isolation.

## Result and safety boundary

- Runner capability inventory: VERIFIED from exact-head workflow evidence.
- gVisor on current GitHub-hosted runner: REJECT.
- gVisor on a separately qualified dedicated Linux host: NOT VERIFIED / candidate only.
- Actual hostile-task isolation: NOT VERIFIED.
- No runtime selected, installed or integrated.
- No production worker dispatch, provider call, credential use, deployment or merge.
- Gemini: NOT RUN; controller gates remain unqualified.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded engineering step

Evaluate an isolation architecture that does not depend on unsupported namespace operations in the shared GitHub-hosted runner: first qualify a dedicated, explicitly authorized Linux host (exact host ID, kernel, user/mount/network namespace tests, cgroups, least-privilege runtime and egress policy) if one becomes available; otherwise assess a free-tier provider-hosted per-task sandbox/ephemeral VM only after verifying its free-cost ceiling, tenancy boundary, data retention and governance. Do not install or deploy to the currently unqualified hosts.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
