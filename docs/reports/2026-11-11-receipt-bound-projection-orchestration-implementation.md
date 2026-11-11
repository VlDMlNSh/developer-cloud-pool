# Receipt-bound projection orchestration implementation — 2026-11-11

## Result

AUTHOR-SIDE IMPLEMENTATION COMPLETE FOR THE LOCAL D1 PROOF CANDIDATE. Exact-head D1 push and pull-request workflows succeeded. The receipt-free ACK export is removed; projection outbox identity is database-enforced immutable. This is not independent qualification, hosted D1 validation, production runtime wiring or Contour A acceptance.

## Immutable refs

- Default branch: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Implementation branch: `impl/receipt-bound-projection-2026-11-11`
- Implementation HEAD: `dea09ffe94059f446c74fada37971087ec4878eb`
- Implementation tree: `b71c39b2c4d1ea22cdc37a185f5a999365614b9e`
- Compare default → implementation: 9 commits ahead / 0 behind.
- Draft PR #67: https://github.com/VlDMlNSh/developer-cloud-pool/pull/67
  - base `221f216c00ca7e5596bcc682ba185ad155a10603`
  - head `dea09ffe94059f446c74fada37971087ec4878eb`
  - OPEN / DRAFT / UNMERGED; mergeable true at last query.
  - No formal reviews or review threads at last query.
- Default branch was not modified.

## Commit sequence

