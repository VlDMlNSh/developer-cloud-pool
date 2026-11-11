# Proposed Pool Issue Lifecycle Ownership Contract — 2026-11-11

## Status and scope

**PROPOSED / NOT ACCEPTED.** This document records implementation-derived ownership and identifies unresolved semantics. It does not authorize source changes, live GitHub writes, dispatch, deployment, or a change to the label vocabulary.

Immutable source evidence:
- Supervisor `scripts/pool-supervisor.mjs`: blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- Worker workflow `.github/workflows/pool-worker.yml`: blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Supervisor/recovery architecture: blob `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`.
- PR #58 reconciler: blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- PR #59 D1 outbox: blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.

## Evidence-based current ownership map

| Label | Observed writer / transition | Proposed owner boundary | Notes |
|---|---|---|---|
| `pool:ready` | Supervisor returns stale claims after 15 min; dispatch failure restores ready | Supervisor only | Approval/queue state; never a terminal projection label |
| `pool:claimed` | Supervisor claims approved issue before dispatch | Supervisor only | Active claim; worker validates it but should not own it |
| `pool:probe-complete` | Worker report job when validation and probe succeed | Worker reporting job (current bootstrap path) | Means the allowlisted DSH probe completed, not general task/product completion |
| `pool:needs-review` | Worker report on failed probe; Supervisor on failed workflow/stale completed run | Shared terminal transition currently | Multiple writers create race potential; requires single-writer or compare-and-set contract |
| `pool:invalid` | Supervisor rejects invalid task envelope | Supervisor only | Intake rejection, not worker terminal outcome |

The current Supervisor declares exactly these five labels. The Worker report job retains non-managed labels, removes these five, and writes exactly one of `pool:probe-complete` or `pool:needs-review`. Supervisor failure/stale recovery also writes `pool:needs-review`, while stale claim expiry returns `pool:ready`.

## Unresolved semantics / decisions required before implementation

1. **Outcome vocabulary mismatch:** PR #58 envelope has `succeeded`, `failed`, `abandoned`; bootstrap lifecycle has probe-complete, needs-review, invalid, ready and claimed. There is no evidence that `pool:completed` or `pool:failed` are canonical labels. Do not introduce them based only on PR #58.
2. **Probe scope:** `pool:probe-complete` records success of the current narrow DSH smoke test only. It must not be interpreted as general worker/agent completion or Contour A acceptance.
3. **Needs-review writer race:** Worker report and Supervisor recovery can both attempt to terminalize the same issue. A future implementation needs explicit transition preconditions and idempotent evidence keyed by workflow run/attempt, not just last-writer-wins PATCH.
4. **Stale-claim recovery:** Supervisor selects issues currently labelled claimed and finds the newest matching run created near issue.updated_at. The Worker report can update labels/comments, changing issue.updated_at; the matching heuristic and stale-claim branch therefore need adversarial tests around report-vs-recovery timing.
5. **Reconciler ownership:** PR #58 must never treat every `pool:*` label as its own. Any terminal projection must be restricted to an explicitly approved owner set and must preserve queue/intake labels owned by Supervisor.
6. **Exactly one terminal label:** For this bootstrap lifecycle, successful probe maps to `pool:probe-complete`; unsuccessful/ambiguous worker terminal state maps to `pool:needs-review`. This is a candidate mapping only, not yet accepted as the mapping for D1 attempt outcomes `succeeded/failed/abandoned`.
7. **D1/issue boundary:** D1 projection may not rewrite Supervisor-owned queue labels. It must carry a contract version and an explicit label ownership set; unknown labels or unknown contract versions fail closed.

## Candidate transition table (not yet approved)

| From | Event | Candidate next state | Sole writer |
|---|---|---|---|
| no pool state | owner approves valid task | ready | owner / intake policy |
| ready | supervisor validates and claims | claimed | Supervisor |
| ready | invalid envelope | invalid | Supervisor |
| claimed | worker validation fails | claimed until Supervisor recovery / review | unresolved |
| claimed | probe succeeds and report persists | probe-complete | Worker report |
| claimed | probe fails and report persists | needs-review | Worker report |
| claimed | workflow terminal without durable report | needs-review | Supervisor recovery |
| claimed | no matching run after lease window | ready | Supervisor recovery |

The unresolved validation-failure row is important: the current report job intentionally does not mutate the issue when validation fails; Supervisor recovery must remain the only recovery writer after the workflow terminates.

## Required contract tests before code changes

- Every transition accepts only its exact source state and immutable task/run identity.
- Supervisor cannot erase labels outside its exact five-label ownership set.
- Worker report preserves all unrelated labels and cannot convert invalid/ready tasks to terminal states without a valid claim and matching run.
- Two concurrent terminal writers cannot overwrite each other's newer state; stale run IDs are rejected.
- Repeated identical report is idempotent; conflicting report for same run is denied and audited.
- Probe-complete is never treated as Contour A acceptance.
- PR #58 reconciler cannot delete `pool:ready`, `pool:claimed`, `pool:invalid`, unknown `pool:*`, or labels owned by another component.
- D1 terminal outcomes cannot be mapped to GitHub labels until a versioned mapping is explicitly accepted.
- D1 lease-bound POST grant is one-use and bound to exact outbox ID, repository ID, issue number, target SHA, event digest, delivery generation, attempt count and lease expiry.

## Reuse-first review

No mature drop-in D1-aware GitHub issue lifecycle ownership framework was identified in prior reuse reviews. Existing GitHub Actions, GitHub Issues and Octokit APIs are reusable primitives; they do not provide the domain-specific single-writer transition contract or durable lease-bound POST authorization. Do not add a new generic workflow engine or HTTP client.

## Status

- This contract: PROPOSED / NOT ACCEPTED.
- Lifecycle code changes: NOT RUN.
- PR #58/#59 coordinated changes: NOT RUN.
- Dispatch/deployment/live API mutations: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: obtain a clear internal contract decision on mapping D1 outcomes to the bootstrap probe lifecycle and on single-writer ownership for `pool:needs-review`. Then implement the smallest fake-only tests first; do not merge or activate dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
