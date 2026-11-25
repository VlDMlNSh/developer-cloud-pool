# Four-account Gemini Controller — candidate implementation

Date: 2026-11-16  
Status: FOUR ISOLATED TASK ENVELOPES IMPLEMENTED IN CANDIDATE; NOT APPROVED FOR LIVE DISPATCH

## Scope

The candidate maps four distinct task payloads one-to-one to four Gemini clients and four configured credential slots:

- Agent 1 / researcher / `GEMINI_API_KEY_1`: inspect current Cloud Pool architecture and mature reusable upstream components.
- Agent 2 / implementer / `GEMINI_API_KEY_2`: define the smallest bounded Cloud Pool-native controller implementation boundary.
- Agent 3 / tester / `GEMINI_API_KEY_3`: construct the adversarial test matrix for dispatch, failure handling, and provenance.
- Agent 4 / security auditor / `GEMINI_API_KEY_4`: audit authority, workflow permissions, secret isolation, account separation, and quota handling.

Each invocation receives only its own work-item text plus its fixed role constraints. The candidate rejects missing, extra, duplicate, empty, oversized, or API-key-shaped task payloads. It does not merge task payloads into a shared prompt.

The implementation targets Google's official `googleapis/js-genai` SDK (`@google/genai`; upstream package version observed: 3.3.0). The dependency is not installed in this candidate and no provider request has been made.

## Security properties

- Four credentials are mandatory; a missing key blocks all client creation.
- Duplicate credential values (including values equal after trimming) block dispatch before client creation; values are neither logged, hashed, nor returned.
- Four unique task payloads and fixed role constraints are checked before dispatch.
- Keys are read from process environment only and never included in result objects or explicit logs.
- Each request is sent through a separate SDK client and remains attributable to its account slot.
- HTTP 429 is reported as `QUOTA_EXHAUSTED`; 401/403 as `AUTH_FAILED`.
- No automatic retries, account rotation, or cross-account fallback.
- Agent outputs are untrusted text. This controller does not execute code, invoke tools, write repositories, or perform privileged actions.
- Partial success is explicit; full SUCCESS requires four non-empty outputs.

## Explicit non-goals

This candidate does not read or validate GitHub Actions secrets, create or modify secrets, dispatch GitHub workflows, integrate with the production Supervisor/Worker, provide durable queueing/checkpoint-resume/transactional approval, or prove that the four API keys belong to four distinct Google accounts.

## Required gates before any provider execution

1. Verify all four GitHub Actions secret names exist without reading values.
2. Verify account separation and independent quota ownership using owner-controlled account metadata.
3. Pin and install the official SDK in a dedicated validation workflow with no production dispatch permissions.
4. Run exact-head no-secret tests and contract validation.
5. Independently review workflow permissions, secret exposure, logging, quota handling, and caller provenance.
6. Fix the production caller boundary and durable dispatch/recovery contract.
7. Keep runtime dispatch disabled until governance and owner authorization are verified.

## Test strategy

`node --test scripts/gemini-four-agent-controller.test.mjs` uses injected fake clients and makes no provider calls. It verifies four distinct payloads are isolated (each agent receives its own payload and none of the other three), exactly-four validation, duplicate-task rejection, missing/duplicate credential fail-closed behavior, per-account quota isolation, key-shaped task rejection, and credential omission from reports.