1. `25e56899f0297fe5d501a78c9007c25959b10bd1` — reconstruct 23 baseline proof paths from immutable source `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
2. `0feb74cdf2c4dd4a7126d445c3aa46109bb6eedf` — exact seven-path PR #58 patch from `5caeb60f7a45d836c6ad1eea2fb86e20995da025`.
3. `4c39deff653841f8979696167d85a1df24361a6f` — exact five-path PR #59 patch from `22200226da4f1af30645cf441a639db6893e9310`.
4. `8cce1cd8c2ddbf10c6a382fd6f4abd72a479b7ad` — initial receipt-bound orchestration and integration tests.
5. `8978771b2887667f34a4c64a84e8acb9e62d4841` — remove public receipt-free ACK; update stale-worker proof.
6. `c062ab557492460b7820c71c7cdf6a9a98e0d177` — correct test fixture to the actual `ATTEMPT_LEASE_ACQUIRED` API result.
7. `c4b34fa42e8585258a339e8adad44210684ac953` — add takeover and concurrent-delivery tests; clock exceptions fail closed.
8. `cc9181ed14932133e607550fb6526eb135a36a0c` — hardening: remove injectable reconciler override; always invoke the imported verifier directly; exercise digest conflict using a real conflicting marker.
9. `dea09ffe94059f446c74fada37971087ec4878eb` — migration 0009 makes projection identity immutable; add D1 regression test and update contract/README.

## Implemented boundary

New `proofs/d1-ledger/src/projection-delivery.mjs` exports `createProjectionDeliveryOrchestrator`. Its `deliver(outboxId)` method accepts only the outbox ID. Worker identity, clock and API are wired when the local runtime constructs the factory.

The orchestrator:
1. obtains current time from its wired clock and acquires the D1 delivery lease itself;
2. reads back the same outbox row with owner, delivery generation and unexpired lease predicates;
3. maps that row into the projection envelope;
4. calls the imported `reconcileTerminalProjection` directly (not caller-injected);
5. requires `PROJECTION_VERIFIED`, `projection_verified === true`, exact `eventId` and exact payload digest;
6. executes private conditional ACK SQL bound to outbox ID, event digest, lease owner, delivery generation, leased status and fresh trusted-clock reading;
7. returns success only after D1 read-back confirms delivered status, same digest and generation, and cleared lease fields.

The old exported `acknowledgeProjectionDelivered` helper was removed from `projection-outbox.mjs`. Retryable outcomes use the existing generation-fenced retry transition. All adapter results retain `dispatch:false`.

## Immutable event identity

Migration `0009_projection_outbox_identity_immutable.sql` adds a trigger preventing updates to:
- outbox ID;
- task and attempt identity;
- repository and issue;
- target SHA and profile;
- attempt lease generation;
- terminal outcome;
- event digest.

Delivery status, retry metadata and delivery lease fields remain mutable under the existing state-machine adapters. The new test verifies that a post-insert event-digest rewrite aborts and leaves the original digest unchanged.

## Exact-head CI evidence

Final HEAD `dea09ffe94059f446c74fada37971087ec4878eb`:

- Push D1 workflow [43064251525](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064251525): COMPLETED / SUCCESS; job `130674809102`.
- PR D1 workflow [43064261520](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261520): COMPLETED / SUCCESS; job `130674831651`.
- Both: syntax check SUCCESS; Workers-runtime D1 suite 5 files / 66 tests passed.
- Push lockfile artifact ID `13874881891`, SHA-256 `c4322d68c7e57824dd2c1db706ce4b9b69f5680d7c733cde62e742dde4e3212c`.
- PR lockfile artifact ID `13875340881`, SHA-256 `de5833fb4eca7a6ca94c7b133d4b1b53e7a548e49a86e86748e222136fb693e5`.
- Pool Contract Validation PR run [43064261551](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261551): SUCCESS.
- Combined-status endpoint returned zero contexts for final HEAD. This is NOT VERIFIED as a status-context set; the workflow executions above are the exact-head CI evidence.
- An earlier run `43063392084` failed because a test expected the wrong attempt-lease decision string. The fixture was corrected; the later exact-head runs above pass. Do not represent the earlier run as passing.

## Mature component research

Inspected GitHub projects before choosing the implementation route:

- `Rohan1857/edge-dispatch` (MIT; Cloudflare Workers + D1 transactional outbox, Queues, Durable Objects, Workflows, fenced generation claims, retry/dead-letter recovery, local smoke and CI). Relevant architectural reference, but not a drop-in: it is a generic signed-webhook delivery service, depends on Queues/DO/workflows and does not implement GitHub issue comment/label projection or this pool's attempt ledger.
- `nnniyaz/outbox-mcp` (Cloudflare D1, email reminder/knowledge-note queue): not compatible with this projection protocol.
- `whitedragon-software/outbox` (single Worker email sender/history): not compatible.
- No mature drop-in was verified for the narrow D1 → GitHub marker/managed-label projection contract. No external project code was copied. Existing compatible local proof modules were retained and the narrow orchestration boundary was implemented around them.

## Governance and executor status

- Active ruleset #26550182 applies to default branch: PR required; deletion and non-fast-forward prohibited; review-thread resolution required; 0 required approvals; no bypass actors. Branch protection endpoint itself returned 403, so do not claim classic protection settings were verified.
- PR #67 is draft; formal reviews 0 and review threads 0.
- Owner sequencing decision remains in force: independent technical/security/governance checks are deferred until after pool launch. No external auditor or Gemini dispatch was run in this pass.
- Approved Gemini controller exists in MediaHub OS main at blob `0a1246f6755020faf8b7e48d07bfff790bbaece3`; no dispatch attempted. The same-named controller is not present in developer-cloud-pool default.
- Hosted D1, live GitHub credentials, provider/model calls and deployment: NOT RUN / NOT AUTHORIZED.

## Remaining gaps

- The local factory's clock and worker identity are injected for deterministic tests. Production runtime wiring to a qualified trusted clock and issuer/worker identity is not implemented or qualified.
- Fake GitHub API tests do not prove live GitHub API consistency, permissions, rate limits or concurrent human-edit behavior.
- Orphaned fifth-lease recovery remains authority-gated and unresolved; do not add an unqualified supervisor identity.
- Exact status contexts remain empty, despite successful workflow runs.
- PR #67 has no independent review; by owner decision that review is deferred until after launch.
- PR #58, #59, #66 and #67 remain unmerged at last check.

## Disposition

- Receipt-bound local orchestration: IMPLEMENTED / VERIFIED by exact-head local Workers-runtime D1 CI.
- Immutable outbox identity: IMPLEMENTED / VERIFIED by exact-head CI.
- Production runtime: NOT IMPLEMENTED.
- Hosted D1: NOT RUN.
- Dispatch: FAIL-CLOSED / NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next step: continue the bounded pre-launch Contour A implementation on the current clean implementation branch, focusing on a production runtime adapter design that can be tested without enabling hosted D1 or dispatch. Keep PR #67 draft and unmerged.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
