# /next — Task HOME descriptor-binding review — 2026-11-18

## Scope and immutable target
- Reviewed PR #116 exact head: `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.
- Reviewed `scripts/cloud_pool/task_home.py`, `test_task_home.py`, `exec_allowlist.py`, and `fcc_profile_guard.py` at that SHA.
- No production worker integration, secrets, provider calls, dispatch, deployment or merge.

## Exact-head CI recheck
- Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665): COMPLETED / SUCCESS; job [134660515082](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665/job/134660515082), all 15 steps succeeded.
- Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651): COMPLETED / SUCCESS; job [134660514970](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651/job/134660514970), all 7 substantive steps succeeded.

## Source-level finding
`destroy_task_home()` verifies that the supplied path is a private directory below the configured root and that its name starts with `pool-task-{task_id}-`. It does not bind the descriptor to the exact directory instance originally returned by `create_task_home()`.

Consequently, if two task homes are created with the same task_id, a caller can construct a new `TaskHome` descriptor carrying that task_id and the other task's path. The current path/prefix checks accept that descriptor and can remove the other directory. This is a descriptor-integrity / accidental cross-task deletion gap, not evidence of a remote exploit or an OS-level isolation bypass.

Recommended bounded repair before production integration:
1. Give each created task home an unguessable instance identifier and persist a private ownership marker inside it, or use an equivalent unforgeable in-process handle design.
2. Verify the marker/instance binding before deletion; reject mismatches without deleting either directory.
3. Add regression tests for two homes with the same task_id and a forged/mismatched descriptor.
4. Keep this helper explicitly non-authoritative against hostile code running under the same OS identity; production isolation still requires a separate sandbox/UID/container boundary.

## Review classification and limits
- This was a maintainer-side source inspection, not an independent A3 review.
- Existing tests do not currently cover descriptor-to-directory instance binding.
- `exec_allowlist.py` remains a process environment allowlist, not a network egress firewall or host-secret isolation boundary.
- FCC profile guard validates configuration shape but does not prove real provider identity, quota, or successful provider access.
- PR #116 remains OPEN / DRAFT / UNMERGED. No approval or merge recommendation is issued by this pass.

## Status
- Exact-head CI: VERIFIED.
- Task HOME descriptor binding: GAP IDENTIFIED / NOT VERIFIED.
- Independent A3 security review: NOT COMPLETE.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next step: implement the descriptor-instance binding and regression tests on a new immutable PR head, then rerun both exact-head workflows and obtain independent A3 review.
