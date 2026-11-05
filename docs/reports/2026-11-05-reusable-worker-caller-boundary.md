# 2026-11-05 — reusable Worker caller-boundary implementation pass

## Scope and immutable target
- Canonical branch: `Основной`, HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`.
- Working branch compare: 4 commits ahead, 0 behind; merge base is exactly canonical HEAD.
- Latest implementation commit: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`.
- This branch is NOT canonical and has no acceptance/merge status.

## Live source findings
- Default Worker blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` still exposes `workflow_dispatch` and validates public issue state/labels/body only.
- Default Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` still starts the script-based Supervisor; Supervisor script blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f` still calls the REST workflow-dispatch endpoint.
- Default contract validator blob `cfffb77905406d54505c711504a72ae1fafd3f06` does not enforce reusable caller identity.
- The Gemini batch controller file is absent from the default branch (file lookup returned 404); Gemini NOT RUN.
- Current governance variable/ruleset remain NOT VERIFIED. Historical Issue #1 evidence is not current proof.

## Official GitHub semantics checked
- The current GitHub Actions Contexts reference documents `github.workflow_ref` and `github.workflow_sha` as caller workflow properties, and `job.workflow_ref`, `job.workflow_sha`, `job.workflow_repository`, and `job.workflow_file_path` as the workflow defining the current job. In a reusable workflow these identify the called workflow. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- GitHub's reusable workflow reference confirms the call is a job-level static `uses`, not a step/API dispatch; the called workflow's `github` context remains associated with the caller. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- The four `job.workflow_*` properties were announced for reusable workflows in September 2026. Source: https://github.blog/changelog/2026-09-03-github-actions-early-september-2026-updates/
- The implementation therefore checks caller identity via `github.workflow_ref`/repository and reusable Worker identity via `job.workflow_repository`/file path, and requires caller and reusable workflow SHAs to match for a same-repository local reusable call. This assumption still requires independent security review and a controlled non-privileged fixture workflow before qualification.

## Implementation performed
Added `scripts/pool-worker-caller.mjs` on the working branch only.
- Commit: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`.
- Read-back blob SHA: `88d79d74691431ead14f29426d214833c0086183`.
- Validator fails closed on missing context, wrong caller repository/ref, wrong reusable workflow repository/path, malformed SHAs, or differing caller/reusable workflow SHAs.
- It deliberately does not accept actor identity, labels, comments, or caller-supplied approval fields as authority.
- The helper is not yet wired into the Worker workflow or the contract-validation workflow.

## Verification and status
- GitHub read-back of the helper and blob SHA: VERIFIED.
- Branch ancestry: VERIFIED (4 ahead / 0 behind canonical).
- Tests: NOT RUN. Creation of the test file was blocked by the tool security layer; no test file was committed.
- Exact-head CI for `056f2f43d007a29b3893c4a26e6658ba7cb394ca`: NOT VERIFIED; associated PR workflow runs empty and combined status has no statuses.
- Independent security review: NOT RUN.
- No PR created or merged; no canonical files changed.
- No secrets/variables read or changed; Worker, DSH, Resource Probe, browser, model/provider calls and privileged dispatch NOT RUN.
- Gemini NOT RUN (controller absent); Claude Code NOT RUN (no verified third host/free route in this pass); paid fallback NOT USED.
- Runtime NOT QUALIFIED; no dispatch enablement.

## Open PR snapshot
- PR #7 remains open/draft; latest review submission is a COMMENTED finding authored by the owner, not independent review. It correctly identifies direct Worker dispatch as a bypass.
- PR #8 remains open/draft; review submissions empty. Its approval-shaped input is not an authenticated capability.
- PR #10 and #11 remain open/draft according to the repository PR search. PR #11's historical run `41918209585` was success for its then-current head; it is not evidence for this working branch.
- PR #11 review submissions empty. No merge performed.

## Next bounded step
1. Add and run unit tests for `pool-worker-caller.mjs` plus static YAML contract tests.
2. Wire fail-closed caller validation into Worker and convert Worker to `workflow_call`; remove `workflow_dispatch`.
3. Refactor Supervisor into a planner/matrix output job plus a statically declared reusable Worker job; remove REST dispatch.
4. Preserve approval consumption/replay safety and bounded 0..20 matrix behavior; do not treat a public marker or a planner input as authority.
5. Keep dispatch disabled; require exact-head CI, independent review, current governance evidence, and separately authorized read-only probe before any runtime.

