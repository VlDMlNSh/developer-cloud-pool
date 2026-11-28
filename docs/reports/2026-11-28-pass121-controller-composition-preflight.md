# Pass 121 — Controller composition preflight (2026-11-28)

## Status

**VERIFIED**: bounded source/lineage investigation.  
**BLOCKED**: end-to-end controller → API collector → Workers verifier → local D1 attested-adapter composition.  
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen scope

- Target source head: `82b7983d9b4178ffbad44bcfc8122a87a0026123` (Pass 120 documentation head; implementation code/test head remains `8d0401ec7d45542a71e20594a9f22d193afe4846`).
- Scope: inspect the Pass 120 tree, the previous read-only controller candidate, D1 adapter imports and existing CI evidence. No runtime dispatch, hosted D1, provider calls, deployment, merge or production mutation.
- DoD: identify a safe controller reuse path, verify provenance compatibility, determine legacy adapter import exposure, and record the next implementable composition boundary.

## Findings

1. The Pass 120 branch does not contain `.github/workflows/next-event-controller.yml`. The default branch also returned NOT_FOUND for this path.
2. A prior controller candidate exists on `feat/pass98-canonical-next-controller-audit-2026-11-25`:
   - workflow blob: `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a`
   - audit script blob: `4e969000ab32df6ff37663c329fe406b859809f4`
   - It is read-only, uses pinned checkout/setup-node actions and GitHub read permissions.
3. That candidate is **not safe to copy unchanged**. Its audit script reads workflow bytes at `workflowRun.head_sha` and asserts `workflowFile.refSha === workflowRun.head_sha`. Pass 120 explicitly corrected this provenance relation: workflow bytes must be fetched at immutable `GITHUB_WORKFLOW_SHA`, with `workflowFileRefSha === workflowCommitSha`, while target/default HEAD remains a separate SHA. Reusing the old script unchanged would reintroduce the exact Pass 120 defect.
4. The Pass 120 API collector already exports `collectOwnerNextEnvelope` and returns the exact serialized `sourceJson`, digest, envelope and fail-closed policy. It fixes API origin/repository, bounds response bytes and timeouts, rejects redirects, validates owner/event/run metadata, checks default-ref stability and verifies Git blob SHA for workflow bytes at `GITHUB_WORKFLOW_SHA`.
5. The Workers verifier `verifyOwnerNextEnvelopeForActions` accepts serialized source JSON, supplied digest and trusted Actions context. The D1 module exports `admitGitHubNextAttestedEvent`, which invokes that verifier before D1 admission and persists attestation provenance in migration 0018.
6. The D1 integration test currently builds a synthetic attested envelope fixture and calls the attested adapter. It does **not** consume the actual collector output. The test file also imports the legacy `admitGitHubNextEvent` for compatibility cases.
7. The current Workers `src/worker.mjs` is deliberately inert and contains no import of the GitHub event adapter. This proves no live HTTP/dispatch ingress in that entrypoint; it does **not** prove the complete repository production import graph is isolated. Full import-graph proof remains NOT VERIFIED.
8. PR #186 remains OPEN; review submissions and inline review threads observed: 0 and 0. PR #187 is validation-only and must never be merged. The latest observed Pass 120 D1/Pool Contract workflow runs on docs head `82b7983...` completed SUCCESS, but they do not prove same-run controller/API/D1 composition.

## Reuse First decision

- **REUSE**: existing bounded API collector, canonical Envelope v1 validator, Workers verifier, D1 attested adapter, migration 0018, pinned GitHub Actions dependencies and local D1 Vitest harness.
- **ADAPT**: previous read-only controller workflow structure only. Replace its old audit script path with the Pass 120 collector and bind workflow provenance to `GITHUB_WORKFLOW_SHA`.
- **DO NOT REUSE unchanged**: Pass 98 audit script; its workflow-file ref binding is incompatible with the corrected Pass 120 provenance contract.
- **BUILD**: a small CLI bridge that reads the event file and Actions runtime context, calls the collector with read-only `GITHUB_TOKEN`, serializes source JSON/digest/trusted context without logging secrets, and a CI composition path that passes that exact serialized envelope/digest into the local D1 attested-adapter integration test.
- No new package/dependency is justified at this stage.

## Verification evidence

- Pass 120 D1 run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46168608155 — SUCCESS, 9/9 files, 139/139 tests.
- Pass 120 Pool Contract runs:
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46168608158 — SUCCESS, 29/29 tests.
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46168608181 — SUCCESS, 29/29 tests.
- Current docs-head workflow runs:
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46168765420 — D1 clean-base job SUCCESS.
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46168765439 — Pool Contract job SUCCESS.
- PR #186 reviews: 0; inline threads: 0.
- Local tests in this pass: NOT RUN. Independent security review: NOT RUN. Exact current governance/ruleset detail: NOT VERIFIED.
- No secrets or secret values read; no provider calls; no hosted D1 writes; no dispatch; no executor launch; no deployment; no merge.

## Metrics

- Active engineering time: NOT MEASURED.
- Tool/CI elapsed time is not counted as engineering labor.
- Code changes: 0.
- New dependencies: 0.
- Defects fixed: 0 (this pass is preflight only).
- Critical path: safe controller bridge → exact serialized collector output → Workers verifier → local D1 attested receipt/replay test → import-graph proof → independent review.

## Next bounded step — Pass 122

Implement only the minimal read-only controller composition on the Pass 120 lineage:
1. Add the issue_comment workflow with least-privilege read permissions and pinned actions.
2. Add a CLI bridge that invokes the existing collector using `GITHUB_WORKFLOW_SHA`; preserve the exact source JSON and digest as test input/artifact without printing tokens or sensitive values.
3. Add a local D1 integration test path that consumes that same serialized envelope/digest and trusted Actions context, then calls only `admitGitHubNextAttestedEvent`.
4. Add a test proving the legacy non-attested adapter is not reachable from the production entrypoint/import graph; retain compatibility tests only in test scope.
5. Keep `dispatch=false` and `executionAuthorized=false`; no hosted D1, provider call, secret inspection, executor, deployment or merge.
6. Run exact-head and clean-base CI; require independent security review before any qualification.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
