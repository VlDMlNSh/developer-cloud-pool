# Trusted Reconciliation Authority Contract — Contour A

Date: 2026-11-10  
Status: DESIGN CONTRACT — PROPOSED; no resolver implementation or dispatch authority  
Scope: Issue #38; extends `SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md` and the pending-only queue in PR #51.  
Decision class: backend-neutral authority and evidence contract. No backend is selected or qualified here.

## 1. Purpose and hard boundary

Define when an indeterminate execution may be classified safely and when (if ever) a new execution generation may be authorized.

**Core invariant:** lease expiry, a missing heartbeat, a closed browser session, a timed-out API request, a queue entry, or a caller assertion is never proof that the prior executor stopped or that external effects did not occur.

The Resolver is an evidence evaluator and state-transition requester. It is not a worker, scheduler, retry loop, dispatch controller, issuer, or source of owner approval. Its default outcome is `UNRESOLVED`. It must not dispatch, create a new attempt, clear a lease, or mutate the old generation merely because a run appears stale.

This contract does not promise exactly-once external side effects. It requires destination-level idempotency/fencing or explicit human review whenever an external effect cannot be reconciled.

## 2. Terminology and authority separation

- **Task / Attempt:** logical work and one immutable execution generation.
- **Executor:** one specific GitHub Actions run attempt or Cloudflare Workflow instance executing the attempt.
- **Supervisor:** creates authorized work and dispatches only after a valid claim/capability.
- **Evidence Adapter:** read-only adapter for one native executor control plane.
- **Resolver:** evaluates a complete evidence bundle against a versioned policy; it cannot mint owner approval.
- **State Authority:** the single selected durable store that conditionally commits attempt state and append-only resolution receipts.
- **Outbox:** durable delivery intent committed atomically with the authoritative state transition.
- **Downstream effect:** any provider/model call, repository mutation, external API write, deployment, or other effect outside the state transaction.

No actor may combine issuer, resolver, worker and state-administrator authority merely because one token or workflow can technically perform those actions. GitHub Issues labels/comments remain projections, never the claim lock. Cloudflare Workflows is orchestration and executor-lifecycle evidence, not the claim database or owner-approval issuer. D1 is only a candidate state store pending real account qualification.

## 3. Immutable execution identity

Every attempt must bind to an immutable `executor_binding` before any work can begin.

Common required fields:

- `schema_version`
- `repository_id` (numeric immutable GitHub repository ID)
- `repository_full_name_at_binding` (display/audit only; revalidate repository ID)
- `task_id`, `attempt_id`
- `approval_id`, `envelope_digest`, `target_sha`
- `lease_generation` (positive monotonic integer)
- `executor_kind` (`github_actions` or `cloudflare_workflow`)
- `executor_instance_id` (native immutable ID)
- `executor_workflow_identity` (native workflow ID/path or Cloudflare workflow name + deployed version identity)
- `executor_code_ref` / `executor_code_sha` (immutable code identity)
- `created_at`, `binding_digest`

For GitHub Actions, additionally bind:

- repository numeric ID;
- workflow run `run_id` and exact `run_attempt`;
- workflow numeric `workflow_id`;
- workflow `path` and protected workflow ref;
- `event`, `head_sha`, `head_branch` (branch is descriptive, SHA is authoritative);
- `run_started_at` and the observed run metadata snapshot digest;
- for reusable/nested workflows, every relevant `referenced_workflows[]` path, ref and SHA, where returned.

Use the official GitHub Actions workflow-runs REST resource, including the attempt-specific read endpoint. The adapter must verify repository identity and the full tuple `(run_id, run_attempt, workflow_id, path, event, head_sha)`; a run ID alone or mutable branch name is insufficient. Request only Actions read permission. The endpoint's `status` and `conclusion` are distinct fields; do not infer terminality from conclusion alone. The authoritative API response, request URL, API version, observation time and canonical response digest are evidence. A missing/404/403/rate-limited/inconsistent response is `UNRESOLVED`, not terminal.

For Cloudflare Workflows, additionally bind:

- Cloudflare account ID (opaque identifier; never log credentials);
- exact Workflow name and instance ID;
- deployed Workflow version identity/graph digest when available;
- input/envelope digest and the mapping from this Workflow instance to task/attempt/generation;
- creation timestamp and native instance metadata digest.

