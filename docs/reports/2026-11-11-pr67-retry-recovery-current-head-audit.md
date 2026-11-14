# 2026-11-11 — Cloud Pool daily status and PR #67 retry/recovery source audit

**Audit time:** 2026-11-11 19:23 Europe/Vilnius  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Scope:** Contour A only; read-only GitHub audit plus one bounded source-level review. No source/runtime/security-boundary mutation.

## Executive status

- Repository read-only audit: SUCCEEDED.
- Default branch: VERIFIED at 221f216c00ca7e5596bcc682ba185ad155a10603.
- PR #67 exact-head local D1 and Pool Contract CI: VERIFIED SUCCESS.
- PR #67 receipt-bound projection orchestration: IMPLEMENTED as an isolated local proof, but NOT QUALIFIED.
- A retry-authority gap remains: every orchestrator delivery invocation passes allowPost=true, so a delayed comment marker can cause another POST on a later D1 retry.
- Orphaned fifth-lease recovery remains BLOCKED; the public orchestrator exposes delivery only, while the low-level dead-letter helper requires the expired lease's original worker identity.
- Issues #1, #22, #26 and #38 remain OPEN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Repository and documentation lineage

- Default branch: Основной.
- Immutable default HEAD: 221f216c00ca7e5596bcc682ba185ad155a10603.
- Commit message: docs: checkpoint PR65 current-base divergence.
- Commit changed only docs/checkpoints/CLOUD-POOL-CONTINUATION-CHECKPOINT-2026-11-11.md.
- Default-branch Context Window is stale: blob 8707a0ab0b2f66de9bae3441e0334c1621f89925, header says last refreshed 2026-11-08 and records old default HEAD 197ba98d0dc7d8437d759dd25bee8750d02e59ae.
- Current working documentation branch is docs/projection-stack-reconciliation-2026-11-11, represented by draft PR #66. Before this audit its HEAD was e4a498521135489a3bf54e1ab270dd22cecb0526, based on current default, 98 commits ahead / 0 behind, with 23 documentation-only changed paths. It is not the default branch and is not canonical production state.
- Working Context Window blob before this update: 28c8403f187eedf2a032725cbcd71101488c0235; working checkpoint blob: 359ca19fb4308cda31d64acd6e1748fc499608c8.
- PR #66 exact-head CI, formal reviews and inline threads: none returned; CI/review NOT VERIFIED. Keep PR #66 DRAFT and unmerged.

## Issues

| Issue | Current state | Assessment |
|---|---|---|
| #1 Governance | OPEN | Ruleset is active but does not require an approving review or status checks; current dispatch variable value NOT VERIFIED |
| #22 Secure web console | OPEN | No authenticated, deployed Experience Worker; OAuth/session work remains isolated proof/design |
| #26 Account-isolated routing and quotas | OPEN | No production router, provider credential isolation or upstream quota authority |
| #38 Durable single-use claims | OPEN | No selected/qualified hosted claim backend, issuer, trusted clock, revocation or recovery actor |

The repository currently reports 48 open PRs and 6 open non-PR Issues.

## Governance and default runtime

- Active ruleset 26550182, name “Основной — verified”, enforcement active; selector exactly refs/heads/Основной.
- Ruleset requires PRs, prevents deletion and non-fast-forward updates, and requires review-thread resolution.
- required_approving_review_count=0; require_code_owner_review=false; no required status-check rule was returned.
- Classic branch endpoint reports protected=false. The active ruleset is separate evidence and remains operative.
- Current Actions variable POOL_DISPATCH_ENABLED was not read in this pass: NOT VERIFIED. The PR #67 contract workflow asserts the dispatch-disabled invariant in its tested merge tree; that does not prove the live Actions variable value.
- Default workflow directory contains dsh-runtime-evaluation.yml, pool-contract-validation.yml, pool-supervisor.yml, pool-worker.yml and runner-resource-probe.yml. No Gemini batch-dispatch controller is present in this default workflow tree.
- Default Supervisor and Worker source remain the older privileged path: Supervisor uses workflow_run and write permissions; Worker exposes workflow_dispatch. The dispatch path in the supervisor script is guarded by POOL_DISPATCH_ENABLED, but the live variable is NOT VERIFIED.
- Existing scheduled Supervisor run 43066925017 completed SUCCESS on the current default SHA. Its job was “Reconcile approved task queue”. This is a scheduled validator/reconciliation run, not evidence that a qualified Worker or pool runtime executed.

