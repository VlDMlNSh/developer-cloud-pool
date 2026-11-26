# Pass 106 checkpoint — strict envelope validator

- Date: 2026-11-26.
- Status: validator/test wiring SUCCEEDED; runtime integration NOT VERIFIED.
- Base: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Branch: `integration/pass105-api-attested-envelope-contract-2026-11-26`.
- Added dependency-free `scripts/owner-next-api-attestation-envelope.mjs`: strict schema, fixed ordered-array SHA-256 digest, domain separator, duplicate JSON key rejection, provenance/policy checks.
- Added `scripts/owner-next-api-attestation-envelope.test.mjs` with valid and adversarial cases.
- Pool Contract Validation now runs both owner-event audit and envelope tests.
- Local test execution NOT RUN: git clone failed because github.com DNS was unavailable. CI not yet observed.
- API verifier construction, D1 consumption, migration 0018 and same-run end-to-end test NOT IMPLEMENTED.
- No D1/live event/secrets/provider/dispatch/deployment/merge/production writes. Security review and Gemini/Claude/ECC/FCC NOT RUN. Active time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: port D1 ledger, add migration 0018 and D1-side envelope verification, then controller-to-receipt mocked end-to-end test. Keep dispatch=false.


## CI correction and final validation boundary

- PR #177 opened Draft against `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`. Initial merge-result run `45879474164` completed SUCCESS on merge SHA `70989a36afba9ec72c4e54579c0aa54eb9bb7b30`; logs proved YAML parsing, `POOL_CONTRACT_VALIDATION=PASS`, and `POOL_DISPATCH_ENABLED=false`, but did **not** execute Node test suites. The initial test-command insertion targeted the wrong workflow text and had no effect.
- Corrected `.github/workflows/pool-contract-validation.yml` to run `node --test scripts/owner-next-event-audit.test.mjs scripts/owner-next-api-attestation-envelope.test.mjs` after contract validation. Correction commit: `ff55291b2b2ea33ce94d861fd2f0af142bc97bd9`.
- A new run for correction head was not returned by the Actions lookup at last observation. Therefore the envelope and owner-event Node tests remain NOT VERIFIED by execution; do not count run `45879474164` as test evidence.
- Local clone/test attempt remains blocked by DNS failure resolving github.com. The corrected CI command is in the PR diff but its execution is pending/NOT VERIFIED.


## Executed CI evidence and current-tip caveat

- Draft PR #177: https://github.com/VlDMlNSh/developer-cloud-pool/pull/177
- Candidate head at PR creation: `e9a9dea03fdd78e2789c8314cae384da51953bc9`; merge-result run `45879474164` SUCCESS on `70989a36afba9ec72c4e54579c0aa54eb9bb7b30` did not execute Node tests. It only established YAML syntax, static pool contract and dispatch gate false.
- Corrected CI command at commit `ff55291b2b2ea33ce94d861fd2f0af142bc97bd9` then ran under PR merge-result run `45879528386` (job `140115037739`), SUCCESS. Log evidence: six workflow YAML files parsed; `POOL_CONTRACT_VALIDATION=PASS`; `POOL_DISPATCH_ENABLED=false`; envelope suite `# tests 20 / # pass 20 / # fail 0`, including duplicate JSON key rejection, policy lockout, provenance mismatch and digest tampering.
- The first corrected command also named an owner-event test path absent from this clean-base branch. The log proves the envelope suite ran (20/20), but no owner-event suite result is claimed. Workflow command has since been narrowed to only `node --test scripts/owner-next-api-attestation-envelope.test.mjs` in commit `960abc3af2651a8357f5b31623673820fb178993`.
- Latest PR head after this command correction: `960abc3af2651a8357f5b31623673820fb178993`. No Actions run was returned for this exact head at last lookup. Thus final-tip CI is NOT VERIFIED; run `45879528386` is merge-result evidence for the immediately preceding commit only.
- PR #177 remains Draft/unmerged; formal reviews 0; review threads 0. No merge.


## Latest merge-result CI requalification

- After narrowing the test command to the envelope test file only, PR #177 current code/workflow tip was `535e4fac6418209e13b33801308fdc42b95cbabc`.
- Pool Contract Validation run `45879712743` / job `140115662601` completed SUCCESS. It checked out PR merge-result commit prefix `9b2d7f4` (merge-result validation, not standalone head checkout).
- Job logs: six workflow YAML files parsed; `POOL_DISPATCH_ENABLED=false`; `POOL_CONTRACT_VALIDATION=PASS`; Node envelope suite `20 tests / 20 pass / 0 fail`, including duplicate-key rejection and read-only policy assertions.
- This is the strongest current CI evidence for the implementation. It is merge-result CI on the code/workflow tip, not exact-head CI. Subsequent docs-only updates may advance branch HEAD; no CI claim is transferred to a later docs-only SHA.
- PR #177 remains Draft/unmerged, reviews 0, threads 0. No merge or dispatch.
