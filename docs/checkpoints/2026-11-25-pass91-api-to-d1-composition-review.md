# Pass 91 checkpoint — 2026-11-25

- PR #174 API audit: head a8809c1dc8c2eaa49944fb031baeec54ce46b922, base 565404f84b6b86afb4dc2d8fa939341f42df6eca, OPEN/DRAFT/UNMERGED.
- PR #170 D1 candidate: head 40281787c208af2df916f10af1dba073061ff0d3, base 8c38bb073146d1c71da3e90cbbb11b55eb34a1e9, OPEN/DRAFT/UNMERGED, 41 ahead / 2 behind current PR #174 base.
- PR #169 docs branch head fb6eb335621e72a46ebda3f47e0bb0d372c27219, old base, OPEN/DRAFT/UNMERGED. PR #171 also OPEN/DRAFT/UNMERGED on old base.
- Issue #140 mandates one clean current-default D1 + event provenance integration. Issue #96 remains PLANNED; no dispatch.
- F91-01: PR #174's API-verified event is not passed to D1; PR #170's pure Actions context mapper/binder does not independently authenticate the GitHub API event. No unified trusted provenance-to-D1 control path.
- F91-02: D1 admission and source-comment receipt are two phases. Local tests prove same-ID recovery and fail-closed readback, but controller must retain original immutable admission ID/envelope across retries; never mint new task/attempt on receipt failure.
- F91-03: PR #170 and #174 are separate candidates; PR #170 is divergent from current base. No combined merge-result CI.
- Source blobs reviewed: github-next-event 31a254e..., context mapper 574d289..., admission adapter f4c788c..., migration 0017 2d226a..., integration tests e9c26f..., API verifier in PR #174 exact head.
- Reuse First: retain Cloudflare Workers Vitest/Miniflare D1 harness, Node built-in fetch, pinned GitHub Actions. No new dependency.
- No code/schema change, live webhook, hosted D1, dispatch, secret read, provider call, deployment, merge, production write or governance mutation.
- Current ruleset and current POOL_DISPATCH_ENABLED NOT VERIFIED. Gemini NOT RUN; Claude Code/ECC/FCC NOT RUN; independent security review NOT RUN; active time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: create one clean branch from revalidated current default; port one canonical D1 lineage; then add API-attested event envelope and module-level composition tests, all dispatch/execution false.
- Report: ../reports/2026-11-25-pass91-api-to-d1-composition-review.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
