# Cloudflare account-level qualification plan — 2026-11-08

**Status:** PLAN ONLY / NOT AUTHORIZED FOR PROVISIONING / NOT EXECUTED  
**Target:** Developer Cloud Pool Contour A, Workflow + D1 hosted-runtime qualification  
**Baseline:** local proof implementation `34cdf68d44aac22c10871bf42ddf1cbadf31082e`; in-progress local process-recovery report `c430fe4beecf93a20052f0c3efedb5f8539e4faa`  
**Scope boundary:** disposable Cloudflare resources only, no production service, no provider/model calls, no secrets read or printed.

## 1. Purpose and decision

Move from local Wrangler/Miniflare evidence to a controlled hosted Cloudflare qualification without treating the local simulator as a production security or availability boundary.

The selected components remain Cloudflare Workers + Workflows + D1 because the repository already has a Wrangler/Workers project and the proof harness uses the official Cloudflare Workers Vitest integration. Do not introduce a second runtime, custom workflow engine, or custom database before measuring a concrete gap. Cloudflare documents Workflows as available on Free and Paid plans; current documented Free limits and D1 Free limits are recorded below. Recheck them against the account at execution time.

This document is a test plan, not permission to create resources, deploy, bind remote databases, enable dispatch, access secrets, or make provider calls. All such actions remain blocked until governance and authorization preconditions are verified.

## 2. Evidence boundary

Already VERIFIED locally:

- D1 attempt claims, lease generations and first-writer receipt behavior.
- Workflow step retry after a local D1 receipt commit followed by a synthetic post-commit failure.
- Duplicate Workflow instance creation rejection for the same deterministic ID.
- Explicit Workflow restart semantics, with the warning that `restart()` cancels in-progress steps and erases intermediate Workflow state.
- Completed-instance local process recreation in two isolated repetitions.
- One in-progress persisted `step.sleep()` resumed after abrupt local Wrangler/Workerd process termination and recreation against the same Miniflare persistence directory.

Not proven by those tests:

- Hosted Cloudflare account behavior, real D1 concurrency/consistency, service-side failure recovery, regional failover, account retention, billing/quotas, production security, or arbitrary external side-effect idempotency.
- A forced hosted Worker process crash. Cloudflare does not expose a user-operated kill switch for its managed Workflow engine; do not mislabel `WorkflowInstance.restart()` or a deployment as a process-crash test.

## 3. Preconditions — hard stop gates

Every item must be evidenced before the first remote write:

1. **Immutable code target:** pin the exact PR head and base SHA. No moving branch names during qualification.
2. **Repository governance:** verify the active default-branch ruleset, required status checks, required approvals and CODEOWNERS policy. The currently observed ruleset 26550182 requires zero approvals and therefore does not enforce independent review; this is a blocker for production adoption.
3. **Dispatch authorization:** keep `POOL_DISPATCH_ENABLED` disabled. Verify variable names/presence only, never values; verify `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` through an approved non-secret gate. If current values cannot be safely verified, classify NOT VERIFIED and stop.
4. **Workflow authority:** approved Gemini controller is absent from the known default and PR #25 base workflow inventories. Gemini dispatch remains NOT RUN; no alternate dispatch path may be substituted.
5. **Cloudflare account scope:** identify the exact account using an authorized account metadata operation. Record only account display name and a short account identifier in the private qualification evidence; do not record tokens, email addresses, authentication headers or credential values.
6. **Free-plan check:** confirm account plan and current usage/limits from account metadata/dashboard. If the account is not confirmed Free, stop rather than incur charges.
7. **Resource isolation:** reserve a new disposable Worker name and D1 database name with prefix `dcp-qualification-20261108-`. Do not reuse production names, production D1 databases, routes, zones, domains or existing Worker bindings.
8. **Credential boundary:** if API authentication is needed, use an existing least-privilege account-scoped Cloudflare token held only by the authorized connector/runtime. Never read, copy, print, upload, expose to a Worker, or put its value in GitHub, logs or artifacts. Do not create or rotate credentials as part of this plan.
9. **Data boundary:** synthetic non-personal payloads only. No customer, owner, provider, media, model, or real task data.
10. **Budget and teardown:** define the maximum resource count and retention window before provisioning. Stop if any operation could trigger paid usage or an unexpected plan upgrade.

Any failed, ambiguous or unavailable gate is BLOCKED / NOT RUN, not a warning to work around.

