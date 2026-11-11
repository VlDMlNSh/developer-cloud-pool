# Project continuity and checkpoint operating protocol

- Effective date: 2026-11-11
- Scope: Cloud Development Pool / Contour A. MediaHub OS / Contour B remains deferred until Contour A is formally accepted.
- Status: OPERATING DOCUMENTATION POLICY / ACTIVE FOR PROJECT WORK; does not authorize runtime changes, deployments, provisioning, dispatch, permission changes, secret access, merge or acceptance.
- Canonical repository: https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Purpose and source-of-truth hierarchy

This protocol makes work recoverable across long sessions and separate chats without treating conversational history as durable project state.

Use the following hierarchy:

1. **Live GitHub state** — current refs, commit/tree/blob SHAs, PRs, Issues, workflow runs, reviews, rulesets and available worker evidence. Always re-fetch before acting.
2. **GITHUB-CONTEXT-WINDOW.md** — canonical rolling index and current project state. It records phase, decisions, refs, PR/Issue/CI, governance, worker status, blockers, evidence and next action.
3. **Latest continuation checkpoint** — compact recovery snapshot: immutable refs observed, status, blockers, key artifacts, safe next steps and a copyable resume phrase.
4. **Architecture map and bootstrap** — navigation and instructions for understanding the wider project. These do not override live GitHub state.
5. **Roadmap and accepted contracts/decisions** — intended sequence and normative boundaries. Draft/proposed documents must remain visibly marked as such.
6. **Dated reports and evidence** — detailed records of individual audits, tests, comparisons and decisions.
7. **Conversation history** — useful context only; never the sole source of truth for project state.

If sources conflict, do not silently choose the most convenient value. Prefer live GitHub for current refs/status, preserve the conflicting historical record, document the discrepancy and resolve it in a dated report.

## 2. Mandatory start-of-session recovery

At the beginning of every `/next` and every new chat:

1. Read the current Context Window and the latest checkpoint.
2. Read the bootstrap, canonical architecture map, current checkpoint/roadmap and the contracts relevant to the next task. Resolve missing Contents API listings through tree/blob SHA or raw content; an empty listing is not proof that a file does not exist.
3. Fetch live default branch ref and SHA; relevant working branch refs; open PRs and Issues; exact-head workflow runs; formal reviews and inline review threads; rulesets/governance; and worker/agent availability.
4. Compare each relevant PR head with the current default branch. Never use an old PR SHA as an implementation target without revalidation.
5. Search for mature, maintained GitHub projects that may already solve the next technical requirement. Record exact upstream project, license, maintenance/security posture, tested integration fit, limitations and why reuse is or is not selected. Do not add a dependency solely because a project exists.
6. Select one bounded next action and pin its immutable target SHA, allowed files/scope, forbidden actions and acceptance criteria before implementation.

A missing, empty or inaccessible CI/review/worker result is **NOT VERIFIED**, never success.

## 3. Context Window maintenance

Update `docs/context/GITHUB-CONTEXT-WINDOW.md` after every significant pass. Significant means any of:

- a material audit or verification result;
- a new or changed decision, contract, architecture boundary or blocker;
- a code, test, workflow, permission or infrastructure change;
- a PR/Issue/CI/review/worker state change that affects the next action;
- creation or supersession of a checkpoint;
- a phase transition or acceptance decision.

Each entry must include:
- date and scope;
- immutable default/target/branch/PR head SHAs as observed;
- relevant PR/Issue status and exact-head CI/review evidence;
- changed files and commit/blob SHAs;
- tests actually executed and results;
- mature OSS components examined and reuse decision;
- governance/security impact and prohibited/unperformed actions;
- unresolved blockers and one concrete next step;
- links to the report, checkpoint and canonical architecture map.

Do not rewrite history to make old snapshots appear current. Append a new dated entry and label superseded snapshots.

## 4. Checkpoint lifecycle

Create a new dated checkpoint:
- after a major architecture/security audit or decision;
- after a material integration or qualification milestone;
- when a blocker changes state;
- before a planned pause or handoff to a new chat;
- before or after a phase boundary.

Do not create a checkpoint for every tiny edit. Routine changes belong in the Context Window or the relevant report.

