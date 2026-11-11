# Cross-PR evidence consistency audit — 2026-11-11

## Scope and immutable refs

Read-only reconciliation of the current draft documentation branches and proof PR metadata:
- PR #63 HEAD: `886f45ad52b914c938c1898c4d5e017183054a76`, base `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #64 HEAD: `95d237c753bec96abe9add621140928511047599`, base `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Working branch Context Window HEAD: `886f45ad52b914c938c1898c4d5e017183054a76`.
- Ruleset #26550182 is active on `refs/heads/Основной`, but requires zero approving reviews and has no required reviewers.

No code, runtime, schema, workflow, secret, permission, dispatch, hosted resource, deployment or merge action was performed.

## Findings

### 1. PR #63 contains a stale claim-recovery checkpoint

File `docs/checkpoints/2026-11-11-claim-recovery-source-test-checkpoint.md` still states:
- `acquireAttemptLease` accepts caller-controlled `resumable=true`;
- the PR #63 head is `7bd818...`.

Both are superseded by newer live evidence:
- PR #56 HEAD `0769b6b5d5eda9c7821804b93db21ded6e0985ef` removes the `resumable` parameter and restricts acquisition to a pending task with a prepared attempt.
- PR #63 current HEAD is `886f45ad52b914c938c1898c4d5e017183054a76`.

The checkpoint should preserve the historical finding but explicitly mark it superseded, not leave it as a current gap. The parallel legacy lease API, cross-API lifecycle gap and absence of trusted reconciliation resolver remain open.

### 2. PR #63 / #64 exact-head CI is still unverified

- PR #63 exact-head PR-triggered workflow runs: empty; combined status contexts: empty.
- PR #64 exact-head PR-triggered workflow runs: empty; combined status contexts: empty.
- Both remain OPEN / DRAFT / UNMERGED with no evidence of independent approval in the live state snapshot.

Empty results are NOT VERIFIED, not success.

### 3. PR #64 makes a valid D1 recommendation, but hosted qualification remains blocked

PR #64's issue #38 report documents:
- D1 as the smallest preferred hosted proof substrate because existing local Workers/D1 schema and tests can be reused;
- Workers Free/D1 published quotas and D1 batch transaction semantics;
- no account-specific Workers Free entitlement or quota evidence;
- no D1 database, Worker script or Durable Object namespace in the read-only account inventory;
- a required test topology with independent concurrent HTTP requests through a test-only Worker, not a sequential SQL batch;
- no provisioning authorization or hosted qualification.

This is a sound candidate decision, not a production backend selection. The separate hosted D1 boundary report also correctly identifies that PR #54's old stacked base must be reconciled to current default before a hosted test. No resource provisioning is authorized by this evidence.

### 4. Recovery Actor component reports agree on the authority gap

PR #63's source reports consistently distinguish:
- GitHub Actions OIDC as a potential upstream workload identity attestation, not the one-use Recovery Grant issuer;
- SPIFFE/SPIRE as operationally disproportionate without an accepted host/attestation need;
- Hydra/OPA/oauth4webapi as components that do not independently supply the consumer-specific one-use grant and atomic D1 transition;
- SOPS/age/Cosign as existing MediaHub component selections with bounded roles;
- OpenBao and immudb as candidates only, not selected deployed services;
- functional Security Audit and Privacy/Data Governance roles in draft target documents from actual named operational owners.

No accepted source establishes the issuer operator, trust custodian, principal/revocation registry, trusted-time service, audit sink operator, privacy/retention approver or recovery quorum. Therefore there is no authorized basis to implement or deploy a Recovery Actor issuer yet.

### 5. Governance is insufficient for independent acceptance

Ruleset #26550182 protects the default branch against deletion/non-fast-forward and requires PR/thread resolution, but approval count is zero, no required reviewers are configured and CODEOWNERS review is not required. It does not enforce an independent security approval gate. Do not equate branch protection with independent review.

## Required documentation correction

The source-to-test checkpoint is amended to preserve the old `resumable=true` issue as historical evidence and mark PR #56 as the current local correction. No code change is proposed.

## Next bounded action

1. Reconcile the complete local D1 proof stack (PR #39/#54 and dependent migrations) onto a fresh immutable head based on current default; rerun exact-head CI before any hosted test.
2. Do not provision D1 until account-specific Free entitlement, quota, ownership, permissions and an isolated no-production/no-dispatch topology are verified and authorized.
3. Keep issuer/trust/time/audit ownership unresolved; no Recovery Actor implementation until accepted operational owners and governance are evidenced.
4. Keep PR #63/#64 unmerged pending exact-head CI, independent review and documentation consistency checks.

## Status

- Documentation consistency correction: PLANNED in this report; no runtime changes.
- PR #56 takeover correction: local exact-head CI SUCCESS; integration NOT ACCEPTED.
- PR #63/#64 exact-head CI: NOT VERIFIED.
- Hosted D1: NOT RUN / NOT QUALIFIED.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
