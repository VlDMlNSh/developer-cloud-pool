# Pass 64 — independent workflow trust-anchor options and governance decision

Date: 2026-11-24  
Status: **VERIFIED — governance capability assessment and least-privilege design; governance activation BLOCKED pending independent reviewer authorization**  
Contour A: **NOT ACCEPTED**  
Contour B: **DEFERRED**

## 1. Frozen target and scope

- Repository: `VlDMlNSh/developer-cloud-pool`, public, GitHub Free-compatible candidate.
- Default branch: `Основной` @ `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` (re-read; unchanged).
- Documentation branch: `docs/engineering-excellence-2026-11-23` @ `0a98d581d3b6522227104c6e3824e5e1fff1157d`.
- PR #169: OPEN / DRAFT / UNMERGED; base default; head above; 42 files, +3,275/-9; reviews 0; threads 0; exact-head Actions runs not returned; combined legacy statuses empty. CI is NOT RUN / NOT VERIFIED, not a failure.
- PR #170: OPEN / DRAFT / UNMERGED; head `7d900d9fe11b19f048548a3bed657b2549f8091f`; reviews 0; threads 0. Pass 62 exact synthetic merge evidence remains D1 113/113 and Pool Contract PASS; no new CI run was created in this pass.
- Ruleset `26550182`: ACTIVE on `refs/heads/Основной`; pull request required; review-thread resolution required; `required_approving_review_count=0`; stale approvals dismissed on push; `require_last_push_approval=false`; `require_code_owner_review=false`; bypass actors empty; current user cannot bypass.
- Scope: compare three independent trust-anchor patterns against the actual public personal-repository governance and GitHub Free constraints. No ruleset, collaborator, App, credential, workflow or production changes.

## 2. Reuse First

**REUSE:** GitHub native repository rulesets / pull-request reviews / CODEOWNERS; GitHub Actions OIDC-backed artifact attestations as optional supplemental provenance; existing canonical D1 ledger for future immutable receipt storage.

**ADAPT:** enforce one independent human approval for protected default-branch changes, require approval after the latest push, dismiss stale approvals, and assign security-sensitive paths to an independent CODEOWNER with write permission. Runtime verifier must read back the effective ruleset and deny if it is weakened or unavailable.

**BUILD:** no new external service, custom signing infrastructure, parallel ledger, or controller in this pass.

GitHub documentation confirms rulesets are available on public repositories under GitHub Free and required pull-request approvals can be configured. Required team reviewers are not available in user-owned repositories; use an individual CODEOWNER / reviewer with repository write permission instead:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

GitHub artifact attestations are available on public repositories across current plans, including Free, and bind artifact digest to workflow/repository/commit/event provenance. They do not independently decide that the workflow itself is trusted; a compromised or unreviewed workflow could attest its own output. Treat attestations as supplementary evidence, not the root policy trust anchor:
- https://docs.github.com/en/actions/concepts/security/artifact-attestations
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations

## 3. Option comparison

| Option | Free-tier fit | Independence | Main risk / limitation | Decision |
|---|---|---|---|---|
| A. Independent human PR approval + ruleset | Supported for public GitHub Free repository | Independent from code author if reviewer is a separate person with write permission | Repository admin can still change ruleset/settings; does not resist malicious/compromised admin | **SELECT as minimum viable governance gate** |
| B. Separately controlled GitHub App / verifier service | GitHub App itself may be usable without a paid GitHub plan; operating a separately controlled verifier service and protecting its credentials is not yet proven free or provisioned | Potentially strongest if app registration, key custody and runtime are controlled outside the repository owner/workflow | Requires separate operator/account, secure key custody, independent runtime/hosting, API permission design and operational evidence; no approved runtime exists | DEFER; do not create credentials or service |
| C. Independently governed immutable digest source | Public GitHub repo/tag/attestation can be free | Independent only if a different trusted maintainer controls the source and signing authority | Same-owner second repo is not independent; attestation alone proves provenance, not policy approval; external maintainer not yet appointed | SUPPLEMENTAL / DEFER pending independent maintainer |

### Selected threat model

Option A protects against an unreviewed PR changing the trusted workflow or verifier. It does **not** protect against compromise of the repository administrator account, deliberate ruleset weakening by that administrator, or compromise/collusion of the independent reviewer. Those risks must remain explicit. If protection against administrator compromise is required, Option B or a separately governed Option C is mandatory; a same-owner digest constant is not sufficient.

## 4. Least-privilege governance target (proposed; NOT APPLIED)