Use the official Workflows instance read/status APIs or the instance status method. Verify exact account, workflow name, instance ID, and the current native status. Status values include nonterminal states such as queued/running/paused/waiting and terminal-looking states such as complete/errored/terminated. The adapter must use the authoritative status enumeration and treat unknown/new values as `UNRESOLVED`. A missing instance, unavailable account, or mismatched identity is not proof of completion.

## 4. Evidence model and decision predicates

The Evidence Adapter emits a signed or integrity-protected observation record:

`evidence_id, executor_binding_digest, source_kind, source_resource_id, source_api_operation, observed_at, source_status, source_conclusion, source_version, response_digest, adapter_version, policy_version`.

Raw response bodies are not copied into public logs or artifacts. Retain only the minimum redacted fields needed for audit, with access control and retention policy. Secrets, bearer tokens, cookies and signed capability material must never appear in evidence records.

Allowed decisions:

- `STILL_ACTIVE`: authoritative native state is queued/running/paused/waiting or GitHub run status is in progress/queued/waiting. No state transition except recording observation.
- `TERMINAL_NO_RETRY`: executor is authoritatively terminal, but effect state is unknown or the generation is not safe to supersede. Keep attempt indeterminate/needs-review; no new attempt.
- `SAFE_TO_CLOSE`: terminal executor state plus complete evidence that the attempt performed no non-idempotent external effect, or every possible effect is reconciled through destination receipts/idempotency keys. This closes only the old attempt; it does not itself approve a new attempt.
- `SAFE_TO_RETRY_CANDIDATE`: all safe-to-close predicates pass, no unresolved effects remain, the prior generation is fenced, and policy permits a new attempt. A separate current owner approval or explicit policy authorization is still required before creating a new generation.
- `NEEDS_REVIEW`: contradictory evidence, ambiguous cancellation, untrusted/missing source, effect ambiguity, binding mismatch, revoked/expired capability, or unsupported executor state.
- `UNRESOLVED`: evidence is unavailable, stale, rate-limited, malformed or not authoritative.

The resolver may only produce `SAFE_TO_CLOSE` or `SAFE_TO_RETRY_CANDIDATE` after all required evidence is present and current. A terminal GitHub conclusion (`success`, `failure`, `cancelled`, `timed_out`, `skipped`, etc.) is not by itself proof that an external side effect did not commit. Likewise Cloudflare Workflow `complete`, `errored` or `terminated` is lifecycle evidence, not proof of downstream effect state. Termination does not reverse already committed external effects. Explicit Workflow restart cancels in-progress steps, erases intermediate Workflow state and reruns from the beginning; it must never be used as a reconciliation shortcut.

## 5. Resolver capability and policy

Resolver invocation requires a distinct, short-lived capability minted by an authorized issuer. It must bind:

- issuer ID/type and authenticated subject;
- audience = one Resolver service/environment;
- exact repository ID, task ID, attempt ID, generation and envelope digest;
- exact executor binding digest;
- permitted operation (`observe`, `resolve_no_retry`, or `propose_retry_candidate`); no generic wildcard;
- issued/expiry times from a trusted clock;
- unique jti/nonce with durable single-use consumption;
- policy version and revocation epoch;
- capability schema version.

Caller-supplied booleans, labels, usernames, strings, timestamps or JSON fields cannot create authority. Verify signature/authentication, audience, subject, scope, expiry, revocation, policy version and binding digest at the authority boundary. A consumed, revoked, expired, replayed, malformed or mismatched capability is denied. Clock uncertainty fails closed. Resolver capabilities cannot authorize provider/model calls, secret access, workflow dispatch or owner approval.

## 6. External effect reconciliation

For every declared side-effect class, maintain an effect ledger keyed by stable idempotency key and bound to attempt/generation/envelope digest.

- Prefer destination-supported idempotency keys and read-only receipt/status lookups.
- If destination offers conditional writes/fencing, include the current generation and reject stale generations.
- Persist request intent before the call and destination receipt after the call, with a recoverable outbox/inbox pattern.
- If the call may have succeeded but the response was lost, query the destination by idempotency key or receipt ID; never blindly repeat a non-idempotent call.
- If no authoritative lookup/idempotency/fencing exists, classify the effect as ambiguous and require `NEEDS_REVIEW`.
- A GitHub Actions run marked completed or a Cloudflare Workflow marked complete cannot replace destination receipts.
- A local Miniflare proof does not qualify external destinations or hosted account semantics.

