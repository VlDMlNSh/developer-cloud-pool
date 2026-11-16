# Four-account Gemini Controller — candidate implementation

Date: 2026-11-16  
Status: IMPLEMENTED IN ISOLATED BRANCH; NOT APPROVED FOR PRODUCTION

## Scope

This change adds a small candidate controller that sends one bounded project task to four independent Gemini API clients. Each client is constructed with exactly one account key and receives a distinct fixed role instruction (researcher, implementer, tester, security auditor):

- GEMINI_API_KEY_1
- GEMINI_API_KEY_2
- GEMINI_API_KEY_3
- GEMINI_API_KEY_4

The implementation reuses Google's official `googleapis/js-genai` SDK (`@google/genai`; upstream package version observed: 3.3.0). The dependency is intentionally not installed or executed by this source-only candidate pass.

## Security properties

- All four credentials are mandatory; a missing key blocks the entire dispatch before any client is created.
- Duplicate credential values (including values equal after trimming) block the entire dispatch before any client is created; the values are neither logged, hashed, nor returned.
- Four fixed role instructions provide distinct task envelopes; role identifiers are included in result provenance.
- Keys are read from process environment only and never included in result objects or logs.
- Each request is sent through a separate SDK client and remains attributable to its account.
- HTTP 429 is reported as QUOTA_EXHAUSTED; 401/403 as AUTH_FAILED.
- No automatic retries, account rotation, or cross-account fallback.
- The task is rejected if it contains a Google API-key-shaped string.
- Agent outputs are untrusted text. This controller does not execute code, invoke tools, write repositories, or perform privileged actions.
- Partial success is explicit; the controller never reports SUCCESS unless all four agents return non-empty outputs.

## Explicit non-goals

This candidate does not:
- read or validate GitHub Actions secrets;
- create or modify repository secrets;
- dispatch GitHub workflows;
- integrate with the current Pool Supervisor or Worker;
- provide durable queueing, checkpoint/resume, or transactional single-use approval;
- claim that the four API keys belong to four distinct Google accounts.

## Required gates before any execution

1. Verify all four GitHub Actions secrets exist without reading or exposing their values.
2. Verify account separation and independent quota ownership through owner-controlled account metadata; API-key names alone do not prove this.
3. Pin and install the official SDK in a dedicated validation workflow with no production dispatch permissions.
4. Run unit tests and a no-secret contract validation.
5. Reject duplicate credential values and test four distinct bounded role/task envelopes.
6. Obtain independent security review of workflow permissions, secret exposure, logging, and quota handling.
7. Integrate only after the Cloud Pool production caller boundary is fixed and approved.
8. Keep runtime dispatch disabled until governance and owner approval are independently verified.

## Test strategy

`node --test scripts/gemini-four-agent-controller.test.mjs` uses injected fake clients and makes no provider calls. It covers four distinct role envelopes, four-way fan-out, missing-key fail-closed behavior, duplicate-credential rejection, per-account quota isolation, key-shaped task rejection, and absence of credentials in reports.
