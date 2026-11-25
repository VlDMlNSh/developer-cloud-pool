# Pass 92 checkpoint — 2026-11-25

- Frozen current default SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Created clean staging branch `integration/pass92-d1-clean-base-565404f` from that exact SHA. No changes/commits on branch.
- PR #170 D1 candidate head `40281787c208af2df916f10af1dba073061ff0d3`; PR #111 head `687196738782432797bf394f1342cb9df19f478f`.
- 35/35 changed paths from PR #170 absent on current default.
- Migration overlap: #111/#170 migrations 0002–0005 are identical. README, migration 0001, package.json, worker differ. Migration 0006 is a collision: #111's lease guard vs #170's projection outbox. PR #170 later includes lease/fencing in migration 0014. Do not overlay or renumber.
- PR #114/#125 use separate `proofs/d1-admission` ledger; do not introduce a second admission authority.
- Reuse PR #170 as canonical D1 candidate, Cloudflare Workers Vitest/Miniflare harness and pinned deps. API verifier from PR #174 must later be composed as trusted event envelope; Pass 91 gap remains.
- Base-preserving Git tree write not completed: available commit reader omits tree SHA. Creating a tree without base_tree_sha would replace repository root tree, so it was not attempted.
- Existing PR #170 CI 123/123 and Pool Contract PASS are old-head candidate evidence only, not current-base proof. No new CI run.
- No runtime code/schema change, hosted D1, dispatch, secrets, provider calls, deployment, merge, production write or governance mutation.
- Current ruleset and POOL_DISPATCH_ENABLED NOT VERIFIED. Gemini NOT RUN; Claude/ECC/FCC NOT RUN; independent review NOT RUN; active time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: obtain base tree SHA through approved Git object read path; create one base-preserving commit importing reviewed PR #170 file set; verify tree/diff/parent; open draft PR for exact-head D1 and Pool Contract CI.
- Report: ../reports/2026-11-25-pass92-clean-base-d1-lineage-audit.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
