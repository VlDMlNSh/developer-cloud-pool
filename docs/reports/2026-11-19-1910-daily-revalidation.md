# Cloud Development Pool — daily audit — 2026-11-19 19:10 Europe/Vilnius

## Disposition

- GitHub audit: **SUCCEEDED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.
- Scope: read-only GitHub, exact-head CI, PR/review, ruleset, source-contract and connected infrastructure inventory; one bounded source-level audit of PR #146 adapter outputs. Documentation-only publication follows on the existing working docs branch.
- No source, schema, workflow, runtime, security-boundary, infrastructure or production changes were made. No tests were run locally. Existing GitHub Actions runs were only read; none were initiated by this pass.

## 1. Repository baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Immutable default HEAD: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
- Parent: `68183828cf7934e89109310c8f99281be4eb7ed8`
- Tree: `c8c78a26a6359ec868922e4040c2870eec873b66`
- Commit signature: **verified / valid**.
- Open Issues: **14**.
- Open PRs: **107** (100 on page 1, 7 on page 2).
- Repository remains public and not archived.

The implementation target branch `integration/d1-current-base-2026-11-19` still compares identical to default: 0 ahead / 0 behind, same HEAD/tree. It is a frozen target, not an implementation. Default has neither `proofs/d1-ledger/` nor `proofs/d1-admission/`; both checked README paths return 404.

## 2. Material default-branch change — legacy DSH dispatch retired

