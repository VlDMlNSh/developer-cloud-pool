# CODE Capability Profile — jarvis-code-sandbox-v1

**Status:** PROPOSED / NOT QUALIFIED / NOT ENABLED  
**Contour:** A only  
**Owner decision:** Immutable profile identifier confirmed in conversation on 2026-11-19. This confirms the identifier only; it does not approve runtime limits, network exceptions, deployment, dispatch, or provider access.  
**Implementation baseline:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`  
**Dispatch:** MUST remain disabled.

## 1. Purpose and authority

This document defines the proposed immutable CODE capability profile identifier and the contract that an executor admission record must reference. It is a capability boundary, not an executor identity, provider route, account, host identity, lease owner, or authorization issuer.

The profile does not authorize a task by itself. A task still requires the applicable owner approval, trusted issuer/capability evidence, exact repository and target-SHA binding, valid lease, quota admission, and the atomic D1 admission contract. Unknown, missing, disabled, revoked, or version-mismatched profile references MUST fail closed.

## 2. Immutable identity

| Field | Value |
|---|---|
| profileId | `jarvis-code-sandbox-v1` |
| schemaVersion | `1` |
| capabilityClass | `CODE` |
| profileStatus | `proposed` until independently qualified and explicitly enabled |
| executionMode | Isolated, ephemeral, single-task sandbox |
| defaultNetworkPolicy | `deny` |
| defaultDispatch | `false` |

The profile ID is immutable. Any material change to permissions, sandbox class, resource ceilings, network policy, artifact policy, or revocation semantics requires a new profile ID (for example, a future v2), not silent mutation of v1.

## 3. Separation of identities

Implementations MUST persist and validate these dimensions independently:

- `executorId`: logical executor instance, e.g. `claude-code-1`; never a capability profile.
- `capabilityProfileId`: exactly `jarvis-code-sandbox-v1`; defines permitted operations and isolation.
- `providerRouteId`, `providerId`, `modelId`: selected model route, independently qualified.
- `accountRef`, `quotaDomainId`, `credentialHandleRef`: opaque provider/account/quota references; never secret values.
- `hostId`: independently enrolled and qualified execution host.
- `leaseId`, `leaseGeneration`, `leaseOwner`: fenced ownership of one attempt.
- `issuerId`: authority that issued the task capability/approval.

No field may be inferred from another. A Claude Code CLI installation does not imply a valid route, account, quota, host, or lease. A Gemini credential cannot authenticate Claude Code. Codex remains a separate optional executor/tool.

## 4. Allowed operations

When, and only when, a task has passed admission and a qualified host enforces this profile, the executor may:

1. Read the checked-out task repository and files within the task workspace.
2. Create, modify, and delete files only inside the task workspace.
3. Run explicitly allowlisted build, test, lint, and static-analysis commands inside the sandbox.
4. Produce a patch/diff and allowlisted test/build reports as task artifacts.
5. Read task instructions and non-secret configuration explicitly provided in the admission envelope.

The executor MUST NOT:

- access host root, home directories, unrelated workspaces, Docker/container runtime sockets, cloud metadata endpoints, or host control planes;
- use privileged mode, mount host paths, install persistent services, or alter sandbox policy;
- read GitHub Secrets, environment secret stores, raw provider credentials, credential files, or other tasks' data;
- create or modify GitHub issues, PRs, branches, repository settings, secrets, variables, workflows, or governance unless a separate narrowly scoped capability explicitly authorizes that operation;
- enable dispatch, self-approve, issue capabilities, change quota/account identity, or bypass admission/lease/revocation checks;
- spawn background work that survives the task lease or sandbox teardown.

## 5. Sandbox and resource policy

Required sandbox class: ephemeral, per-attempt isolation with a fresh workspace; no shared writable filesystem between tasks; no host privilege; process tree and workspace destroyed after completion or revocation.

Proposed v1 ceilings for qualification testing (not yet runtime-enforced or approved for production):

| Resource | Proposed ceiling |
|---|---:|
| CPU | 2 vCPU |
| Memory | 4 GiB |
| Writable workspace | 10 GiB |
| Wall-clock per attempt | 30 minutes |
| Concurrent attempts per sandbox | 1 |
| Process count | 128 |

The host adapter MUST enforce hard limits, not rely solely on model instructions or cooperative process behavior. If a target platform cannot enforce a listed limit, the profile is not qualified on that platform. Any owner-approved change to these ceilings requires a new profile version.

## 6. Network policy

Default outbound and inbound network policy is DENY.

- No inbound listener or public port exposure.
- No arbitrary outbound internet access, DNS tunneling, proxy chaining, or private-network access.
- GitHub checkout/metadata access must use a separately scoped, short-lived GitHub identity and only the endpoints required by the approved workflow.
- Provider/model egress is NOT ALLOWED until a route-specific allowlist, account identity, quota domain, credential handle, hosted-use entitlement, and evidence freshness/revocation checks have been qualified.
- Cloud metadata, loopback control planes, RFC1918/private ranges, and link-local endpoints remain denied.
- Network exceptions are separate route capabilities; they must not be added by editing this profile in place.

## 7. Artifact policy

Allowed task outputs are limited to:

- source patch/diff scoped to the target repository and task;
- test, lint, build, and static-analysis reports;
- bounded execution logs with secret redaction;
- provenance metadata: immutable target SHA, profile ID/version, executor ID, host ID, attempt ID, lease generation, toolchain versions, and artifact digests.

Artifacts MUST be size-bounded, content-type checked, scanned for secret material, and bound to the task/attempt. Raw credentials, environment dumps, unrestricted filesystem archives, unrelated repository content, and host data are prohibited. Artifacts are not merged or deployed automatically.

## 8. Revocation and lease fencing

Revocation MUST be monotonic and fail closed:

1. Mark the profile/host/route/credential/issuer or task capability revoked or disabled in its authoritative registry.
2. Deny new admissions immediately.
3. Invalidate outstanding leases for affected attempts and increment/fence the lease generation.
4. Terminate the sandbox process tree and prevent further artifact publication.
5. Reconcile the attempt and outbox from durable D1 state; never infer success from a lost worker response.
6. Preserve a redacted audit record of the revocation and resulting attempt state.

A stale lease generation cannot renew, finalize, publish artifacts, or enqueue follow-up work. Revocation races must resolve deterministically to DENY / NEEDS_RECONCILIATION with `dispatch:false`.

## 9. Admission binding and validation

Every admitted attempt must bind the exact tuple:

`repositoryId + targetSha + taskId + attemptId + attemptNumber + executorId + capabilityProfileId + hostId + providerRouteQualificationId + leaseId + leaseGeneration + approvalId`.

The D1 transaction must persist the profile ID and schema version alongside the immutable attempt and outbox intent. SQL constraints and adapter validation must reject:

- legacy `dsh-headless-probe` profile references;
- unknown, null, disabled, revoked, or wrong-version profile IDs;
- executor IDs supplied in the profile field or profile IDs supplied in the executor field;
- attempts whose profile, repository, target SHA, route evidence, host, or lease binding differs from the approved envelope;
- stale lease generations and replayed approval/idempotency bindings.

Validation must be duplicated at trust boundaries (typed adapter plus database constraints/triggers where applicable); application-only checks are insufficient.

## 10. Qualification gates

This proposal is NOT qualified until all are evidenced on one immutable target SHA:

- schema and migration constraints enforce the profile ID/version and deny legacy/unknown/disabled values;
- positive tests accept only the exact enabled profile with valid bindings;
- negative tests reject null, legacy, unknown, disabled, revoked, mismatched, and replayed profiles;
- sandbox tests prove filesystem, process, privilege, network, CPU, memory, disk, and wall-clock enforcement;
- revocation tests prove lease fencing, process termination, and no post-revocation artifact/outbox publication;
- exact-head CI passes, including migration, D1 ledger, contract, and security checks;
- independent review confirms provenance, issuer/capability boundaries, and no secret exposure.

Passing an isolated D1 proof does not qualify a live executor or provider route. No provider calls, production dispatch, or deployment are authorized by this document.

## 11. Current blockers and next integration steps

- This document is a proposal; resource ceilings require owner review before becoming authoritative.
- The selected D1 proof substrate is reusable, but its historical branch must be transplanted selectively onto a clean current-default branch.
- Existing D1 proof references to `dsh-headless-probe` were observed in the README, initial approval-ledger migration, claim-outbox adapter, consume adapter, and trusted-executor registry. The full repository-wide reference inventory is not yet complete.
- The integrated D1 admission contract must bind profile ID/version to approval, logical task, immutable attempt, lease, route evidence, and exactly one durable outbox intent in one transaction.
- Dispatch remains disabled throughout implementation and qualification.

## 12. References

- Current default baseline: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- D1 substrate candidate: PR #143, historical head `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`; do not merge directly or treat its CI as validation of this branch.
- Integrated admission contract: `docs/contracts/QUALIFIED-ROUTE-EVIDENCE-AND-ATOMIC-A0-D1-ADMISSION.md`.
