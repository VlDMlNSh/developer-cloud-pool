# /next — independent Task HOME and child-process boundary review — 2026-11-18

## Scope and immutable targets

- Code PR: [#116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116).
- Reviewed code head: `a95700c0bf562aa3b0a142720892cff118dfeb9f`.
- Code branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Default branch: `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Review scope: `scripts/cloud_pool/task_home.py`, `exec_allowlist.py`, corresponding tests and qualification workflow.
- No code change, merge, deployment, provider call, secret read or production dispatch in this pass.

## Findings

### F-1 — same-UID task directories are not a task isolation boundary

The provisioner creates each task HOME and XDG directory with owner=current effective UID and mode 0700. This prevents access by different UIDs, but does not prevent another process running under the same UID from reading or modifying those directories. The helper does not create a distinct OS identity, namespace, container, VM or other kernel-enforced boundary per task.

Consequences:
- Two concurrent tasks sharing one runner UID can access each other's HOME/XDG contents if they can discover the paths.
- Filesystem mode checks and unique random directory names do not establish confidentiality or integrity against a same-UID peer.
- The current parallel test proves unique directory paths, not cross-process access denial.

**Severity: BLOCKER for treating Task HOME as a security isolation boundary.** The code's own module docstring correctly describes it as a filesystem hygiene primitive, not a sandbox. Keep that boundary explicit in all contracts and user-facing claims.

Required direction before production multi-task use:
- Execute mutually untrusted tasks under distinct OS identities with strict ownership and no shared writable parent, or use a qualified per-task container/VM boundary.
- Ensure task identity cannot regain host credentials or inspect sibling task state.
- Add adversarial tests that attempt sibling HOME read/write under the actual worker execution identity.
- Independently qualify cleanup, process termination, mount visibility and host-level credential exposure.

### F-2 — PATH validation is structural, not provenance enforcement

`exec_allowlist.py` requires absolute PATH entries and rejects duplicate resolved directories, group/world-writable entries, and untrusted owners. However, it accepts directories owned by the current UID. A same-UID task or compromised process may be able to modify executables in such directories. The wrapper does not pin the PATH directory set or verify executable provenance.

**Severity: BLOCKER for production use with untrusted same-UID workloads.** Production launchers must construct PATH from immutable or otherwise trusted executable locations, not inherit arbitrary caller-selected paths. Test executable replacement and writable-directory attacks at the real worker boundary.

### F-3 — process environment allowlist is not a complete sandbox

The allowlist controls variables passed to the wrapped child process. It does not constrain filesystem access, inherited file descriptors beyond the exec semantics, network egress, sibling processes, kernel interfaces, or secrets available elsewhere on the host. This is consistent with the module documentation but must not be represented as general credential or host isolation.

## Positive controls verified in source

- Task IDs are constrained to a bounded safe character set.
- HOME is newly created beneath a private root; XDG config/data/cache paths are separate and mode-checked.
- Symlinked supplied HOME/root paths are rejected before canonicalization.
- Ownership marker binds teardown to a random per-directory instance ID.
- Dangling symlinks in forbidden credential-store locations are detected.
- Child environment is rebuilt from an explicit allowlist; XDG paths must resolve inside HOME.
- Tests cover parallel unique paths, symlink rejection, marker mismatch and dangling credential-store symlinks.

These controls are useful filesystem hygiene, but do not mitigate F-1/F-2.

## Exact-head CI and review evidence

- Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443): COMPLETED / SUCCESS, associated with reviewed PR head.
- Pool Contract Validation [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506): COMPLETED / SUCCESS, associated with reviewed PR head.
- Combined status endpoint returned an empty status list; it is NOT evidence of required branch-protection checks.
- PR #116 remains OPEN / DRAFT / UNMERGED. Recorded review submissions are COMMENTED and authored by the repository owner; they are not an independent A3 security review or approval.
- The current code head differs from earlier checkpoint SHAs. Do not transfer earlier CI results to a newer head.

## Decisions and blockers

1. Keep Task HOME described as disposable per-task filesystem hygiene only.
2. Do not integrate it as a production isolation boundary or use same-UID execution for mutually untrusted concurrent tasks.
3. Select a qualified OS-level boundary (separate UID, container or VM) only after testing its actual permissions, namespace, mount and egress behavior. Do not select a tool solely by name.
4. PATH must be launcher-owned and provenance-controlled.
5. Keep production dispatch disabled. No provider route, account identity, free quota or real Claude session was tested.
6. Gemini controller remains absent from default branch; Gemini dispatch is NOT RUN.
7. Ruleset/governance, hosted state, durable leases/fencing/recovery, persistent workspace and independent acceptance remain blockers.

## Status

- Task HOME filesystem hygiene: IMPLEMENTED; exact-head CI VERIFIED.
- Same-UID cross-task isolation: NOT PROVIDED / BLOCKED.
- Trusted PATH provenance: NOT PROVIDED / BLOCKED.
- Production worker integration: NOT VERIFIED.
- Independent A3 review: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Define and test the actual worker isolation contract: distinct OS identity or qualified per-task container/VM, immutable PATH, private mounts, no sibling HOME visibility, no host credential visibility, and deny-by-default egress. Compare mature upstream options (for example bubblewrap, gVisor and Firecracker) against the runner/host constraints before implementing an adapter.

## References

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Issue #115](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115)
- [Issue #118 — persistent workspace qualification](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118)
- [Canonical MediaHub Chat Tree Map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
