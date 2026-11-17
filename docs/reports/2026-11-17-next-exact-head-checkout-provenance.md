# Exact PR-head checkout provenance correction — 2026-11-17

## Scope

One bounded verification pass on PR #116: ensure the no-secret Claude Code + ECC + FCC qualification executes the immutable candidate PR head rather than GitHub's synthetic pull-request merge ref.

## Finding

The prior successful run 44093612344 had a mismatch in its evidence manifest:
- target head: `e58211dfe82a885d7718ebbc89d66188087cdcc4`
- actual checkout: `ff86e2bcda396c3cbce80b39984d028ff95f57b6`

That run was useful installation/runtime evidence but was not accepted as strict exact-head proof.

## Correction

Workflow `.github/workflows/claude-code-fcc-runner-qualification.yml` now explicitly sets the checkout ref to `github.event.pull_request.head.sha || github.sha`, retaining `persist-credentials: false`.

Candidate head: `d93e75df74e7213f96dc3e2cb335a73dc6710e19`.

## Verification

- Runner Qualification: [run 44094382662](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094382662) — SUCCESS; job 134077531544; all 14 steps succeeded.
- Pool Contract Validation: [run 44094382669](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094382669) — SUCCESS.
- Artifact [14333840752](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094382662/artifacts/14333840752): 26,805 bytes; SHA-256 `96fb613956842b30015e659c662c799af363eb3bfbf8fa54179b5d51df3acafa`.
- Downloaded artifact SHA-256 independently matches GitHub's artifact digest.
- All 22 entries in `SHA256SUMS.txt` match; no duplicate provenance keys.
- Manifest confirms `target_sha=d93e75df74e7213f96dc3e2cb335a73dc6710e19` and `checkout_sha=d93e75df74e7213f96dc3e2cb335a73dc6710e19`.
- FCC loopback status HTTP 200, listener 127.0.0.1:18765, clean shutdown and no listener afterward.
- Synthetic bridge health HTTP 200 at 127.0.0.1:18766; argument preservation verified; mock exit propagated; clean shutdown.

## Boundaries

The Claude executable is a synthetic mock. Manifest confirms `real_claude_session=false`, `agent_task_executed=false`, `provider_calls=false`, `github_secret_values_read=false`, and `production_dispatch=false`.

This is not a live provider route, account identity/free-quota, real Claude task, host egress, or production deployment qualification. FCC remains loopback-only pending AGPL-3.0-only network-use review. One-account/no-fallback effective configuration, installer-byte integrity, free route/quota and independent A3 security approval remain open.

PR #116 remains OPEN/DRAFT/UNMERGED. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED. Keep `POOL_DISPATCH_ENABLED=false`.

## Next

Complete Claude installer-byte integrity review and FCC one-account/no-fallback configuration contract review without reading secret values. Then obtain independent A3 review and only afterwards consider a separately gated live free-route qualification.
