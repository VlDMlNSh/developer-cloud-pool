# 2026-11-09 — trusted authority inventory for reconciliation

Date: 2026-11-09
Repository: VlDMlNSh/developer-cloud-pool
Scope: bounded, read-only source and governance audit. No runtime/code changes, dispatch, secret reads, provider calls, remote D1 access, deployment, or merge.

## Immutable targets and current refs

- Default branch `Основной`: HEAD `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Authorization design branch `design/integrated-pool-authorization-contract-2026-11-06`: HEAD `75c83a288d865f1bbeda4905cf817e00084bcc2d`.
- Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`, HEAD `d7dc1376ab644d5b8977b645135ec7eb1f7b8cbf`.
- PR #51: OPEN/DRAFT; head `32c88e50e173e6b19bc6c61723ab6474a3c08145`, base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #54: OPEN/DRAFT; head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, base `b9067dc7d06245893cd4e208f6215438efe5ca64`.
- Issue #38 remains OPEN.

## Evidence reviewed

1. Integrated authorization contract at design branch commit `75c83a288d865f1bbeda4905cf817e00084bcc2d`, file blob `efb2fa99346d8020361cb41c4fc03786da2e36be`.
2. Negative-first authorization contract tests at the same commit, blob `6bf7cf9583766fb57972a0b82ec27cc2b6e90eeb`.
3. Durable state/single-use authorization ADR at docs branch `d7dc1376ab644d5b8977b645135ec7eb1f7b8cbf`, blob `6dae6f90b078fd12ba8e9cf52151817c7adf93dd`.
4. Authorization composition addendum, blob `48e14fffcd2238b951cd3928721cbd82b9b37141`.
5. Comparative authorization integration audit, blob `fabfca632638eeafc9f2293c2f19ae5c3dedb125`.
6. Issue #38 body and comments. The issue explicitly records missing authenticated approval issuer/signature provenance, caller-supplied owner ID/time, and no production issuance/revocation/audit.
7. Active repository ruleset #26550182. It targets only `refs/heads/Основной`, requires a PR but zero approvals, has no required reviewers, and has review-thread resolution enabled. No tag-target ruleset is present in the current ruleset collection.

## Findings

### Existing authority candidate

The integrated authorization contract defines a concrete human approval authority: the repository owner, identified by immutable numeric GitHub user ID, acting through an owner-originated GitHub issue event/comment. The approval is bound to repository ID, issue number, owner ID, exact event/comment ID, immutable target SHA, fixed Worker profile, capability/policy digest, bounded resource scope, expiry, and canonical envelope digest. Supervisor must re-fetch canonical GitHub API evidence immediately before consumption and reject edited, deleted, expired, mismatched, or ambiguous evidence.

This is a plausible *human policy authority* for authorizing a new reconciliation decision. It is not a cryptographic issuer service, and the design branch is not merged or production-qualified. The current default-branch Supervisor/Worker remain legacy; do not treat the design contract as deployed behavior.

### Durable storage is not an issuer

The D1/Miniflare proof demonstrates local atomic single-use state and durable reconciliation records. It does not authenticate the writer or mint authority. The D1 adapter's caller-supplied owner/time values and the `resumable: true` boolean are not trusted capabilities. A ledger row written by an untrusted caller, a worker ID string, or a digest alone cannot establish issuer provenance.

The ADR correctly says authentication and authorization must be independently validated before ledger operations. D1 remains the preferred local proof candidate; account Free/no-card eligibility and remote integration are NOT VERIFIED.

### Reconciliation-specific disposition

Do not automatically resume, retry, abandon, or terminalize an indeterminate attempt based on lease expiry. The safest existing design direction is:
- transition to `needs-review` and retain immutable attempt/reconciliation evidence;
- require a *fresh* owner-originated approval with a new unique approval ID for any new action;
- bind that approval to exactly one repository/task/attempt/input digest/lease generation/expired owner/expiry/reconciliation ID/action/evidence digest;
- have a trusted Supervisor re-fetch and validate the owner event, then mint/consume an action-scoped single-use authorization in the durable ledger;
- reject replay, changed bindings, stale generation, missing external execution evidence, ambiguous storage, or issuer/revocation/quota lookup failure;
- keep every resolver result `dispatch: false` in the proof phase.

This avoids inventing a signing key or claiming that the D1 adapter is itself an authority. It also preserves the existing contract rule that a needs-review task requires fresh owner approval rather than reusing a consumed approval.

## Verification and limitations

- Source/design inventory: VERIFIED read-only.
- Existing owner-event authority contract: DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED.
- Production issuer/key registry: NOT FOUND in reviewed source tree; no trusted signing key/issuer registry or production capability-minting service is evidenced.
- D1 ledger: local Workers-runtime/Miniflare proof only; not an authenticated issuer.
- PR #51 exact-head workflow runs `42536377720` and `42536374566`: COMPLETED/SUCCESS at head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- PR #54 exact-head workflow run `42537241204`: COMPLETED/SUCCESS at head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Formal reviews for PR #51 and #54: empty; independent security review NOT VERIFIED.
- Repository ruleset does not require any approval; governance evidence is not equivalent to independent review.
- Hosted D1, live execution evidence, capability issuance/revocation/quota, and runtime integration: NOT RUN / NOT VERIFIED.

## Decision

Do not implement a fabricated cryptographic issuer or authorize the current caller-controlled resume flag. Adopt the owner-originated, fresh-approval path as the only existing authority candidate for further design, subject to a production Supervisor boundary and an independently enforced atomic single-use ledger. The authority candidate remains unqualified until implemented and reviewed on an exact head.

No dispatch, secrets, provider calls, Worker/DSH execution, remote D1, resource creation, deployment, merge, or settings changes.

## Next bounded step

Design a local-only reconciliation authorization adapter that accepts only a canonical owner-event evidence object produced by the Supervisor's trusted API read path, then atomically consumes a fresh action-scoped approval in the existing D1 ledger. Before implementation, map every required field to the existing approval envelope and schema, and identify the exact code path that can attest the event's numeric actor ID. If that path cannot be demonstrated, stop and keep `needs-review` manual. Add adversarial tests for missing/edited/deleted/expired approval, wrong actor/repository/attempt/generation/action, replay and concurrent consume. All outputs must remain `dispatch: false`.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
