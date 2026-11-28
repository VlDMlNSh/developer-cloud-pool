# Pass 120 — workflow-code provenance correction and Jarvis free-compute plan

Date: 2026-11-28  
Contour: A only  
Status: VERIFIED (source correction + exact-head CI); QUALIFIED/ACCEPTED: NOT CLAIMED  
Implementation PR: #186 (OPEN / DRAFT / UNMERGED)  
Validation-only PR: #187 (OPEN / DRAFT / UNMERGED; must not be merged)

## 1. Frozen target and scope

- Pass 111 attested D1 base: `453d74ff70a67d3091d920281f6471a721f1808d`.
- Pass 118 collector source: `9946881694fac6d57876d543103ee66af31a480b`.
- Initial Pass 120 branch point: PR #185 head `74bef427d4c68633ae57c26de5c9df352f45b4db`.
- Final tested code/test/workflow head: `8d0401ec7d45542a71e20594a9f22d193afe4846`.
- Documentation-only compute plan commit: `ccf48c23ed00f93bfda37bd52e9423f61ffdc2c9`.
- PR #186 and validation PR #187 both point to the same implementation branch; #187 targets default only to trigger the existing clean-base D1 workflow.

Scope: correct the workflow-file provenance binding consistently across collector, canonical Node and Workers validators, D1 receipt trigger and integration tests. Add a sourced free-compute/Jarvis routing plan. No dispatch/runtime deployment.

## 2. Reuse First

- REUSE existing API collector transport, canonical Envelope v1, digest tuple, Workers verifier and single append-only D1 receipt/ledger.
- ADAPT the provenance relation so workflow bytes are read at the immutable `GITHUB_WORKFLOW_SHA` and their exact ref is persisted as `workflowFileRefSha`.
- REUSE GitHub-hosted public runners, Cloudflare Workers/D1 Free tiers and Gemini Developer API Free tier as optional capacity, subject to their documented limits and qualification.
- No new runtime dependency, service, database, parallel ledger or paid fallback.

## 3. Security correction F-119-01

The prior collector read `.github/workflows/next-event-controller.yml` at the event/target SHA and set `workflowFileRefSha = headSha`. The D1 and Node/Workers validators enforced the same incorrect relation.

Corrected behavior:
1. Validate `GITHUB_WORKFLOW_SHA` as a SHA-1 commit identifier.
2. Fetch workflow file contents with `ref=GITHUB_WORKFLOW_SHA`.
3. Verify the Git blob digest from the returned bytes.
4. Persist `workflowCommitSha` and `workflowFileRefSha` as the same independently sourced commit, without conflating either with target/head SHA.
5. Require `workflowFileRefSha === workflowCommitSha` in both Node and Workers Envelope v1 validators.
6. Change migration 0018's insert guard to require `workflow_file_ref_sha = workflow_commit_sha`.
7. Update the local D1 attested-receipt fixture and add distinct target/workflow SHA acceptance and target-ref substitution rejection tests.
8. Add a collector test that proves the API contents request uses `GITHUB_WORKFLOW_SHA`, not `GITHUB_SHA`.

Files changed in the implementation slice:
- `scripts/owner-next-api-envelope.mjs`
- `scripts/owner-next-api-envelope.test.mjs`
- `scripts/owner-next-api-attestation-envelope.mjs`
- `scripts/owner-next-api-attestation-envelope.test.mjs`
- `proofs/d1-ledger/src/owner-next-envelope.mjs`
- `proofs/d1-ledger/test/owner-next-envelope.test.ts`
- `proofs/d1-ledger/test/github-next-event.integration.test.ts`
- `proofs/d1-ledger/migrations/0018_api_attested_source_comment_receipts.sql`

## 4. CI evidence

Final tested code/test/workflow head: `8d0401ec7d45542a71e20594a9f22d193afe4846`.

