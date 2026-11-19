# Stage 2 Prompt 1 — Executor Identity and Admission Security Design

Date: 2026-11-19
Status: VERIFIED — bounded architecture/research design only; no executor activated.
Scope: Cloud Development Pool / Contour A.
Target reviewed: PR #146 head `e10f675dbb55b7a10a97b111d1fa994e55b5431e`.
Default branch: `Основной`; last baseline SHA recorded in PR #146 base metadata: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (current default ref head not independently re-resolved by the available GitHub connector in this pass; treat as last-known, not fresh proof).

## 1. Decision summary

Do not deploy SPIRE, OPA or Cedar as a prerequisite for the current GitHub-hosted ephemeral runner design. Do not treat a GitHub Actions OIDC token as proof of a specific process or physical host.

Adopt a layered, fail-closed identity model:

1. GitHub OIDC proves a narrowly constrained workflow principal to the verifier.
2. A separately issued runner-registration/attestation record identifies the runner instance only when a trusted runner control plane can supply it. GitHub-hosted runner IDs and labels alone are metadata, not cryptographic host attestation.
3. Process identity is a runtime-local claim (executable/image digest, invocation, sandbox profile and process-bound evidence). On ordinary hosted runners this is not independently trustworthy against a compromised runner/job; classify it as NOT VERIFIED unless a separate attestation boundary exists.
4. Host identity is a stable host principal only for owner-controlled hosts with an approved attestation mechanism. Do not infer it from hostname, IP, labels or a self-reported ID.
5. Executor logical identity is a registry-owned immutable ID and lifecycle record. It binds the above evidence references, but is not itself proof of any underlying level.

The executor registry remains empty. Admission remains denied unless every required identity layer for the selected executor class is VERIFIED and current. No live executor, provider, dispatch or production authority is enabled by this design.

## 2. Current evidence and limits

- PR #146 is OPEN / DRAFT / UNMERGED; head `e10f675dbb55b7a10a97b111d1fa994e55b5431e`; base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- The proposed CODE profile `jarvis-code-sandbox-v1` is a capability profile, not an executor identity or attestation.
- The Stage 1 registry contract contains an empty `executors` array.
- Existing OIDC verification is limited to the GitHub Actions workflow principal. It does not attest a specific process or physical host.
- Combined commit-status lookup for current PR head returned no status entries. Current-head CI therefore remains NOT VERIFIED by that endpoint.
- Issue #140 remains OPEN and limits D1 admission/lease work to local no-secret proof. It prohibits hosted D1, secret inspection, provider calls, dispatch, deployment and merge.
- Active ruleset #26550182 is documented as requiring PR and review-thread resolution, but zero approvals; detailed classic protection/required-check enforcement remains partially NOT VERIFIED.

## 3. Identity layers and evidence

| Layer | Stable identifier | Acceptable evidence | What it does not prove |
|---|---|---|---|
| Workflow | issuer + repository_id + workflow_ref/workflow_sha + event/ref + run_id/attempt | Verified JWT signature, issuer, audience, expiry, not-before, exact subject and allowlisted immutable claims | Runner, process, host or logical executor |
| Runner | platform runner ID + ephemeral registration ID + job/run binding | Trusted runner-control-plane record, lifecycle and teardown evidence; otherwise metadata only | Process integrity or host physical identity |
| Process | process invocation ID + executable/image digest + sandbox/profile ID | Runtime-created attestation from an independently trusted boundary; otherwise self-asserted and NOT VERIFIED | Host identity unless host attested |
| Host | host registry ID + attestation key/certificate identity | Hardware/OS-backed or approved host agent attestation, challenge-bound and fresh | Specific process unless process measurement is bound |
| Logical executor | immutable executor_id + registry revision | Owner-authorized registry record with lifecycle, class, identity binding and revocation epoch | Cryptographic truth of evidence referenced by record |

Never collapse these into a single string or boolean named `authenticated`.

## 4. GitHub OIDC verification requirements

Verifier MUST:

