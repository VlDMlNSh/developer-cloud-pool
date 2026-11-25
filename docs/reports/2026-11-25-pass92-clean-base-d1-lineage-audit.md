# Pass 92 — clean-base D1 lineage and migration overlap audit

Date: 2026-11-25

## Frozen target and branch

- Current default target SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Confirmed by latest repository commit search and PR #174 base SHA.
- Created staging branch `integration/pass92-d1-clean-base-565404f` directly from that SHA.
- No commit or file change has been applied to the staging branch in this pass.
- PR #170 candidate head: `40281787c208af2df916f10af1dba073061ff0d3`.
- PR #111 candidate head: `687196738782432797bf394f1342cb9df19f478f`.
- PR #174 head: `a8809c1dc8c2eaa49944fb031baeec54ce46b922`, base `565404f...`.
- PR #169 docs head at recheck: `9f75b59e848d9ef21372f15b3757b81fd2eba8c4`.
- PR #171 head: `423da55ca1e2d91c28572f88f60b494b59d56e9e`.
- PRs #111/#170/#169/#171 remain old-base or separate candidates; PR #174 is current-base but unmerged. No formal reviews or inline threads on #170/#174 (0/0 each).

## Scope and Reuse First

Reviewed Issue #140 and #96, candidate changed-file lists for #111/#112/#114/#125/#170/#174, current default presence of all 35 paths from PR #170, and blob identity for common #111/#170 files.

Reuse decision:
- Reuse/adapt PR #170's current canonical D1 lineage as the strongest candidate, including migrations 0001–0017, existing Workers Vitest/Miniflare harness and pinned dependencies.
- Do not merge/copy PR #111's older migration sequence independently.
- Do not add a second D1 ledger from PR #114/#125; those use `proofs/d1-admission` and a separate admission migration namespace.
- Do not wire PR #174's API audit yet; Pass 91 established that its API-verified result is not passed to D1.
- No new package or dependency proposed.

## Migration/file overlap matrix

| Path / item | PR #111 vs PR #170 | Decision |
|---|---|---|
| `proofs/d1-ledger/README.md` | Different blob | Use PR #170 README as latest canonical candidate; review wording during port |
| `0001_create_pool_approval_ledger.sql` | Different blob | Use PR #170 version; inspect semantic delta before port |
| migrations 0002–0005 | Identical blobs | Shared historical lineage; preserve IDs/content |
| PR #111 migration 0006 `guard_running_attempt_requires_lease` | Not present in PR #170 under that name | Do not copy as migration 0006; PR #170 has later lease/fencing migration 0014 |
| PR #170 migration 0006 `create_attempt_projection_outbox` | Different purpose/name from #111 migration 0006 | Preserve PR #170 sequence; do not renumber |
| `package.json` | Different blob | Use PR #170 pinned dependency contract |
| `src/worker.mjs` | Different blob | Use PR #170 inert worker; verify after port |
| PR #170 migrations 0007–0017 | No direct #111 same-ID counterpart in the reviewed change list | Preserve the full PR #170 sequence as one lineage |
| `proofs/d1-admission` (#114/#125) | Separate package and migration 0001 | Do not import into canonical D1 ledger |
| Workflow `d1-ledger-proof-validation.yml` | Shared path in #111/#170, content must be PR #170 version | One workflow only |

All 35 PR #170 changed paths were checked against the current default branch and were absent there. This is an absence check, not a claim that no related schema or legacy data exists elsewhere in the repository.

## Findings

### F92-01 — migration numbering collision

PR #111 and #170 cannot be combined by path overlay. The two migration 0006 files have different semantics. PR #170's later migration 0014 is the current lease/fencing candidate. Keep one ordered 0001–0017 sequence; never renumber or append the PR #111 migration 0006 under the same ID.

### F92-02 — one canonical package

PR #114/#125 use a separate `proofs/d1-admission` package and their own migration 0001. Importing it alongside `proofs/d1-ledger` would create competing admission stores and authorities. Reuse only compatible predicate/context concepts after the Pass 91 API provenance gap is closed.

### F92-03 — safe base-preserving tree construction not completed

The available GitHub write interface can create a branch and commits/files, and can create a Git tree when supplied a base tree SHA. The commit-fetch interface returned normalized metadata without the base tree SHA; direct API retrieval through the web reader was inaccessible. Creating a tree without the base tree would replace the repository tree rather than add these files, so it was intentionally not attempted. Staging branch remains clean at the frozen parent SHA.

## Evidence / tests

- Current default latest commit: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Staging branch created successfully from that exact SHA: `integration/pass92-d1-clean-base-565404f`.
- 35/35 PR #170 paths absent from default branch.
- Blob comparison: PR #111/#170 migrations 0002–0005 identical; README, migration 0001, package.json and worker differ; migration 0006 is semantically distinct.
- Existing PR #170 CI remains historical candidate evidence only: D1 123/123 and Pool Contract PASS on PR #170's old head, not on the clean current-base staging branch.
- No new CI run; no runtime or schema code changed.
- No hosted D1, live webhook, dispatch, secrets, provider calls, deployment, merge, production write or governance mutation.
- Current ruleset and current `POOL_DISPATCH_ENABLED` NOT VERIFIED.
- Gemini NOT RUN; Claude Code/ECC/FCC NOT RUN; independent review NOT RUN.
- Active engineering time NOT MEASURED.

## Status and next step

- Source/migration audit: VERIFIED.
- Clean staging branch parent: VERIFIED.
- D1 port on clean base: BLOCKED pending a base-preserving tree write mechanism or an approved controlled file-by-file import process.
- API provenance-to-D1 composition: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next pass: obtain the base tree SHA through an approved Git object read path, then create one base-preserving tree/commit containing the reviewed PR #170 file set. Verify parent SHA, tree contents, diff and branch head before opening a draft PR and triggering exact-head D1 + Pool Contract CI. Do not merge.

Canonical MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
