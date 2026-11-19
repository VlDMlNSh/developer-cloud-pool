# Contour A — integrated implementation and acceptance runbook

Date: 2026-11-19
Baseline: `Основной` @ `68183828cf7934e89109310c8f99281be4eb7ed8`
Working branch: `docs/next-2026-11-19-profile-boundary-blocker`
Authority: Cloud Pool Contour A only. Contour B remains deferred.

## Executive decision

Contour A is not ready for acceptance. The repository contains substantial isolated proofs and implementation scaffolds, but they are not one integrated, operationally qualified system. The immediate critical path is to freeze the owner-defined CODE capability profile ID, then integrate one canonical D1 admission/task/lease lineage on a clean current-default base. Do not solve this by stacking old PRs or by enabling dispatch.

This runbook is an ordered execution plan, not a claim that its gates have passed.

## Work packages and dependency order

### A0 — Freeze the baseline and governance
- Re-read default branch, HEAD, open PR/Issue graph, exact-head CI, repository rulesets and workflow permissions before every implementation branch.
- Pin each engineering pass to an immutable target SHA and record parent SHAs.
- Keep production dispatch and execution authorization false. Do not inspect secret values.
- Reject old-base PRs as integration sources until their diffs are selectively transplanted and requalified.

Exit: a signed-off baseline record, no ambiguous branch ancestry, and verified fail-closed governance evidence.

### A1 — Freeze executor identity and capability profile
- Owner-authored contract must define the immutable CODE capability/profile ID, schema/version, allowed operations, sandbox class, resource limits, network policy, artifact policy and revocation semantics.
- Keep executor identity (for example, `claude-code-1`) separate from capability profile, provider route/account, host identity and lease owner.
- Do not infer the profile ID from Claude Code + ECC + FCC or the `.fcc` directory; do not reuse `dsh-headless-probe`.
- Once frozen, replace legacy profile references consistently at every authority boundary, including migrations, SQL constraints, validators, fixtures and tests. Require exact-match positive tests and rejection tests for legacy/unknown/disabled profiles.

Exit: an owner-authored immutable profile contract and a complete reference inventory; no arbitrary-string fallback.

### A2 — Integrate one canonical D1 lineage
- Use PR #67 `proofs/d1-ledger` migrations 0001–0010 and PR #72 migration 0011/composite adapter as the selected substrate; selectively transplant to a clean current-default branch because source branches are 81 commits behind.
- Reconcile PR #111 lease/attempt guard as migration 0012; never stack its independent migration root or PR #114/#125 admission schemas.
- Preserve one approval ledger, one logical task authority, one task-ready outbox, immutable attempts/events and one non-authorizing reconciliation queue.
- Resolve schema conflicts before coding: approval identity immutability; task/outbox uniqueness; duplicate legacy claim/outbox authority; qualification suspension state; attempt takeover semantics.
- Do not let caller-supplied booleans such as `resumable` authorize takeover.

Exit: one migration sequence, deterministic schema ownership, migration replay tests, and no duplicate authority stores.

### A3 — Compose trusted admission and durable lease
- Bind the event only to trusted GitHub Actions context: exact owner/repository numeric IDs, exact controlling Issue #96, exact `/next` source comment, event type, trusted default-branch ref/SHA, workflow SHA, run ID/attempt and source comment ID.
- Independently read current default-branch HEAD; never use one `GITHUB_SHA` value as proof of both task target and trusted current head.
- Make source-comment replay idempotent and verify the complete durable receipt/approval/task/attempt/outbox/registry chain on retry.
- Require a current unexpired lease and positive monotonic fencing generation before any attempt can enter running; stale generations cannot mutate state.
- Fail closed on ambiguous writes, partial outbox, approval reuse, duplicate admission, stale SHA, forged event context, expired lease and concurrent claims.

Exit: adversarial Workers-runtime tests pass on exact final SHA; all paths still return `dispatch:false` and `executionAuthorized:false`.

### A4 — Integrate the CODE worker sandbox and provenance
- Use the already assessed Anthropic defending-code-reference-harness isolation topology as the primary reference; adoption remains conditional on no-secret compatibility proof.
- Integrate a single executor caller only after the profile contract, registry assignment and sandbox contract agree.
- Treat GitHub Actions OIDC as workflow/job-principal authentication, not process or host attestation. Do not overstate it.
- Enforce no provider credentials by default, least-privilege GitHub permissions, bounded CPU/memory/time/storage, explicit network allowlist, ephemeral workspace, clean task profiles and deterministic cleanup.
- Verify provenance from immutable task envelope through executor, attempt, output bytes, digest, immutable artifact identity and D1 result/outbox reference.

Exit: isolated no-secret executor smoke and artifact provenance proof; no provider/model call required.