## Follow-up 2026-11-05 — tests and review intake
- Added `scripts/pool-worker-caller.test.mjs`; read-back blob SHA `251a4772d85a5dff8cdcc8ca589509ffa48eac98`. It covers one positive context, missing context/spoofed actor+approval, wrong caller ref/repository, wrong called workflow path/repository, malformed SHA and revision mismatch.
- Wired `node --test scripts/pool-worker-caller.test.mjs` into the read-only `Pool Contract Validation` workflow. Read-back blob SHA `5991c0cf839d510ef6e6540895ddbcd9e306c068`.
- Opened draft PR #12: https://github.com/VlDMlNSh/developer-cloud-pool/pull/12 . Base `Основной` SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`; PR head at creation `215bd04490d19ec1d6392a8defa9bbd9e1e7bafc`.
- PR #12 remains DRAFT / NOT ACCEPTED. Exact-head workflow runs and combined status queried immediately after creation returned empty arrays; CI NOT VERIFIED, not PASS. Independent review NOT RUN.
- Branch compare against canonical: 8 commits ahead / 0 behind; merge base exactly canonical SHA. No canonical changes.
- The CI workflow is pull_request-triggered for changes under `.github/workflows/**` or `scripts/**`; it is a read-only validation job. No pool Supervisor/Worker runtime was dispatched.
- The test suite has been committed but has not yet executed in an observed runner. Do not report test pass until the exact PR head run is visible and completed successfully.


## Final state correction — current branch head
- The report's earlier 4-ahead / 8-ahead figures are historical snapshots. Latest live compare after this report/checkpoint update: 10 commits ahead, 0 behind canonical; merge base remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Latest branch HEAD at checkpoint read-back: `6b409e0b09d2cef1b507d50662236d6f80b32340`.
- Latest report blob at read-back: `af9329089528e46b35248f9ca540bdf44aaa1361`; latest checkpoint blob: `b61258165101ba67bd72adb86f16b074e360fc8c`.
- PR #12 was created as DRAFT at head `215bd04490d19ec1d6392a8defa9bbd9e1e7bafc`. The branch has advanced since PR creation; do not treat that recorded SHA as the current PR head. A live exact-head CI run has not been observed; CI remains NOT VERIFIED.


## Follow-up verification — 2026-11-05 current live pass

- Live PR #12 snapshot: OPEN / DRAFT / NOT MERGED; head `4d656a4337246f24cb3909a77e4198434f54076a`; base `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Live compare: 12 commits ahead / 0 behind; merge base exactly canonical base SHA. No canonical branch changes.
- Exact PR validation workflow run `41973768962` completed SUCCESS. GitHub Actions associated this run with PR merge ref `a41434d7b265e85e1347c483f427f83d36a0c3f0` (merge of PR head `4d656a4337246f24cb3909a77e4198434f54076a` into base), not a direct checkout of the head SHA. Therefore classify as **PR merge-result CI PASS**, while direct head-only CI is not separately evidenced.
- Job `127067796013` completed SUCCESS. Logs show `POOL_DISPATCH_ENABLED=false` in that validation run; YAML parsing passed for all five workflow files; Node tests: 8 passed, 0 failed; static pool contract validator emitted `POOL_CONTRACT_VALIDATION=PASS`. Runner was standard `ubuntu-24.04`; token permissions contents:read and metadata:read; checkout credentials were not persisted.
- Caller validator/test/workflow files reread from branch; blob SHAs unchanged: validator `88d79d74691431ead14f29426d214833c0086183`, tests `251a4772d85a5dff8cdcc8ca589509ffa48eac98`, CI workflow `5991c0cf839d510ef6e6540895ddbcd9e306c068`.
- PR #12 reviews: none. Independent security review NOT RUN. PR remains DRAFT.
- Canonical Worker reread: blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; still `workflow_dispatch` with issue-label/body validation. Canonical Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; still launches REST-dispatching supervisor script. Caller validator remains unwired. Authorization boundary BLOCKED.
- Gemini controller absent from canonical branch (404); Gemini NOT RUN. Claude Code NOT RUN; no verified third host/free route. Worker, DSH, Resource Probe, browser, model/provider calls and privileged dispatch NOT RUN. Paid fallback NOT USED. Runtime NOT QUALIFIED.
- Governance: historical Issue #1 records Ruleset ID `26550182` and `POOL_DISPATCH_ENABLED=false` on 2026-11-04, but this pass did not independently query the live ruleset/settings endpoint. The workflow log's false value is run-scoped evidence only. Current governance qualification remains NOT VERIFIED.
- PR #7/#8/#11 remain open drafts in this snapshot; PR #7's only review is a COMMENTED owner-authored finding, PR #8/#11 have no reviews. None are accepted or merged.

