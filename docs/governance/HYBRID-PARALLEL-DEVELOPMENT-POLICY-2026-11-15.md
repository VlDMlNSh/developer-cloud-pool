# Hybrid Parallel Development Policy — 2026-11-15

**Status:** ADOPTED AS THE OPERATING POLICY FOR FUTURE /next PASSES; controller readiness and agent execution remain separately gated.
**Scope:** Contour A / Cloud Development Pool only. Contour B remains deferred until Contour A is ACCEPTED.

## 1. Decision

Adopt a hybrid parallel-development model. Each future /next pass must evaluate and, when the approved controller gates are satisfied, launch the available authorized Gemini agent batch while ChatGPT continues independent engineering and integration work. In parallel, progressively assemble and qualify the Cloud Development Pool itself, so that development moves from manually coordinated work toward governed pool-managed execution.

This is a policy for future passes, not evidence that agents have been dispatched or that the pool is deployed.

## 2. Required per-/next operating cycle

1. **Recover source of truth.** Read this policy and the GitHub Context Window; refresh default HEAD, relevant branches, open PRs/issues, exact-head CI, rulesets/governance, controller source and current executor availability. Pin an immutable 40-character target SHA for the pass.
2. **Select one primary vertical slice.** Choose the highest-priority open, unblocked Contour A task. Prefer integration and reuse of mature existing components over parallel duplicate proofs.
3. **Decompose independent work.** Prepare up to three bounded agent assignments with explicit objective, target SHA, input paths, allowed write scope, prohibited actions, acceptance criteria and evidence requirements. Avoid overlapping file ownership. Agent tasks must be independently useful and mergeable.
4. **Check dispatch gates before any launch.** Use only the approved MediaHub workflow .github/workflows/gemini-batch-dispatch-controller.yml on the trusted main ref. Do not call child workflows directly, bypass the controller, fabricate an individual assignment, or treat a plan as a dispatch.
5. **Dispatch when authorized.** When the live controller, required non-secret configuration, secrets availability (without reading or exposing values), caller identity, target SHA and all controller/security/governance gates are positively verified, trigger the controller's approved batch mode. Record controller run ID, child run/job IDs, target SHA, statuses, artifact IDs/digests and exact reports.
6. **Fail closed but keep working.** If any gate is missing, ambiguous, unavailable or not verified, record NOT RUN with the exact blocker. Do not retry through an alternate route or ask the owner to bypass a gate. Continue independent permitted ChatGPT work and safe repository-only research/tests.
7. **Run ChatGPT work in parallel.** Continue the primary vertical slice, integration, code review, local/no-provider tests, documentation and evidence collection without waiting unnecessarily for agents. Do not claim concurrent agent review of code that did not exist at the agent's immutable target SHA.
8. **Reconcile outputs.** Verify every result against its target SHA, changed-file scope, blob/commit SHAs, provenance, test commands and exact-head CI. Agent output is untrusted input until reviewed. No automatic merge, deployment, qualification or acceptance follows from agent success.
9. **Persist state.** Update the dated report/checkpoint and GitHub Context Window after each significant pass. Record assignments, dispatch status, run IDs, results, blockers, changed refs and the next bounded task.

## 3. Initial agent role model

Use three independent roles where controller capability and gates permit:

- **Agent 1 — Research and bounded implementation:** inspect canonical architecture/contracts, select one scoped implementation task, reuse existing components, produce a draft PR or evidence artifact. No merge, deployment, secret access, provider call or nested dispatch.
- **Agent 2 — Contract and test verification:** map acceptance criteria to source/contracts/tests, run or specify reproducible non-secret checks, inspect compatibility and regressions, report exact evidence. It must not claim to have reviewed Agent 1's new concurrent changes unless those changes were available at its target SHA and the task explicitly includes them.
- **Agent 3 — Security, authority and provenance audit:** adversarially inspect issuer/capability boundaries, least privilege, secret isolation, provider/model route, quotas, replay/revocation, provenance and governance. Report gaps and severity; no privileged action or independent-acceptance claim.

Assignments are proposals until the controller confirms dispatch. If only one or two roles are enabled, use only those and mark the rest NOT RUN; never fabricate runs or results.

## 4. Progressive agent and capacity onboarding

Additional model providers, API routes and execution capacity are admitted one at a time only after documenting and verifying:

