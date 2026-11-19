# Cloud Development Pool → First Jarvis Launch: Execution Plan
Date: 2026-11-19
Status: PLANNED / EXECUTING
Scope: Contour A only until ACCEPTED; Jarvis first controlled launch follows Contour A acceptance.
Repository: https://github.com/VlDMlNSh/developer-cloud-pool
Context source: docs/context/GITHUB-CONTEXT-WINDOW.md

## Operating agreement
- GitHub is the durable project source of truth. Preserve decisions, constraints, evidence, estimates, actuals, blockers and next actions in the Context Window and dated checkpoints/reports.
- Do not copy entire private conversation transcripts. Convert relevant discussion into concise engineering decisions and traceable work records.
- Work in one bounded, independently verifiable engineering pass per master prompt. A prompt has objective, immutable target SHA, allowed actions, prohibitions, acceptance criteria, evidence and time estimate.
- Do not infer elapsed engineering time. Record actual duration only when measurable; otherwise mark NOT MEASURED.
- Keep Contour B deferred until Contour A is formally ACCEPTED.
- Free-tier-only: no paid fallback, no billable resource creation, no provider calls or live dispatch without the required gates.
- Never read or disclose secret values. Technical capability does not grant authority.
- Keep Jarvis, ASTRA A0 and MediaHub Product State Authority separate.
- At each significant pass, update Context Window, dated checkpoint and report; record commit/blob SHA and exact-head CI evidence.
- Status vocabulary: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

## Corrected plan size
The 14 stage subtotals below add up to **237 engineering sub-items**, not 140. The earlier 140 total was an arithmetic error and is superseded.
The 10 requests planned for Stage 1 add up to **100 minutes** using the latest per-request estimates below. An earlier 110-minute estimate used a different breakdown and is superseded for this 10-request schedule.

## 14-stage roadmap
| Stage | Scope | Sub-items |
|---:|---|---:|
| 1 | Restore and baseline GitHub state | 10 |
| 2 | Executor Identity and Admission Security | 20 |
| 3 | Admission, Lease and Execution Ledger | 18 |
| 4 | Cloud Pool integration / Issue #140 | 18 |
| 5 | Real isolated executor runtime | 20 |
| 6 | Safe model/provider routing and quotas | 18 |
| 7 | Secrets and configuration governance | 14 |
| 8 | Durable state and recovery | 15 |
| 9 | Authenticated remote web console | 20 |
| 10 | Orchestration and independent agents | 16 |
| 11 | Controlled cloud deployment | 20 |
| 12 | Independent Contour A qualification and acceptance | 20 |
| 13 | First controlled Jarvis launch and configuration | 18 |
| 14 | Continuous documentation and operations | 10 |
| | **Total** | **237** |

Documentation and evidence capture are continuous across all stages, not deferred to Stage 14.

## Stage 1 — ten master prompts
| Prompt | Bounded task | Estimate | Status |
|---:|---|---:|---|
| 1 | Verify repository identity and default branch | 5 min | VERIFIED |
| 2 | Verify default HEAD and enumerate working branches | 5 min | VERIFIED |
| 3 | Refresh relevant Issues and Pull Requests | 15 min | VERIFIED |
| 4 | Compare active PR base/head against current default HEAD | 10 min | VERIFIED |
| 5 | Inspect Actions runs and exact-head CI evidence | 15 min | VERIFIED |
| 6 | Inspect active rulesets and branch protection | 10 min | VERIFIED (scope-limited) |
| 7 | Read current Context Window and controlling checkpoint | 15 min | VERIFIED (reconciliation recorded) |
| 8 | Build evidence-backed component readiness map | 15 min | VERIFIED |
| 9 | Classify claims as VERIFIED / NOT VERIFIED / BLOCKED | 5 min | PLANNED |
| 10 | Freeze baseline target SHA and publish baseline record | 5 min | PLANNED |
| | **Total** | **100 min** | |

## Master Prompt 1 — completed
**Objective:** Verify the repository identity and its configured default branch, then resolve the current default-branch HEAD from Git refs.

**Allowed:** Read-only GitHub repository metadata and Git reference queries.

**Prohibitions:** No code changes, no merge, no dispatch, no secrets inspection, no provider calls, no deployment, no branch mutation.

**Acceptance criteria:**
1. Repository full name and visibility confirmed.
2. Default branch confirmed from repository metadata.
3. Default branch HEAD confirmed independently from `refs/heads/<default-branch>`.
4. Evidence URLs and observed SHA recorded.

