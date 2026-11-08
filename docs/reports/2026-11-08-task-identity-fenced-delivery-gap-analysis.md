# Task Identity and Fenced Delivery Gap Analysis

Date: 2026-11-08
Status: DESIGN PUBLISHED; IMPLEMENTATION NOT RUN

## Immutable inputs and refreshed state

- Default branch: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #36: OPEN/DRAFT/UNMERGED; head `e11fc90e50bd20b166207af64551c49cfa80ffb4`; base default HEAD.
- PR #37: OPEN/DRAFT/UNMERGED; head `1be8672c1be1a720b6c813dcafff5c020b6456ae`; base default HEAD.
- PR #39: OPEN/DRAFT/UNMERGED; head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c` on PR #36 branch.
- Exact-head CI: PR #36 runs `42329438308` and `42329438351` SUCCESS; PR #37 runs `42484039940` and `42484039932` SUCCESS; PR #39 run `42329993548` SUCCESS.
- Reviews exist on all three PRs; no inline review threads were returned in the current read. This is not interpreted as an APPROVE or acceptance.
- Current claim/outbox migration blob: `44b8f7e0658296d287269770c5e91b1c3e25973c`.
- Current claim adapter blob: `96ee60a06e7d37b51b999829fa223eba7488d9e4`.
- Current behavioral test blob: `eb02a8edd0a748fb2c645457bded3be61dd87d60`.

## Finding

The current local proof establishes one claim/outbox pair per approval ID. It does not establish one active execution per logical task identity when two distinct approvals bind the same repository, issue, target SHA, and profile. Existing contention coverage uses one approval ID and cannot prove cross-approval task uniqueness.

## Bounded action completed

Created isolated branch `proof/task-identity-fencing-design-2026-11-08` directly from immutable PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`. Published design contract:

- `docs/contracts/TASK-IDENTITY-AND-FENCED-DELIVERY-PROOF.md`
- Commit: `1fd7acd77510ceab348dac4a191002677acbc811`

The contract defines versioned canonical task identity, separates task identity from approval envelope digest, specifies task-wide active uniqueness, multi-approval attachment, lease generation fencing, outbox idempotency, bounded recovery, and 15 behavioral tests. It explicitly retains `dispatch:false` and does not authorize production integration.

## Scope and limitations

- No implementation code, migration, test, workflow, secret, permission, resource, or deployment was changed.
- No Gemini/provider/model dispatch was attempted.
- No Cloudflare account, billing, secret, or token data was read.
- No test was run on the new design branch; its status is DESIGN, not VERIFIED.
- Local Workers/SQLite proof is not remote D1 qualification.
- PR #39 remains stacked on PR #36; the new branch is also based on PR #39 and is not integrated into default or PR #37.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next step

Implement the smallest local-only schema and behavioral proof on the isolated branch: two different approvals racing for the same logical task must result in exactly one active task and one logical outbox delivery, while approvals remain individually auditable. Then add lease acquire/reclaim generation and stale-worker rejection. Run exact-head CI and read back artifacts before any integration discussion.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
