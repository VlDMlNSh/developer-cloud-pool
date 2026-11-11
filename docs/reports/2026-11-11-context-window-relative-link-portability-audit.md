# 2026-11-11 — Context Window relative-link portability audit

## Scope
Checked the six relative document links used by the latest 2026-11-11 Context Window entries against both the continuation branch and the default branch. Re-read current PR metadata and exact-head PR-triggered Actions runs for the active proof stack. No branch refs, PR states, deployments, workflows or secrets were changed.

## Link portability findings
All six referenced documents exist on `docs/cross-chat-continuation-2026-11-06`, but all six return NOT_FOUND (HTTP 404) when read from default branch `Основной`. Therefore, the current continuation Context Window is navigable on its own branch but cannot be copied unchanged into a default-branch canonical file without broken links.

| Document | Continuation branch blob | Default branch |
|---|---|---|
| Backend State Authority decision study | `d9e3e6c35ac4f812c08578606ece5f3319d83bed` | NOT FOUND |
| PR #25/#52/#51/#56 lineage audit | `004da6f33c25c91fe2c60601c74f9b9f74878006` | NOT FOUND |
| PR #25/#52 five-commit delta | `e344bb0922777b53ec77f320a7e9e8d63daeaa62` | NOT FOUND |
| PR #25 parent readiness review | `a6ce57942c01de6b17e23e3a0540abe65b592255` | NOT FOUND |
| Repository governance/context ownership audit | `2fe93eaddb807fd6a8ff83e6a1f3ca53fa8ab71b` | NOT FOUND |
| Context Window ancestry/consolidation plan | `d8bed64bb12352fb1bd08f4ae9d56ad8c5fe2c7c` | NOT FOUND |

## Correct link targets for a future curated default-branch Context Window
Use explicit branch-qualified URLs, not relative links, until the referenced evidence documents have been independently integrated into default:
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/decisions/2026-11-11-backend-state-authority-decision-study.md
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-pr52-pr51-pr56-lineage-audit.md
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-pr52-five-commit-default-delta.md
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-pr25-parent-readiness-review.md
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-repository-governance-context-ownership-audit.md
- https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-11-context-window-ancestry-and-consolidation-plan.md

## Current PR and exact-head CI read-back
All five PRs remain OPEN / DRAFT / unmerged. PR #25/#52 are the web-console/local Workflow stack; PR #51/#56 are the attempt/reconciliation proof stack; PR #57 is a separate read-only GitHub Actions evidence proof.

| PR | Exact head | Exact-head PR-triggered runs |
|---|---|---|
| #25 | `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` | `42228269689` Pool Contract Validation SUCCESS; `42228269676` Jarvis Web Prototype Validation SUCCESS |
| #52 | `c430fe4beecf93a20052f0c3efedb5f8539e4faa` | `42507524428` Jarvis Web Prototype Validation SUCCESS |
| #51 | `32c88e50e173e6b19bc6c61723ab6474a3c08145` | `42536377720` Isolated D1 Ledger Proof SUCCESS |
| #56 | `0769b6b5d5eda9c7821804b93db21ded6e0985ef` | `42825872826` Isolated D1 Ledger Proof SUCCESS |
| #57 | `2c263e8a9915f0bc8e0698cde816e87cb2376538` | `42838193405` Pool Contract Validation SUCCESS; `42838193384` GitHub Actions Run Evidence Fixture Tests SUCCESS |

These CI results verify only the named proof/test scopes. They do not establish hosted deployment, hosted D1/DO qualification, production executor integration, independent review, or dispatch authority.

## Reconciliation decision
- Do not copy the 369k-character continuation file verbatim into default.
- Build a curated default-branch Context Window that states current decisions/status and links to continuation-branch reports with explicit branch-qualified URLs.
- Keep detailed proof reports in the continuation branch until each evidence set is separately reviewed and integrated. Avoid importing the 408-commit branch history wholesale.
- Include a conspicuous note that linked evidence lives on an unmerged documentation branch and is not default-branch production code.
- Preserve the default copy's existing history and update it only through a dedicated PR based on a freshly re-read default HEAD.

## Status
- Six latest evidence links exist on continuation: VERIFIED.
- Same six links absent from default: VERIFIED.
- Link portability defect: VERIFIED.
- Corrected future link targets: VERIFIED.
- Canonical default Context Window consolidation: NOT EXECUTED.
- PR exact-head CI: VERIFIED for listed runs and SHAs only.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step
Prepare a compact canonical Context Window draft (not yet a branch/PR) with current phase, architecture/runtime status, active PR stack, evidence status, governance gaps and branch-qualified links. Review it against the Bootstrap, canonical map, checkpoint and roadmap before creating a default-based branch.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
