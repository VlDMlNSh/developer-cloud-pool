# Specification: Controller → API Envelope → attested D1 composition

Status: REFINED / PLANNED — Pass 116 source reconciliation complete; implementation not started  
Target default SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca  
Controller source: PR #176 head f06155b8ac121a4af90cbc2356f12b965d0fbde9  
D1 source: PR #181 code/test SHA 88911e5a127b9345270b15da8e7cd3f8aa54293a  
Pass 111 branch HEAD: 4c8d820102472e130c2e9760f5d42f650ca43394  
Control issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140  
Contour: A only

## Problem and intended outcome
Read-only GitHub controller verification, API Envelope v1 validation and an attested D1 source-receipt adapter exist as separate work. Existing D1 tests manually construct Envelope fixtures. No candidate currently proves that same-run GitHub API readbacks produce the exact serialized Envelope v1 consumed by the Workers verifier and local D1 attested adapter.

The intended outcome is one source-controlled, non-dispatching composition with reproducible same-run provenance, canonical digest recomputation, durable local D1 receipt and fail-closed adversarial behavior. This pass does not authorize hosted D1 writes or production execution.

## Scope
In scope: minimal controller source port onto the Pass 111 lineage; pure API evidence collector; Envelope v1 producer; fixed-origin bounded API transport; workflow-code/target-SHA separation; Workers verifier and local D1 composition tests; legacy import isolation.

Out of scope: full merge/cherry-pick of PR #176, hosted D1, GitHub dispatch, worker execution, provider calls, secrets, deployment, merge, branch-protection changes, paid infrastructure, executor qualification, Contour B and expansion of poolctl.

## Actors and trust boundaries
| Component | Evidence source | Permitted action | Forbidden |
|---|---|---|---|
| Controller workflow | GitHub issue_comment context | Read-only event intake and API evidence collection | D1 writes, dispatch, providers |
| API evidence collector | Fixed-origin GitHub REST readbacks | Validate repository/owner/issue/comment/run/workflow/ref | Caller-supplied identity or arbitrary API origin |
| Envelope producer | Validated API tuple + trusted Actions context | Emit exact v1 JSON and canonical digest | Mint authority or omit mismatches |
| Workers verifier | Serialized Envelope + trusted Actions context | Recompute digest and cross-check context | Trust supplied digest alone |
| D1 attested adapter | Verified Envelope + synthetic local D1 | Persist/read back local test receipt | Hosted D1 or executor launch |
| Legacy adapter | Explicit test-only compatibility | Historical fixture tests only | Production import/call path |

## Functional requirements
- FR-001: Use one candidate branch with recorded common base and parent SHAs.
- FR-002: Use one canonical controller path and one attested D1 adapter; add no competing ledger or migration chain.
- FR-003: Independently read Issue, Comment, Repository, Actions Run, Workflow metadata, default ref and workflow-file metadata using fixed-origin bounded read-only requests.
- FR-004: Bind source comment, run ID/attempt, workflow ref/SHA, target default-branch SHA and immutable repository/owner/Issue/Comment IDs in one versioned envelope.
- FR-005: Recompute canonical digest from verified API response tuple; caller digest alone is insufficient.
- FR-006: Invoke the attested adapter only after every envelope predicate passes in the local Workers/D1 integration harness.
- FR-007: Exact replay compares the full immutable admission/receipt/task/route/outbox tuple before reporting success.
- FR-008: Mismatch, missing evidence, timeout, ambiguous read/write or unsupported state rejects or remains indeterminate without authorizing execution.
- FR-009: Controller evidence collector emits the exact serialized Envelope v1 and digest; it must not stop at OBSERVED_ONLY summary when exercised by the integration harness.
- FR-010: `targetSha` (issue_comment/default-branch event SHA), `workflowCommitSha` (trusted workflow-code SHA), workflow-file blob SHA and workflow-file ref SHA remain distinct fields; no unsupported equality assumption.
- FR-011: The workflow-file provenance is derived from trusted Actions context and independently read GitHub API metadata/bytes; caller-supplied file hash is not accepted.