## 7. Atomic resolution protocol

The selected State Authority must support conditional atomic mutation and durable append-only receipts. The protocol is:

1. Authenticate the Resolver capability and consume its jti exactly once.
2. Load the immutable attempt, current state, generation, executor binding and envelope digest from the State Authority.
3. Read native executor state through the fixed-origin read-only adapter. Reject any identity mismatch.
4. Collect and validate side-effect evidence and policy.
5. Derive the decision deterministically from evidence + policy version. Do not accept a caller-selected decision.
6. In one conditional transaction, compare expected attempt state, generation, envelope digest, executor binding digest and current resolver policy epoch; append the resolution receipt and audit/outbox event. The transaction must affect exactly one current generation or return the prior exact idempotent receipt.
7. For conflicting duplicate resolution, stale generation, changed evidence digest, different policy version or consumed capability, deny without mutation.
8. If the transaction response is lost, read the authority store and return the exact committed receipt only when all binding/digest fields match. Never guess.
9. A `SAFE_TO_RETRY_CANDIDATE` receipt only records eligibility. A new owner-approved immutable envelope and new single-use claim are required for a new generation.
10. Dispatch remains a separate gate and is not called from the resolver transaction or receipt delivery.

The transaction must never clear or transfer the old lease, create a new attempt, or invoke an executor. Old-generation Worker and Finalizer operations must continue to affect zero rows after a resolution. Any ambiguity in commit outcome is reconciled by reading the State Authority.

## 8. Audit receipt

Append-only receipt minimum fields:

- `resolution_id`, `decision`, `decision_reason_codes`;
- task/attempt/approval IDs, generation, envelope digest, executor binding digest;
- resolver issuer/subject ID, capability jti hash, policy version;
- evidence IDs, source response digests, adapter versions and observation timestamps;
- side-effect reconciliation summary and destination receipt digests;
- prior/new attempt states, expected generation and conditional mutation result;
- `created_at`, trusted clock identity, receipt digest and idempotency key.

Do not store bearer tokens, raw secrets, unredacted event payloads or unnecessary personal data. Audit delivery is an outbox operation; acceptance is not reported until the receipt is durably committed in the State Authority.

## 9. Threat model and mitigations

| Threat | Required mitigation / expected outcome |
|---|---|
| Stale worker resumes after lease expiry | Monotonic generation fencing on every mutation and downstream effect; stale write denied |
| Forged `resumable=true` or caller-selected decision | Ignore/reject caller authority fields; decision derived from authenticated evidence |
| Wrong repository/workflow/run/SHA | Exact immutable tuple comparison; `NEEDS_REVIEW` |
| Run ID reused with later attempt | Bind exact `run_attempt`; old attempt evidence cannot resolve new attempt |
| Mutable branch moves after dispatch | Bind commit SHA and workflow path/ref; branch name descriptive only |
| GitHub API 404/403/rate limit/stale cache | `UNRESOLVED`; no fallback to labels or user assertion |
| Cloudflare instance missing/deleted | `UNRESOLVED`; deletion is not completion evidence |
| Cloudflare Workflow restart/termination | Do not infer no side effect; inspect destination ledger; no automatic retry |
| Resolver token replay or theft | Audience/scope/expiry/revocation/jti single-use; least privilege |
| Concurrent resolvers | Conditional transaction + unique resolution key; one winner |
| Lost response after commit | Read-back exact receipt by immutable key; no duplicate transition |
| Contradictory executor and effect evidence | `NEEDS_REVIEW`; no retry |
| External call commits but response is lost | Destination idempotency/receipt lookup; otherwise `NEEDS_REVIEW` |
| Compromised workflow with excess permissions | Separate read-only evidence identity from dispatch identity; narrow Actions/Cloudflare scopes |
| Secret leakage through evidence | Redaction allowlist, digest-only payloads, no token/raw event logging |
| Policy changes during reconciliation | Bind policy version/revocation epoch; re-evaluate or deny |
| Clock skew / delayed observation | Trusted time, max evidence age and expiry; fail closed |
| Malicious/malformed source response | Schema validation, fixed API origin, strict status allowlist; unknown state unresolved |

