# Cloud Pool continuation checkpoint — 2026-11-17

**Checkpoint status:** PR #120 OPEN / DRAFT / UNMERGED; REVIEW REQUIRED  
**Contour:** A only  
**Default branch:** `Основной`  
**Immutable default base at pass start:** `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
**Working branch:** `docs/cloud-pool-reference-architecture-2026-11-17`  
**PR:** https://github.com/VlDMlNSh/developer-cloud-pool/pull/120

## Restore first

1. Read [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md), especially CURRENT AUTHORITATIVE SNAPSHOT.
2. Read [Cloud Development Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).
3. Read [ADR-0015](../decisions/2026-11-17-cloud-pool-architecture-consolidation-adr.md).
4. Re-read current default HEAD, open PRs, Issues, exact-head CI and ruleset. The working branch is not canonical until merged.
5. Do not enable dispatch, invoke Gemini, call providers, deploy hosts or touch secrets during documentation review.

## Changes recorded

- Added the canonical system-level reference architecture.
- Added ADR-0015 to explain the consolidation and rejected alternatives.
- Added dated architecture consolidation report.
- Replaced README with current verified disposition and safe task-control guidance.
- Refreshed Context Window metadata and added a current authoritative snapshot while preserving historical sections.

## Evidence at pass start

- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED; head `367c583a508061cebe41bb8d33e98c24a0dd8ba6`.
- PR #116 exact-head checks: No-secret install/resource proof SUCCESS (run 44083961406); workflow syntax/security invariants SUCCESS (run 44083961455); Pool Contract Validation SUCCESS (run 44083961455).
- FCC loopback runtime lifecycle smoke: run 44076256742, head `596c03e19b4662f69a9b40791299f55afb9a928e`; this is earlier than current PR head and is not provider-route or Claude task qualification.
- Active ruleset ID 26550182: PR and thread resolution required; zero required approvals and no required status checks.
- Issue #118: persistent workspace blocked; no active authorized server #3, no Cloudflare Access/Tunnel and no backup/restore proof.
- A0/D1 evidence is isolated local proof, not hosted production qualification.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Validation status

- GitHub baseline and source documents: VERIFIED READ.
- Branch creation from exact default SHA: VERIFIED.
- File writes: GitHub returned commit SHAs; final read-back still required.
- Runtime tests: NOT RUN (documentation-only).
- Authored/updated docs local relative-link validation: 0 missing links across 9 files.
- Preserved historical Context Window body: 31 relative links target files absent from the current default-branch tree; recorded for separate provenance/link repair.
- PR #120 exact-head check-runs: 0; combined status contexts: 0; CI NOT VERIFIED / NOT RUN.
- Independent architecture/security review: NOT RUN.
- No agent dispatch, provider call, secret read, resource provisioning or deployment.

## Blockers

- Governance does not require any approving review or status check.
- No hosted transactional state authority is qualified.
- No durable fenced lease/recovery is qualified.
- No free provider route or real task execution is qualified.
- Jarvis Web is not deployed/authenticated.
- Persistent Engineering Workspace is blocked by Issue #118.

## Next step

Read back every changed file and verify blob/commit identities, PR #120 is open as Draft. Next repair or archive the 31 legacy Context Window links, obtain independent architecture/security review, and run available exact-head validation. Resolve conflicting legacy architecture wording before merge. Keep dispatch disabled.

Canonical architecture: [Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).


## Follow-up: normative documentation CI gate

- Added `scripts/validate-architecture-docs.mjs` to check repository-relative Markdown links in README, the canonical reference architecture, ADR-0015, the dated report and this checkpoint.
- Added `.github/workflows/architecture-documentation-validation.yml`, triggered by pull requests that modify those normative files. It uses read-only contents permission and a commit-pinned checkout action with credential persistence disabled.
- Historical Context Window snapshots are deliberately excluded from this validator; their legacy links remain historical records and are not silently rewritten.
- GitHub write commits: validator `447d58ec00d6858e09dee34bcf2dab25c1381a37`; workflow `cf8c72ca6e58bdef6af7d8a370525ace3b5d1c38`; Context Window update `eaffc96dd949850713b9cad1aaed88408690cb0f`.
- Exact-head CI on `9d0fb4cd6728a160c056aa63967568a38e2bb440` completed SUCCESS: Architecture Documentation Validation run `44086971389`; Pool Contract Validation run `44086971299`. No local execution of the validator is claimed in this connector-only pass. Documentation CI is not security qualification and does not qualify Contour A.


## /next checkpoint — chat architecture decisions reconciled into PR #120 — 2026-11-17

- Canonical candidate PR #120: branch `docs/cloud-pool-reference-architecture-2026-11-17`, head before this checkpoint `6379fb7f1201752d2406c89a081baa87823825c0`, OPEN/DRAFT/UNMERGED.
- Added normative Section 21 to Reference Architecture 1.0 to preserve the detailed chat-session Workspace, Jarvis three-plane, shared filesystem, VS Code Remote SSH, code-server/Open VSX, Cloudflare transport distinctions, single-writer fencing, backup/restore, first Claude/FCC/ECC profile, Gemini optionality and GitHub-only first-launch boundary.
- Refreshed Context Window and ADR with current PR #116 exact-head evidence and latest owner scope corrections.
- PR #116 latest head `6d4a4c518d44aa4a79d8396390623f424499011a`: runner proof run 44086419084 SUCCESS; workflow/security validation run 44086419002 SUCCESS; job 134049913469 all 14 steps SUCCESS. Mock only; no real Claude/provider task.
- Issue #117 CLOSED. Issue #118 remains BLOCKED. Issue #115 remains OPEN pending independent review/source provenance and real route scope as applicable.
- PR #113 is an older parallel docs candidate and remains OPEN/DRAFT; its content is not merged and is not assumed automatically included in PR #120.
- No secrets/provider calls/Gemini dispatch/host deployment/merge. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: read back all amended files, independently review PR #116 at exact head, validate PR #120 links/contracts and obtain architecture/security review. Keep dispatch disabled.


## /next checkpoint — FCC identity/fallback review — 2026-11-17

- PR #116 exact head `6d4a4c518d44aa4a79d8396390623f424499011a`; exact-head runner run 44086419084 SUCCESS (14/14 steps); workflow/security run 44086419002 SUCCESS; artifact 14329776221 available.
- Independent review comments 5938684495 (license provenance) and 5938737463 (FCC key cycling/model fallback) are COMMENT, not APPROVE.
- New normative requirement: one credential/account per FCC profile; disable `MODEL_FALLBACKS`, numbered-key selection, key cycling and provider/paid fallback; separate profile and quota ledger for each distinct account. No real account/quota proof yet.
- FCC pinned license AGPL-3.0-only; ECC MIT. Remote/network legal obligations require review before external deployment.
- Issue #115 remains OPEN. No secrets/provider calls/real Claude session/Gemini dispatch/production deployment. Contour A NOT ACCEPTED.
- PR #120 head at this checkpoint before these updates: `f016247a9886df904042000a26f17beabfbb8727`; OPEN/DRAFT/UNMERGED.


## Traceability and Workspace acceptance reconciliation — 2026-11-17

- Published traceability matrix at docs/reports/2026-11-17-chat-to-architecture-traceability.md.
- Corrected canonical architecture and ADR-0015: persistent Workspace is a later staged milestone (not needed for first static GitHub PWA) but is mandatory before Contour A ACCEPTED.
- Same browser/desktop filesystem, VS Code Remote SSH, code-server/Open VSX, per-task worktrees, single-writer fencing, qualified ingress and backup/restore remain Workspace acceptance conditions.
- PR #120 remains OPEN/DRAFT/UNMERGED. No independent review, merge, deployment, provider call, secret read or Gemini dispatch.
- Contour A NOT ACCEPTED; Contour B DEFERRED.


## Final checkpoint — 2026-11-17 architecture consolidation

- PR #120 head `30dbde9d136286af9bbc03dc58ec42e6a4939e5a`, OPEN/DRAFT/UNMERGED, mergeable, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Architecture Documentation Validation run 44088152664 SUCCESS; job 134055994068 validated canonical Markdown links. Pool Contract Validation run 44088150366 SUCCESS.
- PR #120 has 44 files. All 30 changed paths from PR #113 were migrated; prior Context Window preserved as an archive. PR #113 closed UNMERGED as superseded; comment 6948722671.
- Current PR #116 head 6d4a4c518d44aa4a79d8396390623f424499011a: runner run 44086419084 SUCCESS, contract/security run 44086419002 SUCCESS; review comments 5938684495 and 5938737463 are COMMENT, not APPROVE.
- Key FCC production rule: one credential/account per profile, disable numbered key selection, key cycling, MODEL_FALLBACKS and provider/paid fallback. Free route/account/quota remains NOT VERIFIED.
- Workspace is a later stage, not first GitHub-only launch dependency, but remains required for final Contour A acceptance unless owner re-scopes it. Issue #118 BLOCKED.
- No secrets/provider calls/real Claude session/Gemini dispatch/deployment/merge. Contour A NOT ACCEPTED; Contour B DEFERRED.


## /next continuation — D1 admission exact-head refresh — 2026-11-17

- PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`; OPEN/DRAFT/UNMERGED.
- D1 Atomic Admission Integration Proof run 43935827714 / job 133540023253 SUCCESS; local Workers-runtime D1 tests 12/12 PASS.
- Pool Contract Validation run 43935827741 / job 133540025359 SUCCESS; workflow syntax/security invariants PASS.
- Updated PR #114 description with a current-head addendum; Issue #96 comment 6948767460 records exact evidence and residuals.
- Admission is not production-authorized: event object and trustedDefaultHeadSha are injected test inputs, no webhook signature/live ref provenance. Hosted D1, Supervisor lease/fencing, outbox delivery, worker identity and real route remain unqualified.
- Next: implement trusted GitHub issue_comment provenance in the trusted default-branch controller, then durable lease/recovery. Keep dispatch disabled.


