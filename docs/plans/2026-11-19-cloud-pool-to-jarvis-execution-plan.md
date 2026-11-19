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
| 4 | Compare active PR base/head against current default HEAD | 10 min | PLANNED |
| 5 | Inspect Actions runs and exact-head CI evidence | 15 min | PLANNED |
| 6 | Inspect active rulesets and branch protection | 10 min | PLANNED |
| 7 | Read current Context Window and controlling checkpoint | 15 min | PLANNED |
| 8 | Build evidence-backed component readiness map | 15 min | PLANNED |
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