## 10. Backend fit assessment (not a selection)

### GitHub Actions run metadata

**Useful for:** identifying the native run and attempt, verifying workflow ID/path, event, commit SHA, timestamps, status and conclusion; read-only status observation with Actions: read.

**Limitations:** a run's terminal status does not prove downstream side-effect absence or idempotency. Re-runs require exact `run_attempt` binding. API errors/rate limits must remain unresolved. GitHub workflow concurrency is not a durable claim lock. The current project default workflows still have privileged boundaries requiring separate governance remediation.

**Decision:** use as one executor evidence adapter only; not the state authority and not a general Resolver credential.

### Cloudflare Workflows

**Useful for:** durable instance identity, lifecycle status, step history and resumable orchestration. Existing PR #52 provides local Miniflare evidence for duplicate instance suppression, retry around a D1 receipt, explicit restart semantics, and one in-progress persisted-sleep recovery scenario across local Wrangler/Workerd process recreation.

**Limitations:** PR #52 uses local synthetic D1/Miniflare only. Hosted account, regional failure, production retention, distributed contention, actual binding identity and downstream external side-effect behavior remain NOT VERIFIED. The proof does not establish that every in-progress crash point is safe. `restart()` deliberately cancels in-progress steps and erases intermediate state; it is not a recovery primitive for ambiguous side effects. Workflow state is not a substitute for the authoritative claim ledger.

**Decision:** retain Cloudflare Workflows as a candidate orchestrator and evidence source. Reuse the official Cloudflare Workers SDK Vitest fixtures and official Workflows APIs already used by PR #52; do not build a custom workflow engine. Do not provision remote resources or select Cloudflare as production authority until account eligibility, free-tier/cost constraints, access policy, hosted semantics and independent review are verified.

### Durable state authority

PR #51 D1 queue and PR #52 D1/Workflow composition are local proof artifacts, not hosted D1 qualification. The State Authority remains backend-neutral. No database, Git ref or GitHub label strategy is selected by this contract.

## 11. Required adversarial qualification suite

The selected real backend and executor adapter must pass:

1. Exact matching GitHub run ID + run_attempt + repository ID + workflow ID/path + event + head SHA.
2. Wrong repository, wrong workflow path, changed head SHA, wrong run_attempt, unexpected reusable workflow ref/SHA.
3. GitHub in-progress, queued, waiting, cancelled, timed_out, failure, success and skipped statuses; verify only policy-defined outcomes and never infer effect absence from conclusion.
4. GitHub 404, 403, 429/rate limit, timeout, malformed body and stale observation -> unresolved.
5. Cloudflare queued/running/paused/waiting/complete/errored/terminated plus unknown future status.
6. Cloudflare wrong account/workflow/instance/version and missing/deleted instance -> unresolved.
7. Restart or terminate after effect intent, after destination commit, and before receipt persistence; reconcile through destination idempotency/receipt.
8. Stale Worker/Finalizer generation after resolver decision -> zero state changes and no effect.
9. Forged, expired, revoked, wrong-audience, wrong-subject, wrong-operation and replayed capability.
10. Two concurrent resolvers; exactly one durable receipt and one conditional state transition.
11. Lost response after commit; exact receipt recovered without duplicate.
12. Evidence changes after decision, policy version changes, clock skew and stale evidence.
13. Conflicting destination receipts and ambiguous non-idempotent external call -> NEEDS_REVIEW.
14. Outbox delivery retry; one logical audit receipt.
15. Process interruption at every state boundary; no automatic retry or dispatch.
16. Explicit assertions that provider/model, DSH, Resource Probe, deploy and dispatch endpoints are unreachable from the Resolver.

Tests must execute against the selected real hosted backend before qualification. Local unit/Miniflare tests are design feedback only.

## 12. Qualification and rollout gates

Before any resolver implementation is allowed to gain authority:

- reconcile this contract with the Shared Immutable Claim Lifecycle Contract and Issue #38;
- document exact backend/API identity, permission scope and account/free eligibility;
- implement read-only evidence adapters first, with fixed origins and schema validation;
- qualify the State Authority conditional transaction, append-only receipt and recovery semantics;
- run exact-head CI and immutable artifact/source read-back;
- perform independent security/provenance review after safe implementation;
- prove no resolver path can dispatch or call providers;
- publish hosted-backend contention, interruption, replay and effect-reconciliation evidence.

