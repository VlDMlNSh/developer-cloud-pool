# Local Workflow + D1 process-recreation proof — 2026-11-08

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Proof branch before report publication: `proof/cloudflare-workflows-vitest-2026-11-08`
- Implementation SHA under test: `34cdf68d44aac22c10871bf42ddf1cbadf31082e`
- Test harness: existing official Cloudflare Workers SDK fixture, `@cloudflare/vitest-plugin@1.6.0`, Wrangler `4.158.0`, local Miniflare/Workerd.
- Execution host: Voktors-Mini.Dlink (Desktop Commander device ID `e264f341-2e21-4dfc-9f97-9b95cd08bcd3`). This is a local test host only; it is not qualified as a pool worker or SentinelX Claude host.
- Persistence directory: isolated `/tmp/cdp-process-restart-state`; no project or production state was used.

## Procedure

1. Installed the pinned project dependencies with `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` (exit 0; npm emitted non-fatal TAR_ENTRY_ERROR warnings while unpacking optional platform files).
2. Started the existing proof Worker using `wrangler dev --config wrangler.proof.jsonc --local --persist-to /tmp/cdp-process-restart-state`.
3. Applied the local D1 migration to the isolated persistence directory with `wrangler d1 migrations apply synthetic-proof-only --local --config wrangler.proof.jsonc --persist-to /tmp/cdp-process-restart-state`.
4. Created Workflow `attempt-attempt-process-restart-2-32` using Attempt `attempt-process-restart-2`, generation 32, and a synthetic receipt.
5. Queried local D1. Before stopping the process, the row was `status=completed`, `lease_generation=32`, `invocation_count=1`, `receipt_count=1`, with the expected receipt JSON.
6. Terminated the first Wrangler process (PID 66614), then started a distinct Wrangler process (PID 67553) against the same Worker config and persistence directory.
7. Replayed the exact same Workflow create request after process recreation. The Worker returned HTTP 500 with `WorkflowError: (instance.already_exists)` for the same Workflow instance ID. This is the expected duplicate-instance rejection, not a successful HTTP request.
8. Queried local D1 again after process recreation. The Attempt remained completed at generation 32, `invocation_count=1`, and exactly one unchanged receipt row remained.
9. Terminated the test server and removed temporary `node_modules` and `.wrangler` directories from the proof checkout. The tracked worktree remained clean at the implementation SHA.

## Result

**VERIFIED — bounded local completed-instance process-recreation persistence.**

Across two distinct Wrangler/Workerd OS processes sharing the same explicit local persistence directory:
- D1 Attempt state survived.
- The single D1 receipt survived unchanged.
- The step invocation count remained exactly one.
- The completed Workflow instance identity survived; a duplicate create was rejected as `instance.already_exists`.

The evidence is local and synthetic. It demonstrates persistence of a completed Workflow instance and D1 state across local process recreation.

## Important limitations

- The process was stopped only after the Workflow had completed. This does **not** prove recovery/resumption of an in-progress Workflow after abrupt process termination.
- This is not a Cloudflare-hosted account test and does not establish production D1/Workflow semantics, regional failover, distributed concurrency behavior, production retention, external side-effect idempotency, or authority/capability correctness.
- The initial pre-migration trigger attempt produced a visible `D1_ERROR: no such table: pool_attempts`; the local migration was then applied and the second, distinct attempt completed successfully. The failed preliminary attempt is excluded from the positive result.
- npm emitted optional-package TAR_ENTRY_ERROR warnings during installation despite exit code 0; this was not represented as a warning-free install.

## Acceptance and next step

- This report adds no runtime code and does not change the implementation under test.
- Keep PR #52 DRAFT / UNMERGED.
- Next bounded proof, if pursued: create a separate in-progress Workflow fixture with a controlled wait, terminate the Wrangler process while the Workflow is running, recreate it against the same local persistence directory, and verify whether the Workflow resumes exactly once. Do not call that Cloudflare production recovery.
- Real Cloudflare account qualification remains a separate future gate requiring authorized account-level execution; no credentials, secrets, remote D1, provider calls, deployment, or dispatch were used here.
