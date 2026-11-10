# 2026-11-10 — Trusted reconciliation authority contract and backend comparison

## Immutable project refs checked

- Repository default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Active ruleset `26550182` applies to `refs/heads/Основной`; required approving reviews = 0, CODEOWNERS review disabled, review-thread resolution required, no bypass actors. It does not enforce independent review.
- PR #51: OPEN/DRAFT/UNMERGED; head `32c88e50e173e6b19bc6c61723ab6474a3c08145`, base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #56: OPEN/DRAFT/UNMERGED; head `0769b6b5d5eda9c7821804b93db21ded6e0985ef`, base PR #51 head.
- PR #52: OPEN/DRAFT/UNMERGED; head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`, base PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`.
- PR #52 exact-head Actions run `42507524428`, job `128813275338`: COMPLETED/SUCCESS; all enumerated steps completed successfully, including Cloudflare Workflow and D1 local proof. Formal reviews: 0; inline threads: 0.

## New contract

Created `docs/contracts/TRUSTED-RECONCILIATION-AUTHORITY-CONTRACT.md`.

Commit: `9f59fc858470b664ceef66b93cde11ea8001b954`.

The contract extends the shared immutable claim lifecycle with:
- immutable executor binding for GitHub Actions (`run_id`, exact `run_attempt`, repository ID, workflow ID/path, event, head SHA, reusable workflow refs/SHA) and Cloudflare Workflow (account, workflow, instance, version and input binding);
- read-only fixed-origin evidence adapters and explicit unresolved outcomes for missing, stale, rate-limited, contradictory or unknown responses;
- separate resolver capability bound to subject, audience, task/attempt/generation/envelope/executor digest, operation, expiry, jti, revocation epoch and policy version;
- destination-level idempotency/fencing and explicit side-effect reconciliation;
- conditional atomic state transition + append-only resolution receipt/outbox;
- threat model and adversarial qualification cases;
- explicit prohibition on resolver dispatch, retry, takeover, provider/model access, deployment and remote provisioning before qualification.

No code, workflow, permission, credential, secret or runtime resource was changed.

## Backend comparison and reuse-first conclusion

### GitHub Actions

The official workflow-runs REST resource exposes the native run and attempt metadata needed for an evidence adapter, including run ID, run_attempt, workflow ID, path, event, head SHA, status, conclusion and referenced workflows; the attempt-specific endpoint is available. The contract requires Actions read-only scope and exact tuple validation. A terminal run is not proof that downstream effects are absent. GitHub Actions is selected only as a read-only executor evidence source, not the claim store or resolver authority.

Official API: https://docs.github.com/en/rest/actions/workflow-runs

### Cloudflare Workflows

PR #52 reuses official Cloudflare Workers SDK Vitest fixtures and the official Workflow runtime. Exact-head CI passed. Its local proof includes:
- duplicate Workflow instance suppression by stable attempt/generation identity;
- D1 receipt deduplication after commit-then-failure retry;
- explicit restart behavior;
- one in-progress persisted-sleep recovery across abrupt local Wrangler/Workerd process termination and recreation.

This remains local Miniflare + synthetic D1 evidence. Hosted account semantics, regional failure, production retention, distributed contention, real binding identity and arbitrary downstream effect idempotency remain NOT VERIFIED. Official APIs expose instance identity/status and lifecycle controls. Critically, Cloudflare documents that `restart()` cancels in-progress steps and erases intermediate state; terminate/restart is not a reconciliation shortcut and cannot undo external side effects.

Official references:
- https://developers.cloudflare.com/api/resources/workflows/
- https://developers.cloudflare.com/workflows/build/workers-api/
- https://developers.cloudflare.com/workflows/build/trigger-workflows/

Reuse decision: retain Cloudflare Workflows as a candidate orchestrator and evidence source, not as the durable claim ledger. Reuse official SDK fixtures and APIs; do not build a custom workflow engine. No backend selected or provisioned.

## Important safety conclusions

- Lease expiry is not executor termination evidence.
- GitHub terminal conclusion or Cloudflare terminal status is not proof that no external side effect committed.
- A missing executor record is not evidence of successful completion.
- Resolver may record evidence and conditionally resolve the old attempt only; it cannot mint a new approval, create a new attempt or dispatch.
- A `SAFE_TO_RETRY_CANDIDATE` decision is eligibility evidence only. A new owner-approved immutable envelope and single-use claim remain required.
- PR #51 and #56 remain drafts. PR #51 must not be merged independently of #56 and combined-tree validation.
- No merge, dispatch, provider/model call, secret access, deployment, remote D1, Cloudflare account mutation, or paid resource used.

## Status and next bounded step

- Trusted reconciliation contract: CREATED / DOCUMENTED; implementation NOT RUN.
- GitHub Actions metadata fit: DOCUMENTED as read-only executor evidence.
- Cloudflare Workflows fit: DOCUMENTED as candidate orchestrator/evidence source; local proof only.
- Durable hosted State Authority: NOT SELECTED / NOT QUALIFIED.
- Independent review: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Contour A: NOT ACCEPTED; Contour B: DEFERRED.

Next: reconcile this contract against Issue #38 and the shared claim lifecycle contract, then design a read-only GitHub Actions evidence adapter contract/test fixtures (no token, no dispatch) before any resolver implementation. Keep the existing fail-closed boundary.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