## 4. Disposable qualification topology

- One dedicated Cloudflare Worker running the exact reviewed Workflow/D1 proof code, with a unique qualification suffix.
- One dedicated D1 database created only for this qualification.
- One Workflow binding registered to that Worker.
- No public custom domain or production route. Use the minimum possible test ingress; restrict access to the approved test caller and delete the test endpoint after the run.
- No provider/model bindings, no AI Gateway, no GitHub App credentials, no PAT, no cross-repository token, no external executor.
- No R2, Queues, Durable Objects or other products unless a measured test requirement demonstrates they are needed. Do not add architecture components speculatively.

Use the existing D1 migrations and Workflow proof fixture. Do not create a second implementation of the ledger or orchestration engine.

## 5. Test sequence and acceptance evidence

### Q0 — preflight and resource inventory (read-only)

Record account plan, current D1 database count/storage use, Worker/Workflow inventory, API permission scope, region/data-location constraints, and current documented limits. Do not enumerate or expose secret values. No resources are created in Q0.

**Pass:** account and plan are unambiguous; test namespace is unused; required least-privilege access is available; budget is zero-cost under the confirmed plan.

### Q1 — isolated provisioning and schema

Only after all preconditions pass, create the disposable Worker and D1 database. Apply the repository's migration chain to the new D1 database. Capture migration list and schema metadata; do not export real account data.

**Pass:** resource IDs match the test prefix; only the intended D1 database is bound; migration history is complete and ordered; a read-only `SELECT 1` and schema assertions pass; no production resource was modified.

### Q2 — hosted ledger invariants

Use synthetic identifiers and execute bounded tests:

- first claim succeeds; duplicate claim cannot create a second active attempt;
- stale lease generation cannot mutate the current attempt;
- same receipt replay returns the original durable receipt;
- conflicting receipt replay is rejected without mutation;
- terminal finalization exact replay is accepted only when the immutable projection and actor/generation match;
- conflicting terminal replay is denied and no duplicate terminal event is appended;
- `running -> indeterminate` creates one unique reconciliation item while preserving the lease context;
- reconciliation does not itself clear a lease, create a retry or authorize terminalization.

**Pass:** all assertions pass against hosted D1, with before/after row counts and sanitized query output. No live agent task or external side effect is used.

### Q3 — hosted Workflow durability and duplicate triggers

- create a Workflow for a unique Attempt ID + generation;
- issue duplicate create requests concurrently and sequentially;
- verify one instance is authoritative and duplicate creation is rejected/recognized deterministically;
- run a D1 receipt write inside a durable Workflow step;
- inject a controlled, bounded failure after the D1 commit but before step completion;
- allow the platform retry policy to run and verify the original receipt remains the sole durable receipt;
- place a separate Workflow in a named sleep, deploy only an explicitly versioned test Worker update if compatible with the test, then verify the existing instance resumes according to Cloudflare's documented behavior. Do not call `restart()` as a substitute for recovery.

**Pass:** exactly one receipt, one terminal audit event, stable Attempt generation, and a complete Workflow instance timeline with retry/sleep timestamps. Any unknown side-effect outcome is `indeterminate`; do not retry external writes automatically.

### Q4 — bounded concurrency and race conditions

Run a small, predeclared concurrency matrix (1, 2, 5, 10 parallel callers) using synthetic IDs. Include same-key duplicate creation and distinct-key claims. Do not run open-ended load tests or exceed account free-tier limits.

**Pass:** no duplicate active attempt for the same idempotency key; no stale-generation write; no conflicting first-writer receipt; all errors are classified; D1 queue/latency observations are recorded. If D1 overload occurs, stop the run and report it; do not increase plan tier.

### Q5 — recovery and retention observations

- observe sleeping and retrying Workflow instances through the supported instance inspection interface;
- record completed Workflow retention behavior only over the documented Free retention window;
- inspect D1 Time Travel availability and the configured backup/recovery mechanism without triggering a restore;
- record a natural hosted interruption only if it actually occurs; do not fabricate or infer a process crash from a manual restart or code deployment.

**Pass:** evidence differentiates hosted Workflow durability from local Miniflare process recovery, and retention/restore boundaries are explicitly documented. If no natural infrastructure interruption occurs, hosted crash recovery remains NOT VERIFIED.

### Q6 — security and data hygiene

