# D1 Free-tier feasibility and PR #27 recheck — 2026-11-08

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- Target branch HEAD observed: `8ecc71265809e149e6d22b31f06522f678ee1ac8`.
- PR #27: OPEN / DRAFT / UNMERGED; base `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Current default HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Compare PR #27 against current default: 160 commits ahead / 2 behind; merge base is `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- This is a documentation/prototype continuation branch, not accepted default-branch content.

## Fresh PR #27 verification

- Exact-head PR workflow lookup for `8ecc71265809e149e6d22b31f06522f678ee1ac8`: zero PR-triggered runs.
- Combined commit status contexts: empty.
- Formal reviews: 0; inline review threads: 0.
- CI: NOT VERIFIED. Independent review: NOT RUN.
- No merge, rebase, deployment or runtime operation performed.

## Official Cloudflare D1 Free-plan evidence

Reviewed current official Cloudflare documentation:

- D1 limits page (last updated 2026-10-30): https://developers.cloudflare.com/d1/platform/limits/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- D1 FAQ: https://developers.cloudflare.com/d1/reference/faq/
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/

Published Free-plan constraints relevant to the proposed claim/lease/outbox ledger:

- 10 D1 databases per account.
- 500 MB maximum per database and 5 GB total account storage.
- 5 million rows read/day and 100,000 rows written/day.
- 7-day Time Travel retention.
- 50 read subrequests per Worker invocation.
- Maximum SQL query duration: 30 seconds.
- Each D1 database is single-threaded and processes queries one at a time.
- D1 batch executes statements as a transaction; per-statement limits still apply.
- Cloudflare states that Workers Free includes D1 for free prototyping/experimentation.

These published plan limits make D1 a plausible no-paid candidate for a small control-plane ledger, but they do not qualify this account, the proposed workload, or the authorization design. The account-specific Workers/D1 entitlement and no-card onboarding remain NOT VERIFIED because the connected Cloudflare integration lacks Billing Read scope. No D1 database was created and no billing or payment settings were accessed.

## Engineering implications

1. Keep one isolated control-plane database for the initial proof; do not assume a database per runner or agent. The Free account ceiling is 10 databases.
2. Bound audit/event retention and measure row/storage growth against 500 MB per database and 5 GB total storage.
3. Treat quota exhaustion, database overload, 30-second query timeout and connection/transaction ambiguity as fail-closed conditions. No paid fallback.
4. Preserve the 50-contender one-winner test required by Issue #38, but also record latency, queueing and retry behavior because a single D1 database is single-threaded.
5. Keep local Miniflare/SQLite tests distinct from remote D1 qualification. Published Free availability is not proof of account-level access or production suitability.

## Architecture disposition

- Option A (Issue labels + workflow concurrency): rejected as authoritative CAS.
- Option B (separate state repository + immutable reservation refs): candidate only; not proven against deletion/recreation or permission constraints.
- Option C (D1): preferred candidate, NOT selected for production and NOT QUALIFIED.
- The integrated issuer/claim/lease/outbox protocol remains design-only. No implementation, remote D1 test, secret access, workflow dispatch, Worker/DSH/Resource Probe, provider/model call, deployment or paid resource was used.

## Governance and next step

- PR #27 remains OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED; independent review NOT RUN.
- PR #36/#37/#39 remain separate local/static proofs with no independent reviews; they are not an integrated authorization pipeline.
- Active ruleset approval gap remains: zero required approving reviews. Independent review must be enforced through an authorized governance path before acceptance.
- Next bounded step: obtain an authorized independent architecture/security review of the integrated threat model and the A/B/C alternatives. Only after review findings are resolved should an isolated backend qualification be planned.
- Keep both dispatch gates fail-closed. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Status

Read-only research and GitHub evidence recheck: VERIFIED within stated scope.
D1 Free-plan published limits: VERIFIED from official documentation.
Account-specific D1 entitlement: NOT VERIFIED.
Remote D1 qualification: NOT RUN.
Independent review: NOT RUN.
Implementation / dispatch / deployment: NOT RUN.
