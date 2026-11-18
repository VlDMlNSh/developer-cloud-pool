# /next — reusable sandbox runtime assessment — 2026-11-18

## Scope and immutable targets

- Contour: A only. No Contour B work.
- Code under review: PR #116, branch `feat/claude-code-fcc-runner-qualification-2026-11-17`, exact head `a95700c0bf562aa3b0a142720892cff118dfeb9f`, base/default `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Documentation integration branch: `docs/unified-realization-integration-2026-11-17`.
- This pass is a reuse-first component assessment. No code/runtime changes, installs, dispatches, provider calls, secret reads, merge or deployment.

## Live repository reconciliation

- Repository default branch: `Основной`; current observed default HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED; current head `a95700c0bf562aa3b0a142720892cff118dfeb9f`.
- Exact-head Runner Qualification run [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443): COMPLETED / SUCCESS.
- Exact-head Pool Contract Validation run [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506): COMPLETED / SUCCESS.
- Three formal PR reviews are COMMENTED; none is an approval on the current head. Independent A3 review remains NOT VERIFIED.
- Current Context Window blob before this update: `62aff4d587bb80805b04dbcf5138b375bbfec470`.
- PR #120 (reference architecture) and PR #124 (unified realization baseline) remain OPEN / DRAFT / UNMERGED. They are proposed documentation, not merged authority.
- Issue #118 records zero active SentinelX hosts, Cloudflare Access/Tunnel not enabled/available in the observed account state, and no verified persistent workspace/backup-restore. Persistent workspace remains BLOCKED.
- Active default ruleset #26550182 was reported by the architecture PR as requiring PR + review-thread resolution but zero approving reviews and no required status checks. Re-fetch of live settings was not part of this pass; governance remains NOT VERIFIED for acceptance.

## Security finding driving this pass

The latest source review recorded that Task HOME directories with mode 0700 do not isolate mutually untrusted processes that share one effective UID. The helper and child-environment allowlist are hygiene controls, not an OS security boundary. A production worker needs a qualified per-task isolation boundary, trusted executable path, controlled mounts, process/resource limits and deny-by-default network egress.

## Mature upstream candidates reviewed

### 1. gVisor — primary candidate for an OCI-compatible sandbox evaluation

- Upstream: https://github.com/google/gvisor
- Upstream describes `runsc` as an OCI runtime integrating with Docker and Kubernetes, using a userspace application kernel to reduce host-kernel exposure for containers.
- The project explicitly distinguishes itself from a syscall filter or ordinary namespace wrapper. This is a closer fit than a thin HOME wrapper for hostile/untrusted code.
- Upstream installation guidance lists Linux 5.6+ and Docker as requirements; Docker integration requires configuring and restarting the daemon. That makes compatibility with a hosted GitHub runner an open qualification question, not an assumption.
- Latest release observed during this pass: `20261102.0` (2 Nov 2026).
- Disposition: **EVALUATE FIRST**, do not yet adopt. Verify runtime availability, install provenance, OCI compatibility, performance and adversarial boundary behavior in the actual target environment.

### 2. nsjail — secondary candidate for a constrained process profile

- Upstream: https://github.com/google/nsjail
- Upstream documents Linux namespaces, cgroups, rlimits, seccomp-BPF/Kafel, filesystem constraints and network isolation.
- Latest release observed: `3.6`.
- This may fit a narrow single-task process adapter, but its security depends on a carefully reviewed policy and host kernel/cgroup capabilities. It is not a complete persistent workspace or control plane.
- Disposition: **EVALUATE SECOND**, compare its operational requirements and policy surface with gVisor. No integration yet.

### 3. bubblewrap — useful low-level building block, not sufficient alone

- Upstream: https://github.com/containers/bubblewrap
- Upstream documents mount/user/PID/IPC/network/UTS namespaces and seccomp integration; the exact filesystem and process visibility is determined by the supplied arguments.
- Latest release observed: `0.13.1` (14 Oct 2026).
- It is attractive for lightweight unprivileged filesystem/process confinement where user namespaces are available. It does not by itself provide the full resource-accounting, lease, identity, credential and network-egress policy required by Cloud Pool.
- Disposition: **OPTIONAL BUILDING BLOCK**, not the primary hostile-code boundary without additional independently qualified controls.

### 4. Firecracker — defer unless a KVM-capable host is qualified

- Upstream: https://github.com/firecracker-microvm/firecracker
- Official getting-started documentation requires Linux KVM and read/write access to `/dev/kvm`; examples use metal instances.
- No evidence currently establishes KVM availability on the target GitHub-hosted runner or a currently authorized persistent host.
- Disposition: **DEFER** for current GitHub-only worker path; reconsider for a separately qualified VM-capable workspace/worker host only after host evidence exists.

## Decision

No new sandbox is selected or installed in this pass. The current design should keep a thin Cloud Pool adapter around a mature upstream isolation runtime rather than implement namespace/seccomp/cgroup machinery from scratch.

Evaluation order:
1. Probe gVisor `runsc` feasibility on the exact intended GitHub-hosted runner image.
2. If gVisor is unavailable or incompatible, probe nsjail as a separately constrained profile.
3. Use bubblewrap only as a supplemental low-level boundary with an explicit, tested policy.
4. Do not spend effort on Firecracker until a KVM-capable host is actually available and authorized.

## Required qualification before production integration

- Record runner image/kernel, user namespace availability, cgroup v2 controllers, Docker daemon/runtime state and `/dev/kvm` presence as metadata only.
- Pin upstream release and verify artifact/source provenance and license.
- Demonstrate task A cannot read/write task B's workspace, process namespace, credentials, sockets or artifacts.
- Demonstrate host credential stores and GitHub runner credentials are not mounted or inherited.
- Enforce and test deny-by-default egress; no DNS/network access unless a task profile explicitly permits a reviewed destination.
- Verify CPU, memory, PID, file descriptor, disk and wall-clock limits.
- Verify cleanup after success, timeout, cancellation and worker termination.
- Run independent A3 review against the exact immutable code/runtime configuration.
- Keep production dispatch disabled until all gates pass.

## Reuse-first policy applied to every subsystem

Before implementing any subsystem, search mature upstream projects and compare: active maintenance/release cadence, license and hosted-use obligations, provenance, security model, fit to the actual runner/host, free-tier limits, operational complexity, exit/migration path and testability. Record one disposition: REUSE, ADAPT, REJECT or BUILD. A project is not adopted solely because it is popular or has a GitHub repository.

Apply this process to:
- sandbox/container runtime;
- browser automation and remote browser session;
- web IDE and terminal;
- identity / Zero Trust access;
- transactional database and durable queue;
- scheduler, leases and workflow dispatch;
- provider adapters and quota accounting;
- observability, artifact provenance and backup/restore.

## Status and next step

- Reuse-first sandbox research: **VERIFIED as a source review**.
- Runtime compatibility / installation / isolation tests: **NOT RUN**.
- PR #116 exact-head CI: **VERIFIED**.
- Independent A3 review: **NOT VERIFIED**.
- Persistent Engineering Workspace: **BLOCKED** (Issue #118).
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.
- No secrets read, provider calls, Gemini dispatch, deployment or merge.

Next bounded pass: execute a no-secret capability probe on the actual approved ephemeral runner target, then qualify the most viable mature runtime candidate. Do not change production worker behavior until the probe and independent review support it.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
