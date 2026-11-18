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
