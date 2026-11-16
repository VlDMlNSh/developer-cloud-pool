# CLOUD POOL MASTER CONTINUATION PROMPT

Work only in `VlDMlNSh/developer-cloud-pool`. Contour A is the sole priority; Contour B remains deferred until formal Contour A acceptance. GitHub is the durable source of truth. At each `/next`, recover live default HEAD, branches, Issues #94/#96, PRs, exact-head CI, rulesets and controller availability before acting.

## Current verified checkpoint — 2026-11-16

- Default branch: `Основной`, HEAD / immutable target `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Current proof branch: `feat/atomic-next-admission-d1-2026-11-16`.
- PR #114 OPEN / DRAFT / UNMERGED, exact verified head `24ada07a4ae832078faf7473b5b646f34a84e64a`.
- D1 atomic admission local Workers-runtime tests: 9/9 PASS; exact-head CI runs #43933503897 and #43933504073 SUCCESS. Artifact #14260211684, SHA-256 `a000c440b969214f9ec7812bd40b1b2ec3c53ece64157aa35e67ea5fc4320dd9`.
- Report: `docs/reports/2026-11-16-next-d1-atomic-owner-admission-proof.md`; checkpoint: `docs/checkpoints/2026-11-16-next-d1-atomic-owner-admission-proof.md`.
- Issues #94/#96 OPEN. PRs #111/#112/#113 OPEN/DRAFT/UNMERGED. PR #114 formal reviews: 0.
- Active default-only ruleset #26550182; no required approving review count. Branch protection API NOT VERIFIED.
- Cloud Pool-native `.github/workflows/gemini-batch-dispatch-controller.yml` absent from default branch at last recovery. Gemini dispatch NOT RUN. No provider calls, secret reads, merge, deployment or live dispatch.

## Canonical boundaries

Issue #96 accepts only a new top-level `issue_comment.created` whose complete body is exactly `/next`, authored by the repository owner and verified using trusted GitHub metadata. Source comment ID is the durable idempotency key. Separate controller code SHA from immutable target SHA. Admission must atomically consume one-shot approval, create immutable logical task and task-level outbox in D1. Resolve ambiguous writes by stable-ID read-after-write; never blindly redispatch.

Execution must use immutable attempts, authenticated workload identity, fencing, append-only evidence and explicit authorized reconciliation. Lease expiry alone does not prove an executor stopped. Do not claim exactly-once external side effects.

All dispatch remains false until Issue #94/#96 governance, trusted event/controller, hosted storage, worker identity, attempt lifecycle, exact-head CI and independent review gates pass. Four Gemini roles are Researcher, Implementation designer, Tester, Security auditor; four credential slots do not prove four independent accounts/quotas. Never inspect secret values, call providers early, use paid fallback or rotate keys to evade quotas.

## Next bounded step

Independently review PR #114 against Issues #94/#96 and PRs #111/#112. Focus on live webhook trust boundary, approval lifecycle monotonicity/immutability, D1 concurrency and ambiguous outcome recovery. Fix only evidenced defects, retain PR as Draft and keep dispatch disabled. Then re-read changed blob SHAs and exact-head CI, publish report/checkpoint/context updates.

## Status

Contour A = BLOCKED / NOT ACCEPTED. Contour B = DEFERRED. Hosted D1, live webhook, worker runtime, model routing/quotas, durable recovery, Jarvis phone/desktop UI and independent acceptance are not yet proven.