Until every gate passes: `RESOLVER_AUTHORITY=DISABLED`, `DISPATCH=false`, no retry/takeover, no remote provisioning, no provider/model calls. Missing evidence means `NOT VERIFIED`.

## 13. Explicit non-goals

- Does not implement a resolver, evidence adapter, capability issuer, D1 migration or Worker.
- Does not select GitHub Actions or Cloudflare Workflows as the durable claim authority.
- Does not enable dispatch, retries, takeover, provider/model calls, DSH, Resource Probe or deployment.
- Does not assert Cloudflare Free entitlement, remote D1 availability or hosted Workflow qualification.
- Does not merge PR #51/#52/#56 or accept Contour A.
- Does not authorize Contour B / MediaHub product development.

## References

- Shared claim contract: [SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md](SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md)
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #51 reconciliation queue: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- PR #52 Cloudflare Workflows local proof: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52
- PR #56 lease takeover denial: https://github.com/VlDMlNSh/developer-cloud-pool/pull/56
- GitHub Actions workflow-runs REST API: https://docs.github.com/en/rest/actions/workflow-runs
- Cloudflare Workflows API: https://developers.cloudflare.com/api/resources/workflows/
- Cloudflare Workflow Workers API: https://developers.cloudflare.com/workflows/build/workers-api/
- Cloudflare Workflow trigger/restart semantics: https://developers.cloudflare.com/workflows/build/trigger-workflows/


## 14. GitHub Actions read-only run-attempt evidence adapter proof (2026-11-10)

A separate proof package is maintained in PR #57:
https://github.com/VlDMlNSh/developer-cloud-pool/pull/57

The transport contract is the official attempt-specific endpoint:

`GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}`

For private repositories, the fine-grained credential needs Actions repository permission `read`; do not use Actions: write, contents: write or workflow-dispatch scopes. Public repository reads may be unauthenticated. Use the fixed GitHub API origin, explicit API version and GET only. Do not follow caller-supplied URLs or redirects to arbitrary origins.

The adapter must bind and compare the complete returned tuple:
`repository.id`, `id`, `run_attempt`, `workflow_id`, `path`, `event`, `head_sha`.
The GitHub API example formats `path` with its ref suffix (for example `.github/workflows/build.yml@main`); compare the exact full returned value rather than reducing it to a filename. Also retain `referenced_workflows[]` (path/ref/SHA) for reusable workflow qualification; any required referenced-workflow mismatch is unresolved.

The pure verifier currently returns:
- `STILL_ACTIVE` for recognized nonterminal statuses;
- `TERMINAL_EXECUTOR_ONLY` for recognized completed conclusions, with `sideEffects=UNKNOWN`, `retryAuthorized=false`, and `dispatch=false`;
- `UNRESOLVED` for API errors/non-200, missing or malformed fields, identity mismatches, stale/future observations and unknown future status/conclusion values.

The current proof deliberately does not implement HTTP transport or create a resolver. It uses synthetic Node built-in fixtures only. Final PR #57 head `f92e4bb0931318fd47a252e874ea50bdfc448655` passed exact-head fixture CI run `42834033274`, job `129891348351`, with 11/11 tests passing; Pool Contract Validation run `42834033256`, job `129891356582`, also COMPLETED/SUCCESS. The fixtures compare referenced-workflow identities including SHA-pinned entries with absent ref normalized to null. This verifies only the pure response verifier and synthetic fixtures, not a live API transport or resolver.

Official endpoint and response schema: https://docs.github.com/en/rest/actions/workflow-runs


## 15. Octokit attempt-specific transport proof (2026-11-10)

PR #57 now includes a narrow adapter around the real GitHub-maintained `@octokit/rest@22.0.1` client:
https://github.com/VlDMlNSh/developer-cloud-pool/pull/57

