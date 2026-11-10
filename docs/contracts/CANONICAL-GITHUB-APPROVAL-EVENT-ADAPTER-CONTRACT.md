# Canonical GitHub Approval Event Adapter Contract — Contour A

Date: 2026-11-10
Status: DESIGN CONTRACT — NEGATIVE-FIRST; NOT IMPLEMENTED
Parent: Issue #38; `SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md`
Target: future isolated adapter implementation; no production workflow wiring.

## 1. Purpose and trust boundary

Define how an approval candidate is resolved from a GitHub Actions `issue_comment.created` event into a canonical, immutable approval envelope. The adapter is a provenance verifier and envelope builder only. It MUST NOT dispatch work, invoke providers/models, mint execution capabilities, provision infrastructure, or read/write secrets.

The event payload is a locator and correlation input, not sufficient authority by itself. Caller-provided actor IDs, repository IDs, issue numbers, comment IDs, timestamps, body digests, `verified` booleans, and preconstructed "success" receipts are untrusted until independently checked against the GitHub API using a narrowly scoped read-only credential.

The only accepted trigger in the initial profile is a GitHub Actions run whose native event is `issue_comment` with action exactly `created`. Workflow dispatch, pull-request review comments, edited/deleted events, reusable-workflow inputs, artifacts, issue labels, and manually supplied JSON cannot originate an approval.

## 2. Approved mature components

