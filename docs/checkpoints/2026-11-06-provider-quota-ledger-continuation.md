# Cloud Pool continuation checkpoint — provider quota ledger — 2026-11-06

## Active workstream

Continue Developer Cloud Pool account-isolated AI model routing and agents with resumable quota behavior. This checkpoint supersedes no canonical branch state; all implementation described below remains in an unmerged PR.

## Canonical baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Canonical HEAD verified during this pass: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- The canonical branch was not modified.

## Current PRs

- [PR #28 — account-isolated Model Router architecture](https://github.com/VlDMlNSh/developer-cloud-pool/pull/28): OPEN / DRAFT / UNMERGED. Design and report blobs previously read back as `cde7c12ebcffb42b1ed8d308f3b1598a68272103` and `f88470e23ce24eb22dbe6fcd3f036274bb04b807`. CI and review NOT VERIFIED.
- [PR #29 — pure provider quota ledger](https://github.com/VlDMlNSh/developer-cloud-pool/pull/29): OPEN / DRAFT / UNMERGED. Head at report creation `b2fcad10cb532b235534ccf9aca67b81dc72883d`. Exact-head status pending with zero check-runs; tests wired but NOT RUN / NOT VERIFIED. Reviews/comments empty.

## Implemented in PR #29 only

- `scripts/provider-quota-ledger.mjs`: pure, provider-independent state transition module.
- `scripts/provider-quota-ledger.test.mjs`: deterministic test suite.
- `.github/workflows/pool-contract-validation.yml`: invokes the new Node test suite.
- No actual provider keys, secret access, network calls, DB/cache, live gateway, or dispatch.

## Architecture invariants

1. Credential slots have distinct route IDs.
2. Multiple keys are considered one upstream quota domain only with explicit evidence and the same quota-domain ID.
3. Never infer independent quotas from key names, suffixes, provider identity or registry cost labels.
4. 401/403 suspend route authentication; 402 blocks billing; no paid fallback.
5. 429 with Retry-After creates a bounded cooldown; 429 without authoritative reset evidence enters reconciliation.
6. Local timer expiry is not proof of provider quota renewal.
7. Provider-authoritative evidence is required to apply a quota reset.
8. Internal task budget and upstream provider quota are separate domains.
9. Agents must receive scoped gateway capabilities, never raw provider credentials.
10. Pool dispatch remains fail-closed.

## Next exact action

Verify PR #29 exact-head CI, inspect test output and run independent review. After successful evidence, proceed to no-secret LiteLLM proof-of-fit; do not connect actual provider credentials or enable agent dispatch yet.

## References

- [Issue #26 — account-isolated multi-provider routing and quota ledger](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)
- [PR #28 — architecture](https://github.com/VlDMlNSh/developer-cloud-pool/pull/28)
- [PR #29 — implementation](https://github.com/VlDMlNSh/developer-cloud-pool/pull/29)
- [Canonical repository](https://github.com/VlDMlNSh/developer-cloud-pool)
