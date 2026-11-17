# Cloud Pool checkpoint — 2026-11-16 — canonical admission/attempt contract

Repository: `VlDMlNSh/developer-cloud-pool`
Default branch: `Основной`
Observed default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
Documentation branch: `docs/next-2026-11-16-current-state-refresh` (not merged; docs only).

## Current verified state
- Issue #94: open requirement for exactly four bounded Gemini roles in the current qualification wave.
- Issue #96: open dedicated Cloud Pool owner-only `/next` control issue.
- PR #111: OPEN/DRAFT/UNMERGED; head `687196738782432797bf394f1342cb9df19f478f`; local Workers-runtime D1 proof 37/37 and contract validation SUCCESS.
- PR #112: OPEN/DRAFT/UNMERGED; head `c9a4c0ab2001f01a09632795283071c521e1c99d`; read-only event unit tests 21/21 and contract validation SUCCESS; real event-admission job skipped.
- PR #113: OPEN/DRAFT/UNMERGED documentation refresh.
- None of PR #111/#112 is independently reviewed or production-integrated.
- Local D1 emulation is not hosted D1 qualification.
- No qualified Cloud Pool-native Gemini controller or live dispatch is verified.

## Canonical design decision
One state machine and one transactional boundary:
trusted owner event -> immutable durable admission -> one-shot approval consume + logical task + outbox -> immutable attempt -> authenticated fenced worker -> evidence -> terminal projection or separately authorized reconciliation.

Use immutable attempt lifecycle as canonical. Do not mix legacy expiry-reclaim lease adapter with attempt lifecycle. Expiry alone never authorizes takeover/retry. Indeterminate attempts remain blocked until independently authorized reconciliation. Distinguish controller code SHA from target SHA. Source comment ID is the admission idempotency key. Read after ambiguous database or GitHub outcomes before retry.

## Status
- Event predicate unit tests: VERIFIED (candidate only).
- Actual trusted webhook execution: NOT VERIFIED.
- Local D1 claim/attempt proof: VERIFIED (candidate only).
- Hosted D1: NOT VERIFIED.
- Integrated admission/attempt controller: PLANNED.
- Gemini dispatch/provider calls: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Evidence
- [Report — canonical admission/attempt integration contract](../reports/2026-11-16-next-canonical-admission-attempt-contract.md)
- [Master continuation prompt](../prompts/CLOUD-POOL-MASTER-CONTINUATION-PROMPT.md)
- [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [PR #111](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111)
- [PR #112](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112)
- [PR #113](https://github.com/VlDMlNSh/developer-cloud-pool/pull/113)
- [Default HEAD](https://github.com/VlDMlNSh/developer-cloud-pool/commit/35208f0ef28f0ac031a7acdf35fc90ccc9b16845)

## Next
Implement a clean-base, no-secret D1 admission integration slice with `dispatch: false`, adversarial tests, exact-head CI and independent review. No Gemini dispatch until all Issue #94/#96 qualification gates pass.