## Security and governance
- SEC-001: API requests are read-only, fixed-origin, bounded and resource-allowlisted.
- SEC-002: No token, authorization header or sensitive environment value in logs, JSON, artifacts or tests.
- SEC-003: No new secrets, provider accounts, executors or permission scopes.
- SEC-004: dispatch:false and executionAuthorized:false on success, rejection, exception, replay and indeterminate paths.
- SEC-005: No child workflow dispatch or worker execution.
- SEC-006: Legacy admission APIs are not reachable from production composition; test-only compatibility is explicit and isolated.
- SEC-007: No merge or production action before exact-head CI, independent security review, governance and provenance are verified.
- SEC-008: GitHub API origin is fixed to the trusted GitHub environment contract; requests have explicit timeout and response-size limits; errors are sanitized and fail closed.

## Acceptance scenarios
- AC-001: Consistent synthetic API tuple and local D1 fixture produce one attested receipt with exact full-tuple readback.
- AC-002: Substituted immutable Comment Node ID rejects before D1 adapter invocation.
- AC-003: Replay with changed digest or run attempt rejects without second admission/receipt.
- AC-004: Distinct but independently valid target SHA and workflow SHA are correctly bound; equality is not assumed.
- AC-005: Missing API readback, stale ref, mismatched run, partial tuple or ambiguous acknowledgement rejects/remains indeterminate.
- AC-006: Every success/failure path retains dispatch:false and executionAuthorized:false.
- AC-007: The same controller evidence fixture produces byte-identical canonical Envelope JSON/digest consumed by the Workers verifier and D1 adapter; no hand-built substitute envelope is used in the composition test.
- AC-008: API timeout, oversized body, unexpected origin, HTTP error and malformed/duplicate-key response fail closed without leaking authorization material.
- AC-009: Production composition cannot import/call legacy `admitGitHubNextEvent`; historical compatibility tests explicitly isolate that entrypoint.

## Evidence mapping
| Requirement | Planned evidence |
|---|---|
| FR-001/002 | Git ancestry, changed-file map, migration inventory |
| FR-003/004/009/011 | API evidence collector tests with immutable IDs and workflow-file provenance |
| FR-005/010 | Canonical digest tests, target/workflow SHA distinction |
| FR-006/007 | Local Workers/D1 integration and adapter invocation spy |
| FR-008 | Fault injection for timeout, stale ref, replay and ambiguous writes |
| SEC-001/008 | Fixed-origin inspection, timeout/body bounds and transport tests |
| SEC-002/003 | Permission review, output redaction and dependency diff |
| SEC-004/005 | Assertions on every result and workflow inspection |
| SEC-006 | Import/call-graph check and test-only compatibility isolation |
| SEC-007 | Exact-head CI, independent review and ruleset/provenance readback |

## Risks and unresolved questions
- The PR #176 branch diverges from Pass 111 by 38 commits; only minimal source files may be ported.
- Current controller audit script uses GITHUB_API_URL if present and has no explicit timeout/response-size bound; this must be corrected before reuse.
- Controller currently returns OBSERVED_ONLY and does not emit Envelope JSON/digest.
- Existing D1 tests manually build envelopes; test coverage must exercise the real collector-to-envelope path.
- Legacy admission production call graph remains NOT VERIFIED.
- API readbacks are not atomic; default-ref changes between reads need a defined re-read/reject policy.
- Local D1 fixtures do not establish hosted D1, live event authenticity, production clock or executor qualification.

## Future implementation DoD
- [ ] Current default SHA and source refs/merge bases verified.
- [ ] Fresh candidate based on Pass 111 lineage; no broad PR #176 ancestry merge.
- [ ] One controller/evidence collector and one attested adapter path.
- [ ] AC-001 through AC-009 covered.
- [ ] Local Workers/D1 tests and Pool Contract CI pass on exact final head.
- [ ] Workflow remains read-only/non-dispatching; no hosted D1 writes.
- [ ] Legacy adapter is test-only and excluded from production import surface.
- [ ] Diff, imports, migrations, permissions and authority surfaces reviewed.
- [ ] Report/checkpoint/context updated with exact SHAs and run IDs.
- [ ] Independent security review and governance status explicit.