Each checkpoint must contain:
1. a short exact resume phrase;
2. phase and hard scope boundaries;
3. live refs and immutable SHAs observed, with observation time/date;
4. PRs, Issues, exact-head CI, reviews and governance state;
5. key reports, decisions, contracts and their blob SHAs;
6. confirmed findings, tests and limitations;
7. mature OSS candidates and reuse decisions;
8. blockers and explicitly NOT RUN / NOT VERIFIED items;
9. the next bounded action with prerequisites and forbidden actions;
10. canonical links, including the architecture map.

A checkpoint is a dated snapshot, not a lock and not authorization. The first action after resuming is always to re-fetch live GitHub state. If a newer checkpoint exists, use the newest valid checkpoint; preserve older checkpoints as history.

## 5. Resume phrase contract

The resume phrase must tell the next chat to:
- open Context Window and latest checkpoint;
- revalidate live refs, HEADs, PRs, Issues, exact-head CI, governance and workers;
- search mature OSS relevant to the next technical step;
- continue the current contour only;
- respect all safety, free-tier, authority and dispatch boundaries.

The phrase is a navigation aid, not a substitute for reading project records. The new chat must not assume it has inherited tool execution state, local files, browser sessions, credentials, agent jobs or uncommitted work from the previous chat.

## 6. Evidence and status discipline

Use only these project statuses where applicable: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

- `SUCCEEDED` means the operation returned success; it does not imply independent verification.
- `VERIFIED` requires explicit evidence tied to the exact target.
- `QUALIFIED` requires all declared qualification criteria and evidence.
- `ACCEPTED` requires the project's acceptance criteria and published evidence.
- Empty workflow/review results, unavailable worker telemetry or stale evidence remain NOT VERIFIED.
- Distinguish local tests, mocks/Miniflare, hosted integration tests and production evidence.
- Never claim exactly-once external effects when only at-least-once delivery plus reconciliation is proven.
- Record run/job IDs, artifact digests and target SHA whenever available.

## 7. Branch and publication discipline

- Treat the default branch as the canonical accepted baseline.
- Working branches and open PRs are proposals until merged under repository governance.
- Do not force-push or rewrite unrelated/stale PR branches to make them appear current.
- Before a PR update, inspect its base/head, compare counts, changed paths and deletions.
- After every write, read the file back and verify content and blob SHA.
- Never merge based only on a clean diff or a successful local test.
- Do not report a documentation working branch as canonical accepted project state.

## 8. Security, authority and phase gates

This protocol does not weaken existing project controls:
- No secret values, keys or tokens may be read or disclosed.
- Registered credentials are not proof of working identity or entitlement.
- Free-tier use must be verified from account-specific authoritative metadata; no paid fallback.
- Gemini dispatch only through the approved controller after its contract and all gates are verified.
- Claude Code only on the specifically authorized server after fresh host/capability/allowlist verification.
- Technical capability is not authorization. Do not cross issuer/capability boundaries or mix authority domains.
- Hosted qualification resources require all documented prerequisites and explicit authorization.
- Keep dispatch fail-closed while identity, claim, revocation, audit and least-privilege boundaries are unqualified.
- Contour B remains prohibited until Contour A has been formally accepted with published evidence.

## 9. Session closeout

Before ending a substantial work session:

1. Finish or explicitly stop the bounded task; do not leave an implied success.
2. Read back changed files and record final commit/blob SHAs.
3. Record exact tests, CI, reviews and their limitations.
4. Update the Context Window.
5. Create/update a checkpoint when the lifecycle criteria above are met.
6. Provide the user a short copyable resume phrase and links.
7. State factual status, evidence, blockers and next action. Include an owner-action block only when an owner action is genuinely required.

## 10. Current adoption baseline

At adoption on 2026-11-11:
- Contour A is BLOCKED / NOT ACCEPTED.
- Issue #38 is OPEN / NOT QUALIFIED.
- Hosted D1 is NOT RUN.
- Cloudflare Workers Free eligibility is NOT VERIFIED.
- Dispatch remains FAIL-CLOSED.
- Contour B remains DEFERRED.
- The checkpoint dated 2026-11-11 is the current recovery anchor until superseded by a newer checkpoint.

Canonical architecture map:
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
