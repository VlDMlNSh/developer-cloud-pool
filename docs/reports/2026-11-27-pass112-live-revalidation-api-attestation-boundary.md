# Pass 112 — live revalidation and API-attested D1 boundary audit

Date: 2026-11-27  
Audit time: 19:54:12 Europe/Vilnius (UTC+02:00)  
Scope: Contour A only. Read-only GitHub revalidation plus one bounded source-level security review. No runtime, workflow, provider, deployment, secret, variable or governance mutation.

## Result

- GitHub repository/default/branch/Issue/PR/ruleset reads: VERIFIED.
- Exact-head GitHub Actions evidence: SUCCEEDED where listed below.
- Pass 111 D1 receipt proof: CI-VERIFIED on a synthetic PR merge result; hosted D1/runtime NOT VERIFIED.
- API verifier → attested D1 same-run composition: BLOCKED.
- Independent review: NOT VERIFIED (zero formal reviews and zero review threads on the inspected PRs).
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Dispatch and execution authorization remain false in the reviewed proof paths. Current repository variable value `POOL_DISPATCH_ENABLED` was not read.

## Frozen canonical baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca` (unchanged from Pass 111).
- Default tree: `0e473eee69b3c799a4ba5284103d3ca30e1bcae8`, 70 entries, not truncated.
- Repository is public and not archived.
- Open Issues: 17. Open PR search returned 100 results (first page); this is not asserted as the total.
- Default combined commit statuses: empty.
- `issue_comment` workflow-run query: 0 results.
- Default tree contains five workflows only: DSH Runtime Evaluation, Pool Contract Validation, Pool Supervisor, Pool Worker, Runner Resource Probe.
- Default tree has no `web/` application, no `proofs/d1-ledger/`, and no `.github/workflows/next-event-controller.yml`.

Latest default Supervisor run:
- [Run 45995541766](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45995541766), scheduled, exact default HEAD above, SUCCESS.
- Job `140493896631`, “Verify legacy dispatch remains retired”, SUCCESS.
- This is retired heartbeat verification only. It is not a task execution, executor qualification or controller runtime proof.

## Priority Issues

