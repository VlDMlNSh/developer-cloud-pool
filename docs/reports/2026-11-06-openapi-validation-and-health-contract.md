# Engineering report — 2026-11-06: OpenAPI validation and health security alignment

## Scope

Add automated OpenAPI 3.1 linting to the architecture/contract PR and correct a mismatch between the API contract and the already implemented service-health endpoint. No OAuth secrets, session implementation, Worker deployment, paid resources, task mutation, dispatch or external provider integration.

## Findings

1. The OpenAPI document declared a global `jarvisSessionCookie` security requirement. Its `/health` operation did not override that requirement, even though the Hono prototype exposes `/api/v1/health` as a public service-only health check. This was a contract/runtime mismatch.
2. The contract had no automated standards-aware OpenAPI lint step.

## Changes

- Added `security: []` to `GET /health`, explicitly overriding global cookie authentication. Removed 401/403 responses from this public endpoint. All other operations remain under the global session-cookie security requirement.
- Added `.github/workflows/jarvis-experience-openapi-validation.yml`:
  - contents:read only;
  - checkout with credentials persistence disabled;
  - Node.js 24;
  - Redocly CLI pinned to 2.75.0;
  - telemetry and update notifications disabled;
  - runs `redocly lint contracts/jarvis-experience-api-v1.yaml`.
- Selected Redocly CLI 2.75.0 rather than the newer 2.76.0 listing because 2.75.0 is a published stable release with recent release history and usage evidence. CLI version is pinned; npm transitive dependency closure is not committed as a lockfile in this documentation branch.

## Evidence

- PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- API contract blob: `3cab6581f88a37d6090aeda5df1fb7157f749f84`.
- Workflow blob: `47d3afecc918df0926a63b5cf2a6de473356f5d6`.
- Commit / PR head: `8f8613eebb4a37e3a1c2296b66e9f7b53090d1ae`.
- Compare against base `64d2636d4500127e635c214ccfb722c6b3fcda80`: 42 ahead / 0 behind.
- Redocly OpenAPI validation run [42179122243](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42179122243): SUCCEEDED.
- Pool Contract Validation run [42179122159](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42179122159): SUCCEEDED.
- OpenAPI validation job steps read back: checkout, Node 24 setup, and validation completed successfully.
- PR #24 formal reviews / inline threads: 0 / 0. Independent review NOT RUN.
- Exact-head CI at `8f8613eebb4a37e3a1c2296b66e9f7b53090d1ae`: 2 workflows SUCCEEDED.

## Status

- OpenAPI 3.1 lint: VERIFIED for this exact HEAD.
- Public health operation security semantics: corrected and read back.
- OAuth/session runtime: NOT IMPLEMENTED.
- OAuth credentials: NOT CONFIGURED.
- Workers Free entitlement: NOT VERIFIED.
- Deployment and iPhone browser QA: NOT RUN.
- Production dispatch: BLOCKED / FAIL-CLOSED.

## Next bounded step

Build a no-secret authentication/session fixture with deterministic tests for OAuth state mismatch/replay/expiry, allowlist rejection, cookie flags, session expiry/revocation, CSRF and fixed-upstream allowlisting. Keep the fixture isolated from production credentials and do not enable protected routes. Obtain independent review before any live OAuth configuration.


## Final read-back and branch provenance

- Read-back confirmed contract blob `3cab6581f88a37d6090aeda5df1fb7157f749f84` and workflow blob `47d3afecc918df0926a63b5cf2a6de473356f5d6`.
- Report blob before this verification append: `ac83161c641e2e71fd8a97bc903ca4af7575b30b`; checkpoint blob before final append: `ca3c3c96d3f8de5e36d28973cfa62ace7dd40170`.
- Branch snapshot after report/checkpoint publication: `a15680a46b508b2fe205547e363a4aaba3c0e10e`, 44 ahead / 0 behind base. The last two commits after CI HEAD `8f8613eebb4a37e3a1c2296b66e9f7b53090d1ae` are report/checkpoint-only; no exact-head workflow runs were returned for `a15680a...`. CI is VERIFIED for the API/workflow changes at `8f8613e...`; latest docs-only successor CI NOT VERIFIED.
- Formal PR #24 reviews / inline threads remain 0 / 0.
