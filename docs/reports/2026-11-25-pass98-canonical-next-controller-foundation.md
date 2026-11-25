# Pass 98 — canonical owner /next controller foundation

Date: 2026-11-25

## Status

**SUCCEEDED** for the bounded audit-only implementation and exact-head Pool Contract CI.
**NOT VERIFIED** for D1 composition, workflow-code attestation, merge-result CI, formal review, and independent security review.
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Default branch: `Основной`
- Frozen base SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Implementation branch: `feat/pass98-canonical-next-controller-audit-2026-11-25`
- PR: [#176](https://github.com/VlDMlNSh/developer-cloud-pool/pull/176)
- Exact head SHA: `e76fa09432d53edb2c21febc2991b6c5c9c4f919`

## Reuse First

- **ADAPT:** PR #174's read-only Node.js GitHub API verifier and Node built-in adversarial test suite.
- **REUSE:** existing pinned checkout/setup-node Actions, GitHub REST API, existing Pool Contract Validation workflow.
- **BUILD:** canonical workflow path `.github/workflows/next-event-controller.yml` because the D1 event binder already pins this path.
- No additional runtime dependencies or packages were introduced.
- No external OSS component was needed; no license obligations were added.

## Changes

1. Added `.github/workflows/next-event-controller.yml` using the existing least-privilege read-only API permissions (`contents: read`, `issues: read`, `actions: read`).
2. Reused `scripts/owner-next-event-audit.mjs`, changing the expected workflow identity to the canonical path.
3. Reused the adversarial tests and updated their expected workflow path.
4. Updated Pool Contract Validation to validate the canonical workflow and execute the Node test suite.
5. Kept the result strictly audit-only: `OBSERVED_ONLY`; no admission, receipt, outbox, dispatch, or execution authority.
6. Reruns remain rejected pending durable reconciliation.

## Verification evidence

- Exact-head Pool Contract Validation run [45694135875](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45694135875): COMPLETED / SUCCESS.
- Job `139486982096`: COMPLETED / SUCCESS; workflow YAML parse, dispatch-disabled assertion and pool security contract steps succeeded.
- Contract step executes `node scripts/validate-pool-contract.mjs` and `node --test scripts/owner-next-event-audit.test.mjs`; the combined step completed successfully.
- Read-back verified the five changed files and the canonical workflow path in workflow, verifier, tests and validator.
- Combined commit-status contexts: empty; no status contexts are inferred as passed.
- PR formal reviews: 0; inline review threads: 0.
- PR remains OPEN / DRAFT / UNMERGED.

## Open security/composition gaps

- PR #175 D1 binder still consumes flat Actions context; it is not wired to the API verifier's immutable attested result.
- D1 binder pins `next-event-controller.yml`, now present in this candidate, but no admission callsite composes the API read-back with D1.
- This pass does not yet attest workflow file content/code SHA against a GitHub API read-back in the same run.
- API verifier returns `OBSERVED_ONLY`; no durable receipt or idempotent admission is created.
- No merge-result CI, independent security review, live issue_comment event qualification, D1 write, child dispatch, provider call, deployment, or production write was performed.
- Gemini, Claude Code, ECC/FCC orchestration: NOT RUN.
- Local test execution: NOT RUN; hosted exact-head CI is the test evidence.
- Active engineering time: NOT MEASURED.

## Safety

No secrets or secret values were read. No provider credentials were used. No D1/production resources were accessed or mutated. No workflow dispatch or executor execution occurred. Pool dispatch remains disabled.

## Next step

Pass 99: design and implement a same-run API-attested immutable envelope, including workflow-code identity, and compose it with the D1 adapter without trusting flat Actions context. Keep D1 admission and dispatch disabled until exact-head/merge-result CI, governance and independent security review pass.
