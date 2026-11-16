# /next engineering pass — D1 admission and lease/fencing qualification boundary

Date: 2026-11-16
Phase: Cloud Development Pool / Contour A only.
Status: IN PROGRESS / NOT ACCEPTED.
Immutable repository target: `a18ecec97202ed626e9b86a2b3bcf55059422bac` on `docs/cross-chat-continuation-2026-11-06`; default branch `Основной` observed at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.

## Work performed

Revalidated repository metadata, default HEAD, documentation branch HEAD, open Issues/PRs, PR #112, PR #111, PR #107/#108, active ruleset and exact-head workflow evidence. Reviewed the full changed-file inventory and the key D1 migrations/adapters in PR #111.

PR #111 (`proof/d1-lease-clean-base-2026-11-16`) is OPEN / DRAFT / UNMERGED at `687196738782432797bf394f1342cb9df19f478f`, based directly on default SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. It contains 20 files, including migrations 0001–0006, D1 approval ledger, transactional claim/outbox, logical task identity, immutable attempts, per-task lease/fencing and reconciliation queue.

Mature component reuse: the proof uses Cloudflare's official Workers Vitest integration and local Miniflare/workerd D1 runtime, with exact-pinned dependencies and npm ci against a committed lockfile. This avoids inventing a database simulator. No Cloudflare account resource was provisioned.

## Exact-head evidence

- Isolated D1 Ledger Proof run [43881396386](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396386): COMPLETED / SUCCESS at PR #111 head.
- Job `133347908331`: SUCCESS; exact dependency install, syntax check, 37/37 Workers-runtime tests and lockfile artifact upload succeeded.
- Pool Contract Validation [43881396272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396272): COMPLETED / SUCCESS at the same head.
- Artifact [14232471651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396386/artifacts/14232471651), SHA-256 `08329cbcb0bb479760af4a9dbb7682472180e4bd4431ca2ffaa0cc18612c99d3`.
- Formal PR reviews: 0; inline review threads: 0.

## Security/architecture findings — gaps, not acceptance

1. **Per-task lease is not repository-wide lease.** The current lease state is stored on `pool_tasks` and keyed by `task_key`. Two different tasks in the same repository can independently hold leases. No singleton/repository lease row keyed by repository ID was evidenced.
2. **Fencing is currently task/attempt scoped.** Monotonic `lease_generation` and owner/generation/expiry checks protect the task attempt lifecycle, but do not establish one repository-wide fencing epoch or guard every repository mutation against a newer repository owner.
3. **Source-event identity is not fully represented in the D1 proof schema.** Migration 0001 binds owner numeric ID, repository ID, issue number, target SHA, profile and envelope digest, but has no explicit source comment ID or source-event digest column. Approval ID alone is not evidence of the original GitHub comment identity. Controller run ID is also not persisted by this schema.
4. **Crash/expiry policy is safely conservative but incomplete.** Migration 0005 materializes indeterminate attempts into a durable pending reconciliation queue. The API intentionally denies blind takeover/retry. No trusted reconciliation actor/resolver or completed recovery lifecycle is integrated.
5. **No production admission integration.** PR #111 explicitly returns `dispatch: false`; no hosted D1, Supervisor/Worker caller, trusted Issue #96 event bridge, or production dispatch path is connected.
6. **Local runtime proof is not hosted durability.** The 37 passing tests validate local Workers-runtime D1 semantics only. They do not prove account-level hosted D1 availability, retention, backup/recovery, or deployed concurrency behavior.
7. **No independent review.** PR #111 has no formal review submissions or inline review threads.

PR #112 separately verifies the read-only owner /next event envelope at head `c9a4c0ab2001f01a09632795283071c521e1c99d` with exact-head runs [43882090833](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090833) and [43882090867](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090867). It is not the Gemini dispatch controller and does not persist admission.

## Governance and execution boundary

- Default branch: `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Documentation branch before this report: `a18ecec97202ed626e9b86a2b3bcf55059422bac`.
- Active ruleset ID `26550182`, enforcement active on `refs/heads/Основной`; PR required, zero required approvals, thread resolution required, deletion/non-fast-forward prohibited, no bypass actors. Therefore the ruleset does not enforce an independent approval count.
- The Gemini batch dispatch workflow was not found on the current default branch at `.github/workflows/gemini-batch-dispatch-controller.yml`; no controller dispatch was attempted. Secret values were not read.
- Gemini Agents 1–4: NOT RUN. Provider calls, D1 provisioning, deployment, merge and production dispatch: NOT RUN.
- Four configured credential slots do not prove four independent account identities or quota domains.
- No paid resources or fallback used.

## Decision

- D1 local single-use claim/outbox and task-attempt lease proof: VERIFIED at stated exact PR head.
- Repository-wide lease/fencing: NOT IMPLEMENTED / NOT VERIFIED.
- Event-comment identity persistence and trusted production admission: NOT VERIFIED.
- Crash recovery resolver and hosted D1 qualification: NOT VERIFIED.
- Contour A: IN PROGRESS / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Design and implement a separate repository-scoped lease table with monotonic fencing generation and require that generation in every task lease/attempt mutation; bind durable admission to immutable source comment ID + event digest + repository/issue/owner IDs + target SHA + controller run identity. Add adversarial multi-task same-repository contention, stale repository fencing, duplicate source event, lease expiry and recovery tests. Keep all dispatch paths disabled; do not provision hosted D1 or invoke providers in this pass.

Canonical MediaHub map (separate repository/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
