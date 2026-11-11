# 2026-11-11 — Projection recovery capability boundary review

## Snapshot and immutable references

- Repository: `VlDMlNSh/developer-cloud-pool`; default branch: `Основной`.
- Observed default HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #60 design branch: `design/projection-recovery-actor-contract-2026-11-11`.
- PR #60 base: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #60 HEAD after this pass: `94c41364d50c2746c1e72874701637ea3ec54def`.
- ADR blob after readback: `59a4be21516da0e005114acfe015aee7787524dc`.
- Shared Trusted Reconciliation contract blob: `32bce214a8a3577584f058fb5679b8cecf5f3309`.
- Shared Immutable Claim Lifecycle contract blob: `595da5bdaf832a48e032eb51a283e2456943b248`.

## Current PR evidence

- PR #58: OPEN / DRAFT / UNMERGED; exact-head run `42979949181` SUCCESS. Fake-GitHub/local proof only.
- PR #59: OPEN / DRAFT / UNMERGED; exact-head run `42981807825` SUCCESS for head `22200226da4f1af30645cf441a639db6893e9310`, 53 local D1 tests. No reviews/threads.
- PR #60: OPEN / DRAFT / UNMERGED; new head `94c41364d50c2746c1e72874701637ea3ec54def`; no workflow run returned for exact head; reviews 0, inline threads 0.
- Issue #38 remains OPEN. The issue still requires durable single-use task claims and independent review before dispatch.

## Review finding

The PR #60 ADR already correctly distinguishes task Resolver authority from projection-outbox recovery authority, requires a distinct audience/subject/operation/outbox binding, atomic nonce consumption, trusted time, exact generation fencing, and terminal-only behavior.

A remaining implementation ambiguity was the phrase "verified grant object". A plain JavaScript object, JSON payload, TypeScript interface, or caller-supplied `verified: true` field is forgeable and does not establish authentication. The design did not yet state a concrete runtime boundary preventing an untrusted route/request from constructing a grant-shaped object or invoking the storage transition directly.

## Bounded design refinement

Added Section 13 to the ADR, requiring before implementation:

1. Either verify signed grant bytes at the storage entrypoint, or pass an opaque in-process capability minted only by a trusted verifier; TypeScript branding alone is insufficient.
2. Explicit issuer/key-version/algorithm allowlist, rotation/revocation and policy-epoch checks.
3. Signature coverage of the full immutable grant binding, including event digest and nonce.
4. Actor identity derived only from the verified grant, never caller request fields.
5. Recovery reachable only through a trusted composition root; no public JSON/RPC/browser path to the storage transition.
6. D1 binding remains server-side; inventory all Workers/scripts holding it. A second Worker with the same D1 binding is not a database privilege boundary.
7. Database-enforced unique nonce namespace and atomic nonce consumption + outbox transition + audit event.
8. Audit receipt records issuer, subject, key version, policy epoch, grant digest, nonce hash, original lease owner, generation and trusted timestamp; never store raw signed grants or credentials.

The section explicitly leaves signing format, key custody, issuer operator, Worker topology and account-level isolation unresolved. No authority or runtime permission was created.

## Validation and boundaries

- ADR update read back from PR #60 branch and blob SHA verified.
- PR #60 exact-head CI: NOT RUN / NOT VERIFIED (documentation-only change).
- PR #60 independent review: NOT RUN.
- No code/schema/workflow/permission changes; no D1 or Worker provisioning; no secret access; no dispatch; no Gemini/model/provider call; no paid resource.
- Projection recovery implementation: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B remains deferred.

## Next step

Follow the current Context Window's deployment-planning gate: compare the existing Hono + Workers Static Assets web-console candidate with the minimal Worker + D1 Supervisor runtime; define the smallest free-only first deployment slice, exact quotas, authority boundaries, rollback and stop conditions. Owner-reported Free plan label may guide planning only; do not provision until exact account eligibility, limits and governance are verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
