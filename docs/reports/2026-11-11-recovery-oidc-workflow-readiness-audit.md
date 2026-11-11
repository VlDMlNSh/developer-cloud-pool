# GitHub Actions OIDC workflow-readiness audit — 2026-11-11

- Status: SOURCE VERIFIED / NO TOKEN REQUESTED / NO AUTHORITY GRANTED / DESIGN ONLY.
- Immutable source: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Audited workflow: `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Documentation branch: `docs/recovery-actor-component-fit-2026-11-11`.
- Scope: verify whether the current Supervisor workflow is presently configured to request GitHub Actions OIDC identity and whether that can be treated as a Recovery Grant issuer.
- Non-goals: requesting/decoding a live token, changing permissions, creating an issuer, reading secrets, dispatch, deployment, or runtime changes.

## Findings

1. The default-branch Pool Supervisor workflow currently declares workflow-level permissions `contents: read`, `issues: write`, and `actions: write`. It does not declare `id-token: write` at workflow or job level. Therefore this workflow is not presently configured to request an OIDC JWT.
2. The workflow is triggered by schedule, workflow_dispatch, issue events, and workflow_run. Any future trust policy must explicitly constrain allowed event/ref/workflow identities; it must not accept a broad repository-wide subject or arbitrary caller workflow.
3. GitHub's current OIDC reference says repositories created after 2026-07-15 use the immutable default subject form `repo:OWNER@OWNER-ID/REPO@REPO-ID:ref:refs/heads/BRANCH`. The documented JWT claims include repository/owner IDs and workflow/run identity fields. This project repository was created 2026-11-04; the expected default-branch subject is therefore `repo:VlDMlNSh@157891068/developer-cloud-pool@1445644538:ref:refs/heads/Основной`. This is a documentation-derived expectation, not a live token or customization-setting read-back.
4. GitHub requires `id-token: write` to request a job JWT. This permission only permits requesting the OIDC token; it does not grant other resource write access. No permission change is justified until the issuer trust policy and accountable issuer/key-custody/audit owners are accepted.
5. OIDC is a signed workload identity assertion only. It does not issue the consumer-specific Recovery Grant, maintain authoritative revocation state, atomically consume a nonce with the D1 transition, or provide the required R-06 audit transaction.
6. The existing issuer/time contract correctly prohibits treating an actor string, workflow identity, static secret, or D1 binding as issuer authority. Keep the distinct `projection-outbox-recovery` audience and exact outbox/attempt/generation/operation binding.

## Disposition

- GitHub Actions OIDC: REUSE CANDIDATE FOR WORKLOAD AUTHENTICATION ONLY; NOT ENABLED IN THE SUPERVISOR; NOT A RECOVERY GRANT ISSUER.
- Do not add `id-token: write` to the current Supervisor.
- Do not request or decode a live OIDC token for debugging; the project has no accepted issuer trust policy or operational issuer owner.
- Keep Recovery Actor NOT IMPLEMENTED / NOT QUALIFIED and dispatch FAIL-CLOSED.
- Remaining blockers: accepted named issuer operator, principal authentication policy, key custody/rotation/revocation, subject registry, trusted-time source, private audit sink/operator, privacy retention/legal approval, recovery quorum, and independent security review.

## Sources

- Workflow source blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- GitHub OIDC reference: https://docs.github.com/en/actions/reference/security/oidc
- GitHub OIDC concepts and claim inventory: https://docs.github.com/en/actions/concepts/security/openid-connect
- GitHub OIDC REST customization endpoint: https://docs.github.com/en/rest/actions/oidc

No source/runtime/schema/permission/workflow/secret/dispatch/deployment/resource/merge change was made. No live token or secret was accessed.

- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
