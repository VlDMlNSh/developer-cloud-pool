# Pass 105 — API-attested envelope contract (design freeze)

Date: 2026-11-26  
Status: **CONTRACT DRAFT / NOT IMPLEMENTED / NOT QUALIFIED**

## Frozen base and scope

- Clean base: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Working branch: `integration/pass105-api-attested-envelope-contract-2026-11-26`.
- Scope: define the interface between the read-only Controller API verifier and the D1 admission/receipt adapter. No runtime code, migrations, workflow permissions, dispatch or execution authority changed.
- Reuse: PR #176 API read-back verifier and workflow-file blob lookup; PR #175 D1 append-only receipt, admission-chain checks, primary read-back and replay handling. No new package/dependency.

## Why the current contracts cannot be joined by copying fields

The controller verifier returns `source`, `targetSha`, `workflow` (including workflow-file Git blob SHA and ref SHA), and `run`, but only emits a step summary. The D1 binder independently maps flat GitHub Actions context and calculates its own digest. It does not accept the controller's API-readback result.

The current D1 migration 0017 persists `workflow_sha`, `target_sha`, run ID/attempt and an `event_digest`, but has no dedicated columns for:
- API workflow-file Git blob SHA;
- immutable Issue node ID and Comment node ID;
- the API-observed workflow-run head SHA as a distinct provenance field;
- envelope schema/version and canonicalization domain.

Do not overload `workflow_sha`: GitHub Actions `github.workflow_sha` (workflow source commit) and Contents API `sha` (Git blob object) are different identifiers. Preserve both.

## Proposed v1 envelope

The controller creates this object only after every API read-back passes. The object is data, not a capability; receiving it grants no authority.

```json
{
  "schema": "cloud-pool.owner-next.api-attestation",
  "version": 1,
  "event": {
    "name": "issue_comment",
    "action": "created",
    "body": "/next",
    "bodySha256": "<sha256 of exact UTF-8 body>",
    "repositoryId": "1445644538",
    "repository": "VlDMlNSh/developer-cloud-pool",
    "ownerId": "157891068",
    "issueNumber": 96,
    "issueNodeId": "<API Issue node_id>",
    "commentId": "<decimal API comment id>",
    "commentNodeId": "<API Comment node_id>",
    "actorId": "157891068",
    "actorLogin": "VlDMlNSh",
    "authorAssociation": "OWNER"
  },
  "ref": {
    "name": "refs/heads/Основной",
    "defaultBranch": "Основной",
    "observedDefaultHeadSha": "<40 lowercase hex>"
  },
  "run": {
    "id": "<positive decimal>",
    "attempt": 1,
    "event": "issue_comment",
    "headBranch": "Основной",
    "headSha": "<40 lowercase hex>",
    "workflowId": "<positive decimal>",
    "workflowPath": ".github/workflows/next-event-controller.yml",
    "workflowState": "active",
    "workflowCommitSha": "<40 lowercase hex from Actions context>",
    "workflowFileBlobSha": "<40 lowercase hex from Contents API>",
    "workflowFileRefSha": "<40 lowercase hex; must equal run.headSha>"
  },
  "policy": {
    "profile": "jarvis-code-sandbox-v1",
    "dispatch": false,
    "executionAuthorized": false
  }
}
```

### Canonical digest

- Canonicalization is a fixed ordered array, not generic object-key serialization. This avoids key-order, whitespace and omitted/null ambiguity.
- Encoding: UTF-8 JSON bytes of the fixed array; SHA-256; lowercase 64-character hex.
- Domain separator is the first array element: `cloud-pool.owner-next.api-attestation/v1`.
- Include every immutable identity and provenance field above, including issue/comment node IDs, observed default head, run ID+attempt, workflow commit SHA and workflow blob SHA. Include explicit booleans for dispatch/execution authorization.
- Reject unknown schema/version, missing fields, wrong primitive types, extra fields, non-canonical decimal IDs, malformed SHA, body other than exact `/next`, run attempt other than 1 until durable rerun reconciliation exists, mismatched run head/ref SHA, stale observed default head, workflow path/state mismatch and any identity mismatch.
- D1 must independently validate every field and recompute this digest. It must not trust a digest supplied by the controller or a caller.

## Required D1 migration 0018

Add immutable columns to `pool_source_comment_receipts` (exact names subject to implementation review):
- `attestation_schema` and `attestation_version`;
- `issue_node_id` and `comment_node_id`;
- `observed_default_head_sha` and `run_head_sha`;
- `workflow_commit_sha` and `workflow_file_blob_sha`;
- optionally `workflow_id` and `workflow_state` if not otherwise persisted in the receipt.

Preserve existing `workflow_sha` compatibility only with a documented mapping to `workflowCommitSha`; never silently reinterpret it as the Git blob SHA. Add SQL checks for fixed repository/owner/issue/action/profile, valid SHA lengths, run attempt policy and dispatch=0. Extend append-only triggers and full-binding trigger so receipt fields are tied to the admission and envelope digest. Keep the source comment ID as unique idempotency key.

The admission approval envelope digest must be the recomputed v1 attestation digest (or a separately domain-separated digest whose relationship is explicitly verified); do not let a caller choose a different digest. Update receipt read-back and exact replay matching to include every new field.

## Workflow boundary

- API verifier constructs the envelope after successful read-back.
- Any file/output/GITHUB_OUTPUT crossing a step boundary is untrusted input. D1 adapter reparses strict schema, rejects unknown/duplicate properties, recomputes digest, and verifies the immutable fields against the trusted runner context supplied at the D1 callsite.
- The D1 callsite must be in the same controller workflow execution and bind the same repository/run/attempt/head/workflow identity. No workflow_dispatch or user-provided JSON path.
- Hosted D1 binding is not yet proven or authorized. The local Workers/Vitest harness must first exercise the exact production adapter call graph using a fake API transport and local D1 runtime.
- Keep workflow permissions least-privilege; no additional secret values or credentials are to be exposed. No executor/provider calls.

## End-to-end and adversarial DoD

One integration test must call the API verifier, serialize the envelope, cross the same parsing boundary used by the workflow, call the D1-side validator/binder, perform local D1 admission and write/read-back the durable source-comment receipt. Assertions:
1. successful receipt stores the full v1 provenance and digest;
2. field substitution and unknown/extra field rejection;
3. canonicalization stability and changed-byte/digest rejection;
4. stale default-ref / mismatched run-head / workflow blob ref rejection;
5. duplicate source comment and conflicting run/attempt replay rejection;
6. pre-commit failure, commit-then-lost-ack and primary read-back outage fail closed/reconcile exactly once;
7. `dispatch=false` and `executionAuthorized=false` at every return.

CI must run on the candidate and PR merge result. Security review, governance/provenance checks and exact-head CI are separate gates. No merge until all gates pass.

## Current decision

This pass freezes the proposed interface only. No code or tests were run. The proposal is not yet accepted by implementation/security review. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Evidence links

- Controller PR #176: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- D1 proof PR #175: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- Canonical default base: https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной
- MediaHub map (deferred project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
