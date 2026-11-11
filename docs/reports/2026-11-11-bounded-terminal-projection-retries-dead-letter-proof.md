# Bounded terminal projection retries and dead-letter proof — 2026-11-11

## Status

IMPLEMENTED / EXACT-HEAD PR CI VERIFIED / INDEPENDENT REVIEW NOT RUN. Local Workers-runtime D1 proof only. No hosted D1 qualification or production integration.

## Immutable target

- Base PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- Branch: `proof/projection-dead-letter-policy-2026-11-11`.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- Final exact head: `5c47cda4394d0381315bc16182799a09bf861797`.

## Implementation

- Added migration `0007_bound_projection_delivery_retries.sql`:
  - `retry_after_at`, `last_error_code`, `dead_lettered_at`, `dead_letter_reason` on projection outbox.
  - `reason_code` on append-only projection delivery events.
  - Retry-due index.
  - Status event captures original lease actor even after lease fields are cleared.
  - DB guards prevent attempt count above five, require evidence and no live lease for dead-letter transition, and make dead-letter rows terminal against all updates.
- Updated `projection-outbox.mjs`:
  - Maximum five delivery leases.
  - Exponential backoff: 30 / 60 / 120 / 240 seconds.
  - No acquisition before retry time.
  - Fifth failed attempt transitions to `dead_letter`.
  - Expired fifth lease can be dead-lettered only after expiry with matching worker and generation.
  - All responses retain `dispatch:false`.
- Added three Workers-runtime D1 tests for backoff/early reacquisition, fifth-failure dead-letter/no-requeue/database guards, and expired-fifth-lease recovery/stale generation rejection.

## Verification

- Final exact-head PR workflow: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42980783397
  - Job `130390442001`: COMPLETED / SUCCESS.
  - Dependency installation, syntax check, Workers-runtime tests, artifact upload all succeeded.
  - Test suite: 3 files / 53 tests passed.
- Final exact-head artifact `13837232801`, SHA-256 `7dbc1b8b34dcdf4d03868df27168857b250eed43f6798990419042c9fccb8ebc`.
- Push run `42980726317`, job `130390255572`, SUCCESS on parent SHA `48ec1876c7eb8a1702c945b233047da2b757c798`. Exact final head is covered by PR CI run above; no push run for final head was returned.
- An earlier revision `5b3b74fae4a70d7bb52fa874e60d60ba903af786` had one failing test assertion due SQLite trigger ordering. Corrected test now asserts terminal-state guard precedence and separately verifies the attempt-budget guard on a non-terminal row. Final exact-head PR CI passed.

## Limits and safety boundaries

- Local Miniflare/workerd only; no hosted D1 contention, account entitlement, quotas, backup/restore, or production identity.
- No real GitHub API sender, no secrets, no provider/model calls, no deployment, no production workflow wiring, no dispatch.
- Dead-letter is terminal for automatic projection delivery. It does not revert or replay the authoritative terminal task. Manual remediation requires a separately designed and authorized operator capability; no automatic requeue is implemented.
- PR #59 remains OPEN / DRAFT / UNMERGED. Independent reviews and inline review threads: 0.
- PR #58 remains OPEN / DRAFT / UNMERGED with no independent review.
- Issue #38 remains OPEN; durable single-use Supervisor claim authority and hosted contention are NOT QUALIFIED.
- PR #53 remains OPEN / DRAFT / UNMERGED; its production Supervisor split-write/non-CAS findings remain unresolved.
- Dispatch remains FAIL-CLOSED. Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B remains DEFERRED.

## Next bounded step

Independently audit PR #59 and PR #58 as a stacked change, focusing on migration ordering, retry-budget semantics, stale lease recovery, event provenance, and the manual dead-letter remediation boundary. Do not merge or connect a live sender before review and hosted D1 qualification.

## References

- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #58: https://github.com/VlDMlNSh/developer-cloud-pool/pull/58
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Durable outbox design: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/architecture/DURABLE-FINALIZATION-OUTBOX-DESIGN.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
