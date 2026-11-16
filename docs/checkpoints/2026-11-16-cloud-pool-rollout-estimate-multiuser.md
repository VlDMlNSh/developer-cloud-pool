# Checkpoint — Cloud Pool rollout estimate and multi-user baseline

Date: 2026-11-16
Status: PLANNING BASELINE; no deployment/qualification claimed.

- Priority remains Contour A: first deliver responsive remote Jarvis web UI for phone and desktop, then install/configure/qualify the Cloud Pool execution core, then harden and independently accept.
- Planning estimate (one experienced engineer, assumptions documented): 3–5 engineer-days for web MVP; 7–12 additional days for first usable Cloud Pool; 5–9 days for hardening; 3–5 days for independent qualification. Total 18–31 engineer-days, approximately 4–6 calendar weeks. Early usable deployment in 2–3 weeks is not Contour A acceptance.
- Two-user target: owner/operator tenant and separate purchaser/SMM tenant. Isolate identity, sessions, tasks, artifacts, permissions, quotas and provider account mappings. Explicit sharing only.
- Future mobile local assistant: media classification, master prompt preparation, task decomposition/routing suggestions and queue preparation. Deferred until Contour A accepted.
- Future macOS local assistant: local media/file workflows and permission-scoped OS integration. Deferred until Contour A accepted.
- Remote video server: 2027 planning horizon, separate from and not blocking Cloud Pool.
- Full assumptions, milestones and non-goals: [architecture estimate](./CLOUD-POOL-ROLLOUT-ESTIMATE-AND-MULTIUSER-EVOLUTION-2026-11-16.md).

Next engineering step: implement Stage A0 remote Jarvis web MVP on existing infrastructure, without exposing provider secrets to the browser, then reforecast after end-to-end host validation.
