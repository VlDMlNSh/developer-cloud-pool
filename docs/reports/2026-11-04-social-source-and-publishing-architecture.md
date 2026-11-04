# Engineering report — 2026-11-04: Social source and publishing architecture

## Immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/4
- Base branch: Основной
- Base SHA: 4597617db0de7cc698cce936a540594ee3d25bf2
- Work branch: feat/media-intelligence-skills-2026-11-04
- Previous architecture blob: 61e6b956158d95a4e07fa1af14908476713b94b9

## User requirement

Extend Media Intelligence to collect and analyze information from YouTube, Instagram, Telegram, TikTok and other open sources, and support publication of approved content to authorized destinations.

## Work completed

Updated the Media Intelligence architecture to distinguish research/read operations from editorial preparation, publication and publication verification. Added logical profiles MI-08 through MI-10, platform-specific source/publisher constraints, a publication lifecycle, immutable authorization envelope, destination allowlists, isolated credentials, idempotency/reconciliation, receipts and separate acceptance gates.

Key decisions:
- Research profiles remain read-only and receive no social publishing credentials.
- Editorial profiles create drafts and assets but receive no platform account credentials.
- Publishing is a separate isolated workflow, one platform/destination per task, using scoped and expiring authorization.
- Live publication remains DISABLED until each adapter and end-to-end control set is independently qualified.
- Default authorization is per-publication approval. A future narrowly scoped autopublish policy requires explicit owner configuration and is revocable/auditable.
- No platform tokens were requested, stored or used; no publication workflow was dispatched.

## Platform capability references reviewed

- YouTube Data API upload and OAuth: https://developers.google.com/youtube/data/reference/rest/v3/videos/insert
- YouTube Data API quota overview: https://developers.google.com/youtube/data/getting-started
- Instagram API overview and Professional-account limitations: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Telegram Bot API sendMessage and channel administrator rights: https://core.telegram.org/bots/api
- TikTok Content Posting API authorization and Direct Post requirements: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- TikTok Content Sharing Guidelines and unaudited-client visibility restrictions: https://developers.tiktok.com/docs/en/content-sharing-guidelines

These references establish documented API constraints only; they do not establish that any MediaHub/Developer Cloud Pool app, account, token, permission or adapter exists or is approved.

## Verification and status

- Architecture update committed to PR branch: commit 014291295ca4e10e925406760e83f40f58d75258.
- New architecture blob SHA: 7f51531bfb96c9a990b357553c6439fdc78bf0b8.
- Architecture read-back: VERIFIED; fetched from the PR branch and blob SHA matched.
- Report read-back: VERIFIED; fetched from the PR branch.
- Platform adapters: NOT IMPLEMENTED / NOT RUN.
- Skills/plugins installation: NOT RUN.
- Research and publication workflows: NOT IMPLEMENTED.
- Live publication: DISABLED.
- PR #4: OPEN at last query; exact-head CI: NOT VERIFIED (combined status empty; associated PR workflow runs empty).
- Governance issues #1 and #2 remain OPEN; pool dispatch remains BLOCKED pending governance verification.
- No runner, social credential, model API or paid fallback was used.

## Next step

Update README/PR links and summary, then await independent review. After governance and resource qualification, proceed with a read-only MI-01 smoke test. Platform adapters and publishing workflows remain separate later work packages.