## Final verification snapshot — 2026-11-17

- PR #120 head before this checkpoint write: `d717c999906341efbdcb65a25dfd73269220e691`; 45 files; OPEN/DRAFT/UNMERGED.
- Exact-head Architecture Documentation Validation 44088776800 SUCCESS.
- Exact-head Pool Contract Validation 44088776888 was RUNNING at checkpoint time; do not mark verified until completed.
- PR #113 CLOSED UNMERGED as superseded; all 30 paths preserved in PR #120, prior Context Window archived.
- PR #116 latest exact head 6d4a4c518d44aa4a79d8396390623f424499011a: runs 44086419084 and 44086419002 SUCCESS; current-head review comments 5938684495 and 5938737463 are COMMENT, not approval.
- PR #114 local D1 proof head ab9461eb84b14fe230918391d5212f19ca25592c: runs 43935827714 and 43935827741 SUCCESS; 12/12 local D1 tests. Webhook provenance not authenticated.
- No secrets/provider calls/Gemini dispatch/host deployment/merge. Contour A NOT ACCEPTED; Contour B DEFERRED.

## /next checkpoint — Jarvis operating-system model added — 2026-11-17

- Added normative [Jarvis Operating Model 1.0](../architecture/CLOUD-POOL-JARVIS-OPERATING-MODEL-1.0.md) and linked it from Reference Architecture 1.0.
- Formalized three planes, Task Orchestrator, Agent Registry, Resource Manager, Quality Gate, dynamic logical roles, executor adapter contract, four memory layers, Agent Observability, six UI areas and autonomy/approval matrix.
- Existing A0, single transactional state authority, fenced lease, Gemini controller-only dispatch, account/quota isolation, secret boundary and independent acceptance remain unchanged.
- Documentation-only; no runtime, provider call, secret read, Gemini dispatch, deployment, merge or Contour A acceptance. Contour A NOT ACCEPTED; Contour B DEFERRED.

