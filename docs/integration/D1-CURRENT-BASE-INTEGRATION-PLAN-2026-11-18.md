# D1 current-base integration plan — 2026-11-18

## Status

Planning checkpoint only. This branch is based directly on the repository default branch at:
- Base branch: `Основной`
- Base SHA: `68183828cf7934e89109310c8f99281be4eb7ed8`
- Integration branch: `integration/d1-current-base-2026-11-18`

No migration or runtime code has been changed in this checkpoint. No hosted D1, secrets, provider calls, dispatch, deployment, default-branch update, or merge is authorized or performed.

## Owner-confirmed executor-stack identity convention

A ready-to-run executor stack is identified by executor family plus an independently increasing instance number:
- Claude Code stack: `claude-code-1`, `claude-code-2`, ...
- Codex stack: `codex-1`, `codex-2`, ...
- Gemini stack: `gemini-1`, `gemini-2`, ...

The first complete stack based on Claude Code + ECC + FCC is `claude-code-1`. Keep this stable executor identity separate from capability profiles, provider routes, model IDs, account references, credential handles, and lease owner/generation fields.

## Critical semantic distinction

The existing isolated D1 proof uses `dsh-headless-probe` in fields named `profile` and `capability_profile`. Those fields currently represent a capability/qualification profile, not a complete executor-stack instance ID. Do **not** mechanically replace `dsh-headless-probe` with `claude-code-1` in those columns or allowlists.

Before schema changes, trace every producer, consumer, validator, SQL constraint, fixture, and workflow mapping for:
- executor identity (`executor_id`, or the equivalent field to be introduced);
- capability profile (`profile` / `capability_profile`);
- provider route, provider/model, issuer/account, credential handle and quota domain;
- task, immutable attempt, lease owner and fencing generation.

If the current production contract has no executor identity field, introduce it additively with explicit validation and immutable task/attempt binding. The first permitted value for the Claude Code stack is `claude-code-1`; future families follow the owner-confirmed convention. Do not assume that a profile name is an executor ID.

## Current default-branch inventory (verified 2026-11-18)

