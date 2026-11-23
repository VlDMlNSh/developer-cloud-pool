# Contour A Acceptance Criteria Matrix

- Status: **CONTROL MATRIX / CURRENT ACCEPTANCE IS NOT GRANTED**
- Scope: Contour A only.
- Governing project status and current blockers remain in the [Context Window](../context/GITHUB-CONTEXT-WINDOW.md).

## Gate model

A gate is closed only when its evidence is immutable, current, independently inspectable where required, and bound to the exact capability/version being qualified. Design documents and local synthetic proofs are not production evidence.

| Gate | Required evidence | Current disposition at adoption baseline |
|---|---|---|
| Governance and authority | Effective ruleset read-back, least-privilege workflow permissions, owner/issuer/capability binding, current dispatch gate state | Partial/historical evidence; re-read before sensitive action |
| Executor qualification | Pinned artifact provenance, runtime compatibility, sandbox boundaries, bounded resources/egress, negative tests | Not fully qualified |
| Durable admission and leases | Atomic admission, authenticated issuer, trusted clock provenance, fencing, expiry, replay protection, crash recovery, reconciliation | Blocked by Pass 50 F-50-01 trusted-time finding |
| Model/provider routing | Credential/account/quota-domain identity, free eligibility, route health, persistent reservations/settlement, paid-fallback denial | Not qualified |
| State persistence and recovery | Durable state, idempotency, backup/restore, interrupted-run recovery, no duplicate execution | Not fully qualified |
| Remote web console | Authenticated mobile/desktop access, server-side session, read API, CSRF/origin controls, no browser secrets, real status | Prototype/design only; no production E2E proof |
| Observability and audit | Task/run/job correlation, timestamps, structured redacted audit events, metrics, incident evidence | Partial design; production telemetry not verified |
| Security qualification | Threat model, trust-boundary tests, secrets isolation, provenance, egress/resource limits, independent audit plan | Ongoing; do not infer from contract CI |
| End-to-end operational acceptance | Repeated bounded tasks, retries/recovery, quota enforcement, persistence, UI, security/governance and evidence bundle | Not accepted |

## Evidence tuple

Every gate evidence item must identify:

- Requirement ID and version.
- Repository and immutable commit SHA.
- PR head SHA and merge-result SHA where relevant.
- Workflow run ID, job ID and attempt number.
- Test name, command, environment/runtime version and result.
- Artifact digest and retention/location where applicable.
- Reviewer identity and review status where a separate reviewer is required.
- Timestamp and evidence freshness rule.
- Known limitations and untested conditions.

## Acceptance decisions

- **PASS** means the named test or check passed; it does not automatically close the gate.
- **PARTIAL** means some required evidence exists, but one or more criteria remain open.
- **BLOCKED** means a prerequisite or known defect prevents qualification.
- **NOT VERIFIED** means evidence cannot be inspected or does not bind to the target.
- **QUALIFIED** applies only to a named executor, route, service or capability under stated constraints.
- **ACCEPTED** applies to the complete Contour A only after all gates pass and formal acceptance is recorded.

## Non-negotiable exclusions

No paid fallback, secret-value inspection, unapproved provider calls, hosted D1 operation, production dispatch, deployment or Contour B work is authorized by this matrix. Existing owner and governance approvals remain required.