- Pin the issuer to `https://token.actions.githubusercontent.com` and validate the JWT signature against issuer JWKS with bounded, safe key refresh.
- Require an exact configured audience; reject wildcard or caller-selected audience.
- Validate `exp`, `nbf`, `iat` with bounded clock skew and a strict maximum token age.
- Require an exact `sub` pattern for the intended repository/workflow/ref context; parse and compare immutable `repository_id` and `repository_owner_id` where present.
- Bind `workflow_ref`, `workflow_sha`, `event_name`, `ref`, `sha`, `run_id`, `run_attempt` and actor/repository claims to a server-side allowlist and expected dispatch envelope. Never trust client-supplied copies of GitHub context.
- Reject fork/untrusted PR contexts, untrusted refs, unexpected reusable workflow identities and missing required claims.
- Treat claims such as runner name, labels, IP and environment as descriptive unless independently attested.
- Cache verification only until the earliest of token expiry, executor expiry, revocation epoch change, lease expiry or policy revision expiry.

GitHub OIDC docs describe issuer, audience and subject semantics; exact subject constraints are essential. A valid workflow token still proves only the workflow principal.

## 5. Registry lifecycle and authority

Lifecycle states:

- PENDING — record proposed; never admissible.
- ACTIVE — all required evidence verified, owner-authorized and within validity.
- SUSPENDED — temporary deny; admission immediately fails closed.
- REVOKED — terminal deny; identity ID cannot be reactivated or reused.
- EXPIRED — validity window ended; deny until a new identity record is created.

Allowed transitions:

- PENDING -> ACTIVE only by owner-controlled registry authority after evidence review and independent qualification.
- PENDING -> REVOKED by owner authority.
- ACTIVE -> SUSPENDED or REVOKED by owner authority or an explicitly delegated security authority.
- ACTIVE -> EXPIRED automatically when `not_after` passes.
- SUSPENDED -> ACTIVE only after a new explicit owner authorization and fresh evidence; rotate identity epoch and invalidate all prior leases.
- SUSPENDED -> REVOKED by owner/security authority.
- REVOKED and EXPIRED are terminal. Replacement requires a new executor_id; never recycle IDs.

Every transition is append-only audited with actor principal, reason, timestamp, previous/new state, registry revision and evidence digest. No agent or executor may modify its own state, capabilities, issuer allowlist or trust policy.

## 6. Admission, lease and fencing binding

An admission decision must bind a canonical tuple:

`executor_id, identity_epoch, registry_revision, profile_id, capability_digest, issuer, audience, subject, workflow_sha, run_id, run_attempt, host_evidence_digest, process_evidence_digest, lease_id, lease_expires_at, fencing_generation, task_id`.

Requirements:

- `executor_id` is looked up from the trusted registry; never accept a caller's executor_id as authority.
- Identity epoch and registry revision are re-read at admission and on every privileged state transition.
- Lease is short-lived, task-scoped and single-owner. No action after expiry.
- Fencing generation is monotonically increasing per task/lease lineage; stale or equal reused generations cannot mutate state.
- Revocation/suspension increments the identity epoch and invalidates outstanding leases; a worker cannot renew using stale evidence.
- Capability set is the intersection of owner-approved profile capabilities, executor class capabilities, task grant and current policy. No request can add capabilities.
- Provider account, route and quota identities remain separate from executor identity and capability profile.
- No capability can cross Jarvis, ASTRA A0 or MediaHub Product State Authority boundaries.

## 7. Replay, key rotation and expiry

- Each attestation is challenge-bound to a verifier nonce, task/lease ID, executor ID, identity epoch and short validity window.
- Persist a unique evidence ID/digest and consume it atomically once. Repeated evidence IDs or mismatched payload digests are denied.
- Bind GitHub `run_id` + `run_attempt` + workflow SHA + source event/comment ID; retries are distinct attempts and cannot silently reuse approval.
- Rotation creates a new key/evidence epoch, publishes a new registry revision and revokes old identity material. Do not overwrite the prior public-key identity in place.
- Revocation list/state is authoritative and checked online at admission and lease renewal. No fail-open cache during registry unavailability.
- Expiry is enforced using trusted server time, not worker-supplied timestamps.

## 8. Negative test matrix

