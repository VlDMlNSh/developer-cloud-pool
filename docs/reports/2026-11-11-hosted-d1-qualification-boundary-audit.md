# Hosted D1 qualification boundary audit — 2026-11-11

- Status: DOCUMENTATION / DESIGN ONLY; hosted qualification NOT RUN; provisioning NOT AUTHORIZED.
- Scope: Issue #38 claim-service hosted qualification prerequisites and the current Cloudflare account inventory.
- Research report: https://agent.tinyfish.ai/research/01a1ca9a-c166-76d3-936a-769d2eecb066
- Canonical decision: [durable Supervisor claim protocol](../decisions/2026-11-11-durable-supervisor-claim-protocol.md).
- Related work: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38), [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37), [PR #54](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54), [PR #64](https://github.com/VlDMlNSh/developer-cloud-pool/pull/64).

## 1. Executive disposition

A hosted D1 contention proof is a necessary qualification increment, but it is not ready to run. The account inventory currently exposes zero D1 databases and zero Worker scripts. The account API reports an account of type `standard`; this is not evidence of Workers Free entitlement, billing status, card-free eligibility or available quota. No resource was created or modified.

The current local D1 proof is useful evidence, not a deployable qualified service. PR #54 is OPEN/DRAFT and its current head is stacked on a base that is 106 commits behind and divergent from the current default branch. Its local CI result must not be treated as proof for a source tree that has been reconciled to the current default branch.

**Important test-design correction:** `wrangler d1 execute` / a D1 SQL batch can apply migrations and inspect or seed test data, but a sequential SQL batch is not a 50-client concurrent claim test. A real one-winner contention test must issue concurrent independent requests through a test-only claim-service Worker/API backed by the actual hosted D1 database. Do not describe a serial SQL batch as concurrent qualification.

## 2. Immutable repository observations

- Pool default branch: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Active ruleset: `26550182`, applies to `refs/heads/Основной`; PR required, but required approvals = 0, required reviewers empty, CODEOWNERS review disabled, last-push approval disabled. It does not enforce independent approval.
- Default Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; it still declares `workflow_run` completion trigger and `actions: write`. No dispatch was run.
- PR #37: OPEN/DRAFT/UNMERGED; head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Current-head boundary CI run `42484039940` and contract CI run `42484039932` are SUCCESS. Formal review history includes CHANGES_REQUESTED; no current approval. These static checks do not establish actual reusable Worker execution or fix the default-branch privileged chain.
- Issue #38: OPEN. It requires real-backend contention, interrupted-claim recovery, least privilege, exact-head CI and independent security review. It remains PLANNED / NOT IMPLEMENTED / NOT QUALIFIED.
- PR #54: OPEN/DRAFT/UNMERGED; current head `15a09c910f52553c59796260131a6b5a4a39c15f`; local proof run `43010770730` SUCCESS. The PR base `b9067dc7d06245893cd4e208f6215438efe5ca64` is 106 commits behind and diverges from current default `6fdcedebeba62715122e43a75c6ad6d926321ce7`. Reconcile the complete proof stack and rerun exact-head CI before considering hosted execution.
- PR #64: OPEN/DRAFT/UNMERGED; head `b1aa2031d46446896c70bb354af858fc2dd64ebc`, base equals current default. Exact-head PR workflow query returned no runs; formal reviews = 0; inline threads = 0. CI is NOT VERIFIED.

## 3. Cloudflare account read-only inventory

A read-only API inventory returned one accessible account, account type `standard`, D1 database count 0 and Worker script count 0. The D1 and Worker list calls succeeded. The available account metadata did not establish Workers Free entitlement or remaining quota. Billing/subscription status was not queried, and no billing or secret values were accessed.

Consequences:
- Existing hosted resources cannot be reused in this account based on this inventory.
- Product documentation showing a Free tier is not proof that this account is eligible or currently operating under that tier.
- Do not create a database, Worker, namespace, token, secret, or other resource until the exact account's free eligibility, quota, permissions, ownership and no-paid-fallback boundary are established.
- No payment-card workaround, upgrade, billing change or paid fallback is permitted.

## 4. Required source reconciliation before hosted proof

1. Freeze the candidate source at an immutable commit based on the current default branch.
2. Reconcile the entire PR #39/#54 and dependent proof stack; do not run an old stacked branch merely because its local tests passed.
3. Confirm the selected migration set and test adapter against the canonical accepted source. Treat any unmerged migration as experimental until reconciled and accepted.
4. Run exact-head local CI for the reconciled source and record workflow run IDs, job IDs, tested SHA and artifact digests.
5. Keep PR #37's default-branch authorization and finalizer findings separate. Hosted D1 success cannot qualify the Supervisor/Worker boundary.

## 5. Hosted qualification topology

After all provisioning gates pass, the isolated test topology should be:

```
Concurrent test clients
        |
        | N independent authenticated HTTP requests
        v
Test-only claim-service Worker (no production route)
        |
        | one narrowly scoped D1 binding
        v
Dedicated qualification D1 database
        |
        +--> task/claim/outbox rows
        +--> append-only test evidence
```

The test Worker must:
- expose only the narrowly scoped qualification operation;
- authenticate a test-only capability held server-side (never in browser output, repository, CI logs or artifacts);
- bind every request to a fixed test tenant, repository/task identity, immutable envelope digest and test profile;
- use trusted service time, not caller-supplied time, for hosted expiry decisions;
- have no GitHub write permissions, no dispatch capability, no provider credentials and no production bindings;
- return `dispatch:false` for every result;
- reject arbitrary SQL, arbitrary table names, arbitrary task identifiers and production task identities;
- be removed after evidence capture and cleanup approval.

The database must be a dedicated qualification database with no production data. The test service must not be reachable as a general-purpose application.

## 6. Qualification procedure and acceptance evidence

### Gate A — account and resource eligibility
- Verify account owner identity and account ID through approved metadata-only access.
- Verify the actual plan/entitlement and Free quota in an authoritative account view.
- Verify the exact D1/Workers permissions required for the isolated test.
- Confirm no billing transition, card requirement, upgrade or paid fallback can occur.
- Record a redacted evidence snapshot; do not include account identifiers or credential values in public logs.

If any item is unresolved, stop: hosted proof status remains NOT RUN.

### Gate B — isolated provisioning
- Obtain explicit authorization for the named qualification database and test-only Worker.
- Create only the minimum isolated resources, with a unique qualification name and no production bindings.
- Record resource IDs privately and only non-sensitive evidence in the report.
- Apply the exact reviewed migrations from the immutable reconciled source.
- Capture the platform audit evidence for resource creation.
- Do not deploy a production Worker, change production schema, or enable Supervisor dispatch.

### Gate C — actual concurrent contention
- Generate 50 independent client requests concurrently against the test-only Worker, all targeting the same canonical logical task and envelope digest but using distinct valid approval/request identities.
- Use separate HTTP requests and independent client tasks; do not use a serial SQL batch as a substitute.
- Verify exactly one logical task and one task-level outbox are created; all other requests must receive the contractually defined idempotent/duplicate result.
- Verify no request can create a second task/outbox through a retry, replay, changed owner, changed repository, changed target SHA, changed profile or changed envelope digest.
- Record request IDs, response classifications, database row deltas, timestamps and test artifact digests without recording the capability itself.

Pass requires one canonical task, one task-level outbox, no conflicting claim, and no dispatch/provider side effect. Any ambiguous response must remain indeterminate until authoritative reconciliation; it must not be requeued merely because a client timed out.

### Gate D — failure and recovery
- Fault-inject a lost HTTP response after transaction commit; retry the same immutable request and prove exact idempotent recovery.
- Fault-inject transaction failure before commit and verify rollback leaves no partial task/outbox.
- Restart the test Worker between requests and verify durable state remains.
- Exercise duplicate/replayed requests, stale generation, stale owner, expiry boundary, mismatched envelope and unavailable database.
- Verify that ambiguous or indeterminate attempts create reconciliation work only; no automatic retry or dispatch is authorized.
- Capture backup/restore evidence only if supported by the approved test scope; do not infer restore qualification from local SQLite tests.

### Gate E — quotas and cleanup
- Capture per-query `meta.rows_read` and `meta.rows_written`, aggregate daily usage and storage before/after the test.
- Calculate Free-tier headroom from verified account quota, not public documentation alone.
- Capture audit-log evidence for database/Worker creation and deletion.
- After evidence review, explicitly authorize teardown; delete only the named qualification resources and verify the resulting inventory is empty.
- Preserve immutable test artifacts and hashes without retaining credentials or personal data.

## 7. Explicit non-claims

Even a passing hosted D1 contention test does not prove:
- trusted issuer authentication, owner authority, signed capability provenance or revocation;
- trusted production clock or key custody/rotation;
- production Worker deployment or authenticated web console;
- Supervisor/Worker execution, workflow finalization or external side-effect exactly-once semantics;
- lease/fencing/recovery across all crash points unless separately tested;
- model routing, provider quotas, secret isolation or free-only inference;
- independent security/governance acceptance of Contour A.

## 8. Mature-component reuse

- Reuse Cloudflare D1 and the official Workers Vitest integration already used by the local proof; do not build a database engine.
- Reuse the existing conditional claim/outbox and immutable attempt fixtures only after their source stack is reconciled and reviewed.
- Keep GitHub Issues as the human-facing projection, not the authoritative CAS lock.
- Do not introduce Durable Objects, OpenBao, SPIRE, OPA or a new identity server unless a verified requirement cannot be met by the selected minimal design. The independent research identified oauth4webapi as a suitable OAuth protocol library and Cloudflare's Workers OAuth provider as a candidate, but neither is needed to prove the D1 claim primitive.
- Do not implement OAuth/session production behavior as a prerequisite for the isolated database contention experiment; keep the test capability narrow and non-production.

## 9. Current disposition and next step

- Account inventory: VERIFIED read-only; 0 D1 databases, 0 Worker scripts.
- Workers Free entitlement: NOT VERIFIED.
- Hosted D1 provisioning: NOT AUTHORIZED / NOT RUN.
- PR #54 local proof: CI SUCCESS at its current head; source stack is stale/divergent from current default and must be reconciled.
- PR #64 exact-head CI: NOT VERIFIED; reviews 0; threads 0.
- Default dispatch path: still privileged; PR #37 is not merged and has no current approval.
- Issue #38: OPEN / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: reconcile the claim/outbox proof stack onto the current immutable default branch and produce a reviewed exact-head local proof before asking for hosted provisioning. In parallel, obtain non-secret evidence of account Free eligibility. No resource creation or dispatch is authorized by this document.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
