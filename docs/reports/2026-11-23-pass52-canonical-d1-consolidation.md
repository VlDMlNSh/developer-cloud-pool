# Pass 52 — canonical D1 consolidation and execution-priority correction

Date: 2026-11-23  
Status: **INTEGRATION MAP VERIFIED / CANONICAL CANDIDATE IDENTIFIED / NEW ADMISSION BLOCKERS FOUND / NO MERGE OR DISPATCH**

## 1. Immutable repository snapshot

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- PR #168: OPEN / DRAFT / UNMERGED; head `ec1caca61caa453d4e0ce5405890e8791f6bfd29`; base `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`; 33 changed files; +6,877 / -0.
- PR #169: OPEN / DRAFT / UNMERGED; current head before this pass `c9f2d6382c7902b435917411a3632c8b630c921b`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; 18 changed files; +1,428 / -0.
- Compare `81baad...` → `8c38bb...`: exactly 2 commits ahead, both documentation-only:
  - `docs/context/GITHUB-CONTEXT-WINDOW.md` (+15)
  - `docs/reports/2026-11-23-pass50-d1-lease-trusted-time-adversarial-review.md` (+50)
- Therefore PR #168 has no source/migration drift against current default in the observed delta. It is a safe canonical candidate for CI/review continuation, but merge-result CI and formal review remain separate gates.

## 2. D1 branch/PR lineage reconstructed

The implementation lineage is:

```
#148 clean CODE migration foundation (0001–0010)
  └─ #149 immutable executor identity
      └─ #150 canonical executor-bound task key v2
          └─ #152 atomic qualified admission (0012)
              └─ #157 ambiguous batch primary readback
                  └─ #159 SQL admission/receipt guards (0013)
                      └─ #161 SQL lease/fencing guards (0014)
                          └─ #163 authenticated attempt lease adapter
                              └─ #165 issuer-bound reconciliation (0015)
                                  └─ #168 consolidated current-base D1 proof
```

Validation-only PRs observed:
- #153 validates #152 head; #154/#156 validate schema-upgrade lineage; #158 validates #157; #160 validates #159; #162 validates #161; #164 validates #163; #166 validates #165.
- These are CI carriers targeting different base SHAs, not independent implementation lineages. Do not merge them as runtime code.
- PR #151 is not present in the observed PR-number sequence; no claim is made about it.

### Consolidation decision

**PR #168 is the single canonical D1 candidate for Issue #140.** Do not create another clean-base branch or merge the stacked source PRs into default. #168 already contains migrations 0001–0015 and the combined source/test package. Preserve #148–#165 as historical provenance and use their validation PRs only as evidence records.

The PR #168 migration package contains:
- 0001–0010: CODE ledger baseline, task/attempt/reconciliation/projection structures and bounded delivery.
- 0011: immutable executor identity binding.
- 0012: atomic qualified admission and receipt/outbox linkage.
- 0013: SQL admission/receipt and approval binding guards.
- 0014: lease acquisition/renewal/fencing/release and indeterminate quarantine.
- 0015: issuer-bound reconciliation decision evidence.

README explicitly records that the full legacy-table write-denial migration remains outstanding.

## 3. Newly verified blockers in the consolidated adapter

Inspection of exact PR #168 source found a gap not covered by Pass 51's lease-clock remediation:

1. `admitQualifiedTask(db, input)` still validates and uses caller-controlled `input.now` for route freshness, approval consumption and admission timestamps. Unlike `acquireAttemptLease`, it does not require a trusted clock.
2. The admission adapter's `deny` response includes `dispatch:false` but omits `executionAuthorized:false`.
3. Its `ADMISSION_ALREADY_COMMITTED` and `ADMITTED_QUEUED` success responses also omit explicit `executionAuthorized:false`.
4. Issue #140 acceptance explicitly requires both `dispatch:false` and `executionAuthorized:false` on every adapter output.
5. The worker entrypoint remains deliberately inert (404) and has no HTTP ingress, provider client, GitHub mutation or dispatch capability. The local adapter is not wired into a product controller or Hono API.

**Disposition:** HIGH / BLOCKING for admission-adapter qualification. Do not enable, mount or dispatch this adapter. Next implementation pass must inject a trusted clock, remove caller-time authority, use one trusted sample for all transaction/replay/recovery checks, and add adversarial tests for caller future/past, invalid/throwing clock and stale/rollback conditions. Every deny and success outcome must explicitly carry `executionAuthorized:false` as well as `dispatch:false`.

This does not invalidate the 68/68 local D1 tests already passed; it identifies missing security contract coverage not represented in that suite.

## 4. CI, review and governance

