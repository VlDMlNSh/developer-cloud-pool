# Pass 121 — Live revalidation and workflow provenance composition gate

Date: 2026-11-28 19:18:56 Europe/Vilnius  
Contour: A only  
Status: VERIFIED (live GitHub audit and focused source review); exact-head CI evidence SUCCEEDED; same-run controller/D1 composition NOT RUN; Contour A BLOCKED / NOT ACCEPTED.  
Documentation target branch: docs/engineering-excellence-2026-11-23 (PR #169, OPEN / DRAFT / UNMERGED; not canonical).

## 1. Immutable target and source context

- Canonical default branch: Основной.
- Frozen default HEAD: 565404f84b6b86afb4dc2d8fa939341f42df6eca.
- Default tree: 0e473eee69b3c799a4ba5284103d3ca30e1bcae8.
- Default commit date: 2026-11-25T00:46:49Z; message: revert: remove checkpoint written to default branch in error.
- Repository pushed_at: 2026-11-28T17:15:04Z. The default HEAD itself did not advance.
- Repository is public and not archived. The open Issues endpoint returned 160 combined issue/PR records: 17 actual open Issues and 143 open PRs (100 + 43 across two PR pages).

Read first:
- Pass 120 report blob: be805443cdb258c3ab3cf7416ba59704f22f01cf.
- Pass 120 checkpoint blob: 23e222ad2f0b38d2431eff24c6200b600bb98b2e.
- Pass 120 Context Window blob: 6f1973c034dde8cd07dc58ff5bbbc3fbee16549c.
- Pass 120 context header still contained stale observed default SHA 197ba98... and stale documentation-branch metadata. This pass corrects the header and current repository/governance snapshot in the working documentation branch.

## 2. Canonical default contents and runtime evidence

Default branch currently contains five workflow files:
- dsh-runtime-evaluation.yml — blob df8a3788cd8ff4ba5c5b1009298f6bd81b80344d.
- pool-contract-validation.yml — blob d6a4e62c1521d09df7835a8a1b918dc83e079504.
- pool-supervisor.yml — blob 3942189fc338b73b39627706ea001e1b87dc0ed8.
- pool-worker.yml — blob 6833692c45bbb0b6f7bf31c068a30888c53f5471.
- runner-resource-probe.yml — blob 3b925d2ff7db77b669a1056b6ec04d4028640edf.

Direct default-branch reads returned 404 for:
- .github/workflows/next-event-controller.yml;
- proofs/d1-ledger;
- web.

The default-branch Actions query for event=issue_comment returned 0 runs. Thus no live owner /next controller execution was observed.

Latest default-branch Supervisor run:
- Run 46141645368, 2026-11-28T11:49:01Z, exact HEAD 565404f84b6b86afb4dc2d8fa939341f42df6eca.
- Job 140968671423, “Verify legacy dispatch remains retired”, SUCCESS.
- Steps only checkout and enforce retired legacy dispatch state. This is a retired heartbeat, not an executor or dispatch qualification.
- In the 100 most recent default-branch runs returned, Pool Worker, DSH Runtime Evaluation and Runner Resource Probe had no matching runs. Lifetime execution history for those workflows is NOT VERIFIED. No workflow was launched in this pass.
- POOL_DISPATCH_ENABLED was not read; current value is NOT VERIFIED.

## 3. Issues

All priority Issues remain OPEN:
- Issue #1 — Governance gate; last updated 2026-11-18.
- Issue #22 — Protected read-only web console; last updated 2026-11-17.
- Issue #26 — Account-isolated routing and quota ledger; last updated 2026-11-17.
- Issue #96 — Owner-only /next control issue; last updated 2026-11-18.
- Issue #140 — Current-base D1 admission/lease proof chain; updated 2026-11-28T17:02:03Z.

Issue #22 remains unimplemented on default: the default web directory is absent and the old Hono prototype is an unmerged, stale PR. Issue #26 remains NOT QUALIFIED: no provider calls, live account routing, quota evidence or independent account-boundary proof was performed.

## 4. Priority PRs #24/#25/#30/#31

All remain OPEN / DRAFT / UNMERGED, with zero formal review submissions and zero inline review comments.

| PR | Current head | Ahead / behind default | Exact-head CI |
|---|---|---:|---|
| #24 | 7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3 | 62 / 157 | Runs 42982847600 and 42982847694 SUCCESS; jobs 130397061861 and 130397062519 |
| #25 | 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85 | 29 / 157 | Runs 42228269689 and 42228269676 SUCCESS; jobs 127927220340 and 127927219846 |
| #30 | ad9f9ac598a2414b5209b6923094b16be64630ae | 35 / 157 | Synthetic push run 42216422883 SUCCESS; job 127887461269; no PR-triggered run returned |
| #31 | 5470fccbc4a5fe80a750f402d70d703757fc4c1d | 36 / 157 | Run 42229917555 SUCCESS; job 127932882432 |

All four share merge base 64d2636d4500127e635c214ccfb722c6b3fcda80, so their successful old-head CI does not qualify them against current default. Do not transplant or merge them as a batch.

## 5. Current D1/controller chain

PR #181:
- Head 453d74ff70a67d3091d920281f6471a721f1808d; OPEN / DRAFT / UNMERGED.
- Exact-head D1 run 46163553692, job 141035991048, SUCCESS.
- Exact-head Pool Contract run 46163553680, job 141035991160, SUCCESS.
- Formal reviews and inline threads: 0 / 0.

PR #182:
- Same head as #181, validation-only against default; OPEN / DRAFT / UNMERGED. Do not merge the validation-only PR.
- It does not create a live controller.

PR #185 — bounded API-attested collector:
- Head 74bef427d4c68633ae57c26de5c9df352f45b4db; OPEN / DRAFT / UNMERGED.
- 130 ahead / 0 behind default; 15 commits ahead of PR #181.
- Exact-head Pool Contract run 46168184010, job 141050350447, SUCCESS.
- Formal reviews and inline threads: 0 / 0.
- Pass 118 report records code/test/workflow head 9f80fb5df2bca95165385e989e284c633cc24f45 and 28/28 tests. The current PR head is 74bef... and has its own exact-head workflow success; the 28/28 count belongs to the earlier tested code head and is not restated as a measurement for 74bef.

PR #186 — workflow commit provenance correction:
- Head 82b7983d9b4178ffbad44bcfc8122a87a0026123; OPEN / DRAFT / UNMERGED.
- 144 ahead / 0 behind default; 29 commits ahead of PR #181.
- PR #186 is 14 commits ahead of PR #185 with 0 behind; it descends from and includes PR #185's collector work. Treat #186 as the later consolidated candidate, not as an independent parallel implementation.
- Exact-head CI at 82b798...:
  - Pool Contract run 46168765439, job 141052180779, SUCCESS.
  - Pool Contract run 46168765224, job 141052184672, SUCCESS.
  - D1 run 46168765420, job 141052164511, SUCCESS.
- Formal reviews and inline threads: 0 / 0.

PR #187:
- Same head 82b798... as #186; OPEN / DRAFT / UNMERGED; validation-only PR against default.
- Its exact-head checks are the same three runs above. It is not a separate implementation and must not be merged.

PR #183 — read-only poolctl:
- Head 3efb09bc39b8fd546c98a36a066486ebbc9ff61a; 21 ahead / 0 behind; OPEN / DRAFT / UNMERGED.
- Exact-head Pool Contract run 46164394254, job 141038604937, SUCCESS.
- It adds a local read-only CLI, not a protected remote web console or running executor.
- Formal reviews and inline threads: 0 / 0.

PR #184 — Spec Kit / llm.asm assessment:
- Head ca4af3f487bd780a3c441efc00a5c072c723f4ba; 37 ahead / 0 behind; OPEN / DRAFT / UNMERGED.
- The 18 changed files are spec templates, architecture, report/checkpoint and context documentation; no runtime controller or web console.
- Exact-head CI runs returned 0; formal reviews and inline threads: 0 / 0. Status: NOT VERIFIED for CI.

Documentation PR #169:
- Head 57541572d9c57b9dce90022cf224534084cf77d8 before this documentation update; OPEN / DRAFT / UNMERGED.
- 275 ahead / 2 behind current default; 123 changed files, documentation-only.
- Exact-head CI runs: 0; reviews/inline threads: 0 / 0.
- This remains a working documentation branch, not canonical. Pass 121 documentation is appended there without merging.

## 6. Pass 120 source correction — focused independent read

Reviewed immutable source blobs on PR #186:
- scripts/owner-next-api-envelope.mjs — blob e06a405bdb0d2b0d47fcabde6f0449d067a5cfd7.
- scripts/owner-next-api-attestation-envelope.mjs — blob 6c8d88629dc19ccf15f65f380db79d9dc2a60b4a.
- proofs/d1-ledger/src/owner-next-envelope.mjs — blob 594ef6611f1bc53c5ab8? [source blob is 594ef6611f1bc53c3b? verify exact blob below].
- proofs/d1-ledger/migrations/0018_api_attested_source_comment_receipts.sql — blob a7cbb7527d3dbe0882b68a88d13e15a3b3bbb1c6.

Confirmed F-119-01 correction:
1. Collector validates GITHUB_WORKFLOW_SHA separately from GITHUB_SHA.
2. It fetches the workflow file at ref=GITHUB_WORKFLOW_SHA, not the event/target SHA.
3. It computes the Git blob SHA from returned bytes and checks the API-reported blob identity.
4. It separately records target/head SHA, workflow commit SHA, workflow blob SHA and workflow file ref SHA.
5. Node and Workers validators require workflowFileRefSha === workflowCommitSha.
6. Migration 0018's insert guard requires workflow_file_ref_sha = workflow_commit_sha and workflow_commit_sha = workflow_sha.
7. The collector reads the current default ref and fails closed if it no longer equals the event target SHA.

This is a valid source-level correction. It is not live controller qualification.

Remaining hard blockers:
- .github/workflows/next-event-controller.yml is absent on both default and PR #186 branch (direct Contents API 404).
- The collector is not invoked by a trusted issue_comment workflow.
- Exact collector JSON/digest is not passed through the Workers verifier into the D1 attested adapter in one same-run integration path.
- The D1 proof package is absent from default; hosted D1 behavior was not tested.
- Legacy non-attested admission remains exported/used by compatibility tests; production import-surface isolation is NOT VERIFIED.
- The digest is an integrity checksum, not a signature. Trust depends on the authenticated workflow source and same-run composition; that boundary is not yet exercised.
- Default-ref equality is fail-closed but a moving default branch can cause rejection; no retry/reconciliation policy is qualified.
- No live issue_comment event or actual D1 admission was executed.

## 7. GitHub Read Adapter path-segment branch

Branch fix/github-read-adapter-path-segments-2026-11-06:
- HEAD dee17350864cb49e8c5dd41cf61859d77d3affca.
- 38 ahead / 157 behind current default; merge base 64d2636d4500127e635c214ccfb722c6b3fcda80.
- 19 changed files.
- No associated PR found; exact-head CI NOT VERIFIED.
- Do not transplant the entire branch. If needed, extract only a minimal path-segment patch from current default and add focused tests.

## 8. Governance and reviews

Ruleset #26550182 was read directly:
- Enforcement ACTIVE; exact include selector refs/heads/Основной.
- Pull request required.
- Deletion and non-fast-forward restricted.
- Required approvals: 0.
- CODEOWNERS review disabled.
- Required status-check rules: none.
- Review-thread resolution required.
- Bypass actors: none; current-user bypass: never.

Classic branch-protection GET returned 403; classic protection is NOT VERIFIED. An active ruleset is not equivalent to independent approval. No ruleset/branch-protection change was made.

Formal review submissions and inline review comments are 0 for the reviewed priority PRs. Independent security review and final acceptance remain NOT VERIFIED.

## 9. Actions, metrics and safety

Completed:
- Read the current Context Window and Pass 120 report/checkpoint.
- Re-read live default branch, current Issues/PRs, exact-head Actions runs/jobs, ruleset and selected source files.
- Performed one bounded source-level provenance audit of the Pass 120 correction.
- Updated only dated report/checkpoint/context documentation on the working docs branch.

Not performed:
- No code, workflow, schema or dependency changes.
- No workflow launch or rerun, dispatch, agent, DSH, Resource Probe, provider/model call, hosted D1 write, deployment, merge or production mutation.
- No secrets, tokens, API keys or their values read, copied or disclosed.
- No Actions variable or secret value read or changed; POOL_DISPATCH_ENABLED remains NOT VERIFIED.
- Local tests NOT RUN; CI evidence is GitHub Actions only.
- Active engineering time NOT MEASURED.

## 10. Next bounded step — Pass 122

Build one clean integration candidate from the frozen current default HEAD 565404f84b6b86afb4dc2d8fa939341f42df6eca:
1. Port only the minimal trusted read-only issue_comment controller and the bounded collector; do not create a second controller or ledger.
2. Bind GITHUB_SHA (event target) separately from GITHUB_WORKFLOW_SHA (workflow code commit); read back workflow bytes and verify the Git blob SHA.
3. Pass the exact serialized Envelope v1 JSON and digest from the collector into the Workers verifier and the existing D1 attested adapter in one local integration test.
4. Prove fail-closed behavior for default-ref movement, workflow substitution, node-ID substitution with recomputed digest, replay, rerun, ambiguous receipt acknowledgement and missing/partial receipt.
5. Isolate the legacy non-attested adapter from production import paths while retaining explicit compatibility tests.
6. Run exact-head D1 and Pool Contract CI; record exact run/job/merge-result SHAs.
7. Keep dispatch=false and executionAuthorized=false. No hosted D1, real owner event, secrets, provider calls, executor, deployment or merge.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