**Observed result (2026-11-19):**
- Repository: `VlDMlNSh/developer-cloud-pool`
- Visibility: public
- Default branch: `Основной`
- Default ref: `refs/heads/Основной`
- Default HEAD: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
- Repository metadata and ref evidence were both returned by GitHub.
- Status: VERIFIED.
- Actual elapsed duration: NOT MEASURED (no reliable wall-clock telemetry available).

Evidence:
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной
- Default ref API: https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/git/ref/heads/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9

## Next
Run Master Prompt 2: independently record default HEAD and enumerate branch names/heads; do not yet treat branch protection, CI or PR alignment as checked. Continue with one prompt per bounded pass.


## Master Prompt 2 — completed
**Objective:** Verify the default branch HEAD and enumerate all repository branches with current heads.

**Observed result (2026-11-19):**
- Branches returned: 154.
- API pagination: two pages.
- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Documentation branch `feat/a1-jarvis-code-sandbox-profile-2026-11-19`: `d1ae38d5bfab3a67d66f34eca297d0155352ee9b`.
- Full inventory: `docs/reports/2026-11-19-stage-01-prompt-02-branch-inventory.md`.
- Status: VERIFIED.
- Actual elapsed duration: NOT MEASURED.

**Safety:** Read-only; no branch was modified or deleted.

## Next
Master Prompt 4 — compare active PR base/head against current default HEAD and classify ancestry.


## Master Prompt 3 — completed
- Status: VERIFIED for repository-wide issue/PR inventory and targeted metadata/history read.
- Open Issues: 10.
- Open Pull Requests: 106 (100 on first page, 6 on second).
- Issue #140 remains OPEN and is the controlling D1 admission/lease integration task.
- PR #146 is OPEN/DRAFT/UNMERGED on current base `b81d2b5...`; PR #143 and #142 are OPEN/DRAFT/UNMERGED on stale base `6818382...`.
- Full findings and decision: `docs/reports/2026-11-19-stage-01-prompt-03-issues-pr-inventory.md`.
- Actual elapsed duration: NOT MEASURED.
- No GitHub state was mutated.
- Next: Master Prompt 4 — compare active PR base/head against current default HEAD and classify ancestry.


## Master Prompt 4 — completed
- Status: VERIFIED for 13 high-priority integration PRs; not exhaustive for all 106 open PRs.
- Frozen default HEAD: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- #146 and #145 are directly based on current default (behind 0).
- #143/#142/#141 are 1 commit behind and diverged from current default.
- #135/#116/#114/#112/#111/#125 are 3 commits behind and diverged.
- #67/#72 are 82 commits behind from their merge base and diverged.
- Detailed report: `docs/reports/2026-11-19-stage-01-prompt-04-pr-ancestry.md`.
- No branch or PR mutation. Actual elapsed time: NOT MEASURED.
- Next: Master Prompt 5 — inspect exact-head CI evidence for the relevant PRs.


## Master Prompt 5 — completed
- Status: VERIFIED for two inspected exact-PR-head workflow checks; not exhaustive for all workflows or required checks.
- PR #146 head `8ebd5ff26e0f144616b6ed5d6fe48ca51d18c7ae`, base/default `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Pool Contract Validation run `44505922169` SUCCESS; six workflow YAML files parsed; security/contract invariants passed; dispatch gate false.
- Isolated D1 Ledger Proof run `44505922254` SUCCESS; 4 test files and 63 tests passed after dependency install and syntax check.
- Both jobs checked out PR merge commit `ddf6a9fae1c574321635231bdb48d86f66d608f2`; metadata/checks identify PR head SHA. Legacy commit status remains PENDING with zero contexts; global required-check completeness NOT VERIFIED.
- Artifact ID `14518894284`; SHA-256 `759b22bdb8798d9e46c57ed08d2d59e2eb4005491c4233cfe0d2ec1621dddfaf`.
- Report: `docs/reports/2026-11-19-stage-01-prompt-05-actions-ci-audit.md`.
- No dispatch, rerun, merge, deployment, secret inspection, provider calls or hosted D1 use. Actual time NOT MEASURED.
- Next: Master Prompt 6 — inspect rulesets and branch protection.


### Post-write provenance clarification — 2026-11-19
- After recording Prompt 5, the documentation branch advanced from tested PR head `8ebd5ff26e0f144616b6ed5d6fe48ca51d18c7ae` to `373d600d816784624799b30dbada7cb14b8364cc` through exactly four documentation-only commits.
- GitHub Compare API verified 4 ahead / 0 behind and exactly these four paths changed: Context Window, checkpoint, plan, and the Prompt 5 report. No source, workflow, test, or configuration files changed in that delta.
- Therefore the two SUCCESS workflow runs validate the code/workflow tree at `8ebd5ff...`; the latest branch head is docs-only later and has not itself been rerun. Do not label the latest SHA as directly CI-tested.

