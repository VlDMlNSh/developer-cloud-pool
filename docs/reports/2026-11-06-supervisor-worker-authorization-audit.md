# 2026-11-06 — Supervisor and Worker authorization audit

## Scope
Read-only audit of default-branch Supervisor/Worker workflows, PR #12 and PR #15, ruleset 26550182, Issue #1 and unified context. No runtime or dispatch.

## Evidence
- Default Supervisor workflow blob: d4bd23d06c0dc98211cea165cdad30a1861eb3bd. Contains workflow_run: completed and permissions issues:write/actions:write.
- Default Worker workflow blob: fe1ee4c41a86807810a6b6bc85c677b46c3cebb4. Exposes workflow_dispatch; only dsh-headless-probe profile; validation checks issue open/non-PR, pool:claimed, issue-body SHA/profile.
- Worker report job has issues:write and mutates labels/comments; no complete envelope revalidation immediately before mutation. This conflicts with Supervisor-only state writer and creates a TOCTOU window.
- Ruleset 26550182: active on refs/heads/Основной; PR required; required approvals 0; CODEOWNERS review false; bypass actors empty.
- Issue #1 historical CLI evidence says POOL_DISPATCH_ENABLED=false on 2026-11-04. Current value was not re-read in this pass.

## PR #15
- OPEN/DRAFT/UNMERGED; head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; base 64d2636d4500127e635c214ccfb722c6b3fcda80; formal reviews zero.
- Removes privileged workflow_run trigger and event-specific handler; retains scheduled reconciliation.
- Still returns stale claims to pool:ready after 15 minutes without a matching run. This conflicts with the single-use approval ADR in PR #12, which requires ambiguous dispatch to move to needs-review and require fresh approval.
- Exact-head Pool Contract Validation run 42038004176 SUCCESS. Static CI only; no runtime qualification.

## PR #12
- OPEN/DRAFT/UNMERGED; head 6c053bacff29ca8efb5fdb759edd44fcd416b749; formal reviews zero.
- Exact-head fixture workflow 42041946049 and Pool Contract Validation 42041945700 SUCCESS.
- Fixture demonstrates selected reusable-workflow context fields; it does not implement production workflow_call-only Worker, production caller authorization, owner approval provenance or durable single-use consumption.

## Required remediation
1. Supervisor is the sole queue-state writer; remove Worker report write permission.
2. Worker becomes static local workflow_call-only and validates caller identity before side effects.
3. Owner approval binds issue/SHA/profile/envelope digest and a single-use approval reference.
4. Ambiguous/stale claims move to needs-review, never back to ready under the same approval.
5. Revalidate envelope at trust boundaries and test replay, edits, duplicate events and concurrency.
6. Commit deterministic DSH lockfiles and use npm ci.
7. Independent security review, exact-head CI, live ruleset/variable read-back before any runtime authorization.

## Status
- Governance ruleset: VERIFIED active, but review count is zero.
- Dispatch variable: NOT RE-READ in this pass; historical false evidence only.
- PR #15: static CI SUCCESS; independent review NOT RUN; authorization incomplete.
- PR #12: fixture/contract CI SUCCESS; independent review NOT RUN; production boundary NOT IMPLEMENTED.
- Runtime/DSH/model calls/secrets/deployment/dispatch: NOT RUN.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Canonical map
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
