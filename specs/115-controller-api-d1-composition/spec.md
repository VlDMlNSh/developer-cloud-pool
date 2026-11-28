# Specification: Controller → API Envelope → attested D1 composition

Status: PLANNED — specification only in Pass 115  
Target default SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca  
Candidate inputs: PR #176 (read-only controller), Pass 110/111 envelope and D1 attestation work  
Control issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140  
Contour: A only

## Problem and intended outcome
Read-only GitHub controller verification and a D1 attested source-receipt adapter exist as separate work. Their separate tests do not prove a single trusted controller run obtains the correct API evidence, canonicalizes one envelope and invokes exactly one attested D1 path. The outcome is one auditable, non-dispatching composition with same-run provenance and fail-closed behavior.

## Scope
In scope: reconcile ancestry and source overlap; define one envelope and one D1 path; bind immutable GitHub identifiers and same-run context; recompute canonical digest from API data; add negative-first replay/substitution/stale-ref/run-mismatch/partial-read tests; preserve dispatch:false and executionAuthorized:false on every path.

Out of scope: hosted D1, GitHub dispatch, worker execution, provider calls, secrets, deployment, merge, branch-protection changes, paid infrastructure, executor qualification, Contour B and expansion of poolctl.

## Actors and trust boundaries
| Component | Evidence source | Permitted action | Forbidden |
|---|---|---|---|
| Controller | Trusted workflow context | Bounded read-only GitHub API calls | Dispatch or hosted writes |
| API verifier | GitHub REST readbacks | Validate and emit observed envelope | Trust caller-supplied identity |
| Canonicalizer | Versioned schema | Deterministic digest | Normalize away mismatch |
| D1 adapter | Existing canonical ledger | Local/synthetic D1 tests | Hosted D1 writes |
| Tests | Synthetic fixtures/local Workers runtime | Success and rejection tests | Real credentials/provider calls |

## Functional requirements
- FR-001: Use one candidate branch with recorded common base and parent SHAs.
- FR-002: Use one canonical controller path and one attested D1 adapter; add no competing ledger or migration chain.
- FR-003: Independently read Issue, Comment, repository identity and workflow/run metadata using fixed-origin bounded read-only requests.
- FR-004: Bind source comment, run ID/attempt, workflow ref/SHA, target default-branch SHA and immutable repository/owner IDs in one versioned envelope.
- FR-005: Recompute canonical digest from verified API response tuple; caller digest alone is insufficient.
- FR-006: Invoke the attested adapter only after every envelope predicate passes.
- FR-007: Exact replay compares the full immutable admission/receipt/task/route/outbox tuple before reporting success.
- FR-008: Mismatch, missing evidence, timeout, ambiguous read/write or unsupported state rejects or remains indeterminate without authorizing execution.

## Security and governance
- SEC-001: API requests are read-only, fixed-origin, bounded and resource-allowlisted.
- SEC-002: No token, authorization header or sensitive environment value in logs, JSON, artifacts or tests.
- SEC-003: No new secrets, provider accounts, executors or permission scopes.
- SEC-004: dispatch:false and executionAuthorized:false on success, rejection, exception, replay and indeterminate paths.
- SEC-005: No child workflow dispatch or worker execution.
- SEC-006: Legacy admission APIs are not reachable from production composition; test-only compatibility is explicit and isolated.
- SEC-007: No merge or production action before exact-head CI, independent security review, governance and provenance are verified.

## Acceptance scenarios
- AC-001: Consistent synthetic API tuple and local D1 fixture produce one attested receipt with exact full-tuple readback.
- AC-002: Substituted immutable Comment Node ID rejects before D1 adapter invocation.
- AC-003: Replay with changed digest or run attempt rejects without second admission/receipt.
- AC-004: Distinct but independently valid target SHA and workflow SHA are correctly bound; equality is not assumed.
- AC-005: Missing API readback, stale ref, mismatched run, partial tuple or ambiguous acknowledgement rejects/remains indeterminate.
- AC-006: Every success/failure path retains dispatch:false and executionAuthorized:false.

## Evidence mapping
| Requirement | Planned evidence |
|---|---|
| FR-001/002 | Git ancestry, changed-file map, migration inventory |
| FR-003/004 | API verifier tests with immutable IDs and same-run binding |
| FR-005/006 | Canonical digest tests and adapter invocation spy |
| FR-007/008 | Local Workers/D1 integration and fault injection |
| SEC-001/002/003 | Permission review, fixed-origin inspection, output redaction tests |
| SEC-004/005 | Assertions on every result and workflow inspection |
| SEC-006 | Import/call-graph check and test-only compatibility isolation |
| SEC-007 | Exact-head CI, independent review and ruleset/provenance readback |

## Risks and unresolved questions
Current ancestry and changed-file overlap across PR #176–#183 must be mapped before code work. API evidence schema and D1 adapter export surface must be read from candidate SHAs. Production caller of legacy admission export remains to be identified. GitHub API rate limits, reruns and issue/comment edits need explicit race policy. Hosted D1 and live event authenticity remain outside this local proof.

## Future implementation DoD
- [ ] Current default SHA and all source PR heads/parents verified.
- [ ] One canonical implementation branch and adapter/controller path selected.
- [ ] AC-001 through AC-006 covered.
- [ ] Local Workers/D1 tests and Pool Contract CI pass on exact final head.
- [ ] Workflow remains read-only/non-dispatching.
- [ ] Diff, imports, migrations and authority surfaces reviewed.
- [ ] Report/checkpoint/context updated with exact SHAs and run IDs.
- [ ] Independent security review and governance status explicit.