- [#1 Governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1): OPEN. Latest detailed owner governance comments are dated 2026-11-18; no later authorization to change Ruleset/branch protection was found.
- [#22 Protected Web Console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22): OPEN. No web application exists on default.
- [#26 Account isolation, routing and quotas](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26): OPEN. No qualified production routing/quota ledger on default.
- [#96 Owner-only /next](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96): OPEN. No canonical controller on default and no live issue_comment run.
- [#140 D1 admission](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140): OPEN. Latest issue comment records Pass 111; admission remains proof-only.

## Governance read-back

Repository Ruleset [#26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182):
- Enforcement ACTIVE; applies to default branch.
- Pull request required.
- Deletion and non-fast-forward blocked.
- Review-thread resolution required.
- Required approving reviews: 0.
- CODEOWNERS review: disabled.
- Required status-check rule: absent.
- Bypass actors: none.

Classic branch-protection GET returned 403; classic protection is NOT VERIFIED. The Ruleset is separate evidence and does not provide an independent-approval gate. Issue #140 policy excludes changing branch protection; no Ruleset or variable change was made.

## PR and branch revalidation

All listed PRs remain OPEN / DRAFT / UNMERGED. Formal reviews and inline review threads are 0 unless stated otherwise; all inspected PRs returned 0 for both.

| PR | Current head | Ahead / behind current default | Exact-head CI |
|---|---|---:|---|
| [#24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24) | `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3` | 62 / 157 | Runs 42982847600, 42982847694 SUCCESS (old head/base) |
| [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` | 29 / 157 | Runs 42228269689, 42228269676 SUCCESS (old head/base) |
| [#30](https://github.com/VlDMlNSh/developer-cloud-pool/pull/30) | `ad9f9ac598a2414b5209b6923094b16be64630ae` | 35 / 157 | No runs; NOT VERIFIED |
| [#31](https://github.com/VlDMlNSh/developer-cloud-pool/pull/31) | `5470fccbc4a5fe80a750f402d70d703757fc4c1d` | 36 / 157 | Run 42229917555 SUCCESS (old head/base) |
| [#169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169) | `142ac78e4ada7b34b50c340383fbd617c619e0fd` | 271 / 2 | No exact-head run; 0 reviews |
| [#174](https://github.com/VlDMlNSh/developer-cloud-pool/pull/174) | `a8809c1dc8c2eaa49944fb031baeec54ce46b922` | 10 / 0 | Run 45677997233 / job 139430608357 SUCCESS |
| [#175](https://github.com/VlDMlNSh/developer-cloud-pool/pull/175) | `3d69bc943677dba909792bf4930d4c0aa5d2233f` | 40 / 0 | D1 45690428935 / job 139474112922; Contract 45690428805 / job 139474113226 — SUCCESS |
| [#176](https://github.com/VlDMlNSh/developer-cloud-pool/pull/176) | `f06155b8ac121a4af90cbc2356f12b965d0fbde9` | 38 / 0 | Run 45878779775 / job 140112502379 SUCCESS |
| [#177](https://github.com/VlDMlNSh/developer-cloud-pool/pull/177) | `da8de0e258571fa98aad8da053f8e4134a94ceb9` | 32 / 0 | Run 45880483014 / job 140119303041 SUCCESS |
| [#178](https://github.com/VlDMlNSh/developer-cloud-pool/pull/178) | `680bb7a1af7984b74b93e17284ef4f11ad30dba0` | 80 / 0 | D1 45881609559 / job 140122059147; Contract 45881609482 / job 140122085451 — SUCCESS |
| [#179](https://github.com/VlDMlNSh/developer-cloud-pool/pull/179) | `80705bae2dca1f928368429c17922787b86be4bc` | 13 / 0 (stacked on #178) | No exact-head run; NOT VERIFIED |
| [#180](https://github.com/VlDMlNSh/developer-cloud-pool/pull/180) | `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e` | 86 / 0 | D1 45895942746 / job 140169725137; Contract 45895942756 / job 140169725307 — SUCCESS |
| [#181](https://github.com/VlDMlNSh/developer-cloud-pool/pull/181) | `682b060ef376b8ebee8ae47872150776d28c4426` | 15 / 0 (stacked on #179) | Exact-head validation via #182: D1 45897304880 / job 140174283393; Contract 45897304914 / job 140174303010 — SUCCESS |
| [#182](https://github.com/VlDMlNSh/developer-cloud-pool/pull/182) | `682b060ef376b8ebee8ae47872150776d28c4426` | 108 / 0 | Validation-only PR on default; same two exact-head runs above |

Notes:
- PR #24/#25 use an older base SHA; #30/#31 are stacked on the old #25 branch. Their successful historical CI does not qualify them against current default.
- PR #179 is stacked on #178 and has no run for its current head. PR #180 is validation-only for the earlier Workers verifier code/test SHA.
- PR #181 is stacked on #179. PR #182 is the validation-only copy targeting current default; it must not be merged.
- PR #182 synthetic merge-result SHA: `13445081dfc6d79ec65678989683a5057cdecdf3`; tree SHA `7ddc3ef71e4eabbc077a3dba773b7394ff9b48ec`. D1 job log confirms checkout of that merge result, 9/9 test files and 137/137 tests passed. Contract job succeeded, parsed six workflow YAML files and reported `POOL_CONTRACT_VALIDATION=PASS`; its dispatch assertion step succeeded. This does not establish the current repository variable value or hosted runtime.
- PR #181 code/test SHA `88911e5a127b9345270b15da8e7cd3f8aa54293a`; six later commits to head `682b060...` changed only the Pass 111 report, checkpoint and Context Window.
- PR #169 remains the documentation working PR, not canonical: 121 changed files, 271 ahead / 2 behind, no exact-head CI, 0 reviews/threads. Its Context Window was still at Pass 103 and its latest report/checkpoint were Pass 103 before this Pass 112 update.

GitHub Read Adapter path-segment branch:
- `fix/github-read-adapter-path-segments-2026-11-06` @ `dee17350864cb49e8c5dd41cf61859d77d3affca`.
- 38 ahead / 157 behind; 19 changed files; no PR; no exact-head CI.
- The path validation code/tests are present, but the branch is a broad stale prototype. Do not transplant the full branch.

## Pass 111 D1 candidate — bounded source-level review

Pass 111 report/checkpoint were read from PR #181 branch before this audit:
- [Pass 111 report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass111-d1-attested-receipt-2026-11-27/docs/reports/2026-11-27-pass111-api-attested-d1-receipt.md)
- [Pass 111 checkpoint](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass111-d1-attested-receipt-2026-11-27/docs/checkpoints/2026-11-27-pass111-api-attested-d1-receipt.md)

Inspected immutable source blobs:
- `proofs/d1-ledger/src/owner-next-envelope.mjs`: `9822f6feaed866a55fa830ba835fa493625f8677`.
- `proofs/d1-ledger/src/github-actions-context.mjs`: `574d289964b5d908395573b91c6f890305c94eeb`.
- `proofs/d1-ledger/src/github-next-event.mjs`: `af12b9113de5f67d0242ef19f57c2d6b999270a3`.
- `proofs/d1-ledger/migrations/0018_api_attested_source_comment_receipts.sql`: `366a890797cd8187848072894a1d7dbe8f5e6791`.
- `proofs/d1-ledger/test/github-next-event.integration.test.ts`: `590c86c52ede5323dc9a08c7b7562a20d507e743`.
- PR #176 controller workflow: `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a`.
- PR #176 API verifier: `4e969000ab32df6ff37663c329fe406b859809f4`.

Confirmed implementation:
- Migration 0018 adds API-attestation fields to the existing append-only source-comment receipt.
- `admitGitHubNextAttestedEvent` strictly parses Envelope v1, recomputes WebCrypto SHA-256, cross-checks GitHub Actions context, and binds the digest to the existing D1 approval/admission/receipt path.
- Exact replay and fault/reconciliation cases are covered by local D1 integration tests.
- Worker entrypoint remains deliberately inert and returns 404; this is a local proof package, not hosted D1.

New residual security finding:
1. PR #176's `owner-next-event-audit.mjs` independently reads repository, issue, comment, workflow run, workflow metadata, default ref and workflow file blob from GitHub API. It returns `OBSERVED_ONLY` and writes a step summary only. It does not serialize Envelope v1 to `GITHUB_OUTPUT`/artifact or call the D1 adapter.
2. PR #181's Workers verifier cross-checks event/run fields available in `mapGitHubActionsContext`, but does not independently bind API-only fields `issueNodeId`, `commentNodeId`, `workflowId`, `workflowState` and `workflowFileBlobSha` to an API response at the D1 boundary. Those fields receive schema/format/relationship checks and are included in a plain SHA-256 digest; the digest is unkeyed and can be recomputed by a caller that can replace both JSON and digest. Therefore it establishes consistency of supplied data, not independent authenticity of GitHub API provenance.
3. The current substitution test changes `commentNodeId` while retaining the original digest. It proves stale-digest rejection, but does not test altered API-only fields with a recomputed digest. No test currently proves that those fields cannot be forged while preserving the other trusted Actions context.
4. The D1 adapter does not independently re-read the current default ref or workflow blob. The controller verifier reads these from GitHub API, but no authenticated same-run envelope transfer connects that evidence to D1; a default-ref race and workflow-blob authenticity remain unqualified.
5. The legacy non-attested `admitGitHubNextEvent` export remains in the adapter, and migration 0018 accepts legacy empty-sentinel receipt rows. It is described as compatibility-test-only, but the production import surface has not been narrowed. Before controller activation, ensure production code can call only the attested entrypoint.
6. The current D1 adapter performs admission and source-comment receipt as a recoverable sequence, not one demonstrated single SQL transaction. Existing tests cover commit-then-lost-ack and primary readback failure; preserve the explicit reconciliation semantics and do not overstate transaction atomicity.

The API verifier/controller and D1 attested adapter are separate PR paths. There is no single workflow callsite and no live `issue_comment` run. This is a blocker for controller qualification, not evidence of an active dispatch vulnerability: no controller exists on default and dispatch remains disabled in the proof.

## Runtime and executor state

- Supervisor: scheduled retired-heartbeat workflow only; latest run 45995541766 SUCCESS.
- Worker: legacy DSH workflow is retired/fail-closed; no qualified executor.
- Gemini controller: absent on default.
- Hosted D1: NOT VERIFIED.
- Provider routing/account isolation/quota ledger: NOT QUALIFIED.
- Protected Web Console: NOT IMPLEMENTED on default.
- Persistent user-visible state/recovery: NOT VERIFIED.

## Work performed and limits

- Read current documentation Context Window and latest Pass 111 report/checkpoint; independently re-read GitHub refs, Issues, PRs, Actions runs/jobs, ruleset, branch protection endpoint and source files.
- Performed one bounded source-level review of the Pass 111 D1 adapter against the Pass 98 controller verifier and Workers context adapter.
- No code, SQL, workflow, secret, variable, Ruleset, branch protection or runtime changes.
- No workflows were manually launched; no dispatch, agents, DSH, Resource Probe, provider/model calls, hosted D1 writes, deployment, merge or production mutation.
- No secrets, tokens or API-key values were read or copied. `POOL_DISPATCH_ENABLED` was not read.
- Local tests NOT RUN; GitHub exact-head/merge-result CI is the only test execution evidence. Active engineering time NOT MEASURED; no time estimate claimed.

## Decision and next bounded step

Pass 112 source audit: VERIFIED. API verifier → D1 attested receipt composition: BLOCKED. Keep `dispatch=false` and `executionAuthorized=false`.

Next: on a clean current-default branch, build one non-dispatching same-run controller composition that:
1. obtains the exact owner `issue_comment` and performs GitHub API readback;
2. constructs a single immutable envelope from those API results;
3. binds API-only node IDs, workflow ID/state, workflow blob SHA and observed default HEAD to an authenticated same-run trust boundary or independently re-verified D1 input;
4. calls only `admitGitHubNextAttestedEvent`;
5. removes the legacy non-attested entrypoint from production import surface while retaining explicit compatibility tests;
6. adds adversarial tests that alter API-only fields and recompute the unkeyed digest, substitute workflow blob/ref, race the default ref, replay/rerun, and inject ambiguous D1 receipt acknowledgement;
7. verifies exact-head and synthetic merge-result CI without enabling dispatch.

No hosted D1, real issue_comment trigger, executor or provider call until the required gates are explicitly qualified. Contour B remains DEFERRED.