The recursive Git tree for default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8` contains 64 entries. It has no `proofs/d1-ledger/`, no D1 migration directory, no application `wrangler.toml/jsonc` D1 binding, and no executable D1 adapter in the default tree. The current tree contains documentation describing D1 admission as design/isolated proof, plus `scripts/pool-supervisor.mjs` and GitHub Actions workflows.

The current Supervisor's durable coordination path is GitHub Issue state/labels and workflow runs; its source has an explicit `POOL_DISPATCH_ENABLED !== "true"` heartbeat-only guard. The pool task issue template currently exposes only the DSH headless probe profile. The Supervisor's task path is not yet connected to D1.

Consequently, this branch must not be described as integrating an existing production D1 schema. The first engineering deliverable is a separately isolated, local-only D1 proof and a clearly defined adapter boundary to the current GitHub-based Supervisor. Any future production schema/wiring requires a separate review and authorization.

## Evidence and known integration blockers

- PR #67 contains the earlier isolated D1 proof migration series (0001–0010).
- PR #72 adds migration 0011 and atomic qualified admission, but its branch comparison against current default was divergent: 67 commits ahead and 81 behind. It must not be merged or transplanted wholesale.
- The isolated proof schema contains both `pool_task_outbox` and `pool_task_delivery_outbox`; reconcile their distinct responsibilities and ownership before choosing one canonical delivery path.
- The approval ledger and route-qualification schema currently constrain profile/capability profile to `dsh-headless-probe`.
- Route qualification is a local proof record; it does not itself prove trusted issuer cryptography, provider account/quota authority, or production route qualification.
- The proof package README explicitly states that its D1 adapters are isolated/local-only and not wired into the deployed Supervisor/Worker.
- A prior exact-head run for the isolated proof exists on the older proof branch, but that does not validate a new current-base integration branch.

## Integration sequence

1. Map current-default schema ownership and call sites for tasks, approvals, both outboxes, attempts, reconciliation, projection delivery, lease owner and fencing generation.
2. Produce a compatibility matrix for PR #111/#112/#114/#125 and the isolated proof migrations. Identify reusable logic by file and behavior; do not transplant whole stale branches.
3. Define the canonical executor identity contract separately from capability profile and provider route. Bind `executor_id` immutably to the admitted task and attempt, and include it in relevant receipts/events where the audit contract requires it.
4. Reconcile migration numbering and table ownership on the current base. Preserve additive migration history; never reuse an occupied migration number.
5. Implement one fail-closed atomic admission path: trusted owner/repository/issue/event/default-branch SHA binding, single-use approval, qualified route evidence, task + immutable attempt creation, and one canonical outbox/receipt transaction.
6. Implement and test lease acquisition/renewal/reclaim and stale-generation fencing. An expired lease alone is not proof that an old executor stopped; indeterminate attempts require durable reconciliation, not a boolean resumable shortcut.
7. Keep dispatch and execution authorization disabled in every test and adapter response.
8. Run negative-first local Workers/D1 tests, then require CI on the exact final branch HEAD. Record exact SHAs and run IDs before proposing a draft PR.

## Non-negotiable safety boundary

- No hosted/production D1 access or mutation.
- No secrets, credentials, OAuth, provider/model calls, quota consumption, or account probing.
- No GitHub Actions dispatch or production execution.
- No deployment, merge, or change to the default branch.
- All work remains isolated on this integration branch until separately reviewed.


## Compatibility matrix — source PR audit (2026-11-18)

| Source | Reusable evidence | Conflict / limitation | Decision |
|---|---|---|---|
| PR #67 — receipt-bound projection ledger | Migrations 0001–0010; immutable logical task/attempt identities; attempt projection outbox; receipt-bound, fenced projection delivery; at-most-once comment-post state machine. Exact HEAD `a53f6232bd5b50d3e150addf528b8e722002f9dd`: Pool Contract Validation and Isolated D1 Ledger Proof both SUCCESS. | Its migration 0006 is projection-outbox creation, not the current-base lease guard. The PR is stacked on a historical base and is not a current-base transplant candidate. | Reuse selected invariants and tests only; do not copy the migration series wholesale. |
| PR #72 — atomic qualified A0 admission | Migration 0011 adds route qualification, one-shot approval binding, admission receipt, and atomic task/outbox admission. | Based on PR #67's old branch; comparison previously showed 67 ahead / 81 behind current default. Exact HEAD `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31` has no returned PR workflow runs. Hard-codes `dsh-headless-probe`, qualification states only `qualified/revoked`, and does not prove trusted issuer cryptography or provider account authority. | Do not transplant. Re-design its admission semantics against a selected canonical task/attempt schema after route issuer trust is separately specified. |
| PR #111 — current-base lease/attempt proof | Rebased isolated D1 proof with logical tasks, immutable attempts, reconciliation queue, lease owner/generation checks, and SQL guard preventing a running attempt without its current lease. Exact HEAD `687196738782432797bf394f1342cb9df19f478f`: Pool Contract Validation and Isolated D1 Ledger Proof both SUCCESS. | Migration 0006 now means `guard_running_attempt_requires_lease`, conflicting by number and meaning with PR #67 migration 0006. It retains `dsh-headless-probe` as a capability profile. The lease proof does not establish safe reclaim of indeterminate execution merely from expiry. | Preferred source for the initial local D1 ledger spine, but renumber/reconcile migrations on a new current-base proof branch; preserve capability profile separately from executor ID. |
| PR #112 — owner `/next` event controller | Read-only event envelope validation; numeric owner/repository identity; exact issue/comment checks; negative-first tests; no dispatch. Exact HEAD `c9a4c0ab2001f01a09632795283071c521e1c99d`: controller and pool contract workflows SUCCESS. | Does not persist admission in D1, perform a trusted independent default-branch API re-read, or bind a worker attempt. | Reuse pure event predicate/tests as a read-only ingress layer, then add a separately tested trusted-head provenance adapter. |
| PR #114 — atomic D1 owner admission | Separate local D1 proof: one-shot approval consumption, immutable admission receipt, task + task approval + task outbox in one trigger transaction. Exact HEAD `ab9461eb84b14fe230918391d5212f19ca25592c`: Pool Contract Validation and D1 Atomic Admission Integration Proof both SUCCESS. | Separate package/schema from `proofs/d1-ledger`; duplicates `pool_tasks`, `pool_task_outbox`, and approval-ledger concepts, so it cannot simply be overlaid on PR #111. Its trusted head is supplied as an input to the pure function; proof notes explicitly say trusted provenance is not verified. | Reuse atomicity/replay tests and receipt semantics, not its schema as a second canonical ledger. Integrate admission into one selected ledger only after mapping all columns and triggers. |
| PR #125 — GitHub Actions context adapter | Binds event payload to runner-provided `GITHUB_*` context; checks numeric repo/owner identity, run ID/attempt, workflow ref, and exact owner `/next` event. Exact HEAD `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`: D1 GitHub Actions Context Admission Proof SUCCESS. | It sets both `targetSha` and `trustedDefaultHeadSha` from `GITHUB_SHA`; this is equality of two values from one source, not independent verification that the SHA is still the trusted default HEAD. It allowlists `cloud-pool-next-controller.yml`, which the default branch does not contain. It still hard-codes `dsh-headless-probe`; no live controller or hosted D1 qualification. | Reuse as a runner-context composition proof only. Do not treat it as trusted-head verification or live controller qualification; add an independent read-only GitHub API lookup in a later explicitly scoped adapter. |

## Selected implementation order and file-level disposition

1. **Canonical local ledger spine:** start from PR #111's current-base migration concepts and tests for tasks, attempts, reconciliation and lease fencing. Do not copy its old migration numbers blindly; assign fresh additive migration numbers only after checking the destination tree and schema ownership.
2. **Projection delivery:** selectively port PR #67's attempt projection outbox identity immutability and at-most-once comment-post state machine only after confirming the selected task/attempt schema supports its foreign keys and lease-generation model. Keep projection delivery separate from task execution state.
3. **Admission:** use PR #114's receipt/approval atomicity as behavioral reference. Fold it into the single canonical ledger; do not create a second competing `pool_tasks` / `pool_task_outbox` family.
4. **Ingress:** take PR #112's read-only event predicate, then PR #125's Actions-context binding as a separate layer. Before any trusted admission, independently read the repository's current default branch SHA through GitHub API and require exact equality with the target SHA; fail closed on API error or mismatch.
5. **Executor identity:** add an immutable `executor_id` to the admitted task and immutable attempt, beginning with `claude-code-1`. Keep `profile = dsh-headless-probe` as capability qualification until a new capability profile is separately qualified. Do not put executor IDs in the profile allowlist.
6. **Still blocked:** trusted webhook authenticity / independent trusted-head provenance, qualification issuer cryptographic trust, suspended/revoked qualification lifecycle, durable reconciliation for indeterminate attempts, and any production/hosted D1 or execution wiring.

This matrix is a source-selection decision, not an implementation or runtime qualification. All source PRs remain unmerged; successful historical exact-HEAD CI applies only to the SHA shown above, not to a new combined branch.


## Current-default ancestry check (2026-11-18)

GitHub compare against default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8` returned:
- PR #111 branch: `diverged`, 4 commits ahead / 2 behind.
- PR #112 branch: `diverged`, 3 ahead / 2 behind.
- PR #114 branch: `diverged`, 36 ahead / 2 behind.
- PR #125 branch: `diverged`, 57 ahead / 2 behind.
- This integration branch: `ahead`, 3 ahead / 0 behind.

Thus even the focused current-base proof branches need reconciliation with the two newer default commits before transplant. Do not merge or cherry-pick their complete branch histories. Port reviewed file-level behavior onto this branch, then run CI on the resulting exact HEAD.