## Key PRs, exact-head CI and branch divergence

All comparisons below use current default HEAD 221f216c00ca7e5596bcc682ba185ad155a10603 as the base unless stated otherwise.

| PR / branch | Head | Ahead / behind | Exact-head CI | Reviews |
|---|---|---:|---|---|
| #24 Experience API/hosting ADR | 7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3 | 62 / 64, diverged | Runs 42982847600 and 42982847694 SUCCESS | 0 |
| #25 Hono prototype | 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85 | 29 / 64, diverged | Runs 42228269689 and 42228269676 SUCCESS | 0 |
| #30 synthetic OAuth compatibility | ad9f9ac598a2414b5209b6923094b16be64630ae | 35 / 64, diverged | Push run 42216422883 SUCCESS; no PR-event run returned | 0 |
| #31 synthetic GitHub read adapter | 5470fccbc4a5fe80a750f402d70d703757fc4c1d | 36 / 64, diverged | PR run 42229917555 SUCCESS | 0 |
| path-segment fix branch | dee17350864cb49e8c5dd41cf61859d77d3affca | 38 / 64, diverged | No PR and no exact-head CI | N/A |
| #63 Recovery Actor component-fit docs | 4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6 | 48 / 43, diverged | No runs returned | 0 |
| #64 free claim-backend fit docs | 95d237c753bec96abe9add621140928511047599 | 51 / 43, diverged | No runs returned | 0 |
| #65 hosted-D1 plan transplant | 3d67783e4da60296f26547174b0bdeae58d9a3f2 | 4 / 7, diverged | No runs returned | 0 |
| #66 projection-stack docs | e4a498521135489a3bf54e1ab270dd22cecb0526 | 98 / 0 | No runs returned | 0 |
| #67 receipt-bound D1 projection | dea09ffe94059f446c74fada37971087ec4878eb | 9 / 0 | Two PR runs SUCCESS | 0 |

Additional tracked proof state:
- PR #58 head 5caeb60f7a45d836c6ad1eea2fb86e20995da025 and PR #59 head 22200226da4f1af30645cf441a639db6893e9310 remain OPEN/DRAFT/UNMERGED on an old stacked proof lineage. Their exact-head local D1 CI runs 43043284086 and 42981807825 passed, but the stack is substantially diverged from current default and is not hosted qualification.
- PR #61 head 58e255880c4cf4dc24fc2f2ee0791a9b121146ae has local Experience Auth D1 run 42991794791 SUCCESS. It is based on the PR #52 Cloudflare Workflows/Vitest proof branch, not current default; no reviews. It does not implement production OAuth/session in the Hono Worker.
- PR #54 head 15a09c910f52553c59796260131a6b5a4a39c15f has local D1 run 43010770730 SUCCESS. Its only formal review is COMMENTED by the repository owner; it is not independent acceptance.
- PR #60 has no exact-head workflow run or formal review.
- PR #29 (Issue #26) has one CHANGES_REQUESTED review by maxkorolskiy88-ship-it anchored to older head 34fc78921b16359d136db553d8a51b4a4716995d. Current head e4c8d642bbc054e7c52b391356965b492dad32b4 is 36 ahead / 64 behind current default. Current source blob d45791b32571cca4ce4a6f92cec89c70ec296747 applies one eligibility predicate to active and new slots, addressing the prior active-slot bypass in source. The only exact-head run found is Pool Contract Validation 43031920223; dedicated current-head unit-test CI was not found. Reviewer independence/authority for final acceptance is NOT VERIFIED.
- PR #28 (Issue #26 design) is 2 ahead / 64 behind and has no exact-head CI or review.

