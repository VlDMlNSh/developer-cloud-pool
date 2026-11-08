# D1 Attempt / Workflow proof composition audit

Date: 2026-11-09 (Europe/Vilnius)
Repository: https://github.com/VlDMlNSh/developer-cloud-pool
Scope: read-only audit of existing local D1 and Cloudflare Workflows proof branches; no implementation, deployment, remote database operation, dispatch, or credential access.

## Executive result

The repository already contains a substantial proof chain. Do not restart D1 implementation from zero. Reuse the local proof components, but do not merge or promote them as production-ready: they are split across draft stacked PRs, are not integrated with the Supervisor/Worker/Finalizer control path, and have not been qualified against a hosted Cloudflare account.

## Immutable references and exact-head CI

| PR | Head / tested tree | Evidence | Result |
|---|---|---|---|
| #36 | code head `9815da8fd316d8263b59f3493d076d4623c4c925` | [42274484200](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42274484200), [42274484234](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42274484234) | 13/13 local Workers-runtime tests; contract CI SUCCESS |
| #39 | tested merge tree `77b3ce30a3c90ad564db892cae82076b5c0774c9` (parent #36 + child #39) | [42329993548](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42329993548) | 19/19 local Workers-runtime tests SUCCESS |
| #40 | `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb` | [42489887940](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42489887940) | SUCCESS |
| #49 | `4ab0fdc4d649736a171faf95b9ab3a24b17217e8` | [42492657024](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42492657024), [42492663954](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42492663954) | 35/35 Workers-runtime D1 tests across the reported suites; SUCCESS |
| #50 | `6e6870e5463f3f67e87a305112b208401d95022d` | [42495440869](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495440869) | SUCCESS |
| #51 | `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7` | [42495716401](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495716401) | SUCCESS |
| #52 | current PR API head `c430fe4beecf93a20052f0c3efedb5f8539e4faa` | [42507524428](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42507524428) | SUCCESS; local Workflow in-progress process-recovery proof included |

PR #52's description also cites a later report-only SHA `1eb3be17d9146d57a4335b511804946e097651ae` and run `42506744722`, but the live PR API currently reports head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`. Use the current PR head and run `42507524428` as the current verified reference; do not silently treat the later report-only SHA as current PR head.

## Reusable proof components

- #36: conditional single-use approval consume, immutable input binding, replay rejection, concurrency, expiry, storage-unavailable and rollback tests.
- #39: transactionally couples approval consumption to task claim/outbox creation; deterministic retry; binding checks; rollback tests.
- #40: introduces canonical logical task identity, task-level uniqueness, multiple approval attachments, one task-level outbox, and an initial generation-fenced lease proof.
- #49: separates Task / Attempt / Lease; immutable attempt identity; attempt numbering; generation-bound lease acquisition/renewal/finalization; append-only audit events; indeterminate state.
- #50: exact terminal replay is accepted only when the immutable attempt projection and single terminal audit event match; conflicting replay is rejected.
- #51: creates a durable unique reconciliation queue record for indeterminate attempts; deliberately grants no automatic retry or lease takeover.
- #52: composes synthetic D1 receipts with an official Cloudflare Workflow step; proves local commit-then-timeout retry, duplicate trigger suppression, explicit Workflow restart behavior, completed instance persistence across local processes, and one in-progress Workflow recovery case after local process termination.

The proof harness follows the maintained Cloudflare Workers SDK Vitest/Workflow/D1 examples pinned in the proof plan at upstream commit `ab086218678b1bf311b158bcc6cb6b7437a7839`. This is preferable to inventing a new harness.

## Findings and open gates

1. **Local proof is not hosted qualification.** All D1 tests use local Workers-runtime / Miniflare. No remote D1 resource or Cloudflare account entitlement was tested. No deployment occurred.
2. **No control-plane integration.** These proofs are not wired into PR #37's Supervisor → reusable Worker → Finalizer path. PR #53 still uses GitHub Issue labels as a projection/claim mechanism; the documented PATCH race remains.
3. **Issuer and clock are not trusted.** The proof adapters accept caller-supplied identity/binding/time. Authenticated owner derivation, signed issuer provenance, trusted server time, revocation and key lifecycle are not established.
4. **Outbox is not execution.** Atomic task/outbox persistence is proven locally, but an outbox consumer, downstream idempotency contract, real executor effects, delivery reconciliation and end-to-end recovery are not qualified. Do not claim exactly-once external execution.
5. **Indeterminate is intentionally blocked.** #51 preserves reconciliation context but does not establish the authority that may clear uncertainty, reclaim a lease, or resume an executor.
6. **Open contract ambiguity — envelope digest vs logical task identity.** The #40 contract defines task identity from repository/issue/target SHA/profile and treats envelope digest as a separate per-approval authorization digest. Its test attaches two approvals with different envelope digests to the same task key/outbox. This is only safe if different digests are explicitly permitted to authorize the same immutable task payload. Because the Supervisor envelope digest binds the complete task Issue body, a changed body can otherwise attach to an existing task identity. Resolve this explicitly: reject digest conflicts for one active task, or define a versioned task revision that creates a distinct task identity. Add a negative concurrent test before integrating the contract.
7. **Governance remains insufficient.** Active ruleset `26550182` applies only to `refs/heads/Основной`; it requires a PR and resolved review threads, but `required_approving_review_count=0`, no required reviewers, and no required status-check rule. PR #37 has CHANGES_REQUESTED reviews; PR #53 has zero reviews. PRs #36/#39/#40/#49/#50/#51/#52 are OPEN/DRAFT/UNMERGED. The existing reviewer account is not verified as an authorized organizationally independent security approver.
8. **No dispatch authorization.** Keep both dispatch gates fail-closed. No Worker/DSH execution, provider/model call, secret read, production D1 operation or deployment was performed.

## Next bounded step

Resolve the envelope-digest/task-identity contract ambiguity in the existing #40/#49 proof lineage. Add a negative test for two distinct approvals on the same repository/issue/target SHA/profile but different task-envelope digests, and prove the selected policy (DENY conflict or explicit task revision) under concurrency. Then rerun exact-head D1 CI and read back the resulting schema/tests. Do not integrate into PR #37 or dispatch until trusted issuer/clock, independent security review, hosted free-tier qualification and the remaining delivery/recovery gates are satisfied.

## Current status

- Existing local D1 / Workflow proofs: VERIFIED only within their recorded local test scope.
- Hosted D1 / Cloudflare entitlement: NOT VERIFIED.
- Supervisor/Worker/Finalizer integration: NOT IMPLEMENTED / NOT VERIFIED.
- Independent authorized security acceptance: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
