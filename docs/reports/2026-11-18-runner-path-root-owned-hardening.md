# Runner PATH ownership hardening — 2026-11-18

## Scope and immutable target
- Contour A / first CODE executor only.
- Default branch `Основной` remains at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Parent qualification PR: [#116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116), OPEN / DRAFT / UNMERGED.
- Follow-up commit on the PR branch: `6088a5d1e52191004c3228ed4cf6f3b72dabd116`.
- Source blob `scripts/cloud_pool/exec_allowlist.py`: `5ac9f7613d9e11cd803fe8ef5143b7fde0496605`.
- Test blob `scripts/cloud_pool/test_exec_allowlist.py`: `8ac32634e5e6374866a710b7aad5c2221a2409ed`.

## Finding
The previous child-environment guard rejected group/world-writable PATH entries but accepted a private directory owned by the runner UID. A process running under that same UID could replace a launcher after the validation step, so path validation alone did not provide an immutable executable search path.

## Change
- Every canonicalized PATH directory must now be owned by root.
- Existing directory type, existence, group/world-write and duplicate-path checks remain.
- Positive test path is the root-owned `/usr/bin` system directory.
- Added an adversarial test proving a runner-owned private directory is rejected.
- Change is isolated to the existing PR #116 qualification branch; default branch was not changed.

## Verification
- Exact-head Runner Qualification run [44278168889](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889), head `6088a5d1e52191004c3228ed4cf6f3b72dabd116`: RUNNING at report creation.
- The child-environment test step completed SUCCESS on this exact head.
- Exact-head Pool Contract Validation run [44278168854](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168854): COMPLETED / SUCCESS on the same head.
- No secret values read; no provider calls; no real Claude session; no dispatch, merge or deployment.
- PR #116 remains OPEN / DRAFT / UNMERGED.

## Current interpretation
The PATH ownership gap is corrected in source and its focused test step passed. Full runner qualification remains RUNNING until the complete workflow concludes. This is not a production executor qualification: provider-specific egress isolation, actual execution inside the sandbox, hosted-use entitlement, provider/account/free-quota evidence and FCC AGPL network-use review remain separate gates.

## Broad Contour A execution order
1. Finish the no-secret Claude Code + ECC + FCC runner proof, including artifact digest and exact-head CI verification.
2. Build the actual CODE worker container around the verified no-egress primitive; do not treat a container capability test as proof that the real executor is sandboxed.
3. Reuse and qualify a mature provider-specific egress gateway/proxy; allow only the chosen provider endpoints and prove default-deny behavior. Keep the GitHub runner host itself outside the trust boundary.
4. Qualify one FCC credential/account/model route using metadata-only identity evidence, one key per isolated FCC profile, no key cycling, no model/provider/paid fallback, explicit bounded retries and a durable quota ledger. No provider call until the security and owner-authorized route gate is satisfied.
5. Complete production A0/D1: authenticated GitHub event provenance, owner-only exact /next admission, trusted default-branch SHA, atomic single-use admission, durable outbox, lease/fencing, immutable attempts, idempotent completion, cancellation and crash/ambiguous-outcome recovery.
6. Integrate the qualified CODE worker only behind A0/D1 and capture provenance, test results, bounded artifacts and digests.
7. Deliver GitHub-native Jarvis PWA/status and task workflow without placing privileged tokens in browser code or pretending Actions runners are persistent hosts.
8. Qualify the persistent Engineering Workspace and Zero Trust access only when the exact owner-authorized host, Cloudflare Access/Tunnel, shared storage and backup/restore evidence exist.
9. Complete internal A3 review once the pool can run its own bounded review workflow; distinguish it from CI and source checks.
10. Execute the full Contour A acceptance matrix. Keep Contour B deferred until ACCEPTED.

## Blockers and prohibitions
- Provider-specific egress gateway and real worker-in-sandbox integration: NOT IMPLEMENTED / NOT VERIFIED.
- Claude Code hosted-use entitlement, provider identity, free quota and reset semantics: NOT VERIFIED.
- FCC AGPL-3.0-only legal assessment for any network-exposed use: NOT VERIFIED; FCC remains loopback-only.
- Production A0/D1, durable leases/fencing/recovery and end-to-end Jarvis task flow: NOT VERIFIED.
- Persistent Engineering Workspace host/access/backup restore: BLOCKED by Issue #118 evidence.
- Keep `POOL_DISPATCH_ENABLED=false`; no secret reads, paid fallback, quota-evasion, Gemini dispatch or Contour B work.

## Canonical references
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Implementation Roadmap](../roadmap/CLOUD-POOL-IMPLEMENTATION-ROADMAP-2026-11-17.md)
- [Canonical reference architecture PR #120](https://github.com/VlDMlNSh/developer-cloud-pool/pull/120)
- [Canonical MediaHub map — separate project](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
