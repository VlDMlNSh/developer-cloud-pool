# Recovery Issuer governance and mature-component feasibility audit

- Date: 2026-11-11
- Status: RESEARCH SUCCEEDED / GOVERNANCE BLOCKED / DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED
- Immutable base: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- Working documentation branch: `docs/recovery-actor-component-fit-2026-11-11`
- Scope: verify the current authority-governance evidence, GitHub Actions OIDC suitability, mature GitHub component fit, and PR/CI state for the Recovery Actor prerequisite.
- Non-goals: live OIDC token request, secret/credential access, issuer deployment, runtime/schema/permission/workflow changes, dispatch, hosted-service provisioning, or merge.

## 1. Current Cloud Pool refs and governance

- Default branch HEAD: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #63 is OPEN / DRAFT / UNMERGED, head `fde6f7c14ec63da92a145c30ef6795331cc314aa`, base default `6fdcedebeba62715122e43a75c6ad6d926321ce7`; compare: 2 ahead / 0 behind, exactly two documentation paths (Context Window + component-fit report), no deletions.
- PR #63 exact-head workflow query returned no PR-triggered runs: CI NOT VERIFIED. Formal reviews: 0; inline review threads: 0. PR metadata says mergeable=true; this is not acceptance.
- PR #60 remains OPEN / DRAFT / UNMERGED. Its design head `04fcf8868a086b9f58c10fdc076aef0b7170d5f2` compares against current default as DIVERGED, 2 ahead / 16 behind, merge base `864213e2ff5b4fa956ba405dea8137a44d812f49`. Formal reviews: 0; inline threads: 0.
- Active ruleset `26550182` (“Основной — verified”) applies to `refs/heads/Основной`: PR required, 0 required approvals, review-thread resolution required, deletion and non-fast-forward prohibited, no bypass actors. This is the current ruleset read-back; zero required approvals does not constitute independent security review or project acceptance.

## 2. Issuer governance evidence — unresolved

The owner-directed MediaHub Wave 486 PR #599 remains OPEN / DRAFT / UNMERGED at head `824bb2568b2ac8bb3dceb3608366668e99bab95e`. It selects a separate Security Issuer Authority as the target, but explicitly states that named teams/services, KMS/HSM, identity registry, audit sink and exact operational principals do not yet exist as evidenced decisions.

Wave 487 PR #600 remains OPEN / DRAFT / UNMERGED at head `05a873e82760d63c8b26dc496b43d3309f4cfbf9`, stacked on #599. It is a technology-neutral normative candidate, not accepted or implemented; it selects no protocol, token format, algorithm, KMS/HSM vendor, identity provider, audit sink, endpoint or operational team.

For both #599 and #600, exact-head workflow queries returned no PR-triggered runs and formal review submissions were empty: CI NOT VERIFIED; review NOT RUN. Wave 528 PR #634 is also OPEN / DRAFT / UNMERGED, no exact-head workflow runs returned and no formal reviews recorded; it concerns Runner 2 isolation, not issuer technology selection.

The issuer/time contract in Cloud Pool requires explicit ownership for issuer service, principal authentication, key custody/rotation/revocation, authoritative revocation state, trusted time, audit integrity/access, privacy classification/retention, and fail-closed audit commit/read-back. The current cross-project evidence does not name qualified operational owners or production services for these functions. This is a governance blocker, not a coding gap that can safely be filled by inventing a new service.

## 3. GitHub Actions OIDC suitability

The Cloud Pool repository was created 2026-11-04 (repository ID `1445644538`, owner ID `157891068`). Current GitHub documentation states that repositories created after 2026-07-15 use an immutable default OIDC subject containing both owner ID and repository ID; the documented format is `repo:OWNER@OWNER-ID/REPO@REPO-ID:ref:refs/heads/BRANCH`. GitHub also documents `repository_id`, `repository_owner_id`, `workflow_ref`, `workflow_sha`, `run_id`, `run_attempt`, and `runner_environment` claims, and requires `id-token: write` to request a job JWT.

