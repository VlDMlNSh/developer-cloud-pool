# 2026-11-05 — reusable Worker caller-boundary specification

## Scope
One bounded architecture pass: reconcile live repository/PR state, inspect the default Worker and Supervisor, reject unsafe approval shortcuts, create a fresh implementation branch from the last verified canonical HEAD, and write a testable caller-trust contract. No runtime execution.

## Immutable target and branch
- Canonical base: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- New branch: `feat/reusable-worker-call-boundary-2026-11-05`.
- First documentation commit: `1555b17702f97327d264386289ae3fa75c4f5eda`.
- Compare against canonical base: `ahead 1 / behind 0`; merge base exactly equals canonical base.
- Contract blob SHA: `138953c1c0b09098b009f4da5f4da12df67c65a2`.
- Contract: [reusable Worker caller contract](../design/reusable-worker-caller-contract-2026-11-05.md).

## Live implementation findings
- Default Worker blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`: exposes `workflow_dispatch`; validation trusts open issue state, public `pool:claimed` label, target SHA and profile. No protected Supervisor caller proof.
- Default Supervisor blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`: performs REST workflow dispatch. It must be refactored together with Worker trigger semantics.
- Default contract validator blob `cfffb77905406d54505c711504a72ae1fafd3f06`: currently does not assert Worker caller identity.
- Existing PR #8 matrix builder source SHA `ac0012e8c52e02be6d29e007a5cf8a2aa09113a4` and tests SHA `f32fd0914b8c96588d977545ec5eb9e0b7133275`. It treats a caller-supplied approval-shaped object as verified. This is not proof of authority and must not be copied as an authorization gate.
- Existing PR #7 approval helper blob `9442c413c38dc28c67455362e254ff703bcfedd9` uses a public bot-authored comment marker. Per the owner's prior architecture decision, public comments/labels are not capabilities. Do not restore this approach.
- The repository issue #1 contains older governance and `POOL_DISPATCH_ENABLED=false` evidence from 2026-11-04. Current ruleset and variable state were not independently verified in this pass; treat current governance as NOT VERIFIED. Branch protection endpoint returned 403 to the connected integration.

## PRs
- PR #7 OPEN/DRAFT, head `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`, base `692025e4a039aaf94c6683bb95da38b4f324fce8`, 40 ahead / 1 behind canonical base; exact-head CI `41921293708` SUCCESS; independent review NOT RUN.
- PR #8 OPEN/DRAFT, head `0a8dba68aa12070b3768d6fb834bedf404ed5d99`, stale base `d60d26a...`, 19 ahead / 1 behind canonical base; exact-head CI NOT VERIFIED; independent review NOT RUN.
- PR #11 OPEN/DRAFT, head `7b3bd8d8840e122f03326299444a921e3ba5f425`, exact-head CI `41918209585` SUCCESS; independent review NOT RUN.
- No PR merged.

## Work completed
- Created a clean branch from the immutable canonical base.
- Authored a contract that separates untrusted task data from trusted caller identity, forbids actor/comment/label/caller-object shortcuts, specifies static reusable `workflow_call`, required caller context, bounded deterministic matrix, replay-safe lifecycle, negative/positive tests and acceptance gates.
- Re-read the new file and verified its blob SHA and branch ancestry.

## Not done / status
- No implementation workflow or runtime code changed.
- Worker caller authorization: BLOCKED / NOT IMPLEMENTED.
- Contract: DESIGN SPECIFIED, NOT IMPLEMENTED, NOT QUALIFIED.
- Gemini controller absent from default workflow tree; Gemini NOT RUN.
- No Worker, DSH, Resource Probe, browser, model/provider calls, or privileged dispatch.
- No secrets or variables accessed or changed; current `POOL_DISPATCH_ENABLED` NOT VERIFIED.
- No paid service or fallback used.
- Exact-head CI for this docs-only branch: NOT RUN (no implementation workflow path changed).
- Independent security review: NOT RUN.

## Next bounded step
Implement caller-context authorization as a pure module plus workflow static contract tests, first verifying the current GitHub reusable-workflow context semantics from official documentation. Then refactor Worker to `workflow_call` and Supervisor to a static reusable job. Keep dispatch disabled; require exact-head CI and independent review before runtime.