The dependency lock was generated on a GitHub-hosted `ubuntu-24.04` runner with Node 22.23.4 / npm 10.9.9. Lockfile v3 contains 20 transitive package entries; all 20 include resolved registry tarball URLs and SHA-512 integrity values. The committed lock's SHA-256 is `d60947765a0643454d8a09c087cc6a15d37aa5efb9772ebd52277d44e24e2820`. The exact committed lock passed `npm ci --ignore-scripts` on final PR head `6de267caa82c9a2247b531abb12f8c9ee1514a37`.

The transport adapter fixes the request route to:
`GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}`
It validates owner/repo and positive safe integer run/attempt identifiers, accepts no arbitrary URL/method/auth/options from caller input, sets API version `2022-11-28`, and explicitly sets `request.retries: 0`. An HTTP status is preserved only when Octokit exposes an HTTP response; a network error without response is propagated so the composition boundary can map it to UNRESOLVED. No retry, dispatch or fallback is permitted.

Synthetic tests instantiate actual Octokit with an injected fetch and verify exact full URL + GET, fixed route despite malicious extra caller properties, HTTP errors without retry, and a network failure with one fetch only. Final exact-head run `42835449098` / job `129896303135`: 16 tests passed, 0 failed; exact-head Pool Contract Validation run `42835449180`: SUCCESS. This is synthetic transport proof, not a live API call.

Source blobs: manifest `67a338f6fc3173b3f8f2c98ceece41bdc46b74ca`; lock `69bc37ff0e2b655d38fd15e1d0866699d8807088`; adapter `c29b7e69e682919f98e768321b9391b750c07abf`; tests `23bc525074fd623189e5cebb028473716f044074`.

The workflow remains `contents: read`, checkout credentials are not persisted, and no Actions write permission, secret, live API credential or dispatch is used. PR #57 is OPEN/DRAFT; reviews and inline threads are zero. Independent review NOT RUN. Resolver, live API qualification, trusted clock, effect reconciliation and hosted State Authority remain NOT QUALIFIED.


## 16. Composed attempt evidence check and Supervisor integration boundary (2026-11-10)

PR #57 adds `src/evidence-check.mjs`, composing the pinned Octokit attempt-specific reader with the pure `verifyWorkflowRunAttempt` function. The factory pins owner, repository and repository ID in trusted deployment configuration. Per-call binding supplies run ID and exact run attempt; caller-provided repository/clock values are not consumed. The injected host clock is sampled after transport and passed to the pure verifier. Transport failure, clock failure, stale/future/backwards observation and non-authoritative HTTP response all fail closed. The composition library cannot prove the provenance of the injected clock; production clock qualification remains a separate gate.

Final exact PR head `7a06a663de5431ebb79dc2e1297d66491c9d6d0f` passed fixture run `42837090182`, job `129902075346`, 23/23 tests, and Pool Contract Validation run `42837090501`. Artifact `13773817882`, digest `sha256:cef61a9a5d346913c94e6e36e6f8e03f9b233f8d259f2c8459c19e3273d7bb3d`. Source blobs: composition `f7b04e8dcf966a1cc37be9261fe31158eb9a3281`; tests `52227c2bdede82c54a6bd70d77d27fd11c7ea444`.

Read-only inspection of the default-branch Supervisor found it is not ready for integration:
- Workflow `pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` supplies run ID, SHA, title and conclusion, but no exact run_attempt or full immutable workflow/repository binding.
- `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f` lists workflow runs and heuristically matches display title + creation time. It does not bind attempt-specific response identity or referenced workflows.
- If no matching run appears after 15 minutes, it resets `pool:claimed` to `pool:ready`. List absence is not authoritative proof the executor did not start or cannot produce side effects; this transition is unsafe for future automatic retry/reconciliation until replaced by a qualified resolver.
- It uses ambient `Date.now()`, not a qualified trusted clock provider.
- Workflow permissions include `actions:write` and `issues:write`; dispatch remains behind the literal `POOL_DISPATCH_ENABLED=true` gate. Do not enable or invoke it.

No production Supervisor/Worker files were modified. No dispatch, live API request, credential, provider call, DSH, remote provisioning, deployment or merge occurred. Adapter remains isolated read-only proof code. Current statuses: composition synthetic CI VERIFIED; production trusted clock NOT QUALIFIED; Supervisor integration NOT IMPLEMENTED; authoritative side-effect reconciliation NOT QUALIFIED; Resolver NOT IMPLEMENTED; PR #57 OPEN/DRAFT; Issue #38 OPEN; Contour A NOT ACCEPTED; Contour B DEFERRED.

