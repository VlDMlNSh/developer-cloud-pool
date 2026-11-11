# Cloud Pool bounded audit — 2026-11-11

## Scope and immutable refs

Read-only reconciliation of open PRs #55, #56 and #57 in `VlDMlNSh/developer-cloud-pool`, with focus on canonical approval-event provenance, expired lease takeover denial, and attempt-specific Actions evidence.

- PR #55: https://github.com/VlDMlNSh/developer-cloud-pool/pull/55
  - Branch: `proof/github-approval-event-adapter-2026-11-10`
  - Compare against default branch: 6 ahead / 0 behind; merge base/default HEAD observed as `864213e2ff5b4fa956ba405dea8137a44d812f49`.
  - Verifier blob read back: `80bbb2c93691be3eaf89466d6638a9795dafe6fb`.
- PR #56: https://github.com/VlDMlNSh/developer-cloud-pool/pull/56
  - Branch: `fix/deny-attempt-lease-takeover-2026-11-10`
  - Exact current PR head stated in PR metadata and confirmed by Actions artifact provenance: `0769b6b5d5eda9c7821804b93db21ded6e0985ef`.
  - Base PR #51 exact head: `32c88e50e173e6b19bc6c61723ab6474a3c08145`; compare: 4 ahead / 0 behind.
  - Adapter blob: `d9e5f97b94f0873fbec542a71bc90ea3b62e0e30`; test blob: `911945bed6449b45f421786808d57e994d160e71`.
- PR #57: https://github.com/VlDMlNSh/developer-cloud-pool/pull/57
  - Branch: `proof/github-actions-run-evidence-adapter-2026-11-10`
  - Compare against default branch: 31 ahead / 0 behind; merge base/default HEAD observed as `864213e2ff5b4fa956ba405dea8137a44d812f49`.
  - Pure verifier blob: `61455282e6baa0894b29087d4ccd8cc27941985e`.

## Findings

### PR #55 — canonical approval-event evidence

- Source diff and verifier were inspected. The proof accepts only native `issue_comment.created`, a normal Issue (not a PR), exact owner/repository identity, numeric approver identity, allowlisted Issue, exact command grammar, target SHA/profile/nonce, and canonical API read-back of Issue/comment followed by a second read to detect resource changes.
- Every denial and the positive result explicitly retain `dispatch:false`; no capability, storage, provider/model, or dispatch API is exposed.
- Tests are synthetic Octokit-compatible fixtures; no live GitHub API or runtime issuer was exercised.
- Formal review submissions and inline review threads: 0 / 0 at inspection.
- Important limits remain acknowledged by the PR: protected approver configuration, trusted time/expiry, canonical envelope hashing, D1 single-use consumption/outbox, Actions runtime permission smoke test, production composition and independent qualification are not implemented. The verifier accepts `policy` and `context` as inputs; without a trusted composition root they are not themselves proof of protected configuration. Keep as evidence-only proof, not an accepted issuer.

### PR #56 — expired lease takeover denial

- Exact-head Actions run [42825872826](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42825872826), job `129862892371`, completed SUCCESS. Steps read back: checkout, pinned Node, dependency install, syntax check, Workers-runtime D1 tests, artifact preservation; all successful.
- Artifact `13769536309` (`d1-ledger-proof-package-lock`) is present, not expired at inspection; SHA-256 `df55c8379d63b06d9107e3d05424f9793e04b37b85db18f7cf7432083178c119`.
- Source removes caller-controlled `resumable` and allows lease acquisition only for a pending task with a prepared current attempt. Expired/running/indeterminate work cannot be reclaimed by caller metadata. Tests assert forged extra arguments do not mutate generation/owner/event history, and that indeterminate work blocks blind retry.
- Formal review submissions and inline review threads: 0 / 0. PR remains Draft/unmerged.
- This closes the narrow unsafe-takeover path only. It does not implement a trusted reconciliation resolver, prove executor side effects stopped, integrate Supervisor/Worker, qualify hosted D1, or authorize dispatch.

### PR #57 — attempt-specific Actions run evidence

- Diff inspection confirms fixed attempt-specific GET route `GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}`, pinned Octokit dependency/lockfile, no caller-supplied URL/method/auth, retries disabled, read-only workflow permissions, and strict binding of repository ID, run ID, run_attempt, workflow ID/path/ref, event, head SHA and referenced workflow path/ref/SHA.
- The pure verifier distinguishes active from terminal executor lifecycle evidence. Even a completed successful run returns `sideEffects: UNKNOWN`, `retryAuthorized:false`, `dispatch:false`. The reconciliation policy preserves the claim for all outcomes.
- PR description reports final fixture CI 23/23 and Pool Contract Validation SUCCESS; those run IDs and exact-head status were not independently re-read in this pass, so retain them as PR-reported, not independently verified evidence.
- Formal review submissions and inline review threads: 0 / 0. PR remains Draft/unmerged.
- Critical integration gap explicitly confirmed in PR description: production Supervisor still uses list-run title/time heuristics and returns a claim to ready after 15 minutes when no matching list entry appears. List absence is not authoritative proof that execution did not start or cause side effects. Production event binding also does not yet pass exact run_attempt/full immutable identity. PR #57 is not wired into Supervisor/Worker and does not resolve side effects.

## Cross-PR assessment

- PR #55, #56 and #57 are separate proof/remediation branches; do not merge or collapse their bases as one change.
- All three PRs had 0 formal review submissions and 0 inline review threads at the time of inspection.
- PR #56 exact-head CI is independently read back SUCCESS. PR #55 and #57 exact-head CI was not independently read back in this pass.
- No dispatch, workflow dispatch, D1 provisioning, secrets access, provider/model call, deployment, merge, qualification or acceptance occurred.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
- Next bounded engineering step: implement and test the trusted, evidence-bound reconciliation authority and Supervisor/Worker identity bridge; consume exact `run_id + run_attempt + workflow identity + immutable attempt/lease generation`, preserve claims on missing/ambiguous evidence, and require explicit side-effect reconciliation before terminalization or retry. Then independently review the three PRs on their exact heads and re-read exact-head CI.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
