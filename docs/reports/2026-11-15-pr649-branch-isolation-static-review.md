# PR #649 — static review of dispatch-specific branch isolation

Date: 2026-11-15 (Europe/Moscow)
Repository: `VlDMlNSh/mediahub-os`
PR: https://github.com/VlDMlNSh/mediahub-os/pull/649
Reviewed immutable head: `38aafbe40c6a6d55913f13ae9bf1691fa6b2221e`

## Scope and method

Read the PR head commit diff and fetched all three child workflow files plus the batch controller at the exact immutable commit. This is a static source review only. No Gemini agent, provider, runtime, or secret was accessed. No independent reviewer identity is claimed.

## Confirmed improvements

All three child workflow prompts require a fresh branch whose name includes the controller-generated `dispatch_id`:

- Agent 1: `agent-1-contour-a-${dispatch_id}`
- Agent 2: `agent-2-contract-verification-${dispatch_id}`
- Agent 3: `agent-3-security-audit-${dispatch_id}`

Each child validates that the target SHA is a 40-character lowercase hexadecimal string and the dispatch ID is UUIDv4-shaped. This addresses the previously observed fixed-branch collision at the instruction level.

## Finding F-01 — branch isolation is not machine-enforced

**Severity: HIGH for the claimed collision-prevention guarantee. Status: OPEN / CHANGES REQUIRED.**

The expected branch name is embedded in the Gemini prompt. The post-run validator checks that the Gemini output exists and is valid JSON, that at least one tool call succeeded, and that a `create_pull_request` tool call succeeded. It does not assert that:

1. the created branch name exactly equals the role-specific prefix plus the signed dispatch ID;
2. the branch was newly created for this dispatch rather than an existing branch;
3. the resulting PR head repository and branch match the expected branch;
4. the PR base is `main`;
5. the PR is attributable to the current dispatch ID rather than an older PR.

Consequently, a model that ignores the prompt can reuse a branch and still satisfy the current validator if the GitHub tool reports a successful PR creation. The new instructions reduce the chance of collision but do not enforce the invariant.

### Required remediation

- Enforce branch creation/selection deterministically outside the model, or capture structured GitHub tool results and validate them after the model run.
- Derive the expected role-specific branch from the authenticated signed dispatch ID; reject any mismatch.
- Validate PR head repository, head branch, base branch, and current dispatch correlation before marking the child successful.
- Add adversarial tests for reused branch, wrong dispatch ID, wrong head repo, wrong base branch, and pre-existing PR reuse.
- Re-run exact-head CI and retain test outputs/digests.

## PR and CI evidence

- GitHub returned zero formal review submissions and zero inline review threads for PR #649 at inspection time.
- Workflow runs associated with the target included:
  - `43722469665`: controller probe, completed/success in PR context; dispatch/admission was skipped, so not evidence of live dispatch.
  - `43722469720`: caller-context denial probe, completed/success; exercises denial, not authorized launch readiness.
- Previously recorded exact-head checks: 11 total, 9 SUCCESS and 2 expected SKIPPED in PR context. This does not resolve F-01.
- Controller secret/variable metadata and effective governance approval remain NOT VERIFIED. Secret values were not read.

## Action taken

Posted a technical review comment to PR #649, GitHub comment ID `6896580340`, with the finding and remediation requirements:
https://github.com/VlDMlNSh/mediahub-os/pull/649#issuecomment-6896580340

No formal APPROVE was submitted. No merge, deployment, agent dispatch, or provider invocation occurred.

## Decision

PR #649: **CHANGES REQUIRED** on the static finding above. This is not an independent Gemini audit. The controlled three-agent wave remains **BLOCKED / NOT RUN** until the finding is repaired, exact-head CI passes, governance and credential metadata gates are verified, and the trusted-main non-launching probe succeeds.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
