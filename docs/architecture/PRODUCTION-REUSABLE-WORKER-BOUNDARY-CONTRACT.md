# Production reusable Worker boundary — design contract (2026-11-05)

## Status and scope
DESIGN ONLY. This document does not authorize workflow changes, dispatch, DSH execution, or production qualification. Target repository is `VlDMlNSh/developer-cloud-pool`; current PR #12 head at design start: `91e157a0671b97a35a82d7f1a2df8ca325854aac`; canonical base: `64d2636d4500127e635c214ccfb722c6b3fcda80`.

## Observed current topology
- Worker trigger is `workflow_dispatch` with caller-supplied issue number, target SHA and profile.
- Supervisor has `actions: write` and calls `POST /actions/workflows/pool-worker.yml/dispatches`.
- Worker validate job checks issue open state, `pool:claimed`, body SHA and profile. It does not prove who applied owner approval or consume a unique approval.
- Worker report job has `issues: write` and mutates task labels/comments.
- Caller validator checks repository, workflow ref, called workflow repository/path and same SHA, but is not wired into production.
- Fixture CI proves selected caller/callee context fields on a non-privileged local reusable workflow. It does not prove production authorization.

## Target topology
1. Supervisor remains the only externally triggerable orchestrator. It receives issue/schedule/workflow completion events, validates the task envelope and owner approval, then invokes Worker as a static local reusable workflow job:
   `uses: ./.github/workflows/pool-worker.yml`.
2. Worker exposes `workflow_call` only. Remove `workflow_dispatch` only in the same reviewed change that wires caller validation and converts Supervisor to static reusable invocation.
3. No REST workflow dispatch endpoint, dynamic workflow filename, arbitrary command, arbitrary profile, or user-controlled matrix.
4. Pass only typed inputs: task issue number, immutable target SHA, fixed profile identifier, and a single-use approval reference/nonce if its persistence and verification contract is implemented.
5. The reusable Worker validates its caller context before any privileged task action. It must fail closed on missing or unexpected context.
6. Keep job permissions isolated: validation gets issue read only; runtime gets contents read only and no issue write; report gets issue write only after validation success. Never expose report credentials to runtime.
7. Pin every external action to a full commit SHA. Local reusable workflow references are static same-repository references and are not external Actions.
8. Keep `POOL_DISPATCH_ENABLED` disabled until exact-head CI, independent review, governance read-back and a separately authorized runtime gate all pass.

## Approval semantics — unresolved design gate
A label is a queue state, not sufficient proof of owner identity or a one-time approval. The existing `pool:ready` -> `pool:claimed` transition does not prove who applied the label and is not a cryptographic nonce.
Before implementation, specify and test:
- The exact owner principal (stable GitHub numeric user ID, not display name).
- How approval actor identity and event time are retrieved from trusted GitHub event/timeline data, rather than caller-controlled issue text or a spoofable workflow input.
- A monotonic, single-use approval reference bound to issue number, target SHA, profile, repository and expiration.
- Atomic consumption/claim semantics under duplicate issue events, scheduled reconciliation and concurrent supervisor runs.
- Replay behavior after supervisor crash before/after reusable call; fail closed and require a fresh owner approval where consumption is ambiguous.
- How issue edits invalidate an approval if SHA/profile/task scope changes.
- Audit record containing approver numeric ID, approval event ID/time, immutable target SHA, profile, consuming supervisor run and reusable Worker run/job IDs.
- No use of actor/approved booleans passed as plain workflow inputs as authority.

GitHub Issues do not provide a native atomic compare-and-swap for labels. If the chosen approval/claim design cannot prove race-safe single-use consumption using supported GitHub Free primitives, do not claim single-use approval; retain dispatch disabled and redesign the queue state store or approval mechanism.

## Caller context contract
Required fields must be populated from GitHub contexts inside the called Worker, not passed as inputs:
- `github.repository` must equal `VlDMlNSh/developer-cloud-pool`.
- `github.workflow_ref` must identify the exact approved Supervisor workflow on `refs/heads/Основной`.
- `job.workflow_repository` must equal the same repository.
- `job.workflow_file_path` must equal `.github/workflows/pool-worker.yml`.
- Caller and called workflow SHA values must be valid 40-character lowercase hex and equal.
- The called workflow ref must be on the expected protected revision. Pull-request merge refs must not authorize production execution.
- Context-field semantics must be verified by a non-privileged fixture on the exact candidate workflow revision before enabling any runtime job.

## Required negative and race tests
- Missing/null/empty context; wrong repository/ref/path; malformed or mismatched SHA; PR merge ref; wrong profile; malformed issue/target SHA.
- Unapproved task; approval by non-owner; expired approval; approval invalidated by issue edit.
- Duplicate issue label events; two simultaneous Supervisor runs; duplicate scheduled reconciliation.
- Replay same approval reference after successful consumption; retry after Supervisor crash at each state transition.
- Worker called directly or from another workflow; caller/callee SHA mismatch.
- Validation failure must prevent runtime and report mutation; runtime must never receive issue-write token.
- Failure/timeout must move task to review without automatic execution retry.

## Acceptance gates
- Contract and tests reviewed independently.
- Static YAML and policy validator passes on exact PR head.
- Reusable fixture confirms actual production-equivalent context values.
- Production Worker is `workflow_call` only and caller validator runs before runtime.
- Supervisor invokes Worker statically; no REST dispatch code or `actions: write` permission remains unless a separately documented non-dispatch use is proven necessary.
- Approval provenance and replay/race tests pass.
- Active Ruleset requires independent approval (currently 0 approvals, therefore not satisfied).
- Current `POOL_DISPATCH_ENABLED` value is read back through an authorized settings API/CLI path and confirmed false until all gates close.
- Independent security review is recorded. Empty review list is NOT REVIEWED.
- No DSH/browser/model/provider execution until separately approved runtime qualification.

## Explicit non-goals
No 20-runner deployment, autoscaling, cross-repository dispatch, persistent browser, provider credentials, model calls, paid fallback, local server runtime, or general checkpoint/resume is authorized by this contract.
