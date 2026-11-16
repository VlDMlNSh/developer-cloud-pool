# Wave 331 — four-agent candidate local runtime reproduction

Date: 2026-11-16
Status: UNIT TESTS REPRODUCED / SDK IMPORT FAILED AS EXPECTED / NO PROVIDER DISPATCH

## Target and repository state

- Cloud Pool default branch: `Основной`; last verified SHA in current candidate PR base: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Candidate PR #107 remains OPEN / DRAFT / UNMERGED.
- Candidate branch: `feat/four-account-gemini-controller-2026-11-16`.
- Candidate HEAD: `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf`.
- Controller source blob: `ffe874a2f1286476cbbc109816afd736de3cfb57`.
- Test source blob: `436fb1fd0b2f988b843d843f39cc4c5851029154`.
- Exact-head GitHub Actions run #43864376148 / job #133289028904 remains COMPLETED / SUCCESS (six tests passed; dispatch flag false).

## Local reproduction

Fetched the exact controller and test contents from the candidate branch and reproduced them in an isolated temporary directory using Node.js v22.16.0.

Command:
```sh
node --test /tmp/wave331/gemini-four-agent-controller.test.mjs
```

Result: 6 tests passed, 0 failed. These are synthetic injected-client tests; no provider calls.

Then ran the controller entry point with four synthetic, non-secret test values:
```sh
GEMINI_API_KEY_1=test-one GEMINI_API_KEY_2=test-two GEMINI_API_KEY_3=test-three GEMINI_API_KEY_4=test-four node /tmp/wave331/gemini-four-agent-controller.mjs 'synthetic runtime probe'
```

Observed result: overall `FAILED`; all four role results `FAILED`; process exit code 1. This confirms the default client cannot load its dynamic `@google/genai` import in the current environment. No external request was made. The error detail is intentionally suppressed by the controller's top-level handler, so the exact loader exception was not emitted; source and absence of package manifests support the missing-dependency diagnosis.

## Finding

The existing six tests validate orchestration only when a test client is injected. They do not qualify the production default client. The local default-client probe reproduces the missing runtime dependency failure. Therefore SDK runtime is now **FAILED / NOT QUALIFIED** in this candidate environment, rather than merely untested.

No `package.json` or `package-lock.json` exists on the candidate branch. Do not hand-author a partial lockfile. The next code pass must produce a complete lockfile from a controlled npm environment, pin an exact `@google/genai` version, install with `npm ci`, and add an actual-SDK fake-fetch test proving request/response handling without network egress. Confirm retry settings against the pinned SDK. Only then rerun exact-head CI.

## Governance and dispatch

- Issues #94 and #96 remain OPEN. Cloud Pool-native owner-only admission/controller is not implemented.
- Four Actions secret names and scopes NOT VERIFIED; distinct Google account ownership and upstream quota domains NOT VERIFIED.
- No secret values read. Four synthetic strings used only in local test.
- No real Gemini provider calls, no four-agent dispatch, no MediaHub bridge dispatch, no merge, no deployment.
- PR #107 remains OPEN / DRAFT with zero formal reviews (latest review state from prior check; recheck before any merge).
- Effective ruleset/governance NOT VERIFIED.

## Decision

Candidate remains isolated and fail-closed. Do not merge or enable production dispatch.

- Four-role orchestration unit tests: VERIFIED locally (6/6).
- Default SDK client runtime: FAILED in current environment / NOT QUALIFIED.
- Four real Google accounts: NOT VERIFIED.
- Cloud Pool-native dispatch: BLOCKED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Generate a complete npm lockfile in a controlled Node.js 22/npm environment, pin the exact official SDK version, add an actual SDK fake-fetch transport test with a strict no-network assertion, and verify one-attempt/no-fallback behavior. Run exact-head CI and obtain independent review before any integration or dispatch.

## References

- PR #107: https://github.com/VlDMlNSh/developer-cloud-pool/pull/107
- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
