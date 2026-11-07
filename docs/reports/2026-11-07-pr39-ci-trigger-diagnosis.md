# 2026-11-07 — PR #39 CI trigger diagnosis

**Pass time:** 2026-11-07 05:26 Europe/Vilnius  
**Disposition:** PR #39 remains OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED; independent review NOT RUN.

## Immutable target and repository state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD observed by compare: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`
- PR #39 branch: `proof/d1-claim-outbox-atomic-2026-11-07`
- PR #39 head: `f33f552f396e878e80a7f383e5436080cb668cb0`
- PR #39 base: PR #36 branch `proof/d1-single-use-ledger-retry-2026-11-06`, base SHA `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`
- PR #39 changed files: five, all confined to D1 proof README, migration 0002, package manifest, adapter and tests.
- Issue #38 remains OPEN.
- PR #39 reviews / inline threads: 0 / 0.

## CI diagnosis

Exact-head workflow-run query for `f33f552f396e878e80a7f383e5436080cb668cb0` returned an empty list. Combined commit status also returned an empty list. These results mean NOT VERIFIED.

Read-back of `.github/workflows/d1-ledger-proof-validation.yml` (blob `09b143c21d560d7eef93930da8f8f93bda378799`) shows:

- Trigger: `pull_request`
- Base-branch filter: `branches: ["Основной"]`
- Path filter includes `proofs/d1-ledger/**` and the workflow itself.
- The PR #39 target/base is not `Основной`; it is the PR #36 proof branch.

Therefore the existing workflow's base-branch filter excludes PR #39. This explains the absence of a run; it is not a passing test. The PR is intentionally stacked on #36, so changing its base to `Основной` would alter the review scope and risk bundling parent work. No retarget, manual dispatch, workflow change or merge was performed in this pass.

## Source review observations

- Parent migration 0001 creates `pool_approval_ledger`; migration 0002 creates claim/outbox tables and the AFTER UPDATE trigger.
- Migration ordering is lexically sequential under the configured migrations directory; the test harness reads the migration set and applies it via `applyD1Migrations`.
- Trigger conditions require the actual `ready -> consumed` transition and timestamp null-to-non-null. Trigger inserts claim and outbox in the same SQLite transaction.
- Adapter performs a conditional UPDATE and then reads the pair; all outputs retain `dispatch:false`.
- The workflow uses read-only contents permission, pinned checkout/setup-node/upload-artifact action SHAs, `npm ci --ignore-scripts`, syntax check and Workers-runtime tests.
- This is source inspection only. No local test execution, live D1 test, or production qualification occurred.

## Evidence and changed-file blobs

- Migration 0001: `a80524ed839b63dd6483978118619495fa550877`
- Migration 0002: `44b8f7e0658296d287269770c5e91b1c3e25973c`
- Adapter: `253bf5c6c9dcfca9c9c2666b21c1a77101766cba`
- Tests: `4711bb7a5186807d6618d6dc59af10809caec6f3`
- Test migration setup: `e1307208cc520a3399e66a937c3e0b05b71ac0f6`
- Wrangler config: `eb683b6bb838cb7a48741f900de6c17be7fdc0fe`
- Vitest config: `39bcf53a51180e7e5f309978e307e9964a2cc22e`
- Workflow: `09b143c21d560d7eef93930da8f8f93bda378799`
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38

## Actions and safety

No files in the product branch were changed. No workflow was manually dispatched. No secrets, credentials, provider/model APIs, Cloudflare resources or D1 databases were accessed. No deployment, Worker execution, DSH, Resource Probe or paid fallback occurred. Dispatch remains fail-closed.

## Next bounded step

Preserve PR #39's stacked base. Design a reviewable CI arrangement that validates the combined parent+child tree without changing PR scope—e.g. a dedicated workflow trigger/base strategy explicitly reviewed for this stacked branch, or a separate validation branch/PR based on the immutable PR #39 head. Then obtain exact-head Workers-runtime test evidence and independent security review before extending lease/fencing/recovery work.
