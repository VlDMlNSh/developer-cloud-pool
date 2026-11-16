# Wave 334 — Four-account Gemini candidate review

Date: 2026-11-16  
Repository: `VlDMlNSh/developer-cloud-pool`  
Contour: A — Cloud Development Pool  
Status: REVIEW COMPLETE / LIVE DISPATCH BLOCKED

## Immutable candidate

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/107
- Candidate branch: `feat/four-account-gemini-controller-2026-11-16`
- Base SHA recorded by PR: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`
- Candidate SHA: `027492668e7721a5371b38997bc76a6cd6a50cd4`
- Compare: 12 commits ahead, 0 behind the PR base; 5 changed files.

## Repository and control-plane restoration

- Cloud Pool Issues #94 and #96 are OPEN.
- Issue #94 requires exactly four isolated Gemini tasks for the current qualification wave and makes clear that MediaHub's controller is not a substitute for a Cloud Pool-native controller.
- Issue #96 is the dedicated Cloud Pool control issue. Its exact owner-authored top-level `/next` event is the only intended dispatch authority. Its four-agent amendment supersedes its earlier three-child count for this wave.
- MediaHub Issue #301 and `.github/workflows/gemini-batch-dispatch-controller.yml` are a separate control plane. They must not be used as a bridge or substitute for Cloud Pool dispatch.
- Context Window continuation branch: `docs/cross-chat-continuation-2026-11-06`; pre-update context blob `8a935efd4ff5022d01f762ccce76906875ec04a4`.

## Exact-head CI evidence

- Run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43868830501
- Run ID: `43868830501`
- Job ID: `133304274884`
- Workflow: Pool Contract Validation
- Exact candidate SHA: `027492668e7721a5371b38997bc76a6cd6a50cd4`
- Result: COMPLETED / SUCCESS.
- The workflow diff adds `node --test scripts/gemini-four-agent-controller.test.mjs`; the run is fake-client/no-provider-call evidence, not a live Gemini qualification.
- PR #107 remains OPEN/DRAFT/UNMERGED; formal reviews: 0.

## Review findings

1. Model selection is not allowlisted: `GEMINI_MODEL` overrides the default `gemini-2.5-flash` without validation. This can select an unapproved or paid model and violates the no-paid-fallback boundary. Require a fixed reviewed allowlist.
2. Provider requests have no explicit timeout or cancellation. A stalled request can hold an agent indefinitely. Require a bounded deadline and terminal timeout state.
3. Model output is unbounded and is returned in the report / CLI stdout. Require output-size bounds and a reviewed redaction/serialization policy before logs or artifacts.
4. Four distinct strings do not prove four Google account identities or independent quota domains.
5. The candidate is only a callable script/library. It is not integrated with owner-only Issue #96 admission, immutable target SHA binding, durable single-use lease/fencing, crash recovery, or child-run reconciliation.
6. Earlier Wave 333 evidence records the official SDK runtime as FAILED / NOT QUALIFIED because `@google/genai` was dynamically imported but no package manifest/lockfile existed. The current PR diff still does not add a package manifest or lockfile. Fake injected clients do not resolve this runtime blocker.

A review comment with these findings was posted to PR #107 (GitHub comment ID `6917019970`). This is primary-engineering feedback, not an independent security approval.

## Qualification matrix

| Gate | Status |
|---|---|
| Four task-envelope isolation via fake clients | VERIFIED by exact-head CI |
| Exact-head Pool Contract Validation | VERIFIED |
| Official SDK install/lockfile/runtime | NOT VERIFIED / prior runtime failure remains |
| Fixed free-model allowlist | BLOCKED |
| Request timeout/cancellation | BLOCKED |
| Bounded output/report handling | BLOCKED |
| Four secret names/scopes metadata | NOT VERIFIED |
| Four distinct Google account identities/quota domains | NOT VERIFIED |
| Cloud Pool Issue #96 owner-only production caller | NOT IMPLEMENTED / NOT VERIFIED |
| Durable admission, lease/fencing, idempotency and recovery | NOT IMPLEMENTED / NOT VERIFIED |
| Child-run/artifact reconciliation | NOT IMPLEMENTED / NOT VERIFIED |
| Independent security review | NOT RUN |
| Live Gemini provider calls | NOT RUN |

## Actions in this pass

- Restored Issues #94/#96 and reconciled the four-agent topology.
- Re-read the exact PR #107 diff and exact-head workflow run/job.
- Performed a bounded code review and posted actionable findings to PR #107.
- No secret values were read; no provider requests, workflow dispatch, merge, deployment, or paid resource use occurred.

## Next bounded engineering step

Harden the isolated candidate with a fixed free-model allowlist, per-agent deadline/cancellation, bounded output handling, and a pinned official SDK package/lockfile; then add no-network SDK fake-fetch tests. Keep dispatch disabled until the Issue #94/#96 provenance, durable lease/recovery, secret metadata/account separation and independent review gates pass.

Canonical MediaHub map (separate repository/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
