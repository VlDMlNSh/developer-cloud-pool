# Pass 113 — controller/API/D1 ancestry and governance reconciliation

Date: 2026-11-28

## Frozen target and scope
- Canonical default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Pass 111/112 candidate: `feat/pass111-d1-attested-receipt-2026-11-27` @ `4c8d820102472e130c2e9760f5d42f650ca43394`.
- Controller candidate PR #176: `feat/pass98-canonical-next-controller-audit-2026-11-25` @ `f06155b8ac121a4af90cbc2356f12b965d0fbde9`.
- Scope: read-only ancestry, exact-head, CI and governance reconciliation; no code integration, merge, dispatch, deployment or hosted mutation.
- DoD: establish exact refs and ancestry; inspect controller/verifier/D1 boundaries; re-read PR reviews/ruleset/CI; select safe next integration boundary; record evidence.

## Reuse First
- Reuse existing PR #176 controller workflow and `scripts/owner-next-event-audit.mjs`; it already performs read-only GitHub API reads for repository, Issue, Comment, Actions Run, workflow metadata, default ref and workflow file.
- Reuse Pass 105/106 API Envelope v1 contract/parser, Pass 110 Workers-native verifier, and Pass 111 attested D1 adapter/migration 0018.
- No new dependency, service, database, ledger, runner or model provider is justified. No OSS component is introduced in this reconciliation-only pass.

## Current refs and governance
- Repository metadata: public, default branch `Основной`; pushed_at 2026-11-28T15:58:39Z.
- Default ref re-read: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #176: OPEN/DRAFT/UNMERGED, head `f06155b8ac121a4af90cbc2356f12b965d0fbde9`, base default.
- PR #177: OPEN/DRAFT/UNMERGED, head `da8de0e258571fa98aad8da053f8e4134a94ceb9`, base default.
- PR #178: OPEN/DRAFT/UNMERGED, head `680bb7a1af7984b74b93e17284ef4f11ad30dba0`, base default.
- PR #179: OPEN/DRAFT/UNMERGED, head `80705bae2dca1f928368429c17922787b86be4bc`, base PR #178 branch.
- PR #180: OPEN/DRAFT/UNMERGED, head `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e`, base default.
- PR #181: OPEN/DRAFT/UNMERGED, head `4c8d820102472e130c2e9760f5d42f650ca43394`, base PR #179 branch.
- PR #182: OPEN/DRAFT/UNMERGED, same Pass 111 head, base default.
- Review submissions and inline review threads re-read for PRs #176–#182: empty arrays; formal independent review remains NOT RUN.
- Active ruleset #26550182 (`Основной — verified`) is confirmed active and scoped to `refs/heads/Основной`: PR required, deletion/non-fast-forward blocked, review-thread resolution required, required approving review count 0, no bypass actors. A zero-approval ruleset is not an independent security review.
- The default-branch Context Window currently contains stale repository state (header says last refreshed 2026-11-08 and historical HEAD). Pass 112 Context Window updates remain on the unmerged Pass 111 branch.

## Ancestry reconciliation — decisive finding
- Compare PR #176 head `f06155b...` to Pass 111 head `4c8d820...`: `diverged`, Pass 111 side ahead by 111 commits, PR #176 side behind by 38 commits, common merge base is the current default SHA `565404f...`.
- Compare PR #177 head `da8de0e...` to Pass 111 head: `ahead`, Pass 111 contains PR #177 head plus 79 commits.
- Compare PR #178 head `680bb7a...` to Pass 111 head: `ahead`, Pass 111 contains PR #178 head plus 31 commits.
- Therefore the D1/API chain (#177 → #178 → #179 → #181) is internally stacked, while the controller candidate #176 is an independent default-based line. A blind branch merge/cherry-pick is not justified: it would import 38 commits from a divergent line and risks duplicate or conflicting controller/API authority.
- PR #176 workflow blob `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a` exists only on its candidate branch; workflow path is absent on Pass 111 branch.
- The workflow invokes `scripts/owner-next-event-audit.mjs` and has contents/issues/actions read permissions. The script reads GitHub repository, Issue, Comment, Actions Run, workflow metadata, default ref and workflow file; it ends with OBSERVED_ONLY, admission NOT_CREATED, outbox NOT_CREATED, dispatch NOT_AUTHORIZED. It does not bind D1 or call an admission adapter.
- Pass 111 contains `proofs/d1-ledger/src/owner-next-envelope.mjs`, `proofs/d1-ledger/src/github-next-event.mjs`, migration 0018 and tests. The D1 adapter still exposes the legacy non-attested `admitGitHubNextEvent` alongside `admitGitHubNextAttestedEvent`; there is no production controller caller on this branch. Production import-surface restriction is NOT VERIFIED.

## CI evidence re-read
- D1 Ledger run #46162665233: SUCCESS; head SHA `4c8d820102472e130c2e9760f5d42f650ca43394`, PR #181/#182, base default SHA `565404f...`.
- Pool Contract run #46162665194: SUCCESS; same head SHA and PR/base metadata.
- These are exact Pass 112 branch runs for current branch HEAD; they validate existing D1/contract code and docs, not a composed Controller → API Envelope → attested D1 E2E.
- Combined commit status endpoint for `4c8d820...` reports pending with zero classic statuses; Actions workflow runs above are the authoritative observed checks. No newer controller/D1 composition run exists in the inspected latest run list.

## Decision
- Ancestry reconciliation: VERIFIED.
- Controller/API/D1 same-branch composition: BLOCKED; no code changes made because PR #176 is divergent and no safe minimal controller commit boundary has been proven.
- Pass 111 attested D1 adapter: prior local merge-result CI VERIFIED; hosted D1 and production use NOT VERIFIED.
- Same-run serialized Envelope v1 generation from live API readbacks, immutable Node ID and workflow-file-byte binding through D1 persistence, exact replay, default-ref race defense, legacy production import restriction and controller→D1 E2E: NOT VERIFIED / NOT IMPLEMENTED.
- No secrets read, hosted D1 writes, provider calls, executor dispatch, deployment, merge or production mutation. `dispatch=false`, `executionAuthorized=false`.
- Gemini, Claude, ECC/FCC: NOT RUN. Independent security review: NOT RUN. Active engineering time: NOT MEASURED.

## Next bounded pass
1. Extract the smallest controller workflow/API verifier change set from PR #176 (workflow + audit script + tests) and compare it to the existing Pass 105/106 Envelope producer contract; do not merge the whole divergent branch.
2. Create a new integration branch from Pass 111 head only after a file-level conflict/authority map is complete; port the controller read-only API evidence path without broad ancestry merge.
3. Produce the exact serialized Envelope v1 from the same Actions run's API readbacks and verify workflow file bytes/ref SHA, issue/comment Node IDs, run ID/attempt and observed default SHA.
4. Call only `admitGitHubNextAttestedEvent`; isolate legacy adapter to explicit test-only fixtures/imports.
5. Add same-run D1 E2E, exact replay and adversarial substitution tests; enforce false dispatch/execution authorization on every exit.
6. Run exact-head and canonical-base merge-result CI, then request independent security review through authorized gates. Do not merge.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
