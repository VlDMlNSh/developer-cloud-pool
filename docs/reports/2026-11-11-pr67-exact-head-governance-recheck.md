# PR #67 exact-head and governance recheck — 2026-11-11

## Immutable target and repository state

- Default branch: `Основной` @ `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67 branch: `impl/receipt-bound-projection-2026-11-11` @ `dea09ffe94059f446c74fada37971087ec4878eb`.
- PR #67 base is the exact current default SHA; branch is 9 commits ahead / 0 behind per PR metadata.
- PR #67 remains OPEN / DRAFT / UNMERGED; mergeable=true is metadata only, not acceptance.
- Documentation branch for this report: `docs/projection-stack-reconciliation-2026-11-11`; PR #66 remains OPEN / DRAFT / UNMERGED, base `221f216c00ca7e5596bcc682ba185ad155a10603`. Its head is revalidated separately after documentation commits.

## Exact-head evidence for PR #67

- Isolated D1 Ledger Proof PR run [43064261520](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261520): COMPLETED / SUCCESS; job `130674831651`; checkout, pinned Node setup, `npm ci`, syntax check, Workers-runtime D1 tests, and artifact upload all succeeded.
- Pool Contract Validation run [43064261551](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261551): COMPLETED / SUCCESS; job `130674831998`; worker-dispatch-disabled assertion, workflow YAML syntax, and pool security-contract validation succeeded.
- Exact commit workflow query returned those two PR-triggered runs.
- Combined commit-status endpoint returned zero contexts. Do not describe status contexts as green or required checks as satisfied based on the Actions runs alone.
- D1 proof suite: 5 files / 66 tests passed, as recorded in the implementation report and run output summary.
- PR #67 formal reviews: 0; inline review threads: 0.

## Governance recheck

- Repository default branch is `Основной`; its branch endpoint reports classic protection disabled. This is not a substitute for the active ruleset.
- Active ruleset #26550182 was read directly: selector exactly `refs/heads/Основной`; enforcement active; PR required; deletion and non-fast-forward prohibited; review-thread resolution required; 0 required approvals; no bypass actors; current user cannot bypass.
- Therefore the repository governance gate does not mandate an approving review, but project acceptance still requires independent qualification. PR #67 is not approved or accepted.
- No hosted D1, live GitHub credential use, Worker deployment, dispatch, provider/model call, paid resource, secret read, or production runtime wiring occurred.

## Technical disposition

- Receipt-bound local D1 orchestration and immutable outbox identity: IMPLEMENTED / VERIFIED by exact-head local Workers-runtime CI.
- Production trusted clock, worker/issuer identity, live GitHub API concurrency and permissions, crash/restart under hosted D1, and orphaned fifth-lease recovery: NOT QUALIFIED.
- The fake GitHub adapter is a local test seam, not evidence of live API consistency or CAS semantics.
- Keep PR #67 Draft and unmerged. Keep dispatch fail-closed. Hosted D1 remains NOT AUTHORIZED / NOT RUN.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next bounded step

Perform a source-level negative-first audit of the local receipt-bound delivery orchestration and recovery transitions, specifically whether every retry/terminal path preserves lease-generation fencing and whether an orphaned lease can be recovered only through a separately authorized actor. Do not relax authority checks, connect hosted D1, or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
