# Cloud Pool continuation audit — 2026-11-14

## Scope

Read-only continuation audit of `VlDMlNSh/developer-cloud-pool` after the 2026-11-14 checkpoint. No secrets, provider credentials, billing settings, hosted resources, deployments, merges, or dispatch controls were accessed or changed.

## Repository baseline

- Default branch: `Основной`.
- Default-branch SHA returned by the recent-commit listing: `221f216c00ca7e5596bcc682ba185ad155a10603` (2026-11-11).
- Repository is public; linked GitHub permissions report push/admin.
- Working documentation branch: `docs/unified-cloud-pool-jarvis-plan-2026-11-14`.
- Component matrix snapshot: 2026-11-14, 29 records, `dispatch_enabled=false`, `secret_values_stored=false`.

## Confirmed architecture/evidence boundary

1. The component matrix explicitly describes itself as a decision/evidence register, not an installation manifest.
2. Runner evidence consists of two read-only GitHub-hosted observations, each Ubuntu 24.04.5 x64, 4 logical CPUs and 15 GiB RAM. Available workspace was 88.46 GiB (AWS us-east-1) and 85.26 GiB (Azure northcentralus). These observations do not qualify stable capacity, same-image repeatability, agent packing, or concurrent multi-agent throughput.
3. The matrix records the Pool Supervisor as a scaffold not run on the PR head; the Issues queue is not transactionally qualified; and the only selected worker profile is a no-model probe.
4. Gemini CLI, Claude Code and Codex remain conditional candidates, not pool-qualified executors. Claude Code must use the approved Free Claude Code route only; Anthropic API is denied. Paid provider APIs and paid fallback are denied for initial launch. OpenAI remains deferred pending explicit owner approval. Local Ollama/Llama is a separate route requiring hardware/runner qualification.
5. The quota/placement implementation in PR #29 is local policy code, not dispatch-integrated. The 24 provider slots have zero verified account identities and zero verified quota domains in the matrix evidence.
6. PR #25 is a Jarvis prototype, not deployed production UI/auth. Tenant isolation and independent A3 remain unimplemented/unaccepted.
7. PR #67's own description limits its evidence to local Workers-runtime D1 tests. It explicitly excludes hosted D1, live GitHub writes, production Worker, provider/model calls, deployment, dispatch and independent review. Its durable comment POST gate is at-most-once: an ambiguous result can remain indeterminate and require manual resolution. This is safer than automatic duplicate POST, but it is not a live GitHub consistency proof.

## Freshness and provenance reconciliation

- **Resolved current head:** live PR metadata identifies PR #67 head `72422d086f4fb2bed361ae7449f13a8082732075`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`, 41 commits / 38 changed files. Its description still contains the older `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`, and the component matrix contains the older `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`; both are stale references, not the live PR head.
- **Exact-head CI:** PR #67 current head has Isolated D1 Ledger Proof run `43599588883` SUCCESS and Pool Contract Validation run `43599588858` SUCCESS. The D1 job log reports **5 test files and 69 tests passed**. This resolves the 69-versus-70 discrepancy for the current head: 69 is the confirmed count in the current run. The workflow includes local Workers-runtime D1 tests and isolated schema/upgrade checks; it is not hosted D1 qualification.
- **PR #68 exact head:** live PR metadata identifies head `9f48f7596051299213eb159576861a06fdff47e2`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`, 28 commits / 9 changed files, still OPEN/DRAFT/UNMERGED. Exact-head Runner Resource Probe run `43599766131` and Pool Contract Validation run `43599766149` both completed SUCCESS. The runner probe job completed its read-only host inventory step.
- Both PRs remain draft/unmerged. CI success is not acceptance or authorization to merge, deploy, or dispatch.

## Decision

**No live agent launch is justified by the available evidence.** The safe next milestone is a reproducible, secret-free runner/worker qualification on one immutable branch/head, followed by a negative-first A0 admission harness. Do not enable `POOL_DISPATCH_ENABLED`.

## Next bounded work sequence