## Next bounded step
Build a non-privileged reusable-workflow fixture to capture the actual `github.workflow_*` and `job.workflow_*` context values under a statically declared local `workflow_call` invocation, then compare those observed values against the validator assumptions. Do not wire the validator into the production Worker or refactor Supervisor until fixture evidence and independent review validate the context semantics and same-SHA assumption. Keep all dispatch/runtime gates closed.


## Reusable-workflow context fixture — 2026-11-05

- Added a read-only caller workflow: `.github/workflows/reusable-worker-context-fixture-caller.yml`, blob `ac35c24a26bef2a9e5a894a274ec6f1f1b13ca7f`.
- Added a `workflow_call` fixture: `.github/workflows/reusable-worker-context-fixture.yml`, blob `d6e7815db794de293e143aba48eaa36e5ab7ecd8`.
- Both workflows use `contents: read`; called job runs on `ubuntu-24.04`, has 2-minute timeout, no checkout, no secrets, no model/provider/browser/Worker dispatch. It emits only non-secret workflow identity metadata to the job summary.
- Fixture run `41977381184` completed SUCCESS; job `127079303644` completed SUCCESS. Log evidence:
  - `github.workflow_ref` => `VlDMlNSh/developer-cloud-pool/.github/workflows/reusable-worker-context-fixture-caller.yml@refs/pull/12/merge`
  - `github.workflow_sha` => `05471e6e655e9008804136e0842c9285accb49e2`
  - `job.workflow_ref` => `VlDMlNSh/developer-cloud-pool/.github/workflows/reusable-worker-context-fixture.yml@refs/pull/12/merge`
  - `job.workflow_sha` => `05471e6e655e9008804136e0842c9285accb49e2`
  - `job.workflow_repository` => `VlDMlNSh/developer-cloud-pool`
  - `job.workflow_file_path` => `.github/workflows/reusable-worker-context-fixture.yml`
  - `github.repository` => `VlDMlNSh/developer-cloud-pool`
  - `github.ref` => `refs/pull/12/merge`
- Observed result: caller and called-workflow SHA values were equal for this local reusable-workflow call on the PR merge ref. This validates the context field availability and same-commit relationship for this fixture invocation. It does NOT prove the protected default-branch caller/ref policy, governance or production authorization.
- The fixture caller ref was PR merge ref, not the protected default branch. The production validator must continue to reject this PR ref and only accept the exact protected default-branch Supervisor identity.
- Fixture CI run PASS. Separate Pool Contract Validation run `41977381462` was IN_PROGRESS at report time; do not classify it as PASS until completed.
- Current branch head after fixture additions: `74d62dfed7512d853cc8e02af2a7d495ef5892d5`; compare 16 ahead / 0 behind canonical. Canonical remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Next: wait for Pool Contract Validation run, then add an explicit static regression assertion that the fixture caller is a local static `uses` and neither workflow contains `workflow_dispatch`. Independent security review remains required. Do not wire production Worker yet.

- Pool Contract Validation run `41977381462` subsequently completed SUCCESS; job `127079333733` passed all six steps, including dispatch gate, YAML parse, 8 caller tests, and static pool contract validator. This run was associated with the fixture PR merge context and confirms validation for the fixture-containing PR merge result; the fixture run itself is separately `41977381184` SUCCESS.


## Live recheck — 2026-11-05 current PR head
- PR #12 current head: `57d463f321466f838b4874b78add059280a30022`; canonical base: `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare 49 ahead / 0 behind. PR remains OPEN / DRAFT / NOT MERGED.
- Pool Contract Validation run [42027455932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42027455932), job `127245170356`: COMPLETED / SUCCESS. Logs show 8/8 caller unit tests passed; static contract validator emitted `POOL_CONTRACT_VALIDATION=PASS`; YAML parse and dispatch-disabled assertion passed in this run. This is PR merge-result CI, not proof that production caller authorization is wired.
- Reusable Worker Context Fixture run [42027455840](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42027455840), job `127245136149`: COMPLETED / SUCCESS. Captured:
  - caller ref: `VlDMlNSh/developer-cloud-pool/.github/workflows/reusable-worker-context-fixture-caller.yml@refs/pull/12/merge`
  - caller SHA: `69d43319e0ba652f211242fd806957b18e74c52a`
  - called ref: `VlDMlNSh/developer-cloud-pool/.github/workflows/reusable-worker-context-fixture.yml@refs/pull/12/merge`
  - called SHA: `69d43319e0ba652f211242fd806957b18e74c52a`
  - called repository: `VlDMlNSh/developer-cloud-pool`
  - called path: `.github/workflows/reusable-worker-context-fixture.yml`
  - github ref: `refs/pull/12/merge`
