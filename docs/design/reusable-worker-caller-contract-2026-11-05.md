# Reusable Worker caller contract — implementation specification

Status: DESIGN CONTRACT / NOT IMPLEMENTED / NOT QUALIFIED
Target base: `64d2636d4500127e635c214ccfb722c6b3fcda80`

## Purpose
Replace the Worker `workflow_dispatch` entry point and Supervisor REST dispatch with a reusable workflow called only by a statically declared job in the protected default-branch Supervisor. This is an issuer/caller-authentication change, not merely a trigger syntax change.

## Trust boundary
The Worker MUST NOT infer Supervisor authority from:
- `github.actor` or `github.triggering_actor`;
- public issue labels, comments, issue body fields, or bot-authored marker comments;
- a caller-supplied boolean, approval object, `supervisor_run` input, or run ID;
- the fact that a workflow was started by GitHub Actions.

A task envelope is untrusted data. Approval is not established by parsing that envelope.

## Invocation contract
1. Worker declares `on.workflow_call`; it has no `workflow_dispatch` trigger.
2. Supervisor declares the reusable Worker as a static downstream job with `uses: ./.github/workflows/pool-worker.yml` (or a pinned same-repository reusable workflow reference if local-call constraints require it).
3. The call is structurally present in the protected Supervisor default-branch workflow; no REST dispatch API or dynamically selected workflow path is used.
4. The reusable Worker validates the actual caller context against constants:
   - `github.workflow_ref`;
   - `github.workflow_sha`;
   - `job.workflow_repository`;
   - `job.workflow_file_path`;
   - `job.workflow_sha`.
5. The expected repository, workflow path, protected ref and approved workflow SHA are pinned/derived from the reviewed deployment contract. A feature-branch caller, fork, different repository, wrong path, or unexpected SHA is rejected.
6. Because context availability and semantics differ between caller and called workflow, implementation must verify each context's documented availability in reusable workflows and must fail closed when any required value is absent. Do not substitute actor identity.

## Planning and matrix contract
- Extract a pure, deterministic planner with no network, filesystem, or dispatch side effects.
- Input records are untrusted candidate data. The planner may validate shape, issue state, task schema, immutable 40-hex target SHA and allowlisted profile; it cannot authenticate an approval merely because an object says `verified: true`.
- Trusted approval evidence must be acquired and checked inside the protected Supervisor execution, not supplied by a caller-controlled input or public comment.
- Matrix size is 0..20; reject over-limit input, duplicate issue numbers, malformed records, unsupported profiles and inconsistent target SHA.
- Stable ordering and deterministic output are required.
- A matrix output is not authority by itself; Worker revalidates caller context and task envelope.

## Lifecycle and recovery
- Specify claim/approval consumption before enabling any dispatch. Approval consumption must be single-use and replay-safe.
- Preserve idempotency across retries and workflow re-runs.
- Model partial matrix completion, cancellation, timeout, validation failure and terminal result collection.
- Recovery must never silently re-authorize an expired or consumed approval. Return ambiguous tasks to owner review, not automatic execution.
- Keep a strict upper bound of 20 tasks per Supervisor cycle.

## Permissions and runtime restrictions
- Keep `POOL_DISPATCH_ENABLED` fail-closed and do not run Worker, DSH, browser or provider workloads during implementation.
- Use least-privilege permissions at workflow and job scope.
- Runtime probe job receives no repository secrets and does not persist checkout credentials.
- No paid fallback, persistent runner, external browser host, or secret-bearing artifact.

## Required tests
Positive:
- exact protected Supervisor workflow identity accepted;
- expected repository/path/ref/SHA tuple accepted;
- deterministic bounded matrix with 0 and 20 tasks.

Negative:
- direct/manual Worker dispatch trigger absent;
- feature-branch caller rejected;
- wrong repository, workflow path, workflow ref, workflow SHA and job workflow SHA rejected;
- missing context rejected;
- public labels/comments and actor identity alone do not grant authority;
- forged caller-supplied approval object rejected;
- duplicate issue, invalid issue state, malformed SHA, unsupported profile, >20 tasks rejected;
- consumed/revoked approval replay rejected;
- partial completion/cancellation/timeout recovery never silently re-dispatches.

## Acceptance gates
1. Contract tests and YAML/static validation pass on exact head.
2. Independent security review verifies caller context semantics against current GitHub documentation and implementation.
3. Exact-head CI succeeds.
4. Governance evidence for the default branch is current and independently verified.
5. Only after all gates may the owner separately authorize a read-only, isolated runtime probe. Production dispatch remains a separate acceptance decision.

## Current state
The default Worker still exposes `workflow_dispatch` and validates public issue metadata. The default Supervisor still uses REST dispatch. This document is a design contract only; no authorization boundary has been changed.
