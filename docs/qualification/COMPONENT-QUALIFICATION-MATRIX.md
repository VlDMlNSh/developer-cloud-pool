# Developer Cloud Pool — Component Qualification Matrix

- Matrix ID: `developer-cloud-pool-component-qualification`
- Schema: `1.0.0`
- Snapshot: 2026-11-14
- Branch: `docs/unified-cloud-pool-jarvis-plan-2026-11-14`
- Records: **30**
- Dispatch: **disabled**
- Secret values in matrix: **none**

> This is a decision/evidence register, not an installation manifest. Selection does not mean production readiness. Local test success does not qualify a hosted service or live provider route.

## Decision matrix

| Component / upstream | Decision | Runtime evidence | Version / pin | Next qualification gate |
|---|---|---|---|---|
| [GitHub-hosted Actions runner](https://github.com/actions/runner-images) | SELECTED_BOOTSTRAP | EIGHT_READ_ONLY_RESOURCE_PROBES_PASS; FIVE_AZURE_IMAGE_20261111_370_1; THREE_AWS_IMAGE_20261111_127_1; CAPACITY_NOT_QUALIFIED | ubuntu-24.04 label; hosted image is maintained by GitHub and is not an immutable image digest | benchmark pinned no-secret worker profiles and repeat resource measurements before capacity admission |
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
| [Pool quota ledger](https://github.com/VlDMlNSh/developer-cloud-pool) | LOCAL_POLICY_IMPLEMENTATION_NOT_INTEGRATED | 43_POLICY_TESTS_PASS; NOT_INTEGRATED_WITH_DISPATCH | PR #29 head e4c8d642bbc054e7c52b391356965b492dad32b4 | integrate with authoritative task admission and provider evidence after branch reconciliation |
| [Tenant isolation boundary](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | implement two-tenant adversarial qualification |
| [Task DAG and durable lifecycle](https://github.com/VlDMlNSh/developer-cloud-pool) | LOCAL_PROOF_NOT_HOSTED | PARTIAL_LOCAL_ATTEMPT_LIFECYCLE_PROOF; GENERAL_DAG_NOT_IMPLEMENTED | not implemented | reconcile attempt store as one canonical task lifecycle; add dependency graph only where required |
| [Independent A3 verifier](https://github.com/VlDMlNSh/developer-cloud-pool) | INTERNAL_GAP_REQUIRED | NOT_IMPLEMENTED | not implemented | independent verifier job and tamper-evident evidence tests |
| [Cloudflare Workers + D1 claim / attempt / projection proof](https://github.com/VlDMlNSh/developer-cloud-pool/pull/67) | LOCAL_PROOF_NOT_HOSTED | LOCAL_WORKERS_D1_84_TESTS_PASS; UPGRADE_BINDING_1_PASS; FROZEN_FIXTURE_2_PASS; NOT_HOSTED | local proof package lock; exact PR #67 head a53f6232bd5b50d3e150addf528b8e722002f9dd | integrate A0 admission into one atomic ledger transaction; no hosted D1 without explicit authorization |
| [A0 fail-closed admission contract harness](https://github.com/VlDMlNSh/developer-cloud-pool/pull/67) | LOCAL_PROOF_NOT_HOSTED | 14_A0_CONTRACT_TESTS_PASS; INJECTED_AUTHORITIES; NOT_PRODUCTION_INTEGRATED | PR #67 exact head a53f6232bd5b50d3e150addf528b8e722002f9dd | connect to durable task/attempt ledger with atomic approval consumption; retain dispatch:false |
| [Provider slot inventory (24 cloud routes)](https://github.com/VlDMlNSh/developer-cloud-pool/pull/29) | INVENTORY_ONLY | 43_POLICY_TESTS_PASS; ALL_24_ACCOUNT_AND_QUOTA_DOMAINS_UNVERIFIED | PR #29 head e4c8d642bbc054e7c52b391356965b492dad32b4 | reconcile provider accounts and quota-domain evidence without revealing key material |
| [Provider quota ledger and agent placement](https://github.com/VlDMlNSh/developer-cloud-pool/pull/29) | LOCAL_POLICY_IMPLEMENTATION_NOT_INTEGRATED | 43_POLICY_TESTS_PASS; NO_LIVE_PROVIDER_OR_SHARED_LEDGER | PR #29 head e4c8d642bbc054e7c52b391356965b492dad32b4 | integrate policy into A0 admission and authoritative quota state only after source reconciliation |
| [Jarvis Hono web console prototype](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | DEMO_PROTOTYPE_NOT_PRODUCTION | PROTOTYPE_CI_PASS; NO_HOSTED_DEPLOYMENT | PR #25 head 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85 | reconcile Hono/API/auth stack; threat-model, integrate read-only tenant-scoped APIs, then deployment approval |

## Corrections from source reconciliation

The earlier matrix described the quota ledger and task lifecycle too broadly as missing. Existing draft PRs contain meaningful local implementations:
- PR #29 has a pure provider quota state machine, slot inventory (24 cloud slots), slot admission and agent placement/resource-profile primitives. Its exact-head CI run 43031920223 passed 43 tests. It is not connected to live dispatch; all 24 provider account identities and quota domains remain unverified.
- PR #54 demonstrates 50-way logical-task contention in local Workers/D1 tests.
- PR #67 contains a 10-migration local D1 claim/attempt/projection proof. Exact current run 43600901068 passed 84 Workers-runtime tests, plus 1 upgrade-binding smoke and 2 frozen schema-0010 fixture tests. The A0 admission contract contributes 14 of the 84 tests and uses injected mock authorities. This is not hosted D1 or production admission.
- PR #25 contains a fail-closed Hono Jarvis console prototype with successful prototype CI. PR #30/#61 provide synthetic or local authentication/session proofs, not production OAuth or tenant isolation.

These branches remain draft/unmerged. Their code and test evidence must be reconciled onto one current-base integration branch before it becomes a runtime dependency.

## Qualification ladder

1. **Source integrity:** canonical upstream, immutable release/commit, license and dependency inventory.
2. **Static/security review:** runtime, permissions, secret access, network egress, tenant boundary and dependency provenance.
3. **Install probe:** isolated ephemeral runner, no provider credentials, measured startup and resource footprint.
4. **Authentication probe:** explicit tenant-bound credential reference; never print or expose key values.
5. **Execution probe:** synthetic task, immutable target SHA, constrained workspace, usage and artifact evidence.
6. **Security qualification:** negative tests for cross-tenant access, secret leakage, privilege escalation, replay, stale leases and unsafe retries.
7. **A3 acceptance:** independent verifier, evidence manifest and reproducible result.

A package install, a successful heartbeat or local test suite alone cannot qualify an agent or production service.

## Current architecture composition

- **A0 bootstrap:** existing Pool Supervisor + GitHub Issues human intake + GitHub Actions. Current default Supervisor is heartbeat/scaffold, not a qualified transactional dispatcher.
- **Authoritative claim/task state:** local D1 proof is the preferred implementation candidate, not a hosted service. GitHub Issue labels are not a CAS lock.
- **Runner:** eight read-only observations of GitHub-hosted Ubuntu 24.04.5 x64: all 4 vCPU and 15 GiB RAM. Three observations used AWS/image 20261111.127.1: two in us-east-1 and one in us-west-2 with 88.46 GiB workspace; four used Azure northcentralus/image 20261111.370.1 with 85.26 GiB workspace. The four Azure same-image/region-family observations reported different CPU models (EPYC 7763 and EPYC 9V74; the fifth observation run 43601408557 reported EPYC 7763). Run 43601557812 adds a second AWS sample on image 20261111.127.1 with Intel Xeon 6975P-C. Run 43601648756 adds an Azure westus3 observation on image 20261111.370.1 with AMD EPYC 9V45. Run 43601762099 adds an AWS us-west-2 observation on image 20261111.127.1 with Intel Xeon 6975P-C. Total: eight read-only observations across two cloud providers and four region families. These observations do not qualify reserved capacity, stable hardware identity or multi-agent packing.
- **Worker:** only the existing DSH no-model probe is allowlisted in the current bootstrap. Gemini, Claude Code and Codex are candidates, not qualified pool profiles.
- **Provider routes:** 24 cloud slots inventoried; 0 verified account identities and 0 verified quota domains in the inventory evidence.
- **Quota and placement:** pure local policy implementation exists; no authenticated provider broker or dispatch integration.
- **Jarvis:** Hono prototype is a stronger immediate reuse path than starting with OpenHands. OpenHands remains a candidate for later workspace/agent execution integration; neither is an accepted production UI yet.
- **Required internal gaps:** production issuer/trusted time/revocation, tenant isolation, integration of canonical attempt/outbox to live projection, independent A3 verifier and operational observability.

## What the automated matrix test checks

`node scripts/validate-component-matrix.mjs` validates JSON syntax, required fields, unique IDs, source URL shape, decision vocabulary, required architecture records, dispatch-disabled invariant and absence of secret values. CI runs it with the existing pool contract validator.

**It does not check:** upstream availability, current release freshness, live license status, vulnerability status, provider key validity, API quotas, model calls, runner capacity distribution, multi-agent execution, tenant isolation at runtime or production readiness.

## Launch blockers

1. Reconcile the draft PR stack (#29, #37, #39/#54, #53, #58/#59/#67) to one canonical current-base implementation and remove conflicting lifecycle paths.
2. Implement and qualify issuer authentication, trusted time, revocation and nonce/replay protection.
3. Verify account-specific hosted D1 eligibility and obtain explicit approval before creating one isolated qualification database and test-only Worker.
4. Run hosted 50+ independent HTTP contention and failure/recovery tests; local Miniflare/workerd evidence is not a substitute.
5. Integrate quota/slot admission with task dispatch and verify account/quota-domain evidence for provider routes.
6. Implement tenant isolation and adversarial cross-tenant tests.
7. Integrate Jarvis auth/API with the pool and add independent A3 verification.
8. Repeat runner probes and test real agent installs without secrets before provider-backed execution.
9. Obtain independent security/governance approval on exact final source SHA.

## Mandatory provider and cost policy (owner decision, 2026-11-14)

This policy is a hard admission constraint for the initial pool, not an optional preference:

- **No paid provider APIs or paid API fallback in the initial launch.** Do not create paid API credentials, invoke paid endpoints, or enable billing-dependent routes.
- **OpenAI is deferred.** Any OpenAI API/Codex provider integration is out of the initial launch and requires a later, explicit owner decision. Do not infer permission from a registered candidate or available credential.
- **Claude Code:** use only the approved Free Claude Code route, subject to its current supported terms and actual free availability. **Do not authenticate through Anthropic API or use an Anthropic API key/billing route.** If the free route is unavailable or unsupported, mark the profile BLOCKED; do not substitute a paid route.
- **Local inference:** Ollama with Llama (and other approved local models) is a separate, preferred fallback route, subject to runner/hardware resource qualification.
- **Gemini, DeepSeek and other external providers:** free quotas/free routes only, where officially available and permitted by provider terms. Record the quota domain, reset window and observed usage without storing secret values.
- **Quota exhaustion or provider denial:** queue, defer, or route to an independently qualified free/local profile. Never silently incur charges, use paid fallback, or evade limits through account/key rotation.
- **A0 enforcement:** every task admission must carry an explicit cost_class (free_quota, local, or later paid_explicitly_approved), provider/profile identity and quota evidence. Initial policy allowlist is free_quota and local; paid_explicitly_approved is denied until a separate owner approval and policy change. Fail closed on unknown cost classification.

This policy does not claim that a provider's free tier is guaranteed, unlimited, or available to this account. Each route still requires terms, authentication, quota and runtime qualification. The matrix validator must check that the policy remains present and that dispatch remains disabled until the launch gates are accepted.

## CI-enforced cost-policy invariants

The dependency-free matrix validator now rejects the register if any of these owner constraints drift: paid provider APIs are denied; Anthropic API is denied; OpenAI remains deferred pending explicit approval; Claude Code is limited to the approved Free Claude Code route; local Llama execution is represented through Ollama; initial allowed cost classes are exactly `free_quota` and `local`; unknown cost classes fail closed; quota evasion through account/key rotation is prohibited; and provider policy stores no secret values. This is a static consistency guard. It does not prove that provider terms, free quotas, authentication or runtime execution are currently available. Dispatch remains disabled.
