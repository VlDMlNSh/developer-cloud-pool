# Pass 126 checkpoint — independent Actions provenance

Date: 2026-11-28

- Starting Pass 126 branch head: `f7e1c3f960ca8afc2c071d40c86a24e937df9d97`.
- Tested code/test head: `0610fe5079f5dd8a8ef9498e35de580cda573e56`.
- Exact CI merge result: `1bf5144...` = merge of code head into default `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Fixed self-echoing trust context: mapper now reads raw webhook payload + runner environment, never copies identity/ref/run fields from the API envelope.
- Collector validates webhook repository numeric identity, owner identity/login, issue/comment immutable node IDs, and API-side issue/comment identity.
- Adversarial coverage: raw webhook mutations, runner provenance mutations, API repository/issue/comment/run/workflow substitution, default-ref race, workflow blob mismatch, run-attempt mismatch, bounded API transport.
- D1 run 46175255919 / job 141072385396: SUCCESS, 9/9 files, 140/140 tests.
- Pool Contract run 46175255931 / job 141072385703: SUCCESS, 36/36 Node tests and POOL_CONTRACT_VALIDATION=PASS.
- Initial adversarial matrix had one test-only expectation mismatch; corrected boundary-specific expected error. Final merge-result CI passed.
- Default branch does NOT contain `.github/workflows/next-event-controller.yml` (fresh Contents read NOT_FOUND). GitHub requires an issue_comment workflow to exist on default branch before it can trigger. Live controller event therefore NOT RUN; do not bypass by manual trigger.
- PR #188 OPEN / DRAFT / UNMERGED; formal reviews 0, inline threads 0; independent security review NOT RUN.
- Detailed ruleset and dispatch variable metadata NOT VERIFIED.
- Miniflare local tests are not a hardened security sandbox; use only for deterministic test fixtures, not hostile code isolation.
- Existing pinned actions emit Node20 deprecation warnings under Node24 runner. Upgrade is deferred pending immutable SHA/release verification.
- No secret values, provider calls, hosted D1, dispatch, executor, deployment, merge, production mutation or paid resources.
- Active engineering time NOT MEASURED; benchmark NOT RUN.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Next: Pass 127 independent security review, immutable Node24 action pin research, default-branch trigger activation contract, fresh PR/governance read-back.

Report: `docs/reports/2026-11-28-pass126-independent-actions-provenance.md`
Context Window: `docs/context/GITHUB-CONTEXT-WINDOW.md`
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
