# Engineering report — 2026-11-06: OAuth architecture contract consistency

## Scope and immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Documentation branch: `docs/jarvis-web-experience-adr-2026-11-06`
- Base: `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Work limited to documentation and API contract text. No runtime code, secrets, OAuth application, Cloudflare configuration, billing, deployment, or dispatch changed.

## Finding

The latest checkpoint and OpenAPI scheme had already moved away from Cloudflare Access to an application-issued `__Host-jarvis_session` cookie because Access onboarding requires payment details the owner cannot provide. However, the hosting ADR still described Access JWT validation, and the OpenAPI 401 response still named an Access assertion. This was a material architecture/contract inconsistency and could misdirect implementation.

## Changes

1. Replaced the ADR's Access-JWT authentication section with a server-side GitHub OAuth and application-issued opaque session model:
   - single-use state bound to a short-lived pre-auth cookie;
   - server-side code exchange and immutable numeric GitHub user-ID lookup;
   - exact owner-ID allowlist;
   - `__Host-jarvis_session` Secure/HttpOnly/SameSite/host-only cookie;
   - server-side expiry/revocation and per-request validation;
   - GET-only API, same-origin policy, fixed upstream allowlist and bounded requests;
   - explicit NOT IMPLEMENTED / fail-closed status until tests and independent review.
2. Corrected the OpenAPI 401 response description to refer to missing, invalid, expired or revoked application sessions.
3. Preserved Cloudflare Access as disabled/not required; no payment workaround or paid fallback was introduced.

## Evidence

- ADR update commit: `a2590fde257b3ab9d52044f3f9114b664383c543`; new blob: `45f759ede025bb9c98e3f471c1398fe3b2ce931c`.
- OpenAPI update commit: `b0d5a3a16c80c423cac0f5e553859a9bc83fb18c`; new blob: `2b45f7db2e84c4585cf05b515f9bdd01fa4adc4b`.
- Both writes returned successful GitHub Contents API commit/blob identifiers. Independent read-back completed: ADR blob `45f759ede025bb9c98e3f471c1398fe3b2ce931c`, OpenAPI blob `2b45f7db2e84c4585cf05b515f9bdd01fa4adc4b`, checkpoint blob `308fc8624ca8a9184d3e73f3c772ab19fa0b954f`, and report blob `c7321038edf13ed5d8fb66fe28ea5719d75ac13e` were read back from the PR branch. The ADR and OpenAPI no longer contain Access-JWT/Access-assertion auth requirements; historical checkpoint references are superseded by the appended correction.
- Prior observed PR #24 head: `796299477b804edeb1af3b74e1caec9254791e13`, 18 ahead / 0 behind base. This update advances the branch; exact new head is to be re-read.
- PR #24 formal reviews and inline review threads: 0 / 0 at last query. Exact-head CI: NOT VERIFIED.
- PR #25 remains OPEN/DRAFT/UNMERGED; implementation CI was successful on implementation SHA `3252e9a5e361cc75ecde3991f30193e39c3768dc`, not the documentation successor. No independent reviews.
- Cloudflare workers.dev namespace is recorded as provisioned; Worker scripts are empty; Workers Free entitlement remains NOT VERIFIED because Billing Read is unavailable.
- OAuth app credentials and implementation: NOT CONFIGURED / NOT IMPLEMENTED. Deployment: NOT RUN. Production dispatch: BLOCKED / FAIL-CLOSED.
- Gemini controller workflow is absent from the default-branch workflow tree; Gemini dispatch NOT RUN.

## Next step

Read back the updated ADR/OpenAPI/checkpoint/report and verify blob SHAs. Then validate OpenAPI 3.1 with a pinned parser and implement only a no-secret local OAuth/session fixture with negative tests. Do not create OAuth credentials, deploy, or enable protected routes before exact-head CI, independent security review, verified no-cost hosting entitlement and explicit owner authorization.


## Final verification — 2026-11-06

- Latest branch HEAD after this report/checkpoint sequence: `03561bde8238a70af89fd733e5c594f3fc58ab7a`.
- Compare against base `64d2636d4500127e635c214ccfb722c6b3fcda80`: 32 ahead / 0 behind.
- Updated ADR/OpenAPI/checkpoint/report were read back; blob SHAs are recorded above and in the checkpoint.
- Exact-head CI query returned no PR-triggered workflow runs for the documentation-only HEAD; exact-head CI remains NOT VERIFIED, not PASS. No independent reviews or review threads are present (0/0).
- No code changed in this pass. Authentication implementation and OAuth credentials remain NOT IMPLEMENTED / NOT CONFIGURED; Workers Free entitlement NOT VERIFIED; deployment NOT RUN; production dispatch BLOCKED / FAIL-CLOSED.
