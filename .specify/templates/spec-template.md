# Feature Specification: [name]

Status: PLANNED  
Target repository: developer-cloud-pool  
Target base SHA: [40-character SHA]  
Working branch: [branch]  
Related Issues / PRs: [links]

## Problem and user outcome
Describe observable problem and intended outcome, not implementation.

## Scope
### In scope
- [observable capability]
### Explicitly out of scope
- [dispatch / provider calls / hosted writes / deployment / production / Contour B]

## Actors and trust boundaries
| Actor | Identity source | Permitted actions | Forbidden actions |
|---|---|---|---|

## Functional requirements
Use stable FR-001... identifiers and testable MUST statements.

## Security, privacy and governance
Use SEC-001... identifiers. Include fail-closed behavior, secret non-disclosure, least privilege, issuer/capability checks and dispatch/execution invariants.

## Reliability and state
Specify idempotency, replay, concurrency, durability, recovery, clocks, leases, fencing and ambiguous outcomes.

## Acceptance scenarios
Use Given / When / Then. Include success and negative/adversarial cases.

## Evidence mapping
| Requirement / AC | Test or inspection | Expected evidence | Actual evidence |
|---|---|---|---|

## Risks and unresolved questions
Separate verified facts from assumptions; name closure evidence.

## Definition of Done
- [ ] Target SHA and scope recorded.
- [ ] Reuse First assessment recorded.
- [ ] Plan/tasks consistent with spec.
- [ ] Positive, negative and adversarial tests.
- [ ] Diff and authority surfaces reviewed.
- [ ] Exact-head CI evidence recorded.
- [ ] Security/governance status explicit.
- [ ] Report, checkpoint and Context Window updated.
- [ ] Dispatch/execution invariants preserved.