# Pass 116 — Controller / API Envelope / attested D1 source reconciliation

Date: 2026-11-28

## Frozen target and scope
- Canonical default branch: `Основной`
- Default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Controller PR #176 head: `f06155b8ac121a4af90cbc2356f12b965d0fbde9`
- Envelope PR #177 head: `da8de0e258571fa98aad8da053f8e4134a94ceb9`
- D1 foundation PR #178 head: `680bb7a1af7984b74b93e17284ef4f11ad30dba0`
- Workers verifier PR #179 implementation head: `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e`
- Attested D1 PR #181 code/test SHA: `88911e5a127b9345270b15da8e7cd3f8aa54293a`
- Pass 111/113 branch documentation HEAD: `4c8d820102472e130c2e9760f5d42f650ca43394`
- Pass 115 documentation branch: `docs/pass115-spec-kit-adoption-2026-11-28`
- Scope: source-level ancestry, workflow, envelope, adapter, migration and test-boundary reconciliation. No runtime code changes.

## Reuse First
- Reuse the read-only workflow/verifier from PR #176 as source material, not as a branch merge.
- Reuse the v1 Envelope contract/Node validator from PR #177 and Workers-native verifier from PR #179.
- Reuse the single D1 ledger, migrations 0017/0018 and `admitGitHubNextAttestedEvent` from PR #181.
- Reuse existing Workers/Vitest local D1 harness.
- Do not add a second controller, ledger, migration chain, worker ingress, provider SDK, runtime dependency or hosted service.

## Ancestry evidence
GitHub compare against default SHA:
- PR #176 controller head: 38 commits ahead, 0 behind.
- Pass 111 branch HEAD: 111 commits ahead, 0 behind.
- Compare PR #176 head → Pass 111 branch HEAD: DIVERGED; Pass 111 side 111 ahead, controller side 38 behind; common merge base is default SHA `565404f...`.
- PR #177 head is an ancestor of Pass 111 branch (79 commits ahead from #177 to Pass 111).
- PR #178 head is an ancestor of Pass 111 branch (31 commits ahead from #178 to Pass 111).
- PR #179/#181 form the D1/API stack over #177/#178; PR #181's code SHA is the implementation evidence point.
Decision: do not merge or cherry-pick the full PR #176 branch. It would import a divergent 38-commit line. Port only the smallest reviewed controller workflow/verifier/test surface onto a fresh branch based on the Pass 111 line after the file-level map is reviewed.

## Source-level findings
| Surface | Source ref | Blob SHA | Observation |
|---|---|---|---|
| Controller workflow | PR #176 | `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a` | issue_comment; contents/issues/actions read-only; invokes audit script; no D1 binding/call |
| Controller verifier | PR #176 | `4e969000ab32df6ff37663c329fe406b859809f4` | API reads Repository/Issue/Comment/Run/Workflow/default ref/workflow file; returns OBSERVED_ONLY; no Envelope JSON/digest |
| Node Envelope v1 validator | PR #177 / Pass 110 | `872a92c55dd7384ed83f297b2f1647c7eebc6fcb` | strict v1 schema, duplicate-key rejection, canonical digest |
| Workers Envelope verifier | PR #179 / Pass 111 | `9822f6feaed866a55fa830ba835fa493625f8677` | WebCrypto digest and Actions-context cross-check |
| D1 attested adapter | PR #181 | `af12b9113de5f67d0242ef19f57c2d6b999270a3` | exports both legacy and attested entrypoints |
| Migration 0017 | PR #181 | `2d226a23e94cdf7a767eed989b8ef0b8781c69fb` | append-only source comment receipt |
| Migration 0018 | PR #181 | `366a890797cd8187848072894a1d7dbe8f5e6791` | adds attestation schema/version, immutable node IDs and workflow provenance |
| D1 Worker entrypoint | PR #181 | `5429e1abb2049a63562fa411b0d3b041f2f8276b` | deliberately inert; no HTTP ingress/provider/dispatch |
| D1 integration tests | PR #181 | `590c86c52ede5323dc9a08c7b7562a20d507e743` | imports both legacy and attested APIs; fixtures build Envelope locally |

