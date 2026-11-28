# Pass 125 — exact API collector → Workers verifier → D1 receipt composition

Date: 2026-11-28

## Status

**VERIFIED — local synthetic composition and exact code-head CI.**  
**NOT VERIFIED — live issue-comment controller execution, hosted D1, full production import graph, independent security review, and governance qualification.**  
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Parent / starting branch head: `de2a909282c964e08ae0f1efc43bf4554163863e` (Pass 124).
- Implementation and test head: `3ead23090b2b652ad0108fc12c0e5628f9568e97`.
- Default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #188 remains OPEN / DRAFT / UNMERGED.
- Scope: exercise the exact collector-produced serialized JSON and digest, map trusted Actions context, pass both into the Workers-native attested D1 adapter, verify durable receipt fields and exact replay, and add a static direct-import isolation guard for the inert D1 Worker.
- Prohibitions retained: no hosted D1, secrets, provider calls, dispatch, executor launch, deployment, merge, production mutation, or Contour B work.

## Implementation

1. Extended `proofs/d1-ledger/test/github-next-event.integration.test.ts`.
   - Imports the existing bounded `collectOwnerNextEnvelope` and its trusted-context mapper.
   - Supplies deterministic, synthetic GitHub API responses for repository, issue, comment, workflow run, workflow metadata, default ref and workflow-file blob.
   - Verifies the collector's exact `sourceJson` and digest, then passes those exact values and mapped trusted context to `admitGitHubNextAttestedEvent`.
   - Reads back attestation schema/version, issue/comment node IDs, observed default/run SHA, workflow ID/state, workflow commit/blob/ref SHAs and `dispatch_enabled=0`.
   - Replays the same source event and requires `ADMISSION_ALREADY_COMMITTED` plus `SOURCE_COMMENT_ALREADY_RECORDED`.
   - All fixture identities are unique; no production code or authorization semantics were relaxed.
2. Extended `scripts/validate-pool-contract.mjs`.
   - Requires the inert `proofs/d1-ledger/src/worker.mjs` entrypoint not to directly import either the legacy synthetic GitHub event adapter or the attested event adapter.
   - This is a narrow direct-import guard, not a proof of the entire transitive repository production import graph.

## Validation evidence

- Isolated D1 Ledger Proof run **46172563736**, job **141064025304**: SUCCESS; **9/9 files, 140/140 tests**.
- Pool Contract Validation run **46172563762**, job **141064025522**: SUCCESS.
- The new collector → verifier → D1 persistence/replay test passed in the same D1 run.
- Pool Contract includes the direct Worker import isolation assertion and the existing controller CLI tests.
- Earlier red runs were retained as diagnostic evidence:
  - Run 46172250864 exposed duplicate approval fixture identity.
  - Run 46172508016 exposed duplicate admission fixture identity (`ADMISSION_IDENTITY_CONFLICT`).
  - Both were corrected by isolating synthetic fixture identifiers; constraints were not weakened.
- The tested code head is immutable at `3ead23090b2b652ad0108fc12c0e5628f9568e97`. Subsequent report/checkpoint/context commits are documentation-only and do not change tested code.
- The CI fixture calls the real collector function but uses synthetic API responses. It does not prove the live workflow event, real Actions token/API collection, or a deployed controller run.

## Security and governance

- `dispatch=false` and `executionAuthorized=false` remain enforced by collector, verifier, D1 adapter and tests.
- No new dependency, provider route, secret, token, credential, hosted database, external service or paid resource was added.
- No secret values were read. No provider request, controller dispatch, executor, deployment, merge or production write occurred.
- PR #188 has zero formal reviews and zero inline review threads at this pass; independent security review remains NOT RUN.
- Detailed effective ruleset conditions and current dispatch-variable metadata were not re-read in this pass: NOT VERIFIED.
- Full transitive import graph, live UI, mobile/desktop QA, live controller execution, hosted persistence and runtime recovery remain NOT VERIFIED.

## Reuse First and daily OSS delta

- Reuse the existing collector, canonical Envelope v1, Workers verifier, D1 attested adapter, migration 0018 and pinned Workers/Vitest/D1 harness. No duplicate ledger or new dependency.
- Cloudflare's official Workers Vitest guidance confirms the integration is intended for local Workers-runtime unit and integration tests with bindings; this supports the existing local proof choice, not hosted D1 qualification: https://developers.cloudflare.com/workers/testing/vitest-integration/
- No material change to the previously recorded Bifrost / agentgateway / LiteLLM dispositions was found in this delta scan:
  - Bifrost remains DEFER pending affected/fixed-version mapping, SBOM, threat model and independent review: https://github.com/maximhq/bifrost/security/advisories
  - agentgateway remains ADAPT metadata/policy concepts only; DEFER runtime. v1.7.0 remains the reviewed release and tool-output guard defaults retain privacy implications: https://github.com/agentgateway/agentgateway/releases
  - LiteLLM remains undeployed for current Contour A pending independent assessment; official advisory history includes Nov 12 high-severity credential-exfiltration and Oct 27 critical enterprise proxy disclosure: https://github.com/BerriAI/litellm/security/advisories and https://www.litellm.ai/security
- No OSS package was installed, benchmarked or adopted in this pass.

## Metrics

- Code/test files changed: 2.
- New integration assertions: one end-to-end collector/verifier/D1 durable replay scenario plus direct-import isolation.
- D1 suite: 140/140 passing.
- Pool Contract: SUCCESS.
- Active engineering time: NOT MEASURED; wall-clock work duration is not presented as active engineering time.
- Performance benchmark: NOT RUN.
- Defects found and corrected in tests: 2 fixture identity collisions; no production adapter defect established.
- Critical path remaining: independent security review → effective governance read-back → live controller/no-secret qualification → UI/routing/state/quota/executor qualification → formal Contour A acceptance.

## Next

Pass 126: review the complete controller → collector → verifier → D1 trust chain independently; add adversarial cases for collector/API identity substitutions, stale default ref, workflow-file blob mismatch, run/attempt mismatch, replay and partial receipt readback. Then re-read exact PR head/CI/governance and keep all execution paths disabled. Do not merge PR #188 until required reviews and governance gates pass.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
