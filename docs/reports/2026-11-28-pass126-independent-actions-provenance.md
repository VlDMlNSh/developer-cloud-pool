# Pass 126 — independent Actions provenance and adversarial controller/API checks

Date: 2026-11-28

## Status

**VERIFIED — raw webhook/runner context is independently mapped and cross-checked; adversarial API/provenance tests pass on the PR merge result.**  
**NOT VERIFIED — live issue_comment controller execution, hosted D1, independent external security review, detailed effective governance rules and production import graph.**  
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Starting Pass 126 branch head: `f7e1c3f960ca8afc2c071d40c86a24e937df9d97` (Pass 125 docs-complete state).
- Exact tested branch code/test head: `0610fe5079f5dd8a8ef9498e35de580cda573e56`.
- Exact PR merge-result SHA used by both latest CI runs: `1bf51441f0a77cba6c36c5448a525f782a951ce2` (GitHub log: merge of `0610fe5079f5dd8a8ef9498e35de580cda573e56` into `565404f84b6b86afb4dc2d8fa939341f42df6eca`).
- Default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #188: OPEN / DRAFT / UNMERGED.
- Scope: eliminate self-echoing trusted context; independently map Actions context from raw webhook and runner environment; validate webhook repository and immutable source IDs; adversarially mutate API responses and trusted event/runner fields.

## Finding and correction

Pass 125's `mapGitHubActionsContext` copied several identity/ref/run values from the API-derived envelope. Although the downstream verifier checked consistency, the copied context was not an independent representation. This weakened the value of the cross-check.

Pass 126 changes the trust boundary:

1. `mapGitHubActionsContext({ event, env })` now reads the raw issue_comment webhook payload and actual `GITHUB_*` runner environment. It no longer reads identity, event, ref, SHA, workflow or run values from the API envelope.
2. The collector now validates the webhook repository's immutable numeric ID, full name, owner numeric ID and owner login before API collection.
3. It requires the webhook issue/comment immutable node IDs and owner login fields; API issue/comment responses must return non-empty matching node IDs and expected numeric/login identity.
4. Workers verifier now compares two independent sources: API-attested Envelope v1 vs raw webhook/runner context.

No authorization or dispatch semantics were broadened. `dispatch=false` and `executionAuthorized=false` remain mandatory.

## Adversarial coverage

Added or expanded tests for:
- Raw sender mutation and raw runner SHA mutation; verifier rejects the mismatch.
- Six independent webhook-field mutations: issue number, comment ID, comment body, author association, comment author identity and sender identity.
- Seven runner-context mutations: repository, ref, target SHA, workflow ref, workflow SHA, run ID and run attempt.
- Webhook repository ID substitution and missing issue/comment node IDs.
- API response substitutions across repository, issue, comment, workflow run, run attempt, workflow ID and workflow state.
- Existing stale default-ref race, workflow file blob digest mismatch, workflow file fetch at `GITHUB_WORKFLOW_SHA`, rerun denial, bounded API origin/path/size/timeout, duplicate JSON key and digest/policy checks remain covered.

## Validation evidence

Latest code/test head: `0610fe5079f5dd8a8ef9498e35de580cda573e56`.

Both workflows checked out exact PR merge result `1bf5144...` (merge of code head into default `565404f...`):

- Isolated D1 Ledger Proof run **46175255919**, job **141072385396**: SUCCESS; 9/9 files, **140/140 tests**.
- Pool Contract Validation run **46175255931**, job **141072385703**: SUCCESS; `POOL_CONTRACT_VALIDATION=PASS`; Node test runner **36/36 tests**.
- The first adversarial matrix attempt at code head `5bed2244eeb5bc7a390ef09a30ac4d22877216fc` had one test-only expectation mismatch: `GITHUB_REPOSITORY` mutation is rejected by the event cross-check before the run cross-check. The test expectation was corrected to match the verifier's actual fail-closed boundary; no production logic was weakened. Final exact merge-result run passed.
- D1 suite was rerun on the same final code/test head and merge result.

## Activation and runtime constraint

A fresh default-branch Contents read for `.github/workflows/next-event-controller.yml` returned NOT_FOUND. GitHub's official `issue_comment` event documentation states the workflow file must exist on the default branch for this event to trigger: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

Therefore the new controller cannot receive a live `issue_comment` trigger while it exists only in PR #188. No manual dispatch or alternate privileged trigger was added. This is an activation gate, not a reason to bypass PR review. PR #188 must remain Draft/unmerged until independent security and governance gates pass. After a properly approved merge, a controlled owner-authored event can be used to qualify the read-only collector; until then live execution is NOT RUN.

## Reuse First and OSS delta

- **REUSE** existing bounded GitHub API collector, canonical Envelope v1, Workers verifier, D1 attested adapter, migration 0018 and pinned local Workers/Vitest/D1 harness. No duplicate trust implementation or new dependency.
- Cloudflare recommends Workers Vitest integration for unit/integration tests and provides local binding state access: https://developers.cloudflare.com/workers/testing/vitest-integration/ and https://developers.cloudflare.com/workers/testing/
- Important qualification: Cloudflare explicitly states Miniflare is not a hardened sandbox for untrusted Worker code. Local D1/Vitest evidence validates behavior and binding integration, not isolation of hostile code or hosted production behavior: https://developers.cloudflare.com/workers/testing/
- GitHub announced Node 20 is no longer available on Actions runners from 2026-09-23; existing pinned checkout/setup-node actions now run under Node 24 with deprecation warnings. Update to Node 24-native immutable action SHAs is a separate maintenance item; this pass did not change action pins because their exact release commit SHAs and compatibility were not fully verified: https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/
- Current upstream checkout v7 includes safer fork pull-request handling and dependency/security updates; setup-node v7.1.0 is a current release. Treat as candidate action upgrades only after immutable SHA and input compatibility checks: https://github.com/actions/checkout and https://github.com/actions/setup-node/releases
- No new package, provider, runtime, hosted service or paid resource was introduced.

## Governance and safety

- PR #188 remains OPEN / DRAFT / UNMERGED; current code/test head `0610fe5079f5dd8a8ef9498e35de580cda573e56`.
- Formal reviews: 0; inline threads: 0; independent security review: NOT RUN.
- Effective detailed ruleset conditions and current dispatch-variable metadata: NOT VERIFIED (available connector actions did not expose a safe read path for these metadata).
- The controller workflow is absent from default branch; live issue_comment execution: NOT RUN.
- No secret values read, hosted D1 writes, provider calls, dispatch, executor launch, deployment, merge or production mutation.
- No paid resources or new runtime dependencies.

## Metrics

- D1 suite: 140/140.
- Pool Contract: SUCCESS.
- Pool Contract Node tests: 36/36.
- New adversarial matrix: API identity, webhook identity and runner context substitutions.
- Performance benchmark: NOT RUN.
- Active engineering time: NOT MEASURED; wall-clock elapsed time is not presented as active engineering time.
- One test expectation defect identified and corrected; no production defect remains established by this pass.

## Next

Pass 127:
1. Independently review the complete controller → API collector → raw Actions context → Envelope verifier → D1 receipt chain.
2. Review exact action pins and migrate Node20-targeting action SHAs to Node24-native immutable releases only after full SHA, signatures/release provenance and input compatibility are verified.
3. Add a machine-checked test/contract documenting the GitHub default-branch activation requirement for `issue_comment`.
4. Re-read PR #188 exact head, merge-result CI, reviews, review threads and governance metadata. Keep Draft/unmerged.
5. Keep live controller execution blocked until the controller is safely present on default branch through approved governance; no workflow_dispatch, provider calls or execution authority.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
