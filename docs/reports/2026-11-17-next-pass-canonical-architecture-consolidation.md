# /next — Canonical Cloud Pool Architecture Consolidation

**Date:** 2026-11-17  
**Scope:** Cloud Development Pool Contour A only. No Contour B work, provider calls, secret reads, deployment, merge or production dispatch.

## Work completed

Created the normative reference architecture:

- `docs/architecture/CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md`
- Document ID: CDP-RA-001, version 1.0.0.
- Scope: Jarvis experience/intelligence, trusted intake, A0 authority, D1 durable state, supervisor/dispatch, ephemeral workers, Claude Code/ECC/FCC, route qualification/quota, evidence/A3, UI, storage, networking, security, release gates and implementation order.

Linked it from the owner freeze and implementation roadmap. Preserved existing source documents and contracts. Added an explicit statement that the reference is candidate-canonical on the docs branch until PR #113 is reviewed and merged.

## Key architectural decisions consolidated

1. One first CODE profile: Claude Code CLI → pinned ECC → loopback FCC → one positively qualified free API route.
2. No Anthropic API auth, secret-value reads, paid fallback, key cycling or cross-account quota mixing.
3. Jarvis is the only UI/control surface; planner output is advisory and never grants authority.
4. A0 remains the only authority for issuer, subject, capability, policy, route and quota admission.
5. D1 remains the durable transactional task/attempt/outbox boundary. Reuse existing contracts; do not create a parallel state machine.
6. Durable single-winner admission requires transactional state, idempotency, lease/fencing, expiry and recovery. GitHub labels/Actions concurrency alone are not locks.
7. First release is GitHub-hosted ephemeral runners and GitHub-native static PWA/status flow; no always-on host is assumed.
8. FCC child environment must be constrained by a minimal allowlist. Existing synthetic bridge success does not prove generic credential sanitization.
9. Independent A3 verification is mandatory; executor cannot self-certify.
10. Gemini, Codex, second CODE, MEDIA, server #3, persistent workspace and Contour B remain supplementary/deferred behind separate gates.

## Existing evidence retained without overclaim

- FCC installation, loopback runtime and synthetic mock-only CLI bridge have bounded CI evidence on PR #116. They do not prove a real provider route or real Claude task.
- Generic child-process secret sanitization: NOT VERIFIED.
- Real free provider route/account/quota: NOT VERIFIED.
- Integrated hosted A0/D1 and production durable lease/fencing/recovery: NOT VERIFIED.
- Jarvis responsive authenticated end-to-end UI: NOT VERIFIED.
- Persistent workspace/server #3: BLOCKED / NOT RUN.
- Gemini controller: NOT QUALIFIED / NOT RUN.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## Repository state before this documentation write

- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Docs branch before write: `daa4e75e689c1fcace5e7ba31b6a2f5f12602ae5`.
- PR #113: OPEN / DRAFT / UNMERGED, base default.
- PR #116: OPEN / DRAFT / UNMERGED, executor candidate.

## Validation limits

This pass changed documentation only. No code tests or provider tests were run. No merge, deployment, secret access or Gemini dispatch occurred. The new architecture document still requires review and acceptance; it must not be described as deployed or accepted.

## Next implementation slice

Implement a production-safe minimal FCC child environment allowlist and negative tests, then qualify one free provider route/account/quota without secret-value reads. Continue integrated A0/D1 and durable lease/fencing qualification. Keep dispatch fail-closed.

## Links

- [Canonical Reference Architecture](../architecture/CLOUD-POOL-CANONICAL-REFERENCE-ARCHITECTURE-1.0.md)
- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Implementation Roadmap](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [PR #113](https://github.com/VlDMlNSh/developer-cloud-pool/pull/113)
- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
