# Integrated claim/lease/outbox design pass — 2026-11-08

## Scope and immutable change
- Documentation-only pass on branch docs/cross-chat-continuation-2026-11-06.
- New architecture/threat-model document commit: 24fe227fda3cdd327d674020c84c7f616c723451.
- New file: docs/architecture/2026-11-08-integrated-claim-lease-outbox-threat-model.md.
- No runtime, workflow, permissions, secrets, variables, cloud resources, billing, deployment or dispatch changed.

## Finding
Existing ADR (blob 6dae6f90b078fd12ba8e9cf52151817c7adf93dd) selects D1 as preferred local proof candidate versus Durable Objects, but does not define an integrated production authorization protocol. Issue #38 asks for durable single-use Supervisor claims and specifically rejects Issue labels as a proven CAS primitive. The new document fills the missing design scope without authorizing implementation.

The protocol specifies:
- authenticated issuer and principal-derived immutable owner/repository IDs;
- canonical signed approval envelope and trusted server time;
- one authoritative D1 transaction for approval consume + claim + outbox + audit;
- labels as presentation only;
- lease acquisition/renewal, monotonically increasing fencing generations and stale-ack rejection;
- at-least-once outbox delivery, deterministic event idempotency, dead-letter and crash recovery;
- threat matrix, least-privilege actor boundaries, test matrix, rollout gates and kill switches.

## Explicit constraints
- No production integration or Worker dispatch is authorized.
- D1 account Free/no-card eligibility remains NOT VERIFIED.
- Real remote D1 contention/recovery qualification remains NOT RUN.
- Independent security review remains NOT RUN.
- Existing dispatch gates must remain fail-closed; their current live values are NOT re-read in this pass.
- PR #36/#37/#39 remain separate local/static proofs; do not merge/integrate on the strength of these docs.

## Verification
- New document write returned commit SHA 24fe227fda3cdd327d674020c84c7f616c723451.
- Exact blob SHA and read-back are recorded in the Context Window after this report is committed.
- PR #27 exact-head CI: prior known head f65e054347ec481bdb4295b388e67d3e8573314d had no PR-triggered runs. New documentation commit's CI must be checked separately; absent runs are NOT VERIFIED.
- Formal/inline PR #27 review state must be re-read; no reviewer is inferred.

## Status
Design artifact: CREATED; implementation: NOT RUN; independent review: NOT RUN; remote qualification: NOT RUN; Contour A: BLOCKED / NOT ACCEPTED; Contour B: DEFERRED.

## Next step
Obtain an authorized independent security/architecture review of the integrated protocol, then update the contract from findings. Only after review may a separately scoped local-only implementation plan be considered. No merge, deployment or dispatch.