## /next checkpoint — runner PATH and HOME/XDG isolation — 2026-11-17

- PR #116 candidate head: `caa4a9b80f598d08087a6fd5bedfb7d90c08e5bc`.
- Source/test/workflow changed: resolved PATH ownership and write-mode validation; private HOME/XDG confinement; dedicated isolated FCC runtime and bridge homes; eight adversarial environment tests.
- Local unit tests: 8/8 PASS.
- Exact-head Pool Contract Validation `44091902882`: SUCCESS.
- Exact-head runner qualification `44091902840`: FAILED at FCC loopback startup step 8. Exact failure diagnostic NOT VERIFIED through current GitHub read interface. Do not claim successful FCC runtime after this change.
- No secrets/provider calls/Gemini dispatch/merge/deployment. Default-branch Gemini controller file absent. `POOL_DISPATCH_ENABLED=false` remains mandatory.
- Next: retrieve failing step annotations/logs, correct only evidence-backed cause, rerun exact-head CI.
- Full report: [2026-11-17-next-runner-path-home-isolation.md](../reports/2026-11-17-next-runner-path-home-isolation.md).
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## /next checkpoint — runner PATH correction and FCC synthetic profile proof — 2026-11-17

- PR #116 exact head `e58211dfe82a885d7718ebbc89d66188087cdcc4`.
- Failure diagnosis from run `44092881008`: `/usr/local/bin` is root-owned mode `0777`; removed from FCC and synthetic bridge PATHs. Security checks retained.
- Provenance manifest corrected to namespace FCC runtime fields, separately identify synthetic mock invocation and reject duplicate keys.
- Exact-head runner qualification `44093612344`: SUCCESS, all 14 steps; Pool Contract Validation `44093612348`: SUCCESS.
- Artifact `14331114755`, SHA-256 `74d11af0039a856d4aebd72c01d0f403e05e1adaa8879b126706e41575c2f479`, 26,657 bytes. Downloaded digest matched GitHub; 22 internal checksums matched; manifest duplicate-key count 0.
- FCC loopback HTTP 200, listener bound only to 127.0.0.1:18765, clean SIGINT exit and listener removed. Synthetic mock bridge HTTP 200, argument preservation, clean bridge shutdown. This is not a real Claude session or provider call.
- No secret values read, no provider calls, no agent task, no Gemini dispatch, no deployment/merge. Real free route/account/quota, installer-byte integrity, egress isolation, AGPL network-use review and independent A3 review remain unresolved.
- PR #116 remains OPEN/DRAFT/UNMERGED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED; `POOL_DISPATCH_ENABLED=false`.
- Full report: [2026-11-17-next-runner-path-home-isolation.md](../reports/2026-11-17-next-runner-path-home-isolation.md).

