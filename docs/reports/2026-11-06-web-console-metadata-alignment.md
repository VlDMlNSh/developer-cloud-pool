# Engineering report — 2026-11-06: web-console control-plane metadata alignment

## Scope

Align Issue #22 and PR #24 metadata with the already corrected hosting ADR and OpenAPI authentication contract. No runtime, secrets, Cloudflare configuration, billing, deployment, dispatch, or merge changes.

## Finding

The source documents had moved from Cloudflare Access to application-level GitHub OAuth/session, but the PR #24 description and Issue #22 retained the earlier Access-based design and stale Cloudflare provisioning prerequisites. This was a review/governance risk: a reviewer could follow the obsolete instructions even though the contract files had changed.

## Changes

- Updated PR #24 description to state the no-card application-auth target and current implementation/deployment blockers.
- Updated Issue #22's hosting candidate and authentication requirements to server-side GitHub OAuth, single-use state, immutable numeric owner-ID allowlist and opaque `__Host-jarvis_session` cookie.
- Replaced the stale Cloudflare readiness block. Current known state: `jarvis-developer-cloud-pool.workers.dev` namespace was provisioned and read back; Worker scripts remain empty; Access is disabled/not required; no zone is attached; Workers Free entitlement remains NOT VERIFIED due unavailable Billing Read scope.
- Preserved the distinction between design and implementation. OAuth credentials and session runtime are NOT CONFIGURED / NOT IMPLEMENTED.

## Evidence

- PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- ADR blob: `45f759ede025bb9c98e3f471c1398fe3b2ce931c`.
- OpenAPI blob: `2b45f7db2e84c4585cf05b515f9bdd01fa4adc4b`.
- Before metadata alignment, PR #24 branch snapshot `3c14939d8630d6c32a6c3bdc3158b07ab44a3d17` was 36 ahead / 0 behind base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #24 and PR #25 formal reviews/inline threads were 0/0 at recheck.
- PR #25 implementation branch remains `fdda4c143cbb4b65c123b5458e0f8bef5fa5f9a4`, 20 ahead / 0 behind base.
- Exact-head CI for the documentation successor remains NOT VERIFIED; the workflow-run lookup returned no PR-triggered runs. No independent review has been recorded.

## Status

- Metadata alignment: UPDATED / READ-BACK REQUIRED.
- OAuth/session runtime: NOT IMPLEMENTED.
- Workers Free entitlement: NOT VERIFIED.
- Worker deployment: NOT RUN.
- Browser/iPhone QA: NOT RUN.
- Production dispatch: BLOCKED / FAIL-CLOSED.
- No Gemini or Claude agent was dispatched. The required Gemini controller workflow was not found on the default branch.

## Read-back and provenance verification

- Report blob read back: `72470abbd5e0a8956ebbe06216bf5cae9cb0e61c`.
- Checkpoint blob read back: `bc2b731658333019af009661a646ebab4d8867ec`.
- Branch compare at checkpoint commit `dd09e9b77a56e1d68f943fa77f0d6eb516f439da`: 38 ahead / 0 behind base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head CI lookup returned no PR-triggered runs; this docs-only head is NOT VERIFIED by CI.
- Issue #22 Cloudflare readiness section was subsequently corrected to remove stale provisioning prerequisites and record the verified workers.dev namespace and unresolved Workers Free entitlement.

## Next bounded step

Validate the OpenAPI 3.1 document with a pinned parser and build a no-secret local auth fixture with negative tests. Do not create credentials or deploy until exact-head CI, independent security review, no-cost hosting entitlement and explicit authorization are all verified.
