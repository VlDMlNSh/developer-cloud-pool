# Pass 78 — GitHub Actions workflow identity and event-SHA provenance audit (2026-11-25)

## Frozen target and scope

- Contour A only; Issue #140.
- Frozen default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Canonical D1 proof PR #170 head: `cfd123a6e622a71454b42a0314f9dee981ca5035`.
- PR #170 synthetic merge used by exact-head CI: `ab6ecf709c4c5f96912b7160caa348b8c89ce518`.
- PR #171 intake head: `423da55ca1e2d91c28572f88f60b494b59d56e9e`.
- Scope: read-only source/provenance audit and documentation update. No code, workflow, schema, dependency, secret, infrastructure or branch-protection changes.

## Reuse First

- Reused the existing canonical D1 implementation and the already-pinned Workers/Vitest/Miniflare harness (`@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`) as the established local proof surface.
- No additional OSS component or dependency was justified for this source-level identity audit.
- The existing GitHub Actions context contract is retained: event target SHA and workflow-code SHA are separate fields. No synthetic equality rule was added.

## Findings

1. **Correct separation already exists in the D1 binder.** In `proofs/d1-ledger/src/github-next-event.mjs` (blob `fdec14e9088fd1db186d0ee1541a6085ca84104a`), `context.sha` is bound to `targetSha`; `context.workflowSha` is bound separately to `workflowSha`. The binder validates both as 40-character lowercase hex values and does not require them to be equal.
2. **The unit test explicitly covers distinct SHA values.** `github-next-event.test.ts` (blob `a55733460d18974d8a965417ed6633a019fb4c5c`) accepts different target/workflow SHAs and asserts they remain distinct. This is correct at the adapter boundary.
3. **Workflow identity is not yet wired to a real default-branch controller.** The binder currently hardcodes `VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной`. The frozen default tree contains no `next-event-controller.yml` and no `next-request-intake.yml`; its workflow inventory contains only dsh-runtime-evaluation, pool-contract-validation, pool-supervisor, pool-worker and runner-resource-probe.
4. **PR #171 is a different, intentionally non-dispatching intake probe.** Its file is `.github/workflows/next-request-intake.yml` (blob `9402a803e21987b61813436647e43dac333c866c`). It has `permissions: {}`, no checkout, no external Actions, no D1 write and no dispatch. It emits an audit-only summary. It does not map the real Actions context into the D1 binder. Do not silently treat this probe as the future controller or change the binder's expected workflow identity to match it.
5. **Remaining trust gap is context provenance, not SHA equality.** Current tests supply synthetic context objects. No committed default-branch workflow presently proves that `workflowRef` and `workflowSha` are sourced directly from GitHub's trusted `github.workflow_ref` and `github.workflow_sha` contexts, nor that the event target SHA comes from the correct event context. Real workflow-to-adapter mapping remains NOT VERIFIED.
6. **Receipt replay semantics are intentionally stricter than digest identity.** The event digest omits run ID/attempt so the logical source-comment digest remains stable across reruns, while the immutable receipt comparison includes run ID/attempt and rejects a changed run tuple for the same comment. Existing integration tests explicitly assert this conflict behavior. Preserve this distinction; do not interpret a rerun as an exact receipt replay.

## CI and governance evidence

- PR #170 D1 run [45521582932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45521582932): COMPLETED/SUCCESS; job `138894501912` checked out exact synthetic merge `ab6ecf709c4c5f96912b7160caa348b8c89ce518` against current default `565404f84b6b86afb4dc2d8fa939341f42df6eca`. Existing suite: 8/8 files, 116/116 tests; `npm ci`, `npm run check`, `npm test` passed.
- PR #170 Pool Contract run [45521582953](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45521582953): COMPLETED/SUCCESS.
- PR #171 Pool Contract run [45448087868](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45448087868): COMPLETED/SUCCESS on head `423da55ca1e2d91c28572f88f60b494b59d56e9e`.
- PR #170 remains OPEN/DRAFT/UNMERGED, 0 formal reviews and 0 review threads. PR #171 remains OPEN/DRAFT/UNMERGED, 0 formal reviews and 0 review threads. No merge attempted.
- PR #170 metadata still reports base SHA `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; compare and exact CI log establish current default `565404f...` as the synthetic merge base. Reverify before integration.
- Ruleset `26550182` is active on `refs/heads/Основной`, no bypass actors, current user bypass `never`, required thread resolution true and required approvals 0. Branch API still reports `protected=false`; effective Contents-API enforcement remains NOT VERIFIED.
- PR #169 documentation PR now points to head `f31e6f8839f8e631ad6028aa540dbd99ee5ae795`; after the Pass 78 docs update it has 0 exact-head Actions runs, 0 formal reviews and 0 review threads, and GitHub reports `mergeable=false`. It remains OPEN/DRAFT/UNMERGED; its base SHA metadata remains stale at `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`. PR #172 lookup returned NOT_FOUND; no status is inferred for it.

## Metrics and safety

- Code/runtime/schema/workflow/dependency changes: 0.
- Documentation artifacts: 2 new files plus Context Window append.
- New tests: 0; existing D1 suite evidence remains 116/116.
- CI runs rechecked: 3 SUCCESS (two PR #170, one PR #171).
- Formal reviews: 0 on PRs #170 and #171.
- Actual active engineering time: NOT MEASURED; no reliable timer.
- Secrets read, Gemini/Claude dispatch, provider calls, hosted D1 writes, deployment, merge, production mutation: none.
- No independent review or external security qualification was performed.

## Status and next bounded step

- Source-level SHA-field separation: VERIFIED.
- Real GitHub Actions-to-D1 trusted context mapping: NOT VERIFIED.
- Live webhook authenticity, hosted D1, executor qualification, UI, routing, quota enforcement and persistent workspace restore: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next: define and implement the real no-dispatch controller contract only after selecting the canonical workflow filename and mapping `github.workflow_ref`, `github.workflow_sha`, event target SHA, run ID/attempt and comment ID from trusted Actions context. Add workflow-level tests proving those mappings; keep all dispatch/execution flags false. Obtain independent review before removing draft status.

## Evidence

- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- PR #171: https://github.com/VlDMlNSh/developer-cloud-pool/pull/171
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Pass 77 report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/reports/2026-11-25-pass77-d1-lease-recovery-fencing.md
- Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Final documentation-PR recheck

- After publishing this report/checkpoint/Context Window, PR #169 head advanced to `f31e6f8839f8e631ad6028aa540dbd99ee5ae795`.
- Exact-head Actions runs: 0; formal reviews: 0; review threads: 0; `mergeable=false`. Documentation PR integration is therefore NOT VERIFIED and remains draft/unmerged.