### A5 — Join the end-to-end control plane
- Wire owner-only intake → admission receipt → approval consumption → task/outbox → lease/attempt → sandbox execution → artifact ingest → result/outbox → reconciliation.
- Ensure every transition has one authority, idempotency key, durable state, audit event and recovery behavior.
- Remove or make inert legacy Supervisor/Worker and label-driven paths; no parallel dispatch authority.
- Prove restart/retry at every boundary, including crash after claim, after execution, after artifact write and before result commit.

Exit: one integrated local end-to-end trace with correlated IDs and fault-injection evidence. Dispatch remains disabled.

### A6 — Operational web interface and persistence
- Only after A5 is stable, deploy a non-production, no-secret preview using free-tier infrastructure.
- Verify phone/desktop browser access, authenticated owner boundary, task status, logs, artifact links, resumable state, expiry and audit visibility.
- Verify D1/R2 persistence and recovery with disposable test data; prove retention and deletion controls. No production user data.
- Measure free-tier resource ceilings and ensure no paid fallback or unbounded scheduled workload.

Exit: repeatable preview deployment and recorded mobile/desktop smoke evidence; costs/quotas remain within declared free-tier limits.

### A7 — Independent qualification and acceptance
- Run exact-head CI on the final integrated SHA: migrations, Workers-runtime adversarial suite, contract/security validators, sandbox tests, artifact integrity, UI smoke and recovery tests.
- Verify current ruleset, branch protections, workflow permissions, dispatch gate state and no-secret configuration without exposing secret values.
- Obtain independent security review and resolve all findings; formal PR reviews and exact-head checks must refer to the same final SHA.
- Publish a qualification dossier: architecture/data-flow, threat model, authority matrix, SBOM/dependency provenance, test matrix/results, CI run/job IDs, artifact digests, operational limits, rollback/recovery, known limitations and owner sign-off.
- Only then decide ACCEPTED. A green unit-test suite or successful preview alone is insufficient.

Exit: all mandatory gates VERIFIED/QUALIFIED and explicit owner acceptance. Until then Contour A remains BLOCKED / NOT ACCEPTED and Contour B remains DEFERRED.

## Acceptance matrix

| Capability | Evidence required | Current state at this pass |
|---|---|---|
| Trusted owner /next admission | Exact event binding + replay/concurrency adversarial tests | NOT VERIFIED |
| Canonical D1 schema | One current-base migration lineage and integrated adapters | BLOCKED by profile/schema reconciliation |
| Approval and lease fencing | Immutable approval identity, expiry, monotonic fencing, crash recovery | Partial isolated proof; NOT INTEGRATED |
| CODE executor profile | Owner-authored immutable profile contract and exact registry binding | BLOCKED |
| Sandbox execution | No-secret compatibility proof, bounded ephemeral worker, provenance | NOT QUALIFIED |
| Artifact integrity | Digest over received bytes + immutable object identity + D1 binding | Partial local R2/D1 proof; NOT QUALIFIED |
| Web interface | Authenticated phone/desktop preview + persistent task state | NOT VERIFIED |
| Model/provider routing | Explicit account/quota identity and no paid fallback | NOT QUALIFIED; provider calls NOT RUN |
| Governance/security | Current ruleset, exact-head CI, independent review, dispatch disabled | PARTIAL / NOT VERIFIED |
| Recovery/operations | Fault-injection, reconciliation, retention, rollback, cost limits | PARTIAL / NOT VERIFIED |

## Immediate next engineering pass

1. Obtain the owner-authored immutable CODE profile ID and its capability contract.
2. Re-read `Основной` HEAD and the latest heads/CI for PRs #141–#144.
3. Create one clean-base implementation branch from that exact HEAD.
4. Port the canonical PR #67/#72 migration lineage, reconcile migration 0012 and the PR #143 lease/attempt implementation, and remove competing authority paths.
5. Implement negative-first tests before wiring any executor.
6. Run exact-head CI, publish evidence and update Context Window/checkpoint.
7. Keep all live dispatch, provider calls, hosted production writes, deployment and merge disabled until separately qualified and authorized.

## Current evidence and limits

- Default HEAD observed: `68183828cf7934e89109310c8f99281be4eb7ed8`.
- PR #143 isolated D1 proof exact head: `d35185f95c96f9e53c3cb8fca269ed4bd435129c`; reported CI runs `44361564243` (62/62 tests) and `44361564253` (contract validation) succeeded on that isolated proof.
- PR #144 is documentation-only; its latest recorded head `610290c1fb3b3c3e89fb951ef00beae266aef32f` has no workflow runs or combined statuses returned by the available read interface. Exact-head CI is NOT VERIFIED.
- No hosted D1, provider calls, secrets, dispatch, deployment, merge or independent review are established by this pass.

Canonical MediaHub map (separate project; not in scope before Contour A acceptance): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
