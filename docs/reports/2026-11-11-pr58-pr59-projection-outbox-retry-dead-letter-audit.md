# PR #58/#59 terminal projection and dead-letter audit — 2026-11-11

## Scope and immutable refs

Read-only audit of the current Contour A D1 proof stack. No production integration, merge, deployment, dispatch, credential/secret access, provider call, or remote D1 provisioning.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`; observed HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- PR #54 parent contention proof: `ec3f3266ca28c4fb5633a9475cc6f396a467797`, OPEN/DRAFT; based on PR #51.
- PR #58 fake GitHub projection reconciler: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, OPEN/DRAFT; base is PR #54 head.
- PR #59 bounded retry/dead-letter policy: `5c47cda4394d0381315bc16182799a09bf861797`, OPEN/DRAFT; base is PR #58 head.
- Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`; PR #27 HEAD `d5ec50e76004373857c751f4e80d61cf872ac5ab`, OPEN/DRAFT/UNMERGED. This is a working documentation branch, not default-branch production state.

## Findings

### PR #58 — fake GitHub projection reconciler

- PR workflow run `42979949181`, job `130387805034`: COMPLETED/SUCCESS.
- Push workflow run `42979945524`, job `130387793379`: COMPLETED/SUCCESS.
- PR description records ten focused fake-boundary cases, including lost POST response/read-back, delayed marker visibility, duplicate marker and digest conflict, managed-label convergence, and terminal outcome/label consistency.
- Projection outcomes retain `dispatch:false`. This is a synthetic/fake API protocol proof, not live GitHub API behavior or production delivery.
- Formal reviews: 0; inline review threads: 0.

### PR #59 — bounded retries and dead-letter

- Current PR head: `5c47cda4394d0381315bc16182799a09bf861797`.
- PR-associated workflow run `42980783397`, job `130390442001`: COMPLETED/SUCCESS.
- Job log: `npm ci` and syntax checks succeeded; Workers-runtime D1 suite passed 3/3 files and 53/53 tests; lockfile artifact `13837232801`, SHA-256 `7dbc1b8b34dcdf4d03868df27168857b250eed43f6798990419042c9fccb8ebc`.
- The run checked out GitHub's synthetic PR merge commit `f02a32c` (merge of PR head `5c47cda...` into PR #58 base `6f7953e...`). Therefore this is successful PR merge-tree CI associated with the current head, not a direct checkout of the head commit.
- Earlier run `42980650499` / job `130390010414` failed at prior PR head `5b3b74fae4a70d7bb52fa874e60d60ba903af786`: 52/53 tests passed; the failing assertion expected `PROJECTION_DELIVERY_ATTEMPT_LIMIT`, while SQLite correctly rejected the mutation through the dead-letter terminal trigger (`PROJECTION_DEAD_LETTER_TERMINAL`). The subsequent commit `5c47cda...` updated the assertion to test the terminal-state invariant; the new PR merge-tree run passed 53/53. Preserve the failed run as useful regression history; do not count it as current-head failure.
- Retry policy: maximum five delivery leases; deterministic delays 30/60/120/240 seconds; fifth failed delivery dead-letters; expired fifth lease requires matching worker + delivery generation; dead-letter rows are terminal and are not automatically requeued. Reason codes are bounded; no task execution replay or dispatch authority is added.
- Formal reviews: 0; inline review threads: 0; combined status contexts API returned empty (not a pass by itself).

## Source-level assessment

- Migration `0007_bound_projection_delivery_retries.sql` adds retry timing, bounded error reason, dead-letter metadata, append-only delivery status events, a due-retry index, attempt-budget guard, dead-letter evidence guard, and terminal dead-letter guard.
- `projection-outbox.mjs` conditions acquisition on due time and fewer than five attempts; retries are fenced by worker/generation/unexpired lease; expired fifth leases use a separate generation-fenced dead-letter transition; every adapter result remains `dispatch:false`.
- The proof stack correctly separates task execution from terminal GitHub projection delivery. A dead-lettered projection does not authorize rerunning the task.
- No evidence of a real GitHub API sender, hosted D1 state authority, production Supervisor/Worker wiring, durable production recovery, or live end-to-end behavior was produced.
- PR #54 remains a parent dependency and has no PR-triggered workflow run returned by the exact-SHA query in this pass; however PR #58's passing merge-tree suite includes the stacked parent source/tests. Parent independent review remains absent.

## Governance and acceptance

- PRs #54, #58, #59 remain OPEN/DRAFT/UNMERGED.
- PR #58 reviews/threads: 0. PR #59 reviews/threads: 0.
- No independent security/governance review is recorded.
- Current default-branch protection review in the Context Window notes active ruleset `26550182` requires a PR but has zero approving reviews and no CODEOWNERS approval. This is insufficient to enforce independent approval.
- Local Workers-runtime success is scoped proof only. Hosted D1 eligibility/entitlement, authenticated remote web console, production issuer/capability, live executor run binding, side-effect reconciliation, quota enforcement, secrets isolation, persistence/recovery, and independent acceptance remain open gates.

## Disposition

- PR #58 fake projection protocol: VERIFIED within its synthetic proof boundary.
- PR #59 retry/dead-letter state machine: VERIFIED within its local Workers-runtime D1 proof boundary at the current PR-associated merge-tree run.
- Live GitHub projection sender: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1 and production integration: NOT QUALIFIED / NOT RUN.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Dispatch: keep fail-closed.

## Next bounded step

Perform a source-level integration trace from the production Supervisor/Worker workflow to the local D1 claim/attempt/outbox boundaries. Identify exact missing production interfaces and least-privilege workflow permissions; do not wire or dispatch. In parallel, preserve the #54 → #58 → #59 stack and require current-head CI plus independent review before any merge.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
