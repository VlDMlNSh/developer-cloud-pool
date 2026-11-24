# Pass 63 — GitHub workflow provenance trust-contract audit

Date: 2026-11-24  
Status: **VERIFIED — source, GitHub API and governance audit; implementation BLOCKED on missing workflow and independent trust anchor**  
Contour A: **NOT ACCEPTED**  
Contour B: **DEFERRED**

## 1. Frozen target and scope

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Frozen default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #170 candidate head: `7d900d9fe11b19f048548a3bed657b2549f8091f`.
- Exact synthetic merge: `8b1c674c6fd2bdfaae55868fe75c13c6919fd047`, parents verified as frozen default + PR head.
- PR #170 remains OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0.
- PR #169 documentation branch head before this pass: `029f942960a3626d5b17d85f9655fc94beb8e2eb`; PR remains OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0.
- Scope: verify current tree presence, inspect candidate binder/workflow, reconcile GitHub's documented SHA semantics, inspect ruleset, and define the fail-closed workflow provenance contract.
- Non-goals: no controller creation, no dispatch, no secrets/variables inspection, no provider calls, no hosted D1, no deployment, no merge, no production mutation.

## 2. Reuse First

**REUSE:** GitHub-native Actions context and REST API (repository ref, commit, contents, compare and workflow-run endpoints); existing canonical `proofs/d1-ledger` binder and local Workers/Vitest/D1 harness. GitHub's documented semantics are the reference contract.

**ADAPT:** use separate event target SHA and workflow-file SHA; require independent API readback of the current default ref, workflow path/content and ancestry; bind run metadata to the exact expected workflow identity.

**BUILD:** no new dependency, ledger, migration, workflow controller or parallel authorization mechanism in this pass. Implementation is deliberately withheld until a real default-branch workflow and independent trust anchor exist.

## 3. Verified repository findings

- Recursive tree for frozen default HEAD returned no paths matching `next-event-controller`, `github-next-event` or `d1-ledger`. The candidate D1 proof is not part of default.
- Recursive tree for PR #170 head contains `proofs/d1-ledger/src/github-next-event.mjs`, its tests and migration 0017, and the D1/Pool Contract validation workflows.
- PR #170 candidate tree does **not** contain `.github/workflows/next-event-controller.yml`, although the binder's expected `workflowRef` names that path.
- Current binder validates runner-context identity, exact expected workflow ref and SHA shape. It does not independently fetch the default ref, workflow file bytes, commit ancestry, or workflow-run metadata. A well-formed SHA and expected string are not proof of workflow authenticity.
- PR #170 exact synthetic merge CI remains the Pass 62 evidence: D1 run [45274455569](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45274455569), 8/8 files and 113/113 tests; Pool Contract run [45274455577](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45274455577), PASS. This pass independently fetched both completed job logs (job IDs `138042499229` and `138042499753`) and confirmed each checked out exact synthetic merge `8b1c674c6fd2bdfaae55868fe75c13c6919fd047`; D1 log reports 8/8 files and 113/113 tests, and Pool Contract log reports `POOL_CONTRACT_VALIDATION=PASS`.
- PR #170 formal reviews and threads: 0 / 0. Combined status endpoint returned no legacy commit statuses; workflow-run endpoint returned the two completed successful runs above.
- Active ruleset `26550182`: enforcement active on `refs/heads/Основной`; PR required; review-thread resolution required; required approvals = 0; deletion and non-fast-forward prohibited; no bypass actors; current user cannot bypass.

## 4. GitHub semantic correction

GitHub's current documentation states:
- For `issue_comment`, `GITHUB_SHA` is the last commit on the default branch and `GITHUB_REF` is the default branch; the workflow file must exist on the default branch for this event to trigger.
- `GITHUB_WORKFLOW_SHA` / `github.workflow_sha` is the commit SHA for the workflow file.
- `GITHUB_WORKFLOW_REF` / `github.workflow_ref` identifies the workflow path and ref.

Therefore event target SHA and workflow-file SHA are distinct provenance facts. The Pass 61 correction that stopped requiring equality is valid, but it does not authenticate either value or the workflow content.

Sources:
- [GitHub: Events that trigger workflows — issue_comment](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment)
- [GitHub: Variables reference — GITHUB_WORKFLOW_SHA](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)
- [GitHub: Contexts reference — github.workflow_sha / github.workflow_ref](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)

## 5. Required provenance contract (design decision)

A future read-only verifier must fail closed unless every condition below is met:

