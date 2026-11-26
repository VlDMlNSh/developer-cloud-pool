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
