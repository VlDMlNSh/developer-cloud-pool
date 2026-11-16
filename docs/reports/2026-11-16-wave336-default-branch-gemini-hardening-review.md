# Wave 336 — default-branch Gemini hardening candidate review (2026-11-16)

## Scope
Bounded review of PR #109, the default-branch-targeted port of the execution-bound hardening from stacked PR #108. No source mutation, secrets access, provider call, dispatch, merge, or deployment.

## Immutable refs and CI
- PR #109: OPEN / DRAFT / UNMERGED; head branch `fix/gemini-bounds-mainline-2026-11-16`.
- Candidate HEAD: `3cce7c749b197a771a9d018c022954b3dadaef7e`.
- PR base: `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Compared previous recorded default SHA `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b` to PR base SHA: 2 commits ahead, 0 behind. Compare response lists only Context Window documentation as changed, so the latest default-branch advancement is documentation-only relative to that old ref; the PR base SHA is the current default tip observed through GitHub PR metadata.
- Exact-head CI run `43871896948`, job `133314929863`: COMPLETED / SUCCESS. All seven job steps succeeded, including dispatch-disabled assertion, YAML parsing and pool contract/test validation.
- Formal PR reviews: 0; review threads: 0.
- Candidate source blob `9c5377f58de9dd8dabb4f05c72479fad1f10e033`; test blob `80f358197c2006105c902fd2d54c84f33e055d97`.

## Verified changes
- Fixed model allowlist contains only `gemini-2.5-flash`; environment override removed.
- Per-request SDK `AbortSignal.timeout(45_000)` passed to `generateContent`.
- Returned text is truncated to 8,000 characters and reports `outputTruncated`.
- Tests cover four distinct task envelopes, missing/duplicate credentials, API-key-shaped task rejection, model override rejection, timeout classification, output truncation, and no credential values in returned report.
- Validation workflow continues to assert dispatch disabled; this candidate does not change workflow permissions or dispatch settings.

## Review findings / residual risks
- Output truncation is applied only after `generateContent` returns its full response text. It bounds the returned report payload, but does not bound provider generation, SDK response materialization, network transfer, or peak memory. Add a provider-side output token cap where supported and retain a post-response character cap as a secondary guard.
- AbortSignal is client-side cancellation; it does not prove provider-side processing or billing stops at 45 seconds.
- `@google/genai` remains dynamically imported without `package.json` / `package-lock.json`; SDK install and actual SDK runtime remain NOT VERIFIED.
- `gemini-2.5-flash` being allowlisted does not establish free-tier availability for these accounts. No paid fallback is implemented, but quota/pricing eligibility and four separate account identities remain NOT VERIFIED.
- The controller remains a library/CLI candidate, not integrated with trusted owner-only Issue #96 admission, durable idempotency, repository-wide lease/fencing, crash recovery, or child-run reconciliation.
- No formal review, independent security review, or live four-account qualification.

## Disposition
PR #109 exact-head fake-client contract CI is VERIFIED. PR remains OPEN/DRAFT/UNMERGED. Four-account Gemini runtime and production dispatch remain NOT QUALIFIED. Issues #94/#96 remain OPEN. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next bounded step
Address the output-generation bound with a documented provider-supported max output token setting and tests; then pin the official SDK and lockfile and verify actual SDK behavior using fake transport/no provider calls. In parallel, continue the Cloud Pool-native Issue #96 admission/lease/fencing proof. Do not merge or enable dispatch until independent review, governance and runtime/account qualification are complete.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md