# Contour A Claim Protocol Evidence Refresh — 2026-11-11

## Immutable refs and current GitHub state

- Default branch `Основной`: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Issue #38 remains OPEN: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #37: OPEN/DRAFT, head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #39: OPEN/DRAFT, head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`.
- PR #54: OPEN/DRAFT, head `15a09c910f52553c59796260131a6b5a4a39c15f`, base `b9067dc7d06245893cd4e208f6215438efe5ca64`, branch `test/50-approval-logical-task-contention-2026-11-09`, stacked on `proof/immutable-task-attempts-audit-ci-2026-11-08`; mergeable reported clean.
- PR #57: OPEN/DRAFT, head `2c263e8a9915f0bc8e0698cde816e87cb2376538`, base `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #64 docs working branch head `ae58f89a3a584ca31dc26ca76d9fd8f90aa24c92`; PR #64 remains OPEN, base default `6fdcedebeba62715122e43a75c6ad6d926321ce7`.

## Updated proof evidence

### PR #54 — logical task, attempts, reconciliation and projection outbox

Exact current-head run:
- Run `43010770730`, job `130489510967`, `Isolated D1 Ledger Proof`: SUCCESS.
- Retrieved job log confirms 2 test files, 40 tests passed, 0 failed, 0 skipped.
- Lockfile artifact ID `13849698927`; uploaded ZIP SHA-256 `ec7077bc8abd532a553634c67ead23c7779ae8aa9ce3bffcdebc11f63b202b5b`.
- The latest PR head fixes a previously identified audit-provenance bug: projection status events now preserve `OLD.lease_owner` when the lease is cleared; test assertions cover retryable/delivered/dead-letter actor attribution.
- The current patch adds durable reconciliation queue for indeterminate attempts, projection outbox, leased/retryable/delivered/dead-letter transitions, and exact terminal-finalization replay recovery. All remain local-only Workers/D1 proof code and return/retain no dispatch capability.

Review status:
- Formal review on earlier PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974` was COMMENTED with actor-attribution finding.
- Author reports fix on current head `15a09c...`; exact-head CI passes.
- No formal independent APPROVED review on current head was observed. The finding is addressed by code/test evidence but independent review remains NOT VERIFIED.

### PR #57 — native GitHub Actions attempt evidence

Exact current-head fixture run `42838193384`, job `129905939447`: SUCCESS, 33/33 tests passed. Pool Contract Validation run `42838193405`, job `129905939738`: SUCCESS.

This is still a synthetic event/transport proof. It does not authenticate runner event provenance, wire the production Supervisor, or prove external side effects. Terminal workflow evidence is executor lifecycle evidence only; side effects remain unknown and no retry/dispatch authority is granted.

### PR #39 — atomic claim/outbox

The previously verified current head `ecc7193...` had exact Workers-runtime proof run `42329993548`, job `128274072508`, 19/19 tests. The proof is per-approval and local synthetic D1. PR #54 extends this with logical task identity and task-level contention, so do not treat PR #39 alone as the task-wide uniqueness proof.

## Existing decision record confirmed

Default-branch decision record `docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md` is present at default SHA `6fdced...`. It explicitly:
- rejects GitHub Issue labels/PATCH as authoritative CAS;
- does not select Git ref locking due broad Contents:write authority and lifecycle gaps;
- prefers a separate authenticated claim service backed by transactional conditional-write storage;
- treats D1 as a local proof candidate, not a selected/qualified hosted service;
- requires dispatch gates to remain fail-closed until issuer authentication, least privilege, hosted contention/failure/recovery, governance and review are proven.

Issue #38 latest comments cite PR #54's 50 distinct approval contention proof (run `42537241204`, job `128904147572`, SUCCESS) at its earlier head `ec3f326...`. Current head `15a09c...` extends it with reconciliation/projection work and has a fresh exact-head 40-test run. This is useful local evidence, not remote D1 evidence.

## Reuse / design conclusion

Continue reusing the existing Cloudflare Workers + D1 + official Workers Vitest proof harness. Do not build a new database engine or substitute Issue labels as a lock. Keep three boundaries explicit:
1. authenticated issuer/capability and trusted time;
2. transactional task/attempt/lease/outbox state authority;
3. GitHub executor/effect reconciliation.

Do not couple task-level quota reservation into this claim proof until its own provider quota evidence and internal reservation invariants are specified separately.

## Remaining promotion blockers

- No hosted D1 provisioned or qualified; free-tier entitlement, account ownership, quotas and isolation NOT VERIFIED.
- No authenticated issuer service, cryptographic capability verification, revocation/nonce replay defense or production trusted clock.
- No real hosted 50+ request contention/fault-injection/restart proof.
- PR #54 remains stacked OPEN/DRAFT; formal independent approval on its current head NOT VERIFIED.
- PR #57 remains stacked OPEN/DRAFT; no production Supervisor integration or runner provenance qualification.
- PR #37/#39/#54/#57 have different stacked bases; no integration/rebase performed in this pass.
- No secrets read, provider/model calls, deployment, dispatch, or production runtime changes.

## Status

- Local task-wide contention evidence: VERIFIED for synthetic Workers/D1 fixture at earlier PR #54 head; latest head has exact 40/40 suite.
- Projection actor attribution fix: exact-head CI VERIFIED; independent review NOT VERIFIED.
- GitHub attempt evidence verifier: 33/33 synthetic fixtures VERIFIED.
- Hosted claim service: NOT IMPLEMENTED / NOT QUALIFIED.
- Agent dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Inspect the full PR #54 current-head schema and state-machine for invariant gaps, compare its stack with PR #57 run-attempt/reconciliation semantics, and prepare a single immutable integration plan without merging or changing production gates. Prioritize issuer authentication and trusted-time boundary; no deployment or credentials.
 
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
