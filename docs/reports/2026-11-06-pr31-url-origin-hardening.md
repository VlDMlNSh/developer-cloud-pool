# PR #31 exact-origin URL validation hardening — 2026-11-06

## Scope and immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Working branch: `feat/github-read-adapter-synthetic-2026-11-06`.
- Previous reviewed head: `907bf6c819bf0744473dfc96027fedc3a82e475a`.
- New head after focused source and test commits: `5470fccbc4a5fe80a750f402d70d703757fc4c1d`.
- Scope is limited to URL projection in the isolated, synthetic-only GitHub read adapter.

## Finding
The three projected `html_url` values (repository, issue, workflow run) used `startsWith("https://github.com/")`. This accepts lookalike hosts such as `https://github.com.attacker.example/path`, so an upstream field could become a misleading external link in a future UI.

A formal `REQUEST_CHANGES` review was attempted but GitHub rejected it because the connected account is the PR author. The finding was therefore recorded as a PR conversation comment (comment ID `6686543110`). This is not an independent review.

## Change
- Added shared `isGitHubHtmlUrl` validation.
- Parse with `URL`; require protocol `https:`, exact origin `https://github.com`, and no username/password.
- Replaced all three prefix checks with the shared validator.
- Added a regression test covering repository, issue and workflow-run projections against:
  - lookalike host `https://github.com.attacker.example/path`;
  - credentialed URL `https://user@github.com/...`;
  - non-HTTPS URL `http://github.com/...`.
- Existing valid GitHub URL fixture remains in the repository projection test.

## Read-back evidence
- Source commit: `ef91ad75738e1bf2f9d89b66d3767b8adcb2fe17`.
- Source blob: `97d49834085f9ad4466ffaeae76bb927fe322e3b`.
- Test commit / final branch head: `5470fccbc4a5fe80a750f402d70d703757fc4c1d`.
- Test blob: `a2ff0a846c62b61e58a9c4b2729434d6af8d6d99`.
- Both files were fetched again from the feature branch; helper presence, removal of all old prefix checks and regression fixture presence were verified.

## Verification and boundaries
- Exact-head CI for `5470fccbc4a5fe80a750f402d70d703757fc4c1d`: **NOT VERIFIED**; commit workflow-run lookup returned an empty list at the time of this report.
- Local test execution: **NOT RUN** in this pass.
- Independent review: **NOT RUN**. Formal review submission is unavailable from the PR-author identity; an external reviewer is still required.
- PR #31 remains unmerged; the adapter remains unmounted from the Hono Worker.
- No live GitHub API request, OAuth credential, secret, provider/model call, dispatch, deployment, browser test or paid resource was used.
- No Supervisor/Worker/DSH execution was started. Dispatch remains fail-closed.

## Next step
Recheck exact-head CI on `5470fccbc4a5fe80a750f402d70d703757fc4c1d`; if it passes, request an authorized reviewer who is not the PR author. Do not mount or merge the adapter until exact-head CI, independent review and governance gates are satisfied.

Contour A: **NOT ACCEPTED**. Contour B: **DEFERRED**.
