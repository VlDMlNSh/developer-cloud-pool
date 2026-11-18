# Pass 6 — CODE executor profile boundary and D1 integration readiness

Date: 2026-11-19
Immutable audit target: `68183828cf7934e89109310c8f99281be4eb7ed8`
Working documentation branch: `docs/next-2026-11-19-profile-boundary-blocker`
Scope: read-only GitHub source/metadata/CI inspection followed by documentation-only checkpoint. No runtime or schema code changed.

## Current repository observation

- Recent commit search returned `68183828cf7934e89109310c8f99281be4eb7ed8` as the newest commit on the default history; commit time 2026-11-18T14:56:09Z.
- Default branch is `Основной`.
- Context Window blob read from default: `626a0b055682068a087bd422c7e741d39ba9e380`; its header still reports a November 8 refresh and a much older HEAD. It is stale and needs this appended correction.
- Issue #140 remains OPEN. Its comments record the schema collision audit, the refined ancestry decision, 16 legacy profile literals across 14 files in the PR #72 package, and the missing canonical CODE profile identifier.
- PR #141 is an OPEN documentation/audit candidate. PR #142 is a draft integration plan. PR #143 is an isolated current-base D1 ledger proof. No merge is claimed.
- PR #143 exact SHA `d35185f95c96f9e53c3cb8fca269ed4bd435129c`: Isolated D1 Ledger Proof run `44361564243` SUCCESS and Pool Contract Validation run `44361564253` SUCCESS. D1 run job `135004056043`; contract job `135004082047`. This validates that isolated proof only.

## Canonical lineage decision

Use PR #67's `proofs/d1-ledger` migration lineage (0001–0010) plus PR #72's additive migration 0011/composite admission adapter as the single source substrate. Do not stack PR #111's independent migration root or PR #114/#125's separate `proofs/d1-admission` schema.

PR #67/#72 are 81 commits behind the audited default and must be selectively transplanted and requalified on a clean current-base branch. PR #111's running-attempt guard must be reconciled as migration 0012, not copied as migration 0006 because 0006 already has a different meaning in #67.

The earlier collision findings remain valid: competing approval-ledger schemas, incompatible outbox keys/events, divergent task schemas and duplicate delivery paths. Preserve one logical task authority, one task-ready outbox authority, immutable attempts/events and a non-authorizing reconciliation queue.

## Hard blocker — exact CODE profile ID

The repository describes the frozen first executor as Claude Code + ECC + FCC, but the retrieved evidence does not define an owner-authored immutable D1 capability/profile identifier. The `.fcc` directory is a filesystem path, not a profile ID. The legacy `dsh-headless-probe` identifier must not be reused.

A bounded scan of PR #72's 39-file D1 package found 16 literal legacy-profile references in 14 files. They span approval, qualification, admission, claim, consume and projection/test boundaries. A blind replacement is unsafe.

Therefore:
- Do not modify profile-bound SQL constraints, validators, fixtures or tests until the exact immutable CODE profile ID is present in an owner-authored contract or explicit owner decision.
- Do not invent a slug, infer it from a directory name, or widen validation to arbitrary strings.
- Once defined, replace the legacy profile consistently and add positive exact-match plus negative legacy-profile tests at every authority boundary.

## Additional integration risks recorded by the source audit

- Migration 0011 does not freeze every approval identity column with a database-level immutability guard.
- The normative contract names a suspended qualification state, while the inspected route status supports qualified/revoked only.
- The lower-level legacy claim/outbox path remains present alongside the task-ready path; its non-authoritative status/removal must be explicit and tested.
- Caller-supplied `resumable` must not authorize takeover of an indeterminate attempt.
- The trusted current-default SHA must be independently read; `GITHUB_SHA` cannot simultaneously prove both target and trusted current default head.
- Local synthetic Workers-runtime tests do not prove hosted D1 concurrency, live event authenticity, process/host attestation, provider quota or worker execution.

## Safety and executor gates

- Dispatch and execution authorization remain false.
- No hosted D1 writes, provider calls, secret reads, GitHub dispatch, deployment, merge or R2 mutation/deletion.
- Gemini controller dispatch: NOT RUN; the approved controller workflow was not established on the inspected Cloud Pool default ref. No secrets/variables were inspected.
- No independent security review or Contour A acceptance is claimed.

## Next implementation gate

Proceed only after the exact CODE profile ID is owner-authored and discoverable. Then create one clean-base integration branch pinned to a freshly re-read default SHA; selectively port/reconcile the #67/#72 lineage; add migration 0012 for the lease guard; harden approval immutability, qualification suspension, legacy queue deactivation, attempt takeover and independently sourced target SHA; run negative-first Workers-runtime tests and exact-head CI.

Until those gates pass: Controlling Issue #140 remains OPEN; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
