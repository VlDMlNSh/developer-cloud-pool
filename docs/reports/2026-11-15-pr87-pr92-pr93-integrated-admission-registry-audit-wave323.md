# Wave 323 — PR #87/#92/#93 integrated admission and registry audit

Date: 2026-11-15
Scope: read-only source, exact-head CI, PR-chain and governance audit. No source-code changes.

## Immutable targets and live refs

- Default branch: `Основной`.
- Default ref read directly from Git Database API: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- PR #87: `integration/d1-ledger-clean-main-2026-11-15` @ `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, base `Основной` @ `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- PR #92: `fix/a0-admission-exact-replay-receipt-integrity-2026-11-15` @ `7014961587759b27d2ef6e91c60ce098d077ae83`, base PR #87 head.
- PR #93: `fix/verified-registry-capability-clean-stack-2026-11-15` @ `e200838d038b9cd48635233187819302bba6a33e`, base PR #92 head.
- All three PRs remain OPEN / DRAFT / UNMERGED; metadata reports mergeable=true. They are one stacked dependency chain and must not be merged independently.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`; documentation changes remain proposals until PR #27 is reviewed/merged.

## Exact-head CI

- PR #87 head: Pool Contract Validation run #43712647615 SUCCESS; Isolated D1 Ledger Proof run #43712647597 SUCCESS; D1 job #132807363651.
- PR #92 head: Pool Contract Validation run #43718679251 SUCCESS; Isolated D1 Ledger Proof run #43718679258 SUCCESS; D1 job #132825665733.
- PR #93 head: Isolated D1 Ledger Proof push run #43736259303 SUCCESS / job #132879411032; PR run #43736264768 SUCCESS / job #132879427578.
- PR #93 workflow job completed every listed step successfully: pinned Node setup, checkout, `npm ci --ignore-scripts`, syntax check, Workers-runtime D1 tests, isolated second D1 binding/migration API smoke, frozen schema-0010 fixture smoke, and lockfile artifact upload.
- PR #93 artifact #14170616460, SHA-256 `909e27d3bec1ca75933085475431f3ff5e4f9f8578985e1e2670d01336270c5a`.
- Combined Commit Status API returned zero status contexts for all three exact heads. This is NOT a green aggregate status; the named Actions runs above are independently observed successful runs.
- CI is an isolated local Workers-runtime / Miniflare D1 proof. It is not hosted D1, production Worker wiring, live provider execution, deployment, or pool acceptance.

## Integrated static audit findings

1. PR #87 adds the clean D1 proof stack, migrations 0011–0014 and the local Workers-runtime test harness. It is not a deployed runtime.
2. Migration 0013 persists the complete root-signed registry payload, normalized issuer-key rows and route qualifications with registry identity fields. Its route-insert trigger enforces snapshot/key identity binding and append-only issuer-key identity.
3. Migration 0014 creates `pool_admission_registry_assertions`. Its BEFORE INSERT guard checks the current registry pointer, exact snapshot/digest/version, accepted/valid snapshot window, qualified/non-revoked route, freshness, and active/non-revoked issuer key. The guard executes during the same D1 batch as approval consumption, task/outbox binding, attempt creation and receipt insertion.
4. PR #92 adds exact-replay readback across admission, commit receipt, consumed approval, task/current attempt, task outbox, route qualification and immutable registry assertion. It fails closed when durable receipt/assertion evidence is missing or mismatched. Exact retry remains queue-only.
5. PR #93 changes registry persistence to accept only the original verifier-issued object held in module-private WeakMaps. Caller-copied/forged verification objects are denied; the exact bundle snapshot is deep-frozen; persistence time is bound to verifier `verifiedAt`. The stale lower-epoch rollback test remains present and passed on exact head.
6. All reviewed admission/persistence paths preserve `dispatch:false`. No dispatch authority is introduced by this stack.

## Security/governance gate

- Formal reviews: PR #87 = 0, PR #92 = 0, PR #93 = 0.
- Active ruleset #26550182, `Основной — verified`, applies to `refs/heads/Основной`; requires PR, deletion/non-fast-forward restrictions and review-thread resolution. It requires **0 approving reviews**, no CODEOWNER/last-push approval and has no bypass actors.
- No required status-check contexts are configured in this ruleset. Exact-head successful Actions runs do not substitute for independent review.
- Independent security/provenance review of the entire stack: NOT RUN / NOT VERIFIED.
- Cloud Pool-specific authorized Gemini controller route and three child runs: NOT RUN. Do not repurpose the MediaHub Gemini controller. Claude Code host qualification: NOT RUN.
- No secrets read, provider/model calls, paid fallback, remote D1 provisioning, deployment, dispatch, merge or ruleset mutation.

## Remaining boundary / next step

The code-level trust path is materially stronger, but the repository has not yet independently demonstrated that all production writers of registry snapshots, issuer keys and route qualifications are restricted to the verifier-capability persistence boundary, nor that the D1 proof is integrated into the deployed Supervisor/Worker/web console. Treat that as an audit/integration boundary, not as a proven exploit.

Next bounded pass: enumerate every writer/read path for registry tables and admission APIs across the repository; verify no alternate write path bypasses the verifier-issued capability, then map the accepted local proof into production Worker/Supervisor integration contracts without enabling dispatch. Keep the stack unmerged and fail-closed until independent review and governance gates are satisfied.

## Status

- Local D1 proof: VERIFIED on exact PR heads for the runs listed above.
- Integrated stack security review: NOT RUN / NOT VERIFIED.
- Hosted D1, web UI, executor routing, persistence recovery and Contour A qualification: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No owner action required for this read-only pass.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
