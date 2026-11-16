# 2026-11-16 — Cloud Pool ledger provenance hardening and MediaHub /next gate recheck

Date: 2026-11-16
Scope: one bounded engineering pass. Canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Immutable target refs

- Cloud Pool default branch `Основной`: `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- MediaHub OS `main`: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- PR #98 proof head: `f23cdb5484d5923e02242b3ea142397f9e1f0270`, base exact Cloud Pool default above.
- New remediation branch: `fix/next-ledger-owner-auth-2026-11-16`, final HEAD `f9711f67d9b683e687c7ec5481c10b9e5626c61e`, based on PR #98 head.
- New dependent Draft PR #100: https://github.com/VlDMlNSh/developer-cloud-pool/pull/100; base `feat/cloud-pool-next-admission-clean-base-2026-11-15` at `f23cdb5484d5923e02242b3ea142397f9e1f0270`.

## Work performed

PR #98's `parseLedgerComments` trusted the unkeyed SHA-256 digest as if it established authorship. A digest detects payload corruption but does not prove who posted the issue comment.

A bounded remediation was implemented in PR #100:
- Ledger records are accepted only when GitHub API metadata reports user `VlDMlNSh`, `author_association == OWNER`, and the exact Issue #96 API URL.
- Marker-looking comments from other authors, other associations, another issue, or without trusted metadata are ignored; they cannot create or corrupt an admission record.
- Updated fixtures for actual GitHub comment metadata and added negative tests for non-owner, collaborator, wrong-issue and missing metadata.
- Four changed files, all read back from the remediation branch. Blobs:
  - `scripts/next-dispatch-ledger.mjs`: `43d727d0561f35e746fc39b05673876c2a482dc6`
  - `test/next-dispatch-ledger.test.mjs`: `013aae1002579074ab9bf779a08a8513cbc34b47`
  - `test/next-github-ledger-adapter.test.mjs`: `6696f5f495c7543fd476a6ddb9ff635351a0ae7a`
  - `test/next-github-api-adapter.test.mjs`: `aefb58208d2d85297d00f73d964c3d26d5349e52`

## CI and review evidence

- PR #100 exact-head run `43764511321`, job `132966477817`, head `f9711f67d9b683e687c7ec5481c10b9e5626c61e`: COMPLETED / SUCCESS.
- Job steps: syntax checks SUCCESS; adversarial admission and ledger tests SUCCESS.
- Node test output: 50 tests, 50 pass, 0 fail, 0 skipped.
- PR #100 remains OPEN / DRAFT / UNMERGED; formal reviews: 0. It is a dependent PR based on PR #98, not a default-branch change.
- PR #98 remains OPEN / DRAFT / UNMERGED; exact-head checks `43758616823`, `43758657644`, `43758657648` SUCCESS; formal reviews 0.
- PR #99 documentation branch head `8b5b84db5be8b75e926be1292615bb4ac6d61c0e`; exact-head checks 0; formal reviews 0. NOT VERIFIED.
- CI evidence is from GitHub Actions; no local test run is claimed.

## Remaining security and execution blockers

- PR #100 addresses ledger comment authorship only. It does not implement the actual trusted-main controller.
- The `lockHeld` boolean remains caller asserted; no real repository-wide concurrency lock is implemented in the Cloud Pool controller.
- Workflow-run reconciliation still relies on `display_title` and `head_sha`; full workflow identity/path, event, repository and branch correlation remains unimplemented. There is no Cloud Pool controller workflow in default branch.
- Issue #96 explicitly remains PLANNED and says dispatch is disabled pending source, tests, exact-head CI, ruleset/governance and no-secret probe.
- No Cloud Pool workflow trigger, issue comment, live ledger mutation, dispatch, secret access, provider call, deployment, merge or qualification occurred.
- MediaHub controller main blob `7799f0fc713c5bd772ce6820df40a926a83445c8` still uses REST child dispatch/HMAC and `MEDIAHUB_GITHUB_TOKEN`; children expose `workflow_dispatch`, diverging from the merged Option B `workflow_call` architecture. Trusted-main no-secret probe, effective secret/variable scope and governance reconciliation remain NOT VERIFIED. Therefore no new MediaHub Issue #301 /next comment or Gemini batch was triggered.
- Last confirmed Gemini wave remains owner comment `6901529560`, controller `43763042415`, children `43763061253`, `43763062743`, `43763064255`; all SUCCEEDED with artifact digests recorded in the preceding report/context addendum. This pass did not create a new wave.
- Agent PRs #730/#731/#732 remain OPEN / DRAFT; their PR-level contract runs are `action_required`, exact-head check-runs 0, formal reviews 0. Execution success is not implementation acceptance.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Implement a trusted-main Cloud Pool controller only after explicit governance authorization; replace caller-asserted lock booleans with enforced repository-wide serialization; bind recovery to exact workflow identity/path, event, repository, branch, source comment and target SHA; then add adversarial controller integration tests and independent review. Separately reconcile MediaHub controller transport with approved Option B and complete its trusted-main no-secret probe before a new Gemini wave.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Post-pass trusted-main no-secret probe — 2026-11-16

- Owner-authenticated Issue #301 comment `6901747908` with exact body `/probe` triggered the approved controller's non-launching probe path.
- Controller run `43764634513`: COMPLETED / SUCCESS on MediaHub main target `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Probe job `132966862378`: SUCCESS. Context assertion job `132966891092`: SUCCESS. Readiness job `132966863587`: SKIPPED. `dispatch_and_monitor` job `132966864372`: SKIPPED. No artifacts.
- Job logs confirm `event_name=issue_comment`, workflow ref `VlDMlNSh/mediahub-os/.github/workflows/gemini-batch-dispatch-controller.yml@refs/heads/main`, trusted controller `true`, issue 301, exact `/probe`, author association OWNER. Probe summary explicitly reports no transport/HMAC/provider secrets mapped and Gemini not reachable in probe mode.
- This upgrades the trusted-main no-secret caller-context probe to VERIFIED. It does NOT verify effective secret/variable presence, scope or permissions; no secret values were read. It does not qualify controller transport, dispatch, child execution or the three-agent batch.
- No Gemini children were launched; `readiness_gate` and `dispatch_and_monitor` were skipped. REST/HMAC versus approved `workflow_call` governance mismatch and missing independent governance review remain blockers. Do not launch a new batch until those are resolved.
