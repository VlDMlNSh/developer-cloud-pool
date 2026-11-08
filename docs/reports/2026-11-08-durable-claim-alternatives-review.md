# Durable claim alternatives review — 2026-11-08

## Scope
Follow-up to the integrated claim/lease/outbox threat model. Re-read Issue #38 and found its explicit requirement to compare three bounded claim designs was not yet fully addressed by the initial D1-centric ADR.

## Decision analysis added
The architecture document now compares:
A. Serialized Supervisor + Issue labels — rejected as authoritative CAS; workflow concurrency is scoped and labels remain mutable.
B. Dedicated state repository + immutable per-task reservation refs — candidate only; requires separate narrowly scoped writer identity, create-only semantics, deletion/recreation protection and adversarial proof. Do not grant Contents: write to current Supervisor.
C. Conditional-write durable store (D1) — preferred candidate under existing storage ADR, but not production-selected or qualified; remote account entitlement and backend contention/recovery remain unverified.

Decision rule: if neither B nor C demonstrates one-winner contention, immutable binding, replay resistance, interruption recovery, auditability and least privilege, record NO QUALIFIED CLAIM BACKEND and keep dispatch disabled. No fallback to labels or paid infrastructure.

## Artifacts
- Architecture document: docs/architecture/2026-11-08-integrated-claim-lease-outbox-threat-model.md
- Updated blob SHA: 31c951b76e18741410a1349281a578438d53f25a
- Update commit: d09d04fe86de1e0d077693f6741e6bf210afe84a
- Read-back confirmed the alternatives section is present.
- No runtime/workflow/permissions/secrets/variables/cloud resource/billing/deployment/dispatch changes.

## Remaining evidence
- Option B isolated ref-reservation prototype and permission/deletion/recreation adversarial tests: NOT RUN.
- Option C disposable remote D1 concurrency/recovery qualification: NOT RUN; account Free/no-card entitlement NOT VERIFIED.
- Independent architecture/security review: NOT RUN.
- Issue #38 remains OPEN until real-backend evidence, recovery tests, independent review and exact-head CI are complete.
- PR #27 exact-head CI and reviews need fresh verification; no merge.

## Status and next step
Design comparison UPDATED; implementation NOT RUN; backend qualification NOT RUN; independent review NOT RUN. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED. Next: obtain independent review of the alternatives analysis and threat model; then qualify only the selected isolated backend. Dispatch remains fail-closed.
