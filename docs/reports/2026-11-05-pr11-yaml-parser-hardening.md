# 2026-11-05 — PR #11 YAML parser hardening and exact-head verification

## Outcome
PR #11 received a bounded parser-hardening implementation on its existing work branch. Two ambiguous YAML constructs are now rejected before Psych object loading: duplicate mapping keys and YAML merge keys. Non-scalar mapping keys are rejected as well. A separate policy correction accepts the standard `windows-2022` hosted runner label.

## Immutable target and repository state
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool (PUBLIC).
- Default branch `Основной` HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Work branch: `fix/free-tier-yaml-policy-validator-2026-11-05`.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/11
- PR head: `7b3bd8d8840e122f03326299444a921e3ba5f425`.
- PR base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR state: OPEN / DRAFT / NOT MERGED; mergeable reported true.
- GitHub review submissions: empty; independent review NOT RUN.
- Review threads: empty.

## Changes
1. Added a Psych AST pass before `YAML.safe_load`.
2. Reject duplicate mapping keys before Psych can silently collapse conflicting values.
3. Reject YAML merge keys (`<<`) to avoid implicit merged mappings; ordinary aliases remain supported.
4. Reject non-scalar mapping keys.
5. Corrected Windows standard runner matching from two-digit years to `windows-20XX`, covering `windows-2022`.
6. Added three regression tests across the hardening increments: duplicate mapping key, merge key, and standard Windows runner.

## Exact-head CI evidence
- Workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41918209585
- Run ID: `41918209585`
- Job ID: `126883451219`
- PR head tested: `7b3bd8d8840e122f03326299444a921e3ba5f425`.
- GitHub merge ref checked out by the job: `43096d7efb07054601ab04861e1d86390e313df0` (full merge-ref SHA verified by GitHub commit lookup).
- Terminal status: COMPLETED / SUCCESS.
- All five workflow YAML files parsed.
- Free-only policy validator: PASS.
- Minitest: 16 runs, 33 assertions, 0 failures, 0 errors, 0 skips.
- Existing pool contract validator: PASS.
- Job environment observed `POOL_DISPATCH_ENABLED=false`; this is run-scoped evidence, not an independent settings API read.
- Runner: standard `ubuntu-24.04`; permissions remain read-only.

An earlier exact PR-head run after the duplicate/merge-key hardening, before the Windows-label correction, also completed SUCCESS:
- Run `41918030195`, job `126882908703`.
- 15 runs, 31 assertions, 0 failures/errors/skips.
- Superseded by the later final-head run above.

## Read-back blob evidence
- `scripts/validate-free-tier-policy.rb`: `fcdcd916f107b4f09de5e7aa2f8a5d2a06be74bb`.
- `scripts/validate-free-tier-policy-test.rb`: `5ae50057aeb817a11555a6d13358bdb7edd328df`.
- `docs/architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md`: `d49208f6010991005f2cc0b80db3a984f3f2c8de`.
All three were fetched again from the work branch after updates; content markers and test count were checked.

## Security and scope boundaries
- No secrets or provider credentials were read.
- No variables or repository settings were changed.
- No Worker, Supervisor dispatch, DSH, Resource Probe, browser or model/provider execution was performed.
- No paid runner/API/storage/fallback was used.
- Gemini agents were NOT RUN: the approved Gemini batch controller remains absent from the default-branch workflow tree.
- No PR merge, qualification, deployment or acceptance occurred.

## Remaining review findings / caveats
- PR #11 still requires an independent review. This implementation pass is not independent acceptance.
- The parser AST pass is deliberately conservative. Confirm duplicate-key behavior for all scalar tag/style combinations and anchor/alias edge cases with an independent reviewer.
- The validator's Windows label policy is now aligned to the documented `windows-20XX` label family; future hosted runner labels require explicit policy updates and tests.
- PR #7 Worker caller-provenance gap, PR #8 isolated matrix builder, PR #9 corrective governance revert and PR #10 superseded regex validator remain unresolved.
- Do not merge PR #11 or enable dispatch on CI success alone.

## Next bounded step
Use the attached three-role read-only review packet against immutable target SHA `7b3bd8d8840e122f03326299444a921e3ba5f425`. Gemini dispatch remains NOT RUN unless the approved controller and all its governance/credential/quota/provenance gates are verified. In parallel, continue only static design work that does not invoke pool runtime.
