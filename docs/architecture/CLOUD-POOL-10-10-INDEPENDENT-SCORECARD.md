# Cloud Development Pool — Independent 10/10 Architecture and Engineering Scorecard

**Date:** 2026-11-17  
**Status:** NORMATIVE EVALUATION STANDARD / proposed with PR #122  
**Scope:** Contour A only  
**Canonical system architecture:** [Reference Architecture 1.0](CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md)  
**Delivery controls:** [Architecture Assurance Addendum](CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md)

## 1. Purpose

This scorecard defines what a defensible 10/10 means. It is not a self-award mechanism. Scores must be based on inspectable evidence tied to immutable revisions and independently reviewed. Documentation completeness alone cannot earn an implementation or operational score.

Three separate dimensions are evaluated:

- **Architectural potential:** coherence, boundaries, extensibility, simplicity and strategic fit of the target design.
- **Technical elaboration:** precision and completeness of contracts, implementation, tests, security and operations.
- **Overall project prospects:** probability of delivering useful capability sustainably within the declared resource, governance and maintenance constraints.

Each dimension is scored from 0 to 10 in 0.5 increments. Each criterion is scored 0–5 and normalized to its weight. Evidence must identify the exact artifact, revision, test, timestamp and reviewer.

## 2. Scoring rules

For each criterion:
- 0 — absent, contradictory or unsafe.
- 1 — assertion or rough proposal only.
- 2 — documented design with material unanswered questions.
- 3 — complete contract and reviewable implementation plan.
- 4 — implementation and repeatable tests/evidence exist for the declared scope.
- 5 — independently verified under representative and adversarial conditions; operational evidence exists where applicable.

A criterion without evidence is scored 0, not assumed complete. A planned feature cannot score above 3. A documentation-only change cannot raise runtime/operational criteria above 1 unless it supplies verified evidence about an already-existing implementation.

Weighted score = sum(weight × criterion score / 5). The dimension score is weighted score / 10, rounded down to the nearest 0.5. No averaging may conceal a failed hard gate.

## 3. Architectural potential — 10 points

| Criterion | Weight | Evidence required |
|---|---:|---|
| Single coherent reference architecture and conflict resolution | 15% | Canonical document, supersession map, ADR trail, contradiction checks |
| Clear trust zones, authority boundaries and least privilege | 15% | Authority matrix, capability contracts, negative authorization tests |
| Replaceable adapters and stable domain contracts | 10% | Versioned interfaces, compatibility tests, at least two independently replaceable adapters before claiming proven portability |
| Minimality and reuse of mature upstream components | 10% | Component decision records, license/provenance/security/exit analysis |
| Explicit state ownership and consistency model | 10% | One transactional authority, invariants, migrations, concurrency and recovery tests |
| Resilience and failure-domain isolation | 10% | Failure-mode analysis, retry/idempotency/fencing/reconciliation tests |
| Capacity, quota and cost semantics | 10% | Measured capacity, hard budgets, isolated account/issuer/quota domains |
| Security and supply-chain architecture | 10% | Threat model, data-flow model, permission and provenance controls |
| Observability and evidence integrity | 5% | Correlated task/run/job IDs, immutable digests, redaction, audit trail |
| Evolution, migration and rollback strategy | 5% | Versioning policy, compatibility windows, rollback and data migration drills |

**10/10 threshold:** every criterion scores 5; no unresolved architectural contradiction, unowned authority, unbounded cost path, or undocumented trust boundary. A coherent design may be rated highly before deployment, but its operational potential remains a forecast, not a production claim.

## 4. Technical elaboration — 10 points

| Criterion | Weight | Evidence required |
|---|---:|---|
| Domain model and state machines | 12% | Explicit states, transitions, guards, terminal states and illegal-transition tests |
| API, event and task-envelope contracts | 12% | Schemas, versioning, validation, compatibility and replay rules |
| Admission, approval and authorization | 12% | Atomic admission, single-use approval bound to exact envelope, replay/concurrency tests |
| Supervisor, leases and recovery | 12% | Fenced leases, outbox/inbox, ambiguous dispatch reconciliation, crash/stale-worker tests |
| Worker isolation and provenance | 10% | Exact-SHA checkout, path confinement, least privilege, cleanup and evidence digests |
| Provider/account/quota routing | 10% | Issuer/account binding, quota ledger, no key cycling, no paid fallback, live route qualification |
| Security engineering | 10% | Threat model, abuse cases, secret isolation, egress boundaries, dependency and artifact review |
| Test strategy and CI quality | 8% | Unit/contract/integration/adversarial/e2e tests, exact-head required checks |
| Operations and observability | 7% | SLOs, alerting, runbooks, backup/restore, incident and rollback drills |
| Reproducibility and documentation | 7% | One-command or documented reproducible validation, immutable evidence, current context/checkpoint |

**10/10 threshold:** all required Contour A gates are independently verified, CI is green on exact immutable heads, security and recovery tests pass, and a real end-to-end task is reproducible. Until then, technical elaboration is capped at the evidence actually demonstrated.

