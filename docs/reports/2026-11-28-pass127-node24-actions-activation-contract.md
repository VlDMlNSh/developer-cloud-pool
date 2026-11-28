# Pass 127 — Node 24 immutable Actions pins and activation contract

Date: 2026-11-28

## Status

**IMPLEMENTED** — controller action references migrated to immutable Node 24-native releases; default-branch activation precondition is now documented and guarded by repository tests.
**NOT VERIFIED** — latest branch CI, local test execution in this environment, live issue_comment execution, independent security review, effective ruleset details, dispatch-variable metadata and hosted runtime behavior.
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Starting branch: `feat/pass124-readonly-owner-next-controller-2026-11-28`.
- Previous verified docs head: `9f0526515c76f2bf865f00852109bb8bf2b32a05`.
- Pass 127 final commit observed: `398bc48065a6d0e034cb610cf11e13c995c3804f`.
- Default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #188: OPEN / DRAFT / UNMERGED; formal reviews 0; inline threads 0.
- Scope: inspect upstream first-party Actions releases, update controller pins, disable unnecessary package-manager caching, encode default-branch activation prerequisite as a repository contract and test.

## Reuse First — upstream action review

### actions/checkout

- Repository: https://github.com/actions/checkout
- Release: v7.0.1, immutable release commit `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- GitHub release page reports immutable release and GitHub-verified commit signature.
- Fetched `action.yml` at the exact commit: `runs.using: node24`; existing inputs `ref` and `persist-credentials` remain available.
- License: MIT, fetched from the exact release commit.
- Upstream activity/release notes include dependency/security updates and safer fork-PR handling. Controller still pins exact SHA and sets `persist-credentials: false`.
- Decision: **REUSE**.

### actions/setup-node

- Repository: https://github.com/actions/setup-node
- Release: v7.1.0, immutable release commit `949feb2413d6458794dcd2491c4babbbce0c15c1`.
- GitHub release page reports immutable release and GitHub-verified commit signature.
- Fetched `action.yml` at exact commit: `runs.using: node24`; existing `node-version` and `check-latest` inputs remain available.
- Upstream v7 release notes state no changes to inputs, outputs or behavior; removal of dummy NODE_AUTH_TOKEN fallback is documented. License: MIT, fetched from exact release commit.
- Decision: **REUSE**.
- `package-manager-cache: false` explicitly disables implicit package-manager cache behavior for this controller job.

Sources:
- https://github.com/actions/checkout/releases
- https://github.com/actions/setup-node/releases
- https://github.com/actions/setup-node
- https://github.com/actions/checkout
- https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/

No new package, provider, runtime service, paid resource or secret was introduced.

## Changes

1. `.github/workflows/next-event-controller.yml`
   - checkout v7.0.1 pinned to full SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`.
   - setup-node v7.1.0 pinned to full SHA `949feb2413d6458794dcd2491c4babbbce0c15c1`.
   - added `package-manager-cache: false`.
   - preserved exact issue_comment-only trigger, owner/Issue #96 filter, read-only permissions, workflow_sha checkout, and `persist-credentials: false`.
   - no dispatch, executor or provider path added.

2. `docs/architecture/OWNER-NEXT-ISSUE-COMMENT-ACTIVATION-CONTRACT.md`
   - records GitHub's default-branch activation prerequisite.
   - records current default-branch Contents API `NOT_FOUND` and live controller status NOT RUN.
   - defines safe integration and post-integration verification sequence; no bypass.

3. `scripts/owner-next-controller.test.mjs`
   - adds static contract test for the single permitted trigger, forbidden alternate triggers, exact immutable action pins, cache-disabled setup-node and activation-contract text.

4. `scripts/validate-pool-contract.mjs`
   - adds validator checks for activation precondition documentation and exact action pin/cache policy.

## Verification and limitations

- Fetched final changed files at commit `398bc48065a6d0e034cb610cf11e13c995c3804f`; their blob SHAs:
  - controller workflow: `e8c673349a1ad1ebbc5616fd9541dc38986f4969`
  - controller test: `906821df87b39e4a4decae188cb084ef743fe4e4`
  - pool validator: `076a95de97b666cc9c39bc29933a83046d8fc95c`
  - activation contract created in commit `d4dcaab37465545e2d64be256fd2a572747cddb0`.
- Fetched both upstream `action.yml` files at their immutable release commits and confirmed Node 24 runtime declarations and relevant input compatibility.
- GitHub release pages report verified signatures for both upstream release commits. The connector's commit payload did not expose a structured signature-verification field; no local cryptographic verification was run.
- Latest `fetch_commit_workflow_runs` for Pass 127 final commit returned an empty list. This connector view is limited to PR-triggered runs; no new run ID/job evidence is available. Latest Pass 127 CI: **NOT VERIFIED**.
- Pass 126 CI (140/140 D1 tests and 36/36 contract tests) applies to prior tested merge result `1bf51441f0a77cba6c36c5448a525f782a951ce2`, not Pass 127 changes.
- Default-branch Contents API read for `.github/workflows/next-event-controller.yml` still returns NOT_FOUND. Live controller execution remains NOT RUN.
- PR #188 review submissions 0; inline review threads 0. Independent security review NOT RUN.
- Detailed effective ruleset and `POOL_DISPATCH_ENABLED` metadata NOT VERIFIED.
- No local test command was executed in this environment; CI is required to verify the new assertions.
- No secret values read, hosted D1 writes, provider calls, dispatch, executor launch, deployment, merge or production mutation.

## Metrics

- Active engineering time: NOT MEASURED.
- Test execution for Pass 127: NOT RUN locally; CI NOT VERIFIED.
- New dependencies: 0.
- Paid resources: 0.
- New security defects confirmed: 0; review remains bounded and does not replace independent security review.
- Benchmark/performance measurement: NOT RUN.

## Next critical path

1. Obtain fresh CI evidence for Pass 127 exact PR merge-result; inspect workflow/job conclusions and logs, not just status labels.
2. Run an independent security review of the full controller → collector → raw Actions context → Envelope verifier → D1 receipt chain.
3. Re-read effective repository ruleset and dispatch variable metadata through an authorized metadata-only route.
4. Keep PR #188 Draft/unmerged until review and governance gates pass.
5. Keep live controller execution NOT RUN until the workflow is safely present on default branch through approved governance.
6. Keep Contour B deferred.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
