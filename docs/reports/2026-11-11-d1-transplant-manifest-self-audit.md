# D1 proof-harness transplant manifest — bounded source self-audit — 2026-11-11

## Scope and immutable references

- Repository: `VlDMlNSh/developer-cloud-pool`
- Current default: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Documentation PR: [#66](https://github.com/VlDMlNSh/developer-cloud-pool/pull/66), branch `docs/projection-stack-reconciliation-2026-11-11`
- PR #66 observed head before this report: `fcc6c1199384169ff91f7760edcb9ea9dbc98f69`
- Manifest blob read back: `35ad2ebe3756377f373c0367b0adabd6cf1c936b`
- PR #58 exact source head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`
- PR #59 exact source head: `22200226da4f1af30645cf441a639db6893e9310`

This is an author-side source consistency audit. It is not an independent review and does not satisfy the project’s independent security-review gate.

## File inventory cross-check

Re-read GitHub's complete changed-filename lists for both source PRs:

- PR #58: 7 paths — workflow, projection integration contract, package manifest, projection envelope module, projection reconciler module, and the two corresponding tests.
- PR #59: 5 paths — same workflow, migrations 0007 and 0008, projection outbox module, and claim/outbox tests.

The manifest's delta inventory accounts for all 7 + 5 changed paths. Its wider transplant table also includes the shared-base proof harness paths (migrations 0001–0006, common source, tests, lockfile and Workers/Vitest configuration); those are inherited from the common proof base rather than being PR #58/#59 delta paths. The manifest correctly avoids treating the PRs as a linear stack.

## Source assertions rechecked

1. **Divergent ancestry:** the manifest records the common proof base `6f7953e4abec3cc564984ee3635cdb7717ae5d5e` and the two exact heads. Do not merge either PR or transplant their commit ancestry wholesale.
2. **Package check union:** PR #58's `package.json` checks `src/projection-envelope.mjs`; PR #59's version omits that check. A reconciled package script must retain the envelope syntax check. Both inspected versions use `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12`.
3. **Migration order and audit actor:** migration 0007 is after 0006 and records `COALESCE(NEW.lease_owner, OLD.lease_owner)` in the status event. Migration 0008 adds monotonic delivery-attempt enforcement. Do not blindly transplant an older migration-0006 actor patch over this later trigger.
4. **Projection verification:** the fake reconciler returns `PROJECTION_VERIFIED` only after comment-marker and managed-label read-back. Its result includes event ID and payload digest but does not bind a delivery lease generation.
5. **ACK defect confirmed:** `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` accepts no receipt. Its SQL transition checks leased status, owner, generation and expiry, then marks the row delivered. Therefore a caller with a valid lease tuple can acknowledge without presenting proof that the external projection was verified. This remains a blocking correctness defect; no integration candidate should claim delivery correctness until receipt validation is enforced inside the conditional ACK boundary.
6. **Recovery boundary remains separate:** `deadLetterExpiredProjection` is same-owner/generation fenced and cannot recover an orphaned fifth lease. Do not relax this predicate or add a caller-supplied actor ID as a substitute for an issuer-verified, one-use grant and trusted time.
7. **No production evidence:** inspected modules are local proof/fake transport. They do not establish live GitHub API behavior, hosted D1 entitlement/semantics, production issuer, trusted clock, deployment, or dispatch authorization.

## Current PR #66 validation state

- PR #66 remains OPEN / DRAFT / UNMERGED.
- At the observed head `fcc6c1199384169ff91f7760edcb9ea9dbc98f69`, PR-triggered workflow runs returned none and combined status contexts were empty: exact-head CI is NOT VERIFIED.
- Formal reviews: 0; inline review threads: 0. Independent review: NOT RUN.
- The branch must not be merged on the strength of this self-audit.

## Disposition and next bounded step

- Manifest file inventory and the two identified compatibility hazards: VERIFIED by source read-back.
- Independent review of the manifest and exact source patches: NOT RUN.
- Code transplant / implementation candidate: NOT RUN.
- Hosted D1 / Worker: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: obtain an independent review of the manifest and exact #58/#59 patches. Only after acceptance, create a new immutable candidate from the current default, transplant the complete harness with the workflow/package/migration unions, and implement receipt-bound ACK with negative-first local Workers/D1 tests. Do not create hosted resources or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
