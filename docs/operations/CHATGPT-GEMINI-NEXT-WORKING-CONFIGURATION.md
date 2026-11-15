# Working configuration: ChatGPT + three Gemini agents on every /next

Date: 2026-11-15
Status: VERIFIED execution path; operational procedure recorded
Scope: MediaHub OS Gemini controller bridge + independent Cloud Development Pool main pass

## Required behavior

For every exact user message `/next`:

1. ChatGPT continues the Cloud Development Pool Contour A main pass independently. Gemini must never block the main pass.
2. ChatGPT first reconciles the newest source events on MediaHub Issue #301 and the corresponding controller/child workflow runs. Reuse an event only when it is demonstrably the current turn's event; never create a second event for the same turn.
3. If no event for the current turn exists, ChatGPT creates exactly one owner-authored issue comment with body exactly `/next` on MediaHub Issue #301 using the authorized GitHub issue-comment action.
4. The trusted `.github/workflows/gemini-batch-dispatch-controller.yml` is the only dispatch entrypoint. ChatGPT must not invoke child workflow_dispatch directly, call Gemini provider APIs, or bypass the controller.
5. Controller readiness/admission must pass. Controller handles HMAC-signed child payloads, unique correlation IDs, target SHA binding, duplicate source-comment detection, child run tracking and artifact evidence.
6. ChatGPT records the controller run ID and exactly three child run IDs; verifies each child authorization job, Gemini execution job and non-expired artifact digest. Distinguish DISPATCHED, RUNNING, SUCCEEDED and VERIFIED.
7. Continue Cloud Pool engineering in parallel. On a later /next, reconcile the previous wave and use its persisted reports before creating the next unique event.

## Three agent roles

- Agent 1 — Engineering: investigate and perform one bounded implementation/evidence task against the immutable target SHA.
- Agent 2 — Independent verification: inspect contracts, test mappings and reproducibility. Do not claim review of Agent 1's concurrent output unless explicitly supplied and checked after completion.
- Agent 3 — Security and provenance: inspect authorization, secret isolation, routing, provenance and fail-closed behavior.

These roles describe the current three existing workflows; do not create replacements without evidence that the current controller is insufficient.

## Trusted controller and admission

- Repository: https://github.com/VlDMlNSh/mediahub-os
- Issue event source: https://github.com/VlDMlNSh/mediahub-os/issues/301
- Controller: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- Child workflows:
  - `.github/workflows/gemini-autonomous-engineering.yml`
  - `.github/workflows/gemini-agent-2.yml`
  - `.github/workflows/gemini-agent-3.yml`
- Admission variable: `MEDIAHUB_GEMINI_BATCH_ENABLED` must be `true`.
- Secret dependencies: `MEDIAHUB_GITHUB_TOKEN`, `MEDIAHUB_DISPATCH_HMAC_KEY`. Never read, print, copy, or modify secret values during ordinary dispatch/reconciliation.
- If admission fails, controller event does not appear, or exact child evidence is missing: report BLOCKED / NOT VERIFIED with the specific evidence. Do not attempt an alternate route or paid fallback.

## Proven operational baseline (2026-11-15)

Four prior source-comment events were verified to dispatch three children each:
- `6898434080 → 43741451816`
- `6898453275 → 43741600025`
- `6898479858 → 43741803725`
- `6898513683 → 43742063927`

Latest reconciled wave 332:
- Source comment: `6899094688`
- Controller run: `43746281426`
- Immutable target SHA: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`
- Agent 1 run: `43746301766`; artifact SHA-256 `d3d7e7d5ea27d1656dbee67b9481554626df8e6704d9a0873f46790e3ce5505f`
- Agent 2 run: `43746303789`; artifact SHA-256 `44971fc923161b1a8d8f0360340412de2825d58cfad5b1a86c1bb053a0f37bab`
- Agent 3 run: `43746305744`; artifact SHA-256 `438906bfc7ce4b737de802b28c3ae27b6d6cd43a18b80c709a9ca293dabeda56`
- Controller admission and dispatch jobs: SUCCESS. Each child had successful authorization and Gemini execution jobs, plus a non-expired `gemini-output` artifact.
- Child correlation IDs:
  - Agent 1: `12bb36e0-d4bd-4704-9354-152647cb9bf4`
  - Agent 2: `a0945539-acef-4914-93bf-c41e49ff6767`
  - Agent 3: `e344fa9c-74ba-4066-a3d6-e5a4305f5644`

## PR / review disposition for wave 332

The three agents created evidence-only Draft PRs:
- Agent 2: https://github.com/VlDMlNSh/mediahub-os/pull/664 — head `750e3944675ef908c7f5e81ade7f591f319cbedf`
- Agent 3: https://github.com/VlDMlNSh/mediahub-os/pull/665 — head `d9be71e1bce02ef94ed4c126bf4cb5ad7fed29c4`
- Agent 1: https://github.com/VlDMlNSh/mediahub-os/pull/666 — head `4f564b93613786bbe8a30aad63cda3b68ab861ef`

All three are OPEN / DRAFT / UNMERGED. Each contains one evidence-only file and has no formal review. Associated workflows ended `action_required` with no jobs exposed, so exact-head CI is NOT VERIFIED. Keep them unmerged pending valid CI, independent review and governance approval.

## Important contour boundary

The Gemini controller is in MediaHub OS. It is a verified event bridge for supplementary Gemini work, not a Cloud Pool-native supervisor/worker and not proof of Contour A acceptance.

Cloud Pool Supervisor and Worker remain separate. Keep `POOL_DISPATCH_ENABLED` fail-closed until Cloud Pool's own identity, authorization, quota, secret-isolation, state, routing and qualification gates are satisfied. Do not conflate MediaHub Gemini runs with Cloud Pool worker runs. Do not begin Contour B.

## Per-turn evidence record

For each /next, record:
- user-turn/event correlation and source comment ID;
- immutable target SHA;
- controller run ID, status, admission job and dispatch job;
- Agent 1/2/3 child run IDs, job IDs, statuses and artifact SHA-256;
- source-event idempotency result;
- any Draft PR/commit/blob SHAs created by agents;
- exact-head CI and independent review state;
- Cloud Pool files/commits/tests changed by ChatGPT;
- blockers, next step, and updated Context Window/checkpoint links.

Canonical detailed evidence: [Wave 332 execution report](../reports/2026-11-15-next-wave-332-three-agent-execution.md).
Canonical Context Window: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md).
Cloud Pool Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