- Interpretation: local reusable workflow context fields were populated and caller/called SHA matched for this PR merge-ref fixture. This does NOT prove protected default-branch Supervisor identity, production workflow context or authorization.
- Production Worker on canonical branch was reread (blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`): still exposes `workflow_dispatch`; validation trusts issue state/labels/body SHA/profile and does not validate Supervisor caller provenance. Supervisor still invokes REST dispatch and has `actions: write`.
- PR #7 is OPEN / DRAFT. Its only review is an owner-authored COMMENTED preliminary finding that direct Worker dispatch can bypass the Supervisor owner-approval path. This is not an independent review, but the technical bypass remains visible in canonical Worker source.
- PR #12's caller validator blob `88d79d74691431ead14f29426d214833c0086183` is still not imported by production Worker. The fixture tests context availability only.
- PR #12 review submissions and review threads are empty; independent security review NOT RUN. Current ruleset/variable settings were not reread in this pass; current governance state NOT VERIFIED.
- Worker, DSH, Resource Probe, browser, model/provider calls, Gemini, Claude and privileged dispatch NOT RUN. Paid fallback NOT USED.
- Conclusion: static validator + fixture VERIFIED for their limited scope; production Worker authorization remains BLOCKED / NOT IMPLEMENTED. Do not merge or enable dispatch.
- Next: implement a production reusable Worker boundary only after owner-approval provenance and replay-safe single-use consumption are solved. The PR #7 direct-dispatch bypass must be removed in the same reviewed transition; no isolated caller helper is sufficient.


## Governance and adjacent security PR recheck — 2026-11-05
- Active repository ruleset read directly from GET /repos/VlDMlNSh/developer-cloud-pool/rulesets/26550182: enforcement active; exact include selector refs/heads/Основной; deletion and non-fast-forward blocked; PR required; required approvals = 0; required review-thread resolution enabled; CODEOWNERS review disabled; extra approval for unattributed changes disabled; bypass actors empty; current-user bypass = never.
- Classic branch-protection endpoint returned HTTP 403 (integration lacks administration permission). This does not negate the independently readable repository ruleset. Required status checks are not configured in this ruleset response.
- POOL_DISPATCH_ENABLED: no current authenticated settings read-back available through this integration. Historical owner CLI evidence in Issue #1 says false, but current value is NOT VERIFIED here. Keep all execution disabled.
- PR #15 current head c57f2ab3f2b91bf6b3e413640f65ec518008b75e, exact-head Pool Contract Validation run 42038004176 SUCCESS; job 127281084983. Candidate Supervisor workflow blob d05fc4037f5663a64bb82d9ff67afe95e20c73da removes workflow_run. It still has actions: write; Worker remains workflow_dispatch; REST workflow dispatch remains in Supervisor. Thus PR #15 fixes the zizmor dangerous-trigger finding only; it does not close the Worker caller/approval boundary.
- PR #14 exact head 5a84f037a612dbb065ab9832bd3f6471cc5a551b, run 42037723023 FAILED. zizmor v1.31.1 logs: ERROR pool-supervisor.yml:9 workflow_run; WARNING dsh-runtime-evaluation.yml:61 and pool-worker.yml:126 ad-hoc npm package installation outside lockfile. PR #15's later source removes the first finding, but no exact-head zizmor audit on PR #15 was run; remediation is statically evident, zizmor status on that head NOT VERIFIED.
- PR #16 remains OPEN / DRAFT. Exact current head 00bf891729de7c1092a5bde8b09fec6f4c4cbc66, run 42039481919 still IN_PROGRESS at temporary npm lockfile generation; no artifact/result confirmed. Do not rerun unchanged.
- PR #12 current head e6b4150cd1a56a032220514365b91e321ff9157f; exact-head runs 42039867663 and 42039867909 SUCCESS. Caller fixture/test scope only. PR #12 reviews and threads remain empty.
- Governance classification: active ruleset VERIFIED; zero required approvals is insufficient for independent acceptance; current dispatch variable NOT VERIFIED; no independent review. PRs #12/#14/#15/#16 remain OPEN / DRAFT / NOT MERGED.
- No Worker, DSH, Resource Probe, browser, Gemini, Claude, model/provider, privileged dispatch, or paid fallback was run.
- Next bounded action: design and test an owner-approval record with provenance and race-safe one-time consumption. GitHub issue labels/comments alone do not offer atomic compare-and-swap; do not pretend that a pool:claimed label or concurrency group is a one-time capability.


## Owner approval / single-use dispatch ADR — 2026-11-05
- Added [ADR: Owner approval provenance and single-use Worker dispatch](../architecture/2026-11-05-owner-approval-and-single-use-dispatch-adr.md), proposed / not implemented / not qualified. Verified blob SHA after reread: ddc05f0b3b1aa3b947e5b43e8b9f3c1c7557b59b.
- Official GitHub context documentation confirms that reusable-workflow github context refers to the caller, while job.workflow_repository / job.workflow_file_path / job.workflow_ref / job.workflow_sha identify the called workflow. This supports the distinct caller/callee validation design; the existing fixture does not establish production values.
- Official GitHub concurrency documentation confirms queue:max permits up to 100 pending runs and FIFO processing by when runs started waiting. It is a serialization aid only, not an atomic transaction or durable exactly-once ledger.
- ADR proposes owner-authored approval comment bound to issue, target SHA, allowlisted profile and envelope digest; one serialized Supervisor as sole task-state writer; worker workflow_call only; no REST workflow dispatch; ambiguous dispatch outcomes go to needs-review with no automatic replay. Worker report job must lose issue-write permission. This is a design proposal, not implemented behavior.
- Important incompatibility identified in current architecture: stale-claim recovery returns unobserved claims to pool:ready, which could replay the same approval. Future implementation must instead fail closed to needs-review.
- ADR acceptance includes independent reviewer and required status checks. Current ruleset has zero required approvals, so branch PR gate is not an independent security review.
- No production workflow changed; no worker/DSH/browser/model/secret/privileged execution. POOL_DISPATCH_ENABLED state remains NOT VERIFIED through current connector; do not execute.
- Next: implement only a pure owner-approval evidence parser and deterministic state-transition tests, without network, workflow dispatch, or GitHub mutation. Then implement the complete Supervisor/Worker conversion as one reviewed PR.


## Owner approval parser — bounded implementation and CI — 2026-11-05

- Added pure module `scripts/pool-owner-approval.mjs`, blob SHA `84d631449c58a3b9b9f36b3adf1de976f6debeb8`.
- Added `scripts/pool-owner-approval.test.mjs`, blob SHA `a08fe457376ff65d5d3a71c2f15688d30c705e88`.
- Added test step to `.github/workflows/pool-contract-validation.yml`, blob SHA `3a03a48c7ce27302813fe5b53b6a8f1846f7463a`.
- Parser checks numeric trusted owner ID vs comment author ID, comment ID, unchanged created/updated timestamp, strict command syntax, issue number, target SHA, allowlisted profile, envelope SHA-256 and consumed comment IDs. It returns structured rejection reasons and no side effects.
- Pure transition helper allows a claim only from submitted/needs-review state with validated approval and no prior dispatch attempt; ambiguous dispatch or invalid state fails to needs-review. Source explicitly documents that external durable ledger + serialization are required; it is not CAS, a transaction or exactly-once.
- No network calls, GitHub mutations, workflow dispatch or credentials exist in the new module.
- Exact PR head `4afef4f23cbafa7b385760e5b025089af00e601a`: [Pool Contract Validation run 42041136037](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42041136037) SUCCESS; job `127291928780`. Logs: existing caller tests 8/8; owner approval tests 14/14; all seven workflow YAML files parsed; static validator emitted `POOL_CONTRACT_VALIDATION=PASS`; dispatch gate reported disabled or unset. [Reusable Worker Context Fixture run 42041136130](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42041136130) SUCCESS.
- Exact-head PR metadata: OPEN / DRAFT / NOT MERGED; canonical base SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`. Independent review remains NOT RUN.
- This pass does NOT solve durable replay prevention or owner approval deployment authorization. GitHub Issues comment IDs/labels and workflow concurrency are not transactional. The parser is not wired into production Supervisor/Worker.
- Canonical Worker remains `workflow_dispatch`; canonical Supervisor still uses REST dispatch and has `actions: write`; Worker report job still has `issues: write`. Production caller boundary remains BLOCKED / NOT IMPLEMENTED.
- `POOL_DISPATCH_ENABLED` current repository value NOT VERIFIED through the connector. The CI run only observed its own environment as disabled/unset. No runtime, Worker, DSH, Resource Probe, browser, Gemini, Claude, provider/model or privileged dispatch was run. Paid fallback NOT USED.
- Next: evaluate native GitHub Environment required-reviewer gate as per-run owner approval and integrate it with the parser/approval envelope only after proving the Environment is configured with prevent-self-review and no bypass. In parallel, assess durable single-use ledger options available under GitHub Free; do not claim exactly-once from Issues or concurrency.
