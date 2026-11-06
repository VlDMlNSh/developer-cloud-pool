# 2026-11-07 — D1 single-use ledger implementation boundary audit

**Phase:** Contour A — authorization and durable task claims  
**Status:** PR #36 local proof VERIFIED within scope; production claim/outbox NOT IMPLEMENTED; Contour A BLOCKED / NOT QUALIFIED / NOT ACCEPTED.

## Immutable evidence reviewed

- PR #36 tested head: `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`, OPEN / DRAFT / UNMERGED.
- Migration blob: `a80524ed839b63dd6483978118619495fa550877`.
- Consume adapter blob: `ef4f9693e1e2a378c08e974a65a8deb486af8712`.
- Inert Worker blob: `214622f6dc94623521070eb9e7fbc2f573fdc2c6`.
- Test blob: `8c4af56fffd40e716a4f1f16632b99c0c4f72f33`.
- D1 exact-head run [42293956647](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42293956647), job `128154248534`: COMPLETED / SUCCESS. Steps include pinned Node, exact dependency install, syntax, Workers-runtime D1 tests and lockfile artifact.
- Contract exact-head run [42293956578](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42293956578), job `128154248111`: COMPLETED / SUCCESS. Steps include checkout without persisted credentials, dispatch-disabled assertion, YAML parsing and security contract validation.
- PR #36 formal reviews: 0; inline review threads: 0. Independent security review NOT RUN.

## Source-level findings

1. The migration implements a single `pool_approval_ledger` row with `ready|consumed|revoked`, and an atomic conditional UPDATE keyed to approval ID, owner/repository/issue, target SHA, profile, envelope digest, unexpired timestamp and READY state.
2. The 12-way local Workers-runtime concurrency test demonstrates one winner and eleven denials against the local D1 test runtime. Replay, binding mismatch, expiry, unavailable storage, ambiguous exception and batch rollback cases are covered.
3. The adapter accepts `now` and owner/repository/digest as function inputs. In this proof those values are caller-supplied; there is no trusted issuer signature verification, authenticated owner derivation, trusted server clock, key rotation/revocation service or canonical signed-envelope parser. These are test inputs, not production authority.
4. The schema has no transactional outbox, durable task row, event ledger, lease owner/generation, fencing token, retry schedule, dead-letter state or recovery protocol.
5. `consumeApproval` returns `ALLOW_ONCE` after one row changes, but explicitly returns `dispatch: false`; the Worker entrypoint is inert and returns 404. This is correct for a local proof, but it does not prove task delivery or executor behavior.
6. The current proof therefore establishes only local atomic single-row consume behavior. It does not establish atomic claim+outbox, durable delivery, exactly-once external effects, production issuer trust, or real Cloudflare D1 entitlement/runtime qualification.

## Contract alignment

The proposed [Pool Claim + Transactional Outbox Contract v1](../contracts/POOL-CLAIM-OUTBOX-CONTRACT-v1.md) correctly separates unique authorization, atomic enqueue, at-least-once delivery, effect idempotency and fenced acknowledgement. Its key caveat is retained: D1 atomicity alone cannot guarantee exactly-once external side effects.

## Decision and next bounded work

- Keep PR #36 and #37 DRAFT; do not merge based on static/local proof alone.
- Do not wire the D1 adapter into Hono, Supervisor or Worker.
- Do not create Cloudflare resources, inspect secret values, enable dispatch, run DSH/Resource Probe, or call model/provider APIs.
- Next engineering pass should be a new isolated local-only proof against a fixed immutable base. Implement the contract's approval + outbox transaction and deterministic claim identity, then test C01–C18 including competing claimants, duplicate response/retry, transaction rollback, crash between commit and delivery, lease expiry/reclaim, stale-generation acknowledgement, revocation and dead-letter. Keep the executor stub inert and every result non-dispatching.
- Independent security review and live governance verification remain separate mandatory gates.

## Repository and phase boundary

Documentation is on `docs/github-context-window-2026-11-06`, not canonical default branch `Основной`. No default-branch change, production integration, resource provisioning, deployment, dispatch, secret access, paid fallback or Contour B work occurred.
