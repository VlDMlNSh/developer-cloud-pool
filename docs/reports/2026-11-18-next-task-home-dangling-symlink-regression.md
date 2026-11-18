# /next — dangling credential-store symlink regression — 2026-11-18

## Scope and target

One bounded regression-test pass on PR #116, without changing production dispatch or provider access.
- Default branch: `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 base: same default SHA.
- Current PR #116 head after this pass: `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.
- PR #116 remains OPEN / DRAFT / UNMERGED; mergeable=true, mergeable_state=unstable.

## Change

The task HOME helper already treats a dangling symlink at a forbidden credential-store path as present, but the behavior had no direct regression test. Added `test_rejects_dangling_credential_store_symlink_and_cleans_home`:
- Mocks only the temporary-directory creation boundary.
- Inserts a dangling `.aws` symlink into the newly created HOME.
- Requires `create_task_home` to fail closed with the credential-store error.
- Verifies the partially provisioned HOME is removed from the private root.
- No credential contents or provider values are used.

Test blob SHA: `ee33fe67e5fea82093395696c9db21bc14211ef0`.
Commit / current PR head: `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.

## Exact-head CI

- Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665): IN_PROGRESS at checkpoint time, exact current head `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.
- Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651): IN_PROGRESS at checkpoint time, exact same head.
- Immediately prior head `ad8b120f9ffbd55423c8d49fe5a42af466cf4430` passed Runner Qualification [44262843742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843742) and Pool Contract Validation [44262843688](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843688). Runner job [134660148110](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843742/job/134660148110) completed all 15 steps successfully, including task HOME/XDG tests, FCC profile synthetic tests, loopback lifecycle, synthetic CLI handoff, pinned installs and evidence artifact upload. This prior-head result does not prove the newly added dangling-symlink test.
- Earlier symlink-hardening head `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc` also passed both exact-head workflows [44262676210](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676210) and [44262676143](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676143).

## Boundaries and blockers

- This remains a no-secret hosted-runner install/lifecycle qualification. Synthetic handoff only; no real Claude session, provider/model request, API credential value, provider quota or live route was tested.
- FCC is pinned AGPL-3.0-only; remote/network deployment remains blocked pending legal/use obligations review. Keep loopback-only.
- Task HOME is a filesystem primitive and not yet integrated into default production worker launcher; default worker remains DSH-only. No OS/container sandbox, egress isolation, external credential-store boundary or host-loss recovery qualification.
- Independent A3 review remains outstanding. Ruleset #26550182 still requires zero approvals and zero status checks. No merge.
- Cloud Pool owner /next controller and Gemini dispatch controller remain absent from default (Gemini is supplementary; dispatch remains NOT RUN).
- No secrets read, provider calls, Gemini dispatch, deployment or merge. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next step

Wait for exact-head runs 44262959665 and 44262959651. If green, request independent security review of task HOME, child environment and FCC profile guard. Separately qualify production worker integration, OS/container and egress boundaries, credential lifecycle, and provider route/quota only under a separately approved task.
