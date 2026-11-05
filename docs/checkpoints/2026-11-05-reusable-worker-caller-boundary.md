# Checkpoint — 2026-11-05 reusable Worker caller boundary

- Canonical branch `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`; NOT canonical.
- Working branch latest documented implementation commit before this checkpoint update: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`; branch ancestry 4 ahead / 0 behind canonical.
- Design contract blob: `138953c1c0b09098b009f4da5f4da12df67c65a2`.
- Caller validator `scripts/pool-worker-caller.mjs` blob: `88d79d74691431ead14f29426d214833c0086183`.
- Detailed report: [2026-11-05 implementation pass](../reports/2026-11-05-reusable-worker-caller-boundary.md), latest report blob `8afa3a97dff4a7fd02d9d52c7966f67574a9addb`.

## Current blocker
Default Worker still uses `workflow_dispatch` and public issue metadata; default Supervisor still dispatches Worker through REST. Caller authorization BLOCKED. No production or privileged execution.

## Implementation status
A pure fail-closed caller-context validator was added to the working branch only. It checks the exact caller repository/ref, reusable Worker repository/path, SHA formats, and same-revision relationship. It is NOT wired into workflows. Unit test creation was blocked; tests NOT RUN. Exact-head CI NOT VERIFIED; no workflow runs/statuses were returned for the implementation commit. Independent review NOT RUN.

## Governance and execution
Current ruleset and `POOL_DISPATCH_ENABLED` NOT VERIFIED; historical Issue #1 data is stale evidence. Gemini NOT RUN (controller absent in default branch). Claude Code NOT RUN (no verified third host/free route in this pass). Worker, DSH, Resource Probe, browser and model/provider calls NOT RUN. Paid fallback NOT USED. Runtime NOT QUALIFIED.

## Next
Add/run tests; wire Worker `workflow_call` caller validation and remove `workflow_dispatch`; refactor Supervisor to static reusable job plus bounded planner/matrix and remove REST dispatch. Keep dispatch disabled until exact-head CI, independent security review and current governance gates pass.

## Follow-up checkpoint — tests and PR #12
- Added test file `scripts/pool-worker-caller.test.mjs`, blob `251a4772d85a5dff8cdcc8ca589509ffa48eac98`.
- Added a Node test step to `.github/workflows/pool-contract-validation.yml`, blob `5991c0cf839d510ef6e6540895ddbcd9e306c068`.
- Draft PR #12: https://github.com/VlDMlNSh/developer-cloud-pool/pull/12; head at creation `215bd04490d19ec1d6392a8defa9bbd9e1e7bafc`; base canonical SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head CI and combined status returned no runs/statuses when queried: NOT VERIFIED. Tests committed, NOT RUN in an observed CI runner.
- Independent security review NOT RUN. PR #12 DRAFT, not accepted.
- Branch compare at PR creation: 8 ahead / 0 behind canonical. Canonical unchanged.
- Worker remains `workflow_dispatch`; Supervisor still uses REST dispatch. Caller helper not wired into Worker. Authorization BLOCKED.
- Runtime/dispatch remains NOT RUN; paid fallback NOT USED.
- Detailed updated report: [2026-11-05 implementation report](../reports/2026-11-05-reusable-worker-caller-boundary.md), blob `af9329089528e46b35248f9ca540bdf44aaa1361`.

## Final state correction
- Latest live branch compare before this documentation correction: 10 commits ahead / 0 behind canonical; merge base exactly `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Latest branch HEAD before this correction: `6b409e0b09d2cef1b507d50662236d6f80b32340`; documentation correction creates a newer HEAD.
- PR #12 was created at head `215bd04490d19ec1d6392a8defa9bbd9e1e7bafc`; branch advanced afterward. Current exact PR head SHA not independently read in this pass. CI NOT VERIFIED.
- Updated report blob: `518bc11fb8f21b674f740ab66413beed5b94689d`.
- PR #12 remains DRAFT; independent review NOT RUN; authorization BLOCKED.