PR [#139](https://github.com/VlDMlNSh/developer-cloud-pool/pull/139) was merged at 2026-11-19 09:29:03 UTC, producing current default HEAD `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

- Exact-head Pool Contract Validation run [44349941243](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44349941243): SUCCESS.
- Formal reviews: 0; inline review threads: 0.
- This merge is recorded as an observed repository event, not an action performed by this audit. The absence of review and the ruleset's zero-approval setting remain a governance concern.

Current default source read-back:

- `.github/workflows/pool-supervisor.yml`, blob `3942189fc338b73b39627706ea001e1b87dc0ed8`: scheduled heartbeat only; no `workflow_dispatch`, `issues`, or `workflow_run` trigger; `contents: read` only; checkout does not persist credentials.
- `scripts/pool-supervisor.mjs`, blob `2ae99f9efe1f59b22cfac1f5bf4780148228a233`: no GitHub API client or dispatch path; if `POOL_DISPATCH_ENABLED === "true"`, it exits fail-closed; otherwise it emits a heartbeat-only message.
- `.github/workflows/pool-worker.yml`, blob `6833692c45bbb0b6f7bf31c068a30888c53f5471`: the manual `workflow_dispatch` trigger remains, but the workflow has `permissions: {}` and only an immediate retirement failure; no DSH task is accepted or executed.
- `.github/workflows/pool-contract-validation.yml`, blob `d6a4e62c1521d09df7835a8a1b918dc83e079504`.

Current default exact-head runs:

- [Pool Contract Validation 44496825995](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44496825995): COMPLETED / SUCCESS on `b81d2b5...`; all returned job steps succeeded.
- [Pool Supervisor retired heartbeat 44559878913](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44559878913): COMPLETED / SUCCESS on the same exact HEAD; all returned job steps succeeded.
- The returned current-default Actions run collection contained 89 runs and no Worker-named run. This is evidence only for the returned collection, not proof that no historical Worker run ever existed.

The repository variable `POOL_DISPATCH_ENABLED` remains **NOT VERIFIED**. The available GitHub read endpoint did not permit the variable request. No variable or secret was changed or read through another route.

## 3. Governance

Active repository Ruleset [#26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182):

- Enforcement: active; exact selector `refs/heads/Основной`.
- Pull request required.
- Deletion and non-fast-forward prohibited.
- Review-thread resolution required.
- Required approvals: **0**.
- CODEOWNERS review: disabled.
- Extra approval for unattributed changes: disabled.
- Required status checks: none configured in this ruleset.
- Bypass actors: none; current-user bypass: never.

The branch object reports `protected=false`; the classic branch-protection endpoint returns 403 to this integration. These facts are distinct from the active ruleset and do not establish classic branch protection.

**Governance remains BLOCKED:** the active ruleset does not require an independent approval. PR #139's merge with zero reviews makes this gap concrete. No ruleset or branch-protection changes were attempted.

## 4. Current D1/CODE candidate and new output-contract finding

### PR #146 — CODE capability profile

[PR #146](https://github.com/VlDMlNSh/developer-cloud-pool/pull/146):

- OPEN / DRAFT / UNMERGED.
- HEAD `9d32c4943ae87f5855ab05d42a4ba12d1c205211`; base is current default `b81d2b5...`.
- 84 ahead / 0 behind; 47 changed files.
- Exact-head Pool Contract Validation [44522152749](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44522152749): SUCCESS; all returned steps succeeded.
- Exact-head Isolated D1 Ledger Proof [44522152799](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44522152799): SUCCESS; all returned steps succeeded.
- Formal reviews: 0; inline threads: 0.

The owner-confirmed profile ID is `jarvis-code-sandbox-v1`, distinct from executor instance ID `claude-code-1`. Contract blob `21b04b125349441f6296696a4f780d44c33ef896` explicitly marks the profile **PROPOSED / NOT QUALIFIED / NOT ENABLED**. Resource ceilings are proposed, not owner-approved or runtime-enforced. Default network policy is deny. Provider/model egress remains prohibited pending route/account/quota qualification.

The registry scaffold `.github/pool-executor-registry.json`, blob `93628e44cd348b85f2bd33df709be80883c83588`, has `executors: []`. No executor is enrolled. The local Worker entrypoint, blob `214622f6dc94623521070eb9e7fbc2f573fdc2c6`, returns 404 and is not a live execution surface. OIDC verifies a GitHub Actions workflow/job principal, not the actual executable process or host.

### New finding: adapter outputs do not uniformly expose both false authorization flags

Issue #140 requires every adapter output to retain both `dispatch:false` and `executionAuthorized:false`.

On the exact PR #146 HEAD, the following exported D1 adapters include `dispatch:false` but have no `executionAuthorized` field in their source, on either success or deny paths:

| Adapter | Blob SHA |
|---|---|
| `src/consume.mjs` | `7b30f9fa315d7996854685cbe634bd8097677518` |
| `src/claim-outbox.mjs` | `9da0a05f007a4be26f7588dbd9e82b3bbf8bc825` |
| `src/task-lease.mjs` | `b41edf89cdf960b2c007f38ba16554dc179f021a` |
| `src/task-attempts.mjs` | `f40582968a3b25e1a59522c19dd5bc11b007e6b2` |

By contrast, `trusted-executor-auth.mjs` (blob `7156ef3eca47a80d1259a1b6883cbb50158bfd2a`), `trusted-executor-registry.mjs` (blob `a8427267d815ac2625199de7904e58f25fbd203a`) and `github-actions-oidc-verifier.mjs` (blob `42ea227874c85c366d0a8ea200c46bacc359a7b0`) explicitly return both flags as false.

The corresponding `consume.test.ts` (blob `7ccbc093ba59b124be35ee8c233e4611c843adb3`) and `claim-outbox.test.ts` (blob `72bf76da2b2af19afba63e5c0855a059417ae07b`) contain dispatch-false assertions but no `executionAuthorized` assertions. OIDC and registry tests do assert the latter.

This is a source-level contract gap, not evidence of an execution path: the candidate remains local-only, registry-empty and non-dispatching. Exact-head CI success does not close this unasserted output contract. No source/test change was made because the requested boundary forbids initiating workflows; the next code patch must add explicit false fields to every exported adapter response and negative-first contract tests before any qualification claim.

### D1 lineage remains unresolved

Pass 15's migration/object ownership matrix remains valid:

- #67 0001–0010 is the historical ledger/attempt/projection lineage; #72 0011 is the admission extension but retains legacy DSH profile references.
- #111/#146 lease guard uses migration ordinal 0006, colliding with #67 projection outbox 0006.
- #146 0001 is a competing root with the CODE profile, and #146 0002–0005 preserve both approval-keyed claim/outbox and task-keyed task-ready outbox semantics.
- #146 0006/0007 add lease and executor identity, but do not include #67 projection 0006–0010 or #72 admission 0011.
- Pass 13 registry migrations 0012–0014 remain research-only from a stale branch.

No canonical migration order, single task-ready outbox authority or complete immutable binding tuple is frozen. PR #143 remains OPEN/DRAFT/UNMERGED at `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`, 55 ahead / 1 behind current default; its exact-head D1/contract runs succeeded, but it is not a current-base integrated chain.

The frozen implementation target `integration/d1-current-base-2026-11-19` remains identical to default; no schema or source was transplanted.

## 5. Priority PRs and read adapter path fix

PRs #24/#25/#30/#31 remain OPEN / DRAFT / UNMERGED, all based on old merge base `64d2636d4500127e635c214ccfb722c6b3fcda80`, all 146 commits behind current default, and all with zero formal reviews:

| PR | Head | Ahead / behind | Exact-head CI |
|---|---|---:|---|
| [#24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24) | `7d3a34a1...` | 62 / 146 | 2 SUCCESS |
| [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | `8f0c0c57...` | 29 / 146 | 3 SUCCESS |
| [#30](https://github.com/VlDMlNSh/developer-cloud-pool/pull/30) | `ad9f9ac5...` | 35 / 146 | 1 SUCCESS (push event) |
| [#31](https://github.com/VlDMlNSh/developer-cloud-pool/pull/31) | `5470fccb...` | 36 / 146 | 1 SUCCESS |

These runs validate their immutable historical heads only; they do not qualify integration against current default.

Path-segment branch `fix/github-read-adapter-path-segments-2026-11-06` resolves to HEAD `dee17350864cb49e8c5dd41cf61859d77d3affca`; compare is 38 ahead / 146 behind, merge base `64d2636...`, 19 changed files. Exact-head workflow runs: 0; combined status contexts: 0 (**NOT VERIFIED**). Do not transplant the 19-file branch; reconstruct only the minimal `.` / `..` segment guard on a fresh current-base branch.

PR #145 is the working documentation PR, OPEN / DRAFT / UNMERGED at `9e1500e589ed632d43a23fd898c460c7d722f8dd`, 27 ahead / 0 behind before this report; exact-head CI 0, reviews 0. PR #147 is docs-only runtime research, OPEN / DRAFT / UNMERGED, based on #146, 12 commits / 6 files; exact-head CI 0, reviews 0. Neither is canonical code or runtime qualification.

## 6. Issues and runtime inventory

- [Issue #1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1): OPEN; governance approval gap remains.
- [Issue #22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22): OPEN; secure read-only web console not deployed.
- [Issue #26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26): OPEN; provider/account isolation, route qualification and quota ledger remain unqualified.
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140): OPEN; local no-secret D1 admission/lease qualification only. Owner comment [#7014947185](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140#issuecomment-7014947185) authorizes a bounded non-production qualification stage with synthetic data/free-tier resources; it does not authorize dispatch or production work and does not override this audit's no-deployment/no-provider-call boundary.

SentinelX read-only inventory:
- Connected hosts: 0.
- Mac mini: offline; last connected 2026-11-17 10:15:58 UTC.
- `mh-dev-01` and `mh-dev-02`: disabled by user.
- Free plan: one active slot, zero active, one available.
- Saved integrations: 0.

Cloudflare connector read-only inventory (kept separate from SentinelX integration identity):
- Accessible Cloudflare accounts: 1.
- Worker scripts: 0.
- D1 databases: 0.
- Access applications endpoint: HTTP 403, Access not enabled.

No persistent web API, hosted D1, qualified provider route/account/quota, host/process attestation or live CODE executor is verified.

## 7. Bounded work, exclusions and next step

Completed this pass:
1. Re-read the latest Pass 15 Context Window, report and checkpoint.
2. Independently revalidated default HEAD/signature, current workflow source, exact default CI, PR #139 merge, ruleset, open Issues/PRs, exact-head runs/reviews, path-fix branch and connected host/Cloudflare inventory.
3. Performed one bounded source audit of PR #146 adapter response shapes and matching tests; recorded the missing explicit `executionAuthorized:false` contract.

No secrets, tokens, API keys or their values were read. No variable value was obtained. No dispatch, workflow invocation, agent/Gemini/Claude run, DSH, Resource Probe, provider/model call, deployment, merge, hosted D1 write, branch-protection/ruleset/variable mutation, or Contour B work was performed.

Next concrete step:
1. Freeze the exact source/blob manifest and select exactly one authoritative task-ready outbox.
2. Add explicit `executionAuthorized:false` to every exported D1 adapter response and assert both false flags on success, deny, ambiguous and replay paths.
3. Port #72 admission semantics to `jarvis-code-sandbox-v1`, reconcile migration ordinal/trigger ownership, and bind executor/profile/host/route/issuer/account/quota/lease identities without conflation.
4. Only after the workflow prohibition is lifted, run exact-head local Workers-runtime CI and obtain independent security review; do not infer qualification from PR #146's existing isolated CI.
5. Rebuild the path-segment guard minimally on current default and verify its exact head.

**Final:** default legacy DSH dispatch retired; D1/CODE candidate CI passes only on its own head; output contract and canonical migration lineage remain unresolved; governance and runtime remain blocked. Contour A **BLOCKED / NOT ACCEPTED**; Contour B **DEFERRED**.
