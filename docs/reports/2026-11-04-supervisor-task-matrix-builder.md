# 2026-11-04 — Bounded Supervisor Task Matrix Builder

## Scope and immutable base
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Implementation branch: `feat/supervisor-task-matrix-builder-2026-11-04`.
- Base is PR #7 branch at `d60d26ae647940e702d646e572c861a8f68f523e`.
- New PR: [#8](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8), targeting PR #7 branch. PR #8 is OPEN / DRAFT / NOT MERGED.

## Implementation
Added two isolated files:
- `scripts/pool-task-matrix.mjs`: pure, side-effect-free matrix builder.
- `scripts/pool-task-matrix.test.mjs`: nine Node.js regression tests.

The builder requires each candidate to have:
- a valid positive issue number;
- an open non-PR issue;
- `pool:ready` label;
- exact 40-character lowercase target SHA;
- exact allowlisted profile `DSH headless probe`;
- a matching approval envelope (`issueNumber`, `targetSha`, `profile`) supplied by the caller.

It rejects duplicate issue numbers, malformed envelopes, missing/mismatched approvals, invalid bounds, and candidate counts above the configured limit. The hard upper bound is 20. Output is a deterministic `{ include: [...] }` matrix with normalized profile `dsh-headless-probe`.

## Verification
- Local Node.js test execution: **9 passed / 0 failed**.
- Exact GitHub read-back completed.
- Module blob SHA: `ac0012e8c52e02be6d29e007a5cf8a2aa09113a4`.
- Test blob SHA: `f32fd0914b8c96588d977545ec5eb9e0b7133275`.
- PR #8 head: `0a8dba68aa12070b3768d6fb834bedf404ed5d99`.
- PR #8 exact-head workflow runs: empty; combined status contexts: empty. CI = **NOT VERIFIED**.
- Independent review submissions: empty; review = **NOT RUN**.
- PR #8 mergeable flag returned false at creation; do not infer mergeability or acceptance.

## Security boundaries and limitations
- This component does not perform I/O and does not dispatch workflows.
- Approval authenticity is not independently established by the matrix builder. The caller must obtain the approval envelope using the trusted `pool-approval.mjs` verification path. Passing arbitrary fabricated approval objects from an untrusted caller would invalidate this boundary.
- The builder is not wired into Supervisor; no workflow orchestration or recovery behavior changed.
- No Worker, DSH, Resource Probe, browser, model/provider call, secret access, paid fallback, or repository variable mutation occurred.
- `POOL_DISPATCH_ENABLED` remains NOT VERIFIED in this pass.
- PR #7's direct `workflow_dispatch` authorization gap remains BLOCKING; this helper does not fix it.

## Next bounded step
Design and test a pure Supervisor planner that obtains the approval marker through `hasOwnerApproval`, produces the typed candidates for this builder, and defines atomic claim/consume ordering and per-matrix terminal recovery. Then add workflow-level integration only after the reusable Worker caller-provenance design is independently reviewed. Keep dispatch disabled.
