# Native `issue_comment` Handler — Threat Model and Admission Contract

Date: 2026-11-10  
Status: DESIGN / STATIC REVIEW ONLY — NO RUNTIME AUTHORIZATION

## Immutable evidence boundary

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default-branch HEAD observed for this pass: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- Candidate verifier PR: [#55](https://github.com/VlDMlNSh/developer-cloud-pool/pull/55)
- PR #55 head: `edff010388897f23f58bceb92e5180a09970fdff` (OPEN / DRAFT / UNMERGED)
- PR #55 exact-head fixture and contract CI: runs `42797001989` and `42797001864`, both SUCCESS.
- PR #55 formal reviews and inline review threads: 0.
- Source artifacts read: verifier blob `80bbb2c93691be3eaf89466d6638a9795dafe6fb`; fixture workflow blob `e191856f0a37dcd21383ebf8cd65c06330f4815d`.

This document is a design artifact. It does not authorize a default-branch workflow, secret, permission, database, issuer, or dispatch change.

## Security objective

A native GitHub Actions `issue_comment.created` event may be treated only as untrusted input until the handler has independently established repository, issue, actor, comment, target, policy, freshness, and one-time-use properties. Approval evidence must be bound to one immutable target and one explicitly authorized action. No comment may itself grant a dispatch capability.

## Trust boundaries

1. **GitHub event envelope** — transport input, not an authorization decision. Validate action and complete event structure; do not infer trust from the fact that GitHub emitted it.
2. **Default-branch workflow and code** — trusted execution source only after normal review/protection. The handler must execute code from the default branch and must never checkout or execute PR-head code in this privileged event context.
3. **Repository/Issue/comment REST responses** — canonical resource observations. Re-read the repository, Issue and comment using a pinned, read-only client; validate exact identifiers, URLs, owner identity, state, author, body and timestamps.
4. **Protected policy** — separate authority from the event. Repository identity, numeric owner/approver ID, allowed Issue IDs/numbers, target SHA, profile, expiry rules and policy version must come from a protected, reviewed source—not from comment text, branch content, workflow inputs or artifacts supplied by the candidate.
5. **Replay/consumption store** — authoritative one-time-use boundary. A syntactically valid nonce is not replay protection. Consumption must be atomic and keyed by a canonical approval identity before any future capability can be issued.
6. **Dispatch/capability boundary** — absent from this proof. Any future dispatcher must be a separate, narrowly scoped component that accepts only a verified, unexpired, consumed-once approval record and rechecks the immutable target and policy.

## Threat register and mandatory controls

| Threat | Failure mode | Required control / fail-closed outcome |
|---|---|---|
| PR comment reaches issue handler | Pull request discussion is mistaken for Issue approval | Require `issue.pull_request` absent; reject all PR-originated comments before policy evaluation |
| Wrong repository, fork, rename or transfer | Event from a similarly named repository is accepted | Pin numeric repository ID, canonical full name and numeric owner ID; compare event and canonical REST response |
| Actor spoofing or mismatch | Sender and comment author are conflated | Require sender ID, comment author ID and protected approver ID to match; require expected account type |
| Comment edit/delete race | Old event body differs from current comment | Fetch canonical comment; require exact ID, issue URL, author, body and timestamps; reject edited/deleted/mismatched data |
| Issue substitution or closure | Approval is applied to another or closed Issue | Pin Issue ID and number; require canonical repository URL, exact Issue URL, open state, and non-PR resource |
| Mutable target reference | Approval follows a branch or tag that moves | Accept only a full immutable commit SHA; compare against protected expected target SHA and execution SHA |
| Replay / duplicate delivery | Same approval is consumed more than once | Persist nonce/approval digest with a unique constraint and atomic consume; duplicate is DENY; no in-memory-only cache |
| Expiry and clock manipulation | Stale approval is accepted or clock rollback extends validity | Define trusted server-side time source, bounded TTL and explicit skew policy; unknown/unavailable time is DENY |
| Policy substitution | Candidate branch or event payload supplies its own approver/allowlist | Load versioned policy from protected default-branch configuration or protected environment; record policy digest/version |
| Workflow privilege escalation | Unreviewed PR code receives write token or secrets | No `pull_request_target`; no PR checkout; no artifact/code from PR head; minimal job permissions; no write token in fixture jobs |
| API outage/partial response/rate limit | Missing data is treated as success | Fail closed on non-2xx, incomplete fields, ambiguous pagination, rate limit, timeout or inconsistent second read |
| URL/redirect/request confusion | Client follows unexpected host/path or performs writes | Pin GitHub API origin; allow only exact GET endpoints; reject redirects or off-origin requests; synthetic-fetch tests assert method and URL |
| Evidence confused with authority | Positive verifier result triggers work directly | Preserve `dispatch:false`; evidence object is not a capability; separate authorization/dispatch contract and independent approval required |
| Secret/log leakage | Token or sensitive event content enters artifacts/logs | Use read-only least-privilege token only when needed; never print token/headers; minimize payload logging; redact identifiers where possible |
| Concurrent deliveries | Two runners both pass read checks before consumption | Atomic compare-and-set/unique insert in durable store; only one winner; transaction and outbox semantics tested under contention |

## Required event-handler sequence

1. Run only from a reviewed default-branch workflow on `issue_comment`; set the narrowest feasible permissions. Do not use `pull_request_target`.
2. Validate `action === created`, repository identity, issue shape and absence of `issue.pull_request`. Reject malformed events immediately.
3. Load protected, versioned policy independently of event-controlled inputs. Verify expected repository/owner, approver, allowed Issue, target SHA, profile, expiry and policy digest.
4. Use a pinned GitHub-maintained Octokit client with an injected/testable transport boundary. Production client must be read-only for this phase.
5. Re-fetch repository, Issue and comment; compare canonical resource identity and all approval-relevant fields. Treat any mismatch, edit, deletion, closed Issue, API error or incomplete response as DENY.
6. Validate exact command grammar and immutable SHA. Parse nonce as an identifier only; do not call it replay protection until durable atomic consumption exists.
7. Compute a canonical approval envelope digest over versioned, normalized fields. Specify canonicalization (e.g. RFC 8785) and test cross-implementation vectors before relying on the digest.
8. Check expiry using a trusted time source and explicit skew bound.
9. Atomically consume the nonce/digest in a durable store with uniqueness and transaction semantics. A failed, duplicate, unavailable or ambiguous consume is DENY.
10. Emit an auditable evidence record. At this stage it must still not dispatch. Any later dispatch requires a separately approved capability contract and independent qualification.

## Test matrix required before native runtime integration

- Event fixtures: created, edited, deleted, malformed JSON, missing fields, PR comment, wrong repository, wrong owner/account type, wrong actor, wrong Issue and wrong target.
- Canonical REST fixtures: mismatched IDs/URLs, renamed/transferred repository, closed Issue, edited/deleted comment, author mismatch, incomplete response, 401/403/404/409/422/429/5xx, timeout and inconsistent second read.
- Transport: real pinned Octokit instance with synthetic Fetch; assert exact GET method and path for every request, no write methods, no redirect/off-origin request, no real network egress.
- Policy: absent, malformed, stale, changed digest, unapproved approver, changed allowlist, changed target and unknown policy version.
- Time/replay: expired, boundary-time, clock unavailable, skew exceeded, duplicate nonce, concurrent duplicate deliveries and atomic-store outage.
- Workflow boundary: prove the event handler runs only reviewed default-branch code; prove PR-controlled code/artifacts cannot influence privileged execution; inspect effective token permissions.
- Output invariant: every denial and every evidence-only success has no dispatch capability. No test may invoke a provider/model or production dispatcher.

## Admission gates (all required; no implied approval)

- [ ] PR #55 receives required independent security review and normal governance approval.
- [ ] Repository rulesets/branch protection and required reviewers are verified from authoritative settings.
- [ ] Pinned Octokit dependency graph and lockfile integrity are generated and verified on a runner with registry access.
- [ ] Synthetic-fetch transport tests pass on exact PR head; no external egress is observed.
- [ ] Protected policy source, ownership, versioning and provenance are approved.
- [ ] Trusted expiry semantics and clock source are specified and tested.
- [ ] Durable nonce/digest atomic-consume semantics and concurrency tests are qualified.
- [ ] Default-branch event workflow is separately reviewed; no PR-head checkout or execution; permissions are least-privilege.
- [ ] Runtime permission smoke test is read-only and proves effective permissions without exposing token values.
- [ ] Independent qualification evidence is published before any dispatch-capable integration.

## Explicit non-goals and prohibitions

- This threat model does not implement the event handler, Octokit transport, protected policy, expiry, nonce storage, D1, outbox, capability issuance, workflow dispatch, provider/model routing, secrets or deployment.
- Do not merge PR #55 solely because fixture CI is green.
- Do not add a privileged event trigger to the default branch before review and governance gates.
- Do not use `pull_request_target`, PR-head checkout, PR artifacts, or PR-controlled scripts in privileged event context.
- Do not interpret a positive read-only verifier result as approval to dispatch.
- Keep Contour B deferred until Contour A is accepted.

## Disposition

- Threat model and admission sequence: DOCUMENTED / STATIC DESIGN.
- Current PR #55 native event integration: NOT IMPLEMENTED.
- Real Octokit transport: NOT RUN.
- Protected policy, trusted expiry, replay persistence and durable consumption: NOT QUALIFIED.
- Independent review/protection evidence: NOT VERIFIED.
- Dispatch: NOT RUN; current proof outputs remain `dispatch:false`.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
