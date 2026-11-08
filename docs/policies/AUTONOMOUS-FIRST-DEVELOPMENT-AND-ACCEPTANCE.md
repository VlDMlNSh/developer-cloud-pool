# Autonomous-First Development and Acceptance Policy

Date: 2026-11-08
Status: PROJECT RULE — ADOPTED
Scope: Cloud Development Pool / Contour A. This policy supersedes earlier continuation notes that made an external independent APPROVE a universal prerequisite for every development step or for starting a controlled, fail-closed qualification sequence. It does not waive security gates, least privilege, exact-head CI, provenance, or final acceptance criteria.

## Decision

Build and qualify Cloud Development Pool using an Autonomous First workflow. External independent review is not a mandatory gate for every implementation iteration. The project may progress through bounded engineering, automated verification, and controlled infrastructure qualification without waiting for an external reviewer, provided the applicable security/governance gates pass and the system remains fail-closed.

The running pool will later conduct structured, multi-role independent audits of its own components. Self-audit is useful qualification evidence, but is not by itself proof of independence and cannot authorize its own privileged actions or declare final acceptance.

## Required operating sequence

1. Implement bounded changes against immutable target SHAs and explicit acceptance criteria.
2. Run unit, contract, integration, regression, security and exact-head CI checks appropriate to the change.
3. Review diffs, permissions, provenance, resource budgets and secret boundaries; never read or expose secret values.
4. Advance through staged, least-privilege qualification. Keep dispatch disabled until authorization, claim safety, recovery and isolation controls are verified.
5. Once the pool is safely operational, use separate audit roles/contexts for implementation review, contract/test verification, and security/governance/provenance review. Record target SHA, run/job IDs, artifacts and digests, findings, and conflicts of interest.
6. Resolve findings and rerun checks. Preserve auditable evidence in GitHub.
7. Final Contour A acceptance remains a distinct decision based on demonstrated web UI access, real worker execution, safe model routing, quotas, secret isolation, durable state/recovery, security/governance controls, and recorded qualification evidence. No agent may self-assign ACCEPTED.

## Status semantics

- AUTONOMOUSLY_QUALIFIED: project-defined automated and multi-role checks passed for the stated target; does not imply external independence or final acceptance.
- ACCEPTED: Contour A's full published acceptance criteria have been met and evidenced.
- NOT VERIFIED / BLOCKED: evidence is missing, gates fail, or results are inconclusive. Absence of evidence is never success.

## Non-negotiable safeguards

- No dispatch, provider/model invocation, deployment, or privileged execution until its specific authorization and security gates pass.
- No bypass of approved Gemini controller routes, issuer/capability boundaries, or secret isolation.
- Do not treat a green CI run, a registered credential, or a self-review as proof of production readiness.
- External independent review may be requested for high-risk decisions or final assurance, but it is not a blanket prerequisite for every development step.
- Contour B / MediaHub product development remains deferred until Contour A is ACCEPTED.

## Immediate application to current work

Continue with PR #37 / Issue #38 by resolving durable single-use claim and Finalizer correctness using test-first engineering, exact-head CI, least-privilege analysis and staged tests. Do not hold routine remediation solely for an external APPROVE. Keep both dispatch gates fail-closed until the technical and governance criteria for the specific operation are demonstrated.

