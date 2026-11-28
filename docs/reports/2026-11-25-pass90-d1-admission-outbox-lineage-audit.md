# Pass 90 — D1 admission/outbox lineage and current-base integration audit

Date: 2026-11-25

## Scope and frozen target

Bounded source-level audit of the D1 proof candidate in PR #170, its relationship to the owner /next API audit in PR #174, current default ancestry, and exact-head CI. No runtime or schema changes in this pass.

- Current target: 565404f84b6b86afb4dc2d8fa939341f42df6eca.
- PR #170 head: 40281787c208af2df916f10af1dba073061ff0d3; base 8c38bb073146d1c71da3e90cbbb11b55eb34a1e9.
- PR #174 head: a8809c1dc8c2eaa49944fb031baeec54ce46b922; base is current target.
- PR #170 compare against current target: 41 ahead / 2 behind; merge base remains old 8c38bb; compare status diverged.
- The default branch does not contain proofs/d1-ledger at target SHA; default-branch fetch of D1 proof paths returned 404. PR #170 is a standalone local proof candidate, not code already integrated into default.

## Revalidated PR/issue state

- PR #170 OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0.
- PR #174 OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0.
- PR #169 docs branch OPEN / DRAFT / UNMERGED and diverges from current target (224 ahead / 2 behind; old merge base 8c38bb). Context Window and this report are maintained on that docs branch, not on default.
- PR #171 remains OPEN / DRAFT / UNMERGED on the old base.
- Issue #140 remains the canonical D1 integration objective and explicitly excludes live dispatch, hosted D1, secrets, providers, deployment, merge and production mutation.
- Issue #96 remains the owner /next control contract. Its dispatch requirements are not satisfied by an isolated D1 proof.
- Issue #94's 2026-11-17 owner scope correction makes Gemini optional; the first executor profile is Claude Code + ECC + FCC with a verified free route. Gemini is not a Contour A launch blocker.

## D1 candidate strengths — source review

Inspected PR #170 at exact head, including migration 0017, context mapper, event binder, admission adapter, lease adapter, and integration tests.

- Existing canonical task ledger is used; retired pool_task_claims and pool_task_outbox write paths are sealed by migration 0016. The task-ready outbox is pool_task_delivery_outbox.
- Migration 0017 adds a unique, append-only source-comment receipt and SQL trigger binding it to the consumed approval, admission, task, prepared attempt, current route qualification, pending task-ready outbox and commit receipt.
- Source-comment idempotency key is GitHub comment ID scoped to repository ID.
- Receipt readback uses first-primary session; a lost acknowledgement is reconciled by primary readback; mismatched or incomplete readback fails closed.
- D1 admission is a separate canonical adapter and has existing local atomic-batch / primary-readback tests.
- Lease adapter authenticates an executor principal before acquisition and derives timestamps from injected trustedClock; SQL migrations 0014–0015 enforce lease/fencing and issuer-bound reconciliation constraints.
- Integration suite has 12 tests specifically for GitHub source receipt behavior; full D1 suite has 8 files and 123 tests.
- All inspected adapters preserve dispatch:false and executionAuthorized:false.

## Finding F90-01 — no single trusted provenance-to-D1 control path

PR #170's mapGitHubActionsContext explicitly documents itself as a pure mapper; it does not authenticate the runner or API metadata. bindGitHubNextEvent validates fields in the passed context but does not independently prove those values came from the GitHub API or trusted runner.

PR #174 adds a separate API-backed owner-event audit, but its output is OBSERVED_ONLY, with admission NOT_CREATED and dispatch NOT_AUTHORIZED. It does not feed a validated event envelope into the D1 adapter. The PR #174 workflow is also not on default until merged.

Therefore the two PRs cannot be treated as a completed combined controller. The missing composition must be built on one clean current-base branch: trusted default-branch workflow → API read-back of repository/issue/comment/run/workflow/default-ref → validated immutable event envelope → D1 admission + source receipt → primary readback. API evidence must be tied to the exact event/run/comment identities consumed by D1; arbitrary JSON and the pure mapper alone are insufficient.