1. **Repository identity:** independently bind numeric repository ID, owner ID/login and exact repository full name to the trusted repository configuration.
2. **Event identity:** accept only top-level `issue_comment.created`, Issue #96 (not a PR conversation), exact owner numeric identity/association, exact body `/next`, and the frozen CODE profile.
3. **Default-ref snapshot:** independently read `refs/heads/Основной` through GitHub's authenticated API. Require the returned repository identity and ref to match. Under the initial strict race policy, require current default HEAD == event target SHA. Any advancement or mismatch is STALE/DENY; do not silently accept a stale event. A new owner command is required after the ref stabilizes.
4. **Workflow identity:** require exact repository, exact path `.github/workflows/next-event-controller.yml`, exact default-branch workflow ref and exact workflow-file commit SHA from the runner context.
5. **Workflow bytes:** retrieve the workflow file at the reported workflow SHA, verify the returned path/ref and compute SHA-256 over the decoded raw bytes. Compare against an independently approved digest, not a digest supplied by the event or by the workflow being checked.
6. **Ancestry:** independently establish that the workflow-file commit is an ancestor of the event target SHA using GitHub's commit comparison/ancestry result. Reject unrelated, divergent, unavailable or ambiguous results.
7. **Run provenance:** read the workflow run by run ID and verify repository, workflow ID/path, event name, head branch/SHA and run attempt. Missing or inconsistent metadata is DENY/UNCONFIRMED.
8. **Race closure:** after the checks, re-read the default ref immediately before recording the provenance receipt. Require the same SHA as the first read and the event target SHA. If it moved, abort. This narrows but cannot eliminate a race after the final read; the controller must remain non-dispatching until a stronger atomic/issuer boundary is qualified.
9. **Durable evidence:** persist immutable target SHA, workflow SHA/ref/path, content digest, run ID/attempt, API-observed default SHA, verifier version and timestamp in the existing canonical ledger only. Exact primary-first full-tuple readback is mandatory.
10. **Authority boundary:** output remains `dispatch:false` and `executionAuthorized:false`. Provenance qualification is not execution authorization.

### Independent trust-anchor blocker

The expected controller workflow file is absent from both the frozen default tree and PR #170 candidate tree. Consequently, there is no legitimate workflow blob, workflow commit SHA, content digest or ancestry chain to pin.

Further, the active ruleset currently requires a PR but zero approvals. A digest constant stored only in the same repository/workflow is not an independent trust anchor against a malicious or mistaken change to that same code path. No external verifier identity, independently controlled digest source, or mandatory independent approval gate has been qualified in this pass.

**Decision:** do not invent a digest, do not treat a well-formed workflow SHA as trusted, do not add a live `issue_comment` controller, and do not enable dispatch. The verifier implementation is **BLOCKED** until the workflow artifact exists on the trusted default branch and the independent trust anchor/governance path is approved and testable.

## 6. Security / non-actions

- No secrets or variable values read.
- No Gemini or Claude dispatch.
- No provider calls or hosted D1 writes.
- No workflow controller created or executed.
- No code, schema or runtime changes to PR #170.
- No deployment, merge or production mutation.
- No changes to the MediaHub OS repository.
- Active engineering time: **NOT MEASURED**.

## 7. Metrics and disposition

| Item | Result |
|---|---|
| Default tree provenance scan | VERIFIED |
| PR #170 candidate source/workflow scan | VERIFIED |
| GitHub official SHA semantics | VERIFIED from official docs |
| Ruleset 26550182 | VERIFIED |
| PR #170 reviews / threads | 0 / 0 |
| PR #170 Pass 62 D1 CI | SUCCESS, 113/113 |
| PR #170 Pass 62 Pool Contract | SUCCESS |
| Workflow authenticity / independent digest | BLOCKED |
| Live controller / dispatch | NOT RUN |
| Code changes this pass | 0 |
| New dependencies | 0 |
| Active time | NOT MEASURED |

Pass 63 is **VERIFIED as a source/governance audit and trust-contract decision**. It is not implementation qualification, not Contour A acceptance, and not permission to dispatch.

## 8. Next bounded pass — Pass 64

Inspect the existing governance and ownership mechanisms for a genuinely independent workflow trust anchor that is compatible with the free-tier constraint. Compare (a) an independent reviewer/required-approval gate, (b) a separately controlled verifier identity/configuration, and (c) a separately governed immutable digest source. Do not change rulesets, create credentials, read secret values, or create the controller without explicit governance authorization. Return a concrete least-privilege decision and implementation DoD. Contour B remains deferred.

Links:
- [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170)
- [PR #169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
