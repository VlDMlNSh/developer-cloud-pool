# Pass 79 — bind GitHub triggering actor to the owner comment (2026-11-25)

## Frozen target and scope

- Contour A only; Issue #140.
- Default HEAD observed: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #170 branch: `integration/pass56-current-base-d1-2026-11-23`.
- Parent before pass: `cfd123a6e622a71454b42a0314f9dee981ca5035`.
- Final head: `8e853575a29ccd05cb8c6d22a74d44dd41465f44`.
- Exact D1 CI merge-result SHA: `fe0303d229efce42b37ef0c6dd283eefedf836c7` (merge of final head into default HEAD above).
- Scope: tighten event actor/comment identity binding, update unit/integration fixtures and document the future controller mapping requirement. No schema, migration, dependency, workflow, credential, hosted service or dispatch changes.

## Reuse First

- Reused the canonical D1 event binder, the existing official Cloudflare Workers Vitest/Miniflare test harness, and pinned dependencies already present in this PR (`@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`).
- No new dependency or alternative OSS controller was added. This pass does not qualify a real controller.

## Finding and implementation

The prior binder checked the comment author's identity but populated the persisted triggering actor identity from hardcoded owner constants. It therefore did not verify the actual Actions triggering actor against the comment author.

Changes:
1. `proofs/d1-ledger/src/github-next-event.mjs`: require `actorId` and `actorLogin`; compare both against the frozen owner and comment author; fail closed with `GITHUB_OWNER_ISSUE_PREDICATE_FAILED` on any mismatch; persist the validated actor values rather than constants.
2. `proofs/d1-ledger/test/github-next-event.test.ts`: add negative cases for mismatched triggering actor ID, actor login, and actor/comment identity.
3. `proofs/d1-ledger/test/github-next-event.integration.test.ts`: provide actor identity in the local D1 fixture.
4. `proofs/d1-ledger/README.md`: specify that the future controller must map `actorId` and `actorLogin` from trusted `github.actor_id` and `github.actor` contexts, never caller-supplied event data or repository variables.

The code change verifies values supplied to the binder; it does **not** prove a real workflow currently supplies them from trusted Actions context. That mapping remains NOT VERIFIED. All binder outcomes retain `dispatch:false` and `executionAuthorized:false`.

## Verification evidence

- Final PR head: `8e853575a29ccd05cb8c6d22a74d44dd41465f44`.
- D1 workflow run [45522771920](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45522771920): COMPLETED/SUCCESS; job `138898515578` checked out exact merge result `fe0303d229efce42b37ef0c6dd283eefedf836c7`, merging final PR head into default `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- D1 result: 8/8 test files, 119/119 tests PASS; `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, and `npm test` succeeded.
- Pool Contract run [45522771986](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45522771986): COMPLETED/SUCCESS; dispatch gate false, all six workflow YAML files parsed, workflow security invariants PASS.
- PR #170 remains OPEN/DRAFT/UNMERGED, GitHub reports mergeable true; formal reviews 0, review threads 0. No merge attempted.
- PR #170 base SHA metadata remains `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; default HEAD is `565404f84b6b86afb4dc2d8fa939341f42df6eca`. Compare against current default shows 34 ahead / 2 behind (merge base is old recorded base). Exact CI did synthesize against current default, but this ancestry discrepancy must be reconciled before merge.
- Ruleset `26550182`: active; zero bypass actors; current-user bypass `never`; required thread resolution true; required approvals 0. Branch API reports `protected=false` and protection disabled. Effective governance enforcement remains NOT VERIFIED.
- Source reread confirms the actor guard, bound actor fields, three negative cases, updated integration fixture and README mapping requirement.

## Metrics and safety

- Files changed: 4 (3 code/test files + README).
- New negative unit cases: 3.
- D1 tests: 119/119 PASS.
- CI runs: 2 SUCCESS on exact final head / exact merge result.
- Schema/migration/dependency/workflow changes: 0.
- Formal reviews: 0.
- Actual active engineering time: NOT MEASURED; no reliable timer.
- Defects introduced: 0 observed.
- Secrets read, Gemini/Claude dispatch, provider calls, hosted D1 writes, deployment, merge or production mutation: none.
- Independent security review: NOT RUN.

## Status and next bounded step

- Binder-level triggering-actor/comment-author comparison: VERIFIED by source and tests.
- Real workflow mapping from `github.actor_id` / `github.actor` plus event target SHA, workflow ref/SHA, run ID/attempt and comment ID into binder: NOT VERIFIED.
- Exact current-base ancestry/governance integration: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next: create the single canonical no-dispatch controller contract and tests that demonstrate trusted Actions-context mapping, while resolving the default-base/ruleset enforcement discrepancy. Do not add D1 or provider writes; keep dispatch and execution authorization false. Obtain independent review before removing draft status.

## Evidence

- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- D1 run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45522771920
- Pool Contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45522771986
- Pass 78: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/reports/2026-11-25-pass78-github-actions-provenance-audit.md
- Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
