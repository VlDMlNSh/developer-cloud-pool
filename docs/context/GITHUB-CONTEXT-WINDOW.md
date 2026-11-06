# GitHub Context Window — Developer Cloud Pool

Last refreshed: 2026-11-06 15:01 (UTC+3)

## Canonical scope and priorities
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Current phase: Contour A — Cloud Development Pool. Product priority is secure remote web console on iPhone/desktop; native iOS media assistant and external servers remain later phases.
- Default branch: `Основной`; observed HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Repository metadata reports default branch `protected=false`; effective ruleset enforcement is NOT VERIFIED. Do not infer governance from repository settings alone.
- Canonical documentation continuation branch: `docs/cross-chat-continuation-2026-11-06` (PR #27, OPEN/DRAFT/UNMERGED). It is not the canonical default branch and must not be merged without review/governance gates.

## Current state
- README: 20-slot architecture DESIGN; Supervisor/Worker scaffold NOT RUN; DSH evaluation and runner resource probe NOT RUN; deployment NOT RUN; general agent execution and durable checkpoint/resume NOT IMPLEMENTED.
- Web console: Issue #22. PR #24 hosting/API ADR OPEN/DRAFT; current head `d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6`. PR #25 Hono prototype OPEN/DRAFT; current head `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`. OAuth/session, live GitHub adapter, deployment and browser/iPhone QA NOT IMPLEMENTED/NOT RUN. Keep protected reads fail-closed.
- Cloudflare: workers.dev namespace previously provisioned; Workers Free entitlement NOT VERIFIED; no Worker deployment. No payment workaround, paid fallback or deployment while entitlement/auth are unresolved.
- Model routing: Issue #26. PR #28 account-isolated routing design OPEN/DRAFT, head `c07e3442a54fabdb74431f00cbbcd9d75280b01b`. PR #29 quota-ledger/slot admission implementation OPEN/DRAFT, head `34fc78921b16359d136db553d8a51b4a4716995d`; exact-head Pool Contract Validation run 42211525076/job 127871048179 SUCCESS. Formal review empty; NOT independently reviewed or qualified.
- Context persistence: PR #27 OPEN/DRAFT, head `683178e56c5f3fb51d1559053c5069d24c0a48c3`; exact-head status/runs empty = NOT VERIFIED.
- Account/credential isolation: never equate different key names with different provider quota domains; require account/project-level evidence. No secret values or secret-presence metadata inspected.

## Governance and safety
- Pool dispatch remains BLOCKED / fail-closed; do not set `POOL_DISPATCH_ENABLED`, invoke Worker/Supervisor/DSH, or use provider/model routes.
- No secrets, OAuth credentials, provider keys, privileged tokens or private keys in browser/artifacts/logs. No paid resources or payment onboarding workaround.
- No merge/deployment/qualification without exact-head CI, effective governance, independent security review and evidence.
- Distinguish design, implementation, CI success, runtime execution, qualification and acceptance.

## Key links
- README: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md
- Web console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- PR #25: https://github.com/VlDMlNSh/developer-cloud-pool/pull/25
- PR #27: https://github.com/VlDMlNSh/developer-cloud-pool/pull/27
- PR #28: https://github.com/VlDMlNSh/developer-cloud-pool/pull/28
- PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- Detailed checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/checkpoints/2026-11-06-cross-chat-continuation.md
- Latest report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-06-cross-chat-continuation-report.md

## Next step
Inspect PR #25 OAuth/session and fixed-origin GitHub adapter gap against PR #24 contracts; run a synthetic no-secret OAuth protocol compatibility test or prepare independent security review evidence. Maintain fail-closed behavior. Do not deploy until auth, independent review and free-tier hosting entitlement are verified.


## Live refresh — 2026-11-06 15:17 UTC+3 — OAuth compatibility proof

- Refreshed PRs #24, #25, #27, #28, #29 and #30. #24/#25/#27/#28/#29 remain OPEN / DRAFT / UNMERGED. PR #30 is OPEN / DRAFT / UNMERGED and correctly stacked on PR #25's feature branch to avoid duplicating the prototype diff.
- PR #25 remains at `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`; PR #30 parent/base SHA is exactly that commit. PR #30 verified head: `ad9f9ac598a2414b5209b6923094b16be64630ae`; 3 files changed.
- Added isolated synthetic proof-of-fit for `panva/oauth4webapi@3.8.8`: authorization response state validation/mismatch rejection; PKCE S256 generation; form-encoded `client_secret_post` with client_id/client_secret/code/redirect_uri/code_verifier; token response processing; Bearer-authenticated synthetic `GET https://api.github.com/user` returning a synthetic numeric ID.
- Exact-head run `42216422883`, job `127887461269`, COMPLETED / SUCCESS. Job log read-back confirms 1 test passed, 0 failed. The initial run `42216355398` failed only because of a malformed regular-expression assertion; the syntax was corrected and the successful run tested the corrected head. No live GitHub OAuth/API requests were made: the test substitutes customFetch synthetic responses.
- PR #30 review submissions: 0; independent security review NOT RUN. Combined commit status array empty; named workflow run is the positive exact-head evidence. Keep PR #30 draft/unmerged pending review.
- `oauth4webapi` remains NOT ACCEPTED as a production dependency; the test installs it only in CI without saving it to package manifests/lockfile. No OAuth callback, state persistence, session store, owner-ID authorization, or production GitHub adapter was implemented. Protected routes remain 503; mutation routes 405.
- GitHub OAuth source contract checked: state, PKCE S256, temporary authorization code, token exchange form fields, and authenticated `/user` identity revalidation. This synthetic test does not prove live GitHub interoperability or qualify production authentication.
- PR #27 context branch current head is `d849b51349cc70c0f429e695ece3b9974d585130`; its CI remains NOT VERIFIED. PR #28 head `c07e3442a54fabdb74431f00cbbcd9d75280b01b`; PR #29 head `34fc78921b16359d136db553d8a51b4a4716995d` with prior exact-head contract run `42211525076` SUCCESS.
- No secret values or secret-presence metadata accessed; no dispatch, provider/model request, paid resource, deployment, merge, or live OAuth transaction occurred.

## Next bounded step

Build a fixed-origin, read-only GitHub REST adapter with synthetic tests for repository allowlisting, bounded pagination/response sizes, ETag/cache behavior, timeout/rate-limit handling, and strict response minimization. Keep it unmounted from protected routes until OAuth/session implementation and independent security review pass. Continue to verify the hosting free entitlement without payment changes; do not deploy.
