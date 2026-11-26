# Pass 107 checkpoint — API attestation / D1 compatibility audit

- Date: 2026-11-26.
- Status: source audit VERIFIED; API verifier → D1 composition BLOCKED.
- Frozen common integration base: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #175 D1 head `3d69bc943677dba909792bf4930d4c0aa5d2233f`; PR #176 controller head `f06155b8ac121a4af90cbc2356f12b965d0fbde9`; PR #177 envelope branch previously `cdefc13eca8d7c71fec7447e1a73aa95bdc92411`. All Draft/unmerged; reviews 0.
- Finding: PR #176 verifier only emits OBSERVED_ONLY and controller workflow does not call D1. PR #175 binder consumes flat Actions context and computes a 15-field legacy digest; it does not validate v1 envelope. Migration 0017 has no node IDs, workflow ID/path/state, observed default SHA or workflow-file blob SHA.
- Keep `workflow_sha` semantics as workflow commit SHA. Add separate workflow blob/ref SHA fields in future migration 0018.
- D1 already uses WebCrypto; reuse it for independent v1 digest recomputation. No Node crypto import in Workers runtime.
- Reuse one D1 ledger; no second ledger/service/dependency. Full mapping and E2E DoD in Pass 107 report.
- Tests NOT RUN in this audit. No hosted D1/live event/secrets/provider/dispatch/deployment/merge/production write. Independent review/Gemini/Claude/ECC/FCC NOT RUN. Active time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: clean combined integration branch, port single D1 package + v1 validator, implement migration 0018 and Workers E2E tests. Keep dispatch=false.
