# 2026-11-10 — Octokit lockfile and attempt-specific transport proof

## Immutable target and final refs

- PR #57: https://github.com/VlDMlNSh/developer-cloud-pool/pull/57
- Final PR head: `6de267caa82c9a2247b531abb12f8c9ee1514a37`
- Base `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- PR remains OPEN / DRAFT / UNMERGED; reviews 0, inline threads 0.
- Final PR files: 7 (workflow, package manifest/lock, pure verifier, Octokit reader, two test files).

## Hosted lock generation and integrity evidence

A trusted GitHub-hosted `ubuntu-24.04` runner generated the dependency lock using Node `v22.23.4` and npm `10.9.9`. The first attempt to place a new workflow only in the Draft PR did not trigger (new workflow absent from base); that untriggerable file was removed. Lock generation was moved into the existing PR-triggered fixture workflow, preserving least privilege.

Generation command on the hosted runner:
`npm install --package-lock-only --ignore-scripts --save-exact @octokit/rest@22.0.1 --no-audit --no-fund`

- Initial hosted proof run `42834636985`, job `129893488841`, SUCCESS; artifact `13772069391`, digest `sha256:e7a9b3c146f019c6fe06b790886b469b6942acb2c83751803640b9952bcf3793`.
- Generated lockfile SHA-256 (reported by runner): `d60947765a0643454d8a09c087cc6a15d37aa5efb9772ebd52277d44e24e2820`.
- Lockfile version 3, 20 transitive package entries; all 20 have resolved tarball URLs and SHA-512 integrity fields. Direct `@octokit/rest` version is exactly `22.0.1`.
- The generated lock bytes were recovered from the run log, committed without alteration, then read back from GitHub Contents API and compared byte-for-byte to the generated content.
- Manifest blob: `67a338f6fc3173b3f8f2c98ceece41bdc46b74ca`.
- Lock blob: `69bc37ff0e2b655d38fd15e1d0866699d8807088`.

The committed lock was then independently consumed by `npm ci --ignore-scripts --no-audit --no-fund` on the final exact PR head. Final run `42835449098`, job `129896303135`, COMPLETED/SUCCESS. The runner's `sha256sum package-lock.json` reproduced the same `d6094776...` digest. Artifact `13773621404`, 2,701 bytes, digest `sha256:5458390fa81360e068b457fc211b6e02279f8876affb29afac95488f591faff6`.

## Actual Octokit transport adapter

Added `src/octokit-run-attempt-reader.mjs`, using the real `Octokit` export from the pinned package. The adapter:
- uses one fixed route: `GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}`;
- supplies only validated owner/repo/runId/runAttempt and API version header;
- accepts no caller-provided URL, HTTP method, auth, or request options;
- sets `request.retries: 0` explicitly;
- preserves HTTP error status only when an HTTP response exists;
- propagates network/transport failures with no response, so the caller can map them to UNRESOLVED.

The synthetic-fetch tests instantiate actual Octokit, capture method and full URL, and return local synthetic Responses. They assert exactly one fixed GET, no arbitrary-route override, one attempt on HTTP errors, and one attempt with propagated network failure. No live GitHub API request or credential was used.

Source blobs:
- adapter: `c29b7e69e682919f98e768321b9391b750c07abf`
- transport tests: `23bc525074fd623189e5cebb028473716f044074`
- fixture workflow: `b51bf2c5ee2ddae560e3e9278f1a0e17337a8330`

## CI history — failures retained, not hidden

- Intermediate run `42835136648` / job `129895218050` FAILED: two test expectations were wrong. Octokit normalized a thrown fetch error into a status-bearing error without an HTTP response; and the test incorrectly expected extra caller properties to throw instead of proving they were ignored. The logs were inspected.
- Corrective changes: disable Octokit retries with `request.retries: 0`; only treat errors as HTTP responses when `error.response` exists; test that an injected arbitrary URL/method/auth is ignored and the fixed GET remains in use.
- A follow-up intermediate run was cancelled when the next commit superseded it; not counted as a pass.
- Final exact-head fixture run `42835449098`, job `129896303135`, head `6de267caa82c9a2247b531abb12f8c9ee1514a37`: COMPLETED/SUCCESS, 16 tests passed, 0 failed.
- Final exact-head Pool Contract Validation run `42835449180`: COMPLETED/SUCCESS.
- Both exact-head workflows report the same final SHA.

## Governance and limitations

- Workflow remains PR-triggered, `contents: read`, pinned checkout, `persist-credentials: false`; upload-artifact action pinned to immutable SHA. No Actions write, Issues write, secret, live API auth or dispatch.
- Active ruleset `26550182` protects `refs/heads/Основной`, but `required_approving_review_count=0`, CODEOWNERS review=false. PR #57 has zero formal reviews and zero inline threads. Independent review is NOT RUN.
- This proves package integrity/installation and the Octokit route against synthetic fetch only. It does not prove a live API response, trusted clock, resolver capability, effect reconciliation, D1/hosted State Authority, dispatch or production integration.
- No secret values read; no agents, Worker, DSH, Resource Probe, provider/model, remote D1/Worker provisioning, deployment, merge or paid resource used.

## Status and next bounded step

- Octokit lock generation: VERIFIED on GitHub-hosted runner.
- Full dependency integrity fields: VERIFIED (20/20 transitive entries).
- Committed lock readback: VERIFIED byte-for-byte; SHA-256 `d60947765a0643454d8a09c087cc6a15d37aa5efb9772ebd52277d44e24e2820`.
- Exact-head `npm ci`: VERIFIED.
- Real Octokit with synthetic fetch: VERIFIED; exact attempt route, GET-only, no arbitrary route override, retry disabled.
- Exact-head fixture CI: VERIFIED 16/16; Pool Contract Validation: SUCCESS.
- Live API transport: NOT RUN.
- Resolver authority / hosted State Authority: NOT QUALIFIED.
- Independent review: NOT RUN.
- Issue #38: OPEN; durable single-use claim remains NOT QUALIFIED.
- PR #57: OPEN / DRAFT / UNMERGED.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

Next: perform a bounded adapter-to-pure-verifier composition test using synthetic API responses and trusted-clock injection; then inspect current Supervisor/Worker integration seams. Do not use live API credentials, enable dispatch or implement Resolver until claim lifecycle and governance gates are closed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