## Finding F90-02 — D1 proof is not current-base integrated or live-qualified

PR #170 has 41 commits ahead and 2 behind current target, with old merge base 8c38bb. Its paths are absent from current default. Its green CI is valuable source-candidate evidence, not current-base integration proof and not live hosted-D1 behavior.

### Exact PR #170 head CI evidence

- D1 run https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45556287534, job 139009015200: SUCCESS. Log: 8/8 test files, 123/123 tests passed; Node 24.9.0, pinned lockfile install; inert Worker check passed.
- Pool Contract run https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45556287686, job 139009016019: SUCCESS. Log: seven workflow YAML files parsed; POOL_CONTRACT_VALIDATION=PASS; dispatch gate remained disabled.
- These runs are on PR #170 head 402817..., not a synthetic merge with current target 565404...; they do not close the 2-commit divergence.

## Architecture decision for next implementation pass

Do not merge PR #170 or stack it onto PR #174. Create one new branch from the frozen current default SHA only after resolving any intervening default movement. Port/adapt the minimum canonical D1 package (migrations 0001–0017, adapters and tests) as a single coherent proof, then integrate API-backed event verification into the same workflow/controller boundary. Do not copy retired claim/outbox paths or create a second ledger.

Before coding, freeze exact current base and create a file/migration/authority overlap matrix. Reuse the existing Cloudflare Workers Vitest/Miniflare D1 test harness and pinned dependencies; no new dependency is needed. Preserve CODE profile only, local synthetic D1 only, trusted clock/authenticator injection, primary-first readback, and all dispatch/execution flags false.

Required tests on the clean current-base branch:
- API-attested comment identity and exact event/run/workflow/default-ref tuple is the exact tuple passed to D1.
- API mismatch / missing fields / stale default ref / changed branch / non-owner / PR comment / wrong issue / edited event fail closed before D1 writes.
- Same comment + same run attempt exact replay returns the same admission/receipt.
- Same comment + different run/attempt cannot create another admission or overwrite receipt.
- Concurrent duplicate deliveries create one approval consumption, one task, one attempt, one task-ready outbox and one immutable receipt.
- Crash after admission but before source receipt can recover using the same source-comment identity and original admission identity.
- Lost D1 acknowledgement and unavailable/partial primary readback remain NOT VERIFIED and do not mint a new admission identity.
- Expired lease, stale fencing generation, trusted-clock rollback and indeterminate attempt remain fail-closed.
- Exact final-head D1 and Pool Contract CI both pass.

## Explicit limits / not established

- No live issue_comment workflow execution on default.
- No trusted runner/API-to-D1 composed controller.
- No hosted D1 provisioning or writes; local Miniflare proof only.
- No production lock semantics, live executor, Claude Code/ECC/FCC qualification, provider route/quota, web UI, persistence/restore, mobile/desktop E2E or independent acceptance.
- Current ruleset and current POOL_DISPATCH_ENABLED value were NOT VERIFIED in this pass. Historical Issue #1 body is not a current read-back.
- No secret values read, provider calls, Gemini dispatch, Claude execution, deployment, merge, production write or governance mutation.
- Gemini Agents 1–3: NOT RUN. Claude Code + ECC + FCC: NOT RUN. Independent review: NOT RUN.
- Active engineering time: NOT MEASURED.

## Disposition

PR #170 D1 candidate: CI-VERIFIED ON ITS OWN HEAD, but NOT VERIFIED against current-base merge result or live runtime.
PR #174 API audit: CI-VERIFIED ON ITS OWN CURRENT-BASE HEAD, but not composed with D1.
Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.

Next: start one clean current-base integration branch for the API-attested event → D1 admission/receipt composition, with dispatch permanently false in this proof.

Canonical MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
