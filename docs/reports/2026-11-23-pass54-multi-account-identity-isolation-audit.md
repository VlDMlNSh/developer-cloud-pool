# Pass 54 — multi-account identity and quota-isolation contract audit

Date: 2026-11-23
Status: SOURCE AUDIT VERIFIED; ACCOUNT-BOUND AUTHORIZATION NOT IMPLEMENTED IN THE CURRENT D1 TASK IDENTITY

## Immutable state re-read

- Default branch `Основной`: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`.
- Integration `integration/pass48-current-base-d1-2026-11-23`: `5450ddd8002d7a336b3eb41adeaba1d62a17fb75`.
- Documentation branch before Pass 54: `57be0be74d3104e3b4c90e8238c7f01ed86ec607`.
- PR #168: OPEN / DRAFT / UNMERGED.
- Issue #140: OPEN; scope remains local-only and prohibits dispatch, hosted D1, provider calls, secret/variable inspection, deployment, merge and external review requests.
- Ruleset #26550182: ACTIVE for `refs/heads/Основной`; PR and review-thread resolution required; approving review count = 0; no bypass actors.
- Exact integration-head CI re-read: D1 run 45212088972 SUCCESS; Pool Contract run 45212089137 SUCCESS. Neither was rerun in this pass.
- No branch protection endpoint or hosted environment was changed.

## Audit scope and source evidence

Inspected the integration-head source and tests:
- `proofs/d1-ledger/src/task-identity.mjs` blob `6c7b50a9aa18a461ff05926d076333ad52023f83`.
- `proofs/d1-ledger/test/task-identity.test.ts` blob `f0dbf7c1d810fadcdfc06c7194cec4565ba7b830`.
- `proofs/d1-ledger/migrations/0011_bind_executor_identity.sql` blob `1fdbf3814b400abed6acaee1dec0a5f430226fd6`.
- Existing provider quota analysis `docs/reports/2026-11-15-provider-quota-a0-integration-analysis.md` blob `2c5455024b967d326f3ac2fd7a9e26043d36afd4`.
- Existing fail-closed quota correction evidence `docs/reports/2026-11-15-provider-quota-ledger-fail-closed.md` blob `75b706e383c24bfa0c6260de747297ca16fd1d4f`.
- Existing ancestry reconciliation `docs/reports/2026-11-15-quota-ledger-ancestry-reconciliation.md` blob `a3d9dfde251062658629801168ade3ee3a758670`.

### Verified gap: account identity is not a task-identity dimension

The current canonical task identity v2 binds:
1. repository numeric ID;
2. issue number;
3. target commit SHA;
4. capability profile;
5. executor ID;
6. version/domain separator.

It does not bind the GitHub acting account, GitHub App installation/account, credential-reference identity, issuer/principal, or quota-domain identity.

The repository ID is the target repository, not proof of which GitHub account or installation is authorized to act. The executor ID identifies an execution instance; it is not an account identity. Therefore two account contexts targeting the same repository/task/profile/executor are not separated by this task-key tuple. This is a source-level contract gap, not proof of an observed exploit.

Migration 0011 adds immutable `executor_id` to approval/task rows and checks task replay consistency, but adds no account/tenant/installation identity column. It cannot independently enforce account-specific authority or quota isolation.

### Existing quota architecture is useful but not sufficient

The quota-ledger reports already distinguish credential route IDs from provider quota domains and require provider-verified quota evidence plus a non-empty quota-domain ID for eligibility. They explicitly state that the pure ledger does not authenticate provider evidence, issuer/account ownership, or live quota. The A0/D1 proof is not yet one atomic qualified-route admission authority.

This is important for multiple GitHub/provider accounts: account identity, credential handle, and quota-domain identity must remain separate immutable dimensions. Two credentials may share one provider quota domain; conversely, the same provider may have multiple independent accounts. Never infer account independence from provider name or credential count.

## Mature component research — reuse boundary

Reviewed LiteLLM's upstream documentation as a mature reference for multi-tenant API-key and spend isolation:
- Virtual keys track spend by key, user and team, and support team-scoped service-account keys: https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/virtual_keys.md
- Access-control docs distinguish user-only, team service-account, and user+team keys and describe role scopes: https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/access_control.md
- Budget docs explicitly warn that budget enforcement depends on database-backed spend state and can fail open without a database: https://github.com/BerriAI/litellm-docs/blob/main/docs/proxy/users.md

Decision: reuse the separation principles (tenant/team, principal, service credential, spend/quota scope, role) as architecture input, not LiteLLM's database/runtime as a dependency. Its PostgreSQL-backed budget model is not a direct substitute for the project's free-tier D1 design, and its documented fail-open caveat is a warning against treating missing durable state as unlimited quota.

## Required contract before implementation

Define a versioned account-bound identity object before modifying the D1 proof. At minimum it should distinguish:

- `tenant_id`: Cloud Pool's internal immutable account/workspace boundary; never supplied as trusted authority by an untrusted task payload.
- `github_actor_id` or `github_installation_id`: immutable numeric identity for the GitHub principal/installation actually used to perform the operation; explicitly distinguish user OAuth from GitHub App installation.
- `repository_id`: target repository identity, independent of the acting account.
- `credential_ref_id`: opaque reference to a credential slot; no token/secret material in task identity, D1 rows, logs, artifacts or reports.
- `issuer_id` / `subject_id`: verified identity-provider principal, bound to the configured issuer and token verification policy.
- `provider_account_id` and `quota_domain_id`: separate provider account and shared quota scope; both require trusted evidence and explicit sharing relationships.
- `executor_id`, profile, target SHA and task identity version.

Required invariants:
1. Account/tenant/issuer binding is derived from authenticated server-side identity and immutable configuration, never accepted from a caller's arbitrary request fields.
2. Approval, task, attempt, lease, outbox, executor assignment and audit evidence carry the same immutable account binding; mismatch fails closed.
3. Credentials are selected by opaque reference within the authorized account boundary; secrets remain isolated and are never copied into D1 or task payloads.
4. Quotas are charged to both the credential route and its authoritative shared quota domain where applicable; unknown, stale, revoked or ambiguous quota evidence means ineligible.
5. Cross-account replay/substitution tests prove that an approval from account A cannot authorize a task/attempt/route under account B, even for the same repository, issue, SHA, profile and executor.
6. Account lifecycle (revocation, rotation, disabled account, installation removal) invalidates affected authorization and executor access without mutating another account's state.
7. Any schema/task-key change is versioned; existing rows with missing account identity remain legacy/unqualified and are not silently backfilled.

Do not implement this by simply adding a user-supplied `account_id` field. First freeze the trusted identity source and account lifecycle authority. The current Issue #140 is scoped to a local D1 proof and does not authorize production account onboarding or external provider operations.

## Pass 54 execution record

- One bounded source-level multi-account identity and quota-isolation audit completed.
- No source, migration, workflow, dependency or lockfile changes; no tests run.
- Existing exact-head CI was re-read only; no new CI run was started.
- Gemini NOT RUN / NOT AUTHORIZED; controller gates not requalified.
- No secrets read, provider calls, hosted D1 writes, dispatch, deployment, merge or external review request.
- Elapsed/active time NOT RECORDED / NOT MEASURED.

## Status and next

- Task identity v2 and executor identity binding: source-level VERIFIED.
- Acting-account / tenant / installation binding in task, approval and attempt identity: NOT IMPLEMENTED.
- Qualified provider account and quota-domain authority: NOT IMPLEMENTED / NOT QUALIFIED.
- Cryptographic verifier and trusted issuer policy from Pass 53: NOT IMPLEMENTED / NOT FROZEN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: locate and reconcile the existing A0/D1 account and route-evidence contracts against the proposed identity dimensions; prepare a schema compatibility matrix and negative cross-account replay tests. Do not mutate schema until trusted identity source and scope are approved.

PR #168: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168
Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
