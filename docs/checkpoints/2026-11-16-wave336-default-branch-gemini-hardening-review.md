# Wave 336 checkpoint — 2026-11-16

- Priority: Cloud Pool Contour A; Contour B deferred.
- PR #109 OPEN/DRAFT/UNMERGED; head `3cce7c749b197a771a9d018c022954b3dadaef7e`; base `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Exact-head CI #43871896948 / job #133314929863 COMPLETED/SUCCESS; all seven steps successful.
- Source blob `9c5377f58de9dd8dabb4f05c72479fad1f10e033`; test blob `80f358197c2006105c902fd2d54c84f33e055d97`.
- PR #109 fixes model allowlist to `gemini-2.5-flash`, adds 45s SDK AbortSignal, 8,000-char returned-output truncation and fake-client tests. This does not prove free-tier eligibility or server-side cancellation.
- Review finding: output is truncated only after full response materialization; provider-side output token bound is still needed.
- No package manifest/lockfile; official SDK runtime NOT VERIFIED. No real provider calls, secret reads or dispatch.
- Four account identities/quota domains NOT VERIFIED; Issue #96 admission/lease/fencing/recovery/child reconciliation not integrated; independent review NOT RUN.
- Issues #94/#96 OPEN; PR #109 formal reviews 0. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: provider-side output-token bound, SDK pin/lockfile/fake transport runtime qualification, then durable Issue #96 controller and independent security/governance review.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Post-publication exact-head recheck
- PR #109 moved to head `371093fc646a22cf49e3baaa8984bc2e5d3622b7`; base remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Exact-head CI #43872185972 / job #133315933882 COMPLETED / SUCCESS; all seven steps successful.
- Source/test blobs unchanged: `9c5377f58de9dd8dabb4f05c72479fad1f10e033` / `80f358197c2006105c902fd2d54c84f33e055d97`. Provider-side max output token limit remains absent; returned output cap is post-response only.
- Earlier head `3cce7c749b197a771a9d018c022954b3dadaef7e` and CI #43871896948 are superseded.