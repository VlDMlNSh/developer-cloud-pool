# Workflow in-progress process-recovery proof — 2026-11-08

## Disposition

**VERIFIED — local Wrangler/Miniflare process-recreation scenario. NOT a Cloudflare account/production qualification.**

This report records a controlled test of a Workflow interrupted while a persisted `step.sleep()` was in progress, followed by a new Wrangler/Workerd process using the same local persistence directory.

## Immutable baseline and environment

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Proof implementation baseline: `34cdf68d44aac22c10871bf42ddf1cbadf31082e`.
- Proof branch before this report: `1eb3be17d9146d57a4335b511804946e097651ae`.
- Wrangler: `4.158.0`; Miniflare/Workerd versions resolved from the repository's pinned lockfile.
- Runtime: macOS local development host; all bindings were local (`--local`).
- Isolated persistence directory: `/tmp/dcp-inprogress-recovery2-20261108`.
- Local D1 migration `0001_attempt_ledger.sql` applied before the Worker started.
- Local Worker port before interruption: `8802`; after recreation: `8803`.
- No Cloudflare account resources, remote bindings, secrets, provider/model calls, paid fallback, deployment or dispatch were used.

## Procedure

1. Temporarily added a proof-only optional `holdBeforeCommitSeconds` branch to the local checkout of `src/workflow-proof.js`. The branch awaited a named Workflow `step.sleep()` before the existing D1 receipt step. This temporary source change was reverted after the experiment and is not part of the report commit.
2. Started Wrangler with `--local --persist-to /tmp/dcp-inprogress-recovery2-20261108`.
3. Created Workflow instance `attempt-attempt-inprogress-recovery2-42` with Attempt `attempt-inprogress-recovery2`, generation `42`, a 60-second persisted sleep, and a unique receipt payload.
4. Confirmed before interruption that D1 held Attempt status `claimed`, generation `42`, and zero receipt rows.
5. After approximately 35 seconds inside the persisted sleep, read D1 again: Attempt remained `claimed`, generation `42`, and receipt count remained zero.
6. Abruptly terminated the first Wrangler/Workerd process set (SIGKILL), including the Workerd process serving port 8802. Confirmed port 8802 no longer listened.
7. Started a distinct Wrangler/Workerd process on port 8803 with the exact same `--persist-to` directory.
8. Used the official local Workflow CLI to inspect the existing instance. It was `Running`; its persisted `process-recovery-hold-1` sleep retained its original start timestamp and showed 58 seconds elapsed, rather than being recreated from the new process start.
9. The original Workflow then reached `Completed` at the original sleep's 60-second end timestamp and executed `commit-d1-receipt-1` successfully.
10. Final D1 readback confirmed Attempt `completed`, generation `42`, exactly one step invocation, and exactly one receipt with the original JSON:

```json
{"sideEffectId":"recovery-effect-2","result":"committed-after-resume"}
```

## Evidence and interpretation

- The Workflow CLI after process recreation showed the same instance ID, status `Running`, the same sleeping step name, and its original start time.
- Final Workflow CLI status: `Completed`; last successful step `commit-d1-receipt-1`; output contained the expected receipt.
- Final D1 values: `status=completed`, `lease_generation=42`, `invocation_count=1`, `receipt_count=1`; receipt JSON unchanged.
- The 60-second Workflow completed at the original scheduled end time, not 60 seconds after the second process started. This is evidence that the local Workflow sleep state resumed rather than being restarted from the beginning.
- A preliminary 25-second attempt was excluded: the Workflow had completed before the first process was terminated, so it was not an in-progress recovery test.

## Boundaries and limitations

- This verifies one controlled local Workflows sleep/resume scenario across abrupt local Wrangler/Workerd process termination and recreation using a persistent Miniflare store.
- It does not prove Cloudflare's hosted account behavior, regional failover, multi-region consistency, D1 replication semantics, distributed concurrency, production retention, or recovery from every possible crash point.
- The local Miniflare environment is a simulator, not a security boundary and not a substitute for hosted qualification.
- The test did not place an external side effect before the sleep. Idempotency of arbitrary external side effects across a crash still requires destination-level idempotency and separate qualification.
- The temporary `holdBeforeCommitSeconds` source modification was reverted. The repository's tracked runtime/test files remain unchanged by this experiment; this commit adds only this report.

## Result

**Local in-progress Workflow recovery: VERIFIED for the tested persisted-sleep scenario.**

**Hosted Cloudflare qualification: NOT VERIFIED.**

Next: keep this evidence isolated from production adoption; continue with a bounded audit of the exact Workflow/D1 state transitions and prepare a separate account-level qualification plan before any deployment or remote binding is considered.
