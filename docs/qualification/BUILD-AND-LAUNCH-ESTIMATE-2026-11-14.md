# Developer Cloud Pool — build and launch estimate

**Snapshot:** 2026-11-14  
**Scope:** Contour A only — cloud pool, A0, workers, quota/placement, Jarvis control panel and first tenant boundary. MediaHub product implementation and external physical servers remain out of scope until the pool is accepted.

## Executive estimate

| Delivery target | Engineering effort | Calendar estimate, one focused implementation stream | Meaning |
|---|---:|---:|---|
| Read-only / no-provider demo | 2–4 engineer-days | 2–5 calendar days | Jarvis UI and runner inventory visible; no autonomous agent dispatch |
| First controlled multi-agent pilot | 10–15 engineer-days | 2–3 weeks | One tenant, 2–3 qualified agent profiles, bounded synthetic/repository tasks, task ledger, evidence and A3 review; dispatch remains explicitly gated until acceptance |
| Secure multi-tenant v1 | 20–30 engineer-days | 4–6 weeks | Tenant isolation, durable claims/attempts, quota-aware admission, production auth, audit/recovery, independent security review and operational runbooks |
| Broad provider/agent pool | 30–50 engineer-days | 6–10 weeks | More provider families and agent harnesses qualified incrementally; not all 24 inventory slots assumed usable |

These are engineering estimates, not promises or a countdown. They assume one focused engineering stream, timely owner decisions, no major upstream API break, no paid-service procurement, and that required account entitlements are available. Parallel specialist review can reduce calendar time; external account approval, review cycles or a backend substitution can extend it.

## Evidence already present — reduces greenfield work

1. **Runner baseline:** PR #68 run 43595157109 succeeded. Two read-only observations succeeded. Both were Ubuntu 24.04.5 x64 with 4 logical CPUs and 15 GiB RAM. Sample A: image 20261111.127.1, 88.46 GiB available workspace, AWS us-east-1, Intel Xeon 6975P-C. Sample B: image 20261111.370.1, 85.26 GiB available workspace, Azure northcentralus, AMD EPYC 7763. The probe used read-only GITHUB_TOKEN. Two samples across different image versions/regions are still not a stable capacity profile; repeat measurements on the same image and benchmark actual agent profiles.
2. **Quota and placement:** PR #29 contains a pure provider quota state machine, 24-slot cloud inventory, 20-slot admission policy, agent placement and capacity-profile primitives. Exact-head CI run 43031920223 passed 43 tests. It is a draft/unmerged branch; no provider calls were made, and all 24 account identities and quota domains remain unverified.
3. **Transactional task lifecycle:** PR #39/#54 prove conditional consume and 50-way logical-task contention locally. PR #67 adds claim/attempt/projection delivery and migrations 0001–0010. Exact run 43182768560 passed 69 main Workers-runtime D1 tests plus isolated upgrade-binding and frozen schema-0010 fixture checks. This is local Miniflare/workerd proof, not a hosted D1 service.
4. **Worker boundary:** PR #37 has a reusable Supervisor→Worker boundary and exact-head boundary/static CI success. It remains draft/unmerged; Issue #38 and the claim authority remain unqualified. A prior audit found GitHub Issue label PATCH is not a compare-and-swap claim primitive.
5. **Jarvis:** PR #25 has a fail-closed Hono web console prototype and successful prototype CI; PR #24 has an API contract candidate; PR #30/#61 contain synthetic/local authentication proofs. There is no production OAuth/session issuer, deployed console or tenant-scoped live pool API.
6. **Component discovery:** the repository's PR #29 inventory contains 24 cloud provider slots. It is distinct from the MediaHub candidate-project register (128 projects); neither number means those agents/providers are qualified.

## Critical path and work estimate