- Expected default immutable subject for this repository's default branch, based on repository metadata and GitHub's documented format: `repo:VlDMlNSh@157891068/developer-cloud-pool@1445644538:ref:refs/heads/Основной`.
- This is a derived expected format, NOT a read-back of this repository's OIDC customization setting and NOT a live token observation. The customization endpoint could not be queried through the available GitHub read action. No token was requested or decoded.
- OIDC provides a signed, per-job workflow identity assertion. It can be an upstream authentication input to a separately governed issuer if accepted by policy. It does not itself provide the one-use, outbox/attempt/generation/operation-bound Recovery Grant, revocation registry, nonce consumption atomic with D1, or audit transaction.
- Do not add `id-token: write` to any workflow until the issuer trust policy, exact workflow/ref/subject binding, audience, issuer ownership, key custody and audit requirements have been accepted.

Official references:
- https://docs.github.com/en/actions/concepts/security/openid-connect
- https://docs.github.com/en/actions/reference/security/oidc

## 4. Mature GitHub projects checked in this pass

| Project | Existing mature capability confirmed from project README | Fit / gap | Disposition |
|---|---|---|---|
| Ory Hydra | OpenID Certified OAuth 2.0 / OIDC server; token issuance/validation, client management, consent/login orchestration, JWKS; self-hostable | General OAuth/OIDC server. Its own README describes connecting to an existing identity provider via a login/consent app. It does not supply this consumer's atomic one-use grant + D1 transition | Reuse only if governance selects it as the dedicated issuer substrate and funds/owns its service dependencies; not selected |
| Keycloak | Open-source IAM; user federation, strong authentication, user management and fine-grained authorization | Full IAM service, materially broader than a one-purpose issuer; operation, storage and trust/key lifecycle still need ownership | Do not build an IAM server from scratch, but do not deploy Keycloak without a concrete accepted need and free-tier operational proof |
| ZITADEL | Open-source IAM platform; SSO, MFA, Passkeys, OIDC/SAML/SCIM, multi-tenancy and event stream | Broad identity platform; not a ready-made projection-recovery capability/nonce transaction service | Candidate only if governance selects it; no adoption |
| authentik | Open-source self-hosted IdP; SAML, OAuth2/OIDC, LDAP and RADIUS | IdP functionality does not replace consumer-specific grant scope, single-use atomicity, trusted time and D1 transition | No adoption |
| SPIRE | Workload attestation and SPIFFE ID/SVID issuance; workload-to-workload trust and JWT/mTLS | Workload identity, not a one-use operation/resource-bound recovery grant; server/agent operational footprint remains disproportionate to current ephemeral GitHub runner target | Do not deploy absent a concrete workload-attestation requirement |
| Open Policy Agent | Policy decision engine | Does not authenticate issuer, sign grants, hold nonce state or provide trusted time | Optional policy layer only; not an issuer |
| panva/oauth4webapi | OAuth/OIDC client protocol library already used in a synthetic compatibility proof | Client library, not an authorization server or grant issuer | Reuse for client protocol tasks only |

Repository sources:
- https://github.com/ory/hydra
- https://github.com/keycloak/keycloak
- https://github.com/zitadel/zitadel
- https://github.com/goauthentik/authentik
- https://github.com/spiffe/spire
- https://github.com/open-policy-agent/opa
- https://github.com/panva/oauth4webapi

Conclusion: several mature identity products exist, so a new general-purpose IdP/OAuth server should not be written. None is a drop-in implementation of the Recovery Actor's consumer-specific, one-use, atomically consumed grant. The remaining work is authority ownership and service-fit selection, not implementing a bespoke IAM platform.

## 5. Disposition and next bounded step

1. Keep GitHub Actions OIDC as a candidate workload-attestation input only; do not request live tokens or change workflow permissions.
2. Keep Hydra, Keycloak, ZITADEL, authentik and SPIRE as researched candidates, not selected dependencies.
3. Do not create an issuer service or token format while operational ownership, trust-anchor custody, revocation source, trusted-time source and audit/privacy ownership remain unresolved.
4. Continue with a source-evidence pass on the exact accepted R-06 and Wave 486/487 governance clauses; distinguish accountable function names from named operational owners and from deployed service evidence.
5. Keep PR #63 draft; its exact-head CI and review remain NOT VERIFIED / NOT RUN. Do not merge based only on mergeable=true or the zero-approval ruleset.

No workflow was dispatched. No live OIDC token, secret, credential, key, hosted database or provider endpoint was accessed. No runtime, schema, permission, workflow, dispatch or deployment changed.

- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
