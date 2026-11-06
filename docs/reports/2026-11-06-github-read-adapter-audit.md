# Engineering report — 2026-11-06: GitHub read adapter audit and path hardening

## Objective

Perform one bounded Contour A pass: verify current cloud-pool/web-console evidence, inspect the new synthetic GitHub read adapter and OAuth compatibility proof, correct a concrete path-normalization weakness, and preserve a cross-chat checkpoint. No runtime activation or privileged execution.

## Immutable repository state

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Current observed default HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae` (compare endpoint base commit).
- Context working branch: `docs/github-context-window-2026-11-06`, based on the above SHA; one documentation commit ahead, zero behind at initial comparison. It is not merged/canonical.
- Existing context-window blob before this pass: `df506fb17ec1028eee6a58468c6a5f5b66c3f696`.

## Current controlling state

- Issue #22 (secure remote web console): OPEN. First Experience plane is browser-based and must work from iPhone and desktop. V1 is read-only, authenticated server-side, and has no browser-side dispatch.
- Issue #26 (account-isolated provider routing/quota ledger): OPEN / DESIGN REQUIRED / NOT IMPLEMENTED / NOT QUALIFIED. Provider calls remain disabled; credential values must not be copied or exposed.
- Issue #1 (pool governance): OPEN. Its body contains historical 2026-11-04 evidence; current ruleset and repository variable state were not independently re-read in this pass. Treat current governance/dispatch-variable state as NOT VERIFIED until rechecked.
- README on default branch reports Supervisor/Worker as scaffold / NOT RUN, DSH evaluation NOT RUN, Resource Probe NOT RUN and cloud runtime deployment NOT RUN. Dispatch must remain fail-closed; no dispatch was attempted.
- Cloudflare workers.dev namespace is previously recorded as provisioned, but Workers Free entitlement remains NOT VERIFIED; Worker scripts are absent and deployment NOT RUN.
- OAuth/session runtime remains NOT IMPLEMENTED. Protected API reads remain fail-closed; mutations rejected. No deployment.

## Web-console branch lineage and CI

Comparisons against current default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`:

| Work | Branch | Ahead | Behind | Disposition |
|---|---|---:|---:|---|
| PR #24 hosting/API docs | `docs/jarvis-web-experience-adr-2026-11-06` | 59 | 2 | DRAFT / UNMERGED / DIVERGED |
| PR #25 Hono prototype | `feat/jarvis-hono-web-prototype-2026-11-06` | 29 | 2 | DRAFT / UNMERGED / DIVERGED |
| PR #31 synthetic GitHub adapter | `feat/github-read-adapter-synthetic-2026-11-06` | 36 | 2 | DRAFT / UNMERGED / STACKED |

Do not merge these branches without reconciling their two-commit divergence from current default and preserving the stacked dependency order. Existing CI on an older base does not qualify a rebased or new head.

### PR #30 — OAuth protocol compatibility

- Branch: `proof/github-oauth4webapi-compat-2026-11-06`.
- Target SHA: `ad9f9ac598a2414b5209b6923094b16be64630ae`.
- Synthetic-only test uses pinned `oauth4webapi@3.8.8`, custom fetch handlers and fake credentials; it verifies PKCE S256, state mismatch rejection, form-encoded client_secret_post, token response processing and Bearer-authenticated synthetic `GET /user`.
- Run `42216422883`, job `127887461269`: COMPLETED / SUCCESS; all steps including synthetic test passed on job read-back.
- Independent reviews/threads: 0/0.
- Does not prove live GitHub token endpoint interoperability or implement callback/session/cookie/CSRF handling. Runtime OAuth NOT IMPLEMENTED.

### PR #31 — synthetic GitHub read adapter

- Branch head: `5470fccbc4a5fe80a750f402d70d703757fc4c1d`.
- Source blob: `97d49834085f9ad4466ffaeae76bb927fe322e3b`.
- Test blob: `a2ff0a846c62b61e58a9c4b2729434d6af8d6d99`.
- Run `42229917555`, job `127932882432`: COMPLETED / SUCCESS. All nine job steps were read back as successful.
- Adapter is GET-only, fixed to `https://api.github.com`, repository allowlisted, bounded by response size/timeout/page count, handles ETags/rate limits, projects explicit fields, rejects redirects, and validates projected links against exact `https://github.com` origin.
- It is synthetic-only and remains unmounted from the Hono Worker.
- Independent reviews/threads: 0/0. Deployment and live GitHub requests: NOT RUN.

## Security finding and bounded correction

Source review found `isSafeRepository` accepted dot path segments because its slug regex allowed `.` and `..`. WHATWG URL normalization can transform a path such as `/repos/../issues` before fetch, violating the intended fixed `/repos/{owner}/{repo}` resource boundary.

A focused correction was committed on a new isolated branch based on the immutable PR #31 head:

- Branch: `fix/github-read-adapter-path-segments-2026-11-06`.
- Parent target: `5470fccbc4a5fe80a750f402d70d703757fc4c1d`.
- Source commit: `073839e1d9bce303097aa95d1d664fbbcebf4ef9`; source blob: `9f4f9e5918e1c84fc8ad4b4f1369a92207394c63`.
- Test commit / branch head: `dee17350864cb49e8c5dd41cf61859d77d3affca`; test blob: `bd8ac8d97cdd673bb170a22d67ce08697cf46789`.
- Rejects owner or repository segments exactly equal to `.` or `..`; adds fixtures for `../issues`, `./repo`, `owner/..` and `owner/.`.
- Both files were fetched again from the branch and read-back verified.
- Exact-head CI: NOT VERIFIED. Local Node tests: NOT RUN (this execution environment could not resolve github.com for a fresh clone).
- PR creation did not complete; no PR ref exists. The branch is isolated, unmerged and unreviewed. Do not treat this correction as qualified.

## Safety and provenance

- No secrets, OAuth credentials, PATs, provider keys or token values were read or printed.
- No model/provider calls, dispatch, DSH, Resource Probe, deployment, browser session, paid resource or external server was used.
- No production workflow, repository variable, secret, issuer/capability boundary or governance setting was changed.
- No MediaHub OS / Contour B product implementation was started.

## Next bounded step

1. Obtain an authorized independent reviewer for PR #30/#31 and the stacked PR #25; the current connector identity has no independent review submissions.
2. Reconcile PR #24/#25/#31 against current default HEAD before any merge; re-run exact-head CI after any rebase.
3. Open and validate the path-segment correction as a stacked follow-up to PR #31; run exact-head tests and obtain independent review.
4. Re-read current ruleset and `POOL_DISPATCH_ENABLED` through an authorized read-only source before any runtime test. Keep dispatch disabled until governance acceptance.
5. Continue only the authenticated read-only web-console slice; do not deploy while OAuth/session, free entitlement, exact-head CI and independent review are unresolved.

Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.