## 5. Overall project prospects — 10 points

| Criterion | Weight | Evidence required |
|---|---:|---|
| Real user value and coherent first release | 15% | Demonstrated user journey and acceptance tests, not feature inventory |
| Delivery feasibility and sequencing | 15% | Smallest vertical slice, dependencies, owners, exit criteria and measured lead time |
| Free-tier and cost sustainability | 15% | Current terms/limits, budget guardrails, no paid fallback, capacity measurements |
| Security, privacy and governance viability | 15% | Threat model, permission boundaries, independent review, incident response |
| Maintainability and dependency health | 10% | Maintained upstream dependencies, license review, update/exit strategy |
| Reliability and recovery | 10% | Restore drills, fault injection, measurable recovery objectives |
| Extensibility without overengineering | 10% | Adapter contracts and evidence that new profiles do not require core rewrites |
| Evidence-led execution discipline | 5% | Honest status model, immutable artifacts, traceable decisions |
| Adoption and operational usability | 5% | Authenticated phone/desktop usability and feedback from representative users |

**10/10 threshold:** useful end-to-end capability is live, secure, sustainable under actual free-tier constraints, independently accepted and maintainable. Strategic attractiveness alone cannot earn 10.

## 6. Hard caps and non-compensating gates

The following caps apply regardless of weighted arithmetic:

- No authenticated live Jarvis interface: overall technical score maximum 6/10.
- No atomic transactional admission or no durable fenced recovery: technical score maximum 5/10.
- No real qualified worker execution: technical score maximum 5/10.
- No real free provider route with exact issuer/account/quota evidence: provider-routing criterion 0; Contour A cannot be accepted.
- Secrets available to untrusted workers or untrusted PR execution: security criterion 0 and Contour A BLOCKED.
- Paid fallback or cross-account key cycling enabled: quota/cost and security gates fail.
- No independent review or no exact-head CI evidence: no QUALIFIED or ACCEPTED status.
- Persistent Workspace claimed as delivered without authorized host, ingress, storage and restore proof: reject that claim.
- Any unresolved conflict between normative contracts: affected implementation BLOCKED until an ADR resolves it.

A weighted 10 cannot override a hard-gate failure.

## 7. Current evidence-based baseline (2026-11-17)

This is a baseline classification, not an award of points. It deliberately distinguishes design maturity from operational maturity.

| Area | Current status | Score treatment |
|---|---|---|
| Reference architecture consolidation | PROPOSED in PR #120; not merged | Design can be reviewed; not accepted as canonical default-branch state |
| Assurance addendum and scorecard | PROPOSED in PR #122; not merged | Process maturity only |
| Documentation CI | Existing workflow; exact dependent PR head has zero check runs at last read | NOT VERIFIED for PR #122 |
| Governance ruleset | Active, but prior read-back showed no required approving reviews or status checks | Hardening required |
| Authenticated Jarvis | Not verified as deployed | Operational criterion not passed |
| Transactional state and durable Supervisor | Candidate/contracts exist; end-to-end production qualification not demonstrated in this pass | NOT QUALIFIED |
| Real worker execution | Prior no-secret mock/smoke evidence is not a qualified real task | NOT QUALIFIED |
| Free provider route | No exact live account/issuer/quota proof in this pass | NOT QUALIFIED |
| Persistent Workspace | Issue #118 blocker remains | BLOCKED |
| Contour A | Not accepted | NOT ACCEPTED |
| Contour B | Explicitly deferred | OUT OF SCOPE |

No numerical score is assigned where source evidence has not been independently collected. The next assessor must score each row against exact refs, not infer from this table.

## 8. Review protocol

1. Freeze the target default HEAD and all PR head SHAs.
2. Re-read the canonical architecture, ADRs, Context Window, Issues, open PRs, governance and exact-head CI.
3. Collect evidence for each criterion; record missing evidence as NOT VERIFIED.
4. Run design contradiction checks and contract/schema validators.
5. Execute representative and adversarial tests for the claimed implementation scope.
6. Have a reviewer who did not author the evaluated change verify evidence and score.
7. Publish per-criterion score, evidence links, failed gates, residual risks and remediation owner.
8. Re-score only after the remediation is merged and evidence is refreshed.

## 9. Required score report format

Each report must include:
- immutable default HEAD and evaluated PR head(s);
- architecture potential score /10 with 10 criterion rows;
- technical elaboration score /10 with 10 criterion rows;
- overall prospects score /10 with 9 criterion rows;
- hard-gate results;
- exact test/run/artifact evidence;
- independent reviewer identity and review timestamp;
- unresolved risks and next remediation pass.

Do not publish a headline “10/10” without the complete scorecard and independent evidence. The objective is to earn 10/10, not to manufacture it through wording.

## 10. Current next step

Complete the dependent architecture PR review, obtain exact-head CI, and then execute the first no-secret vertical slice. The scorecard itself is not a substitute for implementation. Contour A remains NOT ACCEPTED until every conjunctive acceptance gate is proven.
