# Parallel Chat and Background-Agent Operating Model

- Date: 2026-11-11
- Scope: Contour A / Cloud Development Pool only.
- Documentation target branch: docs/issue38-free-claim-backend-fit-2026-11-11
- Immutable Cloud Pool default baseline observed: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Documentation branch baseline before this pass: `e92139a24e5ef243272cbf2f6d2be5db4cea35ff`.
- MediaHub OS controller target observed: `main` at `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Approved Gemini controller blob observed: `0a1246f6755020faf8b7e48d07bfff790bbaece3`.

## 1. Operating decision — two concurrent work lanes

Background agent execution is additive capacity. It does not suspend, replace, or cancel work in the active ChatGPT project session.

**Lane A — interactive project work (this chat):** continue one bounded, non-overlapping task per `/next`: live-state reconciliation, source/contract review, mature-component research, integration analysis, documentation, read-back verification and next-step planning. Do not wait for background agents unless the next operation depends on their exact output.

**Lane B — background execution (approved GitHub workflows):** dispatch bounded agent tasks through the approved controller. After dispatch, workflows run asynchronously on GitHub Actions; this chat may continue independent work while they run. Collect run/job/artifact IDs and reconcile their outputs later.

Neither lane is allowed to silently overwrite the other's work. Each task must declare immutable target SHA, scope, owned paths, forbidden actions, evidence requirements and acceptance criteria. Assign disjoint scopes where possible. If both lanes need the same file or code area, one lane performs read-only analysis until ownership is resolved.

The chat is active while a conversation turn is being worked; this record does not claim that ChatGPT executes continuously between user turns. GitHub workflows, once dispatched, can continue independently of the chat turn.

## 2. Current controller contract and dispatch limitation

Live source inspection confirms the approved controller supports:
- `workflow_dispatch` modes `probe`, `agents`, and `review`.
- `agents` dispatches exactly three fixed child workflows: Agent 1 bounded implementation, Agent 2 contract/test verification, Agent 3 security/provenance audit.
- `review` is a fixed read-only FCC review task pinned to a historical immutable SHA.
- Issue #301 accepts only an owner `/next` comment; the controller itself constructs the three fixed task prompts.
- Controller concurrency group serializes controller batches; child workflows are separately dispatched and monitored.

The controller does **not** accept a caller-defined task queue or arbitrary per-agent task payload from this chat. Therefore a fresh `/next` comment would relaunch the same generic three-role pattern, not the separately researched tasks proposed in this pass. Repeating it against unchanged target SHA risks duplicate work. No new batch was dispatched in this pass.

Do not bypass the controller, add ad-hoc credentials, or manually invoke child workflows. To make background agents useful as continuously additive capacity, first design and review a versioned task-admission interface: bounded task IDs, target SHA, allowed paths, role/capability, owner, expiry, conflict key, no-secret rule, no-nested-dispatch rule, evidence schema and cancellation semantics. The existing fixed three-role controller remains the only authorized route until that change is reviewed and accepted.

## 3. Mature component research — reuse candidates, not adoption decisions

| Component | Mature upstream | Relevant capability | Fit and limitations | Disposition |
|---|---|---|---|---|
| Temporal | https://github.com/temporalio/temporal | Durable workflow execution, task queues, worker polling, replay/recovery | Strong architectural reference for separating client/control plane, durable orchestrator and independent workers. Self-hosting brings service/database/operations requirements; not a drop-in free GitHub Actions feature. | STUDY / NOT ADOPTED |
| NATS JetStream | https://github.com/nats-io/nats-server | Persisted/replayable messages, consumers, KV/object store | Potential durable task/event transport if a permitted always-available service exists. Requires hosting, access controls, retention, backup and operations; GitHub Actions alone does not provide a NATS server. | STUDY / NOT ADOPTED |
| OpenFGA | https://github.com/openfga/openfga | Fine-grained relationship-based authorization | Useful candidate for future capability/resource authorization. It is not a workload identity issuer, quota engine, task scheduler or provider router. | STUDY / NOT ADOPTED |
| SPIFFE / SPIRE | https://github.com/spiffe/spire and https://github.com/spiffe/spiffe | Workload identity standard and implementation | Relevant if heterogeneous persistent workers need cryptographic workload identity. SPIFFE Workload Endpoint is specified as a stable standard; local endpoint exposure and host trust are security-sensitive. Adds infrastructure not currently justified for the ephemeral three-child flow. | STUDY / NOT ADOPTED |

Current low-complexity baseline remains GitHub Actions + the approved signed controller + exact run/job/artifact evidence. Evaluate mature components against the actual free-only hosting and operational budget before introducing any new service. Do not adopt all four as a stack.

## 4. Parallel execution rules

1. A background agent run never means the interactive lane is paused.
2. A running agent never grants permission to duplicate its task or write its owned paths.
3. The chat lane should use the waiting interval for independent work: source audits, upstream evaluation, documentation, test design and non-overlapping integration preparation.
4. Agent outputs remain proposals until exact-head CI, review, provenance and acceptance checks pass.
5. A completed child workflow is SUCCEEDED, not automatically VERIFIED or QUALIFIED.
6. If a task cannot be assigned through the current controller contract, record it as PLANNED/BLOCKED rather than inventing an alternate dispatch path.
7. No paid fallback, secret inspection, cross-authority access, merge, deployment or Contour B work is implied by this operating model.

## 5. Evidence observed in this pass

- Previous Wave 317 controller run `43029067368`: completed SUCCESS.
- Gemini Agent 1 run `43029095783`, Agent 2 run `43029098931`, Agent 3 run `43029101957`: all completed SUCCESS against target `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Their outputs are PRs #637, #636 and #635 respectively. Each remains OPEN; exact-head CI returned `action_required`; formal review lists were empty at last inspection. These are not qualified deliverables.
- The latest workflow listing shows those four Wave 317 runs completed; no evidence in this pass of an active child run from that wave.
- Cloud Pool default branch remains `Основной` at `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Cloud Pool working documentation branch HEAD before this pass: `e92139a24e5ef243272cbf2f6d2be5db4cea35ff`.
- Cloud Pool PR #64 remains OPEN; Issue #38 remains OPEN. Hosted D1 qualification and pool runtime remain unverified/not launched.

## 6. Next bounded step

Continue the interactive lane with a source-bound review of the controller's admission and role contracts, while separately preparing a proposal for a task queue that can admit disjoint agent assignments. Do not dispatch another generic batch until its target/scope is demonstrably non-duplicative or the task-admission contract has been reviewed. Keep the current three-agent controller as the only authorized dispatch mechanism.

## 7. Status

- Parallel operating principle: RECORDED as project policy on this documentation branch.
- Chat lane: ACTIVE for each `/next` turn; not suspended by agent execution.
- Wave 317 agents: SUCCEEDED; PR evidence not qualified.
- Custom background task admission: NOT IMPLEMENTED / NOT VERIFIED.
- New dispatch this pass: NOT RUN (fixed controller has no caller-defined task payload; duplicate batch avoided).
- Cloud Development Pool runtime: NOT LAUNCHED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Upstream references

- Temporal architecture and client/server/worker separation: https://github.com/temporalio/documentation/blob/main/docs/encyclopedia/architecture/how-temporal-works.mdx
- Temporal workflow durability and worker/task-queue model: https://github.com/temporalio/documentation/blob/main/docs/evaluate/understanding-temporal.mdx
- NATS JetStream persistence and replay: https://github.com/nats-io/nats.docs/blob/master/nats-concepts/jetstream/README.md
- OpenFGA authorization engine: https://github.com/openfga/openfga
- SPIFFE Workload Endpoint standard (marked Stable): https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE_Workload_Endpoint.md