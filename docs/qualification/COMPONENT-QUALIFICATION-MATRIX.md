# Developer Cloud Pool — Component Qualification Matrix

- Matrix ID: `developer-cloud-pool-component-qualification`
- Schema: `1.0.0`
- Snapshot: 2026-11-14
- Branch: `docs/unified-cloud-pool-jarvis-plan-2026-11-14`
- Records: **25**
- Dispatch: **disabled**
- Secret values in matrix: **none**

> This is a decision/evidence register, not an installation manifest. `SELECTED` means selected for a bounded architectural role; it does not mean installed, runtime-tested, security-qualified or production-ready. Every candidate remains ineligible for production until its version, license, security review, resource profile, provider authentication and independent verification have evidence.

## Decision matrix

| Component / upstream | Decision | Runtime status | Version / pin | Next qualification gate |
|---|---|---|---|---|
| [GitHub-hosted Actions runner](https://github.com/actions/runner-images) | SELECTED_BOOTSTRAP | NOT_RUN_FOR_MULTI_AGENT_PROFILE | ubuntu-24.04 label; hosted image is maintained by GitHub and is not an immutable image digest | read-only runner resource probe |
| [Pool Supervisor](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/scripts/pool-supervisor.mjs) | SELECTED_EXISTING_INTERNAL | IMPLEMENTED_SCAFFOLD_NOT_RUN_ON_PR_HEAD | repository commit SHA; current PR head must be recorded per run | negative tests on a controlled non-dispatch harness |
| [GitHub Issues task queue](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues) | SELECTED_BOOTSTRAP_LIMITED | IMPLEMENTED_SCAFFOLD_NOT_TRANSACTIONALLY_QUALIFIED | GitHub service | race/replay tests; keep as bootstrap only |
| [Pool Worker DSH headless probe](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/.github/workflows/pool-worker.yml) | SELECTED_PROBE_ONLY | IMPLEMENTED_NOT_RUN_IN_THIS_PASS | DSH 0.2.1-rc.5; Node 24.9.0; Actions pinned to commit SHA | authorized synthetic smoke task after dispatch governance |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | CONDITIONAL_PREVIEW | NOT_RUN | 0.2.1-rc.5 in existing workflow | package provenance, SBOM, permission and sandbox review |
| [Gemini CLI and existing multi-agent workflows](https://github.com/google-gemini/gemini-cli) | CONDITIONAL_CANDIDATE | NOT_RUN | not pinned in Developer Cloud Pool | pin release and run secret-free install plus authorized provider probe |
| [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) | CONDITIONAL_CANDIDATE | NOT_RUN | not pinned in Developer Cloud Pool | validate supported auth route and terms; no secrets in PR workflows |
| [OpenAI Codex CLI](https://github.com/openai/codex) | CONDITIONAL_CANDIDATE | NOT_RUN | not pinned in Developer Cloud Pool | pin release; install and run non-mutating provider probe |
| [OpenHands application](https://github.com/OpenHands/OpenHands) | PRIMARY_UI_CANDIDATE_NOT_ADOPTED | NOT_RUN | no release/commit pinned in pool | pin commit and perform threat-model/capability crosswalk |
| [OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk) | CONDITIONAL_CANDIDATE | NOT_RUN | no pool pin | refresh commit and evaluate minimal task adapter |
| [Everything Claude Code (public affaan-m/ECC)](https://github.com/affaan-m/ECC) | SELECTIVE_CONDITIONAL | NOT_RUN | no pool pin | map individual modules and permissions; do not bulk-install |
| [PersonalJarvis](https://github.com/PersonalJarvis/PersonalJarvis) | HOLD_PROVENANCE | NOT_RUN | none | resolve authoritative repository before reconsideration |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | CONDITIONAL_LATER | NOT_RUN | not pinned | browser threat model and isolated smoke tests |
| [Playwright](https://github.com/microsoft/playwright) | SELECTED_QA_CANDIDATE | NOT_RUN | not pinned in pool | pin version and run isolated browser smoke |
| [LiteLLM Proxy](https://github.com/BerriAI/litellm) | DEFERRED | NOT_RUN | none | security review, tenancy and key isolation design |
| [LangGraph](https://github.com/langchain-ai/langgraph) | DEFERRED | NOT_RUN | none | benchmark against simpler existing workflow before adoption |
| [PostgreSQL](https://github.com/postgres/postgres) | DEFERRED_UNTIL_GAP_PROVEN | NOT_RUN | none | introduce only after atomicity/durability tests prove a gap |
| [n8n](https://github.com/n8n-io/n8n) | OPTIONAL_LATER | NOT_RUN | none | review license and isolate from A0 |
| [Telegram Bot API](https://core.telegram.org/bots/api) | LATER_CONNECTOR | NOT_RUN | hosted API | identity binding and replay/rate-limit tests |
| [Meta Instagram APIs](https://developers.facebook.com/docs/instagram-platform/) | LATER_CONNECTOR | NOT_RUN | Meta Graph API version must be pinned at implementation | official API permission and app-review checklist |
| [Ollama/local model runtime](https://github.com/ollama/ollama) | EXTERNAL_NODES_LATER | NOT_RUN | none | separate worker-admission and isolation design |
| [Pool quota ledger](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | implement contract and race/reset/429 tests |
| [Tenant isolation boundary](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | implement two-tenant adversarial qualification |
| [Task DAG and durable lifecycle](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | typed task contract and failure-injection tests |
| [Independent A3 verifier](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | independent verifier job and tamper-evident evidence tests |

## Decision semantics

- `SELECTED_*`: chosen for a limited bootstrap or test role, not generally qualified.
- `CONDITIONAL_*`: candidate pending stated evidence and gates.
- `PRIMARY_UI_CANDIDATE_NOT_ADOPTED`: leading Jarvis UI candidate; not installed or trusted as A0.
- `HOLD_PROVENANCE`: source identity or provenance is unresolved.
- `DEFERRED*` / `OPTIONAL_LATER` / `LATER_CONNECTOR` / `EXTERNAL_NODES_LATER`: intentionally outside phase-1.
- `INTERNAL_GAP_REQUIRED`: required pool capability that does not yet exist as executable code.

## Qualification ladder

1. **Source integrity:** canonical upstream, pinned release/commit, license and dependency inventory.
2. **Static review:** supported runtime, installation footprint, permission model, secret access and network behavior.
3. **Install probe:** isolated ephemeral runner, no provider credentials, resource and startup measurements.
4. **Authentication probe:** explicit tenant-bound credential reference; never print or expose key values.
5. **Execution probe:** synthetic task, immutable target SHA, constrained workspace, recorded usage and artifacts.
6. **Security qualification:** negative tests for cross-tenant access, secret leakage, privilege escalation and unsafe retries.
7. **A3 acceptance:** independent verifier, evidence manifest and reproducible result.

A component cannot be marked eligible based only on a successful package install or workflow heartbeat.

## Phase-1 composition decision

- **A0 bootstrap:** existing Pool Supervisor + GitHub Issues queue + GitHub Actions. This is deliberately a limited bootstrap, not a durable multi-tenant scheduler.
- **Runner:** GitHub-hosted ephemeral Ubuntu 24.04 jobs. Measure the actual image and resource envelope before packing multiple agents.
- **Worker:** only the existing DSH headless no-model probe is currently allowlisted. Gemini, Claude Code and Codex are candidates, not enabled worker profiles.
- **Jarvis:** OpenHands application is the primary UI/workspace candidate; A0 remains authoritative. Adoption is blocked on tenant isolation and API integration review.
- **Deferred:** database, gateway, browser automation, Telegram, Instagram and external compute until the specific need and security boundary are proven.
- **Required internal gaps:** tenant isolation, quota ledger, task DAG/durable lifecycle and independent A3 verifier.

## What the automated matrix test checks

`node scripts/validate-component-matrix.mjs` validates JSON syntax, required fields, unique IDs, source URL shape, decision vocabulary, required architecture records, dispatch-disabled invariant and absence of secret values. The CI job also runs the existing workflow/security contract validator and parses workflow YAML.

**What it does not check:** live upstream availability, current release freshness, actual license text, vulnerability status, provider key validity, API quotas, model calls, runner resource capacity, multi-agent execution, tenant isolation at runtime or production readiness. Those require separate qualification jobs and evidence.

## Launch blockers

1. No provider-backed multi-agent worker profile is qualified.
2. A0 durable leases, task DAG, checkpoint/resume and tenant-aware admission are incomplete.
3. Quota reservation/reconciliation and daily reset policy are not implemented.
4. Cross-tenant isolation has no executable adversarial test.
5. Independent pool A3 verification is not implemented.
6. Runner resource baseline and multi-agent packing have not been measured on this PR head.
7. Dispatch remains disabled until default-branch governance and explicit owner approval are complete.
