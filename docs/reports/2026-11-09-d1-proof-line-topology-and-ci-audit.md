# 2026-11-09 — D1 proof-line topology and exact-head CI audit

Date: 2026-11-09 (Europe/Vilnius)

## Scope

Read-only qualification pass for Contour A's durable claim/fencing candidate. No source code, workflow, dispatch gate, secrets, cloud resources, billing, or deployment were changed. Immutable refs were re-read from GitHub.

## Current proof-line topology

The relevant local D1 proof work is a stacked series, not one integrated production implementation:

- [PR #36](https://github.com/VlDMlNSh/developer-cloud-pool/pull/36): single-use approval ledger. Current PR API head reported as `e11fc90e50bd20b166207af64551c49cfa80ffb4`; OPEN / DRAFT / UNMERGED.
- [PR #39](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39): atomic consume + transactional outbox, based on PR #36 proof branch. Head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; OPEN / DRAFT / UNMERGED. Its combined merge-tree CI run `42329993548` passed on merge tree `77b3ce30a3c90ad564db892cae82076b5c0774c9`; 19/19 Workers-runtime tests passed.
- [PR #40](https://github.com/VlDMlNSh/developer-cloud-pool/pull/40): canonical logical task identity and one task-level outbox. Head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; based on PR #39 head `ecc7193...`; OPEN / DRAFT / UNMERGED. Exact-head workflow `42489887940` COMPLETED / SUCCESS.
- [PR #49](https://github.com/VlDMlNSh/developer-cloud-pool/pull/49): immutable task attempts and audit event ledger. Head `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`; based on PR #40 head `2b7e30a...`; OPEN / DRAFT / UNMERGED. Exact-head D1 workflow runs `42492657024` and `42492663954` COMPLETED / SUCCESS. The documented suite count is 35/35.
- [PR #50](https://github.com/VlDMlNSh/developer-cloud-pool/pull/50): attempt finalization idempotency. Head `6e6870e5463f3f67e87a305112b208401d95022d`; based on PR #49 head `4ab0fdc...`; OPEN / DRAFT / UNMERGED. Exact-head push workflow `42495440869` COMPLETED / SUCCESS (35/35 per current proof-line notes). No PR-triggered merge-tree run was returned for this SHA; combined PR merge-tree validation is therefore NOT VERIFIED.
- [PR #51](https://github.com/VlDMlNSh/developer-cloud-pool/pull/51): indeterminate-attempt reconciliation queue. Head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; based on PR #49 head `4ab0fdc...`; OPEN / DRAFT / UNMERGED. Exact-head push workflow `42495716401` COMPLETED / SUCCESS (35/35 per current proof-line notes). No PR-triggered merge-tree run was returned for this SHA; combined PR merge-tree validation is therefore NOT VERIFIED.

The #49/#50/#51 stack is not yet a single qualified merge tree: #50 and #51 are sibling branches based on #49, and neither has a verified PR merge-tree result at its current head. Their separate push successes do not prove that the composed parent/child tree passes.

## Contour separation finding

[PR #52](https://github.com/VlDMlNSh/developer-cloud-pool/pull/52) is OPEN / DRAFT / UNMERGED at `c430fe4beecf93a20052f0c3efedb5f8539e4faa`, but its base is `feat/jarvis-hono-web-prototype-2026-11-06` at `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`. Its successful run `42507524428` is named **Jarvis Web Prototype Validation**. This branch is not an admissible Contour A integration parent: it is based on the Jarvis web prototype line (Contour B/product-facing work). Do not merge it into the Contour A proof stack or use its green CI as D1 fencing qualification. If its Workflow persistence proof is later reusable, extract/rebase it into a separately scoped A-only branch and rerun exact-head CI without importing product UI code.

## Governance and F2 boundary

- [PR #53](https://github.com/VlDMlNSh/developer-cloud-pool/pull/53) remains OPEN / DRAFT / UNMERGED at `b8a253f06418841d5f0250c9fd550bf3247db040`, based on PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`. Its exact-head Pool Contract and Reusable Worker Boundary runs `42513724707` and `42513724733` were previously verified SUCCESS. GitHub label PATCH remains non-CAS; F2 is PARTIALLY IMPLEMENTED, not closed.
- PRs #49–#53 currently have zero formal reviews each. PR #36/#39/#40 also remain drafts and no formal independent approval was established in this pass.
- Active ruleset ID `26550182` is active but configured for zero required approvals; it does not enforce the independent security gate. Independent review remains NOT RUN / NOT VERIFIED.
- Issue #38 remains OPEN. Its acceptance criteria still require a real-backend one-winner contention proof (at least 50 contenders), interrupted-claim recovery, least-privilege authority, independent review, and exact-head CI.
- The D1 evidence remains Workers-runtime/local Miniflare proof. No remote D1 database was provisioned or tested; hosted Cloudflare transaction/contention semantics and account Free/no-card entitlement remain NOT VERIFIED.

## Decision

Reuse the existing D1 proof line rather than recreate a ledger. However, do not merge or integrate it yet. First produce one A-only composed merge tree from the compatible #36 → #39 → #40 → #49 lineage, then layer #50 and #51 one at a time, run PR-triggered exact merge-tree CI for each, and independently review the resulting immutable heads. Keep the #52 Jarvis prototype branch outside Contour A. Only after those gates may a disposable remote D1 contention/recovery qualification be considered, and only after account eligibility and isolated resource scope are verified.

No dispatch, Worker/DSH execution, provider/model call, secret read, remote D1 operation, deployment, or resource creation occurred.

## Status

- Local D1 proof components: PARTIALLY VERIFIED at their stated immutable code heads.
- Composed D1 merge tree: NOT VERIFIED for current #50/#51 heads.
- Remote D1 qualification: NOT RUN.
- Independent security review: NOT RUN / NOT VERIFIED.
- F2: PARTIALLY IMPLEMENTED; non-CAS GitHub label race remains.
- Cloud Pool runtime: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Construct and validate an A-only composed merge tree from #36/#39/#40/#49, then add either #50 or #51 as a single child and require PR-triggered merge-tree CI at the exact head. Do not bring PR #52's Jarvis/Hono base into this tree. Keep all dispatch gates fail-closed.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
