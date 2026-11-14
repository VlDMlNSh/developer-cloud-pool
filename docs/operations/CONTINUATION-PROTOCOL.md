# Continuation Protocol — Developer Cloud Pool

Purpose: Make every new ChatGPT chat capable of continuing the project safely and accurately.

## 1. Authority order

When information conflicts, use this order:

1. Live GitHub metadata for current branch, PR head, merge state and CI.
2. Current source code, migrations, tests and workflow definitions at the exact verified commit.
3. docs/operations/MASTER-HANDOFF.md for the current project snapshot and next task.
4. docs/architecture/ARCHITECTURE-DECISION-REGISTER.md for binding decisions and constraints.
5. Qualification matrix and JSON matrix for component status.
6. docs/reports/SESSION-LOG.md and dated reports for history and evidence.
7. Chat history and assistant memory only as navigation hints, never as stronger evidence than the repository.

Never treat a stale SHA, old CI run, PR description, remembered status, or old chat answer as current without verification.

## 2. Mandatory startup sequence

1. Read this protocol and the Master Handoff.
2. Read the architecture decision register.
3. Read the latest session-log entries and relevant dated report.
4. Fetch live PR #67 and #68 metadata. Record exact head SHA, base SHA, branch, state and draft/merged status.
5. Fetch workflow runs for each exact PR head. If a run is active, poll its jobs until completion when practical; inspect logs for test counts and failures.
6. Fetch exact source files and migrations relevant to the next task. Do not implement from a summary when source can be inspected.
7. Identify the smallest useful next engineering pass. Do not ask the owner to restate context already in these documents.

If a PR head differs from the handoff, live GitHub wins. Update the handoff only after understanding and verifying the difference.

## 3. Engineering pass lifecycle

For each /next:

1. State the concrete engineering objective.
2. Inspect existing implementation and tests before adding code.
3. Preserve project boundaries and all decision-register constraints.
4. Prefer mature, maintained, license-compatible components over custom reinvention.
5. Make the smallest coherent change on an existing authorized working branch or a new non-default branch.
6. Add negative-first tests for security, concurrency, failure and recovery boundaries.
7. Run relevant local checks and exact-head CI.
8. Inspect test logs; distinguish unit tests, local runtime proofs, hosted tests and production qualification.
9. Read back each changed file from GitHub and verify final commit/PR head.
10. Commit each completed pass separately. Never claim a commit, test, deployment or qualification without tool-confirmed evidence.
11. Update the Master Handoff, session log, decision register and qualification matrix when their contents changed.
12. Report what changed, commit SHA, exact CI result, limitations and next task.

A pass is not complete merely because code was written or a workflow was queued.

## 4. Safety and authorization gates

Unless the owner explicitly authorizes a specific action in the current context:

- Never merge a PR or change the default branch.
- Never set POOL_DISPATCH_ENABLED=true, dispatch a worker or run an agent.
- Never deploy or provision hosted D1/Cloudflare resources.
- Never invoke provider/model APIs or paid services.
- Never access, print, copy or persist secret values.
- Never use paid fallback when a free quota is exhausted.
- Never evade quotas by rotating accounts or keys.
- Never treat a local test adapter as a production authority.
- Never access external servers or future hardware merely because it appears in a plan.

A successful local proof does not authorize a live write or production rollout.

## 5. Evidence labels

- DESIGN — proposed architecture only.
- IMPLEMENTED — source exists; tests may or may not have run.
- LOCAL TESTED — test passed in local/unit or local Workers-runtime environment.
- HOSTED TESTED — test passed in a real hosted environment with scope documented.
- QUALIFIED — explicit acceptance criteria, security review and operational evidence passed.
- DEPLOYED — deployed to a named environment, verified by read-back.
- PRODUCTION — approved operational use with monitoring, rollback and ownership.

Do not promote status based on a green but unrelated workflow. Every claim must name its evidence boundary.

## 6. Document maintenance rules

- Master Handoff: update every meaningful pass; keep exact current PR heads and next action.
- Session Log: append-only chronological record. Do not rewrite old entries to make history look cleaner.
- Decision Register: add or amend decisions only when an explicit architecture/policy decision is made; record status and rationale.
- Qualification Matrix: update component status only with evidence and explicit limits.
- Dated reports: preserve point-in-time snapshots; create a new report rather than silently rewriting a historical audit.
- README: keep navigation and safety instructions aligned with current state.
- Never store credentials, tokens, private identifiers or secret values in any project document.

## 7. Standard prompt for a new chat

Continue Developer Cloud Pool using the repository as the durable source of truth. Read the Master Handoff, Continuation Protocol, Architecture Decision Register, qualification matrix and session log. Verify live PR heads and exact-head CI before proceeding. Continue the next task from the handoff without asking me to repeat known context. Respect every authorization gate. Make a real, bounded engineering change, test it, inspect logs, read back files, commit the pass separately, and update the handoff and session log. Do not merge, enable dispatch, access secrets, call paid/provider APIs or deploy without explicit approval.
