# 2026-11-11 Projection Recovery Grant Contract Audit

- Date: 2026-11-11 (Europe/Vilnius)
- Scope: PR #59 bounded terminal-projection proof and PR #60 recovery issuer/trusted-time design.
- Immutable default-branch target observed: `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`; this report is unmerged documentation, not accepted production state.

## Evidence inspected

- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Recovery actor ADR blob: `59a4be21516da0e005114acfe015aee7787524dc`.
- Issuer/trusted-time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`.
- PR #59 adapter blob at exact head: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.
- PR #59 migration blob: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- PR #59 exact-head CI: run 42981807825 / job 130393715595, COMPLETED / SUCCESS; 3 Workers-runtime test files / 53 tests.
- PR #60 immutable design target: `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`; commit workflow lookup returned no runs.
- PR #60 formal reviews: 0; inline threads: 0. PR #59 formal reviews: 0; inline threads: 0.

## Audit conclusions

1. PR #59's local D1 proof enforces a five-attempt ceiling, bounded retry delays, dead-letter terminality, expiry and delivery-generation fencing. All adapter outcomes retain `dispatch:false`.
2. The adapter's `deadLetterExpiredProjection` still requires the original worker ID. It is not an independent reaper; an orphaned fifth lease can remain leased.
3. The migration's status-event trigger attributes actor as `COALESCE(NEW.lease_owner, OLD.lease_owner)`. The current same-owner dead-letter path clears the owner, so the event records the old delivery worker. It does not demonstrate a distinct recovery actor receipt.
4. PR #60 correctly keeps recovery authority separate from the task Resolver, specifies exact audience/operation/resource/generation/event-digest binding, one-use nonce, short grant lifetime, revocation freshness, trusted time and atomic audit/state transition.
5. PR #60 correctly states that the issuer, actor registry, key custody, revocation source, audit sink/retention owner and production clock are not selected or qualified. It selects no token format or KMS/HSM product.
6. The contract's suggested database-time path remains conditional: exact D1 time semantics and atomic nonce + outbox + audit behavior are not demonstrated by the local test proof. Caller-supplied `now` remains a test seam only.
7. PR #60 exact-head CI and independent review are NOT VERIFIED / NOT RUN. PR #59 CI success is local Workers-runtime proof only, not hosted D1 or production qualification.

## Disposition

- PR #59: proof evidence SUCCEEDED; independent review NOT RUN; production qualification NOT QUALIFIED.
- PR #60: design prerequisite PROPOSED; exact-head CI NOT VERIFIED; independent review NOT RUN.
- Recovery actor implementation: NOT IMPLEMENTED.
- Production dispatch: keep FAIL-CLOSED; no dispatch, deployment, live GitHub writes, provider calls or secret access performed.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B remains deferred.

## Next bounded step

Resolve governance ownership and qualification evidence for the Security Issuer Authority, recovery actor lifecycle, revocation source, trusted time, and durable audit sink. Do not implement a grant verifier or recovery route until those owners/interfaces are identified and independently reviewed.
