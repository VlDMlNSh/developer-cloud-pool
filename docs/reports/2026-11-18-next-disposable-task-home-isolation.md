# /next — disposable per-task HOME isolation primitive — 2026-11-18

## Scope and immutable target

Bounded implementation pass on PR #116, branch `feat/claude-code-fcc-runner-qualification-2026-11-17`, based on default branch `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. No merge, deployment, provider call, credential access or dispatch was performed.

## Implementation

Added `scripts/cloud_pool/task_home.py`:
- Creates a unique fresh HOME below a caller-selected private root using an atomic temporary-directory creation.
- Enforces current-user ownership and mode 0700 for the root, HOME and explicit XDG config/data/cache directories.
- Rejects invalid task identifiers and checks that the new HOME contains no known external credential/config stores (`.claude`, `.fcc`, `.aws`, `.azure`, `.kube`, `.ssh`, `.docker`, `.config/gh`, `.config/gcloud`).
- Returns only HOME and XDG environment paths; it does not copy the runner's environment or files.
- Teardown is constrained to the exact task directory directly under the configured root. A context manager guarantees cleanup on normal and exceptional exit.
- Module documentation explicitly states this is a filesystem primitive, not a sandbox or host firewall.

Added `scripts/cloud_pool/test_task_home.py` with five regression tests covering private paths, fresh credential-store-free HOME, eight concurrent distinct task homes, success/failure teardown, invalid identifiers, out-of-root deletion rejection and insecure root rejection.

Updated `.github/workflows/claude-code-fcc-runner-qualification.yml` to run the new suite and trigger on both new files.

## GitHub evidence

PR #116 latest head after this pass: `2bc5e78c45d0df5d8c1488fb74feae27dd02e5dc`; base remains default `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN / DRAFT / UNMERGED; GitHub reports mergeable=true / mergeable_state=unstable.

Verified file blobs:
- task HOME module: `f44efe08e2e027f53c46f78d7616714fdebf12df`
- tests: `01f70abd2033d87ddd92216f32c0a76f4abb2560`
- runner workflow: `52258300a99269d038b2970462d3cf3ab0fd94c2`

Exact-head CI:
- Runner qualification [44262440288](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440288): PENDING at last poll.
- Pool Contract Validation [44262440272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440272): IN_PROGRESS at last poll.
- Earlier pre-workflow-update run [44262423499](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262423499) was IN_PROGRESS on previous head `20fc60aa...`; it is not evidence for the final head.
- No test result is claimed for final head until exact-head runner qualification completes.

## Limitations / blockers

- This primitive is not yet wired into the production worker launcher or default-branch worker workflow. The default worker path remains DSH-only and no production FCC/Claude task launch has been enabled.
- This does not establish OS/container isolation, network egress controls, external credential stores outside the dedicated HOME, host cleanup after runner loss, or production concurrency safety.
- PR #116 remains Draft with independent review outstanding. Governance ruleset #26550182 still requires zero approvals and zero status checks.
- Owner /next production controller and Gemini dispatch controller remain absent from default branch; dispatch stays fail-closed. No Gemini assignments were run.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next step

Wait for final-head CI. If green, conduct an independent A3 review, then separately integrate the primitive into an authorized production launcher with task identity, lifecycle cleanup, process/container boundary and host-level credential isolation tests. Do not merge or dispatch before governance and review gates pass.
