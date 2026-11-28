# Implementation Plan: [name]

## Frozen baseline
Target SHA, base branch, scope, exclusions and DoD.

## Reuse First
| Candidate | License | Maintenance/security evidence | Fit | Decision |
|---|---|---|---|---|

## Architecture and data flow
Describe components, sequence, source of truth and failure behavior.

## Trust boundaries and authority
List identities, capabilities, read/write surfaces, secrets boundary and explicit denials.

## Data contracts and invariants
Schemas, canonicalization, identifiers, idempotency keys, state transitions and immutable fields.

## Failure model
Invalid input, unavailable dependencies, timeouts, stale state, replay, concurrency, partial writes and ambiguous acknowledgements.

## Migration and compatibility
Forward-only changes, data compatibility, rollback constraints and legacy-path retirement.

## Verification strategy
Map FR/SEC/AC to unit, integration, contract, adversarial and workflow tests. Pin expected SHA and CI workflow names.

## Operational controls
Bound time, output, resources, retries and quotas; redact sensitive data.

## Rollout, rollback, risks and open decisions
Prefer local/no-op proof. Production requires separate authorization.