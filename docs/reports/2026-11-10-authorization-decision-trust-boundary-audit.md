# 2026-11-10 — Authorization decision model trust-boundary audit

## Scope and immutable target

- Audit date: 2026-11-10.
- Audited branch: `fix/integrated-pool-authorization-2026-11-06`.
- Immutable head: `43f48f9f4d0947f102b5f0c3170ee05186fe90e0`.
- PR: #34, OPEN / DRAFT / UNMERGED; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Source blob: `src/pool/authorization-decision.mjs` = `a6238f64b826de80af2f17d64fb30c2837c746a8`.
- Test blob: `tests/security/pool-authorization-decision.test.mjs` = `9811eed0c75f24e79bdf4f4627a0dfe7968117c2`.
- This was a read-only audit of source, PR metadata and historical exact-head checks. No source/runtime/workflow/secrets/variables/dispatch/provider/deployment/merge changes.

## Live state recheck

- Default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation branch `docs/cross-chat-continuation-2026-11-06`: `1fd21a241d1ed83f91178628a01fb1d431433baf`.
- PR #34 exact-head run `42267827757`: workflow syntax/security invariants SUCCESS.
- PR #34 exact-head run `42267827737`: production authorization boundary test FAILED.
- PR #34 formal reviews: empty. PR is still DRAFT and targets older base `197ba98d...`, not current default HEAD.
- PR #32 remains OPEN/DRAFT at authorization design head `75c83a288d865f1bbeda4905cf817e00084bcc2d`.
- Default HEAD scheduled Supervisor run `42742607594` SUCCESS is heartbeat evidence only; it does not qualify dispatch or owner-event provenance.
- Existing active branch ruleset still requires PR but zero approvals / no required reviewers.

## Reused implementation found — do not duplicate

The existing branch already contains a pure decision model and negative tests. Reuse it as a starting point rather than creating a second competing decision module.

The model validates caller repository/workflow identity, target SHA, presence of approvalEventId, task state/profile and a consume result. Denial branches return `dispatch: false` and `pool:needs-review`.

## Critical trust-boundary finding

The positive branch in `decidePoolAuthorization(input)` currently accepts a plain caller-provided object:

- `consume.status === "created"`
- `consume.markerApprovalEventId === task.approvalEventId`

It then returns `ALLOW_ONCE` with `dispatch: true`.

There is no cryptographic/opaque provenance, no unforgeable adapter receipt, no re-fetch evidence, and no attestation that this consume result came from the real durable D1 adapter. The function itself explicitly does not perform GitHub API calls or consume approvals. The positive unit test constructs this object directly and expects dispatch true.

Therefore a caller can synthesize the exact shape and pass the decision boundary without any real consume. This is a design-level trust defect, not a demonstrated production exploit. It means the module must not be wired to production dispatch and its positive test must not be treated as security qualification.

The production Supervisor remains separately deficient: it does not currently authenticate the numeric owner ID or exact owner-originated approval event/comment, as documented in the previous 2026-11-10 owner-event mapping report.

## CI interpretation

- Syntax/security invariant check passed.
- Production-source boundary check failed on the PR head. Exact failing assertions must be inspected from the run log before assigning a precise root cause to that workflow failure.
- No formal independent review exists.
- No check here qualifies a production deployment or actual D1 consume path.

## Required correction — bounded next implementation

Do not create another parallel decision module. Revise the existing contract before any integration:

1. Split the pure policy decision from trusted evidence acquisition.
2. Treat all raw caller-provided `consume`, owner IDs, event IDs, timestamps, digests and `verified: true` flags as untrusted.
3. Introduce a narrow adapter contract that obtains canonical GitHub owner identity and exact event/comment evidence from GitHub API itself, with pagination and edit/delete/ambiguity handling. No public API should let a caller manufacture a trusted receipt.
4. Until that adapter and real single-use consume are implemented and independently verified, the model must return `dispatch: false` for every input, including apparently successful consume-shaped objects.
5. Add negative-first tests proving forged consume receipts, forged owner IDs, forged event IDs, edited/deleted evidence, expired approval, pagination truncation, API failures and ambiguous writes all deny and produce `pool:needs-review`.
6. Only after the adapter and D1 consume are integrated should a narrowly scoped positive-path test be considered. It must exercise the actual adapter/store boundary, not manually constructed success-shaped data.
7. Rebase the chosen branch against current default only after preserving immutable source evidence; do not merge the stale PR wholesale.

No need to introduce an external identity product: repository owner identity is GitHub-specific, so canonical GitHub API evidence is the appropriate source. Reuse existing Node test harness, pinned Actions and D1 proof infrastructure, while keeping the D1 proof local-only.

## Status

- Existing model/source inventory: VERIFIED.
- Model's negative branches: source-inspected; CI history shows test suite workflow failed overall, exact failing assertions NOT YET INSPECTED.
- Positive consume trust boundary: BLOCKED / unsafe for production integration.
- Canonical owner-event adapter: NOT IMPLEMENTED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
