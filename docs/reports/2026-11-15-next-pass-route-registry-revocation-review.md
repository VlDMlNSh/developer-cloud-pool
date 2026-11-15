# Next pass — route registry revocation revalidation review — 2026-11-15

## Scope and immutable targets

- Cloud Pool default branch: `Основной` @ `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- A0/D1 proof components inspected on their existing, separate draft branches:
  - `fix/atomic-admission-registry-assertion-2026-11-15`: migration `proofs/d1-ledger/migrations/0014_atomic_admission_registry_assertion.sql`, blob `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
  - `fix/a0-admission-exact-replay-receipt-integrity-2026-11-15`: `proofs/d1-ledger/src/admit-qualified-task.mjs`, blob `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`.
  - `fix/atomic-admission-registry-view-2026-11-15`: `proofs/d1-ledger/src/trusted-route-registry.mjs`, blob `916581ca07cf94edb21c8c2daa77a4c45db3d666`.
- Related PR chain remains draft/unmerged: #86, #87, #92, #93. No rebase, cherry-pick, merge, runtime edit, schema edit, deployment, dispatch, provider call, or secret access was performed.

## Findings

1. **Positive atomic registry assertion exists in the proof branch.** The first statement of `admitQualifiedTask` inserts `pool_admission_registry_assertions`; migration 0014 uses a BEFORE INSERT guard to join the qualification row to the singleton active registry state, matching registry epoch, bundle digest and version, accepted snapshot, current validity window, and active/non-revoked issuer key. This assertion is placed in the same D1 batch as approval consumption, admission creation, attempt creation, outbox binding and commit receipt. The intended rollback property is therefore represented in the SQL composition, but this remains local proof code, not a production route.

2. **A separate monotonic revocation authority/watermark is not evidenced in the inspected admission path.** The admission SQL compares the route's signed `revocation_version` value to the persisted qualification row and checks `q.revoked_at IS NULL`; the migration guard independently checks current snapshot and issuer-key status. Neither inspected path reads a distinct durable revocation watermark/authority record and proves that its current version is at least the evidence's revocation version in the same transaction. The registry writer also stores route qualification rows from the signed bundle and advances the active registry pointer monotonically by epoch; that is not equivalent to an independently governed, durable revocation ledger with rollback/replay protection.

3. **Do not overstate this as a demonstrated exploit or a failing test.** A root-signed later registry epoch can invalidate old snapshot references through the active-pointer check, and issuer-key status is checked in the transaction. The unresolved question is whether revocation must remain effective independently of bundle replacement, key lifecycle, restore/rollback, and authority availability. The contract's monotonic revocation requirement needs a concrete table/authority contract and adversarial tests before qualification.

4. **No safe code patch was made in this pass.** The candidate proof files are split across stacked PRs with distinct bases, and the matching test/migration ancestry could not be fully reconciled from the currently available file paths. Adding a watermark check without first pinning the canonical schema, issuer authority, trusted-time semantics, writer transition and rollback model risks inventing a second authority or breaking the existing proof stack.

## Required next engineering unit

- Reconcile the complete migration/test ancestry for PRs #86/#92/#93 and identify the authoritative revocation source.
- Specify a single monotonic revocation state keyed to the exact issuer/key or route scope, with authenticated writer authority, monotonic version/epoch, durable rollback behavior, freshness/trusted-time semantics, and fail-closed handling when unavailable.
- Add adversarial D1 tests: stale watermark, lower-version replay, equal-version conflicting digest, issuer/key revocation, route revocation, registry epoch replacement, transaction rollback after assertion, replayed admission, and unavailable authority.
- Make the admission assertion compare the exact current watermark/version and scope in the same D1 batch as approval consumption and receipt. Preserve `dispatch_enabled=0`.
- Do not merge stacked PRs or enable `POOL_DISPATCH_ENABLED` until ancestry, exact-head CI, review and governance are independently verified.

## Current execution bridge

- One exact owner-authored `/next` event was created on MediaHub Issue #301: comment `6899669400`, URL https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6899669400.
- The GitHub connector available in this pass did not expose a list-workflow-runs operation for the MediaHub controller. Controller run, child run/job IDs and artifact digests therefore remain **NOT VERIFIED** for this event. Do not infer success from comment creation.
- This bridge is supplementary MediaHub execution, not Cloud Pool-native Gemini dispatch. Cloud Pool Issue #94 remains OPEN.

## Verification and disposition

- Live default HEAD: verified `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- PR #95: OPEN / DRAFT / UNMERGED; head `c70a11481eca0921224174de623778265c95bcb8`, base `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Exact-head workflow runs for PR #95: none returned by the commit workflow-run query. Combined commit status contexts: empty. Exact-head CI = **NOT VERIFIED**.
- PR #86: OPEN / DRAFT / UNMERGED, head `a218f92274eca5491700d8f72a21172f8ce689dc`.
- PR #87: OPEN / DRAFT / UNMERGED, head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`.
- PR #92: OPEN / DRAFT / UNMERGED, head `7014961587759b27d2ef6e91c60ce098d077ae83`.
- PR #93: OPEN / DRAFT / UNMERGED, head `e200838d038b9cd48635233187819302bba6a33e`.
- No tests executed in this pass. Static source inspection only.
- No secrets/variables read; no runtime/workflow/schema/permission/dispatch/deployment changes.
- Cloud Pool-native Gemini dispatch: NOT IMPLEMENTED / NOT QUALIFIED.
- A0/D1 production admission: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Canonical references

- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/gemini-three-agent-next-bridge-2026-11-15/docs/context/GITHUB-CONTEXT-WINDOW.md
- Checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/gemini-three-agent-next-bridge-2026-11-15/docs/checkpoints/2026-11-15-a0-admission-route-qualification.md
- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Supplemental event reconciliation — current ChatGPT turn

- This ChatGPT `/next` turn created a second owner-authored source comment `6899662679`: https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6899662679.
- The Issue #301 read-back shows both `6899662679` and `6899669400` as distinct owner-authored `/next` comments. They are distinct event IDs; do not collapse them or claim they are the same controller execution.
- The connected GitHub actions exposed no workflow-run listing operation for the MediaHub controller, so controller/child run IDs, job conclusions and artifacts for `6899662679` remain NOT VERIFIED. The same limitation applies to `6899669400` as recorded above.
- No second controller was called, no child workflow was dispatched directly, and no Cloud Pool dispatch authority was enabled.