### Confirmed blockers
1. `.github/workflows/next-event-controller.yml` is NOT FOUND on Pass 111 branch. Controller and D1 branches are not composed.
2. PR #176 audit script ends at OBSERVED_ONLY, admission NOT_CREATED, outbox NOT_CREATED, dispatch NOT_AUTHORIZED. It writes only a step summary; it does not construct the serialized Envelope v1 or call the attested D1 adapter.
3. The existing D1 tests manually construct the Envelope fixture. They prove validator/adapter behavior against synthetic data, not that live controller API readbacks generate the same exact Envelope.
4. The D1 adapter exports legacy `admitGitHubNextEvent` and attested `admitGitHubNextAttestedEvent`. Existing integration tests import both. Production import/call graph has not been proven; no production caller is wired on Pass 111 branch.
5. The D1 proof Worker is intentionally inert (404). It is not an ingress endpoint and must remain so for this local qualification.
6. Controller verifier currently uses `GITHUB_API_URL` if present and its fetch helper has no explicit timeout/response-size bound. Before reuse, pin API origin to the GitHub-hosted environment contract, add bounded timeouts/body size and sanitize errors. Do not expose token or authorization headers.
7. Workflow-file provenance is currently represented by the Contents API blob SHA and ref SHA in the envelope fixture. The next implementation must source the workflow commit SHA from trusted Actions context, independently fetch/verify workflow bytes or Git blob metadata, and keep target/event SHA distinct from workflow-code SHA.
8. No hosted D1 or production write is authorized. The end-to-end proof in this task must run against the existing synthetic local Workers/D1 harness only.

## CI and governance readback
- PR #181 code/test SHA `88911e5a127b9345270b15da8e7cd3f8aa54293a` has D1 run #45897059595 SUCCESS and Pool Contract run #45897059549 SUCCESS.
- The D1 run reports 9/9 files and 137/137 tests; these validate the isolated D1 proof, not live controller composition.
- Combined classic commit statuses returned an empty list; Actions runs above are the positive CI evidence.
- PR #181 formal reviews: 0; review threads: 0. Independent security review NOT RUN.
- PR #176–#181 remain open/draft/unmerged at the inspected snapshot; validation-only PRs #180/#182 must not be merged.
- Ruleset #26550182 was documented in Pass 111 as active with PR/thread-resolution requirements but 0 required approvals; independent review remains a separate outstanding gate.
- No secrets read, hosted D1 write, provider call, dispatch, executor launch, deployment, merge or production mutation.

## Decision
- Ancestry and source-level boundary map: VERIFIED.
- Controller → Envelope v1 producer → Workers verifier → local attested D1 E2E: BLOCKED / NOT IMPLEMENTED.
- PR #176 full-branch merge: REJECTED; minimal source port only.
- Legacy adapter production isolation: NOT VERIFIED.
- Exact-head CI for any new integration candidate: NOT RUN.
- Gemini, Claude, ECC/FCC: NOT RUN.
- Active engineering time: NOT MEASURED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded implementation pass
Create one fresh integration branch from Pass 111 branch HEAD `4c8d820102472e130c2e9760f5d42f650ca43394`; port only the controller workflow/verifier/tests from PR #176; refactor the verifier into a pure, testable API-evidence collector that emits exact Envelope v1 JSON + digest; add strict fixed-origin bounded API transport; source workflow commit SHA from trusted Actions context and independently bind workflow bytes; feed that same output into the existing Workers verifier and local D1 attested adapter test harness; prove legacy entrypoint cannot be imported by production composition; add replay/substitution/timeout/stale-ref/rerun tests; run exact-head D1 and Pool Contract CI. No hosted D1, dispatch, providers or deployment.

Canonical MediaHub map (separate Contour B, deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
