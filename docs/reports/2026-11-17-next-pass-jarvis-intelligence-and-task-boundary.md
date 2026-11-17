# Cloud Pool /next Engineering Pass — Jarvis Intelligence and Execution Authority Boundary

**Date:** 2026-11-17  
**Scope:** Contour A only; architecture clarification against the existing owner-approved baseline.  
**Disposition:** DESIGN NOTE RECORDED; no runtime implementation or tests performed. Contour A remains NOT ACCEPTED.

## 1. Immutable repository state at start of pass

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Documentation branch: `docs/next-2026-11-16-current-state-refresh`
- Documentation branch HEAD before this pass: `85e285fbd2742da8d5376c6038b7962345d522ab`
- Documentation PR #113: OPEN / DRAFT / UNMERGED; head `85e285fbd2742da8d5376c6038b7962345d522ab`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- First executor PR #116: OPEN / DRAFT / UNMERGED; head `596c03e19b4662f69a9b40791299f55afb9a928e`.
- Active ruleset: #26550182, `Основной — verified`, enforcement active. This read did not establish required approvals/status contexts; do not infer them.
- Latest exact-head runner qualification: run [44076256742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742), SUCCESS on PR #116 head above.
- Latest exact-head Pool Contract Validation: run [44076256865](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256865), SUCCESS on the same head.
- Latest observed default-branch Pool Supervisor run: [44078065204](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44078065204), SUCCESS on default HEAD.
- The successful runner and contract checks prove only the recorded no-secret installation/loopback lifecycle and contract checks. They do not qualify a provider route, Claude Code task, Jarvis deployment, durable A0 admission, or Contour A.

## 2. Existing architecture baseline preserved

The pass does not replace or amend the owner-approved architecture freeze or implementation roadmap:

- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Implementation Roadmap](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md)

The first delivery remains one GitHub-hosted ephemeral CODE executor: Claude Code CLI + selected ECC toolkit + FCC + one explicitly qualified free API route. GitHub Actions runners remain ephemeral. Jarvis begins within the GitHub-only static PWA / GitHub-native boundary. No permanent host, external paid service, Gemini wave, or Contour B dependency is introduced by this note.

## 3. Jarvis logical decomposition (design clarification, not deployed services)

The architecture discussion separated four logical responsibilities:

1. **Intelligence:** interpret user intent, produce a plan, decompose work, and explain uncertainty. Model output is advisory and untrusted.
2. **Orchestration:** persist task/attempt state, schedule admitted work, manage timeouts/cancellation/retries, and collect results.
3. **Governance:** validate trusted issuer, subject, capability, scope, target SHA, quota reservation, and policy before execution. Intelligence cannot bypass this boundary.
4. **Observability and recovery:** report VERIFIED / INFERRED / UNKNOWN states, reconcile interrupted attempts, and recover only operations proven safe to retry.

These are logical responsibilities, not a mandate for four separate processes or services. The deterministic orchestration and governance layers must remain authoritative; an LLM must not be the source of truth for authorization, task state, quota accounting, or acceptance.

## 4. Proposed control-flow invariant

`User request → plan proposal → policy/admission decision → durable task/attempt record → bounded executor → evidence collection → independent verification → result projection`

- A rejected or unresolved policy decision fails closed.
- A model-generated plan cannot grant itself permissions.
- Executors cannot certify their own output as accepted.
- Retries must be idempotent or require reconciliation when external side effects are indeterminate.
- Evidence must bind the immutable target SHA, task ID, attempt ID, executor/runtime identity, run/job IDs, changed paths, test outcomes and artifact digests where applicable.
- User-visible status must distinguish VERIFIED, INFERRED and UNKNOWN; absence of evidence is not success.

## 5. Task Envelope direction — intentionally not frozen

The next design/implementation pass should inspect and reuse the existing Pool A0 task, admission, lease, attempt and evidence contracts before proposing a new envelope. Candidate envelope concerns to reconcile include:

- stable task identity and source event/idempotency key;
- trusted issuer/subject and capability reference (not caller-asserted privilege);
- immutable repository/ref/target SHA;
- bounded objective, allowed paths, tools, network/egress, runtime and time/resource budgets;
- executor profile and versioned capability requirements;
- attempt/lease generation and fencing token supplied by the trusted admission layer;
- explicit success criteria and independent verifier requirements;
- evidence references and terminal/reconciliation state.

No new production schema, authority field, dispatch behavior, or workflow was implemented in this pass. Do not treat this list as an approved wire contract until reconciled against the existing A0/D1 contracts and tested.

## 6. FCC source/license observation

The pinned FCC source project at commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` has `AGPL-3.0-only` declared in its `pyproject.toml`. This is a verified source-metadata observation, not legal advice. License obligations should be reviewed before distribution, modification, or network-service deployment. Installation and loopback health do not prove Claude Code protocol compatibility or a working provider route.

## 7. Security and autonomy boundaries

Jarvis may independently analyze, plan, diagnose, propose bounded corrections, and request execution through the trusted admission path. It must not autonomously:

- grant or expand its own capabilities;
- create/read/reveal provider credentials or GitHub secrets;
- alter governance, protected-branch policy, or dispatch enablement;
- bypass issuer/capability checks, quota reservations, or no-paid-fallback policy;
- approve its own PR or mark its own work independently verified;
- silently change provider account, route, quota domain, or external side-effect policy.

Credential material remains outside model prompts, browser assets, untrusted code, logs and artifacts. Only narrowly scoped credentials may be injected into a trusted executor boundary after admission gates pass.

## 8. Verification and dispatch disposition

- Architecture discussion: RECORDED as a design clarification.
- Code changes: NONE.
- Automated tests: NOT RUN (documentation-only pass).
- Live provider calls: NOT RUN.
- Gemini four-agent dispatch: NOT RUN. The approved Cloud Pool four-child controller is not present on the observed default branch; dispatch remains disabled. No secret values were read.
- Claude Code task through FCC: NOT RUN.
- Independent security review of PR #116: NOT VERIFIED.
- Contour A: NOT ACCEPTED.
- Contour B: DEFERRED.

## 9. Next bounded step

Inspect the current Pool A0/D1 task envelope, event provenance, admission receipt, lease/fencing, attempt ledger and evidence contracts on their exact refs. Produce a field-by-field compatibility matrix against the candidate Task Envelope above. Only then decide whether a narrow schema clarification is needed. Keep production dispatch disabled until all admission, worker identity, route, quota, and independent review gates are qualified.

## 10. Evidence links

- Default branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной
- Documentation PR #113: https://github.com/VlDMlNSh/developer-cloud-pool/pull/113
- Executor PR #116: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116
- Exact-head runner run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256742
- Exact-head contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44076256865
- Canonical Context Window: ../context/GITHUB-CONTEXT-WINDOW.md
