# Cloud Development Pool /next — 2026-11-14

## Objective

Revalidate current GitHub state, inspect the latest consolidated build plan, and produce an evidence-based remaining-effort estimate using the owner's six-hour daily schedule. Contour A only.

## Live repository and branch state

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`; latest commit search and both active PR base refs identify baseline `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67: OPEN / DRAFT / UNMERGED; exact head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; base baseline above. Exact-head CI runs `43600901063` Pool Contract Validation and `43600901068` Isolated D1 Ledger Proof both SUCCESS. Logs confirm 6 test files / 84 tests, isolated upgrade binding smoke 1 passed and frozen schema-0010 fixture smoke 2 passed. Formal reviews 0, review threads 0.
- PR #68: OPEN / DRAFT / UNMERGED; latest exact head `74244d78299417347cdce42b0916871684550399`; base baseline above; 75 commits / 13 files. Exact-head runs `43601943360` Runner Resource Probe and `43601943374` Pool Contract Validation both COMPLETED / SUCCESS. Resource probe job `132468370214`: Ubuntu 24.04.5 LTS, 4 vCPU, 85.25 GiB available workspace; log explicitly says read-only baseline, no agents installed, no secrets accessed and no profile qualified. Contract job `132468370263`: workflow SHA pinning, permissions, fail-closed Supervisor gate and secret-free/manual DSH/resource probes passed; 30-record qualification matrix passed. Formal reviews 0, review threads 0.
- The just-observed runner probe is an additional opportunistic observation, not included in the previously declared eight-observation qualification cutoff. It must not silently change the qualification matrix count.
- PR #67 and #68 remain proposals; neither is merged or deployed. Exact-head Actions success is not production qualification.

## Related work and blockers

- PR #29 quota/placement candidate: OPEN / DRAFT / UNMERGED; exact head `e4c8d642bbc054e7c52b391356965b492dad32b4`; based on an old default SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`. Its pure state machine and 24-slot inventory are not integrated; account identities and quota domains remain unverified.
- PR #37 Supervisor→Worker authorization boundary: OPEN / DRAFT / UNMERGED; exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`; based on old default SHA `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. It is not the current default runtime.
- PR #61 OAuth/session D1 tests: OPEN / DRAFT / UNMERGED; exact head `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`; isolated local tests only, not production OAuth/session wiring.
- PR #6 dashboard prototype and PR #24 API/hosting contract remain OPEN/DRAFT/UNMERGED on older baselines. Dashboard is fixture-only; no live API or deployed authentication.
- Issue #22 remains the first user-facing milestone: authenticated HTTPS web console, server-side session, live read-only API, provenance, mobile browser QA and documented persistence/rollback.
- Issue #38 remains open: authenticated durable single-use claim authority and hosted one-winner contention proof. GitHub labels are not CAS.
- Cloudflare workers.dev namespace was previously provisioned, but Workers Free entitlement was not verified because account Billing read scope was unavailable. No Worker script deployed and no hosted D1 provisioned.
- SentinelX current inventory: zero connected hosts; Voktors-Mini.Dlink offline; mh-dev-01 and mh-dev-02 disabled. No server-based Claude Code work can proceed on the present connection state.
- Provider account identities/quota domains, actual Gemini/Codex/Claude pool execution, durable hosted state, production issuer/trusted time/revocation, tenant isolation and independent A3 acceptance remain NOT VERIFIED / NOT RUN.
- Dispatch remains fail-closed. No secret values, provider calls, hosted resource creation, paid fallback, deployment, merge or dispatch were performed.

## Remaining-time calculation

The existing estimate document contains two scopes that must not be conflated:
1. Executive target for the first controlled multi-agent pilot: 10–15 eight-hour engineer-days = 80–120 engineering hours.
2. Detailed stage table: stages 0–7 sum arithmetically to 17–34 engineer-days = 136–272 hours before overlap. This detailed sequence includes claim issuer, hosted backend, runner installation, quota integration, Jarvis, tenant/A3 and acceptance work, so it is a risk-aware breakdown rather than an independent calendar promise.

At the owner's planned 6 focused hours per day:
- Optimistic pilot path: 80–120 h / 6 = 13.3–20 working days (round planning: 14–20 days).
- Detailed stage envelope: 136–272 h / 6 = 22.7–45.3 working days (round planning: 23–46 days).
- Practical planning range from the current state: 120–180 h = 20–30 six-hour workdays, assuming component reuse, overlapping documentation/integration, timely access and no major backend substitution. This is an engineering forecast, not a committed date.
- If hosted D1 is unavailable or the free entitlement cannot be established, the source estimate adds 3–7 engineer-days (24–56 h), equivalent to 4–10 additional six-hour workdays.
- Secure multi-tenant v1 source estimate: 160–240 h = 27–40 six-hour workdays.
- Demo-only no-provider dashboard: 16–32 h = 3–6 six-hour workdays; it is not a Cloud Pool launch.

The practical range corresponds to roughly 3–4.3 weeks if working every day, or 4–6 weeks at five workdays per week. Calendar time can expand due to account entitlement, external access, review and hosted integration gates.

## Recommended critical path

1. Reconcile PR #29/#37/#39/#54/#67 into one canonical current-base implementation lineage; do not import stale branch histories wholesale.
2. Complete authenticated A0 issuer/capability and trusted-time boundary with replay/revocation and durable claim transaction.
3. Establish a no-card hosted transactional backend only after entitlement and isolation are verified; prove concurrent one-winner behavior and failure recovery.
4. Qualify one initial runner profile and install/startup/resource envelope without reading secrets or calling providers until authorization.
5. Integrate free-quota routing and placement with verified account/quota domains; no account rotation and no paid fallback.
6. Deliver Issue #22's authenticated remote Jarvis read-only console, live API provenance and persistent session/state.
7. Integrate a bounded pilot execution path only after the above gates; verify A3, audit/recovery and security acceptance before calling it launched.

## Status and next step

- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next implementation pass: inspect PR #67 D1 migrations/APIs and PR #29 quota state machine at exact heads, then design the smallest A0 transaction integration without enabling dispatch. In parallel, map PR #25 Hono routes and PR #61 OAuth/session proof onto Issue #22 requirements. Do not merge or deploy.
- Latest architecture proposal: [PR #68](https://github.com/VlDMlNSh/developer-cloud-pool/pull/68).
- Operational handoff: [Master Handoff](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/unified-cloud-pool-jarvis-plan-2026-11-14/docs/operations/MASTER-HANDOFF.md).
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
