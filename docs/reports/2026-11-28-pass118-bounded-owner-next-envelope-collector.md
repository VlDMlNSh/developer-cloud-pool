# Pass 118 — bounded API-attested owner /next envelope collector

Date: 2026-11-28  
Contour: A only  
Status: SUCCEEDED (collector implementation + exact-head Pool Contract CI); end-to-end controller/D1 composition NOT RUN  
Base: PR #181 head `453d74ff70a67d3091d920281f6471a721f1808d`  
Code/test/workflow head validated: `cbee39dcf5ee16f4ec491c535cd2f9c4cc4eda9e`

## Scope and DoD
Implement a read-only bounded GitHub API collector that produces the exact canonical Envelope v1 accepted by the existing Workers verifier/D1 attested adapter. Add adversarial tests and run exact-head CI. Do not wire admission, execute workers, dispatch, provision hosted D1, deploy or merge.

## Reuse First
- REUSE `digestOwnerNextEnvelope` and schema validator from `proofs/d1-ledger/src/owner-next-envelope.mjs`.
- ADAPT existing owner /next audit predicate and GitHub REST read model from PR #176.
- BUILD only a dedicated bounded collector and focused Node built-in tests.
- No new packages, SDKs or parallel ledger.

## Implementation
Added `scripts/owner-next-api-envelope.mjs`:
- API origin fixed to `https://api.github.com`; no caller-controlled API base URL.
- Repository-scoped relative paths only; rejects external origins, traversal/encoded path separators and redirects.
- Each request has a 3-second abort timeout and response body cap of 256 KiB; UTF-8 decoding is fatal and JSON must parse.
- Reads repository, Issue #96, source comment, workflow run, workflow metadata, default branch ref and workflow file at the run target SHA.
- Enforces exact repository/owner/issue/comment/action/body/association/run/workflow identity and first-attempt-only policy.
- Computes Git blob SHA-1 over `blob <length>\\0<bytes>` and compares it to the Contents API blob SHA.
- Produces the existing Envelope v1 schema and canonical digest through the existing validator implementation.
- Keeps target/event SHA, workflow commit SHA, workflow file blob SHA and workflow file ref SHA distinct.
- Exposes a mapper for the trusted Actions context used by the existing Workers verifier.
- Output is evidence only; `dispatch:false`, `executionAuthorized:false`.

Added `scripts/owner-next-api-envelope.test.mjs` with 8 tests:
1. canonical envelope and distinct SHA fields;
2. default-ref race rejection;
3. workflow blob digest mismatch rejection;
4. rerun rejection;
5. fixed origin and repository path allowlist;
6. oversized response rejection;
7. request timeout rejection;
8. invalid source identity rejection.

Pool Contract Validation now runs both the existing Envelope v1 suite and the new collector suite on PR #181's stacked base branch.

## Verification
- Exact-head Pool Contract run [46167867802](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46167867802): SUCCESS; job `141049343699`.
- YAML workflow parsing: SUCCESS.
- Pool security contract validator: SUCCESS.
- Node test suite: 28/28 PASS (20 existing Envelope v1 tests + 8 new collector tests), 0 failed.
- Intermediate CI failures were investigated from logs and fixed before final run. They are not represented as successes.
- Local execution in this session: NOT RUN; the passing execution is GitHub Actions on the exact code/test/workflow head above.
- D1 exact-head workflow was not triggered by this scripts-only pass; no D1 source or migration changed.

## Security / governance
- No secrets read; test token is synthetic and only used by an injected fake fetch.
- No D1 writes, hosted D1, provider calls, dispatch, executor, deployment, production mutation or merge.
- Independent security review: NOT RUN.
- PR #185 remains OPEN / DRAFT / UNMERGED and is stacked on PR #181. Formal reviews: 0; review threads: 0.
- Active ruleset #26550182 still requires PR and thread resolution but has 0 required approvals; it does not satisfy independent review.

## Defects and residual risks
- Collector is not yet invoked by the trusted issue_comment workflow.
- Exact serialized collector output has not yet been fed into `admitGitHubNextAttestedEvent` in the Workers/D1 integration test.
- Legacy adapter export remains in the D1 module; production import graph isolation remains NOT VERIFIED.
- API transport tests use deterministic synthetic fetch responses; no live GitHub event was collected and no secrets/token was used.
- Default-ref equality is fail-closed and may reject if the branch advances during the run; no race reconciliation policy is implemented.
- Current dispatch variable value remains NOT VERIFIED; dispatch remains prohibited.

## Metrics
- Active engineering time: NOT MEASURED.
- Code/test/workflow: 3 files changed versus PR #181 base; 375 additions, 0 deletions (final compare before docs).
- CI: final exact-head Pool Contract SUCCESS; 28/28 tests.
- Defects fixed during pass: 6 failing assertions in first wired test run, including root API path allowlist and fixture path handling; final run green.
- Critical path: workflow invocation → exact collector JSON/digest → Workers verifier → same JSON/digest into local D1 attested adapter → legacy import isolation → adversarial CI → independent review.

## Next step — Pass 119
Wire the collector into the trusted `issue_comment` workflow using only read permissions. Build the trusted context from Actions env, serialize the exact collector output, and pass that exact JSON/digest to the existing Workers verifier and local D1 attested adapter integration test. Keep admission confined to synthetic local D1. Do not dispatch or touch hosted D1.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