| Case | Expected result |
|---|---|
| Wrong issuer | DENY |
| Wrong/missing audience | DENY |
| Wrong subject or workflow identity | DENY |
| Invalid signature/JWKS key | DENY |
| Expired token / future nbf / excessive age | DENY |
| Unknown executor_id | DENY |
| PENDING executor | DENY |
| SUSPENDED executor | DENY |
| REVOKED executor | DENY permanently |
| EXPIRED executor | DENY |
| Replayed evidence ID or nonce | DENY |
| Evidence digest mismatch | DENY |
| Caller substitutes executor_id | DENY |
| Runner evidence belongs to another run | DENY |
| Host identity mismatch or stale challenge | DENY |
| Process digest/profile mismatch | DENY |
| Host/process evidence missing when required | DENY |
| Registry revision or identity epoch changed | DENY and invalidate lease |
| Expired/stale lease | DENY |
| Reused or stale fencing generation | DENY |
| Capability escalation or unknown capability | DENY |
| Cross-account provider identity/quota substitution | DENY |
| Attempt to read another executor's secret scope | DENY |
| Registry/policy source unavailable | DENY |

Tests must be local, synthetic and no-secret. Assert both `dispatch:false` and `executionAuthorized:false` in all proof outputs.

## 9. Mature component research

| Component | Maturity / license | Relevant value | Cost and integration decision |
|---|---|---|---|
| [Sigstore Cosign](https://github.com/sigstore/cosign) | Established; Apache-2.0 | Keyless artifact signing, short-lived OIDC-bound certificates, transparency log; useful for signing executor images and evidence bundles | Public hosted services have free use paths, but network/service availability is external. Adopt later for artifact/evidence verification, not runtime host identity |
| [SPIFFE](https://github.com/spiffe/spiffe) / [SPIRE](https://github.com/spiffe/spire) | CNCF graduated project; Apache-2.0 | Workload IDs/SVIDs, node and workload attestation, certificate rotation and workload API | Requires a trust domain, server/agent deployment and operational lifecycle; overkill for ephemeral GitHub-hosted runners. Reconsider only for persistent multi-host runtime |
| [in-toto](https://github.com/in-toto) | Established supply-chain framework; Apache-2.0 | Signed link/attestation model for who performed which supply-chain step and materials/products | Useful schema/provenance model; does not authenticate a running executor by itself. Reuse attestation format selectively |
| [SLSA](https://github.com/slsa-framework/slsa) | Open specification/ecosystem | Standardized build provenance describing where/how artifact was built | Use SLSA provenance for immutable worker image/build artifacts; not a substitute for admission authorization |
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | OpenSSF project; Apache-2.0 | Automated repository supply-chain posture signals | Use as an input to dependency qualification, never as runtime identity or admission proof |
| [OPA](https://github.com/open-policy-agent/opa) | CNCF graduated; Apache-2.0 | General-purpose Rego policy engine; externalized policy decisions | Mature but adds runtime/service/version/policy-distribution complexity. Do not add for the current narrow local proof |
| [Cedar](https://github.com/cedar-policy/cedar) | Active open-source policy language/engine; Apache-2.0 | Typed RBAC/ABAC authorization with schema validation and implicit deny | Strong future candidate if authorization policy complexity grows; current capability contracts can remain deterministic code + JSON schema |

Selection: reuse standards and tools only at their natural boundary. For this stage, keep identity registry and admission checks in the existing project contracts and local proof harness. Prefer Cosign/SLSA/in-toto for artifact provenance when worker images/artifacts exist. Do not introduce SPIRE, OPA or Cedar until a demonstrated runtime requirement justifies their operational cost.

## 10. Scope and non-goals

This pass does NOT activate executors, change production authority, call providers, invoke dispatch, provision hosted D1, inspect secrets, deploy, merge or modify governance. No external executor or host identity is claimed VERIFIED. No tool was installed.

## 11. Next bounded pass

Stage 2 Prompt 2 should inspect the exact existing registry schema, OIDC verifier, identity contract and admission policy files at an immutable branch SHA, map each field to the layered model above, identify missing revocation/epoch checks, and propose a minimal additive schema/test change. Keep it local and no-secret; do not activate an executor.
