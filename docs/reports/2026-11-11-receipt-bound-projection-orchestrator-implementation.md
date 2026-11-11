# Receipt-bound projection orchestration implementation — 2026-11-11

## Status

LOCAL PROOF IMPLEMENTED / EXACT-HEAD PUSH CI VERIFIED. NOT HOSTED QUALIFIED. NOT INDEPENDENTLY REVIEWED. No PR opened for the implementation branch, no merge, hosted D1, provider dispatch, or deployment.

## Immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной` at `221f216c00ca7e5596bcc682ba185ad155a10603`
- Implementation branch: `impl/receipt-bound-projection-2026-11-11`
- Final target HEAD: `cc9181ed14932133e607550fb6526eb135a36a0c`
- Final tree: `f9675790509595513d35c11273a2ed44f6c3aa34`
- Implementation is a clean-default-derived proof branch; historical divergent branch commits were not imported.

## Implementation sequence

- `8cce1cd8c2ddbf10c6a382fd6f4abd72a479b7ad`: introduced the local orchestrator and initial Workers-runtime D1 tests, and added the implementation branch to the workflow push filter.
- `8978771b2887667f34a4c64a84e8acb9e62d4841`: removed the legacy public `acknowledgeProjectionDelivered` receipt-free ACK; updated contract and stale-worker test. Added a negative export assertion.
- `c062ab557492460b7820c71c7cdf6a9a98e0d177`: corrected the fixture to the actual `ATTEMPT_LEASE_ACQUIRED` decision; exact-head push CI passed 63/63 tests.
- `c4b34fa42e8585258a339e8adad44210684ac953`: added expired-lease takeover fencing and concurrent-delivery coverage; made clock exceptions fail closed.
- `cc9181ed14932133e607550fb6526eb135a36a0c`: removed caller-configurable `reconcile` injection from the orchestration factory. The trusted in-module `reconcileTerminalProjection` is now called directly. The mismatched-digest test now supplies a conflicting marker through the fake API boundary rather than forging a verifier result.

## Security boundary now present

- No exported receipt-free ACK helper remains in `projection-outbox.mjs`.
- Per-delivery API accepts only `outboxId`; extra caller-supplied receipt arguments are ignored by the method signature and do not establish proof.
- Orchestrator acquires the delivery lease, reads back the same leased row, maps the immutable event envelope, invokes the fixed reconciler, checks exact event ID and digest, performs a private conditional ACK bound to outbox ID/digest/owner/delivery generation/unexpired lease, and reads back delivered state.
- The reconciler is no longer caller-injectable through the factory.
- Tests cover successful marker/label read-back and D1 ACK, retryable reconciliation failure, mismatched marker digest, expiry, takeover by another worker, concurrent orchestration (one delivery), and absence of the old public ACK export.
- All projection outcomes remain `dispatch:false`.

## Exact-head CI evidence

- Run: [43063773936](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43063773936)
- Event: push; exact `head_sha=cc9181ed14932133e607550fb6526eb135a36a0c`
- Job: `130673124739`, Local Workers-runtime D1 adversarial tests — COMPLETED / SUCCESS.
- Syntax check — SUCCESS.
- Workers-runtime suite: 5 files, 65 tests passed.
- Lockfile artifact ID: `13875015875`
- Artifact ZIP SHA-256: `b5f38f2502d5e62a53b719d51f5683673c2558e9324b409593d70bb2d890e907`
- Combined status API returned zero contexts; this is recorded as no status contexts, not as a separate status-check pass. The exact-head Actions run above is the positive CI evidence.
- Earlier exact-head run `43063392084` failed 4/63 due to the fixture's incorrect lease decision expectation. The fixture was corrected in `c062ab5...`; run `43063513012` passed 63/63. The later expanded exact-head run `43063773936` passed 65/65.

## Remaining limits / gates

- The factory still accepts `db`, `api`, `workerId`, and `clock` as runtime wiring inputs. The production Worker must bind worker identity and trusted clock from qualified runtime authorities; these constructor inputs are not themselves proof of trust.
- No production Worker wiring or live GitHub API adapter is implemented.
- No hosted D1 resources or hosted concurrency/availability tests.
- No secret/provider reads, provider calls, dispatch, or deployment.
- Crash/restart and all ambiguous POST/read-back windows need additional adversarial coverage before hosted qualification.
- No independent technical/security/governance review; per owner decision, independent checks are deferred until after the cloud pool is actually launched. Author-side CI does not replace that review.
- PR #58 and #59 remain OPEN/DRAFT/UNMERGED; source PRs have no formal reviews or review threads at this check. PR #66 remains OPEN/DRAFT/UNMERGED and docs-only.
- Active ruleset snapshot in PR #66 records required PR, no deletion/non-fast-forward, unresolved review-thread block, zero required approvals and no bypass actors. Independent review remains a separate project acceptance requirement.

## Next bounded step

Extend negative-first tests for lost POST response with matching read-back, delayed marker visibility, duplicate/conflicting markers, retry/ACK lease expiry at the final conditional write, and DB ambiguity/read-back failure. Then wire the production runtime only after trusted clock/worker identity and adapter authority contracts are explicitly qualified. Keep hosted D1 and dispatch NOT RUN.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Draft PR and second exact-head validation (17:01Z)

- Draft PR #67 opened against `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`, head `impl/receipt-bound-projection-2026-11-11@cc9181ed14932133e607550fb6526eb135a36a0c`; compare is 8 commits ahead / 0 behind; 32 changed files. PR is OPEN / DRAFT / UNMERGED. No formal reviews or review threads.
- Exact-head PR run [43063861928](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43063861928), job `130673434866`: SUCCESS; syntax and Workers-runtime D1 tests SUCCESS; 5 files / 65 tests passed. Artifact ID `13874432809`, SHA-256 `f50f97d2373ef340df209947a8a15064ddcd0b4d35fd7e882c8500fb988f1906`.
- Exact-head PR contract validation [43063862022](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43063862022), job `130673433624`: SUCCESS; workflow syntax, dispatch-disabled invariant and pool security contract checks passed.
- Exact-head push run [43063773936](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43063773936) also SUCCESS. The combined status endpoint returned zero contexts; do not represent it as required ruleset contexts being published.
