# Pass 106 — strict API-attested envelope validator

Date: 2026-11-26

## Status

- **SUCCEEDED (implementation scope):** added a dependency-free Node.js v1 envelope validator, fixed-order canonical digest and strict JSON parser with duplicate-key rejection.
- **SUCCEEDED (test wiring):** added adversarial node:test cases and included them in Pool Contract Validation.
- **NOT VERIFIED:** tests have not executed in this environment; a local clone attempt failed because github.com DNS/network access was unavailable. CI is pending PR creation/run.
- **NOT IMPLEMENTED:** API verifier does not yet construct the envelope; D1 binder/migration/receipt do not yet consume it. No same-run integration.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Frozen base and scope

- Base/default `Основной`: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Working branch: `integration/pass105-api-attested-envelope-contract-2026-11-26`.
- Scope: pure validation/canonicalization module, node:test suite, CI test invocation. No D1 files/migrations, workflow controller permissions, secrets, runtime bindings, dispatch or execution authority changed.

## Implementation

Added `scripts/owner-next-api-attestation-envelope.mjs`:
- exact top-level and nested key sets; unknown/missing keys rejected;
- fixed schema/version, repository/owner/issue/action/profile and owner identity checks;
- exact `/next` body and SHA-256 body digest check;
- canonical decimal IDs and lowercase SHA-1/SHA-256 format checks;
- attempt=1 only; run head must equal API-observed default head; workflow-file blob ref must equal run head;
- workflow commit SHA and Contents API Git blob SHA remain separate fields;
- fixed ordered-array UTF-8 canonical representation and SHA-256 domain separation;
- supplied digest independently recomputed and compared;
- strict JSON duplicate-key scanner before JSON.parse, because standard JSON.parse uses last-key-wins behavior;
- every accepted verification result returns `dispatch:false` and `executionAuthorized:false`.

Added `scripts/owner-next-api-attestation-envelope.test.mjs` for valid envelope, unknown/unsupported fields, owner/repository/body substitution, malformed IDs/SHAs, stale ref, run/workflow mismatch, rerun, dispatch policy, digest tampering, duplicate JSON keys, malformed JSON and deterministic digest.

Updated `.github/workflows/pool-contract-validation.yml` to execute both owner-event audit tests and envelope tests.

## Reuse First

- Reuse Node built-in `node:crypto`, `Buffer`, `node:test`, and existing Pool Contract Validation workflow.
- No new package or dependency.
- This validator is intentionally independent of PR #175 D1 code until the D1 branch is ported into the clean integration branch and its adapter consumes the same contract.

## Validation boundary

- GitHub source files and commit writes were read back in the connector during the pass.
- Local execution was attempted with `git clone`, but the environment could not resolve github.com; therefore local tests are NOT RUN.
- No PR/CI evidence is claimed in this report until the draft PR and exact candidate CI run are observed.
- The validator validates a supplied envelope; it does not prove the API verifier created that envelope. Caller-origin binding remains a required integration gate.
- Duplicate keys are rejected in raw JSON before object parsing. This does not replace D1-side independent provenance validation or digest recomputation.

## Non-actions

No hosted D1, live issue_comment, provider calls, executor dispatch, secret values, repository variable reads, deployment, merge, production writes or governance changes. Gemini/Claude/ECC/FCC: NOT RUN. Independent security review: NOT RUN. Active engineering time: NOT MEASURED.

## Next bounded pass

Port the required D1 ledger into this clean integration branch, add migration 0018 preserving workflow commit SHA and workflow-file blob SHA separately, extend receipt read-back and replay matching, then make the D1 binder independently parse/validate/recompute this envelope. After that, wire the controller API verifier to create the envelope and add a single mocked Workers-runtime end-to-end test. Keep dispatch=false.

## Links

- Contract: `docs/contracts/2026-11-26-owner-next-api-attested-envelope-v1.md`
- Controller PR #176: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- D1 PR #175: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


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