The path-segment correction remains an unmerged standalone branch. Its earlier source/test read-back is not a substitute for a PR and exact-head CI.

## Bounded source audit — PR #67

Immutable target: dea09ffe94059f446c74fada37971087ec4878eb, based exactly on current default HEAD 221f216c00ca7e5596bcc682ba185ad155a10603.

Exact-head evidence:
- Isolated D1 Ledger Proof PR run 43064261520, job 130674831651: COMPLETED / SUCCESS; pinned Node, npm ci, syntax check and Workers-runtime D1 tests passed (5 files / 66 tests).
- Pool Contract Validation PR run 43064261551, job 130674831998: COMPLETED / SUCCESS; dispatch-disabled assertion, workflow YAML syntax and pool security-contract validation passed.
- Push D1 run 43064251525 also completed SUCCESS on the same SHA.
- Combined commit-status contexts were empty; do not describe them as published required status checks.
- PR #67 is OPEN / DRAFT / UNMERGED, mergeable metadata true, with 0 formal reviews and 0 inline threads.

Positive local proof:
- The orchestrator owns lease acquisition, reads back the same outbox row, derives the immutable projection envelope from that row, checks event ID/digest, conditionally ACKs with outbox ID/digest/worker/generation/unexpired lease, and verifies D1 delivered-state read-back.
- Migration 0009 prevents updates to immutable projection identity fields.
- The public factory exposes deliver(outboxId), not a receipt-free ACK primitive.
- All outcomes remain dispatch:false.

### F-01 — delayed marker visibility can cause a repeated external POST

Source blobs:
- projection-delivery.mjs: 3ddb3fd8e56dd9c85f3160aba066a25ba4f13dad.
- projection-reconciler.mjs: 2f83befc145d39ea60f06fe5b9e9033f89df40c0.
- projection-outbox.mjs: cd27ba98c5716ef568c0672250b652d68e714ea5.
- projection-reconciler.test.ts: 76b144bd067a42455b858345abec5ee3580c8ccf.
- projection-delivery.test.ts: 602fb9aec4aca161f0065df16d9c4b428cbbf11f.

At projection-delivery.mjs line 106, every call to deliver() invokes reconcileTerminalProjection(..., { allowPost: true }). When the comment marker is absent or not yet visible, the reconciler may POST. If read-back remains delayed, the orchestrator records a retryable D1 state; a later deliver() invocation acquires a new delivery generation and again passes allowPost:true. Thus the durable D1 attempt counter does not consume or constrain a one-use POST authorization.

The reconciler-only test demonstrates safety only when the second invocation is manually passed allowPost:false. The production-facing local orchestrator does not expose that mode and unconditionally passes true. The orchestration tests use an immediately visible fake comment and do not test delayed visibility across two deliver() calls. A delayed but successfully committed comment can therefore be posted again on a later retry; up to the bounded delivery attempt count may create duplicate comments.

This is a source-derived local protocol defect, not a live GitHub incident. No real GitHub API call was made. Do not claim exactly-once external side effects. A real one-use grant/nonce authority is still unimplemented and cannot be replaced by the boolean flag.

### F-02 — orphaned fifth delivery lease has no orchestrator recovery path

- acquireProjectionDelivery only acquires rows with delivery_attempts < 5.
- deadLetterExpiredProjection requires the original lease_owner and matching generation after lease expiry.
- createProjectionDeliveryOrchestrator exposes only deliver(); it does not expose or invoke an independently authorized recovery operation.
- If the worker disappears after acquiring the fifth lease, a later worker cannot reacquire it and the orchestrator cannot dead-letter it. The row can remain leased indefinitely.
- PR #60/#63 Recovery Actor work remains design-only; issuer, key custody, subject registry, revocation, trusted time and audit ownership are not evidenced.

### F-03 — managed-label ownership remains prefix-wide

