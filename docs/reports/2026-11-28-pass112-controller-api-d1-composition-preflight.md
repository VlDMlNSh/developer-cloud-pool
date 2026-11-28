# Pass 112 — Controller/API verifier/D1 composition preflight

Date: 2026-11-28

## Frozen target and scope
- Canonical default observed: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Pass 111 implementation branch: `feat/pass111-d1-attested-receipt-2026-11-27`.
- Pass 111 branch HEAD observed: `682b060ef376b8ebee8ae47872150776d28c4426`.
- Pass 111 code/test SHA: `88911e5a127b9345270b15da8e7cd3f8aa54293a`.
- Scope: read-only composition and ancestry preflight for Controller → API Verifier → attested D1; no production wiring, no dispatch, no execution authority.

## Reuse First
- Reuse PR #176 canonical read-only workflow `.github/workflows/next-event-controller.yml`.
- Reuse Pass 110 Workers-native envelope validator `verifyOwnerNextEnvelopeForActions`.
- Reuse Pass 111 D1 adapter `admitGitHubNextAttestedEvent`, migration 0018 and existing D1/Vitest harness.
- No new dependency, service, database, ledger or model provider.

## Findings
1. The canonical controller workflow file exists on the PR #176 candidate branch `feat/pass98-canonical-next-controller-audit-2026-11-25` (blob `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a`). It is read-only: permissions contents/issues/actions; it invokes `node scripts/owner-next-event-audit.mjs`; no D1 binding or admission call is present.
2. The same workflow path is NOT FOUND on Pass 111 branch `feat/pass111-d1-attested-receipt-2026-11-27`. The Pass 111 branch therefore cannot yet be treated as a composed controller implementation.
3. Pass 111 source imports the Workers envelope verifier and exports `admitGitHubNextAttestedEvent`, but also exports legacy `admitGitHubNextEvent` (flat synthetic context path). The legacy export is used by existing tests; production callsite status remains unproven because no production controller workflow is wired in this branch.
4. PR #181 is OPEN/DRAFT/UNMERGED. Its formal review list is empty and inline review thread list is empty.
5. Pass 111 CI re-read: Pool Contract run 45897059549 SUCCESS; D1 run 45897059595 SUCCESS. Reported D1 result is 9/9 test files and 137/137 tests, with merge-result checkout prefix `ac30d05`; it is not evidence of a same-run controller→API→D1 E2E.
6. Current canonical default remains `565404f84b6b86afb4dc2d8fa939341f42df6eca`. The default-branch Context Window itself is stale (last refreshed 2026-11-08); Pass 111's updated Context Window exists on its unmerged feature branch.

## Decision
- Controller/API/D1 composition: BLOCKED pending clean ancestry and workflow integration.
- Pass 111 D1 adapter + migration: previously VERIFIED by merge-result CI; not requalified by this pass.
- Same-run API read-back, workflow-file byte authenticity, default-ref race handling, production import-surface restriction and controller→D1 E2E: NOT VERIFIED / NOT IMPLEMENTED.
- Dispatch=false and executionAuthorized=false remain mandatory.
- No secrets read, hosted D1 writes, provider calls, executor dispatch, deployment, merge or production mutation.
- Gemini/Claude/ECC/FCC: NOT RUN. Independent security review: NOT RUN. Active engineering time: NOT MEASURED.

## Required next bounded pass
1. Reconcile PR #176–#182 ancestry and choose one canonical stack without merging.
2. Port the read-only controller workflow/API verifier into the same candidate branch as Pass 111's D1 adapter.
3. Construct the serialized Envelope v1 from same-run GitHub API read-backs (Issue, Comment, Run, workflow metadata and workflow-file bytes); compare immutable identifiers and byte digests.
4. Call only `admitGitHubNextAttestedEvent` from the non-dispatching path.
5. Remove legacy non-attested admission from production import surface while retaining explicit test-only compatibility coverage.
6. Add same-run end-to-end and substitution/replay tests; assert dispatch and executionAuthorized false on every exit.
7. Run exact-head and canonical-base merge-result CI; obtain independent security review. Do not merge.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