Next: define and test native `workflow_run` event binding including exact run_attempt and immutable repository/workflow identity, and prove inconclusive API/list results cannot transition claimed→ready. Keep dispatch disabled.


## 16. Native workflow_run binding and hold-only policy (2026-11-10)

PR #57 adds two pure contract modules:
- `workflow-run-event-binding.mjs`: derives the immutable binding from a native completed `workflow_run` payload and deployment-pinned repository/workflow configuration. It requires exact repository ID (root/run/head repository), workflow ID/path, originating event, run ID, `run_attempt`, head SHA and referenced-workflow array; missing/forked/mismatched identity is rejected. Blob `e85fddcd22a8154fb5896ca5038a2581316322ee` (file commit `793e5dbbf86e18075fc3586ea81a1064d71dd98a`).
- `workflow-run-reconciliation-policy.mjs`: maps STILL_ACTIVE and UNRESOLVED to KEEP_CLAIMED; TERMINAL_EXECUTOR_ONLY to HOLD_FOR_EFFECT_RECONCILIATION. Every result preserves CLAIMED, disables dispatch and retry, and has no ready-release outcome. Module blob `760846ec78b5ec1e6c31b1e2059eb8c0cfe15264` (file commit `5d4129480fd7e4e6da16c0d28834ae269a61b7bd`).

Final exact-head fixture CI `42838193384` / job `129905939447`: SUCCESS, 33/33 tests; Pool Contract Validation `42838193405` / job `129905939738`: SUCCESS. Final PR #57 head `2c263e8a9915f0bc8e0698cde816e87cb2376538`.

These tests do not authenticate the runner or prove provenance of `GITHUB_EVENT_PATH`; they do not wire the helper into Supervisor or implement atomic state transitions. The policy is not a production release mechanism.

Default Supervisor still has privileged `workflow_run` + `actions:write` (workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`); default Worker still uses `workflow_dispatch` with issue-write reporting (blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`). PR #37 proposes reusable workflow_call, exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, exact-head runs `42484039940` and `42484039932` SUCCESS; but PR #37 remains OPEN/DRAFT, base `197ba98...` is stale relative to default HEAD `864213e...`, and its Finalizer still checks only `pool:claimed` before label transition. Envelope digest, claim generation/owner and run/attempt are not bound; label claim is not CAS. Formal CHANGES_REQUESTED review remains on record from earlier head; no new independent approval is established.

Disposition: pure event binding + hold-only policy VERIFIED under synthetic tests; native event provenance NOT QUALIFIED; production wiring NOT IMPLEMENTED; claim CAS/fencing/effect reconciliation NOT QUALIFIED; PR #57 independent review NOT RUN; Contour A NOT ACCEPTED.


## 17. Existing local finalization primitive reuse boundary (2026-11-10)

The branch `fix/attempt-finalization-idempotency-2026-11-08` contains a useful `finalizeTaskAttempt` local D1 primitive. Its conditional update binds taskKey, attemptId, workerId, generation, current attempt/lease attempt, leased state, running attempt and unexpired lease. It supports exact terminal replay and denies conflicting/stale finalization. Source blob `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`; test blob `e259ce028eff89448ebd40881f15c7c410877686`.

This primitive is **worker finalization only**, not trusted reconciliation authority:
- It does not bind the immutable approval/envelope digest, issuer, claim ID, repository/workflow identity, Actions run_id/run_attempt or resolver capability.
- It requires a current unexpired running lease; it does not resolve an indeterminate attempt.
- The candidate branch is stale relative to PR #51 by 8 commits and lacks the reconciliation-queue / projection-outbox migrations currently present on the newer lineage. Do not merge/stack it as-is.
- Exact-head CI for the candidate branch was not established. PR #54's successful run belongs to its separate 50-approval contention branch and must not be attributed to this finalizer branch.

Reuse only the conditional-update and exact-replay semantics after porting them to the current PR #51/#56 migration graph, extending the binding with immutable envelope/claim and exact executor run/attempt identity, and adding adversarial tests. Keep resolver decisions and external side-effect reconciliation as a separate authority path. No production wiring or dispatch until exact-head tests and all authority/effect gates pass.
