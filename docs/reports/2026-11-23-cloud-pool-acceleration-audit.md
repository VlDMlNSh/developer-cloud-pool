# Cloud Development Pool — acceleration and architecture audit

**Snapshot:** 2026-11-23  
**Priority:** Contour A only. Contour B remains deferred.  
**Audit type:** GitHub state, architecture, delivery process, OSS reuse, free-tier feasibility and critical-path review.  
**Status:** Findings VERIFIED only for the inspected repository refs and external documentation; proposed changes are not yet adopted governance or runtime implementation.

## 1. Executive decision

The project has substantial engineering evidence, especially around admission integrity, D1 persistence, replay protection, attempt leases, fencing and fail-closed behavior. The primary delay is no longer a lack of design ideas. It is the distance between isolated proof branches and one integrated, deployed, independently reviewed vertical slice.

**Recommended strategy: stop expanding the platform horizontally and complete one narrow vertical slice.**

The first accepted product should be:

1. One owner-authenticated mobile/desktop web console.
2. One canonical owner-only `/next` admission path.
3. One durable task/attempt ledger.
4. One qualified executor profile and one bounded task lifecycle.
5. Read-only status/log/evidence projection into the UI.
6. Explicit quota, capability, secret and audit controls.
7. Independent security/governance review and acceptance evidence.

Do not add more provider routes, more agent slots, multi-account tenancy, shared GPU scheduling, media workflows, browser automation or a second orchestration framework before this slice is accepted.

## 2. GitHub state observed

### Repositories

- Cloud Pool: https://github.com/VlDMlNSh/developer-cloud-pool — public; default branch `Основной`; repository size reported as 9,236 KB.
- MediaHub OS: https://github.com/VlDMlNSh/mediahub-os — separate public repository; default branch `main`; Contour B is not active.
- Cloud Pool default HEAD observed: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Cloud Pool's default Context Window blob observed: `d8580c147ef3ed25e2fa3aa42c5706bfe3d83a01`; it still has a stale top-level refresh marker dated 2026-11-08 and does not contain Pass 51.
- Engineering documentation branch: `docs/engineering-excellence-2026-11-23`; its Context Window blob `9f8513216e89858e8c3c3c8901350e6cf64b7aa2` contains Pass 51, but remains on an unmerged branch.
- Branch inventory: two pages returned 100 + 75 branch names (175 observed). The search interface returned 100 open PR records at its requested page size; treat this as a retrieved sample/cap, not a claim that exactly 100 are open.
- Open issue search returned 15 current records. Repository metadata's `open_issues_count` includes pull requests, so it is not a pure issue count.

### Key pull requests

