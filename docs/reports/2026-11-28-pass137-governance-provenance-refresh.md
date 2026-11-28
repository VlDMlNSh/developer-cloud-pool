# Pass 137 — Governance truth refresh and supply-chain scanner provenance

Date: 2026-11-28
Status: VERIFIED (read-only evidence refresh and documentation); Contour A remains BLOCKED / NOT ACCEPTED.

## Target and scope
- Target PR head: `bebf4d9f92a5d7c8d9677a6828b1707e7e22e069`.
- Base/default branch `Основной`: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Exact PR merge-result tested by CI: `82a77557bd8aac4f941a5554a4d2818e96cba57b`.
- Scope: refresh PR/HEAD/CI/governance evidence; verify upstream provenance metadata for the next read-only workflow-security scanner pilot; update project intelligence, report, checkpoint and Context Window.
- Non-goals: no workflow/code/runtime changes, no package installation, no scanner execution, no secrets/variables value reads, no dispatch, no executor/provider calls, no hosted D1 writes, no deployment, no merge, no production mutation, no Contour B work.

## Repository and PR evidence
- PR #188: OPEN / DRAFT / UNMERGED; mergeable=true; 288 commits, 112 files, +13,923/-16 at observation.
- Branch: `feat/pass124-readonly-owner-next-controller-2026-11-28`.
- HEAD: `bebf4d9f92a5d7c8d9677a6828b1707e7e22e069`; base: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Default branch HEAD independently read as `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR formal reviews: 0. Review threads: 0.

## Exact-head CI evidence
Both PR-triggered workflow runs report PR head `bebf4d9f92a5d7c8d9677a6828b1707e7e22e069` and both job logs explicitly check out merge-result `82a77557bd8aac4f941a5554a4d2818e96cba57b`, i.e. merge of `bebf4d9f92a5d7c8d9677a6828b1707e7e22e069` into base `565404f...`.

1. Pool Contract Validation:
   - Run: [46188556454](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46188556454)
   - Job: `141113886341`, “Validate workflow syntax and security invariants”.
   - Conclusion: SUCCESS.
   - Tests: 42/42 passed; workflow YAML parse and pool contract validator passed; `WORKER_IMPORT_GRAPH=PASS modules=1 edges=0`.
   - Log observed `POOL_DISPATCH_ENABLED: false`; validator gate reported disabled/unset.
2. Isolated D1 Ledger Proof:
   - Run: [46188556460](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46188556460)
   - Job: `141113874704`, “Clean-base Workers-runtime D1 migration tests”.
   - Conclusion: SUCCESS.
   - Tests: 9/9 files, 140/140 tests passed; `npm ci --ignore-scripts --no-audit --no-fund`; Node 24.9.0.
3. Aggregate: 182/182 tests across both suites on the same merge-result `82a77557bd8aac4f941a5554a4d2818e96cba57b`.

This proves the tested local/CI contracts only. It does not prove a deployed pool, live controller activation, provider routing, end-user web UI, independent security qualification or acceptance.

## Governance — material blocker confirmed
- Active repository ruleset [#26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182), target branch `refs/heads/Основной`, enforcement active.
- Rules require a PR, prevent deletion/non-fast-forward and require review-thread resolution.
- **`required_approving_review_count=0`**, no required reviewers, no code-owner review, no last-push approval, no extra approval for unattributed changes.
- Bypass actors empty; current user bypass reported “never”.
- GitHub branch-protection endpoint reports `protected=false` and status checks enforcement off. Active ruleset still applies; do not misread the branch-protection endpoint as ruleset absence.
- PR #188 has 0 formal reviews and 0 review threads.
- Therefore an independent approval is not currently a configured merge gate. Independent security review remains NOT RUN.
- Default branch `Основной` still returns NOT_FOUND for `.github/workflows/next-event-controller.yml`; live `issue_comment` controller activation remains NOT RUN.
- Secret values were not read. No dispatch or production-affecting action occurred.

## Reuse First — security scanner shortlist and provenance
### zizmor
- Upstream: https://github.com/zizmorcore/zizmor
- Latest GitHub release at observation: v1.33.1, published 2026-11-22; release marked immutable.
- Release API asset: `zizmor-x86_64-unknown-linux-gnu.tar.gz`.
- GitHub release asset digest: `sha256:3e6a301c7a820a2501915f5a9de8c0486da82bdec7965f068477538a98743d43`.
- License: MIT (upstream LICENSE read).
- PyPI showed 1.32.0 as its latest package release while GitHub release API showed v1.33.1; do not silently substitute PyPI for the immutable GitHub binary.
- Decision: **PILOT NEXT**, not yet installed or run. Proposed first use is a non-blocking, read-only static audit of workflow YAML, pinned binary, checksum verification, no secrets, no write permissions, bounded timeout, results retained as CI evidence. First validate exact CLI invocation and expected findings on this repo before making it blocking.

### OpenSSF Scorecard
- Upstream: https://github.com/ossf/scorecard
- Latest release at observation: v5.7.0, published 2026-11-19.
- License: Apache-2.0 (upstream LICENSE read).
- Linux amd64 release asset digest: `sha256:3b08ec0a8681806c3e744ec9210742a502c7d66f06f25523b70f7128738235d3`.
- Release is **not marked immutable** by GitHub API; an `multiple.intoto.jsonl` attestation asset is present, but its verification has not been performed.
- Decision: **DEFER** installation/execution until attestation verification, action/source review, token/egress/data-flow review and assessment of public-score publication behavior. No token supplied, no repository clone performed by this pass.

### Reuse decision
- REUSE existing PR/CI evidence and repository-native workflow contract tests.
- PILOT zizmor next as a checksum-pinned read-only binary, initially advisory.
- DEFER Scorecard until release attestation and data/publication behavior are verified.
- BUILD no new runtime components; install no dependencies in this pass.

## Maturity, effort and metrics
- Current maturity remains Stage 2/7: VERIFIED local integration proof; Stage 3 governance BLOCKED.
- Remaining effort estimate remains 52–95 focused engineering hours, LOW–MEDIUM confidence; not recalculated from one evidence refresh.
- Historical actual cumulative hours: NOT MEASURED / NOT RECOVERABLE.
- Pass 137 active engineering time: NOT MEASURED (no reliable timer evidence).
- Code/runtime changes: 0. Dependencies installed: 0. New tests: 0. Existing CI tests: 182/182 same merge-result.
- Paid resources: 0. Secrets read: 0. Dispatches/provider calls/executor launches/hosted D1 writes/deployments/merges/production mutations: 0.
- Defects discovered: governance approval threshold is zero; default-branch activation workflow absent. No new code defect identified by this pass.
- Critical path: configure at least one independent approval -> independent security review of exact PR head -> resolve review findings -> activate/qualify safe controller only after default-branch and governance gates -> qualify runtime, UI, state, quotas, isolation, audit -> independent acceptance.

## Owner action required
The owner must change ruleset #26550182 so that `Required approving reviews = 1` (or stronger), then save. This is necessary because the currently active ruleset requires zero approvals, so the repository does not enforce the independent approval gate required for acceptance. After the change, re-read the effective ruleset and verify it applies to `Основной`; do not rely on the settings page alone.

## Next bounded step
Run the zizmor v1.33.1 read-only pilot only after reviewing its exact CLI and pinned-binary installation/verification flow. Keep it advisory initially, no secrets, no write permissions, no auto-fixes. In parallel, obtain the owner's ruleset approval-threshold change and independent security review. Do not merge or activate the controller in this pass.

## Project links
- PR #188: https://github.com/VlDMlNSh/developer-cloud-pool/pull/188
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass124-readonly-owner-next-controller-2026-11-28/docs/context/GITHUB-CONTEXT-WINDOW.md
- Platform Intelligence register: https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass124-readonly-owner-next-controller-2026-11-28/docs/architecture/PLATFORM-INTELLIGENCE-AND-ENGINEERING-OPTIMIZATION-2026-11-28.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