- Use GitHub-maintained [Octokit.js](https://github.com/octokit/octokit.js) for REST requests and pagination/retry behavior. GitHub's REST documentation explicitly recommends Octokit.js for JavaScript API access: https://docs.github.com/en/rest/guides/scripting-with-the-rest-api-and-javascript
- If the adapter is embedded in a workflow script, [actions/github-script](https://github.com/actions/github-script) is an existing GitHub-maintained wrapper that supplies an Octokit client. Pin the action to a reviewed immutable commit SHA; do not rely on a floating major tag.
- These components provide API transport and request handling only. They do not authenticate owner intent, define approval policy, sign envelopes, or replace the verification rules below.
- Do not implement custom HTTP pagination/retry or a custom GitHub REST client unless an evidenced limitation requires it.
- Canonical JSON serialization and SHA-256 implementation must use a maintained implementation with published RFC 8785 test vectors / platform crypto primitives; do not hand-roll canonicalization. Package choice and exact version remain a separate dependency review.

## 3. Immutable event locator

Required native event context:
- `event_name == "issue_comment"`
- `event.action == "created"`
- `event.repository.id` and `event.repository.full_name`
- `event.issue.number` and `event.issue.id`
- `event.comment.id`
- `event.comment.user.id`
- `event.comment.created_at`
- `event.comment.updated_at`
- `event.comment.body`
- `event.sender.id`

The adapter MUST reject missing, malformed, zero, negative, conflicting, or non-integer IDs; unexpected event/action types; repository full-name mismatch; event sender/comment author mismatch; or any event object not originating from the native GitHub Actions event context. Workflow inputs must never override event context.

## 4. Canonical API verification sequence

Using Octokit with only the required read permissions, fetch in this order:

1. `GET /repos/{owner}/{repo}`
   - Verify numeric repository ID and canonical full name match the native event.
   - Verify owner account numeric ID and account type.
   - Verify the repository is not transferred/renamed relative to the event identity.
2. `GET /repos/{owner}/{repo}/issues/{issue_number}`
   - Verify issue numeric ID, number, repository URL/ID association and state.
   - Reject closed issues unless a future policy explicitly defines otherwise.
   - Reject any object with a `pull_request` field; only an Issue is accepted.
3. `GET /repos/{owner}/{repo}/issues/comments/{comment_id}`
   - Verify exact comment numeric ID and issue URL association.
   - Verify comment author numeric ID equals the event sender numeric ID and the configured approver principal.
   - Verify canonical body exactly equals the event snapshot body.
   - Verify `created_at` equals the event snapshot timestamp and `updated_at == created_at`. Any edit, including an edit later reverted to the original text, is rejected.
   - Verify comment is not a bot and author identity is a human account, according to the API's account metadata where available.
   - Verify canonical API response's `html_url`/resource identity points to this repository and issue.
4. Re-fetch the comment and issue immediately before attempting durable consume. The second read must match the first canonical tuple byte-for-byte for all immutable fields used in the envelope. A changed, deleted, inaccessible, or ambiguous resource denies approval.

No search-based discovery or incomplete pagination may be used to locate the approval comment. Direct resource-by-ID reads are required. Any 401/403/404/409/422/429/5xx, timeout, rate-limit response, malformed JSON, missing field, inconsistent response, or retry exhaustion fails closed. A 404 means deleted or inaccessible and is not distinguishable as a valid approval.

### Owner identity policy

- For this personal-owner repository profile, the expected approver numeric ID MUST be an immutable, protected configuration value and MUST equal the repository owner's numeric ID and the comment author's numeric ID.
- Never compare login/display name as the identity key.
- If the repository owner is an organization, this personal-owner profile MUST reject by default. A separate organization approver policy must enumerate approved human numeric IDs and define how membership/role changes are revalidated. Do not infer organization authority from `author_association` or team names.
- No owner ID is accepted from the comment body, issue body, workflow_dispatch input, task payload, artifact, or D1 row as the source of truth.

## 5. Approval command grammar

The first implementation must define one exact, versioned command grammar and reject all other text. Proposed grammar (final literals are policy-controlled):

`POOL-APPROVE v1`
`target_sha=<40 lowercase hex>`
`profile=dsh-headless-probe`
`nonce=<at least 128 bits of CSPRNG-generated lowercase hex>`

Rules:
- No surrounding prose, Markdown fences, extra fields, duplicate fields, unknown fields, whitespace normalization, Unicode confusables, or trailing content.
- The target SHA must equal the immutable commit selected by the approved task envelope; branch names and tags are invalid.
- Profile must be in a strict code allowlist.
- Nonce is unique and single-use; it is not a secret and must not be treated as an authentication credential.
- Approval command grammar and profile must be versioned. Any grammar/policy change invalidates prior approvals.
- The adapter must not infer approval from a `pool:ready` label or an issue body.

## 6. Canonical envelope and digest

After successful verification, construct the envelope exclusively from canonical API values plus protected policy configuration:

- `schema_version`
- `approval_id` = immutable GitHub comment numeric ID, namespaced by repository ID
- `issuer_id` and `issuer_type` = explicit verifier implementation identity/version, not a caller string
- `owner_numeric_id`
- `repository_id` and `repository_full_name`
- `issue_id` and `issue_number`
- `comment_id` and canonical comment API URL
- `comment_author_numeric_id`
- `comment_created_at`
- `comment_body_digest`
- `target_sha`
- `profile`
- `issued_at` and `expires_at`
- `authorization_policy_version`
- `quota_reservation_id` (required when quota policy applies; otherwise explicit null with policy reason)
- `idempotency_key` derived from repository ID + comment ID + envelope schema version

Canonicalization:
- Use RFC 8785 JSON Canonicalization Scheme over a schema-validated object with fixed field types and normalized UTC timestamps.
- Compute SHA-256 over UTF-8 canonical bytes.
- Store canonical bytes or their exact reproducible representation with the digest; do not hash pretty-printed JSON or arbitrary property order.
- Reject unknown fields and duplicate keys before canonicalization.
- Digest equality is integrity binding, not proof of issuer authenticity. Provenance must remain independently recorded.

Time:
- Event timestamps are provenance metadata, not the trusted current time.
- `issued_at` and expiry evaluation use a trusted backend clock obtained at consume time. Clock source, skew allowance, expiry bound and failure behavior must be explicit.
- If trusted time is unavailable or outside allowed skew, deny; never fall back to caller-supplied `now`.

## 7. Durable consume and provenance record

The verifier returns a typed internal result only after all API checks pass. It must not expose a public plain-object `verified: true` receipt accepted by a later caller.

The durable consume operation must be a single trusted call boundary that:
1. receives the verifier's in-process result from the same controlled execution, not an arbitrary workflow input or artifact;
2. persists canonical envelope, source event/comment identifiers, verifier version, policy digest and verification timestamps;
3. conditionally transitions approval to consumed exactly once;
4. creates claim and Outbox event atomically;
5. returns the pre-existing identity only for an exact immutable retry;
6. returns `dispatch: false` in all outcomes during this qualification phase.

The D1 proof schema in PR #39 does not yet store all required provenance fields. It must not be extended by simply trusting caller-supplied IDs. The API verifier and durable consume integration need negative-first tests before any production binding.

Cross-system limitation: GitHub API reads and D1 writes are not one distributed transaction. The adapter must re-fetch immediately before consume, preserve the original native event snapshot, reject any mismatch, and document the residual edit/delete race between the final API read and D1 commit. If the project requires stronger semantics than this bounded snapshot model, use a separately authenticated signed webhook/attestation issuer and qualify its key lifecycle; do not claim GitHub REST reads alone eliminate the cross-system race.

## 8. Negative-first test matrix

Every case below must return a typed DENY, persist no approval/claim/outbox, and keep `dispatch: false`:

- workflow_dispatch or any event other than `issue_comment.created`;
- edited/deleted event action;
- missing/forged sender ID, comment ID, repository ID or issue number;
- sender differs from comment author;
- author differs from protected approver ID;
- repository owner differs from protected approver ID;
- organization-owned repository under personal-owner policy;
- wrong repository ID/full name, transferred repository, wrong issue ID/number;
- pull request rather than Issue;
- closed issue;
- comment ID resolves to a different issue/repository;
- deleted/inaccessible comment (404), API permission error (403), rate limit, timeout, server error;
- event snapshot differs from canonical API body/timestamps/author;
- comment has been edited (updated_at differs), including edit-then-revert;
- second read differs from first read;
- incomplete/malformed API response or inconsistent resource URLs;
- pagination/truncation indicator or search result used instead of direct ID lookup;
- bot author or unapproved account type;
- malformed grammar, extra fields, duplicate fields, unknown profile, branch/tag target, SHA mismatch, invalid nonce;
- expired approval, trusted clock unavailable, clock skew exceeded;
- revoked/unknown policy version;
- forged caller-supplied `verified:true`, fabricated receipt, caller-supplied owner/event IDs, timestamp, digest or consume result;
- duplicate event delivery and exact retry;
- same comment ID with altered envelope fields;
- D1 unavailable, ambiguous write, duplicate consume, claim/outbox trigger failure.

Positive tests must not be enabled using synthetic `verified:true` objects. They may be added only after the real API adapter and real durable consume adapter are composed in an integration fixture that exercises canonical API response fixtures and the actual local D1 runtime. Production qualification still requires a real approved backend.

## 9. Permissions and execution constraints

- Read-only API permissions only: minimum repository metadata and Issues read access required by the selected endpoint set.
- No `issues: write`, `contents: write`, `actions: write`, workflow dispatch, provider secrets, OAuth tokens, model credentials, or deployment permissions.
- Do not print tokens, authorization headers, environment values, raw secrets, or full sensitive event payloads in logs/artifacts. Log only bounded IDs, reason codes and digests after privacy review.
- No paid fallback and no additional paid services.
- No secret value inspection is authorized by this contract.
- No dispatch, Worker execution, DSH, Resource Probe, provider/model call, D1 provisioning, deployment, merge or Contour B work is authorized.

## 10. Acceptance checklist for this contract

- [ ] Protected expected approver identity and personal-owner policy are explicit.
- [ ] Native event source is fixed to `issue_comment.created`; no caller override.
- [ ] Repository, Issue and comment are re-fetched by canonical API resource identity.
- [ ] Author, body, created/updated timestamps and resource associations match.
- [ ] Edit/delete/ambiguous/API-error/pagination cases fail closed.
- [ ] Grammar, canonical serialization, digest and policy version are pinned and tested.
- [ ] Trusted clock and expiry semantics are explicit.
- [ ] Durable store records provenance and atomically consumes + creates Outbox.
- [ ] No public caller-controlled receipt can authorize positive decision.
- [ ] Negative-first tests pass against composed adapters.
- [ ] Exact-head CI, permissions, provenance and artifacts are verified.
- [ ] Dispatch remains disabled until all lifecycle and backend qualification gates pass.

## 11. Current disposition

- This document specifies a proposed adapter contract; it does not implement or qualify an issuer.
- Official Octokit.js / actions/github-script are approved as API transport candidates, not authority providers.
- PR #39 remains local-only D1 evidence.
- Canonical owner-event verifier: NOT IMPLEMENTED.
- Durable issuer-to-D1 integration: NOT IMPLEMENTED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

References:
- GitHub REST API, scripting with JavaScript: https://docs.github.com/en/rest/guides/scripting-with-the-rest-api-and-javascript
- Octokit.js: https://github.com/octokit/octokit.js
- actions/github-script: https://github.com/actions/github-script
- Shared lifecycle contract: ./SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38


## 12. Verified GitHub REST payload and permission matrix (2026-11-10)

This section records an official-documentation cross-check and the live repository identity snapshot. It narrows the required permission set and corrects implementation assumptions before code is written.

### Native event and issue-vs-PR discriminator

- GitHub documents `issue_comment` as an event that fires for comments on both Issues and pull requests; therefore event name/action alone does not distinguish them.
- The native event contains `action`, `comment`, `issue`, `repository`, and `sender`. The issue object has a `pull_request` marker when it represents a pull request. Presence of that property is a hard DENY; absence is required for the Issue-only profile.
- GitHub documents the event action `created` explicitly. The workflow must be declared with `on: issue_comment: types: [created]`, and runtime must also require `github.event_name == "issue_comment"` and payload `action == "created"`.
- The implementation must parse the runner-provided `GITHUB_EVENT_PATH` and compare it with the immutable GitHub Actions context; it must not accept a caller-provided JSON payload, workflow_dispatch input, artifact, or environment variable as an alternative event source. This is an application-level source constraint, not an assertion that the event JSON itself carries a separately verifiable webhook HMAC.
- For the comment snapshot compare `id`, `body`, `user.id`, `created_at`, and `updated_at`. The REST comment response documents all these fields. Require `updated_at === created_at` for the no-edit profile. The API response also includes `issue_url`, `url`, `html_url`, and `user.type`; bind and validate these rather than relying on `author_association` as identity.
- The issue response must be checked for `id`, `number`, `url`, `repository_url`, `state`, and absence of `pull_request`.
- The repository response must be checked for `id`, `full_name`, `owner.id`, and `owner.type`. Compare numeric IDs first; reject unexpected canonical full-name/owner changes rather than following a rename or transfer as if it were the same approval namespace.

### Minimum fine-grained token / GitHub App permission

| API operation | Documented permission | Decision |
|---|---|---|
| `GET /repos/{owner}/{repo}` | Metadata: read | Required |
| `GET /repos/{owner}/{repo}/issues/{issue_number}` | Issues: read | Required |
| `GET /repos/{owner}/{repo}/issues/comments/{comment_id}` | Issues: read **or** Pull requests: read | Issues: read satisfies the Issue-only profile |
| Subscribe GitHub App to `issue_comment` | Issues: read | Required if GitHub App is the event installation |

Thus the minimum fine-grained repository permissions for this Issue-only verifier are **Metadata: read + Issues: read**. Do not add Pull requests: read merely because the shared endpoint supports PR comments; the verifier explicitly rejects pull requests. Do not grant Issues: write, Pull requests: write, Contents: write, Actions: write, Administration, or Workflows permissions.

For public resources GitHub may permit unauthenticated reads, but production implementation should use a clearly scoped, auditable identity and must not infer token capability from successful anonymous public requests. The exact Actions `GITHUB_TOKEN` permissions or GitHub App installation permissions must be verified in the selected runtime before integration.

### Live identity snapshot (read-only public metadata)

At this audit:
- Repository ID: `1445644538`.
- Canonical repository: `VlDMlNSh/developer-cloud-pool`.
- Owner numeric ID: `157891068`, owner type `User`.
- Default branch: `Основной`.
- Issue #38 ID: `6249619988`; Issue state `open`; response contains no `pull_request` property and its `repository_url` matches the canonical repository API URL.

These observed IDs are evidence for the current repository snapshot, not yet a protected configuration value. Before implementation, the expected approver ID must be separately pinned in protected configuration and verified to equal the repository owner ID. The adapter must fail closed if the configuration is missing or disagrees; do not silently populate it from event or issue payload fields.

### Official references

- Webhook event payloads and `issue_comment` action/object: https://docs.github.com/en/webhooks/webhook-events-and-payloads
- Get an issue comment, response schema and fine-grained permission: https://docs.github.com/en/rest/issues/comments#get-an-issue-comment
- Get a repository and Metadata read permission: https://docs.github.com/en/rest/repos/repos#get-a-repository
- Fine-grained permission index: https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens

### Disposition

The event and REST field contract is now documentation-checked. This is not a running API adapter, not a credential test, and not proof that the current Actions token has the required permission. No token values were inspected. No source code, workflow, permissions, secrets, variables, D1 resources, dispatch gates, or deployments were changed.
