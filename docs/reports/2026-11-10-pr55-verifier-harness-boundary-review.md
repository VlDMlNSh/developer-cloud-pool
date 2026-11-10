# PR #55 — verifier harness boundary review

Date: 2026-11-10
Status: STATIC SOURCE REVIEW — NOT A PRODUCTION APPROVAL HANDLER

## Immutable inputs and current repository state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Latest default-branch HEAD observed by repository-scoped commit search: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`.
- Candidate PR: [#55](https://github.com/VlDMlNSh/developer-cloud-pool/pull/55), branch `proof/github-approval-event-adapter-2026-11-10`, head `edff010388897f23f58bceb92e5180a09970fdff`; OPEN / DRAFT / UNMERGED.
- Exact-head Actions runs: Pool Contract Validation `42797001864` SUCCESS; GitHub Approval Event Adapter Fixture Tests `42797001989` SUCCESS.
- Formal reviews: 0. Inline review threads: 0.
- No source, workflow, permission, secret, database, deployment or dispatch change was made in this pass.

## What the candidate proves

The candidate verifier checks a supplied event/context/policy tuple, performs canonical repository/Issue/comment reads through an Octokit-shaped interface, repeats Issue/comment reads to detect changes, and emits `dispatch:false` for both DENY and positive evidence outcomes. Its tests cover several useful synthetic negative cases. The dedicated workflow runs Node's built-in test runner with `contents: read`, no persisted checkout credential, and no provider/model or dispatch integration.

This is a useful isolated contract fixture. Green exact-head CI proves only that these synthetic fixtures pass on this PR head.

## Admission gaps confirmed by source and workflow review

1. **No native event execution path is wired.** `readRunnerEvent()` is exported but the workflow only runs `node --test`; no job invokes the loader, creates an Octokit client, or executes the verifier against an actual GitHub Actions `issue_comment` event.
2. **No real Octokit transport is exercised.** Tests use a handwritten fake object exposing `rest.repos.get`, `rest.issues.get`, and `getComment`. The package manifest has no Octokit dependency or lockfile. No HTTP transport, API version/header behavior, pagination/error mapping, redirect handling, or response-size boundary is tested.
3. **Policy provenance is caller-controlled at this layer.** `verifyApprovalEvent` accepts `policy`, `context`, and `octokit` as arguments. No protected default-branch policy loader or authenticated runtime identity binding exists in this proof. Passing a policy object to this pure function is not evidence that the policy came from a protected source.
4. **Replay prevention is absent.** The nonce is syntax-checked and returned as evidence; there is no durable store, atomic compare-and-set, single-use consumption, or retry/ambiguous-response recovery.
5. **Freshness is absent.** The command has no expiry field and the verifier does not establish trusted current time or an expiry window. Matching `created_at` and `updated_at` only detects edits; it does not make an old approval fresh.
6. **Positive evidence is not authorization.** The positive result deliberately remains `dispatch:false`; there is no capability issuance or dispatch boundary. This is correct for the present proof and must not be changed implicitly.

## Required next engineering sequence

- Keep PR #55 Draft and unmerged; do not mount it in a privileged default-branch workflow.
- Add a separate unprivileged proof that pins a real Octokit release and lockfile, constructs the client with a synthetic GET-only Fetch transport, and proves every attempted request is GET-only and fixed to `https://api.github.com`. Use a PR-only runner with no secrets and no privileged event. Do not claim zero network egress unless measured; dependency installation itself needs registry access unless vendored.
- Add tests for event-loader behavior and caller identity/context binding, while keeping native `issue_comment` workflow activation deferred until the workflow is reviewed and present on the default branch.
- Keep protected policy provenance, trusted expiry, canonical envelope digest, atomic durable nonce consumption, effective Actions token permissions, independent review and governance read-back as separate mandatory admission gates.
- No dispatch, model/provider call, D1 access, secret access, merge, deployment, qualification or acceptance.

## Disposition

PR #55: CI SUCCESS for synthetic fixtures; independent review NOT RUN; native event execution NOT RUN; real Octokit transport NOT RUN; replay/freshness NOT IMPLEMENTED; authorization NOT PROVIDED.
Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.