## /next checkpoint — immutable PR-head checkout proof — 2026-11-17

- PR #116 candidate: `d93e75df74e7213f96dc3e2cb335a73dc6710e19`.
- Found and corrected provenance mismatch: previous green run used PR merge ref checkout; workflow now explicitly checks out pull_request.head.sha with persist-credentials false.
- Exact-head runner run 44094382662: SUCCESS, all 14 steps; exact-head Pool Contract Validation 44094382669: SUCCESS.
- Artifact 14333840752 digest `96fb613956842b30015e659c662c799af363eb3bfbf8fa54179b5d51df3acafa`; downloaded digest verified; all 22 internal checksums pass; target_sha == checkout_sha == candidate head; no duplicate manifest keys.
- Synthetic mock only, no real Claude session, no agent task, no provider calls, no secret reads, no production dispatch. FCC remains loopback-only.
- PR #116 remains OPEN/DRAFT/UNMERGED. Independent A3 review, installer integrity, FCC AGPL network-use review, one-account/no-fallback, free route/quota and egress gates remain open. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Keep `POOL_DISPATCH_ENABLED=false`; Gemini dispatch NOT RUN because controller is absent from default branch.
- Full report: [2026-11-17-next-exact-head-checkout-provenance.md](../reports/2026-11-17-next-exact-head-checkout-provenance.md).



## /next checkpoint — GitHub Actions-bound D1 admission context audit — 2026-11-18

