# Source-to-test traceability — 2026-11-11

## Scope and immutable inputs

This is a repository evidence mapping, not a test execution report. Reviewed immutable PR heads:

- PR #36: `e11fc90e50bd20b166207af64551c49cfa80ffb4`
- PR #39: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`
- PR #40: `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`
- PR #50: `65233f57038a9996e4a6e939abde3642a33d467d`
- PR #51: `32c88e50e173e6b19bc6c61723ab6474a3c08145`
- PR #53: `b8a253f06418841d5f0250c9fd550bf3247db040`
- PR #54: `15a09c910f52553c59796260131a6b5a4a39c15f`
- Documentation branch ref at this pass: `4084df588357260e666a76b64d4438fa87f77eb5`

No code, runtime, schema, workflow, secret, permission, dispatch, hosted resource or deployment was changed.

## Evidence mapping

| Cases | Source/test evidence | Disposition |
|---|---|---|
| N01 same-task concurrent claim | PR #39 `proofs/d1-ledger/test/claim-outbox.test.ts`: 12 concurrent consumers for one approval; PR #54 extends logical task identity tests | LOCAL_PROOF for same approval; distinct-approval race has a targeted PR #54 test, but concurrency scheduling coverage is not a broad 50+ same-task/distinct-grant stress proof |
| N02 same-grant replay | PR #36 `proofs/d1-ledger/test/consume.test.ts`; PR #39/#54 claim retry tests | LOCAL_PROOF |
| N03 distinct grants, one task-wide claim | PR #54 `claim-outbox.test.ts`, section “canonical task identity across independent approvals”: two approvals attach to one task and one task-level outbox | LOCAL_PROOF: PR #54 contains a 50-way distinct-approval contention proof converging on one canonical logical task and task-level outbox; hosted qualification and issuer validation remain unproven |
| N04 issuer spoof / unsigned approval | Consume/claim APIs accept a caller-provided approval object and deterministic time; no signature verification or issuer trust registry demonstrated by these tests | GAP |
| N05 revocation | No issuer/key/principal revocation test evidenced in inspected test files | GAP |
| N06 trusted time / skew / rollback | Tests pass fixed `NOW` values; this verifies expiry comparisons, not trusted-time provenance or clock rollback/skew controls | GAP |
| N07 database commit succeeds but response is lost | Storage exception is simulated and transaction rollback is asserted; a committed-write/response-loss recovery scenario is not evidenced | GAP |
| N08 dispatch accepted but response lost | Claim tests explicitly assert `dispatch: false`; no live dispatch-ambiguity reconciliation proof | NOT RUN / GAP |
| N09 authoritative dispatch rejection | No actual dispatch adapter/rejection integration test evidenced in inspected files | NOT RUN |
| N10 delayed Actions visibility and stale recovery | PR #51 persists indeterminate attempts/reconciliation queue, but no authorized resolver is evidenced; stale recovery across Actions visibility remains GAP | GAP |
| N11 worker crash at each state transition | Transaction rollback on outbox insert failure is covered; crash/restart at every lifecycle boundary is not | PARTIAL LOCAL_PROOF / GAP |
| N12 old generation heartbeat/finalizer | PR #54 `claim-outbox.test.ts` includes generation-fenced logical task leases and stale renew/finalize rejection; PR #53 `tests/security/pool-finalizer-fencing.test.mjs` validates run/attempt-derived generation in Issue finalizer planning | LOCAL_PROOF, separate scopes; integrated DB-to-GitHub fencing NOT VERIFIED |
| N13 envelope mutation | PR #36 binding mismatch tests; PR #53 finalizer body mutation test | LOCAL_PROOF |
| N14 Issue close/reopen/label conflict | PR #53 finalizer tests reject closed Issue and conflicting/duplicate generations; reopen/label race and atomicity are not established | PARTIAL LOCAL_PROOF / GAP |
| N15 audit actor attribution | PR #54 source/test work was previously inspected for actor attribution assertions; no independent audit sink/identity authority qualification | LOCAL_PROOF only; operational audit GAP |
| N16 duplicate outbox delivery / consumer crash | PR #54 has projection delivery lease/retry/ack test coverage and projection outbox helpers; this is local D1 evidence only. Real external GitHub consumer side-effect idempotency after accepted-write/lost-ack remains NOT VERIFIED | NOT VERIFIED |
| N17 workflow token privilege escalation | Ruleset snapshot is not a test; workflow permission review remains a separate governance gate | GAP |
| N18 secret leakage / account isolation | No secrets were read; inspected tests do not prove account-level isolation or secret non-disclosure end-to-end | NOT RUN |
| N19 audit sink unavailable | No failure/recovery test for a durable independent audit sink evidenced | GAP |
| N20 backup restore / replay rollback | No restore/replay qualification evidenced | NOT RUN |

