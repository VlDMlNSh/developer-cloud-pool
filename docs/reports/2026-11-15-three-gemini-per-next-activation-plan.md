# 2026-11-15 — Three-Gemini-per-/next activation plan

## Owner-provided account information
- The owner reports that all three Gemini API secrets are already stored in GitHub Actions and belong to three distinct Google accounts registered under different email addresses.
- This is recorded as OWNER-REPORTED, NOT INDEPENDENTLY VERIFIED. Secret values were not read. The GitHub connector explicitly does not expose Actions secret/variable endpoints, so names, scopes, updated timestamps, batch flag value, and account/quota identity cannot be independently attested from this connection.
- Separate email accounts do not by themselves prove separate billing/quota projects, free-tier eligibility, available request limits, or working API credentials. Those remain NOT VERIFIED until a no-secret metadata/probe design demonstrates them.

## Current immutable state
- MediaHub PR #649: OPEN, DRAFT, unmerged; head `309fa6a4af866f57c7de07006b375780b726302d`; base `main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- `main` remains `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- PR #649 formal reviews: 0. Ruleset `26108066` is active, targets default branch, requires five status contexts, zero configured approving reviews, resolved review threads, extra approval for unattributed changes, and has no bypass actors; current connector cannot bypass.
- PR-context CI for latest known PR head: 11 checks, 9 SUCCESS, 2 expected SKIPPED, 0 failed/pending. Trigger-path suite 3/3 and dispatch provenance suite 11/11 PASS; actionlint PASS. This is not live trusted-main execution.

## Code inspection
- The PR branch controller contains `issue_comment`, owner association, exact `/next`, exact `/probe`, `MEDIAHUB_GEMINI_BATCH_ENABLED`, and `dispatch_and_monitor` gates.
- All three child workflows invoke `scripts/validate_gemini_dispatch_pr.py` with role-specific IDs.
- Child workflow blobs: Agent 1 `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`; Agent 2 `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`; Agent 3 `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`; validator `aa19f21da2df4a418da3ff5f19e4f12d531dc4c8`.
- Presence of code paths does not establish workflow event delivery, permissions, secret availability, provider authentication, quotas, or successful child jobs.

## Ordered execution plan
### Gate 0 — identity, inventory, least privilege
1. Obtain metadata-only confirmation of required Actions secret names, variable names, scopes, and updated timestamps; never read values.
2. Confirm `MEDIAHUB_GEMINI_BATCH_ENABLED=true` in repository Variables and that the controller uses it as a hard admission gate.
3. Map each Gemini secret to a distinct Google Cloud/AI Studio project/account identifier without disclosing keys; verify free-tier status, per-project quota/rate limits, model availability, and billing status. Email separation alone is insufficient.
4. Confirm `MEDIAHUB_GITHUB_TOKEN` scope and HMAC contract using metadata and no-secret validation only. Do not print or expose credentials.
5. Verify the three child workflows' `permissions`, environment restrictions, concurrency, timeout, retry policy, and artifact retention. Ensure each provider key is only available to its intended role.

### Gate 1 — source and governance
6. Complete independent review of PR #649 at exact head; require review of validator correctness, workflow token permissions, untrusted event rejection, PR provenance, replay protection, and secret isolation.
7. Resolve all review threads and rerun exact-head required CI after the final push.
8. Reconcile PR #649 with other open PRs and merged main to avoid duplicate or stale workflow definitions.
9. Convert Draft to ready only after review and CI are complete; merge only through active ruleset and only if all policy gates are met. No force push or bypass.

### Gate 2 — trusted-main no-secret probe
10. After merge, verify the new workflow files and SHAs on `main`.
11. Post exact owner-authored `/probe` to Issue #301.
12. Verify the run used trusted `main`, recognized Issue #301, exact command `/probe`, and OWNER association.
13. Verify only the no-secret observer and assertion jobs ran; readiness and dispatch jobs were skipped/not eligible; no child workflow, provider call, or secret access occurred.
14. Save run ID, job IDs, logs summary, artifact digest if any, and exact workflow SHA. If any mismatch, stop before Gemini.

### Gate 3 — controlled 3/3 Gemini launch
15. Confirm all Gates 0–2 pass and batch flag is enabled.
16. Post exactly `/next` as an owner-authored comment to Issue #301; do not call child workflows directly and do not bypass the controller.
17. Record controller run ID, immutable target SHA, dispatch UUID, three child run/job IDs, role-specific branch names, PR numbers, artifact names/digests, and per-agent status.
18. Validate each child result against the target SHA and role contract; confirm each key was used only by its intended agent and that no paid fallback occurred.
19. Verify each PR/branch is unique to its dispatch, base is `main`, head repository is correct, and provenance validator passes.
20. Reconcile missing/duplicate/failed child runs; a partial 1/3 or 2/3 wave is FAILED/INCOMPLETE, never success. Retry only through controller policy with new dispatch identity and idempotency protection.

### Gate 4 — repeatability and automatic chat bridge
21. Repeat controlled 3/3 waves on at least three separate `/next` invocations, each with unique dispatch IDs and immutable target SHAs.
22. Verify each invocation creates exactly one controller run and exactly three role-specific child runs, without cross-run branch/PR reuse.
23. Confirm outputs are persisted and recoverable, quota use is attributable per account, failures are visible, and no secrets leak into logs/artifacts.
24. Only after repeatable 3/3 success enable the chat-to-Issue #301 bridge for each chat `/next`; ensure idempotency so duplicate delivery cannot dispatch duplicate waves.
25. Publish qualification evidence and independent acceptance. Contour A remains BLOCKED until web UI, executor health, routing, state persistence, security/governance, and independent acceptance are all demonstrated.

## Stop conditions
- Missing/ambiguous secret metadata, unknown quota/account identity, disabled batch flag, missing permissions, failed no-secret probe, untrusted workflow ref, absent independent review, stale SHA, duplicate branch/PR, failed child, paid fallback, or any secret exposure.
- No dispatch if any gate fails. Record NOT RUN with exact blocker.

## Current status and next action
- Source implementation: PR-context CI-VERIFIED, not integrated.
- Owner-reported three secrets / separate email accounts: RECORDED; not independently verified.
- Actions metadata and batch flag value: NOT VERIFIED (connector does not expose secrets/variables endpoints).
- Trusted-main `/probe`: NOT RUN.
- Gemini 3/3: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B: DEFERRED.
- Next: independent review/governance for PR #649; supported owner-side metadata confirmation; then ruleset-governed merge, trusted-main `/probe`, and one controlled 3/3 wave.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Addendum — independent Gemini review request (2026-11-15)

- PR #649 remains OPEN/DRAFT/UNMERGED; formal reviews 0; main unchanged. The PR-head controller includes a `review` workflow_dispatch mode, but the mode is not present in the current `main` controller. A workflow_dispatch cannot be treated as trusted-main execution of unmerged PR code.
- The existing main-branch `gemini-fcc-independent-review-wave409.yml` is scoped to fixed historical FCC patch reviews, not PR #649. It was not run.
- Directly dispatching child workflows or using the FCC reviewer for a different target would bypass authorization or misstate review scope. Gemini independent review is therefore NOT RUN, with exact blocker documented.
- Seven PR-associated workflow runs completed successfully, but they are PR-context CI and not an independent Gemini review.
- No merge, provider call, trusted-main probe, or deployment occurred.
