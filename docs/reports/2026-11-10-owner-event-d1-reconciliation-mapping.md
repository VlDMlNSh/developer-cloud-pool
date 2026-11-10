# 2026-11-10 — Owner-event provenance to D1 reconciliation mapping

## Scope and immutable targets

- Audit date: 2026-11-10 (Europe/Vilnius).
- Default branch `Основной` HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Reconciliation proof target: PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Earlier reconciliation queue target: PR #51 head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- Authorization design target: `design/integrated-pool-authorization-contract-2026-11-06` at `75c83a288d865f1bbeda4905cf817e00084bcc2d`.
- This was a read-only source/metadata audit. No runtime, dispatch, hosted D1, secrets, provider calls, deployment, merge, or executor invocation.

## Live repository and governance recheck

- Default branch HEAD remains `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #54: OPEN / DRAFT / UNMERGED; head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`; exact-head run `42537241204` SUCCESS. Formal reviews: empty.
- PR #51: OPEN / DRAFT / UNMERGED; head `32c88e50e173e6b19bc6c61723ab6474a3c08145`; exact-head run `42536377720` SUCCESS. Formal reviews: empty.
- Issue #38 remains OPEN.
- Active ruleset `26550182` targets only `refs/heads/Основной`, requires a PR, but requires 0 approvals and has no required reviewers or CODEOWNERS approval. Review-thread resolution is required.
- Latest default-branch scheduled Supervisor run `42742607594` completed SUCCESS at the exact default HEAD. This is a heartbeat result, not evidence of task dispatch, authority validation, hosted D1, or runtime qualification.

## Existing owner-event contract

The design-only contract at `docs/architecture/2026-11-06-integrated-pool-authorization-contract.md` (blob `efb2fa99346d8020361cb41c4fc03786da2e36be`, design commit `75c83a288d865f1bbeda4905cf817e00084bcc2d`) requires:

- immutable numeric GitHub owner ID;
- authenticated owner-originated event/comment associated with the same repository and open non-PR issue;
- exact event/comment ID and binding to repository ID, issue number, target SHA, fixed Worker profile, capability/policy digest, bounded scope, expiry and canonical envelope digest;
- canonical GitHub API re-fetch immediately before consume;
- rejection of edited/deleted/expired/ambiguous/mismatched evidence;
- durable single-use consume and exact read-back;
- no automatic retry/replay after ambiguous consume or invocation.

This contract is DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED.

## Actual production Supervisor path on default branch

Source files inspected at the default HEAD:

- `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.

Findings:

1. The workflow receives GitHub events through the runner environment, but the script does not parse `GITHUB_EVENT_PATH` or consume the event actor/actor numeric ID.
2. The script does not query issue comments/events to identify and re-fetch an owner-originated approval.
3. The task intake path reads only issue body fields `Target SHA` and `Worker profile`; queue eligibility is based on the mutable `pool:ready` label.
4. The workflow still grants `issues: write` and `actions: write`; script mutates labels/comments and contains a REST `workflow_dispatch` call to the Worker.
5. When `POOL_DISPATCH_ENABLED` is not exactly `true`, the script exits into heartbeat-only mode before API work. Do not infer the live variable value from this source code or from the successful scheduled run.
6. No trusted issuer, signature verification, key registry, canonical owner-event verification, or action-scoped reconciliation consume path is present in this production script.

Therefore the live Supervisor cannot presently attest the numeric actor ID or approval event provenance required by the design contract. Do not enable dispatch or build a resolver that trusts caller-provided event fields.

## D1 schema mapping at PR #54 head

Migration and source blobs:

| Artifact | Blob | Relevant fields / finding |
|---|---|---|
| 0001 approval ledger | `a80524ed839b63dd6483978118619495fa550877` | `approval_id`, `owner_numeric_id`, `repository_id`, `issue_number`, `target_sha`, `profile`, `envelope_digest`, `expires_at`, `consumed_at`, `state`. No event/comment ID, capability digest/scope, issuer identity, or evidence URI/digest distinct from envelope. Numeric ID is stored data, not proof of who supplied it. |
| 0002 per-approval claim/outbox | `44b8f7e0658296d287269770c5e91b1c3e25973c` | Approval consumption trigger emits claim/outbox atomically in local SQLite transaction; no authenticated issuer precondition exists in schema. |
| 0003 logical task identity | `49b0798871429d7961e81eb1d86ad892dba0b9b9` | Task key binds repository, issue, target SHA and profile; approvals attach to task; does not authenticate authority. |
| 0004 immutable attempts | `0ad590ffdd2589f857257739275c15ed2d54d729` | Attempt binds task, input digest, idempotency key, lease generation; event actor fields are text and populated from lease owner, not GitHub owner evidence. |
| 0005 reconciliation queue | `7a19897f6197c79517170e101e4cbf1db233cac6` | Stores reconciliation ID, task, attempt, input digest, lease generation, expired lease owner, created_at. It deliberately grants no retry/terminal authority. It lacks new approval ID, owner actor/event ID, action, capability digest/scope, expiry, evidence digest and issuer. |
| 0006 projection outbox | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` | Local-only terminal GitHub projection intent; unrelated to owner approval/reconciliation authority. |