| PR | Scope | Observed state | Audit interpretation |
|---|---|---|---|
| [#168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168) | Current-base D1 proof integration / Pass 48, updated through Pass 51 | OPEN / DRAFT / UNMERGED; head `ec1caca61caa453d4e0ce5405890e8791f6bfd29`; base `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`; 33 files, +6,877 | Main implementation candidate, but its base is two documentation commits behind current default. Formal reviews: 0. |
| [#169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169) | Engineering Excellence 1.0 documentation | OPEN / DRAFT / UNMERGED; head `d7cdee8bdff5dd1d11fc0b042a1d544c433d15c7`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; 16 files, +1,019 | Correct current-base documentation branch; exact-head CI and formal review not verified. |
| #165/#166 | Issuer-bound indeterminate reconciliation and validation | OPEN / DRAFT / UNMERGED | Evidence branch still separate from #168; must be reconciled by source/migration overlap, not assumed to be included. |
| #148–#164 | Clean-base D1, executor identity, canonical task key, admission, migrations, SQL guards, lease adapter and validation | Multiple OPEN / DRAFT / UNMERGED stacked PRs | A long stacked series creates review, merge-base and CI ambiguity. One canonical integration chain must own the final schema and adapters. |
| #167 | Pass 40 JWT/JWKS research | OPEN / DRAFT / UNMERGED; old base | Research candidate, not a production verifier qualification. |
| #6 | Static Jarvis mobile dashboard prototype | OPEN / DRAFT / UNMERGED; created 2026-11-04 | Earliest observed web-UI work in the inspected PR sample; static fixtures only, not a live authenticated console. |

PR #168's recorded merge-result SHA is `76b0283e9904226cb485db0c40ea69da9f46d727`; no workflow runs were returned for that merge-result SHA. The D1 and Pool Contract workflows were instead observed successful on PR head `ec1caca...`. Do not describe that as merge-result CI.

### Critical GitHub/governance observations

- Issue [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140) is the correct current integration objective: one current-default-based D1 admission/lease proof chain, not parallel controllers or duplicate stores.
- Issue [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) defines owner-only `/next` admission. A fresh read of its 2026-11-17 owner scope correction confirms that the first CODE executor is Claude Code + ECC + FCC via a separately verified free route; Gemini agents are optional supplementary workers, and four Gemini children are not a mandatory launch requirement.
- **Correction to this audit:** the earlier claimed three-vs-four Gemini topology conflict was incorrect. Do not make Gemini a launch dependency or spend critical-path time changing its child count. First qualify the owner-frozen CODE executor and preserve all existing controller/security gates.
- Issue [#1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1) records an active ruleset and historical `POOL_DISPATCH_ENABLED=false` readback. Those details are historical; current effective ruleset conditions and current variable state were not re-read in this audit. Never inspect secret values.
- PR #168 and #169 both have zero formal review submissions in the last review read. A successful CI run is not an independent review.
- The Context Window is very large (default copy approximately 332k characters; documentation branch copy approximately 352k characters). This makes every context restoration and review more expensive and increases the chance that stale statements dominate current state.

## 3. What is actually achieved — and what is not

### Achieved with inspectable evidence

- A broad fail-closed admission and task-lifecycle design exists.
- D1 proof work has addressed atomic admission, receipts, outbox binding, executor-bound identity, attempt lifecycle, SQL fencing, replay/readback and reconciliation.
- Pass 51 removed caller-supplied `input.now` as the lease time authority in the adapter.
- Pass 51 added five adversarial trusted-clock cases.
- PR #168 exact-head D1 workflow: run [45227149858](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45227149858), SUCCESS; job log reported 6 test files and 68 tests passed.
- PR #168 exact-head Pool Contract Validation: run [45227149883](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45227149883), SUCCESS; dispatch-disabled and workflow/security contract steps passed.
- The implementation remains deliberately inert: `proofs/d1-ledger/src/worker.mjs` returns 404 and exposes no HTTP ingress, provider client, GitHub mutation or dispatch capability.
- The lease adapter is not wired to a production worker. Its tests inject a trusted clock; the actual controller/runtime clock provider and its provenance are NOT VERIFIED.
- Reuse First candidates have been researched, but the reviewed candidates are not automatically approved runtime dependencies.

### Not achieved / not verified

- No accepted, deployed, authenticated web console usable from phone and desktop.
- No production or non-production Cloud Pool execution runtime proven end-to-end.
- No qualified live executor, model/provider route or quota reservation path.
- No production controller binding the trusted GitHub event envelope to the D1 admission chain.
- No actual controller/runtime clock provenance qualification.
- No independent security review for PR #168/#169 in the latest review reads.
- No verified current merge-result CI for PR #168.
- No verified Cloudflare free-plan resource entitlement/deployment in this audit.
- No verified persistent remote Engineering Workspace host and Zero Trust access; Issue #118 records this as deferred and prior host evidence as unavailable/offline.
- No end-to-end state recovery, revocation and audit proof across the actual deployed web/API/worker path.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## 4. Time and progress analysis

The earliest observed Cloud Pool UI PR in this audit sample, PR #6, was created on 2026-11-04. PR #168 and #169 were created on 2026-11-23. This establishes **at least a 19-calendar-day observed engineering window** for the currently inspected delivery history, not 19 days of continuous labor.

GitHub commit/PR counts cannot establish active engineering hours. The available history does not provide a complete time ledger for planning, chat analysis, coding, review, CI waiting, rework and owner decisions. Therefore:

- Calendar span: approximately 19 days from earliest inspected PR to this snapshot.
- Verified active engineering hours: NOT AVAILABLE.
- Verified external waiting hours: NOT AVAILABLE.
- Verified rework hours: NOT AVAILABLE.
- Exact remaining hours to ACCEPTED: NOT ESTIMABLE from available evidence.

Do not reuse earlier hour forecasts as measured facts. Start a pass-level time ledger now, with separate active work, test/CI runtime, external wait and rework. After 5–10 comparable passes, estimate throughput and remaining critical-path effort as a range with confidence.

The main progress metric should change from “number of passes / files / PRs” to **acceptance evidence closed per critical-path dependency**.

## 5. Architecture comparison and reuse-first decision

### Recommended target stack

| Layer | Recommended choice | Decision |
|---|---|---|
| Remote web UI + API | Existing Hono prototype + Cloudflare Workers Static Assets | REUSE / ADAPT. Do not create a second UI or second API framework. |
| Durable control state | Existing D1 proof chain | REUSE / CONSOLIDATE. One schema and one authority path only. |
| Asynchronous transport | GitHub Actions for bounded ephemeral execution; optionally Cloudflare Queues for small wake-up messages | REUSE / QUALIFY. D1 remains source of truth; a queue is not the durable task ledger. |
| Execution | One explicitly qualified executor on an ephemeral GitHub-hosted runner, initially non-dispatching until gates pass | BUILD only the smallest adapter around an existing executor; no general-purpose agent platform yet. |
| Model gateway | Defer multi-provider gateway until one route is qualified | Do not deploy LiteLLM into the Workers edge. Reuse its route/account/budget concepts and only evaluate a self-hosted proxy if a persistent host is later qualified. |
| Durable workflow engine | Existing D1 state machine + GitHub Actions initially | Do not add Temporal or Cloudflare Workflows to the MVP without a cost and operations decision. |
| Browser automation | Existing agent-browser assessment | Defer until the first executor and sandbox are accepted. |
| Multi-account / GPU | Issue #151 | Future phase only, after Contour A acceptance. |

### OSS candidates

**OpenHands / Agent Canvas — REUSE AS A REFERENCE, NOT AS THE CONTOUR A RUNTIME.** Its frontend/backend separation, Agent Server API, automation service and Docker sandbox model are useful references. Its self-hosting guide warns that an agent server can access the host filesystem, execute shell commands and reach the network; the VM, firewall, authentication and workspace boundaries are therefore part of the threat model. It requires a persistent host and configured model route, so it does not solve the GitHub-Free-only execution and hosting problem by itself.

- Architecture: https://github.com/OpenHands/OpenHands/blob/main/docs/architecture.md
- Self-hosting: https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md
- Docker sandbox: https://github.com/OpenHands/docs/blob/main/openhands/usage/sandboxes/docker.mdx
- Official Agent Canvas walkthrough: https://www.youtube.com/watch?v=FpO-4bbM8Ko

**Coder — REUSE ARCHITECTURAL PATTERNS ONLY.** Its Terraform-defined workspaces, identity-aware agent actions, secure WireGuard connectivity and idle shutdown are strong patterns. Its main repository is AGPL-3.0 and it expects infrastructure to run workspaces. This is not a drop-in free GitHub-hosted runtime; evaluate license and hosting implications before any adoption.

- Repository: https://github.com/coder/coder
- Documentation: https://coder.com/docs

**Temporal — REUSE DURABLE-EXECUTION CONCEPTS, NOT THE SERVER FOR MVP.** Event history, replay, retries, timers and recovery are relevant design patterns. A self-hosted Temporal service adds an additional server/database/operations surface. The current D1 proof already targets the required minimal state machine, so adopting Temporal now would duplicate orchestration and slow acceptance.

- Durable execution: https://docs.temporal.io/durable-execution
- Self-hosted guide: https://docs.temporal.io/self-hosted-guide
- Repository/license: https://github.com/temporalio/temporal

**LiteLLM — REUSE ROUTING AND QUOTA DESIGN, DEFER DEPLOYMENT.** It provides a broad provider abstraction and account/key-level budgets and rate limits. Its documented budget configuration uses PostgreSQL, and fallback behavior must be explicitly disabled where a hard route cap is required. It is not a native fit for a small Cloudflare Worker API without a separate persistent service/database. It also cannot prove that an upstream provider route is free or that two keys have independent quotas.

- Repository: https://github.com/BerriAI/litellm
- Budgets/rate limits: https://docs.litellm.ai/docs/proxy/users

**Cloudflare-native components — REUSE.** Official Cloudflare guidance recommends Workers Static Assets for new static/full-stack apps and demonstrates a Worker API with Hono and D1. This matches the existing prototype direction and avoids a second application stack.

- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Hono + D1 API tutorial: https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/
- Workers/Vite tutorial: https://developers.cloudflare.com/workers/vite-plugin/tutorial/

### Free-tier reality — do not assume “included” means unlimited or zero-risk

As of the inspected official documentation:

- GitHub standard-hosted runners are free for public repositories; the documented standard-runner concurrency for Free is 20. Public repository runner usage and private repository included minutes are different cases.
- Cloudflare Workers Free documents 100,000 requests/day and 10 ms CPU time per invocation. This is suitable for a small control API, not for running a coding agent or long tasks inside a request.
- D1 Free documents 5 million rows read/day, 100,000 rows written/day, 500 MB per database, 5 GB total account storage and 10 databases.
- Queues Free documents 10,000 standard operations/day and 24-hour message retention. Treat it as transport, not the only durable record of a task.
- Cloudflare Workflows is available on Free, but billing for steps and storage began on 2026-08-10. Do not assume a Workflow-based design is zero-cost. Verify the exact account entitlement and usage before use.

Official sources:
- GitHub Actions billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Queues pricing: https://developers.cloudflare.com/queues/platform/pricing/
- Workflows pricing: https://developers.cloudflare.com/workflows/reference/pricing/

A service can be open source and still require paid compute, model calls, storage or networking. A free software license is not proof of a free operating cost.

## 6. Main inefficiencies and corrective decisions

### E1 — Too many parallel D1 PRs and branch stacks

**Impact: CRITICAL.** There are many open, stacked PRs covering adjacent migrations, task identity, admission, lease, fencing, reconciliation and validation. This makes it difficult to know which schema and adapter are authoritative, creates stale bases and increases the risk of testing a merge result that differs from the intended integration.

**Correction:**
- Freeze new D1 feature branches except the active canonical integration branch.
- Use Issue #140 as the sole D1 integration objective.
- Build one matrix mapping each candidate PR to migrations, source files, tests, base SHA, exact-head CI and whether its changes are included in #168.
- Select one canonical migration lineage and one adapter path.
- Port only missing, non-duplicated changes into the canonical branch.
- Mark duplicates/superseded PRs as such and close them only after their unique evidence has been preserved.
- Require one implementation PR plus one validation-only PR only where the workflow architecture genuinely requires it.
- Do not stack more than one dependent PR layer without a written reason and merge order.

### E2 — Context Window is too large and stale at the top

**Impact: HIGH.** The current Context Window is hundreds of thousands of characters and contains long historical wave narratives. It is a valuable archive but an expensive operational prompt and has a stale refresh header on default.

**Correction:**
- Keep a concise, current operational front section: current SHA, phase, active PR/Issue, gates, blockers, metric snapshot and next step.
- Move completed historical wave details into dated report/archive documents without deleting history.
- Keep the Context Window as an index plus current snapshot, not a copy of every historical report.
- Add a deterministic validation that checks referenced files/PRs/SHAs exist and that the refresh timestamp is current.
- Update the top-level state on every significant pass; never rely only on an append at the end.

### E3 — Design and proof are ahead of runtime

**Impact: CRITICAL.** The D1 Worker entrypoint is intentionally inert. The trusted-clock adapter is tested with an injected function but is not connected to an actual controller/runtime. The UI is a static/prototype direction, not an authenticated deployed control plane.

**Correction:**
- Stop adding deeper ledger features until one integration chain is assembled.
- After #168 is synchronized and independently reviewed, add the thinnest non-production controller adapter that binds trusted GitHub event context to the D1 admission path while keeping dispatch false.
- Prove the clock source at the controller boundary, not just the adapter seam.
- Then implement one real non-production executor handoff with a no-secret or owner-approved bounded test.
- Keep the worker sandbox separate from the API/control Worker.

### E4 — UI, identity and deployment are not on the critical path yet

**Impact: CRITICAL for final acceptance.** Issue #22 remains open. The existing static dashboard does not show a live pool. Cloudflare free entitlement, deployed Worker, domain/Access and authenticated browser QA were not verified in this audit.

**Correction:**
- Reuse the Hono/Workers Static Assets prototype.
- Implement GitHub OAuth server-side, owner numeric-ID authorization, opaque HttpOnly/Secure/SameSite session cookie, CSRF/origin checks, revocation and bounded read-only API.
- Keep all mutation/approval/dispatch UI routes unavailable until the separate gates pass.
- Deploy only a non-production environment after current Cloudflare plan, spending ceiling, account resources and access are verified.
- Test the same URL from phone and desktop; test session expiry/revocation and no token exposure in browser, logs or artifacts.

### E5 — Provider routing and quota research is too broad for the first acceptance slice

**Impact: HIGH.** Issue #26 records 24 credential slots and multiple account boundaries, but the Cloud Pool has not yet qualified one end-to-end provider/executor route. Each extra route multiplies identity, quota, cost and failure-mode work.

**Correction:**
- Freeze one first executor profile and one provider route for qualification.
- Treat every account/key slot as a distinct route identity; never merge quotas by provider name.
- Require current provider evidence for free entitlement, reset window, RPM/TPM, model eligibility, account/project identity and terms.
- Implement a hard deny when route qualification or quota evidence is missing.
- Add a second route only after the first route passes end-to-end tests and independent review.
- No paid fallback, silent fallback, quota evasion or key rotation to bypass provider limits.

### E6 — Optional supplementary agents; do not block first executor

**Impact: MEDIUM.** Issue #96's 2026-11-17 owner correction makes Gemini optional and identifies Claude Code + ECC + FCC as the first CODE executor via a separately verified free route. The earlier three-vs-four conflict claim was incorrect.

**Correction:**
- Keep Gemini supplementary and task-specific; do not require Gemini dispatch for Contour A's first executor milestone.
- Preserve the approved controller, exact target SHA, least-privilege role envelopes, artifact provenance and no-secret constraints whenever supplementary agents are used.
- Keep primary implementation under one canonical branch owner; do not have multiple agents edit the same migration/state machine.
- If gates are not passed, agent runs remain NOT RUN with the exact blocker.

### E7 — Time/progress metrics measure activity rather than acceptance

**Impact: MEDIUM/HIGH.** Pass counts, file counts and PR volume do not measure time-to-acceptance or defect closure.

**Correction:**
- Record active engineering time, test execution, CI queue, CI runtime, external wait and rework separately for every pass.
- Track critical-path lead time and acceptance evidence closure.
- Record defect age/severity, PR age, stale-base count, duplicate branch count, first-pass CI rate, rework ratio and review latency.
- Do not add analytics services or databases just for metrics; begin with a compact Markdown/CSV ledger and GitHub Actions metadata already available.

## 7. Unified critical-path plan

| Order | Work package | Exit evidence | Priority |
|---:|---|---|---|
| 0 | Preserve Issue #96 owner scope: first CODE executor; Gemini optional | Verify free route, host/sandbox identity and quota; no dispatch | BLOCKING |
| 1 | D1 branch/PR consolidation under Issue #140 | One canonical migration chain; overlap matrix; current default base | CRITICAL |
| 2 | Trusted-clock runtime qualification | Real controller clock source, monotonicity/rollback behavior and adversarial tests | CRITICAL |
| 3 | Exact integration CI and independent security review | Current-head and merge-result CI; review; ruleset/provenance evidence | CRITICAL |
| 4 | Owner-only /next controller adapter, still non-dispatching | Trusted event fields, replay/idempotency, full readback, fail-closed tests | CRITICAL |
| 5 | Authenticated web console on verified free hosting | Mobile/desktop UI, OAuth/session/revocation, read-only live status | CRITICAL |
| 6 | One executor sandbox qualification | Identity/capability binding, isolation, bounded resources, no secret leakage | CRITICAL |
| 7 | One non-production end-to-end lifecycle test | Admission → lease → executor → result → audit → recovery, owner-approved and no paid path | CRITICAL |
| 8 | Independent acceptance review | Published evidence for UI, state, routing, quotas, security, audit and recovery | ACCEPTANCE |
| 9 | Golden deployment kit / multi-account / GPU / MediaHub | Start only after Contour A ACCEPTED | DEFERRED |

**Explicitly defer:** multi-account control planes and shared GPU scheduling (Issue #151), broad provider routing (Issue #26), browser automation as a core dependency, media assistant work, native iOS and any Contour B product scope.

## 8. Definition of Done for the first integrated slice

The first slice is complete only when all of the following are demonstrated against one immutable target:

- Owner-only event admission from the exact control issue and exact `/next` body.
- Trusted repository/owner identity, event type, default-branch ref/SHA, workflow SHA, run ID/attempt and source comment ID.
- Idempotent durable admission, one-shot approval semantics, task/outbox linkage and primary readback.
- Authenticated executor identity bound to capability, task and attempt.
- Trusted clock sourced from the actual runtime; no caller-controlled time.
- Lease expiry and fencing prevent stale worker mutation.
- Authenticated remote UI works on phone and desktop.
- Browser receives no PAT, GitHub App private key, provider key or privileged workflow token.
- Durable state, revocation, recovery and audit are tested.
- Provider route and quota evidence are current and account-specific; unknown means deny.
- Free-tier limits and cost ceiling are verified; no paid fallback.
- Exact-head and merge-result CI are green; independent review and governance gates pass.
- All dispatch remains disabled until the explicit owner-approved non-production test window and its gates are satisfied.

## 9. Learning resources: official docs and selected videos

Use official documentation as the source of truth; videos are orientation and must not replace version-pinned docs or test evidence.

1. Cloudflare Developers — [Cloudflare Workers Explained](https://www.youtube.com/watch?v=WDhruDqb5nM), 2026-06-23. Covers Workers, Hono, D1 and bindings.
2. OpenHands — [Agent Canvas v1 setup walkthrough](https://www.youtube.com/watch?v=FpO-4bbM8Ko), 2026-06-16. Useful for frontend/backend separation and setup flow; its runtime still needs a persistent host.
3. Community demo — [OpenHands self-hosted issue-to-PR walkthrough](https://www.youtube.com/watch?v=QdEVtqJDrdI), 2026-06-23. Demonstration only; it uses a VPS and a model route, so it is not evidence of a free GitHub-only deployment.

Official guides:
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Cloudflare D1 API tutorial with Hono](https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/)
- [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [GitHub Actions limits](https://docs.github.com/en/actions/reference/limits)
- [OpenHands self-hosting security and deployment](https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md)
- [Temporal durable execution](https://docs.temporal.io/durable-execution)
- [LiteLLM budgets and rate limits](https://docs.litellm.ai/docs/proxy/users)
- [Coder architecture and workspace docs](https://coder.com/docs)

## 10. Decisions recommended for adoption

1. **Adopt one vertical-slice acceptance strategy**; reject new architecture expansion until it is complete.
2. **Make Issue #140 the single canonical D1 integration workstream**; pause competing D1 branches pending overlap triage.
3. **Make PR #168 the current candidate, not accepted code**; synchronize its base, qualify actual runtime clock, verify merge-result CI and obtain independent review before merge.
4. **Keep PR #169 documentation-only**; review/merge it separately after exact-head CI and governance review. Do not couple documentation acceptance to code acceptance.
5. **Reuse Hono + Workers Static Assets + D1** for the web control plane, subject to actual free-plan and access verification.
6. **Do not adopt Temporal, Coder, OpenHands Agent Server or LiteLLM as new runtime dependencies for MVP**. Reuse their architecture patterns selectively.
7. **Qualify the owner-frozen first CODE executor (Claude Code + ECC + FCC) via a verified free route; keep Gemini optional**.
8. **Defer multi-account, GPU, broad provider and MediaHub work until Contour A is ACCEPTED**.
9. **Replace pass-count forecasting with evidence-based time accounting and critical-path forecasting**.
10. **Compact Context Window without losing history**: active summary first, historical reports linked, append-only archive retained.

## 11. Audit evidence and limitations

Primary repository evidence:
- [Cloud Pool repository](https://github.com/VlDMlNSh/developer-cloud-pool)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Issue #22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- [Issue #26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)
- [Issue #118](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118)
- [Issue #133](https://github.com/VlDMlNSh/developer-cloud-pool/issues/133)
- [PR #168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168)
- [PR #169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169)
- [Pass 51 report](2026-11-23-pass51-d1-trusted-clock-remediation.md)

This is a source-level and GitHub metadata audit. It did not inspect secret values, perform provider calls, dispatch agents, deploy services, mutate Cloudflare resources, run production workloads or merge PRs. Current Cloudflare account entitlement, current ruleset conditions, current dispatch variable, actual runtime host and production clock provenance remain NOT VERIFIED.

**Final assessment:** the project has a substantial security/proof foundation but is not yet a running, accepted cloud development pool. The fastest safe route is not another large architecture pass: it is consolidating the existing D1 work, qualifying one real runtime path, delivering the authenticated web surface and closing the acceptance evidence in dependency order.

Canonical Context Window: ../context/GITHUB-CONTEXT-WINDOW.md  
Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Correction addendum — Pass 52 (2026-11-23)

A fresh read of Issue #96's 2026-11-17 owner scope correction disproves the earlier three-vs-four Gemini conflict statement. First executor is Claude Code + ECC + FCC using a separately verified free route; Gemini is optional and not a launch dependency. The canonical D1 candidate is PR #168; see [Pass 52 consolidation report](2026-11-23-pass52-canonical-d1-consolidation.md). A further HIGH blocker was found in `admitQualifiedTask`: it still accepts caller-controlled `input.now` and omits explicit `executionAuthorized:false` on deny/success results. Do not mount or enable this adapter before Pass 53 remediation.
