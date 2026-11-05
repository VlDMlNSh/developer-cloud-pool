# Live boundary recheck — 2026-11-05

## Target and scope
- Audit target: PR #12 head `57d463f321466f838b4874b78add059280a30022`.
- Canonical branch `Основной` HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- This report branch was created from the PR #12 head above. It is documentation-only and is not canonical.
- Scope: live refs, PRs, exact-head CI, review state, active ruleset, production Worker/Supervisor authorization boundary, and mature/native component benchmark.
- No production workflow, repository variable, secret, Environment, runner, or dispatch setting was changed.

## Live repository and PR state
- Repository is public; default branch is `Основной`.
- Active Ruleset `26550182`, name `Основной — verified`, enforcement ACTIVE, selector exactly `refs/heads/Основной`.
- Ruleset requires a PR but sets required approving review count to 0; CODEOWNERS review disabled; review-thread resolution required; no bypass actors; current-user bypass never. This does not satisfy an independent security-review gate.
- Canonical ref API returned `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #7: OPEN / DRAFT / NOT MERGED; head `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`; base SHA `692025e4a039aaf94c6683bb95da38b4f324fce8` (older than current canonical). GitHub reports mergeable=true. One owner-authored COMMENTED review exists; no independent review.
- PR #12: OPEN / DRAFT / NOT MERGED; head `57d463f321466f838b4874b78add059280a30022`; base SHA equals canonical `64d2636d4500127e635c214ccfb722c6b3fcda80`. GitHub reports mergeable=true. Review submissions and review threads are empty.
- PR #10: OPEN / DRAFT / NOT MERGED; head `fa308f0178fe332851cc8b5a8c43b564912c37a6`.
- PR #11: OPEN / DRAFT / NOT MERGED; head `7b3bd8d8840e122f03326299444a921e3ba5f425`.
- Other open PRs include #8, #9, #4 and #6; they remain separate lines of work and are not accepted by this audit.

## CI evidence
- PR #7 exact-head run `41921293708`: COMPLETED / SUCCESS; run metadata confirms head SHA `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`. This is static contract validation only.
- PR #12 exact-head Pool Contract Validation run `42027455932`: COMPLETED / SUCCESS; run metadata confirms head SHA `57d463f321466f838b4874b78add059280a30022`.
- PR #12 exact-head Reusable Worker Context Fixture Caller run `42027455840`: COMPLETED / SUCCESS; run metadata confirms the same head SHA.
- Combined commit status arrays were empty; the workflow runs above are the positive evidence. CI does not establish production runtime qualification.
- PR #10 run `41913465969` and PR #11 run `41918209585` were returned for their respective queried heads; this report does not infer runtime qualification from their static CI.
- No live workflow dispatch, DSH, Resource Probe, browser, provider/model call, or secret access was performed.

## Code-level boundary findings
- PR #7 already contains an owner-bound approval intake and single-use marker lifecycle. Reuse/adapt it; do not build a parallel approval system.
- PR #7's `.github/workflows/pool-supervisor.yml` includes `issues: [opened, reopened, labeled, unlabeled]`, so revoke-on-unlabel is event-reachable in that branch.
- PR #7's Worker still exposes `workflow_dispatch`. Its validate job checks issue open state, `pool:claimed`, target SHA and profile, but does not verify the owner approval marker or trusted caller provenance. The owner COMMENTED review on PR #7 independently records this direct-dispatch bypass concern. This remains a critical blocker.
- PR #7's approval module uses a bot-authored mutable issue comment, reads only `per_page=100`, and does not bind a unique trusted event/delivery ID. Replayed event safety and atomic single-use consumption are NOT PROVEN. Issue comment/label REST mutations are not transactional compare-and-swap.
- PR #12 adds `scripts/pool-worker-caller.mjs` (blob `88d79d74691431ead14f29426d214833c0086183`) and fixture tests, but the validator is not wired into production Worker.
- PR #12 Worker still exposes `workflow_dispatch`; Supervisor still uses REST workflow dispatch and requests `actions: write`. Therefore the caller validator is not yet a production authorization boundary.
- PR #12 Supervisor trigger types omit `unlabeled`, unlike PR #7. If this branch becomes the integrated implementation, revocation handling must remain reachable or be replaced by a better per-run authorization design.
- Current repository variable `POOL_DISPATCH_ENABLED` could not be read back through the available GitHub connection. Current value: NOT VERIFIED. Historical issue text and previous CI observations are not a current variable read-back.

## Mature component / native feature benchmark
- **ADOPT:** GitHub reusable workflows (`workflow_call`) as the native static caller boundary. The production Worker should not remain directly dispatchable; Supervisor should call it through a fixed workflow edge. GitHub documents reusable workflow context and permissions as caller-scoped and only reducible in nested calls.
- **ADOPT for evaluation:** GitHub Environments with required reviewers. GitHub Free supports required reviewers for public repositories; a job pauses before proceeding and can withhold Environment secrets until approval. Repository Environment configuration, reviewers, prevent-self-review and bypass policy were not accessible for live verification, so configuration status is NOT VERIFIED.
- **ADAPT:** PR #7 owner-event intake and PR #12 caller-context validator as existing repository components, but only after event replay and production caller wiring are addressed.
- **REJECT for current constraint:** `actions/actions-runner-controller` (Kubernetes/self-hosted infrastructure) and `runs-on/runs-on` (external cloud compute/cost) for a GitHub-Free-only pool. Keep official `actions/runner` as implementation reference, not a separate pool scheduler.
- No new third-party approval daemon or external runner fleet is justified at this stage.

## Decisions and status
- Production Worker authorization: BLOCKED.
- PR #7: useful existing implementation, NOT SAFE TO MERGE/QUALIFY as-is.
- PR #12: validator/fixture work is VERIFIED by exact-head static CI, but production caller boundary is NOT IMPLEMENTED.
- Independent security review: NOT RUN for PR #12; PR #7 only has owner-authored COMMENTED review.
- Current dispatch variable: NOT VERIFIED.
- Gemini controller, Gemini agents, Claude Code, browser, Worker, DSH and Resource Probe: NOT RUN.
- Runtime qualification and pool deployment: NOT QUALIFIED.
- Paid fallback: NOT USED.

## Next bounded step
Prepare one integrated, non-privileged implementation package on a single immutable target SHA:
1. Preserve PR #7's owner-intake work where it remains necessary, but bind approval to a stable actor ID and trusted event identity or use a native per-run Environment gate.
2. Add regression fixtures for duplicate/replayed label events, stale approvals, changed SHA/profile, concurrent supervisor runs, crash/retry, missing Environment protection and bypass.
3. Convert Worker to `workflow_call` only and wire the caller-context validator into the Worker runtime.
4. Replace Supervisor REST workflow dispatch with a static reusable-workflow call and bounded task matrix; remove `actions: write` if no longer required.
5. Prove direct `workflow_dispatch` is absent and no caller can forge the reusable context.
6. Require exact-head CI, independent review and current governance read-back before any privileged execution.

## Sources
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [PR #12](https://github.com/VlDMlNSh/developer-cloud-pool/pull/12)
- [PR #10](https://github.com/VlDMlNSh/developer-cloud-pool/pull/10)
- [PR #11](https://github.com/VlDMlNSh/developer-cloud-pool/pull/11)
- [Governance issue #1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [Reusable workflow documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)
- [GitHub Actions contexts](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [GitHub Environment configuration](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
