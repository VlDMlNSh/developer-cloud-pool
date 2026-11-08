# 2026-11-08 — Shared Claim Lifecycle contract design

Status: DESIGN CONTRACT PROPOSED; NOT IMPLEMENTED; NOT QUALIFIED.

Created `docs/contracts/SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md` to unify the PR #37 Supervisor/Worker/Finalizer boundary and PR #39 local atomic Claim+Outbox proof.

The contract defines:
- authenticated immutable approval envelope and canonical digest;
- authoritative state model with monotonically increasing fencing generation;
- atomic claim + outbox;
- bounded lease/recovery and stale-worker rejection;
- execution capability bound to target SHA/profile/run identities;
- fenced idempotent finalization and durable audit/outbox;
- GitHub Issues as projections, not lock/state authority;
- comparison of Issue-label, Git-ref and conditional-write-store backends;
- behavioral contention, mutation, lease, stale-run, duplicate-finalizer, rollback, recovery, quota and secret-leak tests.

Backend decision deliberately deferred. PR #39 is local SQLite/Miniflare evidence only. Cloudflare remote D1 entitlement/deployment remain NOT VERIFIED. No backend was provisioned. Dispatch remains disabled.

No code/workflow/secret/resource/deployment changes. No Gemini/provider/model calls. PR #36/#37/#39 remain unmerged. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

The policy is governed by Autonomous-First: no blanket external APPROVE gate for safe iterations; security gates and final evidence-based acceptance remain mandatory.
