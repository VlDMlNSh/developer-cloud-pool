# 2026-11-06 — Account-isolated Model Router design pass

## Scope

Advance Cloud Pool Issue #26 with a bounded design for account-isolated provider routing, quota renewal evidence, agent budgets and resumable task execution. No provider integration or live calls are authorized by this pass.

## Immutable baseline and branch

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Canonical branch: `Основной`
- Verified canonical HEAD before work: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Branch: `docs/provider-quota-agent-routing-2026-11-06`
- Branch created directly from the verified canonical HEAD.
- First documentation commit: `692a8ee9c71848d406038a43f4fa1436ceed3f68`

## Evidence reviewed

- Issue [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26) remains OPEN and defines the account-isolated routing/quota-ledger requirement.
- Issue #26 comments:
  - [LiteLLM candidate and quota-domain separation](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26#issuecomment-6681108306)
  - [No-secret proof-of-fit and fail-closed budget constraints](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26#issuecomment-6681122639)
  - [Cross-chat checkpoint reference](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26#issuecomment-6681352324)
- MediaHub provider registry was read from the documented source branch. It declares 24 cloud credential slots plus a local Ollama entry. Its cost/persistence classifications are inventory metadata, not live quota evidence.
- LiteLLM official docs reviewed:
  - https://docs.litellm.ai/docs/proxy/virtual_keys
  - https://docs.litellm.ai/docs/proxy/users
  - https://docs.litellm.ai/docs/routing
  - https://docs.litellm.ai/docs/proxy/architecture
  - https://docs.litellm.ai/docs/proxy/reliability

## Work completed

Created `docs/architecture/PROVIDER-ROUTER-QUOTA-LEDGER-DESIGN-2026-11-06.md` with:
- Separate upstream provider quota domains from internal pool operational budgets.
- Per-credential route identity and opaque secret/account references.
- Explicit evidence states; no inference of separate quotas from key suffixes.
- 401/403/402/429 and transient failure handling.
- A strict renewal rule: local cooldown expiry is not proof of upstream quota reset.
- LiteLLM as the leading reusable gateway candidate, with PostgreSQL/Redis requirements and fail-closed behavior.
- Agent task envelope, scoped gateway access, checkpoint/resume and idempotent reconciliation.
- A no-secret/no-provider-call proof-of-fit package and explicit prohibitions.

## Safety and governance

- No secret values or secret-presence metadata were read.
- No provider/model calls were made.
- No credentials were copied, injected, rotated or sent to agents.
- No PostgreSQL/Redis or paid resources were provisioned.
- No Worker/Supervisor dispatch was enabled or run.
- No changes to MediaHub issuer/capability, Jarvis, ASTRA A0 or Product State Authority.
- No agent controller was dispatched.

## Verification

- Canonical HEAD was read from `refs/heads/Основной` immediately before branch creation.
- Branch creation succeeded from the exact baseline SHA.
- Architecture document write succeeded in the feature branch.
- Exact file read-back, final blob SHA, exact-head CI and independent review are pending this report's creation.
- No implementation tests were run; this is a design-only change.

## Blockers

1. Upstream account/quota-domain independence is NOT VERIFIED for each provider slot.
2. Actual secret presence is NOT VERIFIED and must not be queried in this design pass.
3. Persistent PostgreSQL/Redis are NOT PROVISIONED / NOT APPROVED.
4. LiteLLM pinned image/package proof-of-fit is NOT RUN.
5. Credential broker and runtime secret injection are NOT IMPLEMENTED.
6. Agent gateway, durable quota ledger and task checkpoint/resume are NOT IMPLEMENTED.
7. Cloud Pool dispatch remains FAIL-CLOSED / NOT ENABLED.

## Next bounded step

Implement a standalone, no-secret LiteLLM proof-of-fit workflow on a standard GitHub-hosted Ubuntu runner. Pin an immutable image/package digest; block provider egress; use synthetic non-routable placeholders only; measure pull/install time, disk, peak RSS and startup; test config parsing and fail-closed budget behavior. Do not provision persistent services, read secrets, call providers or dispatch pool agents. Follow with pure deterministic route-state and quota-reset tests.