- provider and account identity, ownership and permitted purpose;
- provider/model allowlist and data handling policy;
- credential handle and secret-store boundary (never expose credential values);
- capability scope, issuer authority, expiry and revocation;
- quota domain, rate/cost limits and explicit no-paid-fallback rule;
- immutable task target, isolated runtime and evidence format;
- exact tests, monitoring and rollback/removal procedure.

Do not infer that a registered key works, belongs to the intended account, or authorizes a route. No provider key is copied into prompts, Issues, artifacts, logs or another agent's context. No proxy/VPN/region-spoofing or policy circumvention. Free-tier constraints remain mandatory; paid fallback and charge-incurring resources are prohibited under the current policy.

## 5. Progressive Cloud Pool deployment

Develop and validate the pool in deployable vertical slices, rather than waiting for all components to be complete:

1. **Repository-only foundation:** task contracts, immutable SHA, governance, D1 proof, evidence and CI.
2. **Local/no-provider integration:** D1 → Supervisor → Worker lifecycle, claims/leases, idempotency, cancellation, recovery and evidence.
3. **Hosted readiness:** prove the free-tier hosting/runtime path, resource limits, secrets isolation, migrations, rollback and state persistence design. Do not provision charge-incurring resources.
4. **Controlled hosted deployment:** only after explicit deployment-readiness gates pass; verify health, authenticated web access from phone/desktop, persistence and recovery.
5. **Executor onboarding:** first non-secret read-only smoke, then narrowly scoped authorized task execution, then additional providers/models individually.
6. **Operational qualification:** end-to-end task execution, quota enforcement, routing, audit, isolation, persistence, recovery and independent acceptance.

A working prototype, successful CI, or an agent's report is not production deployment. Do not activate dispatch or provider execution while governance/readiness gates remain closed.

## 6. Authority and safety invariants

- Gemini dispatch is exclusively through VlDMlNSh/mediahub-os/.github/workflows/gemini-batch-dispatch-controller.yml on trusted main, subject to its live contract and gates.
- The controller's probe mode is non-launching. Probe success is not agent execution.
- Never invoke child workflows directly or use another workflow to bypass the controller.
- Do not read, print, copy or expose secret values. Configuration presence may be verified only through approved non-secret checks.
- Preserve distinct issuer, capability, task, repository, account and product-state authorities. Technical ability is not authorization.
- Agent tasks may create bounded draft changes/evidence only. Merge, deployment, provider calls, secret access, governance changes and qualification remain separate gates.
- Keep Contour B and MediaHub product development blocked until Contour A is formally ACCEPTED.

## 7. Reporting vocabulary

Use only evidence-backed states: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

Every agent batch record must include target SHA and controller workflow ref; controller run ID and child run/job IDs when dispatched; agent role and exact task scope; execution status; changed commit/blob SHAs or artifact IDs/digests; exact-head CI and verification evidence; blockers and follow-up.

A missing run ID, missing artifact, empty review, unavailable CI result or ambiguous permission is NOT VERIFIED, not success.

## 8. Baseline at adoption

At the 2026-11-15 policy adoption snapshot:

- Cloud Pool default branch: Основной.
- Last observed default HEAD from repository commit search: 9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc.
- Latest documented PR #87 state: draft/unmerged isolated D1 proof; 119 Workers-runtime tests and named exact-head workflows were recorded successful in the preceding checkpoint, while hosted D1, deployment, provider calls, secret reads, dispatch, Supervisor/Worker execution and independent acceptance remained not run.
- MediaHub Gemini controller source was read at main@0a1246f6755020faf8b7e48d07bfff790bbaece3. Its contract defines probe, agents and review modes, a confirm input, trusted-main restrictions and a batch-enable variable. This source read does not prove live variable/secrets readiness or successful dispatch.
- The latest recorded operational evidence says trusted-main no-secret probe, effective configuration, owner-triggered dispatch and child runs were not verified/run; Gemini bridge remains not qualified. Recheck live state on every /next.

This baseline is historical and must be refreshed before use. It must not be represented as a live state after this commit.

## 9. Canonical navigation

- Cloud Pool repository: https://github.com/VlDMlNSh/developer-cloud-pool
- GitHub Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/context/GITHUB-CONTEXT-WINDOW.md
- Cloud Pool supervisor/recovery architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Gemini controller: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- Contour A tracker: https://github.com/VlDMlNSh/mediahub-os/issues/301
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md