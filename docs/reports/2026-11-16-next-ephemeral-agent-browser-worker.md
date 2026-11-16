# /next report — ephemeral agent-browser worker implementation

**Date:** 2026-11-16  
**Base SHA:** `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`  
**Branch:** `feat/agent-browser-ephemeral-worker-2026-11-16`

## Scope and changes

- Added allowlisted `agent-browser-headless` profile to `.github/workflows/pool-worker.yml`.
- Added isolated `browser` job on GitHub-hosted `ubuntu-24.04`, with `permissions: {}`, no repository checkout, no provider secrets, Node.js 24.9.0 and `agent-browser@0.43.0` pinned.
- Browser job installs Chrome for Testing and Linux dependencies, loads core and optional dogfood skills from the CLI, performs only a hard-coded public `example.com` smoke test, hashes screenshot/skill inventory and closes the session.
- Existing DSH profile remains separately gated; report job reconciles either probe result.
- Updated pool task issue form to expose the new browser profile.
- Extended pool contract validator to check profile allowlist, no-token/no-secret browser job, exact CLI pin, skill loading, fixed smoke URL and cleanup.
- Added architecture decision distinguishing ephemeral GitHub-hosted jobs from persistent interactive sessions.

## Security boundaries

Browser job receives no GitHub token permissions and no repository/provider secrets. It does not execute task code or accept arbitrary URLs/commands. Only the separate report job retains issue-write permissions. Dispatch gate remains fail-closed; this PR does not trigger or authorize a worker dispatch.

## Verification status

- Pool Contract Validation run `43836984368`, job `133195965481`, exact head `60ac5400fd0e73846f8ff72bb910800dcc73b442`: COMPLETED / SUCCESS. YAML parse, dispatch-disabled guard and pool security-contract validator all passed.
- Browser installation/runtime smoke: NOT RUN (workflow_dispatch only; no owner-approved task dispatched).
- Independent PR reviews: 0; PR remains draft and unmerged.
- Persistent interactive dashboard / long-lived session: NOT IMPLEMENTED.
- Unlimited free capacity: NOT VERIFIED; GitHub Actions minutes, concurrency and job-duration limits apply.
- No physical device, self-hosted host, paid VM or provider used.

## Next step

Obtain independent security review, then after governance/approval perform one bounded browser-profile smoke dispatch. Only after that run is verified should the profile be considered qualified for bounded headless browser QA.
