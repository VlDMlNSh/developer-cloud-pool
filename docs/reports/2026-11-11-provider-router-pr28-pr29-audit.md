# PR #28 / #29 Provider Routing and Quota Ledger Audit — 2026-11-11

## Scope and immutable refs

- Cloud Pool canonical default branch: `Основной` @ `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #28 branch `docs/provider-quota-agent-routing-2026-11-06` @ `c07e3442a54fabdb74431f00cbbcd9d75280b01b`; base is stale `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #29 branch `feat/quota-ledger-state-machine-2026-11-06` advanced during this pass from `576510b4df47008b212884df361306b7d848277d` to `e4c8d642bbc054e7c52b391356965b492dad32b4`; base remains stale `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #28 and #29 remain OPEN / DRAFT / UNMERGED.
- Issue #26 remains OPEN.
- No default-branch changes, provider calls, secret access, resource provisioning, or agent dispatch.

## PR #28 — architecture candidate

PR #28 documents a sound separation between upstream provider quota domains and the pool's own operational budget. It nominates LiteLLM Proxy as a reusable gateway candidate, not an adopted component. The design correctly states that LiteLLM spend accounting is not upstream free-quota truth; durable budget enforcement requires PostgreSQL, and shared multi-instance rate coordination requires Redis. Neither service is provisioned or approved.

Disposition: DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED. Docs-only change; exact-head CI was not returned by the PR-triggered run query. No review submissions were found. The PR base predates current default and needs controlled rebase/retarget before acceptance.

## PR #29 — pure ledger and admission planning

The current head includes:
- Pure provider quota state transitions with no credentials or provider clients.
- Route-level and evidence-backed shared quota-domain outcomes.
- 401/403 authentication failure, 402 billing block, 429 cooldown or reconciliation, and provider-evidence-only quota reset.
- Registry-derived 24-slot inventory; account/quota-domain independence and credential presence explicitly remain unknown.
- A pure slot activation planner with a hard cap of 20, qualification/credential/route/model/billing checks, and invalid active slots still consuming capacity until durable release.
- Runner capacity observation/candidate helpers, explicitly not qualified capacity.

### Historical review finding F11

A formal CHANGES_REQUESTED review from 2026-11-08 targeted old PR head `34fc78921b16359d136db553d8a51b4a4716995d` and found that active slots bypassed eligibility filters. The current source at PR head `e4c8d642bbc054e7c52b391356965b492dad32b4` now uses a shared `isEligible` predicate for active and new slots. The current tests explicitly cover rejected qualification, revoked credential, auth-failed route, disallowed billing, empty allowlist and retained capacity. The old formal review is still present as CHANGES_REQUESTED and has not been superseded by a fresh independent review of the current head. Therefore F11 remediation is source/test evidenced but independent review closure is NOT VERIFIED.

### Workflow defects found and corrected

At pre-fix head `576510b4df47008b212884df361306b7d848277d`:
1. `.github/workflows/pool-contract-validation.yml` had escaped shell variable expansion in the dispatch guard: the shell compared the literal string `${POOL_DISPATCH_ENABLED:-}` rather than the environment variable. This made the guard ineffective. The GitHub expression was also backslash-prefixed unnecessarily.
2. `.github/workflows/runner-resource-probe.yml` wrote a literal backslash-n sequence after the JSON payload rather than a newline, making the artifact invalid JSON.

Corrections were committed in the PR #29 feature branch only:
- Commit `d3fe63dc240ad8e51c4bebe5988c2977ac885a57`: restore GitHub expression and shell variable expansion in dispatch guard. Workflow blob `54046165396152f5548e4a5fa21f1275b424d0b4`.
- Commit `e4c8d642bbc054e7c52b391356965b492dad32b4`: write a valid JSON newline in runner probe. Workflow blob `e17031421c26625b83ead2dedd22f587e669ff39`.

Read-back confirmed both corrected files. The runner resource probe is manual-only and was not run; its artifact output is therefore not runtime-verified.

## Exact-head CI evidence

- PR #29 current exact head: `e4c8d642bbc054e7c52b391356965b492dad32b4`.
- Workflow run `43031920223`, Pool Contract Validation, event `pull_request`, conclusion SUCCESS, exact same head SHA.
- Job `130560896729` conclusion SUCCESS.
- Job log records 43 tests, 43 passed, 0 failed, 0 skipped.
- This verifies the current static contract/test workflow only; it does not qualify hosted persistence, atomic admission, credential isolation, provider routing, quota truth or a running pool.
- The previous intermediate run `43031905104` at `d3fe63dc240ad8e51c4bebe5988c2977ac885a57` was cancelled by concurrency replacement. Do not count it as a validation failure.

## Integration blockers

1. PR #28 and PR #29 still target old base `64d2636d4500127e635c214ccfb722c6b3fcda80`, while current default is `6fdcedebeba62715122e43a75c6ad6d926321ce7`. No merge should occur until base drift is reconciled and exact-head CI/review rerun.
2. PR #29's pure planner is not a durable atomic lease store. It explicitly requires a production controller to wrap it in a shared atomic lease store.
3. Quota ledger state is in-memory/pure; persistence, concurrent reservations and crash reconciliation are not implemented by this PR.
4. PR #28 LiteLLM candidate requires a pinned no-secret proof-of-fit. No gateway, PostgreSQL or Redis is deployed.
5. Provider account/quota-domain independence, actual secret presence, authentication, free eligibility and provider quota remain NOT VERIFIED.
6. Formal independent review of current PR #29 head is still outstanding.

## Next bounded step

Do not start live provider qualification yet. First perform a base-drift impact analysis for PR #28/#29 and prepare a safe rebase/retarget plan; in parallel, define a durable atomic reservation contract that consumes the pure ledger planner without making it an authority. Then require fresh independent review of PR #29's current head. Keep all provider calls and worker dispatch disabled.

## Status

- PR #28: DESIGN / OPEN / DRAFT / STALE BASE / NOT QUALIFIED.
- PR #29: PURE MODULE + STATIC TESTS / OPEN / DRAFT / STALE BASE.
- PR #29 exact-head static CI: VERIFIED SUCCESS (43/43).
- Historical F11 source correction: PRESENT AND TESTED; fresh independent review closure NOT VERIFIED.
- Provider APIs/secrets: NOT READ / NOT CALLED.
- Durable gateway/quota ledger: NOT IMPLEMENTED / NOT QUALIFIED.
- Agent dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Links

- PR #28: https://github.com/VlDMlNSh/developer-cloud-pool/pull/28
- PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- Issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- LiteLLM Proxy: https://github.com/BerriAI/litellm
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
