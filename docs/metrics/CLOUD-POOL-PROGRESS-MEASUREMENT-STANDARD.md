# Cloud Pool Progress & Launch Readiness Measurement Standard

Status: ACTIVE MEASUREMENT STANDARD; baseline provisional; no acceptance implied.
Introduced: 2026-11-23 / Pass 50. Scope: Contour A through first controlled Jarvis launch.

## 1. Two independent measures
- Engineering Progress (EP) measures verified engineering deliverables against an approved, versioned work-item/effort baseline.
- Launch Readiness (LR) measures integrated operational qualification. EP never implies LR or ACCEPTED.
- Contour A acceptance is a separate governance decision. Every score must include evidence date, target SHA, scoring breakdown, confidence and blockers.
- Missing or stale evidence scores NOT VERIFIED; no completion credit.

## 2. Launch Readiness weighted score
Score each domain 0–4: 0 absent; 1 design/documented; 2 implemented but not integrated; 3 integrated and exact-head tested; 4 operationally verified and independently qualified.
LR = sum(weight × domain score / 4). Weights total 100.

| Domain | Weight | Required evidence |
|---|---:|---|
| Architecture and contracts | 10 | Current contracts, authority boundaries, threat model and decisions |
| GitHub governance and CI | 10 | Effective rules, exact-head CI, provenance, review and approval gates |
| Durable state and recovery | 10 | Persistence, replay, fencing, recovery and runtime evidence |
| Identity and authentication | 15 | Production verifier, issuer/audience/algorithm policy, JWKS safety, session/principal binding |
| Model routing and quotas | 15 | Account-isolated routing, persistent budget controls, no paid fallback, fail-closed behavior |
| Remote Web UI | 10 | Deployed authenticated UI, mobile/desktop browser verification |
| Executors and orchestration | 10 | Real bounded tasks, executor identity, run/job evidence and safe cancellation |
| Observability and audit | 5 | Redacted logs, traceability, health and incident evidence |
| Security qualification | 10 | Adversarial tests, secret isolation, least privilege and independent security review |
| End-to-end acceptance | 5 | Complete user journey, persistence, restart/recovery, rollback and acceptance record |

### Mandatory caps and vetoes
- If Identity, Routing/Quotas, Web UI, Executors or Durable State scores 0 or 1, LR is capped at 49%.
- If dispatch/execution authorization is not demonstrably fail-closed before qualification, LR is capped at 29%.
- An unresolved critical/high security finding caps LR at 49%.
- Missing independent review or required governance approval prevents ACCEPTED regardless of score.
- Secret exposure, unauthorized provider call, paid fallback, uncontrolled dispatch or unbounded privilege is a stop condition.

## 3. Engineering Progress
EP = verified completed work-item effort points / total approved baseline effort points × 100.
Each work item records stable ID/domain, planned/started/completed UTC timestamps when observed, target base SHA, resulting SHA, status, changed files/diff stats, tests and exact run/job IDs, evidence, review disposition, blockers, estimated effort and measured elapsed time separately.
Only VERIFIED or stronger items earn full credit. SUCCEEDED without reproducible evidence remains provisional. Scope changes require a ledger entry; never silently change the denominator.
Until the approved baseline backlog and effort points exist, EP is PROVISIONAL / NOT COMPUTABLE. Do not infer progress from message count, commits, changed files or raw test totals.

## 4. Time and throughput instrumentation
For every /next pass record UTC start/finish only when observable; active time only when directly measured; elapsed and active time separately; changed-file/diff stats; tests and exact tested SHA; CI run/job IDs and duration when available; verified work items; blockers opened/closed; rework cycles; estimated effort range and confidence.
Do not fabricate historical message counts, durations, active hours or runner time. Historical reconstruction requires conversation exports or source timestamps. Message volume is communication telemetry, not engineering completion.
Only after at least five passes have usable observations, publish rolling medians for elapsed time, measured active time, CI duration, verified work items/pass, blocker closure and rework rate.

## 5. Pass 50 evidence baseline
Snapshot: 2026-11-23. PR #168 head 5450ddd8002d7a336b3eb41adeaba1d62a17fb75; base 81baadbb5944e11ed41a64bd0190bf2c8edd0c41.
- Pass 49 D1 proof CI: 63/63 tests, 6/6 files; merge-result 659bc39dc448e9f803c4a20044209017d3cd7fb6.
- Pool Contract Validation: SUCCESS; dispatch disabled; six workflow YAML files parsed.
- Production JWT/JWKS verifier: NOT IMPLEMENTED.
- Production routing/quotas, authenticated remote UI, real executor execution, hosted durable state/recovery: NOT VERIFIED.
- Independent review: NOT RUN; Issue #140 excludes external review requests for its bounded local proof task.
- Ruleset #26550182 active; required approving reviews = 0.
- Gemini NOT RUN / NOT AUTHORIZED in recorded Pass 49 evidence.
- No production deployment, hosted D1 mutation, provider calls, secret reads or dispatch.

The earlier 60% EP / 30% LR values are historical low-confidence conversational estimates only. They are not formal scores under this standard. The first formal LR score requires scoring all ten domains against primary evidence; formal EP requires the approved effort baseline.

## 6. First measurement actions
1. Create a stable work-item ledger and estimate remaining Contour A effort without silently changing scope.
2. Score LR domains against primary evidence; absent proof remains NOT VERIFIED.
3. Pass 51: no-secret panva/jose verifier prototype on immutable integration head.
4. Append one ledger row after every /next and refresh Context Window/checkpoint.
5. Keep Contour B deferred until Contour A is ACCEPTED.

## 7. Canonical references
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- PR #168: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md