Attempt source `proofs/d1-ledger/src/task-attempts.mjs` at PR #54 head, blob `6cb028e048569700ed623d93462ef55e2392a084`, still permits expired-running takeover when caller passes `resumable: true`. This is a caller-controlled boolean, not a capability. Existing functions return `dispatch: false`, but that does not repair the authorization defect.

## Field mapping decision

| Required authority evidence | Current storage | Decision |
|---|---|---|
| repository ID / issue number | approval ledger and task | Present as identifiers only |
| immutable numeric owner ID | approval ledger | Present as untrusted input; no attestation path |
| exact GitHub event/comment ID | none | Missing |
| canonical owner-event evidence digest / re-fetch result | envelope digest only | Missing / not equivalent |
| target SHA / profile | approval ledger/task | Present |
| capability/policy digest and bounded action scope | none | Missing |
| expiry | approval ledger | Present but not issuer-attested |
| reconciliation ID / attempt ID / input digest / generation / expired lease owner | reconciliation queue | Present |
| new unique approval ID linked to reconciliation/action | none | Missing |
| issuer/key identity, revocation and quota decision | none | Missing |
| atomic action-scoped consume and exact read-back | no reconciliation adapter | Missing |

## Decision and safe next step

- Do not implement or enable a reconciliation resolver against the current schema.
- Do not treat GitHub numeric actor fields as trusted merely because they are available in a workflow event payload; the production code must fetch canonical event/comment data and compare repository owner ID and exact immutable event identity before creating a capability.
- Keep indeterminate attempts in `needs-review`; expiry alone never resumes execution.
- The next safe implementation unit is a negative-first, local-only contract test harness for a pure verifier interface whose input can only be constructed from a canonical GitHub API adapter. Tests must prove that untrusted caller-supplied owner IDs, event IDs, timestamps, digests, actions, missing pagination, edited/deleted comments and API ambiguity all return DENY with `dispatch: false`. Do not add D1 writes until a trusted event adapter exists.
- First separately remediate the production Supervisor/Worker boundary on an isolated branch, following the existing integrated authorization design; do not merge unrelated PRs wholesale.
- No new mature GitHub component can replace the required repository-specific owner identity and task binding. Reuse the existing GitHub REST API and D1 single-use proof components; do not invent a new identity provider.

## Status

- Source audit: VERIFIED (read-only).
- Owner-event-to-Supervisor provenance: NOT IMPLEMENTED / NOT VERIFIED.
- D1 field mapping: VERIFIED as a gap inventory.
- Reconciliation consume adapter: NOT RUN.
- Hosted D1 / dispatch / provider / deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
