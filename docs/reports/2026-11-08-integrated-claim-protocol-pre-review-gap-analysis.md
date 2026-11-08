# Integrated claim protocol pre-review gap analysis — 2026-11-08

## Scope and independence
Documentation-only author-side pre-review of `docs/architecture/2026-11-08-integrated-claim-lease-outbox-threat-model.md` at blob `31c951b76e18741410a1349281a578438d53f25a`. This is NOT an independent security review, penetration test, implementation qualification or approval. No production source, workflow, permissions, secrets, variables, resources, deployment or dispatch changed.

## Refreshed evidence
- Default branch remains `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae` in latest commit-search result.
- PR #36 head `e11fc90e50bd20b166207af64551c49cfa80ffb4`: exact-head named CI runs `42329438308` and `42329438351`, both completed SUCCESS.
- PR #37 head `5587a4e013507b5be330fd0c49ce1fc836faa946`: exact-head named CI runs `42284051311` and `42284051309`, both completed SUCCESS.
- PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`: exact-head D1 run `42329993548`, completed SUCCESS. Earlier combined-tree proof at merge-tree `77b3ce30a3c90ad564db892cae82076b5c0774c9` is documented separately.
- Formal review submissions: PR #36 = 0, #37 = 0, #39 = 0.
- The connector cannot resolve PR #38 as a PullRequest because #38 is an Issue, not a PR; Issue #38 remains OPEN. No PR review state is inferred for it.
- No evidence in this pass establishes a live deploy, remote D1, worker execution, provider call or dispatch.

## Author-side pre-review findings (all BLOCKING before implementation)
1. **Issuer trust and approval semantics:** threat model correctly refuses to select a signature algorithm/canonicalization prematurely. A reviewer must require a signed approval assertion from a distinct trusted issuer, exact issuer/audience/subject/key ID, key lifecycle and revocation semantics, canonical byte encoding, domain separation, nonce uniqueness, replay handling and documented human/policy approval provenance. GitHub OIDC proves workload identity under validated claims; it does not by itself prove human approval intent.
2. **Principal and repository binding:** specify exact OIDC claims and workflow provenance validation; derive numeric owner/repository IDs from trusted GitHub context; reject fork, transfer, renamed repo, reusable workflow confusion, untrusted caller refs, mutable refs and unexpected actor. Test claim substitution and same-name/different-ID cases.
3. **D1 transaction semantics:** local Miniflare proof is insufficient. Verify current D1 batch/transaction atomicity, uniqueness behavior, trigger-inclusive change counts, isolation under concurrent requests, and ambiguous commit/read-after-write outcomes against disposable remote D1. A 50+ contender test is a qualification criterion, not yet executed remotely.
4. **Lease/fencing state machine:** no implementation exists. Before coding, define legal states and transition table, lease owner identity, generation increment semantics, bounded lease duration/heartbeat/retries, clock uncertainty, takeover rules, and every mutation's conditional predicate. Ensure stale worker cannot alter state after lease loss.
5. **Outbox/worker delivery:** define signed invocation token audience, lifetime, replay boundary, event ID idempotency scope, delivery receipt semantics, dispatcher concurrency and dead-letter replay authority. Do not claim exactly-once external effects. Ambiguous non-idempotent effects must enter needs_review.
6. **Privilege composition:** inspect effective GitHub permissions for each workflow/job and Cloudflare binding scope. Separate issuer, verifier/ledger, dispatcher, worker and finalizer. No broad contents write to Supervisor. Validate reusable workflow caller identity, immutable workflow SHA and untrusted PR/fork rejection.
7. **Audit and privacy:** specify append-only event schema, writer authority, retention, redaction, tamper evidence, correlation IDs and reconstruction procedure. Audit failure must fail closed without leaking credentials.
8. **Quota/outage:** define transaction/request ceilings, retry budgets and behavior at D1 free-tier limit. No paid fallback, cross-account key mixing or dispatch on uncertain budget/clock/storage state.
9. **Operational kill/recovery:** prove independent server-side kill switches, issuer revocation, dispatcher stop and Worker token rejection; demonstrate no claim/outbox/audit deletion during emergency stop.
10. **Governance:** current evidence shows zero formal reviews on PR #36/#37/#39. The previously observed active ruleset had zero required approvals; it must be re-read before any future merge. Author-side checklist cannot satisfy independent review.

## Recommended independent reviewer deliverables
- Signed/attributed review tied to immutable threat-model blob SHA and source PR heads.
- Findings ranked Critical/High/Medium/Low with file/line references, exploit preconditions, impact and remediation.
- Explicit approve/reject decision for authority boundaries, signed envelope, D1 transaction, lease/fencing, outbox/recovery and least-privilege permissions.
- Test plan with expected invariants and evidence artifacts; no dispatch or provider calls.
- Reviewer identity must be distinct from author/implementer and have authority to review the security boundary.

## Decision
- Author-side pre-review: COMPLETED (documentation analysis only).
- Independent review: NOT RUN.
- Protocol implementation: NOT AUTHORIZED / NOT RUN.
- Remote D1 qualification: NOT RUN.
- Dispatch: NOT RUN; gates must remain fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step
Obtain a genuinely independent security/architecture review against the immutable threat-model blob and PR source heads. If no independent reviewer is available, continue only with read-only evidence collection and documentation; do not label internal analysis as independent review.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
