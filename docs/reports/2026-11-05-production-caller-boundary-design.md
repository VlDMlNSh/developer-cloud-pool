# Cloud Pool engineering pass — 2026-11-05: production caller boundary design

## Immutable target and live state
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical branch: `Основной`, HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`; PR #12 OPEN / DRAFT / NOT MERGED.
- PR head at start of this pass: `91e157a0671b97a35a82d7f1a2df8ca325854aac`; base canonical HEAD.
- Branch ancestry: 30 commits ahead / 0 behind at previous compare; PR reports 33 commits (GitHub count may include merge-base accounting). Do not treat these counts as identical measures.
- No production workflow was modified in this pass.

## Exact-head CI
- Pool Contract Validation run [42024560920](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42024560920), job `127235402134`: COMPLETED / SUCCESS on PR head `91e157a0671b97a35a82d7f1a2df8ca325854aac`.
- Reusable Worker Context Fixture Caller run [42024561075](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42024561075), job `127235402611`: COMPLETED / SUCCESS on same PR head.
- Steps in contract job: dispatch-disabled assertion, YAML syntax parse, caller authorization tests, static pool contract validator.
- Fixture run completed all steps and emitted non-secret caller/callee context.
- These checks validate static contract and non-privileged fixture, not production dispatch authorization or runtime qualification.

## Live governance and review
- Ruleset `26550182`: ACTIVE, selector exactly `refs/heads/Основной`; PR required; required approvals = 0; CODEOWNERS review disabled; bypass actors empty.
- PR #12 remains DRAFT. Independent review submissions and review threads were empty at last query; independent security review NOT RUN.
- Issue #1 remains OPEN and documents owner CLI read-back of `POOL_DISPATCH_ENABLED=false` on 2026-11-04. No fresh variable read-back was performed in this pass; current setting is NOT VERIFIED by this pass.
- No Worker dispatch, DSH, Resource Probe, browser, Gemini, Claude, provider/model call, or paid fallback was run.

## Design finding
The current label `pool:ready` is not sufficient proof of owner identity or one-time approval. The current Worker checks `pool:claimed`, issue body SHA and profile, but does not validate approver identity or consume a unique approval reference. GitHub issue label mutation alone does not provide an obvious atomic compare-and-swap. This must be solved explicitly before replacing REST dispatch with static reusable invocation.
A separate design contract records the target topology, caller-context contract, least-privilege job boundaries, approval provenance, replay/race tests, and acceptance gates.

## Status
- Existing caller-context validator: IMPLEMENTED / TESTED in static CI, NOT WIRED to production.
- Production Worker `workflow_call` conversion: NOT IMPLEMENTED.
- Static Supervisor reusable invocation: NOT IMPLEMENTED.
- REST dispatch removal: NOT IMPLEMENTED.
- Single-use owner approval semantics: DESIGN BLOCKER / NOT QUALIFIED.
- Exact-head static CI for starting head: VERIFIED PASS.
- Independent review: NOT RUN.
- Current variable read-back: NOT VERIFIED in this pass.
- Runtime qualification: NOT QUALIFIED.
- PR #12: OPEN / DRAFT / NOT MERGED.
- Canonical branch unchanged.

## Next bounded step
Resolve the approval/consumption design using GitHub Free-compatible primitives and prove it against duplicate events, concurrency and crash/replay cases. Do not modify production Worker/Supervisor triggers until this contract has a testable single-use approval design and independent review. Then implement Worker `workflow_call` only + static Supervisor invocation as one atomic PR change, preserving dispatch disabled.