1. Keep the existing active ruleset and add exactly one required approving review for `refs/heads/Основной`.
2. Set `dismiss_stale_reviews_on_push=true` and `require_last_push_approval=true`.
3. Keep `bypass_actors=[]`; preserve PR requirement, thread resolution, deletion and non-fast-forward protections.
4. Enable code-owner review for security-sensitive files and add an individually named independent reviewer to CODEOWNERS for at least:
   - `.github/workflows/**`
   - `proofs/d1-ledger/**`
   - `docs/security/**` (if/when introduced)
   The reviewer must have repository write permission; a personal repository cannot use team-required-reviewer rules.
5. The owner remains the sole administrator. Do not grant admin, maintain, Actions-write, contents-write tokens, secret access or deployment permissions to the reviewer merely to approve PRs. Reviewer receives only the minimum repository write permission required by GitHub review semantics.
6. At verifier startup and immediately before any future authorization, read the live ruleset by API and require active enforcement, >=1 approval, stale-review dismissal, last-push approval, code-owner review for protected paths, and no bypass actors. Any unavailable/mismatched rule => DENY.
7. Record the approved workflow SHA-256 in a reviewer-approved security manifest on the protected default branch. The manifest is useful only because the independent review gate protects changes to both workflow and manifest; it is not an independent cryptographic source by itself.
8. Use GitHub artifact attestations only as an additional signed provenance layer after workflow identity has been trusted. Never let an attestation replace review or ruleset verification.

## 5. Implementation Definition of Done (future, gated)

- Owner explicitly authorizes appointment of one independent reviewer and governance-rule update.
- Reviewer is a distinct human identity from PR author and has write permission, not admin.
- Ruleset API read-back proves exact settings above; screenshot/UI confirmation is not a substitute for API state.
- CODEOWNERS matching is tested for workflow, D1 ledger and trust-manifest paths; negative test confirms unowned path does not weaken global approval.
- Test that author cannot satisfy own approval; approval is dismissed after a new commit; approval from a non-last-pusher is required; unresolved threads block merge; bypass remains empty.
- Workflow and trust manifest changes require independent approval on the final diff.
- Controller verifier independently reads repository identity, default ref, workflow bytes/digest, ancestry, run ID/attempt and effective ruleset. Fail closed on stale SHA, missing API data, digest mismatch, weakened ruleset, race or incomplete evidence.
- Provenance receipt persisted in existing canonical ledger with primary-first full-tuple readback.
- Keep `dispatch:false` and `executionAuthorized:false` until all remaining executor, quota, lease, UI, persistence, security and independent acceptance gates are met.
- Exact-head CI, formal independent review and immutable evidence are required. A ruleset configuration change alone is not controller qualification.

## 6. Security / non-actions

- No secrets or variable values read.
- No collaborator invited or permission changed.
- No ruleset changed.
- No GitHub App, signing key, token, external service or credential created.
- No workflow/controller created or executed.
- No Gemini/Claude dispatch, provider call, hosted D1 write, deployment, merge or production mutation.
- No MediaHub repository changes.
- Active engineering time: NOT MEASURED.

## 7. Metrics and disposition

| Item | Result |
|---|---|
| Default HEAD | VERIFIED, unchanged |
| Ruleset 26550182 | VERIFIED, 0 approvals / no bypass |
| PR #169 reviews / threads | 0 / 0 |
| PR #169 exact-head CI | NOT RUN / NOT VERIFIED |
| PR #170 reviews / threads | 0 / 0 |
| Option A free-tier fit | VERIFIED from official GitHub docs |
| Option B provisioned / free runtime | NOT VERIFIED |
| Option C independent maintainer | NOT VERIFIED |
| Governance change | NOT APPLIED |
| Controller / dispatch | NOT RUN |
| Code changes | 0 |
| New dependencies | 0 |
| Active time | NOT MEASURED |

Pass 64 is **VERIFIED as a governance capability assessment and least-privilege design**. The selected approval gate is not active, so workflow trust remains BLOCKED. Contour A remains NOT ACCEPTED; Contour B remains DEFERRED.

## 8. Next step

Owner action is required to nominate/authorize a distinct independent reviewer with repository write permission and approve the proposed ruleset changes. Until then, do not build or activate the controller. After authorization, Pass 65 should apply only the agreed governance change, read it back through the GitHub API, and add CODEOWNERS coverage; no workflow dispatch.

Links:
- PR #169: https://github.com/VlDMlNSh/developer-cloud-pool/pull/169
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window: ../context/GITHUB-CONTEXT-WINDOW.md
- MediaHub canonical map (reference only; Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
