# Projection delivery reconciliation audit — 2026-11-12

## Scope and immutable target

- Author-side source audit of PR #67 only; no independent reviewer dispatch.
- Target base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Target branch: `impl/receipt-bound-projection-2026-11-11`.
- Corrected head: `d908a9a60609508073f14b32e624558ccd83870d` (12 commits ahead, 0 behind).
- PR #67 remains OPEN / DRAFT / UNMERGED.

## Findings

### F-01 — broad label ownership (corrected in local candidate)

Before correction, the reconciler selected every issue label beginning with `pool:` for removal unless it was in the desired terminal set. The prefix does not establish ownership; another subsystem or an operator may use an unrelated `pool:*` label.

Correction:
- Added an explicit mutation allowlist consisting of the four terminal labels already declared by the reconciler plus `pool:claimed`, the pre-terminal label present in the local fixture.
- Unknown `pool:*` labels are preserved and excluded from the reconciler's ownership read-back set.
- Extended the existing reconciler test fixture with `pool:security-hold`; assertion requires it to remain after terminal projection.

Evidence:
- Source blob: `4d440879a850fec1e3313b01df1b139e71d92fd7`.
- Test blob: `32d667fb13731347ec839e8bdfcbff6f2f726fc4`.
- Integration contract blob: `376c94ae61ba0bf6b3f4622a63b690c82eb94350`.

Limit: this is an explicit code-level ownership boundary, not proof that the entire operational label registry has been accepted by governance. Live GitHub qualification must verify actual labels and ownership before write enablement.

### F-02 — delayed marker visibility can still cause duplicate POST across delivery retries (OPEN BLOCKER)

The reconciler correctly does not issue a second POST within one invocation after a lost POST response. It also supports `allowPost:false` for reconciliation-only passes. However, `createProjectionDeliveryOrchestrator.deliver()` currently calls `reconcileTerminalProjection(..., { allowPost: true })` on every newly acquired delivery lease.

If a first POST was accepted by GitHub but its marker is not yet visible during the immediate read-back, the invocation returns retryable and the outbox becomes eligible for a later attempt. That later orchestrator invocation again sets `allowPost:true`, and can POST a duplicate before the first marker becomes visible.

The existing delayed-visibility unit test proves only a direct second reconciler call with `allowPost:false`; it does not execute the second orchestrator delivery. Thus the claimed retry-level duplicate prevention is not established.

Required design decision before any live GitHub writes:
- Either persist a durable post-attempt/indeterminate state and force subsequent attempts into read-only reconciliation, with an explicit recovery/manual-resolution policy; or
- adopt a documented at-most-once POST policy that surfaces an indeterminate outcome rather than risking duplicate comments.
- Do not assume exactly-once semantics from a non-transactional GitHub comment API. Do not simply mark delivered without marker read-back.

No code change was made for F-02 because selecting a safe persistence/operational policy is an authority and delivery-semantics decision, not a safe local patch without further contract evidence.

## Local validation status

- Two exact-head workflows were observed for corrected head `d908a9a60609508073f14b32e624558ccd83870d`:
  - Pool Contract Validation run `43161227426`
  - Isolated D1 Ledger Proof run `43161227797`
- Both completed SUCCESS on exact head `d908a9a60609508073f14b32e624558ccd83870d`. Pool Contract Validation job `130992629166` passed workflow syntax, dispatch-disabled assertion, YAML parsing and pool security-contract validation. Isolated D1 Ledger Proof job `130992630814` passed syntax and Workers-runtime D1 adversarial tests. Combined commit status still has zero contexts / PENDING; workflow success is evidence for these jobs only, not a green required-status context.
- No local command execution is claimed in this pass.
- No hosted D1, live GitHub API, worker deployment, dispatch, provider/model call, paid service, secret read, or merge.

## Governance and disposition

- PR #67: OPEN / DRAFT / UNMERGED; exact head as above; base is current default and compare reports 12 ahead / 0 behind.
- Recovery Actor remains separate and limited to `dead_letter_expired_projection`.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Independent technical/security/governance review remains deferred until after actual pool launch by owner direction.

## Next bounded step

Resolve F-02 with an explicit durable delivery state and bounded semantics, or choose at-most-once/manual resolution, then add an orchestrator-level regression test that executes two separate delivery attempts after delayed marker visibility. Before any write-capable production adapter, independently validate the actual label registry, comment API behavior, concurrency/visibility assumptions, and authority gates after the pool is launched.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
