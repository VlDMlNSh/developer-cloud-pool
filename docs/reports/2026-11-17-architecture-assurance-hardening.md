# Architecture assurance hardening — 2026-11-17

**Status:** Proposed follow-up to PR #120; review and exact-head CI required  
**Contour:** A only  
**Parent PR #120 baseline:** `fb14505b58a6c562778232052befa8fd3a083266`  
**Follow-up branch:** `docs/architecture-assurance-hardening-2026-11-17`  
**No runtime changes:** true

## Why this pass was necessary

PR #120 already consolidated the system architecture, authority boundaries, persistence ownership, provider/account isolation, security baseline, worker profiles, Jarvis target, and acceptance gates. The independent review confirmed that much of the previous critique was already represented there. Rather than create a competing reference architecture, this pass adds a subordinate normative assurance document focused on delivery discipline and unresolved decisions.

## Changes

1. Added [Architecture Assurance Addendum](../architecture/CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md).
2. Linked the addendum from the canonical Reference Architecture 1.0 as Section 22.
3. The addendum defines a minimum vertical-slice order, first end-to-end no-secret proof, component decision record, anti-proliferation rules, dynamic capacity semantics, explicit state ownership, deployment security evidence, strict status vocabulary, conjunctive Contour A acceptance, architecture change control and a dated blocker register.
4. No code, workflow, secret, repository variable, dispatch gate, provider route, host, infrastructure resource or Contour B file was changed.

## Repository state observed

- Default branch: `Основной`.
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Parent architecture PR #120: OPEN / DRAFT / UNMERGED at the observed head `fb14505b58a6c562778232052befa8fd3a083266`.
- Parent PR head check-runs: 0; combined status: pending with 0 contexts. Exact-head CI is NOT VERIFIED.
- Active ruleset ID `26550182`; previous read-back documented PR/thread-resolution requirements but zero required approvals and no required status contexts. Ruleset governance remains insufficient for production acceptance.
- Issue #118: persistent Engineering Workspace remains BLOCKED; no authorized host, Access ingress or restore evidence.
- Issue #115: Claude Code/FCC/ECC runner qualification remains open; mock/no-secret runtime evidence is not a real provider route or task execution.
- Contour A remains NOT ACCEPTED. Contour B remains DEFERRED.

## Validation

- Parent PR and branch were read before editing.
- Follow-up branch was created from the exact parent PR head above.
- GitHub confirmed the addendum file commit `ce61e10e4d5d48763d48745c3a2c1c1a783167b1`.
- GitHub confirmed the parent architecture link update commit `b141bcb6283023fcf1230e37d54f01110a8a5e6c`.
- Runtime tests: NOT RUN (documentation-only).
- Local markdown validator: NOT RUN (no local checkout/runtime used).
- Exact-head GitHub CI: pending trigger/read-back; NOT VERIFIED until checks complete.
- Independent architecture/security review: NOT RUN.

## Blockers

1. Parent PR #120 is still open and draft; the follow-up is also unmerged.
2. No required independent approving review or required status checks are configured on the observed default ruleset.
3. Hosted transactional state, durable supervisor lease/recovery, real free provider route, authenticated Jarvis and persistent workspace remain unqualified or blocked.
4. Architecture documents can reduce ambiguity but cannot substitute for implementation, live evidence or independent acceptance.

## Next step

Read back every changed file and verify the exact follow-up branch HEAD. Then create a draft PR targeting the existing PR #120 branch (not the default branch) so the architecture amendment is reviewed as a dependent change. Run exact-head architecture documentation and pool contract validation. Do not merge either PR or enable dispatch without independent review and governance.

Canonical architecture: [Cloud Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).  
Assurance addendum: [Architecture Assurance Addendum](../architecture/CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md).  
Canonical context: [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md).
