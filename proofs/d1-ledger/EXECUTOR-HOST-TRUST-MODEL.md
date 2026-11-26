# Executor host and process trust model — pass 1

Status: DESIGN / NOT IMPLEMENTED. This document defines the next security boundary for the isolated D1 proof. It does not register an executor, mint credentials, authorize execution, or enable dispatch.

## 1. Security objective

Bind one admitted task to one registered executor instance and one authenticated runner session, while preventing:
- executor-ID spoofing (for example, `codex-1` claiming to be `claude-code-1`);
- replay of a previously valid OIDC token, challenge, or runner proof;
- reuse of a runner session after revocation, expiry, or lease loss;
- stale workers from committing results after lease takeover;
- cross-task, cross-attempt, and cross-tenant credential reuse;
- a workflow process from silently inheriting authority intended for another process.

The identity namespace remains the owner-confirmed convention: `claude-code-1`, `codex-1`, `gemini-1`, with independent numbering per executor family. Capability profile, provider/model/account identity, workflow principal, runner instance, task, attempt, lease owner, and fencing generation are distinct fields.

## 2. Threat model and honest guarantees

Assume an attacker may control task input, a sibling process in the same job, a stale worker, an untrusted pull-request branch, or a previously valid bearer token. Also assume GitHub Actions job credentials are available to every process that can access the job's token-request capability.

Do not claim protection against a fully compromised runner host, kernel, hypervisor, or privileged host administrator unless a separately qualified hardware-rooted attestation mechanism is deployed. A container digest proves which image was selected, not that the running process remains uncompromised. A signed binary proves artifact provenance, not runtime integrity. GitHub OIDC authenticates a workflow/job principal, not an individual Claude Code/Codex/Gemini process.

### Trust levels

| Level | Evidence | What it proves | What it does not prove |
|---|---|---|---|
| T0 | Caller-supplied executor ID | Nothing trustworthy | Assignment, host, process |
| T1 | Owner-controlled registry at independently fetched default-branch SHA | Owner-approved executor/workflow binding | Runtime identity |
| T2 | Valid GitHub Actions OIDC JWT | GitHub workflow/job principal | Which process obtained the token |
| T3 | Broker-issued runner session plus proof-of-possession key | Possession of a session key bound to one job and runner session | Integrity against host/root compromise |
| T4 | Verified measured boot / TPM quote or equivalent hardware-backed attestation, fresh nonce, approved measurements | A specifically measured host/boot state, subject to verifier policy | Safety of arbitrary code after measurement or resistance to all runtime compromise |
| T5 | Per-task isolated execution boundary, constrained egress, immutable image, no shared writable host state, broker-mediated capabilities | Reduced cross-task blast radius and bounded authority | Absolute isolation or exactly-once external side effects |

No current PR #143 implementation reaches T3. T4 is optional future qualification, not a prerequisite to falsely claim today. T5 is a required architecture direction before production execution.

## 3. Proposed architecture

Separate the control plane from the execution sandbox:

1. **Registry resolver** reads the owner-controlled registry from the independently fetched current default-branch SHA. Registry entries bind executor ID, capability profile, exact workflow refs, environment subject, allowed runner class, image digest policy, and revocation state.
2. **GitHub OIDC verifier** authenticates the exact workflow/job claims. Token audience is pool-specific; subject is environment-scoped to one executor identity. Tokens are never persisted in D1 or logs.
3. **Session broker** validates OIDC and issues a short-lived session certificate only after a fresh challenge. The certificate binds repository ID, executor ID, runner session ID, workflow run ID/attempt, image digest, and expiry. The private key is generated inside the runner isolation boundary and is not exported.
4. **Runner supervisor** is the only component allowed to communicate with the broker. It starts one task sandbox per attempt, passes a narrow task capability, and never exposes the broker credential to the executor's general shell environment.
5. **Task sandbox** runs without privileged mode, host Docker socket, host PID/network namespace, writable host mounts, or ambient cloud credentials. Filesystem and resource limits are enforced. Network is denied by default; required egress is mediated by a separate allowlisting gateway.
6. **D1 ledger** records the immutable assignment, runner session, attempt, lease owner, fencing generation, and evidence digests. D1 is the transactional authority for task/lease state; it is not the secret store.
7. **Result gateway** accepts a result only when task ID, attempt ID, executor ID, session ID, lease owner, fencing generation, and unexpired lease all match the current D1 state. The gateway independently verifies uploaded artifact bytes and metadata before committing a result.

