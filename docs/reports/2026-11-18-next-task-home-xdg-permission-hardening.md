# /next — task HOME path and XDG permission hardening — 2026-11-18

## Scope and immutable targets

- Code branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Default branch target: `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Latest code branch head after this pass: `ad8b120f9ffbd55423c8d49fe5a42af466cf4430`.
- No merge, deployment, credentials, provider calls, production dispatch or host access.

## Review findings and changes

### Symlink handling

Reviewed the task HOME helper and found the earlier canonicalization issue already addressed in the latest code revision:
- `_private_directory` checks the caller-supplied path with `lstat()` and rejects symlinks before resolving.
- Teardown validates the supplied task HOME before resolving and removing it.
- Dangling symlinks in forbidden credential-store locations are treated as present.
- Tests cover symlinked root and a symlink alias to a task HOME, and assert the real target remains intact.

### Intermediate XDG parent permissions

Found an additional permission gap: `Path.mkdir(parents=True, mode=0700)` does not apply the requested mode to intermediate directories. The XDG data path `.local/share` could therefore leave its intermediate `.local` directory at the process umask-derived mode.

Changed `task_home.py` to create, chmod and validate each XDG parent explicitly before creating the leaf. Added assertions that `.local` is owned by the worker uid and mode 0700.

Current source blobs:
- task HOME helper: `dc098728d4cbcd91d04d922fd548df6b71777054`
- tests: `d8a7dd10f4f2bb0a7852f95cb5f55eceaffadea2`

The two updates produce branch HEAD `ad8b120f9ffbd55423c8d49fe5a42af466cf4430`.

## CI evidence

- Prior exact-head after symlink hardening: Runner Qualification [44262676210](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676210) COMPLETED/SUCCESS on `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`; all 14 job steps succeeded, including symlink regression tests.
- Prior exact-head Pool Contract Validation [44262676143](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676143) COMPLETED/SUCCESS on the same head.
- Current final head `ad8b120f9ffbd55423c8d49fe5a42af466cf4430`: Runner Qualification [44262817505](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262817505) and Pool Contract Validation [44262817611](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262817611) were IN_PROGRESS at report creation. No final-head CI success is claimed yet.

## Boundaries and blockers

- Task HOME primitive is still not integrated into the production worker launcher/default worker workflow; default worker remains DSH-only.
- This filesystem helper is not an OS/container sandbox, network egress policy, external credential-store isolation, or host-loss recovery mechanism.
- PR #116 remains OPEN/DRAFT/UNMERGED and requires independent A3 review.
- Active ruleset #26550182 still has zero required approving reviews and zero required status checks.
- Gemini dispatch controller and Cloud Pool owner /next controller remain absent from default; no agent dispatch occurred.
- Claude hosted-use entitlement, commercial terms, installer/binary signature provenance and provider/account/free-quota compliance remain separate NOT VERIFIED gates; no real Claude session or provider call was made.

## Status

- Symlink boundary hardening: implemented; exact-head CI SUCCESS on prior revision `b75b95a...`.
- XDG intermediate-parent permissions: implemented; final-head CI PENDING at report creation.
- Production launcher integration: NOT IMPLEMENTED / NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step

Wait for exact-head CI on `ad8b120...`. If green, request independent security review of task HOME + child environment boundaries. Do not wire this into production dispatch until launcher-level, OS/container, egress, external credential and vendor-compliance gates are independently qualified.

## References

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Issue #115](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115)
- [Task HOME symlink hardening report](./2026-11-18-next-task-home-symlink-hardening.md)
- [Canonical MediaHub Chat Tree Map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
