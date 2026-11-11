# Recovery Actor issuer and component-fit audit

- Date: 2026-11-11
- Status: RESEARCH COMPLETE / DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED
- Immutable documentation base: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- Documentation branch: `docs/recovery-actor-component-fit-2026-11-11`
- Scope: evaluate existing open-source identity, issuer, and policy components for the Projection Recovery Actor prerequisite.
- Non-goals: runtime code, issuer deployment, credentials/secrets, schema, permissions, workflow changes, dispatch, or production integration.

## 1. Repository state recheck

- Default branch `Основной` HEAD observed: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #60 branch `design/projection-recovery-actor-contract-2026-11-11` compares as DIVERGED: 7 commits ahead / 16 behind; merge base `864213e2ff5b4fa956ba405dea8137a44d812f49`. Compare reports only two added documentation files: ADR (192 lines) and issuer/time contract (126 lines).
- PR #60 formal review submissions: 0; inline review threads: 0; exact-head CI: NOT VERIFIED (no matching run evidence returned).
- PR #59 exact-head evidence remains run `42981807825`, COMPLETED / SUCCESS, on `22200226da4f1af30645cf441a639db6893e9310`. This is isolated local Workers-runtime/D1 proof only, not hosted-backend or recovery-actor qualification. Formal reviews: 0.
- Context Window read-back blob before this update: `ea70d48490f294f89caa1aba8a67ce1ea1379308`.

## 2. Mature component fit assessment

| Component | Proven capability | Gap against this contract | Disposition |
|---|---|---|---|
| GitHub Actions OIDC | Per-job signed JWT identity, audience/subject and workflow/repository/ref/SHA claims; supports short-lived federated authentication without long-lived stored cloud credentials | Does not itself issue a consumer-specific one-use recovery grant, consume nonce atomically with D1 transition, or provide the required issuer governance/revocation service | Best existing identity-attestation candidate to investigate as input to a separately governed issuer; NOT a Recovery Grant issuer by itself |
| SPIFFE / SPIRE | CNCF-graduated workload identity; SPIRE performs workload attestation and issues X.509/JWT SVIDs, rotates signing keys and supports trust bundles | Requires SPIRE server/agent and workload-attestation operations; no demonstrated fit to GitHub-hosted ephemeral runner-only/free-infrastructure constraint; SVID identity is not the required one-use outbox-scoped grant | Mature but operationally disproportionate; do not deploy for this narrow requirement without a concrete host/attestation need |
| Ory Hydra | OpenID Certified OAuth2/OIDC provider; token issuance, introspection, revocation, JWKS and client management | General-purpose OAuth/OIDC server; self-hosting requires a service and database, and the recovery-specific scope, nonce consumption, atomic D1 transition and separate issuer governance still need a consumer-specific layer | Candidate only if governance explicitly selects a dedicated issuer service; no selection or deployment |
| Open Policy Agent | Mature general-purpose policy decision engine | Policy evaluation does not authenticate the caller, issue/sign grants, establish key custody, or provide one-use nonce storage | Optional policy component only; not an issuer or identity provider |
| panva/oauth4webapi | OAuth/OIDC protocol client library already examined in PR #30 synthetic compatibility proof | Client library, not an authorization server or capability issuer | Reuse for supported client protocol tasks; do not treat as issuer implementation |

Sources:
- GitHub Actions OIDC concepts and per-job token: https://docs.github.com/en/actions/concepts/security/openid-connect
- GitHub OIDC claims, audience, subject and trust conditions: https://docs.github.com/en/actions/reference/security/oidc
- SPIRE project: https://github.com/spiffe/spire
- SPIFFE project specification and workload identity: https://github.com/spiffe/spiffe
- Ory Hydra: https://github.com/ory/hydra
- Open Policy Agent: https://github.com/open-policy-agent/opa
- Existing local OAuth compatibility PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/30

## 3. Decision

1. Do not implement a new issuer, token service, policy engine, or SPIRE deployment in this pass.
2. Retain GitHub Actions OIDC as the leading existing workload-authentication candidate for further governance review only. Its token may attest the approved workflow job to a separately governed Security Issuer Authority, if that authority's policy explicitly accepts GitHub as an upstream identity provider. It must not be treated as the Recovery Grant.
3. Do not choose Ory Hydra, SPIRE, OPA, token format, signing algorithm, KMS/HSM, database, or audit sink yet. The available evidence does not establish a free-tier-compatible, operationally owned, qualified issuer.
4. Preserve the distinct `projection-outbox-recovery` audience and exact operation/resource binding. No reuse of A0 ingress or task Resolver grants.
5. Recovery remains NOT IMPLEMENTED / NOT QUALIFIED; production dispatch remains FAIL-CLOSED; Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## 4. Next bounded step

Perform a governance and integration feasibility pass for GitHub OIDC as an authentication input to the separately governed Security Issuer Authority:
- verify the repository's actual OIDC subject format and immutable repository/owner ID claims from official docs/configuration without requesting a live token or exposing token contents;
- identify the authority owner, issuance policy, key custody, revocation source and operational audit owner from accepted governance evidence;
- verify whether a free GitHub-hosted runner can reach the chosen issuer without a persistent paid service;
- keep the issuer and grant unimplemented until all ownership and trust boundaries are evidenced.

No workflow was dispatched. No secret, key, token value, hosted database, or provider endpoint was accessed. No runtime, schema, permission, dispatch gate, or deployment changed.
