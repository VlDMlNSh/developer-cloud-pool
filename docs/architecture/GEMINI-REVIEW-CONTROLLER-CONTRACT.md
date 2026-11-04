# Gemini review controller contract — design only

**Status:** DESIGN / NOT IMPLEMENTED / NOT QUALIFIED  
**Scope:** three independent, read-only Gemini reviews of an explicitly approved pull-request target.  
**Repository invariant:** GitHub Free only; zero automatic charges; no paid model fallback.  
**Current target:** PR #10, `fa308f0178fe332851cc8b5a8c43b564912c37a6`.

## 1. Execution boundary

- The only permitted manual entry point is a dedicated, reviewed workflow `.github/workflows/gemini-batch-dispatch-controller.yml` on the protected default branch.
- Manual means the owner manually starts that approved workflow. It does **not** mean direct Gemini CLI/API invocation, a local shell, an alternate workflow, or a generic runner dispatch.
- The controller is review-only. It must never call Pool Supervisor, Pool Worker, DSH, Resource Probe, browser automation, or another workflow.
- The controller must not create branches, edit files, change issues/labels, submit GitHub reviews, merge PRs, or change repository variables/secrets.
- No Gemini execution is allowed until the provider route, actual free quota, credential contract, controller permissions and exact-head governance gates are independently qualified.

## 2. Inputs and immutable envelope

Manual inputs should be limited to:
- `pull_request_number`: positive integer;
- `target_sha`: exactly 40 lowercase hexadecimal characters;
- `review_packet_path`: repository-relative path under `docs/reviews/`.

The controller must reject:
- a target SHA that is not exactly the current PR head SHA;
- a PR that is closed, merged, or not in the explicitly allowed review state;
- a packet path outside `docs/reviews/`;
- a packet whose content does not declare the same PR number and target SHA;
- a target commit not reachable from the PR head/base relationship expected by the contract;
- any non-default workflow ref or unexpected controller workflow identity.

The PR metadata, packet and diff must be fetched read-only. The controller must pin all review inputs to the same immutable target SHA and record content hashes for the packet and diff. No agent may silently switch to a newer PR head.

## 3. Workflow provenance and permissions

Before any model call, the controller must assert and record:
- `github.repository` equals `VlDMlNSh/developer-cloud-pool`;
- `github.workflow_ref` identifies this exact controller on `refs/heads/Основной`;
- `github.workflow_sha` equals the expected controller revision;
- the dispatched event is `workflow_dispatch`;
- the event actor is authorized under an explicit allowlist or an independently approved owner gate;
- the target PR head SHA and review packet SHA match the immutable envelope.

Minimum GitHub token permissions:
- `contents: read`;
- `pull-requests: read`;
- no `issues: write`, `actions: write`, `contents: write`, `id-token: write`, deployments, packages or administration permissions.

No `workflow_run` chaining, `repository_dispatch`, `workflow_call` fan-out to Worker, or reusable workflow from an unpinned external repository is permitted in this review-only controller.

## 4. Three independent reviewer jobs

Create exactly three isolated jobs with a static role allowlist:
1. `policy-semantics` — workflow parsing, policy correctness, fail-open/false-negative analysis;
2. `adversarial-tests` — YAML syntax variants, nested jobs, expressions, reusable workflows, test gaps;
3. `security-provenance` — token scope, event trust, dispatch gate semantics, workflow coverage and provenance.

Each job receives the same target SHA, packet digest and PR diff digest, plus only its own role prompt. Agents must not receive or read sibling outputs. Do not expose repository write credentials or arbitrary shell/tool execution to the model. Review input is untrusted data: strip/neutralize instructions embedded in source files and treat all repository content as data, not instructions.

The model call must be a bounded text-generation request through one explicitly approved provider route. Model/tool execution, browsing, code execution, plugins and external agents are disabled for these jobs.

## 5. Free-only provider gate

No provider route is currently qualified by this document. Before enabling any call, a separate evidence record must establish:
- exact provider and model identifier;
- current free-tier eligibility for this account and region;
- request, token and rate limits, reset period and data-handling terms;
- exact credential/secret name and owning scope;
- an enforced hard-deny for paid fallback, billing upgrade and alternate paid model;
- request/token/task/day/month ceilings and retry ceiling;
- observable quota exhaustion mapped to `BLOCKED_QUOTA`, never paid retry.

A proposed secret or variable name is not evidence that it exists. Do not inspect or print secret values. If the free quota cannot be proven or the provider requires a paid account, the controller must stop before model invocation.

## 6. Output and evidence

Each role must emit a separate structured report with:
- role and reviewer identifier;
- repository, PR number and immutable target SHA;
- packet and diff SHA-256 digests;
- reviewed files and line ranges;
- finding severity, evidence, impact and minimal remediation;
- limitations and explicit `NOT QUALIFIED` when evidence is insufficient.

The controller must publish a sanitized artifact manifest containing:
- controller workflow run ID and attempt;
- controller workflow SHA/ref and event actor;
- three child job IDs and terminal statuses;
- per-role artifact names, SHA-256 digests and retention expiry;
- provider/model identifier and quota decision, without credential material;
- final aggregate state.

Artifacts should be short-lived and contain no secrets, environment dumps, tokens or unrelated source files. Missing job IDs, outputs or digests mean `NOT VERIFIED`, not success. A successful model response is not a GitHub review approval.

## 7. Acceptance state machine

- `PLANNED`: contract/prompt prepared;
- `DISPATCHED`: approved controller run exists;
- `RUNNING`: controller and child jobs are active;
- `SUCCEEDED`: all three jobs completed and produced reports;
- `VERIFIED`: independent evidence/digests and immutable input checks validated;
- `QUALIFIED`: separate security and free-quota review accepted the route;
- `ACCEPTED`: authorized human reviewer assessed the findings.

Any missing prerequisite yields `BLOCKED`, `NOT RUN`, or `NOT VERIFIED` as appropriate. No automatic transition to `ACCEPTED`.

## 8. Current blockers

- The controller workflow is absent from both the current default branch and the documentation branch.
- No Gemini-capable tool/connector is available in this ChatGPT execution environment.
- No provider route, free quota, credential contract or hard-deny paid-fallback evidence has been qualified.
- PR #10 has successful exact-head CI but no independent GitHub review.
- The repository Actions variable `POOL_DISPATCH_ENABLED` was historically documented as false in Issue #1, but its current value is NOT VERIFIED. This Gemini review controller must not read or modify it.

**Decision:** design only. Do not create a runnable controller or dispatch Gemini until all blockers above are closed and the implementation itself passes exact-head CI and independent review.