The executor process never receives a GitHub App installation token, D1 credential, provider master credential, or general-purpose dispatch token. It receives only a task-scoped capability whose authority is bounded by the broker and result gateway.

## 4. Enrollment and session protocol

### Enrollment (owner-controlled, offline from task execution)

- Add an executor entry only through a reviewed change to the protected default branch.
- Bind exact executor ID and profile; never infer identity from a display name.
- Bind exact repository ID, workflow ref, reusable workflow ref, environment subject, allowed runner class, and immutable image digest or reviewed image policy.
- Record status and validity window. Revocation is an explicit registry change; absence, duplicate entries, malformed data, stale registry, or API errors deny.
- Keep the current registry empty until workflow and runner isolation have passed their own qualification.

### Per-run handshake

1. Supervisor obtains a fresh OIDC token for the pool-specific audience. It does not pass the raw token to the executor process.
2. Supervisor generates a cryptographically random session keypair inside its isolation boundary and requests a broker challenge.
3. Broker returns a single-use nonce with a short expiry and binds it server-side to the OIDC token digest, executor ID, workflow run ID/attempt, and proposed runner session.
4. Supervisor signs the nonce and session transcript with the session private key. If T4 is configured, it also submits a fresh hardware quote bound to the same nonce and approved measurement policy.
5. Broker verifies OIDC, registry binding, nonce freshness, proof of possession, optional hardware quote, image policy, and revocation state.
6. Broker atomically consumes the nonce and issues a short-lived, audience-restricted session certificate. Replays and duplicate consumption are denied.
7. The session is bound to exactly one executor ID, workflow run attempt, runner session, and expiry. It cannot be transferred to another task or executor.
8. Before each task attempt, the supervisor obtains a task-scoped capability bound to the D1 task/attempt and current lease generation. The executor never chooses these values.
9. The result gateway rechecks current D1 lease/fencing state at commit time. A session certificate alone never authorizes a result commit.

### Replay and rotation rules

- OIDC token: validate issuer, audience, signature, exact claims, `iat`, `nbf`, `exp`; reject unreasonable lifetime and future issuance. Never log the token.
- Challenge: at least 256 bits of CSPRNG entropy, one use, short TTL, atomic consume; bind to all session claims.
- Session key: unique per runner session; rotate on new workflow run attempt and after a bounded lifetime.
- Session certificate: short-lived, audience restricted, executor/session bound; no refresh without a fresh OIDC proof and challenge.
- Revocation: registry revocation blocks new sessions; active session kill signal plus short certificate TTL bounds residual exposure. Result commit always checks current registry/lease state.
- Idempotency: every handshake and capability request has a unique request ID; exact retry returns the same non-secret outcome, conflicting reuse is denied.

## 5. D1 data contract additions (design only)

Do not add migrations until the current proof schema and task lifecycle are reconciled. The logical model needs:

- `runner_sessions`: immutable session ID, executor ID, workflow run/attempt, runner class, image digest, public-key thumbprint, trust level, issued/expiry/revoked timestamps, registry SHA, OIDC claim digest, attestation evidence digest.
- `runner_session_events`: append-only events (created, renewed, revoked, expired, lease-lost, terminated) with monotonic event sequence.
- `task_attempts`: bind attempt to one runner session and one executor ID at creation; no reassignment.
- `task_capabilities`: preferably opaque, short-lived, single-purpose references; store only keyed hashes/digests, never bearer secret values.
- `result_receipts`: bind accepted result to task, attempt, executor, session, lease owner, fencing generation, artifact digest, and commit time.

Database constraints must reject cross-binding, session reuse across executor IDs, attempt reassignment, non-monotonic generations, and result commits without a current unexpired lease. All event/receipt rows are append-only. A stale session may still submit bytes, but it cannot commit them.

## 6. Isolation baseline

