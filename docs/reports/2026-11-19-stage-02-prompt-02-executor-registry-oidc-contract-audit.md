# 2026-11-19 — Stage 2 Prompt 2: Executor Registry & OIDC Verifier Contract Audit

**Status:** VERIFIED — source-level audit and remediation specification only. No source/schema/test mutation in this pass.
**Immutable target SHA:** `5eb07732a32e22694fcb47880d1dc29f0859020c`
**Default branch:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
**Working branch / PR:** `feat/a1-jarvis-code-sandbox-profile-2026-11-19` / [PR #146](https://github.com/VlDMlNSh/developer-cloud-pool/pull/146), OPEN / DRAFT / UNMERGED.
**Issue:** [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140), OPEN; all local-only/no-secret/no-dispatch restrictions retained.

## 1. Repository and governance state

- Cloud Pool is public; repository ID `1445644538`; owner ID `157891068`; default branch `Основной`.
- Independently fetched default branch endpoint reports HEAD `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, parent `68183828cf7934e89109310c8f99281be4eb7ed8`. PR #146 base SHA matches this default HEAD.
- PR #146 current head at audit start: `5eb07732a32e22694fcb47880d1dc29f0859020c`, 77 commits, 46 changed files, OPEN/DRAFT.
- Issue #140 body confirms local-only proof; no hosted D1, secret/variable inspection, provider calls, dispatch, deployment, merge or production actions.
- Active ruleset #26550182 targets only `refs/heads/Основной`, blocks deletion and non-fast-forward updates, requires PR and review-thread resolution, but requires **0 approvals** and no code-owner review. Branch protection endpoint reports `protected:false` / checks off. Ruleset is active, but independent review is not enforced by this ruleset.
- PR #146 has 0 formal reviews and 0 review threads at audit time.
- Exact PR head associated CI:
  - Pool Contract Validation run [44515922163](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922163) — SUCCESS.
  - Isolated D1 Ledger Proof run [44515922122](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922122) — SUCCESS.
  - Important precision: D1 job checked out PR merge commit `d1de9785afd505400cfe781b95144a15bd647d5d`, which merges PR head `5eb0773...` into base `b81d2b5...`. Workflow run metadata/artifact associates the run with PR head `5eb0773...`; do not describe the checked-out Git SHA as the PR head.
  - D1 tests: 4 files / 63 tests passed; identity suites: 8 OIDC verifier tests + 11 registry tests. Syntax check passed. Contract validation passed and reported dispatch disabled/unset.
  - Artifact [14526330421](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922122/artifacts/14526330421), digest `sha256:eabb4f8d682fe0c2a7d2344edb8bbb4cb5309dac2f3b1c101eb5646e7cbc3a18` (package-lock evidence only).
- Combined commit-status endpoint returned no status entries for PR head; use the actual successful workflow runs above as CI evidence, not the empty status endpoint.
- Branch-protection API is readable and reports disabled; active ruleset is separately readable and active. Do not infer stronger branch protection than those facts.

## 2. Exact files inspected

| File | Blob SHA | Finding |
|---|---|---|
| `.github/pool-executor-registry.json` | `93628e44cd348b85f2bd33df709be80883c83588` | schemaVersion 1, repository identity pinned, executor array empty |
| `proofs/d1-ledger/src/github-actions-oidc-verifier.mjs` | `42ea227874c85c366d0a8ea200c46bacc359a7b0` | verifies GitHub OIDC signature/selected claims; workflow principal only |
| `proofs/d1-ledger/src/trusted-executor-registry.mjs` | `a8427267d815ac2625199de7904e58f25fbd203a` | fetches current default-branch head and registry at that SHA; recognizes only status `enabled` |
| `proofs/d1-ledger/src/trusted-executor-auth.mjs` | `7156ef3eca47a80d1259a1b6883cbb50158bfd2a` | composes registry assignment and OIDC workflow authentication; explicitly denies execution and dispatch |
| `proofs/d1-ledger/test/github-actions-oidc-verifier.test.ts` | `a6a5db7a2dd138376d4bec3aaae2e621b28544af` | 8 verifier tests |
| `proofs/d1-ledger/test/trusted-executor-registry.test.ts` | `cfa869aeae354b564ab085a739f90cd490cadc1b` | 11 registry tests including invalid IDs |
| `proofs/d1-ledger/migrations/0007_bind_executor_identity.sql` | `47c2f0f7db6379e6760317fe3903214f6f31ffee` | executor_id is bound/immutable across approval, task and attempt; no lifecycle epoch/session/host/process fields |
| `proofs/d1-ledger/EXECUTOR-HOST-TRUST-MODEL.md` | `a303978e503c9401a6e8ebaf31d1aa751d08f393` | T0–T5 layered trust and broker/session architecture is DESIGN / NOT IMPLEMENTED |
| `docs/contracts/CODE-CAPABILITY-PROFILE-JARVIS-CODE-SANDBOX-V1.md` | `21b04b125349441f6296696a4f780d44c33ef896` | profile PROPOSED / NOT QUALIFIED / NOT ENABLED; resource ceilings are proposals |
| `proofs/d1-ledger/src/consume.mjs` | `7b30f9fa315d7996854685cbe634bd8097677518` | proof-only approval consume; no direct call to executor OIDC authentication |
| `proofs/d1-ledger/src/task-lease.mjs` | `b41edf89cdf960b2c007f38ba16554dc179f021a` | lease fencing; adapter outputs omit explicit executionAuthorized:false |
| `proofs/d1-ledger/src/task-attempts.mjs` | `f40582968a3b25e1a59522c19dd5bc11b007e6b2` | executor ID bound to task/attempt; no registry/session revalidation; adapter outputs omit explicit executionAuthorized:false |

## 3. Existing controls VERIFIED at source level

### Registry provenance and assignment
- Registry resolver fetches the named default branch independently from caller input, validates branch name and 40-hex commit SHA, then fetches the registry file pinned to that commit SHA.
- Repository ID and default branch are checked; malformed, duplicate, missing, disabled and profile-mismatched executor entries deny.
- Executor ID syntax is allowlisted to `claude-code-N`, `codex-N`, `gemini-N`; legacy `dsh-headless-probe` is rejected before network access.
- Resolver returns registry blob SHA and trusted default-branch SHA.
- Registry remains empty, so no actual executor is registered or admissible.
- Registry and auth modules explicitly return `executionAuthorized:false` and `dispatch:false`.

### OIDC verifier
- Issuer is hard-pinned to `https://token.actions.githubusercontent.com`.
- JWT algorithm is pinned to RS256; issuer JWKS is fetched from a hard-coded URL with redirects rejected.
- Matching key must be unique by kid, RSA, and compatible alg/use; signature is verified with WebCrypto.
- Exact configured subject, repository, numeric repository ID, owner ID, workflow_ref and job_workflow_ref are compared.
- exp, iat, nbf upper bound and maximum exp-iat lifetime are checked with 60-second skew.
- Result explicitly says `executorProcessAttested:false`, `executionAuthorized:false`, `dispatch:false`.

### D1 executor binding
- Migration 0007 adds executor_id to approval, task and attempt records.
- Triggers require a syntactically valid executor ID, match task to approval, match attempt to task, and prevent later executor_id mutation.
- It does not prove that the ID is ACTIVE in the registry; the database trigger is a referential consistency check, not an identity attestation.

## 4. Security gaps and precise classification

1. **Lifecycle mismatch — NOT IMPLEMENTED.** Registry schema v1 has no PENDING/ACTIVE/SUSPENDED/REVOKED/EXPIRED state machine. Code accepts only `status:"enabled"`; no identity epoch, valid-from/valid-until, revoked timestamp/reason, registry revision policy or terminal-state semantics exist.
2. **Revocation and epoch invalidation — NOT IMPLEMENTED.** There is no monotonic identity_epoch or revocation epoch check in registry, auth result, D1 approval/task/attempt, lease renewal or finalization. Registry removal/disabled status blocks a new resolver call, but no durable binding invalidates an already-created lease/session.
3. **OIDC run-context binding — INCOMPLETE.** Verifier compares issuer/audience/subject/repository IDs/workflow refs, but does not bind workflow_sha, ref, sha, event_name, run_id and run_attempt to a trusted expected envelope. These fields must be server-derived, not caller-supplied.
4. **Token age and NumericDate typing — INCOMPLETE.** Code bounds exp-iat to one hour but does not enforce a maximum age relative to now. nbf is defaulted to zero when absent and a non-numeric value can pass the greater-than comparison through JS NaN behavior. exp/iat/nbf are coerced with Number rather than validated as finite NumericDate numbers.
5. **Audience exclusivity — HARDENING REQUIRED.** A string audience match or an array containing the expected audience is accepted. If policy requires one exact audience, require a single exact string (or explicitly reject extra audiences).
6. **Bearer-token replay — NOT MITIGATED BY THIS MODULE.** No jti/nonce consumption, proof-of-possession or broker session exists. OIDC bearer tokens can be replayed while valid by any process able to obtain/read the job token. The source comments correctly disclaim process identity; T3 broker protocol remains design only.
7. **Runner/process/host identity — NOT VERIFIED.** No runner-session ID, process measurement, host attestation, session public-key thumbprint, or challenge-bound evidence is checked. `executorProcessAttested:false` is correctly retained.
8. **Registry revision not propagated end-to-end — INCOMPLETE.** Resolver emits default HEAD SHA and blob SHA, auth result keeps both, but D1 migration 0007 does not persist either as immutable authorization evidence; no epoch is bound to a lease.
9. **Admission chain composition — NOT VERIFIED.** The isolated registry/OIDC authentication module is not called by `consume.mjs` or `task-attempts.mjs`; migration triggers only enforce executor_id equality. The current D1 proof therefore does not establish that an OIDC-authenticated registry identity is required before approval consumption, lease acquisition, attempt transition or result finalization.
10. **Adapter output invariant — GAP.** OIDC, registry and auth results expose both false flags. consume, task-lease and task-attempt adapters do not uniformly expose `executionAuthorized:false`; Issue #140 requires every adapter output to retain both `dispatch:false` and `executionAuthorized:false`.
11. **No combined authentication tests — NOT VERIFIED.** Current suites test OIDC verifier and registry resolver separately; no test demonstrates full registry -> OIDC -> approval -> lease/attempt binding or revocation during an active lease.
12. **Independent review — NOT RUN.** PR has no formal reviews; ruleset requires zero approvals. This audit is not an independent external acceptance.

## 5. Minimal safe remediation sequence

Do not add a D1 migration in the next pass. The registry is empty and the D1 migration lineage has prior duplicate-ledger/outbox incompatibilities (Issue #140 discussion and PR #141 audit); avoid introducing a new session/epoch table before the canonical lineage is reconciled.

**Next implementation slice (Prompt 3):**

A. Registry schema v2, still with `executors: []`:
- `status` enum: PENDING / ACTIVE / SUSPENDED / REVOKED / EXPIRED (no legacy `enabled` synonym);
- positive integer `identityEpoch`, immutable `executorId`, explicit `notBefore` and `notAfter`;
- optional `revokedAt` and bounded `revocationReason` required for REVOKED;
- evidence references/digests for approved workflow binding; no secret values;
- registry revision derived from the independently fetched default-branch commit SHA and blob SHA.
- Reject duplicate IDs, non-monotonic/invalid epoch, unknown status, expired/not-yet-valid records and malformed evidence. REVOKED/EXPIRED are terminal; do not re-enable same identity epoch.

B. OIDC verifier hardening:
- require expected binding fields for workflow_sha/ref/sha/event_name/run_id/run_attempt;
- require a bounded maximum token age relative to verifier time;
- validate NumericDate types and finite values, including nbf when present;
- enforce exact audience policy;
- preserve the current fixed issuer/JWKS URL/RS256 and fail-closed behavior;
- explicitly document that this does not prevent bearer replay or prove process/host identity.

C. Negative-first tests:
- all lifecycle states, expiry/not-before, identity epoch mismatch and registry revision change;
- wrong workflow SHA/ref/target SHA/event/run/attempt;
- stale iat, invalid/missing/ill-typed NumericDate, extra audience, bad signature, duplicate kid, JWKS unavailable;
- revoked executor during lease/attempt and stale epoch;
- ensure every adapter result includes both `dispatch:false` and `executionAuthorized:false`;
- test that registry/OIDC auth is a required precondition for any future admission composition, while all outputs remain non-authorizing.

D. Keep D1 schema untouched until one canonical migration chain and task/outbox model is selected. Keep registry empty. No runner session, real OIDC token, secret, provider, hosted D1, dispatch, deployment or merge.

## 6. Evidence links

- PR #146: https://github.com/VlDMlNSh/developer-cloud-pool/pull/146
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Ruleset #26550182: https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182
- Pool Contract Validation: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922163
- D1 Ledger Proof: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922122
- D1 artifact: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44515922122/artifacts/14526330421

## 7. Scope and time

No source, test, migration, registry, workflow, governance or production authority changes. No secrets/variables inspected, no provider calls, hosted D1, dispatch, deployment, merge, or agent dispatch. The expected Gemini controller path `.github/workflows/gemini-batch-dispatch-controller.yml` was not found at this target; independently, Issue #140 prohibits dispatch. No attempt was made to invoke it.

Start/end timestamps and active/elapsed/wait time were not measured in this pass. Do not infer duration from chat message timestamps. Stage 2 cumulative active/elapsed time remains NOT MEASURED; Stage 1 actual time remains NOT MEASURED.

**Contour A: NOT ACCEPTED. Contour B: DEFERRED.**
