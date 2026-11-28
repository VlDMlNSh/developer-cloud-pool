# CLI-Anything adoption and agent-native Pool CLI contract

**Date:** 2026-11-28  
**Status:** Pass 114 implementation — read-only CLI MVP; NOT an executor, scheduler, or authority  
**Scope:** Contour A / Developer Cloud Pool only

## 1. Decision

Adopt the engineering methodology from [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything), not its public CLI-Hub installer or unrestricted generated-command model.

The first application is a repository-owned, read-only operator/agent CLI named `poolctl`. It wraps the existing Pool Contract validator and emits a stable machine-readable result. It does not replace GitHub Actions, the API attestation verifier, the D1 ledger, admission receipts, executor qualification, or governance.

Initial command:

```sh
node scripts/poolctl.mjs contract validate --json
```

This command is a local contract check. It is not evidence of live worker availability, hosted D1 state, production readiness, or Contour A acceptance.

## 2. Upstream assessment and provenance

Reviewed upstream files on 2026-11-28:

| Artifact | Upstream path | Blob SHA | Finding |
|---|---|---|---|
| README | `README.md` | `8a78b5420911eff5e7cc219bf1ecb2a12b562874` | Describes the generator, Claude Code plugin, CLI-Hub, harness workflow and project-reported test coverage |
| Harness SOP | `cli-anything-plugin/HARNESS.md` | `4fd881137c280cf33fcbf9342b91629524906136` | Analysis → design → implementation → test plan → tests → skill → packaging |
| Security policy | `SECURITY.md` | `5135f80daa19d48325b9c6f0f27204930664f40b` | Explicitly identifies prompt-injection, subprocess argument, script injection, path traversal and credential exposure risks |
| License | `LICENSE` | `ee86799f79a1dd41bd82923f4dbf40cfb336684d` | Apache License 2.0 |

Upstream README reports 18 application demos and 2,461 passing tests. These are maintainer-reported project figures, not an independent audit or a guarantee for our environment.

## 3. Reuse First

| Capability | Decision | Application |
|---|---|---|
| CLI-Anything harness methodology | ADAPT | Command taxonomy, agent-readable help, JSON output, test-first workflow, real subprocess tests and per-command documentation |
| Apache-2.0 source | REUSE selectively | Methodology and documented design patterns; retain attribution if source code is copied later |
| CLI-Hub auto-discovery / installer | REJECT for control plane | No dynamic third-party CLI installation, registry execution or unreviewed skill download |
| Claude Code plugin | DEFER | No plugin installation or invocation in this pass; server-3 authorization/session was not established |
| Click / Python package scaffold | REJECT for MVP | Existing project uses Node.js ESM; avoid a second runtime and new dependencies |
| Stateful REPL / undo-redo | DEFER | A persistent interactive control surface would expand authority and state complexity without solving a current requirement |
| Existing Pool Contract validator | REUSE | `scripts/validate-pool-contract.mjs` remains the single source of contract assertions |
| Existing Node runtime and `node:test` | REUSE | No additional package or hosted service |

## 4. Fit to the Cloud Pool architecture

`poolctl` is a presentation and diagnostics adapter only.

- GitHub Actions remains the scheduler and workflow execution plane.
- The API verifier remains responsible for validating GitHub event and workflow provenance.
- D1 remains the durable admission, receipt and task-state ledger.
- The qualified controller remains the only future path that may request a permitted admission.
- Executor identity, issuer/capability checks, quotas and execution authorization remain outside the CLI.
- `poolctl` cannot create approvals, admissions, leases, outbox records or dispatches.

The current Pool Supervisor script is a retired heartbeat and must stay fail-closed. This CLI does not revive legacy label-driven dispatch.

## 5. Implemented command contract

### `poolctl contract validate [--json]`

- Runs the fixed repository validator using `process.execPath` and a fixed script path.
- Uses an argument array and explicit `shell: false`; no caller-provided command or executable is accepted.
- Applies a 10-second child-process timeout and a 64 KiB output cap.
- Passes only a minimal child environment (`PATH`, plus `SystemRoot` on Windows); no GitHub token, provider credential or repository secret is forwarded.
- Accepts no task body, arbitrary workflow name, target path, shell expression or user-defined environment mapping.
- Has no network, D1, filesystem mutation, credential, approval, lease, executor or dispatch operation.

JSON success schema (version 1):

```json
{
  "schemaVersion": 1,
  "command": "contract.validate",
  "status": "PASS",
  "checks": ["PASS ..."],
  "failures": [],
  "dispatch": false,
  "executionAuthorized": false
}
```

On rejection, `status` is `FAIL`; stable error codes are returned for unsupported commands/options and child-process failure. The process exits non-zero. Human-readable mode preserves the validator's existing output.

## 6. Security invariants

1. Read-only by construction; no mutation command group exists.
2. No arbitrary shell command, shell interpolation, `shell: true`, dynamic action/workflow name, or caller-controlled executable.
3. Child-process arguments are fixed; child environment is explicitly allowlisted.
4. Output is bounded and JSON is deterministic; no stack trace, environment dump or credential value is emitted.
5. Unknown commands and options fail closed.
6. Every machine-readable result explicitly reports `dispatch: false` and `executionAuthorized: false`.
7. No third-party CLI-Hub package or plugin is installed dynamically.
8. CLI success means only that the local Pool Contract validator passed. It must never be translated into runtime, executor or Contour A acceptance.

## 7. Test strategy

Pass 114 adds real subprocess tests using Node's test runner:

- help surface contains only the documented read-only command;
- contract validation returns stable JSON with checks and empty failures;
- unsupported mutation-like command is rejected;
- unknown options are rejected;
- a caller environment sentinel is not emitted;
- dispatch and execution authorization remain false on success and failure.

The Pool Contract GitHub Actions workflow runs these tests alongside its existing validator. A passing test suite still does not prove hosted D1, live API authenticity, remote UI, executor qualification or independent security review.

## 8. Deferred expansion gates

Do not add further commands until the Controller → API Envelope → attested D1 path is composed and tested on one candidate branch.

Possible later read-only commands, subject to explicit contracts and tests:

- `poolctl envelope verify --json` — only after the production envelope source and exact schema are settled;
- `poolctl receipt inspect --json` — local fixture or explicitly read-only test binding only;
- `poolctl evidence export --json` — deterministic evidence bundle without credentials.

No `dispatch`, `approve`, `claim`, `lease`, `run`, `exec`, `provider`, `secret`, `quota set`, or hosted D1 write command is in scope. Any future mutation capability requires a separate owner-approved controller contract, independent security review and explicit authorization.

## 9. Acceptance boundary

Pass 114 is a bounded CLI foundation. It is not a replacement for the blocked Controller/API/D1 composition work and does not qualify Contour A.

- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Dispatch and execution authorization: false.
- Claude Code plugin execution: NOT RUN.
- Independent security review: NOT RUN.

## 10. Upstream references

- https://github.com/HKUDS/CLI-Anything
- https://github.com/HKUDS/CLI-Anything/blob/main/cli-anything-plugin/HARNESS.md
- https://github.com/HKUDS/CLI-Anything/blob/main/SECURITY.md
- https://github.com/HKUDS/CLI-Anything/blob/main/LICENSE
- https://arxiv.org/abs/2606.03854