Required for the first production candidate:
- one sandbox per task attempt; no shared writable HOME or workspace between executors;
- immutable, digest-pinned base image and verified installation provenance;
- non-root user, read-only root filesystem, dropped Linux capabilities, seccomp/AppArmor or equivalent, no privileged containers, no host socket, no host PID namespace;
- bounded CPU, memory, process count, disk, wall-clock, output bytes, and artifact size;
- default-deny network; explicit destination allowlist through a broker/gateway; DNS and proxy policy cannot be bypassed by direct egress;
- no provider secrets in environment, filesystem, command line, or logs; provider access only through narrow brokered operations if later approved;
- cleanup and destruction of task sandbox after attempt terminal state, with evidence retained separately;
- runner host patching, image rebuild cadence, vulnerability policy, and incident revocation procedure.

A Docker `--network none` test is only a container capability proof. It does not isolate the GitHub-hosted runner host, and it does not prove provider egress policy. The actual executor must be run inside the qualified boundary before claiming runtime isolation.

## 7. Required adversarial qualification

All tests must run on the exact PR HEAD and preserve `executionAuthorized:false` and `dispatch:false`.

**Identity / provenance**
- wrong repository ID, owner ID, default branch, workflow ref, reusable workflow ref, environment subject, audience, executor ID, profile, runner class, image digest;
- registry missing, duplicate, stale, malformed, disabled, revoked, or unavailable;
- registry changes between session start and result commit.

**Cryptography / replay**
- invalid signature, unknown/duplicate `kid`, unsupported algorithm, malformed JWT, expired/future token, excessive token lifetime;
- replayed nonce, concurrent nonce consumption, duplicate request ID with changed payload;
- session private-key substitution, certificate audience mismatch, expired/revoked certificate, key rotation during a session;
- OIDC token visible to executor child process (must be impossible by construction and tested with a canary).

**Isolation / host**
- sibling process attempts to read supervisor memory, session key, OIDC token, task capability, or another task's HOME;
- container escape primitives, host socket/PID/network access, writable host mount, DNS/direct-egress bypass;
- sandbox remains alive after supervisor termination, cancellation, lease expiry, or revocation;
- resource exhaustion and log/artifact exfiltration attempts.

**Lease / state**
- stale generation, wrong lease owner, expired lease, runner session revoked mid-task, duplicate finalization, retry while previous attempt is indeterminate;
- result upload after lease loss, result commit racing lease takeover, cross-executor task/attempt substitution;
- verify failed commits leave task, attempt, receipt, and outbox state unchanged.

**Operational**
- broker/JWKS/registry/D1 unavailable; fail closed without fallback;
- clock skew and key rotation;
- audit evidence contains digests and identifiers but no tokens, credentials, or secret values;
- termination and revocation propagation bounded by a measured maximum.

## 8. Implementation sequence and gates

A. **Source audit** — map current PR #143 schema, registry resolver, OIDC verifier, worker and workflows. Record exact file/line evidence and current branch SHA.

B. **Broker protocol proof** — implement only in the isolated proof package with synthetic keys and in-memory broker; no network listener, real OIDC request, secrets, or production dependency. Test nonce atomicity, proof-of-possession, session binding, expiry and replay.

C. **D1 session ledger proof** — add a separate migration only after schema reconciliation; test immutable session/event rows and atomic session-to-attempt binding.

D. **Sandbox proof** — use a disposable runner and no credentials; verify filesystem, process, network, resource and cleanup boundaries. Do not equate a unit test with host qualification.

E. **Integration proof** — supervisor obtains session, creates per-attempt sandbox, broker issues task capability, result gateway enforces lease/fencing. Keep dispatch false and provider adapters mocked.

F. **Independent acceptance** — exact-head CI, artifact hashes, threat-model review, operational revocation drill, and owner approval. Only then consider a separately authorized production-readiness decision.

## 9. Current decision

- Current evidence: T1 registry design and T2 GitHub Actions OIDC workflow authentication proof only.
- T3 runner session / proof-of-possession: NOT IMPLEMENTED.
- T4 hardware-backed host attestation: NOT IMPLEMENTED / NOT REQUIRED TO CLAIM CURRENTLY.
- T5 task isolation: partial Docker capability proof elsewhere; actual executor runtime in the boundary NOT VERIFIED.
- Production D1, real OIDC credentials, provider credentials, provider calls, deployment, merge, and dispatch: NOT TOUCHED.
- Required invariant: `executionAuthorized:false`, `dispatch:false`.

This design intentionally separates workflow authentication, runner-session authentication, host attestation, process isolation, task authorization, and result acceptance. None is a substitute for another.
