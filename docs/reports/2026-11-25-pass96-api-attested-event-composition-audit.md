# Pass 96 — API-attested event composition and workflow identity audit

Date: 2026-11-25  
Scope: one bounded architecture/provenance audit of the D1 source-comment admission boundary. No production or dispatch changes.

## Frozen inputs

- Canonical default branch: `Основной` at `565404f84b6b86afb4dc2d8fa939341f42df6eca` (live ref read-back).
- D1 candidate PR #175: OPEN / DRAFT / UNMERGED; head `3d69bc943677dba909792bf4930d4c0aa5d2233f`; base SHA above.
- API provenance proof PR #174: OPEN / DRAFT / UNMERGED; head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`; base SHA above.
- Working documentation branch: `docs/engineering-excellence-2026-11-23`; Context Window blob before this pass: `30391c52070f868ca2e277336731c954a4506de6`.

## Findings

1. **Trust-boundary composition is absent (blocking).** PR #175 `bindGitHubNextEvent(context)` validates a flat Actions-context object and computes a digest, but it does not perform GitHub API read-back. Its source comment receipt therefore does not prove that the source comment, issue, repository, workflow run, workflow metadata and current default-branch ref were independently read from GitHub.
2. **PR #174 is a separate audit-only workflow.** Its `owner-next-event-audit.yml` script performs read-only API checks and returns `OBSERVED_ONLY`, explicitly creating no D1 admission, receipt, outbox or execution authority. There is no attested envelope handoff into PR #175.
3. **Workflow identity mismatch is confirmed.** PR #174 verifies `.github/workflows/owner-next-event-audit.yml`; PR #175 source and migration 0017 bind `VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной`. These identities cannot be treated as interchangeable.
4. **The D1 receipt is append-only but only as strong as its caller.** Migration 0017 binds the source tuple to an existing admission and commit receipt. SQL constraints do not independently authenticate the caller's GitHub event or API observations.
5. **CI evidence is partial.** PR #175 exact-head-associated Actions runs were observed: D1 `45690428935` SUCCESS and Pool Contract `45690428805` SUCCESS. The combined status endpoint returned zero contexts for head `3d69bc9...` and merge-result `16066457db9c86cc085e4afce743eb7e77408ca7`; therefore standalone required-status completeness remains NOT VERIFIED. PR #175 formal reviews: 0; review threads: 0. PR #174 formal reviews: 0; review threads: 0.
6. **Governance re-read.** Active repository ruleset `26550182` targets `refs/heads/Основной`, requires PRs, disallows deletion/non-fast-forward and requires review-thread resolution; required approving review count is 0 and bypass actors are empty. This is not an independent security review. Dispatch-variable metadata was not available through the permitted read path in this pass; current value NOT VERIFIED.

## Architecture decision

- Preserve `next-event-controller.yml` as the **single canonical controller identity**, because D1 source and migration 0017 already bind that exact immutable workflow identity. PR #174's `owner-next-event-audit.yml` remains a standalone audit-only proof, not an admission authority.
- Before any admission integration, move the API verifier into the canonical controller execution path (or port its pure verifier into that same path) so the exact same trusted run performs API read-back and D1 admission. Do not pass an unsigned JSON/artifact/workflow-dispatch payload between separate workflows and call it attestation.
- The controller must obtain repository, issue, source comment, workflow run, workflow metadata and default-branch ref through fixed-origin read-only GitHub API calls; validate numeric owner/repository identity, issue-not-PR, exact comment body/action, sender/comment-author identity, OWNER association, run ID/attempt, workflow ID/path/event, default branch and SHA consistency.
- Construct a canonical immutable envelope from the API-readback values, including source comment ID, repository/owner IDs, issue, event/action, sender and author association, body digest, target SHA, default ref, workflow ID/path/ref/code SHA, run ID/attempt and CODE profile. Compute its digest in the same process and bind the complete tuple to the D1 approval/admission/source receipt.
- Re-read the default-branch ref immediately before admission; deny if it moved. Persist the immutable target SHA in the admission so later branch movement cannot rewrite the task target.
- Keep reruns denied until durable same-comment admission identity and reconciliation semantics are proven. Exact replay must return the original durable outcome; conflicting tuples must deny.
- Preserve `dispatch=false` and `executionAuthorized=false` in all paths. No controller dispatch is authorized by this pass.

## Reuse First

Reuse the existing Node built-in `fetch` / GitHub REST verifier from PR #174 and the existing Cloudflare Workers Vitest/Miniflare D1 harness from PR #175. No new dependency is justified.

## Verification and safety

- Read back PR #174 and #175 metadata, changed-file lists, D1 binder/context adapter, migration 0017, PR #174 workflow and API verifier.
- Exact-head-associated Actions runs for PR #175: 2 observed, both SUCCESS. Combined status contexts: 0 / NOT VERIFIED.
- Ruleset detail read: active, no bypass actors, 0 required approvals, PR required, thread resolution required.
- Formal reviews / inline threads: PR #174 = 0 / 0; PR #175 = 0 / 0.
- No code, schema, workflow, dependency or secret changes. No local tests, live webhook, hosted D1, provider calls, dispatch, deployment, merge or production writes.
- Gemini: NOT RUN. Claude Code/ECC/FCC: NOT RUN. Independent security review: NOT RUN.
- Active time: NOT MEASURED. Progress/time estimate: not recalculated without measured task history.

## Status

- API-attested D1 composition: BLOCKED.
- PR #175 D1 synthetic proof: CI observed SUCCESS; independent qualification NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: implement one same-workflow API-readback → canonical envelope → D1 receipt composition slice on a clean frozen base, then test stale-ref races, rerun/replay, workflow identity and every envelope-field substitution before any dispatch integration.
