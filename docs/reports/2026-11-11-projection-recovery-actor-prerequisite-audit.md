# 2026-11-11 Projection Recovery Actor prerequisite audit

- Date: 2026-11-11 (Europe/Vilnius)
- Scope: PR #60 issuer/trusted-time design prerequisite and its relationship to PRs #58/#59.
- Immutable target: PR #60 design target `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`; design base `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Disposition: design contract is internally useful but remains PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED. No runtime change is authorized by this pass.

## Evidence reviewed

1. PR #60, [least-privilege projection recovery actor contract](https://github.com/VlDMlNSh/developer-cloud-pool/pull/60), OPEN / DRAFT / UNMERGED. Its immutable target is recorded in the contract as `04fcf8868a086b9f58c10fdc076aef0b7170d5f2`.
2. Exact-target workflow lookup returned no runs; combined commit status returned no contexts; formal review list and review-thread list were empty. Exact-head CI and independent review are therefore NOT VERIFIED / NOT RUN, not passing.
3. PR #60 explicitly distinguishes the projection Recovery Actor from task Resolver, Supervisor, Worker, Jarvis, ASTRA A0 and Product State Authority. It specifies a dedicated `projection-outbox-recovery` audience and exact operation/resource binding; maximum grant lifetime ≤300 seconds; revocation-state age ≤30 seconds; fail-closed audit and trusted-time boundaries.
4. The contract identifies no production issuer, key custody/rotation/revocation service, admitted recovery-actor registry, trusted production clock, audit sink/operator, or retention approval. JWS, KMS/HSM, Cedar and Macaroons remain candidates only; no token format, signature algorithm, database or audit technology is selected.
5. The parent ADR [2026-11-11-projection-recovery-actor-capability-contract.md](https://github.com/VlDMlNSh/developer-cloud-pool/blob/design/projection-recovery-actor-contract-2026-11-11/docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md) records that the existing local adapter requires the original lease owner and caller-supplied `workerId/now` are not authentication/trusted time. It prohibits recovery from requeueing, retrying tasks, dispatching or mutating task/attempt state.
6. [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38) remains OPEN and requires a qualified durable single-use task-claim protocol, real-backend contention/recovery evidence, least-privilege authority and independent review before dispatch.
7. PR #58/#59 are still OPEN/DRAFT/UNMERGED according to the current PR inventory. Their local D1 proof does not establish a hosted issuer, trusted clock, independent recovery identity, production sender, or backend qualification.

## Design assessment

The proposed separation is directionally correct and should be retained as a prerequisite. The most important non-substitutable controls are:

- authenticate the issuance principal independently of request data;
- verify fixed issuer/key/policy/revocation state and exact audience/subject/operation/resource;
- use qualified trusted time for both lease expiry and grant validity;
- atomically consume a one-use nonce and terminalize only the exact exhausted projection outbox row;
- append a durable audit receipt that distinguishes the recovery actor from the expired delivery worker;
- make ambiguous commit/read-back outcomes NOT VERIFIED and never infer success;
- prove no route can requeue, retry, acknowledge, dispatch, write GitHub, or mutate task/attempt state.

A structurally shaped object or TypeScript brand is not a security boundary. The proposed opaque in-process capability or verify-at-entrypoint pattern still needs a concrete composition-root and module-visibility design, including proof that browser inputs, generic RPC, Worker inputs and other Workers sharing a D1 binding cannot reach the privileged transition.

## Mature-component assessment

Retain the existing Cloudflare Workers Vitest + local D1 harness for synthetic conditional-update and transaction tests. It is the smallest relevant existing proof substrate. Durable Objects and Workflows are candidates for serialized coordination/orchestration only; neither supplies issuer authentication, capability scope, nonce authority or production trusted time. GitHub Actions concurrency and Issue labels are not durable per-row authorization/CAS. No additional dependency or backend migration is justified before entitlement, isolation, cost and authority are verified.

## Decision and next gate

- Do not implement the Recovery Actor runtime or alter PR #59's adapter yet.
- Do not reuse task Resolver grants or widen their audience/operations.
- Keep all dispatch paths fail-closed; no secrets, provider calls, deployment or live GitHub writes.
- The next useful step is a governance/source-identification decision: name an owner-approved issuer authority and operational owner, trusted-time source, revocation source, audit sink/retention owner, and the trusted composition-root boundary. If these remain unavailable, record the explicit no-go and retain recovery as NOT IMPLEMENTED.
- After the authority/source decision, update the contract with concrete technology-neutral interface guarantees, then implement only a local synthetic proof and adversarial tests; hosted qualification and independent security review remain separate gates.

## Status

- PR #60 exact-head CI: NOT VERIFIED (no workflow runs returned; combined status empty).
- PR #60 independent review: NOT RUN (no formal reviews or threads).
- Recovery issuer / trusted clock / revocation / audit operations: NOT IDENTIFIED / NOT QUALIFIED.
- Local D1 projection proof: synthetic only; not production qualification.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Source changes, merge, dispatch, secret/provider access, deployment and resource mutation: NOT PERFORMED.