## Live verification update — 2026-11-05
- PR #12 current head: `4d656a4337246f24cb3909a77e4198434f54076a`; base canonical `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare 12 ahead / 0 behind.
- PR validation run `41973768962` SUCCESS; job `127067796013`. Run executed on PR merge ref `a41434d7b265e85e1347c483f427f83d36a0c3f0`, so this is merge-result CI evidence, not a direct head checkout. Logs: 8/8 Node tests passed; YAML parse and pool static validator passed; `POOL_DISPATCH_ENABLED=false` observed in that run.
- Read-back blob SHAs: caller `88d79d74691431ead14f29426d214833c0086183`; tests `251a4772d85a5dff8cdcc8ca589509ffa48eac98`; workflow `5991c0cf839d510ef6e6540895ddbcd9e306c068`.
- PR #12 remains OPEN / DRAFT / NOT ACCEPTED; reviews empty. Independent review NOT RUN.
- Canonical Worker/Supervisor still use direct `workflow_dispatch` + REST dispatch; caller validator not wired. Authorization BLOCKED.
- Canonical HEAD remains `64d2636d4500127e635c214ccfb722c6b3fcda80`. Gemini/Claude/Worker/DSH/Resource Probe/browser/model execution NOT RUN; paid fallback NOT USED; runtime NOT QUALIFIED.
- Next: add a non-privileged `workflow_call` fixture to observe actual caller/job context values before wiring the validator. Keep dispatch closed.


## Reusable-workflow context fixture — live evidence
- Added read-only fixture caller and reusable workflow; blobs:
  - caller: `ac35c24a26bef2a9e5a894a274ec6f1f1b13ca7f`
  - called workflow: `d6e7815db794de293e143aba48eaa36e5ab7ecd8`
- Fixture run `41977381184`, job `127079303644`: SUCCESS. Log proves `github.workflow_ref` identifies caller; `job.workflow_ref`, `job.workflow_repository`, and `job.workflow_file_path` identify called workflow. Both SHA values were `05471e6e655e9008804136e0842c9285accb49e2` for the same local reusable invocation. Caller ref was `refs/pull/12/merge`, not protected default branch.
- This supports context-field and local-call same-SHA assumptions for the fixture only; it does not qualify production authorization or default-branch governance.
- Pool Contract Validation run `41977381462` was IN_PROGRESS at checkpoint creation.
- Current working branch head `74d62dfed7512d853cc8e02af2a7d495ef5892d5`; 16 ahead / 0 behind canonical. Canonical HEAD unchanged `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Next: confirm validation run, add static regression checks for fixture trigger/call shape, retain all runtime gates closed.

- Follow-up: Pool Contract Validation run `41977381462` completed SUCCESS (job `127079333733`); dispatch gate, YAML parse, caller unit tests, and static pool contract validator all passed. Fixture run `41977381184` also SUCCESS.


## Contract validator correction — 2026-11-05
- Investigated failed Pool Contract Validation run `42023131061`, job `127230605028`. Logs show YAML parse success, 8/8 caller tests passed, and the sole failure was the generic action pin scanner incorrectly classifying the static local reusable workflow reference as an external action.
- Separate fixture run `42023131365`, job `127230606746`: SUCCESS.
- Corrected `scripts/validate-pool-contract.mjs`: local reusable workflow references under `./.github/workflows/` are exempted from external-action SHA pinning; external action refs remain SHA-pinned. Fixture-specific static/read-only/secret-free/workflow_call checks remain.
- Latest implementation HEAD at correction: `ef4de08e12d5a22adf0df19b61a35886c72d03f4`; validator blob `a69714d87553d14b00cd0c0c3e3df89586136960`; read-back VERIFIED.
- PR #12 remains OPEN / DRAFT / NOT MERGED. Compare 23 ahead / 0 behind; merge base remains canonical `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- New CI run for corrected HEAD/merge SHA had not appeared in GitHub API at checkpoint time: CI NOT VERIFIED. Independent review NOT RUN.
- Ruleset `26550182` independently re-read ACTIVE. CI log observed `POOL_DISPATCH_ENABLED=false`, but direct current repository-variable read-back remains NOT VERIFIED.
- Worker/Supervisor production boundary unchanged; Worker still has `workflow_dispatch`, Supervisor still REST-dispatches. Runtime, Resource Probe, DSH, browser, model/provider calls and privileged dispatch NOT RUN. Gemini/Claude NOT RUN. Paid fallback NOT USED.
- Detailed report: [2026-11-05 validator correction](../reports/2026-11-05-pool-contract-local-reusable-workflow-fix.md).
- Next: obtain corrected CI result, then independent review. Keep dispatch closed.


