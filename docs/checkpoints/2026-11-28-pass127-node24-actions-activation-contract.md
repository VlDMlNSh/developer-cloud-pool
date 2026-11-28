# Pass 127 checkpoint — Node 24 action pins and issue_comment activation contract

Date: 2026-11-28

- Starting branch: `feat/pass124-readonly-owner-next-controller-2026-11-28`.
- Pass 127 final observed commit: `398bc48065a6d0e034cb610cf11e13c995c3804f`.
- Default branch `Основной` remains at `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #188 remains OPEN / DRAFT / UNMERGED; formal reviews 0; inline threads 0.
- Updated controller actions to Node24-native immutable SHAs:
  - checkout v7.0.1: `3d3c42e5aac5ba805825da76410c181273ba90b1` (MIT; exact release action.yml says node24; GitHub release page reports verified signature).
  - setup-node v7.1.0: `949feb2413d6458794dcd2491c4babbbce0c15c1` (MIT; exact release action.yml says node24; GitHub release page reports verified signature).
- setup-node now explicitly sets `package-manager-cache: false`.
- Added default-branch issue_comment activation contract and machine-checked test/validator assertions. GitHub docs require workflow file on default branch; current default branch Contents read is NOT_FOUND.
- Preserved issue_comment-only trigger, owner/Issue #96 admission, read-only permissions, workflow_sha checkout, no persisted credentials, dispatch=false and executionAuthorized=false.
- Latest Pass 127 workflow-run lookup returned no runs; exact merge-result CI NOT VERIFIED. Pass 126 CI evidence does not apply to this new SHA.
- Local tests NOT RUN. Independent security review NOT RUN. Effective ruleset and dispatch-variable metadata NOT VERIFIED.
- No secrets, hosted D1, provider calls, dispatch, executor, deployment, merge, production mutation, new dependencies or paid resources.
- Active engineering time NOT MEASURED; performance benchmark NOT RUN.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Report: `docs/reports/2026-11-28-pass127-node24-actions-activation-contract.md`
Activation contract: `docs/architecture/OWNER-NEXT-ISSUE-COMMENT-ACTIVATION-CONTRACT.md`
Context Window: `docs/context/GITHUB-CONTEXT-WINDOW.md`
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
