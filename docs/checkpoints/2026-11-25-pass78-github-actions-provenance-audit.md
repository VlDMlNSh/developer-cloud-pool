# Pass 78 checkpoint — 2026-11-25

- Frozen default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #170 head: `cfd123a6e622a71454b42a0314f9dee981ca5035`; exact synthetic CI merge: `ab6ecf709c4c5f96912b7160caa348b8c89ce518`.
- PR #171 head: `423da55ca1e2d91c28572f88f60b494b59d56e9e`.
- Binder correctly keeps `context.sha` as target SHA and `context.workflowSha` as workflow-code SHA; explicit unit test accepts distinct values.
- Binder expects `next-event-controller.yml@refs/heads/Основной`; no such workflow exists on default. PR #171 is a separate audit-only `next-request-intake.yml` probe and must not be conflated with the controller.
- Actual Actions-context-to-D1 mapping remains NOT VERIFIED; tests currently inject synthetic context.
- PR #170 CI: D1 116/116 and Pool Contract SUCCESS; PR #171 Pool Contract SUCCESS. Both PRs remain draft, unmerged, with zero formal reviews/threads.
- Ruleset 26550182 active; branch API says protected=false; effective Contents-API enforcement NOT VERIFIED.
- No code/runtime/workflow/schema/dependency changes; no secrets, dispatch, provider calls, hosted D1, deployment, merge or production mutation.
- Active engineering time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: specify and test trusted GitHub Actions context mapping for the eventual single canonical no-dispatch controller; preserve dispatch=false.
- Full report: `docs/reports/2026-11-25-pass78-github-actions-provenance-audit.md`.