## Corrected validator CI — 2026-11-05 verified result
- Pool Contract Validation run `42023631278`, job `127232286449`: COMPLETED / SUCCESS, associated with PR #12 head `8387dccf556f03194aabcf032c9579c7b9a1bf51`.
- Job logs: dispatch variable was observed as `false`; all seven workflow YAML files parsed; Node caller tests 8/8 passed; static validator output `POOL_CONTRACT_VALIDATION=PASS`; external Actions pin check passed.
- Fixture run `42023631355`, job `127232286911`: COMPLETED / SUCCESS.
- Classification: PR merge-result CI PASS associated with exact PR head; not a direct branch-only checkout. The passing result validates this validator correction and non-privileged fixture only.
- Ruleset 26550182 detail re-read: ACTIVE; exact selector `refs/heads/Основной`; pull request required; no bypass actors; current-user bypass never. Required approving reviews = 0, CODEOWNERS review disabled — therefore this is not an independent security-review gate.
- PR #12 remains OPEN / DRAFT / NOT MERGED; independent review NOT RUN. Canonical Worker/Supervisor remain unchanged and production authorization remains BLOCKED.
- Working branch HEAD at verification: `8387dccf556f03194aabcf032c9579c7b9a1bf51`; compare 26 ahead / 0 behind canonical `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Report: [validator correction and CI evidence](../reports/2026-11-05-pool-contract-local-reusable-workflow-fix.md).
- Next: independent review and a separately scoped implementation package to convert Worker to workflow_call and remove REST dispatch. Do not run production Worker/DSH/Resource Probe or enable dispatch.


## Final checkpoint-head CI — 2026-11-05
- Pool Contract Validation `42023792304`, job `127232831663`: SUCCESS for PR head `317a6a81294feb334f7a63d61da6ec2789914a85`.
- Fixture `42023792334`, job `127232832106`: SUCCESS for the same PR head.
- Contract job logs: dispatch variable observed false; 7 YAML files parsed; 8/8 Node tests passed; external action SHA check passed; `POOL_CONTRACT_VALIDATION=PASS`.
- Exact PR head is covered by PR merge-result CI; no direct non-PR branch run was performed.
- PR #12 remains DRAFT; independent security review NOT RUN; production authorization BLOCKED.
- Detailed evidence: [2026-11-05 validator correction report](../reports/2026-11-05-pool-contract-local-reusable-workflow-fix.md).


## Production boundary readiness audit — 2026-11-05
- Latest verified PR #12 head before this documentation pass: `2bf299336bec8cbf55d8785eef0e00bb7a6ec411`; base/canonical HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare 30 ahead / 0 behind.
- Exact-head Pool Contract Validation run `42023879350`, job `127233125033`: COMPLETED / SUCCESS.
- Exact-head reusable Worker context fixture run `42023879543`, job `127233126401`: COMPLETED / SUCCESS.
- Production Worker still exposes `workflow_dispatch`; Supervisor still dispatches through REST; caller validator is not wired into production. Authorization remains BLOCKED.
- Ruleset `26550182` is ACTIVE for `refs/heads/Основной`, but required approving review count is 0. PR #12 review submissions and review threads are empty; independent security review NOT RUN.
- Issue #1 remains OPEN. Current repository variable read-back for `POOL_DISPATCH_ENABLED` was not performed; current value NOT VERIFIED. Historical issue text and prior CI environment observations are not a current API read-back.
- README governance wording corrected to acknowledge the active Ruleset and explicitly state that zero required approvals do not satisfy the independent review gate.
- New audit report: [2026-11-05 production caller boundary readiness](../reports/2026-11-05-production-caller-boundary-readiness.md).
- Canonical branch remains unchanged; docs updates are confined to the working branch.
- Worker, DSH, Resource Probe, browser, Gemini, Claude, provider/model calls and privileged dispatch NOT RUN; runtime NOT QUALIFIED.
- Next: define and implement production reusable Worker `workflow_call` + static Supervisor invocation, preserving single-use approval, provenance, immutable target SHA, bounded concurrency and least privilege. No dispatch until exact-head CI, independent review and current governance gates pass.


## Production boundary design — 2026-11-05
- Latest exact-head CI for PR #12 starting HEAD `91e157a0671b97a35a82d7f1a2df8ca325854aac`:
  - Pool Contract Validation run `42024560920`, job `127235402134`: COMPLETED / SUCCESS.
  - Reusable Worker Context Fixture Caller run `42024561075`, job `127235402611`: COMPLETED / SUCCESS.
- Live Ruleset `26550182`: ACTIVE on `refs/heads/Основной`; required approvals = 0; CODEOWNERS review disabled. PR #12 reviews and threads empty; independent review NOT RUN.
- Issue #1 still records owner-side `POOL_DISPATCH_ENABLED=false` read-back from 2026-11-04. No fresh variable read-back in this pass; current value NOT VERIFIED by this pass.
- Current Worker remains `workflow_dispatch`; Supervisor still has `actions: write` and uses REST workflow dispatch; caller validator remains unconnected to production.
- Key security finding: `pool:ready` / `pool:claimed` labels do not independently prove approver identity or single-use approval. No atomic consume/replay-safe design has yet been demonstrated using GitHub Issues labels.
- Added design contract: [Production reusable Worker boundary contract](../architecture/PRODUCTION-REUSABLE-WORKER-BOUNDARY-CONTRACT.md).
- Added report: [Production caller boundary design — 2026-11-05](../reports/2026-11-05-production-caller-boundary-design.md).
- README corrected: event-driven wake-up is scaffold only, not qualified; latest reports linked; no instruction to enable dispatch merely after branch protection.
- Production workflows unchanged. Worker/DSH/Resource Probe/browser/Gemini/Claude/provider calls/privileged dispatch NOT RUN. Runtime NOT QUALIFIED. Paid fallback NOT USED.
- Next: design and test a GitHub Free-compatible owner approval provenance and single-use consumption mechanism, including duplicate events, concurrency and supervisor crash/replay. Only then implement Worker `workflow_call` only + static Supervisor invocation as one reviewed change.


## Mature-project benchmark and live boundary audit — 2026-11-05
- Audit target: PR #12 exact head `ea84b66ded2bb5044202d86143c878fa4bc565d6`; canonical `Основной` remains `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare 37 ahead / 0 behind.
- PR #12 OPEN / DRAFT / NOT MERGED. Independent review NOT RUN.
- Mature-projects inspected directly on GitHub:
  - [actions/runner](https://github.com/actions/runner): official runner execution agent, not a scheduler/controller; README says contributions are not currently accepted. Reference only.
  - [actions/actions-runner-controller](https://github.com/actions/actions-runner-controller): Kubernetes operator and runner scale sets; valuable lifecycle reference but requires Kubernetes/self-hosted runner infrastructure. Not adopted under the current GitHub-Free/no-extra-infrastructure constraint.
  - [runs-on/runs-on](https://github.com/runs-on/runs-on): per-job isolated EC2 runners and scale-to-zero; AWS compute/storage and commercial licensing make it ineligible for the current free-only constraint. Reference only.
- Read current working branch Supervisor, Worker and Supervisor workflow. Worker still uses `workflow_dispatch`; Supervisor still calls REST workflow dispatch with `actions: write`; issue labels + GET/PATCH are not atomic, immutable, or replay-safe approval consumption. Existing caller validator is not wired into production.
- Exact target SHA workflow evidence:
  - Pool Contract Validation run `42024861836`, job `127236410587`: COMPLETED / SUCCESS (dispatch-disabled assertion, YAML parse, caller tests, static validator).
  - Reusable Worker Context Fixture Caller run `42024861862`, job `127236411157`: COMPLETED / SUCCESS (non-secret fixture only).
  - Combined commit status API returned empty statuses; the two workflow runs above are the positive CI evidence.
- PR review submissions empty; independent security review NOT RUN. Production Worker/DSH/Resource Probe/browser/Gemini/Claude/provider calls/privileged dispatch NOT RUN. Runtime NOT QUALIFIED. Paid fallback NOT USED.
- Report: [Mature project benchmark and pool boundary audit](../reports/2026-11-05-mature-project-benchmark-and-pool-audit.md), commit `693434ad233971a82aa5035b91a095ae522a76f3`.
- Next bounded step: prove a GitHub-Free-compatible owner approval provenance and single-use consumption primitive under duplicate delivery, concurrency, supervisor crash/replay and ref-update races. Keep dispatch disabled; do not migrate production Worker to `workflow_call` until this is proven.


## Native GitHub Environment approval benchmark — 2026-11-05
- New candidate identified: GitHub Environments with required reviewers are available on GitHub Free for public repositories. This repository is public, so this is a viable no-extra-infrastructure approval primitive to evaluate.
- Official docs: [Environment configuration and plan availability](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments); [reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments); [deployment API](https://docs.github.com/en/rest/deployments/deployments); [workflow concurrency semantics](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
- Required reviewers can approve a specific workflow job waiting on Environment protection; prevent-self-review is configurable. This is stronger than treating mutable issue labels as approval evidence.
- Limitations retained: Environment approval is per deployment/run, not a complete exactly-once queue; duplicate triggers may create separate runs; concurrency is not a transaction/CAS and FIFO ordering is not guaranteed. Never infer cross-run single-use authorization from these primitives alone.
- No Environment settings were changed or assumed configured. Live settings, reviewer identity, bypass policy and deployment audit evidence remain NOT VERIFIED.
- Next bounded step: implement only a non-privileged Environment-gate fixture on the isolated branch and test approval binding to one workflow run, issue, immutable SHA and profile; duplicate/rejected/canceled/expired cases; prevent-self-review; no credentials before approval; missing-settings fail-closed. Do not enable production dispatch.
- Updated benchmark report: [2026-11-05 mature project benchmark and pool audit](../reports/2026-11-05-mature-project-benchmark-and-pool-audit.md), blob SHA `1a19292490eab896385fd1b371d06d585d223fa1`, commit `ff3779dbce594f11074dbfe931cb0b8c3e699504`.
- Live PR #12: OPEN / DRAFT / NOT MERGED; current head `1549484ab43b25c6e7fc86b28ea91ae9c80d021d`; canonical base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head Pool Contract Validation run `42025350197`, job `127238073152`: SUCCESS. Exact-head reusable context fixture run `42025350303`, job `127238054663`: SUCCESS. Combined status array empty; these two workflow-run results are the positive evidence.
- PR reviews and review threads empty; independent review NOT RUN. Production Worker/DSH/Resource Probe/browser/provider/model/Gemini/Claude/privileged dispatch NOT RUN; runtime NOT QUALIFIED; paid fallback NOT USED.


## Post-benchmark documentation HEAD correction
- PR #12 advanced after the benchmark report/checkpoint updates. Current head before this checkpoint correction: `ed18fd793392297718bdc4332365108c3d48bcd1`; canonical base remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- On that head, Pool Contract Validation run `42025677984` and reusable context fixture run `42025678004` were QUEUED when queried. Exact-head CI NOT VERIFIED at that point; combined commit status array empty.
- Successful runs `42025350197` and `42025350303` apply to the preceding head `1549484ab43b25c6e7fc86b28ea91ae9c80d021d` only.
- Latest report after correction: [mature project benchmark and pool audit](../reports/2026-11-05-mature-project-benchmark-and-pool-audit.md), blob `94d7e29022b7489f2cac725cd977eaf06123caff`, commit `5ff9477b563ed798a4a832377547290e6755d7d5`.


## Existing owner-approval guard audit — 2026-11-05
- Discovered existing implementation PR [#7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7); do not duplicate it. Current head `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`, base SHA `692025e4a039aaf94c6683bb95da38b4f324fce8`; OPEN / DRAFT / NOT MERGED.
- Exact-head PR #7 static CI: run `41921293708`, job `126894183572`: SUCCESS. Independent review NOT RUN; only one COMMENTED review from repository owner.
- Readback blobs: approval module `9442c413c38dc28c67455362e254ff703bcfedd9`; tests `c7c7499d9d2bb4c123e72b86adb85369023c4284`; Supervisor `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`.
- Positive: owner-labeled event intake, fixed SHA/profile envelope, bot-authored marker, consume-before-dispatch, revoke-on-unlabel, fail-closed disabled gate.
- Critical blocker explicitly recorded in PR #7's owner COMMENTED review: Worker remains directly callable by `workflow_dispatch`; Worker checks only `pool:claimed` and SHA/profile, not approval marker or trusted caller. Supervisor-only approval can therefore be bypassed by direct Worker dispatch if caller has Actions permission.
- Additional static finding: approval marker does not bind a unique trusted event/delivery ID. Replay/redelivery of a prior owner-labeled event after consumption could append a fresh marker; tests do not cover same-event replay after consumption. Replay safety NOT PROVEN.
- Actor is stored as login text rather than stable numeric GitHub user ID. Comments are mutable and read only with `per_page=100`; issue comment/label mutations are not transactional CAS. Supervisor concurrency alone does not make these writes atomic.
- Decision: PR #7 is useful existing work to adapt, but NOT SAFE TO MERGE/QUALIFY as-is. Do not create a second parallel owner-approval mechanism.
- Prefer GitHub Environment required-reviewer gate for per-run human authorization (Free plan supports this for public repos); actual live Environment configuration/bypass settings remain NOT VERIFIED. Environment is not an exactly-once queue; preserve separate deduplication/replay semantics.
- PR #12 exact-head current at audit: `49b7cf0f456d70e37afef129d14b0f96c9090c3e`, OPEN / DRAFT / NOT MERGED. CI run `42025722988` job `127239348600`: SUCCESS; fixture run `42025722995` job `127239323512`: SUCCESS. Combined status array empty. Reviews/threads empty; independent review NOT RUN.
- PR #12 caller validator remains unwired; Worker still `workflow_dispatch`; Supervisor still REST dispatch + `actions: write`.
- Latest audit report: [2026-11-05 mature project benchmark and pool audit](../reports/2026-11-05-mature-project-benchmark-and-pool-audit.md), blob `f204547009d975fd226726ee770755f62ec6e141`, commit `c0c316240d96671d0bd3cfba9fabea8b21636846`.
- Next bounded task: prepare a single integrated authorization design using PR #7's owner-event intake only where needed, native Environment approval for per-run authorization, and PR #12's static reusable caller boundary. Add regression fixtures for direct Worker invocation, replayed labeled event after consumption, duplicate delivery, changed SHA/profile, missing Environment protection and bypass. No production workflow migration or dispatch until independently reviewed.
