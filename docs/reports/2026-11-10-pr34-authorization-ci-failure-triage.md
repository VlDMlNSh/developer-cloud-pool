# 2026-11-10 — PR #34 authorization boundary CI failure triage

## Immutable target and evidence

- PR #34: OPEN / DRAFT / UNMERGED.
- Head: `43f48f9f4d0947f102b5f0c3170ee05186fe90e0`.
- Base: `197ba98d0dc7d8437d759dd25bee8750d02e59ae` (stale relative to current default HEAD `864213e2ff5b4fa956ba405dea8137a44d812f49`).
- Failed exact-head workflow run: `42267827737`.
- Job: `128064261403`, "Assert production authorization boundaries".
- Job log retrieved through GitHub Actions job-log API. Step 4 decision-model tests: 13/13 pass. Step 5 production-source contract tests: 0/8 pass.
- Other exact-head workflow run `42267827757`: syntax/security invariants SUCCESS.
- Formal PR reviews: none.

## Exact failure breakdown

All eight production-source tests failed against the production files in this PR's merge checkout:

1. Worker is reusable-workflow-only — failed: current Worker trigger is `workflow_dispatch`, not `workflow_call`.
2. Worker has no issue-write authority — failed: current Worker report job grants `issues: write`.
3. Worker has no issue mutation implementation — failed: report job still updates Issue labels and posts comments.
4. Supervisor has no privileged `workflow_run` trigger — failed: current Supervisor listens to Worker `workflow_run: completed`.
5. Supervisor does not grant Actions write — failed: current Supervisor grants `actions: write`.
6. Supervisor invokes Worker via statically declared reusable workflow, not REST dispatch — failed: current Supervisor script calls REST workflow dispatch and workflow file does not use the reusable Worker workflow.
7. Supervisor never requeues expired/failed claims using the same approval — failed: current `recoverStaleClaims()` moves a stale claimed issue back to `pool:ready` if no matching Worker run appears within 15 minutes. This violates the single-use approval safety rule.
8. Worker validates caller and callee identities using distinct GitHub contexts — failed: test expects literal `github.repository` in Worker YAML, but current workflow does not declare those explicit identity expressions. The test is a static textual assertion and may be too brittle if equivalent built-in environment context is used; however, the required caller/callee identity comparison is not demonstrated by the inspected workflow and remains NOT VERIFIED.

The log shows the precise assertion and source text for each failure. This is not merely a generic flaky CI result: seven failures expose production-source behavior that contradicts the intended contract; the eighth remains unproven and needs a semantic test rather than a literal regex.

## Interpretation

- The decision model's 13 unit tests pass, but that does not prove trustworthiness of the consume receipt; it accepts a plain caller-supplied object as a successful consume marker (see separate trust-boundary report).
- The contract test suite is currently a failing architecture gate. It is useful evidence that PR #34 adds tests without changing the legacy Supervisor/Worker production implementation.
- Do not "fix" this by weakening/removing the assertions. Production implementation must be changed in a bounded isolated branch, or PR #34 must remain draft.
- The stale PR base must be reconciled with current default HEAD before relying on any future exact-head CI.
- No runtime dispatch, hosted D1, provider calls, secret reads, deployment, merge, or source changes occurred in this triage.

## Next bounded step

Prepare a source-level migration plan against the current default HEAD for the Supervisor/Worker trust boundary, preserving least privilege and no automatic retry:
- replace REST-dispatched Worker with a reusable workflow invocation only after trusted approval + durable single-use consume;
- remove `actions: write` and `workflow_run`-based privileged recovery from Supervisor;
- remove Worker issue-write/report authority, moving audit projection to a narrowly scoped trusted Supervisor/outbox path;
- keep stale/indeterminate claims in `pool:needs-review`, never return them to ready on timeout;
- bind caller/callee workflow identity explicitly and test semantics;
- require the canonical owner-event adapter and real D1 single-use consume before any positive dispatch path.

No dispatch gate may be enabled during this work.

## Status

- CI failure root cause triage: VERIFIED.
- Decision model tests: 13/13 PASS (unit tests only).
- Production contract tests: 0/8 PASS.
- Supervisor/Worker production boundary: FAILED against intended contract.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
