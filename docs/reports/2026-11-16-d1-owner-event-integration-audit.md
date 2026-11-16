# Cloud Pool /next — D1 and owner-event integration audit

Date: 2026-11-16
Phase: Contour A only
Status: IN PROGRESS / NOT ACCEPTED

## Immutable targets
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Documentation branch before this report: `docs/cross-chat-continuation-2026-11-06@${parent}`.
- PR #111 D1 proof: `687196738782432797bf394f1342cb9df19f478f`.
- PR #112 read-only event controller: `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- PR #109 four-agent client bounds: `371093fc646a22cf49e3baaa8984bc2e5d3622b7`.

## Exact-head CI and review — VERIFIED
- PR #111 run [43881396386](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396386), job `133347908331`: SUCCESS. Steps include pinned Node setup, npm ci against committed lockfile, adapter syntax check, Workers-runtime D1 tests, and lockfile artifact upload. Recorded suite result: 37/37 tests.
- PR #111 Pool Contract Validation run `43881396272`: SUCCESS.
- PR #112 run [43882090833](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090833), contract job `133350342861`: SUCCESS. Event-admission job `133350345738`: SKIPPED because the observed trigger was not a qualifying issue_comment event. Recorded test suite result: 21/21.
- PR #112 Pool Contract Validation run `43882090867`: SUCCESS.
- PR #109 Pool Contract Validation run `43872185972`: SUCCESS.
- Formal review submissions for PR #111 and #112: 0 each. Both remain OPEN/DRAFT/UNMERGED. Green CI is not independent approval or production qualification.

## Source-level findings
1. D1 migration 0003 creates `pool_tasks` keyed by logical `task_key`; its lease owner, expiry and generation are task-scoped. Distinct tasks in the same repository can be leased independently. There is no repository-level singleton lease or monotonic repository fencing epoch.
2. Migrations 0004–0006 strengthen immutable attempts, task-scoped generation checks, append-only attempt events, and require a current unexpired lease before `prepared -> running`. These are useful local D1 integrity controls; they do not provide cross-task repository serialization or authenticate a worker.
3. Migration 0005 materializes indeterminate attempts in a pending reconciliation queue. It intentionally does not authorize retries, terminal decisions or lease takeover. A trusted resolver and evidence-backed recovery lifecycle remain absent.
4. D1 approval schema binds owner ID, repository ID, issue number, target SHA, profile and envelope digest, but does not explicitly persist the GitHub source comment ID, source-event digest, controller run ID and four child task/run identities as a single durable admission record.
5. PR #112 validates an exact owner-authored top-level Issue #96 `/next` event and derives a stable digest from repository/issue/comment ID, but its result explicitly sets `executionAuthorized: false` and `READ_ONLY_NO_DISPATCH`. It has no persistent idempotency store, durable claim, lease, fencing, child dispatch or recovery.
6. The PR #112 workflow uses GitHub Actions concurrency group `developer-cloud-pool-supervisor`, but Actions concurrency is not a durable database lock and does not issue a monotonic fencing token to every state mutation.
7. The approved Cloud Pool Gemini controller path `.github/workflows/gemini-batch-dispatch-controller.yml` is absent on the current default branch (404). Do not substitute MediaHub Issue #301 controller or its credentials; that is a separate control plane.

## Governance and hosting
- Ruleset `26550182` is ACTIVE on `refs/heads/Основной`; PR required, required approvals = 0, review-thread resolution required, deletion/non-fast-forward blocked, no bypass actors. Independent approval is not enforced by the ruleset.
- Prior read-only Cloudflare inventory returned 0 D1 databases and 0 Worker scripts. Hosted resource inventory does not prove free-tier entitlement or provisioning authorization; both remain NOT VERIFIED.
- No hosted D1, Worker, provider, secrets or deployment action was performed in this pass.

## Decision
Do not connect PR #107/#109 four-agent candidate to PR #112 yet. The current D1 package is a useful isolated local proof, but the join between event intake and persistent admission is missing. The minimum safe next implementation should add, on a clean default-based branch:
- repository-scoped singleton lease row keyed by immutable repository ID;
- monotonically increasing repository fencing generation;
- durable admission keyed uniquely by source comment ID and bound to owner numeric ID, repository ID, Issue #96, target SHA, event digest, controller run ID and wave ID;
- four fixed child task identities and immutable payload digests;
- atomic claim + outbox intent; every mutating transaction must verify repository generation and task/attempt fencing;
- duplicate/replay, concurrent distinct-task, stale generation, partial dispatch, ambiguous response and recovery-to-NEEDS_REVIEW tests;
- no dispatch in the proof; all outputs remain `dispatch: false`.

## Actions and limitations
No code changes, tests, dispatches, provider calls, secrets reads, resource provisioning, deployment or merge were performed. This is a source/CI/governance audit. No Gemini agents were dispatched: approved Cloud Pool controller is absent on default branch. Contour A remains NOT ACCEPTED; Contour B DEFERRED.

## Next
Implement the smallest repository-scoped admission/lease schema and adapter on a clean branch from the immutable default SHA, keeping dispatch disabled. Then run exact-head adversarial CI and request independent security review.

Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)
Checkpoint: [D1 lease/fencing audit](../checkpoints/2026-11-16-d1-lease-fencing-audit.md)
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
