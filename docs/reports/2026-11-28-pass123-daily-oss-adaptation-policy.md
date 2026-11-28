# Pass 123 report — daily OSS adaptation policy (2026-11-28)

## Outcome

Recorded the owner's explicit approval to make daily mature-OSS intelligence and evidence-based adaptation a permanent part of every /next. The architecture register now defines the calendar-day scan, per-request delta scan, evidence requirements, adoption dispositions, security/cost gates and approved Cloud Pool architecture directions.

## Changes

- Extended docs/architecture/PLATFORM-INTELLIGENCE-AND-ENGINEERING-OPTIMIZATION-2026-11-28.md.
- Appended the owner decision and operational rule to docs/context/GITHUB-CONTEXT-WINDOW.md.
- Created this report and a continuation checkpoint.
- Branch: docs/pass123-daily-oss-adaptation-policy-2026-11-28.
- Base: fa47196f9df200546bc56a15ba1d577f78fbc159.

## Important scope qualification

This is a documentation/governance pass, not implementation of the proposed architecture. The latest completed OSS candidate baseline is Pass 122 (LangGraph, Temporal, Dagger, Pydantic AI, OpenTelemetry Collector, LiteLLM). A new daily upstream delta scan was NOT RUN in Pass 123; no fresh candidate claims are made here. It is now mandatory in the next pass and every subsequent /next.

## Accepted target directions (subject to proof and gates)

1. Jarvis policy coordinator, bounded role-specific task envelopes.
2. Persist-before-dispatch and immutable task/attempt/lease evidence.
3. D1 as current candidate state ledger; no second state engine without measured need.
4. Control/data-plane separation and isolated least-privilege executors.
5. Provider-neutral routing with explicit account, issuer, model, quota, cost, capability and privacy identity; no paid fallback.
6. Correlation IDs and structured observability.
7. Independent implementation, test/contract and security/provenance roles.
8. CI optimization based on measured timings and free-tier constraints.

## Verification and safety

- Documentation writes completed through GitHub Contents API; final read-back and compare must be recorded before calling the pass verified.
- Runtime code/dependencies/routes/infrastructure changed: none.
- Tests and benchmarks: NOT RUN (docs-only).
- Independent security review: NOT RUN.
- Secrets, provider calls, dispatch, executor launch, hosted D1 writes, deployment, merge and production mutation: not performed.
- Time: NOT MEASURED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next

Fresh daily OSS release/advisory scan, then continue the bounded Cloud Pool critical path from Pass 122. No dispatch or execution until gates pass.


## Fresh daily OSS delta scan (2026-11-28)

Primary upstream sources reviewed:
- Bifrost official repository and releases: Apache-2.0; HTTP v2.6.0 (Nov 19) and Helm v2.1.50 (Nov 25); release includes Go/toolchain and dependency security updates.
- agentgateway official repository/release: Apache-2.0; v1.7.0 (Oct 27) includes model capability metadata, service-tier cost reporting, per-model/user analytics, CEL policy and guardrail/session security behavior.
- LangGraph official releases: v1.2.24 (Nov 20), GitHub release signature shown as verified.
- LiteLLM official security advisories include Nov 12 credential exfiltration advisory, Oct 27 critical enterprise proxy file-read/master-key advisory, and several Nov 23 advisories affecting tenant visibility/deployment integrity. Applicability depends on affected versions/configurations; this is not a blanket claim that all releases are vulnerable.

Disposition:
- Bifrost: PILOT candidate only; no runtime/credential integration. Need edition, SBOM, threat model, resource/free-tier and quota-enforcement verification.
- agentgateway: ADAPT metadata and fail-closed policy concepts; DEFER runtime due stack/complexity and lack of demonstrated need.
- LangGraph: ADAPT concepts; DEFER runtime because D1 currently owns state/receipt/lease.
- LiteLLM: reject deployment in current Contour A; retain only protocol/usage pattern learning pending independent security reassessment.
- Temporal, Dagger, OTel Collector and Pydantic AI retain Pass 122 dispositions; no fresh primary-source release/advisory audit was completed for them in this delta scan.

Concrete adaptation: extend provider route metadata with capability/modalities/context window, serving service tier, per-route cost/quota domain and correlation. Require immutable provider endpoints/outbound allowlists; reject caller-controlled base URLs, model-list overrides and credential parameters. Explicitly govern tool-output inspection, privacy and failure mode.

No package installed, benchmark executed, runtime dependency added, provider route enabled or service deployed. Candidate security/SBOM/compatibility qualifications remain NOT VERIFIED.
