# Pass 57 checkpoint — legacy claim-path SQL bypass remediation

Date: 2026-11-23
**VERIFIED — local D1 remediation and exact merge-result CI / PR #170 DRAFT / CONTOUR A NOT ACCEPTED**

## Frozen refs
- Default `Основной`: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #170 head: `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`.
- PR #170 base: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Synthetic merge SHA: `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.
- Compare: 10 ahead / 0 behind; 34 files; +7,074 / -0.
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170

## Finding and fix
- Confirmed legacy `pool_task_claims` and `pool_task_outbox` remained directly writable after their canonical approval-keyed trigger was removed.
- Added migration 0016 with six INSERT/UPDATE/DELETE guards across both retired tables; preserves historical rows and all previous migration IDs.
- Extended baseline tests to execute denied INSERT, UPDATE and DELETE; staged upgrade still starts at schema 0010 and applies 0011–0016.
- README now documents the sealed legacy path.

## Exact merge-result evidence
- D1 run 45260394194 SUCCESS: clean npm ci (159 packages), `npm run check` PASS, 6 test files and 75/75 tests PASS; Vitest 3.16s.
- Pool Contract run 45260394177 SUCCESS: dispatch false, all six workflows parse, security contract checks PASS.
- Both logs checked out `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.

## Governance and safety
- PR #170 OPEN / DRAFT / UNMERGED; formal reviews 0, threads 0.
- Ruleset 26550182 active; PR required, 0 mandatory approvals, no bypass actors.
- No dispatch, secrets/metadata inspection, provider calls, hosted D1, deployment, merge or production mutation.
- Real GitHub event provenance, production clock/authenticator/verifier, hosted D1, UI, routing, quotas and worker execution remain NOT VERIFIED.

## Next
Pass 58: inspect/reconcile historical owner-only `/next` event-envelope validator from PR #112 and composition candidate #125 against Issues #96/#140 and current default. Reuse the strongest predicate, avoid parallel admission authority, and keep controller non-dispatching.

Detailed report: [Pass 57 report](../reports/2026-11-23-pass57-legacy-claim-path-sql-bypass-audit.md)
Canonical links: [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) · [PR #112](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112) · [PR #125](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125) · [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140) · [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) · [MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)