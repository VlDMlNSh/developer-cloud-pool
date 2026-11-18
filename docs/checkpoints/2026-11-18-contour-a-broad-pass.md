# Contour A checkpoint — 2026-11-18 broad pass

## Owner sequencing decision
Independent/external reviews are deferred until the pool is operational and can execute its own bounded review workflow. Continue exact-head CI, deterministic tests, source inspection and evidence checks; do not mislabel these as independent review or acceptance.

## Immutable baseline
- Default branch: `Основной`
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Ruleset: `26550182` active; PR required; zero required approvals; review-thread resolution required; no bypass actors.

## Critical finding
Scheduled Supervisor run [44272871545](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44272871545) was a heartbeat-only SUCCESS with `POOL_DISPATCH_ENABLED=false`; it did not execute a task. Default-branch code still had a dormant label-driven DSH dispatch path that could mutate Issues and dispatch the legacy DSH Worker if the variable were enabled. The old Worker was also manually dispatchable and used an issue label rather than the D1 admission receipt.

## Work executed
- Created [PR #126](https://github.com/VlDMlNSh/developer-cloud-pool/pull/126), branch `fix/retire-legacy-label-dispatch-2026-11-18`, base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR final head: `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- Supervisor is reduced to scheduled heartbeat; if the old dispatch variable is `true`, it fails closed. Removed Issues/Actions write permissions, GitHub token injection and old issue/workflow-run/manual triggers.
- Legacy DSH Worker now only emits an explicit retirement error; no task inputs, checkout, external action, token, runtime installation or execution.
- Pool Contract Validation now asserts these retirement invariants.
- Exact-head Pool Contract Validation [44275194245](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44275194245): COMPLETED / SUCCESS on final PR head `f69f286b5b5a3de8dfdd80ed581859851ce271e5`; YAML syntax, pinned-action checks and security contract validation passed.
- PR #126 remains OPEN / DRAFT / UNMERGED. No merge, production dispatch, provider call, secret read, paid fallback, Gemini dispatch, deployment or Contour B work.

## Existing implementation evidence and gaps
- PR #116 current head `754f42b0b7fa84c73e90cececc6f3d8a65877fab`: no-secret Claude Code/ECC/FCC runner installation and synthetic handoff passed Runner Qualification [44273710771](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771) and Pool Contract Validation [44273710870](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710870). No real provider route/account/quota qualification.
- PR #114 D1 atomic admission local Workers-runtime proof, head `ab9461eb84b14fe230918391d5212f19ca25592c`; hosted D1 and live controller NOT VERIFIED.
- PR #125 GitHub Actions context composition proof, head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`; local CI SUCCESS. It still allowlists legacy `dsh-headless-probe`; its expected `cloud-pool-next-controller.yml` is absent from default branch. Not a deployed controller.
- PR #112 validates owner event envelope only; no durable admission.
- PR #120 canonical architecture consolidation is OPEN/DRAFT/UNMERGED.
- Issue #118 persistent Engineering Workspace remains blocked by no active authorized host #3, no verified Access/Tunnel and no backup/restore proof.

## Next dependency-ordered steps
1. P1: harden first CODE executor runtime (PATH ownership, HOME/XDG credential surfaces, installer/binary integrity provenance, actual egress enforcement); resolve hosted-use and license boundaries.
2. P2: qualify one free FCC route with account identity, quota domain, reset/rate-limit semantics and free eligibility. No cross-account fallback or paid fallback.
3. P3: reconcile PRs #112/#114/#125, remove legacy DSH profile from admission and use only the qualified CODE profile; add the real default-branch `issue_comment` controller; provision hosted D1 only after local proof and free-tier/data-retention checks.
4. P4: implement durable claim/lease/fencing/attempt/outbox/finalization/recovery and exact worker identity.
5. P5: authenticated read-only Jarvis Web using mature components; static hosting is not the API/control plane.
6. P6: resolve persistent workspace, Zero Trust, filesystem, worktree isolation and backup/restore. Complete repeated operational qualification before Contour A acceptance.

## Canonical references
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Broad Contour A plan and legacy dispatch retirement report](../reports/2026-11-18-contour-a-broad-plan-and-legacy-dispatch-retirement.md)
- [PR #126](https://github.com/VlDMlNSh/developer-cloud-pool/pull/126)
- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Canonical architecture PR #120](https://github.com/VlDMlNSh/developer-cloud-pool/pull/120)
