# /next — Task HOME descriptor-instance binding — 2026-11-18

## Immutable target and implementation
- Initial review target: PR #116 head `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.
- Updated PR #116 branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- Latest implementation head at checkpoint: `a95700c0bf562aa3b0a142720892cff118dfeb9f`.
- `task_home.py` blob: `362d9a98f0e85784a7470d44ab318cca3c849171`.
- `test_task_home.py` blob: `e413cf1b0b03550b3818863f45c6e773eb400e0f`.

## Change
- Added a per-directory random 256-bit instance identifier to the frozen `TaskHome` descriptor.
- Created a private mode-0600 ownership marker under each disposable HOME with task ID and instance identifier.
- `destroy_task_home()` now rejects missing/invalid IDs, unsafe marker type/ownership/mode, and descriptor-to-marker mismatches before recursive deletion.
- Added tests for two directories sharing the same task_id with a forged cross-directory descriptor, and for modified/symlinked ownership markers.
- Existing 3-argument TaskHome construction remains source-compatible through a default empty instance_id, but cannot authorize deletion.

## CI observations
- Prior exact-head Runner Qualification run [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665) and Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651) were SUCCESS on the pre-change head only.
- First new-head attempt [44263548591](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263548591) failed in the new Task HOME tests; logs exposed a test-fixture cleanup defect after intentionally replacing the marker with a symlink. This was a test issue, not a failure of the instance-mismatch assertion.
- Pool Contract Validation [44263548680](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263548680) SUCCESS on head `0070b5dde32d38d63e42c61509b24e21c392be22`.
- Corrected fixture restoration (including restoring mode 0600) in subsequent commits. Current head is `a95700c0bf562aa3b0a142720892cff118dfeb9f`; exact-head workflow runs were not yet returned by the run lookup at checkpoint. Therefore current code CI is NOT VERIFIED.
- Exact failure logs: Runner job [134662732189](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263636820/job/134662732189).

## PR / governance
- PR #116 remains OPEN / DRAFT / UNMERGED; head `a95700c0bf562aa3b0a142720892cff118dfeb9f`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Three historical COMMENTED reviews exist, none is an APPROVE on the current head. Independent A3 re-review of this change is still required.
- Separate review findings remain open: native Claude installer script/binary signature provenance is NOT VERIFIED; hosted-use/legal entitlement review is outstanding; FCC is AGPL-3.0-only and must remain loopback-only pending review; no real provider call, quota proof, network egress enforcement or production worker sandbox exists.
- The descriptor marker is protection against accidental/mismatched descriptors and stale API handles, not a trust boundary against hostile code running as the same OS user. Do not describe Task HOME as a sandbox.

## Safety and acceptance
- No secret values read, provider/model calls, Gemini dispatch, deployment, merge or production dispatch.
- Exact-head code CI: NOT VERIFIED.
- Independent A3 review: NOT COMPLETE.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next step: obtain exact-head Runner Qualification + Pool Contract Validation on `a95700c0bf562aa3b0a142720892cff118dfeb9f`; fix any concrete failure, then request independent A3 review and resolve legal/provenance gates.