### Stage 1 — Master Prompt 6: governance audit (2026-11-19)
- Status: VERIFIED for repository ruleset and branch metadata; classic branch-protection details and ruleset history NOT VERIFIED (HTTP 403 from integration).
- Default branch Основной HEAD: b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5.
- Active repository ruleset #26550182, Основной — verified, targets refs/heads/Основной.
- Enforced: require PR, prevent deletion, prevent non-fast-forward; require review-thread resolution; dismiss stale approvals on push; bypass actors empty and current_user_can_bypass=never.
- Required approving review count is ZERO; code-owner review and last-push approval disabled.
- Branch metadata: protected=false, protection.enabled=false, required status checks enforcement off with no contexts/checks. Direct classic protection endpoint and ruleset history returned 403, so detailed configuration/history unavailable.
- Assessment: governance PARTIAL; CI success is not shown to be a merge gate. Recommend later owner-approved change to require independent approval and selected required status checks; no settings changed in this pass.
- Report: docs/reports/2026-11-19-stage-01-prompt-06-governance-audit.md (report commit 9fb7d79bd3a270664c0a27be4b9767dc44e0fea1).
- PR #146 remains OPEN/DRAFT/UNMERGED. No merge, deployment, dispatch, ruleset mutation or secret access.
- Actual elapsed time NOT MEASURED. Next: Master Prompt 7 — reconcile Context Window and checkpoint.
## Master Prompt 7 — Context Window and checkpoint reconciliation (2026-11-19)
- Status: VERIFIED for the current working-branch copies and the reconciliation performed in this pass.
- Re-read Context Window blob `50bc04351d0a02d525d586748540300ce32e58ca`, checkpoint blob `0fdc85682a5366ca33c31a0293572c2f64555633`, and plan blob `b5259198207223b7c34b4709bd4fa81277b40490` before editing.
- Found stale plan statuses: prompts 4–6 still showed PLANNED although their reports and Context Window recorded results. Updated plan rows 4–7.
- Found checkpoint had no Stage 1 Prompt 6/7 closure entry. Added current governance result and this reconciliation outcome.
- Current default branch HEAD remains `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #146 remains OPEN/DRAFT/UNMERGED; head `2b81492263e9a11ea9e86c686b25f25796119ac3`, base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- The PR head is documentation-only bookkeeping after the previously tested code SHA; do not claim this current SHA has fresh CI evidence.
- Stage 1 prompts 1–7 are now recorded as completed; Prompt 6 governance qualification remains PARTIAL because approvals=0, required status checks are off, and classic protection/ruleset history endpoints returned 403.
- No code, workflow, ruleset, branch protection, PR state, dispatch, deployment, or secrets were changed.
- Actual elapsed time: NOT MEASURED.
- Report: `docs/reports/2026-11-19-stage-01-prompt-07-context-checkpoint-reconciliation.md`.
- Next: Master Prompt 8 — evidence-backed component readiness map.
## Master Prompt 8 — evidence-backed component readiness map (2026-11-19)
- Status: VERIFIED as a read-only inventory of current working-branch evidence.
- Report: docs/reports/2026-11-19-stage-01-prompt-08-component-readiness-map.md.
- Verified at code/config level: legacy dispatch retirement guards; contract-validation workflow; isolated local D1 approval/task/attempt/outbox/lease proof and named historical CI runs.
- Partial: executor registry/OIDC proof exists, but registry is empty, OIDC authenticates workflow principal rather than process/host, and explicit revoked executor/profile negative test is missing.
- Not qualified: CODE sandbox profile remains PROPOSED / NOT QUALIFIED / NOT ENABLED; provider route/quota not qualified.
- Not verified/deployed: authenticated remote web console and current-target multi-agent dispatch provenance.
- Blocked: persistent engineering workspace / authorized host #3, Access/Tunnel and backup/restore evidence.
- Latest docs head is not claimed to have fresh CI. Historical CI is tied to recorded immutable test SHAs.
- No code/workflow/governance settings changed; no dispatch, provider calls, secret reads, hosted resource creation, deployment or merge. Actual elapsed time NOT MEASURED.
- Next: Master Prompt 9 — classify material claims as VERIFIED / NOT VERIFIED / BLOCKED.