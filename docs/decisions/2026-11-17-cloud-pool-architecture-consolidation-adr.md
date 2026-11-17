# ADR-0015 — Consolidate Cloud Development Pool around a governed control plane

- Date: 2026-11-17
- Status: PROPOSED / REVIEW REQUIRED
- Scope: Contour A / Developer Cloud Pool only
- Target baseline: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Supersedes: conflicting system-level statements only; does not supersede detailed protocol contracts or immutable historical reports.

## Context

The repository has accumulated useful architecture documents, isolated proofs, open implementation branches and historical checkpoints. The current Context Window is stale (last refreshed 2026-11-08), while the default branch contains work through 2026-11-16 and PR #116 contains 2026-11-17 Claude Code/FCC/ECC installation and loopback runtime lifecycle evidence. Several documents use different maturity labels and there is a risk of treating local proof or successful CI as deployed qualification.

The architecture also needs a clear distinction between short-lived GitHub-hosted execution workers and a persistent interactive Engineering Workspace. GitHub Actions cannot serve as the durable web host, filesystem or transactional state authority.

## Decision

Adopt [Cloud Development Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md) as the single system-level target architecture.

The platform is a governed control plane, pluggable isolated execution plane, and separately qualified persistent workspace. Jarvis is the only user-facing control console. Authority is enforced by server-side identity, capability, route evidence, quota, atomic admission, durable lease and dispatch controller boundaries.

One transactional state authority must own mutable task/admission/attempt/lease/outbox/quota state. Cloudflare D1 remains the preferred candidate because isolated D1/Workers proofs exist, but it is not production-selected or qualified until hosted identity, free-tier, transaction, security, backup/restore and independent review gates pass. GitHub Issues and Actions are intake/projection/evidence, not locks.

Gemini continues exclusively through the approved controller. Provider accounts and quota domains remain isolated. Workers receive no provider secrets by default. No paid fallback is permitted.

## Alternatives considered

1. **Continue adding independent components and documents.** Rejected: increases architectural drift and makes it difficult to identify the current contract.
2. **Use GitHub Issues/labels and Actions concurrency as the authoritative queue/lease.** Rejected: neither provides a durable compare-and-swap claim across all actors or safe ambiguity recovery.
3. **Use GitHub Actions as the persistent workspace/web host.** Rejected: hosted runners are ephemeral and unsuitable for durable user sessions/filesystem.
4. **Make D1 and PostgreSQL co-equal state authorities.** Rejected: creates split-brain and cross-store transaction gaps.
5. **Build a proprietary agent framework and IDE.** Rejected: use mature tools behind narrow adapters; retain only project-specific governance and integration logic.

## Consequences

Positive:
- One clear system-level architecture and explicit source-of-truth hierarchy.
- Reduced custom implementation and fewer competing state authorities.
- Clear difference between design, proof, runtime qualification and acceptance.
- Safer provider/account/secret boundaries.
- Testable phase gates and failure semantics.

Trade-offs:
- Hosted transactional state, identity and workspace still require implementation and owner-authorized infrastructure.
- Some current docs/PRs may need explicit reconciliation; no automatic mass rewrite or merge is authorized.
- The target architecture is intentionally stricter than the current implementation and must not be described as deployed.

## Required follow-up

1. Update README and Context Window to point to the canonical architecture.
2. Reconcile any older architecture wording that conflicts with the new system-level decisions.
3. Add contract validation for the required invariants and architecture links.
4. Obtain independent review and exact-head CI.
5. Keep all dispatch and provider calls disabled until their existing gates pass.

## Acceptance

This ADR is accepted only when merged to the protected default branch after review. It does not accept Contour A.
