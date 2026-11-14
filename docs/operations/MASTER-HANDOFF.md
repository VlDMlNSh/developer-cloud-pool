# Developer Cloud Pool — Master Handoff

**Snapshot:** 2026-11-14  
**Purpose:** Restore the project state and continue engineering from any ChatGPT chat without relying on the previous conversation transcript.  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Default branch:** `Основной`  
**Default-branch baseline SHA:** `221f216c00ca7e5596bcc682ba185ad155a10603`

> This file is the canonical operational handoff. Update it at the end of every meaningful engineering pass. Do not infer current GitHub state from this snapshot alone: first refresh the PR heads and exact-head CI.

## 1. Current status at this snapshot

- Project remains independent from MediaHub OS.
- PR #67 is OPEN / DRAFT / NOT MERGED.
- PR #68 is OPEN / DRAFT / NOT MERGED.
- Default branch has not been changed by the work recorded here.
- `POOL_DISPATCH_ENABLED` remains disabled. No worker dispatch is authorized by this handoff.
- No provider/model calls, paid APIs, billing changes, hosted D1 provisioning, deployment, or external server access were performed in the latest A0 pass.
- No secret values were read, printed, or copied into documentation.

## 2. Active pull requests — verified exact heads

| PR | Purpose | Branch | Exact head | State |
|---|---|---|---|---|
| [#67](https://github.com/VlDMlNSh/developer-cloud-pool/pull/67) | Isolated D1 ledger, immutable attempts, fenced lifecycle, receipt-bound projection and A0 admission contract proof | `impl/receipt-bound-projection-2026-11-11` | `a53f6232bd5b50d3e150addf528b8e722002f9dd` | Open, Draft, not merged |
| [#68](https://github.com/VlDMlNSh/developer-cloud-pool/pull/68) | Architecture consolidation, qualification matrix, build estimate and continuation audit | `docs/unified-cloud-pool-jarvis-plan-2026-11-14` | `96e6821993858d8741bced6861f575296e81aaa2` | Open, Draft, not merged |

Both PRs target `Основной` at baseline `221f216c00ca7e5596bcc682ba185ad155a10603`. Re-check before acting; PR heads may advance.

### PR #67 exact-head CI

- Pool Contract Validation run `43600901063`: SUCCESS.
- Isolated D1 Ledger Proof run `43600901068`: SUCCESS.
- Workers-runtime Vitest: **84 passed**, 6 test files.
  - projection reconciler: 10
  - projection delivery: 12
  - consume: 13
  - A0 admission contract: 14
  - projection envelope: 5
  - claim/outbox and task-attempt lifecycle: 30
- D1 upgrade-binding smoke: 1 passed.
- Frozen schema-0010 fixture smoke: 2 passed.
- The A0 tests are isolated contract tests with injected test authorities. They are not evidence of production cryptographic verification, durable capability consumption, or live quota truth.

### PR #68 exact-head CI

- Pool Contract Validation run `43600575423`: SUCCESS.
- Runner Resource Probe run `43600575523`: SUCCESS.
- The resource evidence is observational only; it does not qualify reserved capacity, multi-agent packing, or production worker profiles.

## 3. What exists and what it proves

### D1 local proof in PR #67

The local Workers-runtime D1 proof contains:
- single-use approval consumption and atomic claim/outbox creation;
- canonical logical task identity;
- immutable attempt records and per-task attempt numbering;
- lease ownership and monotonically increasing generation fencing;
- stale/expired renewal and finalizer rejection;
- bounded legacy lease-attempt behavior and dead-letter handling;
- indeterminate-attempt handling, which blocks blind takeover/retry;
- terminal projection outbox, fenced delivery, read-back verification and at-most-once comment POST gate;
- local migration/fixture reproducibility tests.

All D1 adapters in this package return `dispatch: false`. The proof is not mounted in the Hono console, production Supervisor/Worker, or deployed Cloudflare Worker. It is local Workers-runtime evidence, not hosted D1 qualification.

### A0 admission contract added in PR #67

Files:
- `proofs/d1-ledger/src/a0-admission-contract.mjs`
- `proofs/d1-ledger/test/a0-admission-contract.test.ts`

The contract fails closed on:
- malformed immutable task/attempt/SHA/profile/tenant binding;
- missing trusted owner-approval verifier or single-use capability consumer;
- approval binding mismatch;
- replayed capability;
- paid/unknown/unallowlisted cost class and forbidden provider route;
- missing or unverified free-quota domain evidence;
- any request that attempts to set `dispatchEnabled=true`.

A successful test decision is queue-only and still returns `dispatch:false`.

**Important limitation:** test authorities are injected mocks. This module is not wired into the Supervisor, Worker, Hono API, or a durable D1 admission transaction. It does not implement cryptographic signature verification, trusted time, revocation, nonce/replay storage, or actual provider quota verification.

## 4. Architecture and policy invariants

1. Developer Cloud Pool is a separate project from MediaHub OS. Reuse patterns only after explicit review; never merge the two systems into one architecture.
2. A0 is the admission/control authority. A3 is the independent verifier. Do not omit either role.
3. GitHub Issues are intake/audit projection, not a transactional lease/authoritative task ledger.
4. Durable task/attempt state must be authoritative. Worker mutations must be fenced by immutable task ID, attempt ID, target SHA, profile, tenant, current generation and lease owner.
5. Stale workers must not finalize, renew, release, or overwrite a newer attempt.
6. Owner approval must be verifiable, single-use and bound to the exact immutable task tuple.
7. Cost policy is fail-closed. Allowed initial classes: `free_quota` and `local`. Paid, unknown or unverified routes are denied/queued, never silently substituted.
8. No quota evasion through account/key rotation.
9. Claude route, if evaluated, is Free Claude Code only; no Anthropic API key/API/billing.
10. OpenAI API remains deferred until separate explicit approval.
11. Ollama/Llama is local-only. Do not infer a production local model profile until hardware and resource measurements exist.
12. Secrets stay in GitHub Secrets or qualified credential references. Never fetch, display, log or place secret values in source/docs/matrices.
13. GitHub-hosted runners are ephemeral and account-wide constrained. Observed runner samples are not reserved capacity.
14. No production dispatch, provider calls, paid fallback, external server, deployment or merge without a separate explicit authorization.
15. Do not use account rotation, access-control bypass, CAPTCHA bypass or site restriction circumvention.

## 5. Next engineering task — authoritative A0 admission boundary

Continue from PR #67's actual D1 schema and A0 contract; do not create a parallel ledger.

### Required sequence

1. Re-fetch PR #67 and #68, exact heads and exact-head workflow runs.
2. Inspect all D1 migrations and APIs on the current PR #67 head. Confirm the exact transaction primitives available; do not assume the local proof is already an integrated admission path.
3. Design the A0 admission transaction that binds:
   - authenticated owner/tenant;
   - single-use approval ID/capability;
   - immutable task ID and attempt ID;
   - repository/issue identity;
   - target SHA and allowlisted profile;
   - cost class, provider route and quota-domain evidence;
   - current task/attempt generation.
4. Prove negative cases first: invalid/missing approval, replay, binding mismatch, stale generation, exhausted retry budget, unknown/paid cost, missing quota evidence, unavailable ledger, ambiguous transaction result.
5. Make the transaction atomic: no consumed approval without a durable task/attempt and queue intent; no queue intent without a valid consumed approval.
6. Ensure every success path still returns `dispatch:false`. Do not connect to Supervisor/Worker yet.
7. Add deterministic local Workers-runtime tests, run exact-head CI, inspect logs, and read back every changed file.
8. Update this handoff, the decision register and session log; commit each completed engineering pass separately.

### Explicitly out of scope for this gate

- Enabling `POOL_DISPATCH_ENABLED`.
- Running a real Worker or agent.
- Hosted D1 provisioning or live GitHub write integration.
- Provider/model calls, paid APIs or credential setup.
- Production cryptography/issuer integration unless separately designed and qualified.
- Merging either PR or modifying the default branch.

## 6. Canonical documentation map

| Need | Source of truth |
|---|---|
| Resume from any chat | [Master Handoff](MASTER-HANDOFF.md) |
| How to continue and reconcile context | [Continuation Protocol](CONTINUATION-PROTOCOL.md) |
| Non-negotiable architecture decisions | [Architecture Decision Register](../architecture/ARCHITECTURE-DECISION-REGISTER.md) |
| Full architecture and delivery plan | [Unified Cloud Pool + Jarvis Build Plan](../architecture/UNIFIED-CLOUD-POOL-JARVIS-BUILD-PLAN-2026-11-14.md) |
| Component status and evidence | [Qualification Matrix](../qualification/COMPONENT-QUALIFICATION-MATRIX.md) and [JSON matrix](../../config/component-qualification-matrix.json) |
| Delivery order and effort estimate | [Build and Launch Estimate](../qualification/BUILD-AND-LAUNCH-ESTIMATE-2026-11-14.md) |
| D1 local proof implementation | [D1 Proof README](../../proofs/d1-ledger/README.md) |
| Projection integration boundary | [Attempt Outbox → GitHub Projection Contract](../contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md) |
| Historical pass-by-pass evidence | [Session Log](../reports/SESSION-LOG.md) |

## 7. How to resume in a new ChatGPT chat

Start a new chat with:

> Continue the Developer Cloud Pool project. Treat the repository `VlDMlNSh/developer-cloud-pool` as the durable project record. First read `docs/operations/MASTER-HANDOFF.md`, `docs/operations/CONTINUATION-PROTOCOL.md`, `docs/architecture/ARCHITECTURE-DECISION-REGISTER.md`, the qualification matrix and the latest session log. Then verify live GitHub PR #67/#68 heads and exact-head CI before making changes. Continue the next engineering task from the handoff. Do not ask me to repeat project context. Do not merge, change the default branch, enable dispatch, read secrets, use paid APIs, call providers or deploy anything without explicit authorization. Commit each completed pass separately and update the handoff and session log.

A chat's internal memory is helpful but is not the durable source of truth. The repository documents and verified GitHub state are authoritative. This file is a current snapshot, not a substitute for live verification.
