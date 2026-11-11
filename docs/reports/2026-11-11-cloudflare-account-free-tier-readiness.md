# Cloudflare account and free-tier readiness — 2026-11-11

## Read-only account inspection
- Cloudflare connector identity confirmed by `whoami`; one account returned by GET /accounts. Account ID retained only in tool evidence; no credentials or secret values were read.
- GET `/accounts/{account_id}/d1/database`: success=true, result=[] — no D1 databases currently provisioned in this account.
- GET `/accounts/{account_id}/workers/scripts`: success=true, result=[] — no deployed Worker scripts currently present.
- GET `/accounts/{account_id}/workers/account-settings`: `default_usage_model=standard`, `green_compute=false`. This is not sufficient evidence to classify the subscription as Free or Paid.
- GET `/accounts/{account_id}/workers/subdomain`: existing Workers subdomain `jarvis-developer-cloud-pool`; this proves subdomain metadata exists, not a deployed Worker or a working web interface.
- No resources were created, modified, or deleted. No deployment, database migration, secret access, or billable operation was performed.

## Current official Cloudflare product constraints (docs checked 2026-11-11)
- Workers Free is available by default; Workers Paid has a minimum account charge of USD 5/month. The account's actual plan is NOT VERIFIED from the read-only account metadata.
- D1 is available on Workers Free. Published Free limits: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, 10 databases. Daily query-limit enforcement has applied since 2026-09-01; exceeding daily read/write limits causes queries to fail until midnight UTC.
- Workers Free limits include 100,000 requests/day, 10 ms CPU per invocation, 100 Workers/account and 5 Cron Triggers/account. Cron Trigger CPU limit on Free is 10 ms.
- Cron Triggers run in UTC and invoke a Worker's scheduled handler. The docs specify a maximum count per account, not a minimum schedule interval. Actual Free-plan quotas must be designed into the recovery workload.
- Sources:
  - Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
  - Workers limits: https://developers.cloudflare.com/workers/platform/limits/
  - D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
  - D1 free-tier enforcement (2026-09-01): https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
  - Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/

## Readiness decision
- Product-level feasibility of a minimal Cloudflare Worker + D1 + Cron Trigger recovery service on Free is CONFIRMED by current official documentation, subject to the published quotas.
- Account-level Free-plan entitlement is NOT VERIFIED. `default_usage_model=standard` is not proof of Workers Free or Paid.
- Actual runtime readiness is BLOCKED: there are no D1 databases and no Worker scripts in the inspected account.
- Do not create resources or deploy until the account plan, cost guardrails, correct account identity, database ownership, and governance approval are confirmed. No paid fallback is permitted.
- Keep the existing GitHub Supervisor as an independent control-plane/heartbeat mechanism; do not put D1 polling into GitHub Actions. The dedicated Worker should have D1 binding only for ledger operations and a narrowly scoped GitHub projection capability if later approved. It must not receive task-dispatch authority.

## Project disposition
- Existing Supervisor cron and GitHub claim-recovery source remain as recorded in the architecture audit.
- D1 outbox recovery integration: NOT IMPLEMENTED / NOT VERIFIED.
- Hosted D1, Worker deployment, Cron Trigger: NOT PRESENT in inspected account resources.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B deferred.
- No Gemini dispatch, no paid model route, no secret reads, no deployment, no code change.

## Next step
Before provisioning, obtain read-only authoritative evidence of the Cloudflare subscription plan and confirm the account intended for this project. Then write a minimal resource/cost budget and deployment contract with an explicit Free-only guard. No user-facing approval/action is required until those facts are established.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
