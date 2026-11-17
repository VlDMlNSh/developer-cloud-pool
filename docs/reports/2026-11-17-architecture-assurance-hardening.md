# Architecture assurance hardening — 2026-11-17

**Status:** Proposed dependent amendment to PR #120; review and exact-head CI required  
**Contour:** A only  
**Immutable parent PR #120 head used as base:** `9ebb56edd55f5015b66f7b3f17d1114d1884a492`  
**Branch:** `docs/architecture-assurance-hardening-v2-2026-11-17`  
**Runtime changes:** none

## Rationale

PR #120 already consolidated the system architecture, authority boundaries, persistence ownership, provider/account isolation, worker profiles, security baseline, Jarvis target and acceptance gates. This pass does not create a competing architecture. It adds a subordinate normative assurance document to close delivery and governance ambiguities: over-design risk, minimum end-to-end path, component proliferation, capacity semantics and measurable acceptance.

## Changes

1. Added [Architecture Assurance Addendum](../architecture/CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md).
2. Added Section 22 to Reference Architecture 1.0 linking the addendum.
3. The addendum defines vertical-slice delivery, the first no-secret end-to-end proof, component adoption decision records, anti-proliferation rules, dynamic capacity semantics, explicit state ownership, security evidence, status thresholds, conjunctive Contour A acceptance and architecture change control.
4. No runtime code, workflows, secrets, repository variables, dispatch gates, provider routes, hosts, infrastructure resources or Contour B files changed.

## Repository facts observed

- Default branch: `Основной`; observed HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Parent PR #120: OPEN / DRAFT / UNMERGED; current head at branch creation: `9ebb56edd55f5015b66f7b3f17d1114d1884a492`.
- Earlier attempted dependent PR #121 was based on a stale parent head and was observed 27 commits behind / diverged; it must not be merged. A replacement dependent PR is opened from the current parent head.
- Parent PR #120's current exact-head CI must be re-read; prior check-run read at earlier head returned 0. No CI result is inferred from this.
- Default ruleset ID `26550182`; last observed governance has PR/thread-resolution requirements but zero required approvals and no required status checks.
- Issue #118: persistent Engineering Workspace remains BLOCKED.
- Issue #115: Claude Code/FCC/ECC installation/mock evidence does not prove real provider route or agent task execution.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Validation

- Follow-up branch created from the exact current parent PR head.
- GitHub confirmed addendum commit `c89943bce0f4373b77fe8c38b528f95031474181`.
- GitHub confirmed Reference Architecture link commit `18ecadb2bad555e49c7dda825ffbb941ec5ed128`.
- Runtime tests: NOT RUN (documentation-only).
- Local Markdown validator: NOT RUN.
- Exact-head CI: NOT VERIFIED pending GitHub read-back.
- Independent architecture/security review: NOT RUN.

## Blockers

1. PR #120 remains open and draft; this dependent amendment is also open/draft.
2. Default branch governance does not yet enforce independent approvals or required status checks.
3. Hosted transactional state, durable Supervisor, real free provider route, authenticated Jarvis and persistent Workspace remain unqualified or blocked.
4. Architecture documents cannot substitute for runtime evidence or independent acceptance.

## Next step

Review the dependent PR against the current PR #120 head, run exact-head architecture documentation and pool contract validation, and obtain independent review. Do not merge either PR or enable dispatch until governance and all required gates pass.

Canonical architecture: [Cloud Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).  
Assurance addendum: [Architecture Assurance Addendum](../architecture/CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md).  
Canonical context: [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md).
