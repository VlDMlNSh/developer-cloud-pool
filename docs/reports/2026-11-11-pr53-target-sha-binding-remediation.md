# PR #53 — target SHA binding remediation pass

- Date: 2026-11-11
- Scope: bounded code change on existing draft PR #53 branch; independently bind finalizer TARGET_SHA to immutable task envelope.
- Immutable source default before publication: \`Основной@c375fa981cd28ada403364d866fd788e098c9c2e\`.
- PR base: \`1be8672c1be1a720b6c813dcafff5c020b6456ae\`.
- Final PR #53 head after this pass: \`56cd2b9deff91d9308ed877965252f317222f597\`.
- Compare PR #37 base → PR #53 head: 31 ahead / 0 behind, 10 paths.
- PR #53 remains OPEN / DRAFT / UNMERGED; mergeable=true is only GitHub's mergeability signal, not qualification.

## Changes

1. Added \`extractTargetSha(body)\` to \`scripts/pool-finalizer.mjs\`.
   - Requires exactly one \`### Target SHA\` heading.
   - Requires the following value to be exactly 40 lowercase hexadecimal characters.
   - Rejects missing, duplicate and malformed target fields.
2. \`buildFinalizationPlan\` now requires \`expected.targetSha\` and compares it against the value parsed from the exact issue body whose SHA-256 digest is already validated.
3. \`scripts/pool-finalizer-runner.mjs\` passes \`TARGET_SHA\` into the independent finalizer validation.
4. Expanded \`tests/security/pool-finalizer-fencing.test.mjs\` from 9 to 11 tests, adding target-SHA mismatch and missing/duplicate/malformed-field rejection cases.

## Final source read-back

- \`scripts/pool-finalizer.mjs\`: blob \`d21e4dbeeacebd6f2bc1bfa1bbc5756b3baaa5ab\`.
- \`scripts/pool-finalizer-runner.mjs\`: blob \`50e7206a2aa1edf02550ed9428ce0b13ad8b8b17\`.
- \`tests/security/pool-finalizer-fencing.test.mjs\`: blob \`6b7fb8b07551c0fa20a7fd8efc57fdecdd940a08\`.
- PR API head read-back: \`56cd2b9deff91d9308ed877965252f317222f597\`.
- Source was re-fetched from the branch after the final updates; target binding is present in finalizer and runner, test file contains 11 test cases and no accidental escaped newline literals.

## Validation and limitations

- Exact-head PR-triggered workflow lookup for \`56cd2b9deff91d9308ed877965252f317222f597\` returned no runs: CI NOT VERIFIED. Tests were not executed in this pass.
- Formal PR #53 reviews: 0. Inline review threads: 0. Independent security review NOT RUN.
- This change resolves only the independent TARGET_SHA-to-envelope binding gap. It does NOT resolve F2's fundamental non-atomic GitHub label PATCH race.
- The finalizer still performs GET → validate → PATCH → read-back → POST comment. GitHub issue-label PATCH is not CAS; concurrent mutation can occur between read and write. The terminal label and audit comment remain separate operations without idempotent replay.
- No fake-transport runner harness was added in this pass.
- PR #53 remains DRAFT / NOT REVIEW-READY / NOT QUALIFIED. Do not claim race-free or exactly-once semantics.

## Explicitly unchanged

No default-branch runtime code, schema, workflow, permissions, secrets, credentials, dispatch gates, Worker execution, provider/model invocation, hosted D1 resource, deployment, merge, or branch-base refresh. Dispatch remains FAIL-CLOSED.

## Next bounded step

Add an injectable runner protocol function and fake-transport tests for: mutation between final GET and PATCH, lost PATCH response, terminal label success followed by comment failure/lost response, and idempotent audit reconciliation. Preserve the documented non-CAS limitation; do not treat tests as converting GitHub into a transactional authority. Exact-head CI and independent review remain mandatory.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
