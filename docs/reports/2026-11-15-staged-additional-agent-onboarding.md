# 2026-11-15 — staged onboarding of additional development agents

## Decision
The development pool should grow beyond the initial three Gemini roles, but expansion is incremental and evidence-gated. The three Gemini agents remain the first stable baseline: Agent 1 engineering/research, Agent 2 contract/test verification, Agent 3 security/provenance review.

## Rollout sequence
1. Repair and qualify the existing three-agent controller path; do not bypass its approved controller or dispatch gates.
2. Demonstrate repeatable 3/3 execution on immutable target SHAs, with unique per-dispatch branches, correlated child run/job IDs, artifact digests, and successful reconciliation.
3. Add candidate agents one at a time, each with a defined role, permitted repository/actions, free-tier route, identity/quota isolation, timeout/resource budget, and output/evidence contract.
4. Run new candidates in bounded, non-authoritative evaluation first. Require independent review and adversarial tests before granting write or dispatch capabilities.
5. Increase concurrency or make agents part of regular /next waves only after measured reliability, cost/quota compliance, security, provenance, and governance approval.

## Guardrails
- No paid fallback; never merge credentials, accounts, quota domains, or permissions.
- No direct child-workflow dispatch or controller bypass.
- No agent receives authority merely because its tool or model is technically available.
- Preserve separate engineering, verification, and security roles; avoid self-approval and correlated-review claims.
- New agent onboarding must not delay or displace Contour A critical-path work.
- Chat /next is not itself a GitHub Actions event; any bridge to Issue #301 must be explicitly implemented and gated.

## Current status
- Initial Gemini 3-agent controller: existing but live repaired 3/3 execution is NOT RUN / NOT VERIFIED.
- PR #649: OPEN/DRAFT/UNMERGED; prompt-only branch enforcement finding F-01 remains OPEN / CHANGES REQUIRED.
- Additional non-Gemini agent onboarding: PLANNED, not dispatched.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next step
Resolve F-01 with machine-enforced branch/PR provenance and adversarial tests, obtain required independent review/governance, then perform one controlled 3-agent dispatch. Only after repeatable qualification should the first additional agent candidate be evaluated.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md