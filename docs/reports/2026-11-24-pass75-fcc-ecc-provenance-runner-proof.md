# Pass 75 — canonical FCC/ECC provenance and historical executor proof

- Date: 2026-11-24
- Scope: Contour A only; one bounded source/provenance and executor evidence review.
- Observed current default base from open PR base refs: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Target: identify intended FCC/ECC, verify source/license/version metadata and reassess existing no-secret runner proof.
- Non-goals: no install, provider/model call, secret access, workflow dispatch, merge, deployment, network service, production mutation, or Contour B.

## 1. Canonical source identity — resolved

Owner-approved Issue #115 explicitly names the intended first executor toolchain as Claude Code CLI + selectively installed Everything Claude Code (ECC toolkit) + FCC. Its owner comments link exact upstream commit pins and license evidence.

- FCC: [Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code), Free Claude Code.
- ECC: [affaan-m/ECC](https://github.com/affaan-m/ECC). The former `affaan-m/everything-claude-code` URL redirects to this canonical repository.

This resolves the prior Pass74 ambiguity. It does not mean the components are currently approved for deployment.

## 2. Reuse First — evidence and constraints

| Component | Evidence read | License / version evidence | Decision |
|---|---|---|---|
| FCC | Owner-pinned source commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`; README and `pyproject.toml` read back from upstream | Pinned LICENSE: AGPL-3.0-only; pinned Python requirement exactly 3.14.10. Current README still advertises Python 3.14 / AGPL. | REUSE CANDIDATE, loopback-only; legal/network deployment review and fresh security review remain gates |
| ECC | Owner-pinned commit `e413166c50e85fb205b988b5e78874b5a88ea4d2`; current canonical repo README, package metadata, VERSION and SECURITY.md read | Pinned LICENSE MIT. Current package `ecc-universal` 2.2.3, MIT; current SECURITY.md supports 2.x / RC builds. | REUSE CANDIDATE; select modules only, pin exact commit/package and verify supply-chain integrity before fresh install |
| Claude Code CLI | Historical PR #116 runner proof and signed APT release-manifest verification evidence | Proprietary vendor-distributed CLI; hosted-use entitlement/terms not verified here | Runtime candidate only; terms and actual hosted-use permission remain NOT VERIFIED |

ECC's upstream security policy describes private vulnerability reporting and supported version lines. It is maintainer-published policy, not an independent security audit. FCC's checked repository path did not expose a dedicated SECURITY.md; do not infer that this proves no security process exists.

### FCC multi-key quota hazard

At pinned FCC commit, source `src/free_claude_code/config/api_keys.py` normalizes ordered key lists and supports numbered selection. The pinned `tests/api/test_fallback_key_requests.py` exercises sequential requests using different keys after upstream 403/429 responses.

Cloud Pool requirement:
- one credential/account/quota domain per FCC profile;
- one explicitly selected model;
- no `MODEL_FALLBACKS`, numbered-key fallback, key cycling, cross-account credential lists, provider fallback or paid fallback;
- separate accounts require separate isolated profiles and independently evidenced quota ledgers.

No credential values were accessed. The source audit is not a live provider/account/quota qualification.

## 3. Existing PR #116 no-secret runner proof — refreshed

PR #116:
- OPEN / DRAFT / UNMERGED.
- head `2e944f13818f434cf135602c1c0e82051f1d3fa8`.
- base at PR creation `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- current observed base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- compare current base...PR head: 74 commits ahead / 12 behind; status DIVERGED. Do not merge or use as current-base proof without controlled rebase/requalification.

Exact-head workflow evidence:
- Runner Qualification run `44286955337`: SUCCESS; job `134741981861`; 18/18 listed steps SUCCESS.
- Pool Contract Validation run `44286955360`: SUCCESS; job `134741972786`; 7/7 listed steps SUCCESS.
- Artifact `14420066410`, 34,605 bytes, SHA-256 `17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a`; GitHub reports expiry 2026-11-25.

Runner proof includes signed Claude Code binary verification, Docker no-egress primitive, FCC loopback readiness/shutdown, synthetic profile guard, mock CLI handoff, selected ECC skill install and provenance/resource manifest. It does not establish actual CODE worker execution inside the sandbox, provider-specific egress allowlisting, a real Claude session, a permitted free route/account/quota, or production dispatch. This is installation feasibility evidence only.

Issue #115 remains OPEN. The prior evidence comments also explicitly identify FCC's multi-key fallback hazard and state that live route/account/quota qualification is still missing.

## 4. Current Cloud Pool integration state

- PR #169 remains OPEN/DRAFT/UNMERGED; Pass75 docs addendum commits have advanced its head. Exact-head CI must be refreshed after all docs writes.
- PR #170 and #171 remain separate candidates; prior exact-head successes apply only to their respective heads and scopes.
- Default-branch checks in previous pass found no `.github/workflows/gemini-batch-dispatch-controller.yml` or `.github/workflows/next-event-controller.yml`; no dispatch authorization.
- Issue #96 remains the only intended owner-only control surface. Keep all dispatch paths fail-closed.
- Ruleset/current dispatch variable metadata remain NOT VERIFIED in this pass.

## 5. Status and gates

- FCC/ECC identity: VERIFIED from Issue #115 owner-approved record and upstream readback.
- Pinned FCC/ECC license evidence: VERIFIED by exact pinned LICENSE reads.
- ECC current package metadata/security policy: VERIFIED by upstream file readback.
- Historical no-secret installation proof: VERIFIED for PR #116 exact head and listed workflow/job evidence.
- Current-base integration of PR #116: NOT QUALIFIED (74 ahead / 12 behind).
- Real provider route/account/quota: NOT VERIFIED.
- Actual worker-in-container execution and provider egress allowlist: NOT VERIFIED.
- FCC network deployment / AGPL use review: NOT VERIFIED; FCC remains loopback-only.
- Claude Code hosted-use entitlement: NOT VERIFIED.
- Gemini: NOT RUN.
- Merge/deployment/production writes: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## 6. Work performed and metrics

- Re-read Context Window, Pass74 report, roadmap, Issues #96/#115/#140/#172/#173, PRs #116/#169/#170/#171.
- Read upstream FCC pinned LICENSE, `pyproject.toml`, API-key source and fallback tests; current README.
- Read upstream ECC pinned LICENSE, current package.json, VERSION, README and SECURITY.md.
- Refreshed PR #116 exact-head runs, jobs, artifact metadata, review records and base divergence.
- Updated three architecture contracts and added this report/checkpoint/Context Window entry.
- Code/schema/workflow/dependency changes: 0.
- Local tests/validators: NOT RUN.
- Actual time: NOT MEASURED; no hours estimate asserted.

## 7. Next bounded step

Create a clean, current-base no-secret qualification branch from the current default SHA and port only the minimal, reviewed PR #116 proof (not its stale branch history). Before any new installation, re-pin exact FCC/ECC/Claude Code versions and hashes, preserve the FCC one-account/no-fallback guard, add a test proving the actual CODE worker runs inside the no-egress sandbox, and prove no credentials reach untrusted code. Do not make provider calls or enable dispatch. Separately, keep FCC loopback-only until legal review clears intended network use.