1. Re-read PR #67 and #68 metadata, exact head refs, changed files, reviews, and exact-head Actions runs; resolve the SHA/test-count drift above.
2. Reconcile PR #29 quota primitives, PR #37 worker boundary, PR #39/#54 task identity, PR #53 finalizer, and PR #58/#59/#67 projection stack into one file-by-file integration manifest against `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`. Do not transplant partial functions without migrations, lockfiles, tests and workflow filters.
3. Add negative tests for A0: unknown cost class, paid route, Anthropic route, OpenAI before approval, exhausted free quota, missing quota-domain evidence, missing immutable target SHA, stale lease, replay, and dispatch-disabled state must all deny or queue.
4. Qualify only no-secret/no-provider runner installation and resource measurements. Do not call model APIs during this stage.
5. Keep provider profiles BLOCKED until official free-route availability, terms, account entitlement, quota domain, and safe auth are independently evidenced.
6. Keep tenant isolation, issuer/trusted time/revocation, hosted D1, A3 and Jarvis production auth as explicit acceptance gates.

## Safety invariants

- `POOL_DISPATCH_ENABLED=false`.
- No paid API, no paid fallback, no Anthropic API, no account/key rotation to evade quotas.
- Free Claude Code only; Ollama/Llama local; external providers only through official free quotas.
- OpenAI deferred.
- No secrets read, printed, copied into matrix, or passed to untrusted PR workflows.
- No production or external servers; no hosted resource creation; no merge or deployment.
- Every completed engineering pass must end with a dedicated Git commit and exact-head verification.


## A0 / Supervisor and Worker code-path audit — 2026-11-14

This section is a static source review of the current default-branch files, not a runtime execution test.

### Positive controls observed

- scripts/pool-supervisor.mjs exits before any label/API mutation when POOL_DISPATCH_ENABLED is not the literal string true (lines 9–15).
- The Supervisor accepts only a 40-character lowercase hexadecimal target SHA and the single profile DSH headless probe (lines 152–171).
- .github/workflows/pool-worker.yml validates the issue is open, checks pool:claimed, matches the immutable target SHA to the issue envelope, and restricts the worker profile to dsh-headless-probe.
- Worker validation, probe and report are separated into jobs with narrow permissions. The probe job receives read-only contents permission and no provider credentials; the report job receives issue-write permission only after validation succeeds.

### Blocking A0 recovery/authority gaps

1. **Issue labels are not a transactional lease.** The Supervisor changes labels by reading the issue and PATCHing the complete label list. This is not a compare-and-swap claim, has no lease owner or generation token, and cannot provide a durable fenced lock.
2. **No bounded retry counter on stale no-run recovery.** At 15 minutes without a matching worker run, a claimed issue is returned to pool:ready. There is no persisted attempt counter, maximum-attempt enforcement, exponential backoff or dead-letter state in this path. Repeated missing-run conditions can therefore re-admit the same task indefinitely.
3. **Run matching is heuristic.** Stale recovery matches a workflow by display title containing the issue number and by creation time relative to issue.updated_at. It does not bind the run to an immutable task-attempt ID, claim generation or exact target SHA.
4. **Worker report is not fenced to the attempt.** The report job reads the current issue and replaces managed labels with a terminal label. It does not condition the update on the current claim generation, worker run ID, attempt ID or still-current target SHA. A delayed report from an older run could overwrite a newer task state.
5. **Approval provenance is not self-authenticating in this code path.** The Supervisor checks the pool:ready label and issue-body fields. The Worker checks pool:claimed and the same envelope. These checks do not themselves validate a single-use owner approval marker cryptographically bound to the issue, immutable SHA and allowlisted profile. Any such authority must be proven by a separate trusted boundary before dispatch is enabled.

### Required design correction

Do not try to turn GitHub Issue labels into a transactional queue. Keep Issues as an intake/audit surface, but make the durable task ledger authoritative for admission, claim, attempt generation, lease expiry, retry budget, finalization and recovery. The Worker must present a single-use capability bound to task_id + attempt_id + target_sha + profile + tenant; all state transitions must be conditional on the current generation and lease owner. A stale actor must be unable to finalize or release a newer attempt.

### Next engineering gate

Build a negative-first, no-dispatch A0 admission/recovery harness against the durable task-ledger contracts. At minimum prove: retry budget exhausted → terminal/dead-letter; expired lease → fenced recovery; stale attempt finalizer → rejected; replayed capability → rejected; missing/invalid approval provenance → rejected; paid/unknown cost class or unverified quota domain → queued/denied; and dispatch-disabled → no worker workflow dispatch. Do not set POOL_DISPATCH_ENABLED=true to run these tests.
