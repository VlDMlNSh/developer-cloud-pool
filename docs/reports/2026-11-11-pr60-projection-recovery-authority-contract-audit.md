# 2026-11-11 — PR #60 projection recovery authority contract audit

- Date: 2026-11-11 (Europe/Vilnius)
- Scope: bounded read-only audit of current repository refs, PR #59 local D1 proof, and PR #60 recovery-actor issuer/trusted-time design.
- No runtime code, schema, migrations, permissions, secrets, workflows, dispatch gates, hosted resources, deployments, provider/model calls, or external side effects were changed.

## 1. Repository and context read-back

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD re-read: `864213e2ff5b4fa956ba405dea8137a44d812f49`; commit message `docs: update context with reconciliation queue CI`.
- Continuation branch: `docs/cross-chat-continuation-2026-11-06`.
- Context Window blob before this update: `6bd47ef559c996dce84bb1fdc7ebfb7ce1259a3a`; it was stale at 10:41 Europe/Vilnius and its `Current next step` still pointed to the older synthetic GitHub read-adapter task.
- Repository metadata reports default branch `Основной`. Detailed current ruleset and live `POOL_DISPATCH_ENABLED` value were not re-read in this pass; historical values are not promoted to current evidence.
- Relevant PRs #24, #25, #58, #59 and #60 are OPEN / DRAFT / UNMERGED at read time. No merge was performed.

## 2. PR #59 — bounded projection retry/dead-letter proof

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- Exact code head stated in PR: `22200226da4f1af30645cf441a639db6893e9310`.
- Exact-head workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42981807825
- Job `130393715595`: COMPLETED / SUCCESS.
- Job log read-back confirms `npm ci --ignore-scripts --no-audit --no-fund`, syntax checks, 3 Vitest files / 53 tests passed, and lockfile artifact upload. Artifact ID `13838285758`, SHA-256 `baa3db3a6a748b26e37c0a174e28f3e0342995547c21513da125cae57da94f74`.
- The run checks out a synthetic merge commit `f90e414b5262ce4ef4106d979aba5cce5cd2da0a`; the PR explicitly records the head SHA above. Treat the workflow as the PR's exact-head validation as documented by its metadata, but note that the job checkout was the PR merge ref.
- Reviews and inline review threads: empty; independent review NOT RUN.
- Scope remains local Miniflare/workerd D1 only. No hosted D1, real GitHub sender, production workflow wiring, secrets, deployment, provider calls or dispatch.
- The adapter's fifth-attempt dead-letter helper requires the original lease owner and exact generation. It is not an orphan-worker reaper; if the original worker disappears, the row can remain leased.

## 3. PR #60 — recovery actor / issuer / trusted-time contract

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Immutable design target commit: `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`; commit read-back succeeded.
- Design decision blob: `59a4be21516da0e005114acfe015aee7787524dc`.
- Issuer/trusted-time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`.
- Changed files are limited to:
  - `docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md`
  - `docs/contracts/PROJECTION-RECOVERY-GRANT-ISSUER-AND-TRUSTED-TIME-CONTRACT.md`
- PR remains OPEN / DRAFT / UNMERGED. Formal review submissions: 0. Inline review threads: 0. Workflow lookup for target commit `04fcf8868a086b9f58c10fdc076aef0b7170d5f2` returned no runs; exact-head CI NOT VERIFIED.
- Positive design properties: separates Delivery Worker, Projection Recovery Actor and Task Supervisor/Worker authority; prohibits reusing task Resolver grants; binds grants to issuer/key version, subject, exact audience, operation, repository, outbox, attempt, generation, immutable event digest, attempt ceiling, time window and one-use nonce; requires atomic nonce consumption + terminal outbox transition + append-only actor-attributed audit event; prohibits requeue, task/attempt mutation, GitHub writes and dispatch; rejects caller-supplied actor IDs, arbitrary timestamps and structurally forged grant objects.
- The contract explicitly treats a caller-supplied `now` as test-only and requires a qualified trusted time source. It prefers database-generated time inside the transition transaction, conditional on proving D1 runtime semantics; otherwise it requires a qualified composition-root clock with skew/monotonicity/failure behavior.
- The design crosswalk references MediaHub Wave 486/487 targets (≤300-second grant lifetime, ≤30-second revocation freshness, R-06 audit/privacy) while explicitly recording their PRs as DRAFT / UNMERGED / NOT ACCEPTED and those values as target defaults, not operational proof.
- Unresolved blockers remain: no named/qualified issuer operator, issuance principal authentication, key custody/rotation/revocation source, recovery actor registry/lifecycle, production trusted clock, durable audit sink/operator, approved retention, or qualified hosted backend. Candidate JWS/KMS/HSM/Cedar/Macaroons/DO/Workflows remain candidates, not decisions or deployed components.
- Important residual design gate: the contract itself says the grant validity boundary must be evaluated atomically with nonce consumption and terminal transition; if that cannot be achieved, document the residual race and keep the path unqualified. The local D1 proof does not qualify hosted D1 semantics or production time.

## 4. Other current blockers

- PR #24 (Jarvis Experience hosting/API contract) and PR #25 (fail-closed Hono prototype) remain OPEN / DRAFT / UNMERGED. Existing prototype behavior remains unauthenticated fail-closed; no production OAuth/session or deployed console is evidenced by this pass.
- PR #58 remains OPEN / DRAFT / UNMERGED; PR #59 is stacked on its fake-GitHub projection proof.
- Issue #38 remains OPEN. Its durable single-use Supervisor task claim protocol is separately unqualified; issue labels/concurrency are not a proven CAS backend.
- Cloudflare Free was owner-attested earlier, but hosted D1/Worker inventory was empty in the last recorded read. Do not create hosted resources until account entitlement, cost, isolation, authority, backup/restore and operational gates are verified.
- Detailed repository ruleset and live dispatch variable were not re-read during this pass. Dispatch remains operationally fail-closed by policy; do not assert current variable state without fresh read-back.

## 5. Disposition and next step

- PR #59 local D1 test suite: VERIFIED for its stated local proof scope only.
- PR #59 orphan-worker recovery: BLOCKED / NOT IMPLEMENTED.
- PR #60 design artifacts: read-back VERIFIED; design remains PROPOSED, NOT IMPLEMENTED, NOT QUALIFIED.
- PR #60 exact-head CI: NOT VERIFIED.
- PR #60 independent review: NOT RUN.
- Hosted D1/Worker, OAuth/session deployment, production projection sender, task dispatch and provider/model calls: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: identify, from already-governed project contracts and current owner-approved infrastructure, whether a real Security Issuer Authority, service-principal lifecycle, revocation source, trusted time source and durable audit sink actually exist and are authorized for Cloud Pool use. Do not implement recovery runtime until these authorities are evidenced. In parallel, re-read the effective repository ruleset and dispatch variable through authorized metadata-only access; do not read secret values.

Canonical navigation:
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
