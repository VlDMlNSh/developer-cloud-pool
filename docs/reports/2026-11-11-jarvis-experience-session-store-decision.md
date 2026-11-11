# Jarvis Experience session-store decision

- Date: 2026-11-11
- Status: DECISION RECORDED / IMPLEMENTATION NOT RUN / NOT QUALIFIED
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Immutable PR head after documentation update: `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`
- Base: `Основной@64d2636d4500127e635c214ccfb722c6b3fcda80`

## Scope

Resolve Issue #22's conflict between server-side session expiry/revocation and the prior "no database required" statement. No runtime code, migration, secret, OAuth App setup, Cloudflare resource, deployment, task mutation or dispatch was performed.

## Decision

Use one dedicated D1 database for Experience authentication/session state only. It is separate from the Pool task ledger and must not hold task claims, projection outbox, Supervisor leases, recovery grants or other Pool state. GitHub remains the source of truth for task and workflow evidence.

Reject Workers KV as the authoritative session or OAuth-state store: its eventual consistency is incompatible with immediate revocation and atomic single-use state consumption. Reject stateless signed cookies as a silent replacement because the current ADR explicitly requires server-side revocation. No fallback to KV/stateless validation is allowed if D1 is unavailable.

The Hono Worker is the sole D1 binding holder. Narrow internal repository functions are an application/source boundary only; D1 does not provide per-table SQL roles for this design. Do not claim that separate modules or Workers sharing the same D1 binding have database-enforced least privilege.

## Contract requirements recorded in ADR

- Store only digests of opaque session IDs and OAuth state/nonce values; no browser token material and no OAuth token persistence in v1.
- Atomic one-time OAuth-state consume with expiry and replay rejection.
- Per-request server-side checks for exact GitHub numeric subject, expiry and revocation.
- Atomic session rotation/revocation; fail closed on D1 errors, ambiguous writes, timeout and quota exhaustion.
- Indexed exact-key lookups, bounded cleanup, explicit application budgets below Free ceilings, and no paid fallback.
- Separate migration, backup/export, restore, retention, rollback and quota-alarm qualification.
- Adversarial tests for replay/concurrency, wrong subject, expiry/revocation, D1 outage, ambiguous writes, quota exhaustion, cleanup races and rollback/restore.

## Changes and read-back

- ADR updated and read back: blob `c8cdb46afcddc1baf50c41dea1f9a39dc925c5bd`.
  https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/jarvis-web-experience-adr-2026-11-06/docs/architecture/JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md
- OpenAPI session security description updated and read back: blob `b542636dc7a5efcf67287c5aa53a230d06a02c6d`.
  https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/jarvis-web-experience-adr-2026-11-06/contracts/jarvis-experience-api-v1.yaml
- PR #24 current head: `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`, OPEN / DRAFT / UNMERGED.
- Exact-head workflows observed: OpenAPI validation run `42982847694` IN_PROGRESS; Pool Contract run `42982847600` QUEUED. Combined status list empty. Exact-head CI is RUNNING / NOT VERIFIED pending completion.
- No runtime test or security review is claimed.

## Account / operating boundary

Owner confirmed Cloudflare Workers Free. This is owner-attested plan input; independent Billing API plan verification remains unavailable to the connected OAuth scope. Prior read-only inventory showed no D1 databases and no Worker scripts. No resources were created.

The documented Free ceilings are hard limits, not target budgets. Before provisioning, define conservative app-level daily read/write/request budgets, rate limits, bounded SQL, timeout policy, quota exhaustion behavior and rollback/backup procedures. Do not rely on plan ceilings as a capacity guarantee.

## Remaining blockers

- D1 session database not provisioned.
- OAuth App credentials not configured; OAuth/session code not implemented.
- No production Worker deployed; browser/iPhone QA not run.
- Exact-head CI pending.
- Independent security review not run.
- Issue #1 governance, Issue #22 web console and Issue #38 durable claims remain open.
- Pool dispatch remains FAIL-CLOSED; Contour A remains BLOCKED / NOT ACCEPTED.

## Next step

Wait for both exact-head workflows on PR #24 to complete; inspect job logs and rerun OpenAPI/schema validation if needed. Then build no-secret local session repository tests against D1-compatible SQLite/Miniflare, without provisioning hosted D1 or configuring OAuth secrets. Keep deployment gated on independent security review and the full governance acceptance path.

Canonical MediaHub map:
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
