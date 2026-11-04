# Independent review packet — PR #11 YAML parser hardening

## Immutable review target
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/11
- Exact head SHA: `7b3bd8d8840e122f03326299444a921e3ba5f425`
- Base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Review mode: READ-ONLY. Do not push commits, approve/merge, dispatch workflows, access secrets, change variables, invoke providers or run pool workloads.
- Scope: validator, tests, Free-tier workflow contract and relevant workflow integration.

## Role 1 — YAML/Psych implementation review
Review:
- `scripts/validate-free-tier-policy.rb`
- Psych AST traversal before `YAML.safe_load`
- duplicate mapping key detection, merge-key rejection, scalar/non-scalar key handling
- alias/anchor handling and exception behavior
- runner label parsing, timeout, matrix, containers/images and paid-fallback detection

Required output:
- Findings ordered by severity with exact file/line and reproducible input.
- Confirm whether duplicate keys can survive through aliases, scalar tags, quoted/plain forms or nested mappings.
- Confirm malformed/unsupported YAML fails closed.
- Identify false positives against valid GitHub Actions YAML.

## Role 2 — Independent test and GitHub Actions contract review
Review:
- `scripts/validate-free-tier-policy-test.rb`
- `.github/workflows/pool-contract-validation.yml`
- `docs/architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md`

Required output:
- Map every security invariant to at least one positive and negative test.
- Identify missing adversarial cases and test gaps.
- Verify the explicit `POOL_DISPATCH_ENABLED=false` assertion is fail-closed.
- Verify runner labels are standard GitHub-hosted SKUs and timeout/matrix bounds match contract.
- Do not treat CI success as independent acceptance.

## Role 3 — Security, governance and provenance review
Review:
- Workflow trigger/path filters and permissions.
- External/local reusable workflow handling and graph traversal.
- Whether untrusted PR changes can influence the validator in a way that weakens protection.
- Whether the workflow can execute secrets or privileged dispatch (it must not).
- Whether PR #11 remains separate from Worker authorization and pool dispatch authority.

Required output:
- Explicit PASS/FAIL/NOT VERIFIED for each security boundary.
- Provenance and governance findings, including what the current validator does not guarantee.
- No recommendations that bypass the approved controller or branch governance.

## Common acceptance format
Each role must return:
1. Exact reviewed SHA.
2. Files reviewed.
3. Findings with severity and evidence.
4. Tests/commands actually executed, or state NOT RUN.
5. Residual risks.
6. Verdict: APPROVE, REQUEST CHANGES, or NOT VERIFIED.

## Hard prohibitions
- No edits or commits.
- No workflow_dispatch or reusable-workflow invocation.
- No Worker, Supervisor, DSH, Resource Probe, browser or model/provider execution.
- No secret/variable reads or writes.
- No paid fallback or paid services.
- No assumption that a role ran unless an attributable run/job ID and terminal report exist.

## Dispatch state
Gemini agents are NOT RUN. This packet is prepared only. Do not dispatch until the approved Gemini batch controller is present on an authorized ref, its exact contract accepts this packet, and governance, provider/quota, credential and provenance gates pass.