- D1 workflow run `46168608155`, job `141051675618`: SUCCESS. Fresh local Workers/D1 migration suite: 9/9 test files, 139/139 tests passed.
- Pool Contract run `46168608158`, job `141051675805`: SUCCESS. Workflow YAML parse passed; security contract validator passed; Node suite 29/29 passed, 0 failed.
- Pool Contract run `46168608181`, job `141051675838`: SUCCESS. Same exact head; 29/29 passed, 0 failed.
- Both Pool Contract jobs report `POOL_CONTRACT_VALIDATION=PASS` and the dispatch gate as disabled or unset. This does not prove the current Actions variable value outside that run.
- Initial CI attempts exposed fixture drift across the duplicated Node/Workers validators and D1 receipt expectation. Those failures were read from logs, corrected, and the final exact tested head passed all three workflow runs.
- Local tests outside GitHub Actions: NOT RUN. CI is the test execution evidence.
- Formal review submissions on PR #186: 0; review threads: 0. Independent security review NOT RUN.

## 5. Jarvis and free-compute improvement plan

Added `docs/architecture/JARVIS-FREE-COMPUTE-AND-ROUTING-PLAN-2026-11-28.md`.

Grounded resource allocation:
- GitHub public standard runners: free/unlimited for public repositories; standard `ubuntu-24.04` documented at 4 vCPU, 16 GB RAM, 14 GB SSD; Free-plan standard concurrency limit 20. Use for ephemeral parallel CI/test/agent jobs, not persistence or GPU.
- Cloudflare Workers Free: 100,000 requests/day, 10 ms CPU/invocation, 128 MB memory, 50 subrequests/request. Suitable for thin control plane only.
- Cloudflare D1 Free: 10 databases/account, 500 MB/database, 5 GB/account, 7-day Time Travel and 50 SQL queries per Worker invocation. Daily row read/write limits are enforced; single database is single-threaded. Use batching and indexes.
- Gemini Developer API Free tier: eligible model token use at no cost within per-model/project quotas. Free-tier content may be used to improve Google's products; exclude secrets and sensitive/private code. Account quota and route remain NOT VERIFIED.
- Local GPU/CPU nodes: no free cloud capacity is implied; host availability and capacity remain NOT VERIFIED.
- OpenAI API: usage-priced, not a free compute pool. No OpenAI API key is needed for this implementation and none was configured.

The plan strengthens Jarvis through task envelopes, coordinator/executor separation, persist-before-dispatch, free-first quota-aware model routing, role-isolated parallelism, artifact provenance, and fail-closed behavior. It does not enable any new provider route.

## 6. Safety and governance

- PR #186 OPEN / DRAFT / UNMERGED; stacked on PR #181.
- PR #187 OPEN / DRAFT / UNMERGED; validation-only against default. Do not merge it.
- No secrets or Actions variable values read.
- No API keys created or stored.
- No hosted D1 writes, provider calls, Gemini/Claude/OpenAI dispatch, executor launch, deployment, production mutation or merge.
- Existing active ruleset #26550182 remains in force on `refs/heads/Основной`; no governance mutation.
- Contour A remains BLOCKED / NOT ACCEPTED because end-to-end trusted controller wiring, durable runtime qualification, UI, executor/model routes, quotas, independent review and acceptance evidence remain outstanding.
- Contour B remains DEFERRED.

## 7. Metrics

- Final D1 CI: 139/139 pass.
- Final Pool Contract CI: 29/29 pass in each of two exact-head runs.
- Failed intermediate runs: 3 observed workflow attempts were investigated and superseded by the passing final head; no failures hidden.
- New dependencies/services/ledgers: 0.
- New provider routes enabled: 0.
- Active engineering time: NOT MEASURED; tool and CI elapsed time are not counted as engineering labor.
- Critical path now: same-run trusted controller invocation → API collector → Workers verifier → local D1 attested adapter; legacy import isolation; Claude Code + ECC + FCC runner qualification; remote web UI; quota-aware route qualification; independent security review.

## 8. Next bounded step

Pass 121: wire the collector into the trusted read-only `issue_comment` workflow and feed the exact serialized collector output/digest through the Workers verifier into the local D1 attested adapter in one integration test. Keep all results non-dispatching. Then prove legacy adapter import isolation and independently review the complete composed tree. Do not enable dispatch, add OpenAI credentials, deploy or merge.

Contour A: BLOCKED / NOT ACCEPTED.  
Contour B: DEFERRED.
