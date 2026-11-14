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

## Freshness and provenance discrepancies to resolve

- The fetched PR #67 payload reports head SHA `72422d086f4fb2bed361ae7449f13a8082732075`, while its embedded PR description names `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d` as the current head. The component matrix separately cites `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`. These are inconsistent identifiers in the returned evidence and must be reconciled against the live PR head and exact-head Actions runs before using any of them as the canonical proof SHA.
- The matrix says PR #67 has 69 primary tests; the conversation checkpoint reported 70/70 in a later pass. Do not treat either count as current until the exact head and workflow logs are read back.
- The latest-commit search returned the default-branch checkpoint SHA above, but not the expected recent continuation commits from the conversation transcript. The transcript's commit claims therefore need live verification before being used as the new baseline.
- PR #67 and PR #68 are draft/unmerged according to the recorded matrix and PR #67 metadata. No merge is authorized by this audit.

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

