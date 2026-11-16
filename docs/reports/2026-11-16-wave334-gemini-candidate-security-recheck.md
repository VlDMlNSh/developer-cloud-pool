# Wave 334 — Four-account Gemini candidate security recheck (2026-11-16)

## Scope
Read-only review of Cloud Pool PR #107 at immutable candidate HEAD 027492668e7721a5371b38997bc76a6cd6a50cd4, base e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b. No source changes, secret inspection, provider calls, dispatch, merge, or deployment.

## Fresh evidence
- PR #107 OPEN / DRAFT / UNMERGED; formal reviews: 0.
- Exact-head Pool Contract Validation run #43868830501, job #133304274884: COMPLETED / SUCCESS.
- Workflow runs YAML parsing, scripts/validate-pool-contract.mjs, and node --test scripts/gemini-four-agent-controller.test.mjs.
- Test blob 245a1b6f5363215937896b9eb4028ba43b72d8f5; workflow blob 69da86b2813040dc43d8017fa7dd09d674f200d4; controller blob f1e531d7226ec8244ee7391569a5f290226f43b1.
- package.json and package-lock.json are absent (404 on exact path reads). Controller dynamically imports @google/genai; SDK runtime NOT VERIFIED.
- Validation workflow permissions are contents: read; dispatch gate false/unset in CI.

## Findings
Owner-authored PR #107 comment #6917019970 records these primary-review findings:
1. GEMINI_MODEL is caller-overridable without an allowlist, allowing unintended or paid model selection.
2. No per-agent request timeout/cancellation.
3. Model output is unbounded and written to stdout/report without a size bound.
4. Distinct credential strings do not prove distinct Google account identities or independent quota domains.
5. No production integration with owner-authored Issue #96 /next, immutable target SHA, durable single-use lease/fencing, or child-run reconciliation.

These are not an independent security approval. Formal PR review count remains zero.

## Qualification status
- Four isolated fake-client task envelopes: CI VERIFIED at exact candidate SHA.
- Four real Google accounts and independent quota domains: NOT VERIFIED.
- Four live Gemini provider requests: NOT RUN.
- SDK install/runtime: NOT VERIFIED.
- Production admission integration: NOT IMPLEMENTED / NOT VERIFIED.
- Independent security review: NOT RUN.

## Control-plane state
- Issues #94 and #96 remain OPEN.
- PR #102 is explicitly a read-only event-admission probe; durable idempotency, enforced distributed lock and dispatch are not qualified.
- MediaHub Issue #301 is a separate control plane and was not used as a substitute.
- No new owner /next comment on Issue #96; no Cloud Pool or MediaHub Gemini dispatch.

## Disposition and next step
PR #107 remains isolated and unqualified. Do not merge or invoke provider clients. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.
Next: add a fixed reviewed model allowlist, bounded request lifecycle, output-size/redaction limits and adversarial tests; then qualify a pinned official SDK with reproducible lockfile and fake transport in a network-enabled Node 22 environment. Separately close Issue #94/#96 admission, durable fencing/reconciliation and governance gates.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md