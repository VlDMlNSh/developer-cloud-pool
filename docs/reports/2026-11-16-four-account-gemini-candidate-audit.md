# Four-account Gemini candidate audit — 2026-11-16

## Outcome

**Candidate implementation and no-provider-call CI: VERIFIED. Four-agent runtime: NOT RUN. Production integration: BLOCKED / NOT QUALIFIED.**

The user requested that all four Google API credentials be used for Gemini agents on each `/next`, then that additional agent runtimes be introduced one at a time. The repository contains an isolated four-account candidate branch, so this pass reviewed and promoted that candidate to a draft PR rather than dispatching the existing three-agent MediaHub bridge (which does not use the fourth credential and is not Cloud Pool-native).

## Immutable refs

- Cloud Pool default branch: `Основной` @ `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Candidate branch: `feat/four-account-gemini-controller-2026-11-16`.
- PR #107 head: `ae0232c7989822269acd90e25e421579f0be79ed`; base: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Comparison: 5 commits ahead, 0 behind; 5 changed files.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/107 — OPEN / DRAFT / UNMERGED; formal reviews: 0.

## Candidate contents

- `scripts/gemini-four-agent-controller.mjs` — maps `GEMINI_API_KEY_1` through `GEMINI_API_KEY_4` to four separate Google GenAI clients; all four credentials are required; no retry, cross-account fallback, automatic rotation, tool execution, shell execution or repository writes.
- `scripts/gemini-four-agent-controller.test.mjs` — five tests using injected fake clients.
- `docs/architecture/2026-11-16-four-account-gemini-controller-candidate.md`.
- `docs/checkpoints/2026-11-16-four-agent-controller-candidate.md`.
- `.github/workflows/pool-contract-validation.yml` runs the no-provider-call unit suite.

Source blobs:
- Controller: `ee0edc37ae59eaaea4a8489de35574c5b49dd69a`.
- Tests: `6ea1d5bccfff6bd5024e859c6b86622866c28a45`.
- Architecture: `300266c321fad4d0a26586ba29ea0d44bf00dec0`.
- Contract workflow: `69da86b2813040dc43d8017fa7dd09d674f200d4`.

## Verification evidence

- Local isolated run on Node v22.16.0: `node --test scripts/gemini-four-agent-controller.test.mjs` — **5 passed, 0 failed**. The source was read back from the candidate branch and executed with fake clients; no network/provider call.
- Exact-head GitHub Actions: run [#43863071739](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43863071739), job #133284564704 — COMPLETED / SUCCESS.
- Job log confirms `POOL_DISPATCH_ENABLED: false`, workflow YAML syntax checks passed, `POOL_CONTRACT_VALIDATION=PASS`, and all five Gemini candidate tests passed.
- Combined commit-status endpoint returned an empty status array; the named Actions run is the positive CI evidence.
- PR #107 reviews: 0; independent security review NOT RUN.
- No provider calls, secret reads, production dispatch, merge or deployment.

## Security and integration findings

1. The source refers to four environment names, but repository secret existence is NOT VERIFIED. Secret values were not read.
2. Distinct Google account ownership and separate upstream quota domains are NOT VERIFIED. Four variable names do not prove four accounts.
3. The candidate currently sends the **same task text** to all four clients. It is four-account fan-out, not yet four differentiated specialist-agent roles.
4. Duplicate credential values are not rejected. A repeated key could therefore be counted as four clients; add an in-memory duplicate check and negative test without logging or hashing credential values.
5. The default SDK import is `@google/genai`, but the dependency is not pinned/installed in the repository or validation job. Tests inject fake clients and therefore do not verify the real SDK runtime. Pin and install the SDK in a dedicated no-production-permission workflow before any provider call.
6. No Cloud Pool workflow invokes this controller. It is not integrated with Pool Supervisor/Worker, has no durable task queue, and has no trusted owner-event/approval/idempotency boundary. Existing Worker still exposes `workflow_dispatch`; Supervisor still contains REST dispatch. Production caller provenance remains BLOCKED.
7. MediaHub main's current controller dispatches exactly three fixed child workflows and does not reference `GEMINI_API_KEY_4`; a search for that name on MediaHub main returned no results. That bridge is separate and must not be presented as the Cloud Pool four-agent controller.
8. Cloud Pool Issues #94/#96 remain OPEN. #94 explicitly requires a Cloud Pool-native controller and says the MediaHub Issue #301 bridge is not a substitute. Its current acceptance contract describes three bounded supplementary jobs, not a permanent agent roster.

## Decision

- Do not dispatch the three-agent MediaHub bridge as a substitute for the requested four-account execution.
- Do not invoke the candidate with real keys until secret metadata, account separation, SDK pinning, differentiated task envelopes, duplicate-key rejection, least-privilege workflow integration and independent review are complete.
- Keep `POOL_DISPATCH_ENABLED=false`; no Worker, Supervisor, DSH or Gemini production execution.
- Keep Contour A BLOCKED / NOT ACCEPTED and Contour B DEFERRED.

## Next bounded pass

Harden PR #107: reject duplicate credential values without exposing them; define four distinct bounded role/task envelopes with per-agent output provenance; add a pinned SDK install/runtime smoke using fake transport only; and ensure the workflow cannot receive production dispatch permissions. Then rerun exact-head CI and request independent security review. In parallel, keep Cloud Pool's native owner-only /next controller under Issues #94/#96 as the required production caller boundary.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