- inspect Worker bindings by name/type only; no secret values;
- verify no provider, GitHub, or privileged tokens are bound;
- inspect sanitized logs and test artifacts for credential-like strings and synthetic-only data;
- verify unauthenticated ingress fails closed and the test endpoint is not public after qualification;
- verify no direct dispatch path, cross-repository write path, or user-controlled shell execution was introduced.

**Pass:** zero secret exposure, no production route, no unauthorized binding, no data from outside the synthetic test fixture, and no public test endpoint remaining.

### Q7 — teardown and evidence closure

Export only synthetic qualification evidence and resource metadata. Delete the disposable Worker, Workflow binding and D1 database after evidence hashes are recorded and cleanup is verified. Confirm that no production resource or other account resource was deleted.

**Pass:** resource inventory confirms zero remaining qualification resources; report includes immutable source SHA, resource IDs (redacted as appropriate), migration versions, run/instance IDs, sanitized evidence digests, tests, costs/usage and all deviations.

## 6. Free-plan budget guardrails (recheck before Q0)

Current Cloudflare documentation states:

- Workflows are available on Free and Paid plans.
- Workers Free Workflows: 100,000 executions/day shared with the Workers daily limit; 100 concurrent running instances; 100,000 queued instances; 3-day completed-instance state retention; 1 MiB event payload; 100 MB persisted state per instance; 10 ms active CPU per step.
- D1 Free: 10 databases/account; 500 MB/database; 5 GB aggregate storage/account; 7-day Time Travel; 50 read subrequests per Worker invocation; 30-second maximum SQL query duration.
- Each D1 database is single-threaded; concurrent work queues and can be rejected when the queue is full. Avoid high-concurrency load tests.

These are documented platform limits, not proof of this account's remaining quota or actual eligibility. Do not promise that a test is free until the account plan and usage are checked.

## 7. Required evidence package

- immutable source SHA and PR base SHA;
- account plan confirmation and resource inventory (no credential values);
- exact Worker and D1 resource identifiers, bindings and environment;
- migration list and schema digest;
- test matrix with timestamps, Workflow instance IDs, Attempt IDs/generations and sanitized outcomes;
- D1 before/after row counts and receipt/audit digests;
- Workflow status timeline, sleep/retry metadata and any natural interruption evidence;
- sanitized logs, artifact digests and exact-head CI run;
- cost/usage delta and final teardown inventory;
- independent security/provenance review result;
- explicit list of NOT VERIFIED claims.

A green CI job or a successful synthetic test does not qualify the hosted service by itself.

## 8. Stop conditions

Immediately stop and preserve evidence if:

- the account or plan is ambiguous;
- any operation could incur a charge or change plan tier;
- an existing production resource is selected;
- migration history differs from the pinned source;
- a duplicate attempt/receipt/terminal event appears;
- a stale lease generation is accepted;
- a retry could repeat an unverified external side effect;
- a secret value appears in output, logs or artifacts;
- an unexpected binding, public route or cross-repository permission appears;
- any required governance or authorization gate is missing.

Do not repair a failed qualification by weakening an assertion or deleting evidence. Classify the run FAILED or BLOCKED, isolate the test resources, and create a follow-up report.

## 9. Current disposition and next action

**Current:** PLAN ONLY / NOT AUTHORIZED FOR PROVISIONING / NOT EXECUTED. Hosted Cloudflare qualification remains NOT VERIFIED.

**Next bounded action:** complete Q0 read-only preflight only after governance and account-scope gates are available. If a gate cannot be established without reading secret values or changing account state, stop and report the precise blocker. No deployment, remote D1 migration, provider call, dispatch, paid fallback or Contour B work is authorized by this plan.

## 10. Official references

- Cloudflare Workflows overview and Free/Paid availability: https://developers.cloudflare.com/workflows/
- Workflows limits: https://developers.cloudflare.com/workflows/reference/limits/
- Workflow retry and sleep semantics: https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/
- Workflow idempotency and durable-step rules: https://developers.cloudflare.com/workflows/build/rules-of-workflows/
- Workflow trigger/restart semantics: https://developers.cloudflare.com/workflows/build/trigger-workflows/
- D1 Free/Paid limits and concurrency model: https://developers.cloudflare.com/d1/platform/limits/
- D1 local/remote separation and persistence: https://developers.cloudflare.com/d1/best-practices/local-development/
- Workers testing and Miniflare security boundary: https://developers.cloudflare.com/workers/testing/
