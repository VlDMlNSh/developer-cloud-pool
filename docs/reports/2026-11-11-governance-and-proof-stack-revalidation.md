# Governance and proof-stack revalidation — 2026-11-11

## Scope and immutable references

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`
- Documentation branch: `docs/projection-stack-reconciliation-2026-11-11`
- PR #66 head before this report: `7d59328e090582e9cae0b2e247c87d25ca539ff2`
- No source/runtime, schema, workflow, permission, secret, dispatch, hosted-resource, deployment or merge changes were made.

## Governance

Active repository ruleset:
- ID: `26550182`, name `Основной — verified`, enforcement `active`.
- Applies to `refs/heads/Основной`.
- Prohibits branch deletion and non-fast-forward updates.
- Requires changes through pull requests and resolution of review threads.
- Requires 0 approving reviews; no bypass actors.
- The branch-protection endpoint itself reports `protected:false` and required status checks disabled. This does not negate the active ruleset; ruleset is the operative protection evidence.
- Independent review remains a project acceptance criterion and is not guaranteed by GitHub's zero-approval threshold.

## Pull request ancestry and CI

All compares use immutable base `221f216c00ca7e5596bcc682ba185ad155a10603`.

| PR | Head | Compare | Exact-head Actions evidence | Review |
|---|---|---|---|---|
| #58 | `5caeb60f7a45d836c6ad1eea2fb86e20995da025` | 141 ahead / 62 behind; diverged | run `43043284086`, job `130600450879`, completed success | 0 reviews / 0 threads |
| #59 | `22200226da4f1af30645cf441a639db6893e9310` | 147 ahead / 62 behind; diverged | run `42981807825`, job `130393715595`, completed success | 0 reviews / 0 threads |
| #65 | `3d67783e4da60296f26547174b0bdeae58d9a3f2` | 4 ahead / 7 behind; diverged | no exact-head Actions runs | 0 reviews / 0 threads |
| #66 | `7d59328e090582e9cae0b2e247c87d25ca539ff2` | 9 ahead / 0 behind at recheck | no exact-head Actions runs | 0 reviews / 0 threads |

PR #58 and #59 runs are local Workers-runtime D1 adversarial test jobs. They are not hosted D1 qualification, live GitHub API qualification, or production deployment evidence. Their success is evidence for their isolated proof heads only. Both source stacks remain heavily diverged from current default and must not be merged/rebased wholesale.

PR #65 remains an open draft hosted-D1 qualification documentation plan, but it is 7 commits behind current default and has no exact-head Actions run or independent review. It does not authorize hosted resource creation.

PR #66 remains open/draft. Its diff against current default is exactly three documentation paths, 147 additions, zero deletions. It is current-base clean at this recheck; exact-head CI and independent review remain NOT VERIFIED / NOT RUN.

## D1 proof harness integration decision

Current default recursive tree has 47 entries and contains no `proofs/d1-ledger/**`, `package.json`, `vitest.config.ts`, D1 migrations, or Workers/D1 test harness.

PR #58 contributes the initial local D1 proof project (28 changed paths in its full compare, including migrations 0001–0006, source modules, tests, package lock, Vitest config and Wrangler config). PR #59 adds migrations 0007–0008 and retry/dead-letter behavior. The full stack is not a single safe source-file transplant.

Before code integration, produce a file-by-file transplant manifest covering:
1. Package and lockfile ownership; merge root/project scripts without dropping existing scripts.
2. Ordered migration set 0001–0008 and schema compatibility.
3. Source/test/config file set and exact dependencies.
4. Workflow trigger branch filters and path filters as a union, preserving existing proof branches.
5. Receipt-bound acknowledgement contract: outbox/event ID, digest, delivery lease generation, verified projection state; issue receipt only after final GitHub read-back; validate it at the conditional D1 acknowledgement boundary.
6. Existing unresolved fifth-lease orphan recovery and issuer/trusted-time boundary; do not weaken fencing or invent authority.

Do not start hosted D1 qualification until all explicit plan gates are met, including owner authorization for one named test-only database/Worker and verified account-specific Free entitlement. No secret values should be read or copied.

## Mature component check

The prior Ledgerline review remains relevant as an architecture reference for transactional outbox and read-model reconciliation. Its Durable Objects authority model is not a drop-in replacement for this D1 lease/fencing design. No new dependency adopted. No directly matching stable drop-in D1 outbox project was identified in the GitHub repository search pass.

## Status and next step

- Governance ruleset: VERIFIED.
- PR #58/#59 isolated local proof CI: VERIFIED at the exact heads above.
- PR #65 exact-head CI/review: NOT VERIFIED / NOT RUN.
- PR #66 exact-head CI/review: NOT VERIFIED / NOT RUN.
- Complete current-default D1 integration: NOT IMPLEMENTED.
- Hosted D1 / Worker: NOT AUTHORIZED / NOT RUN.
- Recovery Actor issuer and trusted-time qualification: BLOCKED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: produce the file-by-file transplant manifest from exact PR #58/#59 patches and current-default tree, including package scripts, migration order, workflow filter union, tests, and explicit exclusions. No branch mutation or runtime integration until the manifest passes independent review.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
