# Developer Cloud Pool — web-console priority and repository recheck

Date: 2026-11-06
Status: **SOURCE READ-BACK VERIFIED / ISSUE #22 CREATED / WEB SERVICE NOT IMPLEMENTED / PRODUCTION DISPATCH BLOCKED**

## Immutable repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- README blob: `fea44c2485b604432ab9ee20293c3e1f7ee8bdec`
- Jarvis hybrid architecture blob: `98f84dd24814ca91d4ade45fb3cf57535d8884ba`
- Pool Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`
- Pool Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
- Pool Contract Validation workflow blob: `de7134a6245085ce1c26bbf59b936a087f884566`

## Owner priority recorded

The delivery order is:
1. Secure remote web console, usable from desktop and iPhone browser.
2. Native iOS Developer Mobile AI/local inference.
3. External owner-operated server integration.

The web console is the first product access surface. Native app and external servers are explicitly deferred.

## Verified findings

### Existing UI

PR #6: https://github.com/VlDMlNSh/developer-cloud-pool/pull/6

- State: OPEN / DRAFT / NOT MERGED.
- Head SHA: `5b8469b3bb691ff48f8be9bda9aea0969d42f537`.
- Base SHA: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Comparison against current default HEAD: DIVERGED; 9 commits ahead, 1 behind; merge base is the original base SHA.
- PR files: static HTML/CSS/JS dashboard, static validation workflow, validator and evidence report.
- UI source blob SHAs:
  - `web/jarvis-dashboard/index.html`: `80ad61e4c8a6c8d6c255cfd195b08c8cd4e60d8a`
  - `web/jarvis-dashboard/app.js`: `5f66ca7e2a92bcdf78f7fe30e838a4022844baeb`
  - `web/jarvis-dashboard/styles.css`: `0053995a0cfa3ce1b18fe2662bfa93b354a7c040`
- Static UI explicitly labels itself DEMO; values are hard-coded fixtures; JavaScript has no network/API access. No auth, live status, task submission or deployment exists.
- Exact-head CI:
  - Jarvis Static UI Validation run 42108498565: completed / success.
  - Pool Contract Validation run 42108497862: completed / success.
- Formal reviews: none.
- Browser/device visual QA: NOT VERIFIED.
- The PR's `mergeable=true` flag does not remove its one-commit base divergence or substitute for review.

### Runtime and control plane

- README states Supervisor/queue is IMPLEMENTED SCAFFOLD / NOT RUN; Worker is implemented for one DSH headless smoke profile only / NOT RUN; cloud runtime deployment NOT RUN.
- The current default-branch Supervisor has schedule/issues/workflow_run triggers and REST workflow dispatch; Worker exposes workflow_dispatch. The integrated reusable Worker boundary remains unresolved in open PRs.
- Default SHA check-runs include a successful Supervisor reconciliation heartbeat (run 42109516110). This is not a Worker execution, DSH probe, runner-resource qualification or pool deployment.
- Default SHA status endpoint returned pending with zero status contexts; no current-default exact-head contract CI result was established in this pass.

### Governance

Active Ruleset 26550182:
- enforcement: active;
- exact selector: `refs/heads/Основной`;
- pull request required;
- deletion and non-fast-forward blocked;
- required approving review count: 0;
- CODEOWNERS review: false;
- extra approval for unattributed changes: false;
- bypass actors: empty; current-user bypass: never.

Therefore independent review is not enforced by the current ruleset. Classic branch protection was not re-verified. The repository Actions variable `POOL_DISPATCH_ENABLED` was not read; its current live value is NOT VERIFIED. Dispatch remains BLOCKED regardless.

## Work completed in this pass

Created [Issue #22 — Build the primary secure web console for remote Developer Cloud Pool access](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22).

Issue #22 contains:
- owner priority and phased delivery sequence;
- versioned read-only Experience API requirements;
- browser auth/session and server-side authorization boundaries;
- requirement to select a persistent or managed service because GitHub Actions runners are ephemeral;
- prohibition on treating GitHub Pages/static assets as a trusted API/control plane;
- threat-model scope;
- reuse of PR #6 graphite UI;
- provenance-bearing live data and unavailable-state handling;
- separation of read-only experience from future controlled mutations;
- explicit exclusions for native iOS, external servers, secrets, model calls, paid fallback and dispatch;
- measurable acceptance criteria and required artifacts.

Issue #22 read-back: OPEN; URL above.

## Safety and execution record

- No Gemini controller invocation or child agent task.
- No Worker/DSH/Resource Probe/browser runtime or model/provider call.
- No secrets, provider credentials or Actions variables read or changed.
- No paid service selected or enabled.
- No deployment, merge or production mutation.
- No external server connected.
- No native iOS implementation started.

## Next step

Execute Issue #22 Phase A: compare maintained components and hosting patterns; create an ADR for a secure always-available Experience/API service; define a versioned read-only API, role matrix, threat model and deployment/rollback plan. Keep dispatch disabled and do not expose task mutation endpoints.

## Canonical references

- [Repository](https://github.com/VlDMlNSh/developer-cloud-pool)
- [Current canonical default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/%D0%9E%D1%81%D0%BD%D0%BE%D0%B9)
- [Issue #1 — governance gate](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [Issue #5 — ephemeral browser runtime design](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
- [Issue #21 — native iOS Mobile AI, deferred phase 2](https://github.com/VlDMlNSh/developer-cloud-pool/issues/21)
- [Issue #22 — primary web console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- [PR #6 — static graphite dashboard prototype](https://github.com/VlDMlNSh/developer-cloud-pool/pull/6)
- [PR #19 — continuation documentation branch](https://github.com/VlDMlNSh/developer-cloud-pool/pull/19)
