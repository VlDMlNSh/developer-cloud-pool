# 2026-11-05 — Free-only workflow policy validator: YAML parser migration

## Result

**PR #11: OPEN / DRAFT. Exact-head CI: SUCCESS. Independent review: NOT RUN.**  
This pass replaces the regex-based policy scanner proposed in PR #10 with Ruby Psych structural YAML parsing, adds adversarial Minitest fixtures, and tightens the dispatch guard to require an explicit `false`.

## Immutable target and live repository state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool (PUBLIC).
- Default branch `Основной` HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #10 remains OPEN / DRAFT / NOT MERGED at `fa308f0178fe332851cc8b5a8c43b564912c37a6`; exact-head CI run `41913465969` SUCCESS; no formal reviews.
- PR #11: https://github.com/VlDMlNSh/developer-cloud-pool/pull/11
- PR #11 head: `53e0bba68a429d9acd8dcbc67d5a2527e0971eda`; base: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #11 remains OPEN / DRAFT / NOT MERGED; review list empty.
- Active ruleset ID `26550182` remains enforced on `refs/heads/Основной`; PR required, zero required approvals, review-thread resolution required, no bypass actors. Classic branch protection endpoint previously reported `protected:false`; do not conflate it with the active ruleset.

## Implementation

1. Added `scripts/validate-free-tier-policy.rb` using Ruby Psych `YAML.safe_load` to parse the complete workflow YAML structure.
2. Enforces literal standard hosted runner labels, per-job timeout 1–30 minutes, matrix `max-parallel` 1–4, no custom job/service images, and no enabled paid-fallback/automatic-upgrade flags.
3. Rejects external reusable workflows because their transitive workflow content cannot be audited in this repository context. Resolves local reusable workflows recursively; missing local references and cycles fail closed.
4. Added `scripts/validate-free-tier-policy-test.rb` with 13 Minitest cases covering standard labels, arrays/dynamic selectors, large/GPU/self-hosted labels, timeout bounds, job/service images, matrix bounds, paid fallback, invalid YAML, local reusable workflow recursion/missing/cycle, external reusable workflows and YAML anchors/aliases.
5. Wired both validator and tests into `.github/workflows/pool-contract-validation.yml`.
6. Changed dispatch gate from “reject only true” to “require exactly false”; unset and unexpected values now fail closed.
7. Updated `docs/architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md`.

## Verification evidence

Final exact-head run:
- Workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41916664912
- Run ID: `41916664912`
- Job ID: `126878059527`
- Target SHA: `53e0bba68a429d9acd8dcbc67d5a2527e0971eda`
- Status: COMPLETED / SUCCESS.
- YAML syntax parse: PASS for all 5 workflow files.
- Free-only policy validator: PASS for all 5 workflow files.
- Minitest: 13 runs, 29 assertions, 0 failures, 0 errors, 0 skips.
- Existing pool security contract validator: PASS.
- The workflow job environment exposed `POOL_DISPATCH_ENABLED=false` at this run. This is run-time evidence for that execution only, not a separate settings read or a guarantee of future value. The guard now requires exactly `false`.
- Runner: standard `ubuntu-24.04`; token permissions logged as contents:read and metadata:read. No provider API, DSH, browser, Worker, Supervisor dispatch or Resource Probe was executed.

Failed intermediate CI attempts are retained in GitHub history and are not hidden:
- `41915977820`, `41916129700`, `41916185807`, `41916468832`, `41916542880` — failed while correcting regex escaping and adversarial fixture indentation/newline/alias construction.
- `41916576636` — intermediate revision passed.
- `41916664912` — final exact-head revision passed.

## Changed file blob SHAs after readback

- `scripts/validate-free-tier-policy.rb`: `69f7e284abd0695e4e513494feab72249acf7248`
- `scripts/validate-free-tier-policy-test.rb`: `4f7e1de10ccb6da1bc3c023d46fe9ed4ae0d9f07`
- `.github/workflows/pool-contract-validation.yml`: `f2b09887725b3c81793d446479a3f0afcdbaeb5c`
- `docs/architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md`: `fc0da58cc9affac2e4d8c2bb639a989c9b8453dd`

All four files were reread from the branch after the final commits and their blob SHAs confirmed.

## Limitations and remaining blockers

- PR #11 has no independent GitHub review. CI success is not independent security acceptance.
- PR #10 remains open/draft and contains the earlier regex implementation. Do not merge PR #10 separately; it is superseded by the structured parser approach, but its lifecycle has not been changed.
- The validator rejects external reusable workflows instead of fetching/auditing remote workflow graphs. This is deliberate fail-closed behavior; an explicit pinned remote-workflow evidence mechanism would be needed before allowing them.
- The controller `.github/workflows/gemini-batch-dispatch-controller.yml` remains absent. Gemini agents were NOT RUN; no controller run IDs, child job IDs, reports or artifact digests exist.
- No provider free quota or zero-paid-fallback model route is qualified. No secrets were read. Pool runtime dispatch remains disabled.
- No integration or deployment occurred.

## Next bounded step

Obtain an independent review of PR #11 and its parser edge cases, especially duplicate YAML mapping keys, YAML merge keys, reusable workflow resolution and workflow-dispatch gate semantics. Keep PR #11 draft until that review is complete. Then reconcile PR #10 as superseded without merging its regex implementation. Gemini controller work remains blocked until provider quota, exact credential contract and controller provenance are independently qualified.

## Canonical references

- [PR #11](https://github.com/VlDMlNSh/developer-cloud-pool/pull/11)
- [PR #10](https://github.com/VlDMlNSh/developer-cloud-pool/pull/10)
- [Current default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9)
- [Free-only workflow contract](../architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md)
- [Gemini controller design contract](../architecture/GEMINI-REVIEW-CONTROLLER-CONTRACT.md)


## Post-verification path-filter refinement

The validation workflow's pull-request and push path filters now also include the Free-only policy contract, `docs/reports/**` and `docs/checkpoints/**`. This ensures policy documentation and evidence updates are checked by the same workflow. The code-level test evidence above remains tied to SHA `53e0bba68a429d9acd8dcbc67d5a2527e0971eda`; subsequent changes in this pass are limited to workflow path filters and documentation. A later docs-inclusive exact-head run `41917121933` completed SUCCESS on SHA `20b68e8a6fffbc43ad42335603faabd83719ae36`. Because the path filters intentionally include reports and checkpoints, this report/checkpoint refresh itself triggers a new exact-head run. The latest run attached to PR #11 is the authoritative final-head result; no fixed run ID is embedded here to avoid a self-referential evidence update.
