# /next — Gemini execution-boundary audit and four-role contract reconciliation

Date: 2026-11-16

## Scope
Revalidated the Cloud Pool default branch, Issues #94/#96, open PR candidates, exact-head CI and governance. Audited PR #109 source diff and compared SDK timeout behavior with official Google Gen AI SDK documentation. No runtime, secret, provider or dispatch action was performed.

## Immutable repository state
- Repository: VlDMlNSh/developer-cloud-pool; default branch: `Основной`.
- Default branch HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (direct branch API read).
- Documentation branch HEAD before this report: `256de914840f61b90312295428091dfa12eff6fa` (commit-list API read).
- Active ruleset #26550182: PR required; deletion and non-fast-forward blocked; thread resolution required; required approvals = 0; CODEOWNERS review = false.
- Issue #94 remains OPEN and specifies four isolated Gemini task executions.
- Issue #96 contains an owner-directed amendment dated 2026-11-16 explicitly changing the prior three-child wording to exactly four roles for the current qualification wave: researcher, implementation designer, tester, security auditor. The earlier 4-vs-3 conflict is RESOLVED at the issue-contract level. Do not repeat it as an active blocker.

## PR #109 — execution-bounds hardening candidate
- Status: OPEN / DRAFT / UNMERGED; HEAD `371093fc646a22cf49e3baaa8984bc2e5d3622b7`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Exact-head run #43872185972: COMPLETED / SUCCESS; job #133315933882. The candidate's fake-client suite reports 11 passed / 0 failed, followed by Pool Contract Validation PASS.
- Formal PR reviews: 0.
- Source diff adds fixed model allowlist, 45-second AbortSignal, 8,000-character output cap, task-shape checks, duplicate-key-value detection and fake-client tests.
- The PR description acknowledges that the official `@google/genai` dependency manifest and reproducible lockfile are absent. The SDK is dynamically imported, but its install/runtime is NOT VERIFIED. The CI run is not a live SDK test.

## Security and correctness findings from source review
1. **Credential isolation is not established.** `runFourAgents` reads all four `GEMINI_API_KEY_n` values from one process environment into one in-process array, then invokes four SDK clients concurrently using `Promise.all`. This is four logical calls, not four isolated child execution environments. A compromised dependency or code running in that process can potentially access the shared process environment and other in-memory credentials. The PR does not meet the Issue #94 requirement that each child be isolated to one designated credential slot.
2. **Unique key strings do not prove separate Google accounts or quota domains.** Duplicate-value detection is a useful local guard, but account/quota identity remains NOT VERIFIED.
3. **Timeout is not a billing cutoff.** Official SDK docs describe `abortSignal` as client-side cancellation and explicitly warn that cancelling locally does not cancel service-side work or applicable charges. Therefore the 45-second bound is not a guaranteed server-side cost ceiling.
4. **Dependency provenance remains incomplete.** No package manifest/lockfile pinning for `@google/genai` is included in PR #109; exact SDK version and reproducible runtime are NOT VERIFIED.
5. **No controller admission/lease integration.** PR #109 contains a callable runner but not owner-only Issue #96 admission, durable single-use reservation, fencing, outbox, crash recovery or child-run reconciliation.

## Upstream reference
- Official SDK repository: https://github.com/googleapis/js-genai
- Official SDK AbortSignal type documentation: https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html
- Official SDK README / installation: https://github.com/googleapis/js-genai/blob/main/README.md

## Disposition
PR #109 exact-head fake-client CI: VERIFIED for the narrow test suite only.
SDK install/runtime, credential process isolation, account/quota separation, hosted lease integration and independent security review: NOT VERIFIED.
Gemini dispatch: NOT RUN.
No secret values read; no provider calls; no paid resources; no deployment or merge.
Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded engineering step
Replace the single-process four-key runner with four independently isolated execution boundaries (one credential injected per boundary; no sibling key in its environment or filesystem), pin the official SDK and lockfile, and add tests that inspect each worker's visible environment without using real secrets. Then integrate those workers behind Issue #96 admission + durable lease/fencing/outbox and exact-head no-secret CI. Keep live dispatch disabled until account/quota metadata, hosted durability and independent review are verified.
