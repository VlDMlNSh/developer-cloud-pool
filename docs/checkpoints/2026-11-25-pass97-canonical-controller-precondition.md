# Pass 97 checkpoint — canonical controller precondition

- Date: 2026-11-25.
- Default SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #175 D1 head: `3d69bc943677dba909792bf4930d4c0aa5d2233f`; PR #174 API-audit head: `a8809c1dc8c2eaa49944fb031baeec54ce46b922`. Both OPEN/DRAFT/UNMERGED.
- Verified `.github/workflows` at default SHA and PR #175 branch. `next-event-controller.yml` is absent at both refs; direct file fetch returned 404.
- Migration 0017 and binder pin a workflow identity that does not exist at inspected refs. PR #174's `owner-next-event-audit.yml` is a separate audit-only workflow returning OBSERVED_ONLY.
- Decision: no isolated attestation integration or migration patch until the canonical controller exists. Create one canonical workflow on clean current-default branch, API-readback in same run, then bind workflow ID/path/ref/code SHA to D1. Recheck default ref before admission. Reruns remain fail-closed pending durable reconciliation.
- PR #175 CI runs: D1 `45690428935` SUCCESS; Pool Contract `45690428805` SUCCESS; combined status contexts empty / NOT VERIFIED; reviews/threads 0/0.
- Ruleset `26550182`: PR required; no bypass; 0 approvals; review-thread resolution required.
- No code/schema/workflow/dependency changes, local tests NOT RUN, no D1 writes/webhook/dispatch/provider/deployment/merge/production writes. Gemini NOT RUN; Claude/ECC/FCC NOT RUN; independent security review NOT RUN.
- Active time NOT MEASURED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Report: [Pass 97](../reports/2026-11-25-pass97-canonical-controller-precondition.md).
- Next: implement canonical controller workflow plus same-run API-attestation, then integrate D1 with stale-ref/replay/substitution tests.
- MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