- PR #168 D1 Ledger Proof run `45227149858`: SUCCESS; job log reports 6 test files and 68 tests passed.
- PR #168 Pool Contract Validation run `45227149883`: SUCCESS.
- Both runs target exact PR head `ec1caca...`; they do not establish current merge-result CI.
- PR #168 formal reviews: 0 at last recorded read. Independent security review: NOT RUN.
- PR #168 merge-result CI: NOT VERIFIED.
- PR #169 exact-head CI on `c9f2d638...`: NOT VERIFIED; formal reviews: 0.
- Current effective ruleset/approval requirements and current dispatch variable value were not re-read. Do not inspect secret values. Historical false dispatch settings are not current proof.
- No secrets, provider calls, hosted D1, dispatch, deployment, Cloudflare mutation, merge or production action occurred.

## 5. Corrected executor priority — Issue #96

The previous acceleration audit incorrectly described a live three-vs-four Gemini child-count conflict.

A fresh read of Issue #96 shows an owner scope correction dated 2026-11-17:
- The first CODE executor is Claude Code + ECC + FCC using only a separately verified free route.
- Gemini agents are optional supplementary workers, selected only for a specific owner-approved task.
- Four Gemini child executions are not a mandatory launch or per-`/next` requirement.
- Dispatch remains disabled until trusted event provenance, durable single-use admission, leases/fencing/recovery, worker identity, quota controls, exact-head CI and independent review are qualified.

**Correction:** There is no current 3-vs-4 blocker. Do not spend time changing the Gemini topology or making Gemini a launch dependency. Focus on first CODE executor qualification. Issue #118 still records that the persistent server-3 host/access qualification is deferred and previous host evidence was offline/unavailable; do not claim Claude Code is runnable until the owner-approved free route and host/sandbox prerequisites are actually verified. Do not silently replace the approved executor with another profile.

## 6. UI and runtime boundary

Issue #22 still describes the primary remote web console as unimplemented. Its existing prototype is static/read-only fixture UI, without live API, authentication or telemetry. GitHub Actions runners are ephemeral and must not be used as persistent web hosting.

Keep the planned stack narrow:
- Hono + Workers Static Assets for the Experience/API surface.
- D1 as durable source of control-plane state.
- GitHub Actions for bounded ephemeral tasks only.
- One owner-authenticated, read-only UI slice before mutation/approval controls.
- Verify actual free-plan entitlements and Cloudflare Access/domain configuration before any non-production deployment.

Do not add Temporal, Coder, OpenHands Agent Server or LiteLLM as MVP runtime dependencies. Reuse selected design patterns only.

## 7. Updated critical path

1. **Pass 53 — admission adapter trusted-clock + explicit authority flags.** Fix the newly found HIGH issue; adversarial tests; exact-head CI.
2. **Pass 54 — PR #168 integration gates.** Confirm current default/base relationship; obtain merge-result CI, independent security review, provenance and governance evidence. No merge without gates.
3. **Pass 55 — actual CODE executor qualification.** Verify the owner-frozen Claude Code + ECC + FCC profile, free route, host/sandbox identity, quota and isolation. If prerequisites are unavailable, record BLOCKED and continue the web read-only slice.
4. **Pass 56 — authenticated read-only web console.** Reuse Hono/Workers Static Assets; mobile/desktop, owner authorization, session expiry/revocation, live state and audit.
5. **Pass 57 — controller binding.** Bind trusted GitHub issue-comment context to one canonical D1 admission path; keep dispatch false.
6. **Pass 58 — bounded non-production end-to-end lifecycle.** Only after explicit authorization and all gates.
7. **Final — independent Contour A acceptance.**

Defer multi-account/GPU, broad provider routing, browser automation as a core dependency, native iOS and all Contour B work.

## 8. Corrective update to prior acceleration audit

The earlier audit's Gemini 3-vs-4 conflict claim was incorrect because it missed the 2026-11-17 Issue #96 owner correction. The report and checkpoint are amended in this pass. Use this Pass 52 report as the current D1 integration and execution-priority decision.

## Evidence links

- [Issue #140 — canonical D1 integration](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96 — owner-only /next controller](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Issue #22 — secure web console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- [Issue #118 — persistent workspace host](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118)
- [PR #168 — consolidated D1 candidate](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168)
- [PR #169 — documentation package](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169)
- [Pass 51 trusted-clock remediation](2026-11-23-pass51-d1-trusted-clock-remediation.md)
- [Previous acceleration audit](2026-11-23-cloud-pool-acceleration-audit.md)

**Final state:** Pass 52 integration map VERIFIED; canonical D1 candidate identified; admission adapter remains BLOCKED pending trusted-clock and authority-flag remediation; Contour A NOT ACCEPTED; Contour B DEFERRED.
