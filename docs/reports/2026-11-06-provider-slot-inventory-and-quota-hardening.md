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


## 2026-11-06 follow-up — lazy activation and capacity assessment

- Added `config/provider-slot-capacity-policy.json`: registration is unbounded; active credential slots have a pool-wide hard ceiling of 20. This is distinct from GitHub Actions runner concurrency.
- Added pure planner `scripts/provider-slot-admission.mjs` and tests. Tests cover 60 registered / 20 admitted, existing active leases consuming capacity, unqualified/paid/cooldown routes being rejected, over-limit fail-closed behavior and prevention of raising the hard ceiling.
- The planner does not acquire durable leases or resolve secrets. Production requires atomic shared lease storage and fail-closed admission; runtime is NOT IMPLEMENTED.
- Added quota assessment document: `docs/architecture/SLOT-ACTIVATION-AND-DAILY-QUOTA-ASSESSMENT-2026-11-06.md`.
- Publicly documented conditional subtotal: up to 120,000 tokens/day from Aion Labs Free (20k/day) + LLM7 Free (100k/rolling 24h). This is a potential documented subtotal only, not verified capacity of GitHub secrets. Cloudflare's 10,000 Neurons/day is a separate unit and not included. NaraRouter is excluded because its official docs/pricing pages conflict (5M vs 7M daily allowance).
- Exact code/test target: `94166dce9fc68d07918ea6fb6461bbd587b4258d`.
- Exact-head Actions run #214: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42207313455 — SUCCEEDED. Workflow YAML, security contracts and all three Node test files in the validation step exited successfully.
- Capacity policy blob SHA: `21d1a1cb1593256e625c1468e14fb40710313c8f`.
- Admission planner blob SHA: `b04fcb60c19cf911ae7e2f178268a1b1ceae193d`.
- Admission tests blob SHA: `c2b3f77f42a068e4fde063dfc988ad15de016fee`.
- Quota assessment blob SHA: `7fc46ef2f06777aed61772549eb540525ba01587`.
- Workflow blob SHA: `295ff3827f464bb77df61f743f361bc6eb79b5cb`.
- PR #29 remains OPEN / DRAFT / UNMERGED; independent review NOT RUN. Canonical `Основной` remains at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- GitHub combined commit status endpoint still reports `pending` with no status contexts; the exact-head Actions check-run itself is completed/success. Treat aggregate status as NOT VERIFIED.
- No secret values or secret-presence metadata were accessed; no provider API calls or live quota probes were made; no paid fallback, DB/Redis provisioning, or agent dispatch occurred.
