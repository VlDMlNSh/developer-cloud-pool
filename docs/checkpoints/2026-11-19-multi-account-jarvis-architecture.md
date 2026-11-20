# 2026-11-19 — Multi-account Jarvis architecture checkpoint

**Status: PLANNED / DOCUMENTED. Contour A remains BLOCKED / NOT ACCEPTED.**

## Owner requirement

Cloud Development Pool must support more than one account, initially two or three independent Jarvis instances, and allow future growth.

## Architecture decision

- Independent control plane per account: separate GitHub repository/deployment, Jarvis profile, authentication, memory/history, workspace, credentials, quota ledger, permissions and audit scope.
- Optional shared compute plane: common GPU workers only through authenticated tenant-aware gateway and scheduler.
- Shared GPU does not mean shared memory, prompts, media, results, credentials, authority or quotas.
- Per-tenant bounded queues and limits plus global weighted fairness; VRAM-aware model admission, residency/load costs, cancellation, retries and recovery.
- Tenant identity is distinct from repository ID, user identity, executor ID and capability profile; every job and evidence record must be tenant-bound and fail closed on mismatch.
- Golden Deployment Kit is a post-Contour-A deliverable; each deployment gets fresh identity, credentials, memory and quota mapping.

## GitHub records

- Architecture document: ../architecture/MULTI_ACCOUNT_JARVIS_SHARED_GPU_TARGET.md, blob acf84dad8ce6fcf36fa56baa33a80ed58bb8a2be.
- Tracking issue: #151 OPEN / PLANNED — https://github.com/VlDMlNSh/developer-cloud-pool/issues/151.
- Context Window update commit: cee28362ade2f517d2371969e3357a709d78906e; blob 44d47518abc30bf5a509a48eb037aa6b9f8751e2.
- Documentation branch: docs/next-2026-11-19-integrated-contour-pass, PR #145 OPEN/DRAFT/UNMERGED; not default/accepted production code.
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Scope and validation

- Documentation and issue only. No GPU provisioning, public endpoint, multi-tenant production schema, scheduler, second Jarvis deployment, provider calls, secrets access, paid resources, merge or dispatch.
- No tests or CI were run for this documentation-only pass.
- Contour A remains sole active priority and NOT ACCEPTED. Contour B remains DEFERRED.

## Next engineering step

Resume the Contour A D1 clean-base work from Pass 26: adapt atomic admission adapter and SQL end-to-end to executor-bound task identity v2; prove replay, concurrency, mismatch, rollback and revocation-race behavior; require exact-head CI and independent review. Do not start multi-account implementation until Contour A acceptance.