## Exact-head CI snapshot

PR-triggered workflow runs returned:
- PR #36: runs 42329438308 and 42329438351 COMPLETED/SUCCESS at its exact head.
- PR #39: run 42329993548 COMPLETED/SUCCESS.
- PR #40: run 42489887940 COMPLETED/SUCCESS.
- PR #50: run 42533097813 COMPLETED/SUCCESS.
- PR #51: run 42536377720 COMPLETED/SUCCESS.
- PR #53: no PR-triggered runs returned.
- PR #54: run 43010770730 COMPLETED/SUCCESS.
- PR #63 head `7bd818443d13cf3bba9f0f8c0b63e0689f68cd60`: no PR-triggered runs returned.
- PR #64 head `95d237c753bec96abe9add621140928511047599`: no PR-triggered runs returned.

Combined commit status contexts were empty for each checked SHA. Empty results are NOT VERIFIED, not a pass. Successful local D1 proof workflows do not constitute hosted D1 qualification or integrated system acceptance.

## Governance and reuse decision

Ruleset #26550182 is active on `refs/heads/Основной`, blocks deletion and force-push, requires a PR and resolved review threads, but requires **zero approving reviews** and has no bypass actors. This does not enforce independent security approval. Do not treat draft PRs or author-side tests as independent acceptance.

Repository reuse remains preferred: existing Workers Vitest + D1 ledger, logical task identity, immutable attempt, lease-generation and projection-outbox work are the right substrate. The bounded GitHub search did not identify a verified drop-in that supplies issuer-bound single-use authorization, task-wide atomic claims, durable consumer delivery, fencing and compatible free-tier hosting as one qualified component. No replacement engine is justified by current evidence.

## Required next work

1. Remove or hard-disable the legacy task-lease lifecycle and make the immutable attempt lifecycle the only supported transition path; add cross-API tests proving there is no divergent lease/finalization authority.
2. Replace caller-controlled \`resumable=true\` with a separately authorized, signed reconciliation capability bound to task, attempt, execution ID and generation; prove a stale or replayed capability cannot take over.
3. Exercise projection delivery against a fake but stateful external GitHub side-effect endpoint: accepted write + lost acknowledgement, duplicate delivery, consumer crash, retry and reconciliation.
4. Connect attempt generation and execution identity to the real Worker report/finalizer boundary; prove stale heartbeat and terminal report rejection end-to-end.
5. Add issuer signature, trust registry, revocation and trusted-time contracts/tests; obtain independent security review and strengthen required-review governance.

## Status

- Evidence mapping: COMPLETED for inspected files; N01–N20 overall NOT QUALIFIED.
- Local D1 proof: selected historical exact-head workflows SUCCEEDED; not rerun in this pass.
- Hosted D1: NOT QUALIFIED.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED as an integrated issuer-authorized execution boundary.
- Dispatch: FAIL-CLOSED; keep `POOL_DISPATCH_ENABLED` false/unset.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