- Default branch `Основной` observed HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged).
- PR #125 OPEN / DRAFT / UNMERGED; exact head `2ca95775982c711a289881e94eb664d5fe14ed5a`; parent PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`.
- Exact-head D1 GitHub Actions Context Admission Proof run `44255849885` / job `134637228939`: SUCCESS; 2 test files, 22/22 tests. Adapter Validation run `44255841721` / job `134637205479`: SUCCESS; 2 test files, 22/22 tests. Both use immutable PR-head checkout, persist-credentials false, read-only contents permission and npm ci --ignore-scripts.
- Candidate binds exact owner /next Issue #96 event to repository/owner identity, default ref and workflow ref; derives target SHA, workflow SHA, run ID and run attempt from runner variables; persists run attempt. Dispatch and execution authorization remain false.
- Production `.github/workflows/cloud-pool-next-controller.yml` is absent on default branch (404), so a live `issue_comment` trigger cannot yet run. Environment object is injectable in the proof API; the production entrypoint must read directly from runner process environment and runner event file. Add explicit `RUNNER_ENVIRONMENT=github-hosted` enforcement alongside fixed hosted runner configuration.
- No live webhook signature/API re-read, hosted D1, approval issuer, lease/fencing/recovery, outbox delivery, worker dispatch or provider route has been qualified.
- Default-branch Gemini controller also absent (404); requested Gemini wave NOT RUN, no bypass used.
- Active ruleset #26550182: PR required and thread resolution required; 0 approving reviews and 0 required status checks. Independent A3 review remains mandatory by project policy.
- PR #124 current head `65af2a72fa4301bc5cf4f111e9b7a620bcac310c`; architecture link validation run `44256001611` SUCCESS. PR #120 head at pass start `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; architecture docs run `44094756333` and Pool Contract Validation `44094756250` SUCCESS.
- No secret values read; no provider calls, Gemini runs, deployment, merge or production dispatch. Keep `POOL_DISPATCH_ENABLED=false`.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Report: [2026-11-18 GitHub Actions-bound D1 admission context audit](../reports/2026-11-18-next-github-actions-admission-context-audit.md).
- Next: implement a trusted default-branch controller entrypoint with direct event/environment provenance and hosted-runner enforcement, no child dispatch, then independent A3 review.

Canonical architecture: [Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next checkpoint — Claude provenance and hosted-use compliance gate — 2026-11-18

- Reviewed PR #116 exact head `a956129f6cf426c887e755c563740fe1813161d9`. Exact-head checks 44257088134 and 44257088139 SUCCESS.
- Current workflow downloads `https://claude.ai/install.sh`, executes it, requests version 2.1.325 and checks CLI version string only. Installer script bytes are not authenticated; installed binary is not compared to Anthropic's signed release manifest. Installer provenance NOT VERIFIED.
- Official Anthropic setup docs document signed `manifest.json`, detached `.sig`, release signing key fingerprint `31DDDE24DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE`, and binary SHA-256 comparison; signatures are available from 2.1.89. No implementation in current workflow. Source https://code.claude.com/docs/en/setup#binary-integrity-and-code-signing.
- Official Anthropic legal/compliance docs require Commercial Terms agreement for hosted sandbox/agent infrastructure running Claude Code, require each end user to authenticate with their own credentials, prohibit paying/reselling/intermediating usage on end users' behalf, and prohibit collecting/storing/intermediating Claude.ai login credentials/session tokens. Source https://code.claude.com/docs/en/legal-and-compliance#can-customers-offer-claude-code-in-their-products.
- Official setup docs state Free claude.ai plan does not include Claude Code access. This blocks the previously assumed free hosted Claude route absent a compliant alternative contract/provider route. Source https://code.claude.com/docs/en/setup#authenticate.
- Existing PR #116 proof remains synthetic/no-secret only; no real Claude session or provider call. Keep FCC loopback-only and dispatch disabled.
- No secret values read; no login, provider call, Gemini dispatch, merge or deployment. `POOL_DISPATCH_ENABLED=false`.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: implement signed-manifest verification (or signed apt repository) for pinned CLI bytes, then establish vendor-compliant end-user identity/contract model or exclude Claude Code from free executor qualification.

Canonical architecture: [Cloud Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md).
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Final verification — Claude provenance and hosted-use gate — 2026-11-18

- Report and roadmap/freeze amendment published at documentation candidate commit `7df5482ad7324974ffdcb384cdc09b7b9e3f2ef3`.
- Exact-head canonical architecture link validation run [44260268117](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260268117): SUCCESS.
- Exact-head workflow syntax/security validation run [44260267429](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260267429): SUCCESS.
- PR #120 remains OPEN/DRAFT/UNMERGED; documentation candidate is not default-branch canonical yet.
- PR #116 finding comment: https://github.com/VlDMlNSh/developer-cloud-pool/pull/116#issuecomment-6972228539.
- Legal and installer provenance gates remain open. CI verifies documentation/workflow invariants only; it does not establish vendor permission, free entitlement, binary integrity or real agent execution.
