# 2026-11-06 — Provider slot inventory and quota-scope hardening

## Objective

Advance Issue #26 acceptance criterion 1 with a normalized, versioned inventory derived from MediaHub's provider registry, and close a security gap in quota-domain propagation.

## Source and immutable code target

- MediaHub source: `VlDMlNSh/mediahub-os`, ref `docs/mediahub-chat-tree-map-20261012`, path `ops/qualification/provider_model_registry.json`.
- Source schema: `mediahub.provider-model-registry.v1`.
- Developer Cloud Pool base: `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- Code/test/workflow target: `ad210f0c3f2da7c734c31f44ad7883c4822ba40f`.
- Actions run #210: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42206967591 — SUCCEEDED on the exact target SHA `ad210f0c3f2da7c734c31f44ad7883c4822ba40f`.

## Work completed

1. Re-read the MediaHub registry. Its selection order contains 24 cloud credential slots; the separate local Ollama route is excluded.
2. Added `config/provider-slot-inventory.json` with 24 normalized records, preserving provider/family/model/capability and declared cost/persistence metadata.
3. Each slot has a symbolic opaque reference `secret://mediahub/provider-slots/<slot-id>`. These are identifiers only, not working URLs, secret values, or evidence of secret existence.
4. Every `account_ref` and `quota_domain_id` remains null. Credential presence is `not_checked`; billing eligibility is `not_verified`; evidence is `unknown`.
5. Added inventory tests for exact count, unique slot/reference IDs, explicit unknown account state, and no-secret/no-provider-call policy.
6. Hardened quota-ledger shared-scope behavior: a caller cannot cool down sibling slots merely by setting `scope=quota_domain`. Provider-authoritative evidence (`authority=provider` plus a non-empty evidence reference) is required. Added tests for unverified and verified scope handling.
7. Updated Pool Contract Validation to run both quota-ledger and inventory test files.

## Exact-head verification

- PR #29 head: `0b7c5e0e5887fb675c3c638fc3366747f888ff89`.
- Actions run #208 event: `pull_request`; run conclusion: `success`.
- Job: `Validate workflow syntax and security invariants`; all steps completed successfully.
- The combined validation step runs the security-contract validator and both Node test files under `set -euo pipefail`; successful job conclusion confirms both commands exited successfully.
- Files were read back from the branch after writes:
  - inventory blob `42789e7408ba688b4af323deffe63eb2e15f50b8`;
  - quota ledger blob `4ea35b4ee565fc97b7ee437a521170d38c2b46b1`;
  - quota tests blob `257efb123f3a9393c04ba64586931733f2648e11`;
  - inventory tests blob `1289bb057ae22e31b893d8e306cc980d5f20467e`;
  - workflow blob `a9913f89e20f5c2e3eadda3120719b9fc1231ae7`.

## Security and governance

- No credential values or secret-presence metadata read.
- No provider API calls or provider egress.
- No DB/Redis or paid resources provisioned.
- No Gemini controller or other agent dispatch.
- No cross-repository secret transfer.
- No changes to MediaHub issuer/capability, Jarvis, ASTRA A0, or Product State Authority.
- Canonical branch `Основной` unchanged.
- PR #29 remains OPEN / DRAFT / UNMERGED; independent review NOT RUN.

## Remaining gaps

- The inventory is registry-derived, not a verified account inventory.
- Zero account identities and zero quota domains are verified.
- Credential existence, provider account mapping, free-tier eligibility and model qualification remain unverified.
- Symbolic credential references are not connected to a secret broker.
- No live router, persistent quota store, or resumable agent runtime exists.

## Next step

Run a no-secret LiteLLM proof-of-fit with pinned immutable image/package, blocked provider egress, synthetic non-routable placeholders, and measurements for install/pull time, disk, RSS and readiness. Do not provision PostgreSQL/Redis or wire real provider credentials. Design an owner-authorized metadata handoff for account/quota-domain references without moving secret values.