| Stage | Estimate | Exit evidence |
|---|---:|---|
| 0. Reconcile source branches and define one canonical integration stack | 1–3 days | Clean branch from current default; PR #29 quota/placement, PR #37 worker boundary, PR #39/#54 task identity, PR #53 finalizer, PR #58/#59/#67 projection stack reconciled; conflicting legacy lifecycle path retired or blocked; exact-head CI |
| 1. A0 claim authority and issuer | 3–5 days | Signed/otherwise authenticated capability, trusted time, nonce/replay rejection, revocation, immutable envelope binding, fencing and one-use consume; no Issue-label lock as sole authority |
| 2. Hosted transactional backend qualification | 1–3 days after explicit authorization and entitlement verification | One isolated test-only service; 50+ independent concurrent HTTP requests; one winner/one outbox; lost-response, restart, rollback and retry fault tests; no provider secrets or dispatch |
| 3. Runner profile and safe agent installation | 2–4 days | 3–5 repeatable resource observations on the same image family/version; pinned installs for initial Gemini, Codex and/or Claude profiles; SBOM/license checks; install/startup/resource measurements; no secrets in PR jobs |
| 4. Quota and placement integration | 2–4 days | PR #29 primitives wired into A0 admission; account/quota-domain evidence; 429/cooldown, 401/403, 402/no-paid-fallback and daily reset reconciliation tests |
| 5. Jarvis control plane | 3–5 days | Hono UI/API connected to authenticated read-only tenant-scoped pool views, task submission and status; session security, CSRF/origin controls, audit trail; no browser-held provider keys |
| 6. Tenant boundary, A3 and operations | 3–6 days | Two-tenant adversarial isolation tests, separate workspaces/artifacts/secrets/quotas, independent verifier, evidence manifest, alerting and recovery runbook |
| 7. Pilot qualification and security acceptance | 2–4 days | 2–3 provider-backed profiles pass bounded synthetic tasks, A3 verifies outputs, failure injection passes, exact-SHA independent security review and explicit owner acceptance |

Some stages can overlap. The critical path is source reconciliation → authenticated transactional claim → hosted proof → provider execution → tenant/A3 acceptance. If hosted D1 is unavailable or account entitlement is not eligible, add approximately 3–7 engineer-days to qualify and integrate an alternative; do not silently switch to a paid service.

## What is blocking a real launch today

- PR #68, #67, #29, #37 and other implementation branches are drafts/unmerged. The working tree is not one integrated runtime.
- The claim/attempt/projection stack has strong local evidence but no hosted authenticated claim service. The issuer, trusted time, revocation and production recovery authority remain gaps.
- Hosted Cloudflare D1 eligibility/quotas and account ownership were not verified; no hosted database or Worker was provisioned.
- Provider inventory has 24 cloud slots, but verified account identities = 0 and verified quota domains = 0 in the recorded inventory. Credential values and presence were deliberately not inspected.
- Agent placement requires verified resource evidence. The live runner probe is a single observation; the older capacity profile still requires repeated evidence and explicit acceptance.
- The current default Worker allowlist remains only the DSH no-model probe. Gemini, Claude and Codex have not passed pool-specific install/auth/execution qualification.
- Jarvis is a prototype, not a deployed production control plane.
- Tenant isolation and an independent pool A3 verifier are not yet accepted.
- Dispatch remains disabled. A green CI or heartbeat is not authorization to execute user tasks.

## Recommended release definition

**Pilot launch:** one tenant, a small number of qualified agent profiles, repository-scoped task input, immutable target SHA, no autonomous merge/deploy, no paid fallback, explicit owner approval per task, durable audit and A3 verification.

**Production v1:** add authenticated multi-tenant isolation, quota-aware dynamic provider selection, recoverable task graph, operational monitoring and independent security review.

**Wide pool:** admit additional agents and providers one profile at a time after the same gates. Do not activate all 24 inventory slots by assumption, and do not equate the number of registered slots or agents with concurrent runner capacity.

## Current recommendation

Plan on **2–3 weeks for a controlled first multi-agent pilot** and **4–6 weeks for a secure multi-tenant v1**. The estimate is medium confidence for engineering effort and lower confidence for calendar time because hosted D1 entitlement, issuer ownership, provider account/quota evidence and independent review are external gates.

No hosted resources, paid services, provider API calls, secret reads, production deployments, merges or dispatch changes are included in this estimate or were performed in this pass.