The reconciler classifies every label beginning with pool: as managed, then removes all such labels not in the desired terminal set. This can remove future or separately governed pool lifecycle labels. The earlier PR #58 audit identified this issue; PR #67 reuses the same reconciler without narrowing the ownership allowlist. Live wiring requires an explicit exact set of labels this component may mutate.

### F-04 — inherited attempt-finalization event gaps remain

- task-attempts.mjs blob 6cb028e048569700ed623d93462ef55e2392a084 uses resultDigest || provenanceDigest as the replay event_digest comparison, not a versioned canonical digest over the complete immutable finalization event.
- Migration 0006 blob 660fa9de99ed78fe083bb627d6a61dbf0bd65c25 records NEW.lease_owner for status-transition actor_id. Retryable/delivered/dead-letter updates clear lease_owner in the same update, so the trigger can record NULL actor attribution.
- These are inherited F-01/F-02 conformance findings from the PR #54 proof review; PR #67 does not correct them.

### F-05 — no production authority composition

The orchestrator receives db, api, workerId and clock as injected constructor inputs. The API in tests is fake. No authenticated worker identity, trusted production clock, live GitHub adapter, hosted D1, crash/restart qualification or deployment is demonstrated. This PR is a local proof only.

## Executors and controllers

- SentinelX current read: 0 connected hosts; Free plan limit 1, active 0, one slot available. Voktors-Mini.Dlink is enrolled but offline (last connection 2026-11-09); mh-dev-01 and mh-dev-02 are disabled by the user. No SentinelX executor is currently online.
- GitHub default workflow tree contains DSH runtime evaluation and Resource Probe definitions, but neither was run in this audit.
- Gemini batch-dispatch controller is absent from developer-cloud-pool default workflows. No controller or agent was dispatched.
- Cloudflare account-level Workers Free entitlement and current Worker/D1 inventory were not refreshed in this non-interactive pass: NOT VERIFIED. Last available account audit (2026-11-06) had no Worker scripts and Billing API returned 403 because Billing Read was unavailable; that historical result does not establish current account state.

## Safety and actions

- No secret, token, API key or credential value was read or disclosed.
- No provider/model call, DSH, Resource Probe, workflow dispatch, agent launch, deployment, hosted D1 provisioning, merge, issue mutation, variable/secret/ruleset mutation or paid resource was performed.
- One bounded source-level audit was completed against immutable PR #67 HEAD. No source code was changed.

## Next concrete step

1. Keep PR #67 draft and unmerged.
2. Resolve one-use POST authority before any live sender: an opaque, issuer-verified, event/resource/digest/generation-bound grant with atomic nonce consumption and trusted time; until then, delayed-visibility retries must not POST again.
3. Define the exact managed-label allowlist and versioned canonical finalization event/actor semantics.
4. Define a separately authorized orphaned-fifth-lease recovery path; do not broaden same-worker authority.
5. Continue no-cost hosted D1/Workers entitlement qualification and production composition design without provisioning.
6. Reconcile the default-branch Context Window with the working documentation branch only through a separately reviewed docs PR; do not overwrite or merge blindly.

## Status matrix

| Area | Status |
|---|---|
| Read-only GitHub audit | SUCCEEDED |
| Default HEAD / active ruleset | VERIFIED |
| PR #67 exact-head local D1 + Contract CI | VERIFIED |
| PR #67 delayed-visibility retry authority | BLOCKED |
| PR #67 orphaned fifth-lease recovery | BLOCKED |
| Issue #22 protected web console | NOT IMPLEMENTED / NOT DEPLOYED |
| Issue #26 provider routing/account quotas | NOT IMPLEMENTED / NOT QUALIFIED |
| Issue #38 hosted claim backend / issuer / trusted time | NOT QUALIFIED |
| Independent final acceptance | NOT VERIFIED |
| Current dispatch variable | NOT VERIFIED |
| SentinelX online executor | NOT AVAILABLE |
| Hosted D1 / live GitHub projection | NOT RUN |
| Contour A | BLOCKED / NOT ACCEPTED |
| Contour B | DEFERRED |

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
