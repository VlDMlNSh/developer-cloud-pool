# Pass 43 — Issue #140 current-base integration map

Date: 2026-11-22
Status: HISTORICAL CANDIDATES RECONCILED; CURRENT-BASE IMPLEMENTATION NOT STARTED

## Immutable target and repository state
- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD observed at start of pass: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- PR #165: OPEN / DRAFT / UNMERGED; head `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`; base is `feat/pass35-authenticated-d1-lease-adapter-2026-11-20`, not the default branch.
- Issue #140 is the active bounded task: one current-base D1 admission + lease proof chain. It explicitly prohibits hosted D1, dispatch, secrets/variables inspection, provider calls, merge and deployment.
- Issue #96 remains the owner-only event control surface and states PLANNED; no controller dispatch is authorized.

## Historical candidate map

| PR | Candidate | Base relationship | Verified scope | Boundary |
|---|---|---|---|---|
| #111 | D1 claim/outbox + attempt/lease proof | Base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; head `687196738782432797bf394f1342cb9df19f478f` | Isolated local Workers/D1 migrations 0001–0006, claim/outbox, immutable attempts, lease fencing; historical exact-head run 43881396386 SUCCESS, 37 tests | No trusted GitHub event, production Supervisor, hosted D1 or dispatch |
| #112 | Owner /next event predicate | Same old base; head `c9a4c0ab2001f01a09632795283071c521e1c99d` | Read-only exact owner/repository/issue/body/ref/SHA checks; 21 adversarial tests; runs 43882090833 and 43882090867 SUCCESS | Deterministic digest is not durable idempotency; event-admission job was SKIPPED in PR run; no D1 write or dispatch |
| #114 | Atomic Issue #96 admission | Old base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; metadata head `ab9461eb84b14fe230918391d5212f19ca25592c` | Separate `proofs/d1-admission` package; source-comment unique key, atomic receipt/approval/task/outbox, replay and ambiguous-write readback; runs 43935827714 and 43935827741 SUCCESS on metadata SHA | Local synthetic Workers/D1 only; no trusted live workflow integration, no hosted D1, no lease/executor qualification |
| #125 | GitHub Actions context → D1 adapter | Stacked on #114, not default branch; head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973` | Derives target/controller SHA and run identity from Actions context and composes with D1 adapter; run 44265881516 SUCCESS | Synthetic context fixtures; no live webhook, hosted D1, lease/fencing integration or dispatch |
| #165 | Issuer-bound attempt reconciliation | Stacked on PR #35 base `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`; head `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0` | Migration 0015 and append-only reconciliation evidence; merge-result D1 run 45032534259 SUCCESS (61 tests), Pool Contract run 45032534262 SUCCESS | Injected verifier/clock, not JOSE production trust; no controller integration or execution authorization |

### Important metadata inconsistency
PR #114 body cites a later head `8e9e2e602ea6f3b069222b6e3c2c2d0b88cd76b5`, while current PR metadata reports `ab9461eb84b14fe230918391d5212f19ca25592c`. The fetched workflow runs are attached to the metadata SHA. Do not treat body-only head claims as current evidence until reconciled.

## Integration decision

Do not merge or stack these PRs as-is. Their bases and schemas overlap but do not form one current-base implementation. PR #111 and #114 both contain admission/claim/outbox lineage; #112 is the event predicate; #125 depends on #114; #165 extends a different, later attempt/lease lineage and is not a replacement for the event-to-D1 chain.

Issue #140's canonical sequence is therefore:
1. Freeze a new immutable default HEAD (the current observed base is `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`).
2. Build a file/migration/schema overlap map from exact PR heads and choose one canonical admission schema/adapter; do not duplicate ledgers or migrations.
3. Port the best read-only event predicate into that current-base proof and bind only trusted Actions context (event, exact Issue #96, owner/repo numeric IDs, workflow ref/SHA, target SHA, run ID/attempt, source comment ID).
4. Integrate one atomic D1 receipt + one-shot approval consumption + logical task + outbox; prove exact replay and ambiguous-write primary readback.
5. Integrate lease acquisition, attempt state transitions and positive fencing generation; stale workers must not mutate state.
6. Remove legacy `dsh-headless-probe` profile from any new canonical executor allowlist; do not add credentials/provider calls. The owner-frozen first executor is Claude Code + ECC + FCC via a separately qualified free route; Gemini is optional.
7. Keep every output `dispatch:false` and `executionAuthorized:false`; local tests only, exact-head CI and no-secret checks.
8. Only after that proof, assess hosted D1/governance/independent review as separate qualification gates.

## Governance / safety recheck
- Issue #1 historical evidence identifies active ruleset #26550182 on `refs/heads/Основной`, requiring PRs but zero approvals and no required status contexts. The issue's latest recorded revalidation was 2026-11-17. A fresh ruleset API read was not available in this pass; current ruleset state is NOT VERIFIED.
- Current `POOL_DISPATCH_ENABLED` variable value was not read; historical value false is not current evidence. Current value: NOT VERIFIED. Do not inspect secret values; no secrets/variables were read.
- Default-branch controller path `.github/workflows/gemini-batch-dispatch-controller.yml` remains NOT FOUND from Pass 42. Historical #112 controller is on an unmerged proof branch and is read-only.
- No production dispatch, hosted D1, provider call, secret read, merge, deployment, or paid resource used.

## Pass 43 result
- Historical controller candidate found and audited.
- PR dependency/base map documented.
- No code, SQL, workflow, package or governance settings changed.
- Current-base integration remains PLANNED / NOT IMPLEMENTED.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Start one clean current-base branch from the then-current `Основной` HEAD and port only the canonical event predicate plus atomic admission adapter after a schema/migration ownership review. Do not cherry-pick stacked candidates wholesale. Then add lease/fencing integration and negative-first tests; keep dispatch false.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
