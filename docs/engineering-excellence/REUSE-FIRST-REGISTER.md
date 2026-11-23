# Reuse First — Component Research and Adoption Register

- Status: **POLICY PROPOSED; candidates are not approved dependencies**
- Rule: research mature components before building an equivalent subsystem.
- No package is integrated, deployed or qualified solely because it appears in this register.

## Evaluation checklist

For each candidate capture repository URL, license/SPDX, release cadence, maintainers, security advisories, dependency footprint, runtime compatibility, free-tier/hosting implications, data flows, permissions, operational burden, integration effort, test evidence and exit/rollback path.

Decision values:
- **REUSE** — adopt substantially unchanged after license/security/compatibility review.
- **ADAPT** — use a bounded component or pattern with documented local changes.
- **REJECT** — evidence shows a material mismatch or risk.
- **DEFER** — potentially useful, but prerequisite or proof is missing.

## Initial research shortlist

| Capability | Candidate | Why research it | Current decision |
|---|---|---|---|
| Metrics/traces conventions | OpenTelemetry | Standardized names, units, spans and attributes; avoid bespoke telemetry semantics | RESEARCHED / ADAPT CONVENTIONS ONLY |
| Policy-as-code | Open Policy Agent (OPA) | Mature policy evaluation and decision evidence patterns | CANDIDATE / NOT INTEGRATED |
| Durable workflow execution | Temporal | Established workflow/retry/recovery concepts; operational footprint may exceed free-tier constraints | CANDIDATE / DEFER |
| Test infrastructure | Testcontainers | Reproducible integration dependencies; validate GitHub-hosted runner compatibility/cost | CANDIDATE / NOT INTEGRATED |
| Model gateway | LiteLLM | Provider adapter/routing ecosystem; quota, account isolation and paid-fallback semantics need independent proof | CANDIDATE / NOT QUALIFIED |
| CI/CD delivery metrics | DORA | Useful delivery-performance framework; pre-production metrics require careful adaptation | REFERENCE / ADAPT |

## Research notes and source links

- OpenTelemetry semantic conventions: https://github.com/open-telemetry/semantic-conventions
- OpenTelemetry CI/CD metrics: https://opentelemetry.io/docs/specs/semconv/cicd/cicd-metrics/
- Open Policy Agent documentation: https://www.openpolicyagent.org/docs
- Temporal documentation: https://docs.temporal.io/
- Testcontainers documentation: https://testcontainers.com/
- LiteLLM documentation: https://docs.litellm.ai/
- DORA research: https://dora.dev/

## Adoption gate

Before adding a dependency:
1. Identify a concrete requirement and show why current code/platform cannot meet it safely.
2. Compare at least one alternative and the smallest viable built-in/platform option.
3. Review license, supply-chain provenance, maintenance and vulnerabilities.
4. Verify compatibility with the actual runtime and free resource budget.
5. Identify data/secret access, network egress and authority implications.
6. Pin version and integrity; add reproducible tests and rollback.
7. Record decision in `docs/decisions/` and update this register.

Avoid cargo-cult adoption. Reuse is preferred only when it reduces total risk and lifecycle cost.
