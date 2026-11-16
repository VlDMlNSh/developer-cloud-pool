# Cloud Pool rollout estimate and multi-user product evolution

Date: 2026-11-16
Status: PLANNING BASELINE — estimates only; no deployment evidence is implied.
Priority: Contour A / Cloud Development Pool first.

## 1. Executive estimate

The architecture is based on existing components, so the expected work is primarily installation, configuration, integration, hardening and qualification rather than implementing model runtimes or coding agents from scratch. Existing components still require compatibility testing and secure integration.

Planning estimate for one experienced engineer with repository/server access and no major external account or network blockers:

| Milestone | Effort estimate | Calendar estimate |
|---|---:|---:|
| Jarvis remote web MVP (responsive phone/desktop UI, login, secure API bridge, basic task view) | 3–5 engineer-days | 3–7 working days |
| Cloud Pool first usable deployment (two Claude Code + ECC profiles, FCC / OmniRouter adapters, initial routes, worker lifecycle) | 7–12 additional engineer-days | 2–3 weeks cumulative |
| Operational hardening (multi-user isolation, queues, quotas, durable state, audit, recovery, security gates) | 5–9 additional engineer-days | 3–5 weeks cumulative |
| Independent qualification and Contour A acceptance evidence | 3–5 additional engineer-days | 4–6 weeks cumulative |

**Planning range:** 18–31 engineer-days; approximately 4–6 calendar weeks for one engineer working steadily. A constrained first operational release may be possible in 2–3 weeks, but it must not be described as Contour A ACCEPTED until all acceptance gates pass.

The estimates assume:
- the selected host and network access are available;
- existing OSS components install on compatible runtimes;
- accounts and provider access are lawfully available and free-tier limits are adequate;
- no paid fallback or paid infrastructure is required;
- the web UI can initially use an existing responsive frontend/authentication component;
- no major upstream incompatibility, account verification delay, rate-limit restriction or security defect is discovered.

If host access, credentials/account verification, TLS/domain, browser sessions, provider terms, SDK compatibility or persistent storage are blocked, add an unknown contingency. Do not compress security qualification to meet a date.

## 2. Recommended rollout order

### Stage A0 — Jarvis remote web interface first
Deliver a responsive web application usable from phone and desktop:
- authentication and session expiry;
- user-specific workspace selection;
- chat/task submission and status display;
- job history and basic logs with secrets redacted;
- secure backend API bridge to the Pool control plane;
- mobile-first navigation and network reconnect handling.

This is an interface milestone, not proof that all workers or model routes are operational. Keep privileged operations behind the control plane; browser clients must never receive provider keys.

### Stage A1 — Cloud Pool execution core
Install and qualify the existing building blocks:
- Profile A: Claude Code + ECC → FCC → qualified cloud API routes;
- Profile B: Claude Code + ECC → OmniRouter → qualified local LLM route;
- separate media worker/runtime as an optional later worker class, not conflated with OmniRouter;
- on-demand workers, not a fleet of permanently running agents;
- admission, scoped capabilities, task leases, quotas, routing and audit.

Pin versions and artifacts. Verify Claude Code Anthropic Messages API compatibility where required, including streaming and tool calls. OpenAI-compatible endpoints alone do not qualify the OmniRouter path.

### Stage A2 — Reliability and acceptance
Prove:
- tenant and profile isolation;
- per-account credential and quota boundaries;
- no secret exposure to browser or untrusted child processes;
- durable queue/state, idempotency, lease expiry and fencing;
- recovery after worker/control-plane restart;
- observable execution provenance and audit trail;
- security/governance gates and independent review;
- real remote web UI operation and qualified workers/routes.

Only after this stage may Contour A be marked ACCEPTED.

## 3. Multi-user architecture decision

The system is intended for at least two distinct users:
1. Owner/operator workspace — personal development, coding, research, media organisation and Jarvis administration.
2. Video-server purchaser / SMM workspace — video generation, photo and other social-media content production, campaign assets and related task workflows.

Treat these as separate tenants or equivalently strong isolated principals, not as two labels in one shared workspace. Each needs:
- separate authentication identity and session;
- separate workspace, task history, files and outputs;
- explicit role/capability grants;
- separate quotas/budgets and provider-account mappings;
- separate app configuration and task presets;
- explicit sharing/transfer workflows only when authorised;
- tenant ID enforced server-side on every task, artifact, log and queue operation.

Do not assume the purchaser is an administrator of the owner's workspace or vice versa. The video-server owner may administer the hardware and explicitly assigned media workloads, without gaining access to the owner's private development tasks, credentials or history.

The first web interface can host both tenants behind login with tenant-scoped navigation and permissions. Separate mobile/macOS clients may later present different workflows while using the same secure control-plane contracts.

## 4. Future clients — explicitly deferred until Contour A acceptance

### Mobile application + local assistant
Planned as a client/edge execution companion, not a replacement for the Cloud Pool:
- local media classification and metadata extraction;
- preparation and refinement of master prompts;
- task decomposition and routing suggestions;
- local queue preparation, offline capture and sync;
- optional local inference where device resources permit;
- explicit user approval before cloud submission or file operations.

### macOS application + local assistant
Planned as a separate desktop client with additional OS integration:
- local file/media indexing under user-granted permissions;
- local assistant and task orchestration;
- approved OS automation with explicit capability boundaries;
- secure handoff to the Cloud Pool;
- per-user application configuration and workspace isolation.

Mobile and macOS clients should share versioned API contracts and task schemas but keep platform-specific permission systems and local data stores. The local assistant must not silently gain broad OS access.

## 5. Remote video server — 2027 planning horizon

A remote video-generation server is a separate infrastructure phase planned for 2027. It is not a prerequisite for the Cloud Pool launch and must not delay Contour A. Its eventual scope may include video-generation workers, photo/image generation, media storage, job scheduling, rendering queues and SMM-specific production workflows.

The purchaser's SMM tenant should be designed now at the identity, quota, task-schema and artifact-isolation levels, while the video server itself remains deferred. Hardware, operating cost, network exposure, codecs, model licensing, storage retention and capacity must be assessed before deployment.

## 6. Explicit non-goals for the immediate release
- No mobile app implementation before Contour A acceptance.
- No macOS app or privileged OS automation before Contour A acceptance.
- No video-server procurement/deployment in the immediate Cloud Pool release.
- No product-specific media workflow that diverts effort from Contour A.
- No claim that existing components are production-ready merely because their repositories exist.

## 7. Estimate confidence and reforecast triggers
Confidence: medium-low until target host access and installation compatibility are tested. Re-estimate after Stage A0 and the first end-to-end worker route. Increase the estimate if any of the following occur: incompatible runtime versions, missing provider entitlements, free-tier quota insufficiency, required paid components, unavailable persistent storage, security review findings, or multi-tenant isolation redesign.

## 8. Acceptance discipline
Track each component as PLANNED → INSTALLED → CONFIGURED → TESTED → QUALIFIED. Deployment is not qualification; qualification is not acceptance. Contour A remains BLOCKED / NOT ACCEPTED until the documented acceptance evidence is complete.
