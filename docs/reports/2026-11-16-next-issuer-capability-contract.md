# /next report — issuer-authenticated claim capability contract

Date: 2026-11-16  
Scope: Contour A only; design contract documentation. No implementation, provisioning, dispatch, merge or acceptance.

## Live state verified

- PR #106: OPEN / DRAFT / UNMERGED; head `e862578cd4a7b0ca2156ba37c1abdaa44e6b47cb`; base `0635ed2fe8de2340c685d49d20acc5b8bf7a3d92`.
- Exact-head run `43844179125`: COMPLETED / SUCCESS.
  - browser public-Web job `133220077946`: SUCCESS
  - pinned Skills job `133220078188`: SUCCESS
  - workflow/security contract job `133220078388`: SUCCESS
- Cloud Pool-native `.github/workflows/gemini-batch-dispatch-controller.yml` on default branch `Основной`: 404 / NOT FOUND. Issues #94 and #96 remain OPEN. Three Gemini agents: NOT RUN / BLOCKED; no controller/child run IDs or artifacts.
- Issue #38 remains OPEN. PR #39/#54 local D1 proof and PR #37 authorization boundary remain unmerged proposals. Their tests do not qualify hosted issuer, key custody, trusted time or claim service.
- Default Supervisor/Worker remain pre-PR #37 code; privileged default workflow and label-based claims remain unresolved.

## Work completed

Created [ISSUER-AUTHENTICATED-CLAIM-CAPABILITY-CONTRACT.md](../contracts/ISSUER-AUTHENTICATED-CLAIM-CAPABILITY-CONTRACT.md).

The contract defines:
- signed EdDSA/Ed25519 capability format with pinned algorithm and locally trusted key ID;
- RFC 8785 canonical envelope digest and immutable task/repository/SHA/profile bindings;
- exact owner `/next` source admission and immutable target SHA;
- key custody, rotation, revocation and anti-rollback requirements without selecting an unverified service;
- service-owned trusted time, expiry and bounded-skew requirements;
- atomic single-use nonce consume + claim/outbox transaction and ambiguous-outcome reconciliation;
- denial taxonomy, audit constraints and adversarial test matrix;
- explicit qualification gates and no-provisioning/no-dispatch boundary.

## Important limitations

This is a DESIGN CONTRACT, not implementation or qualification. No signing key, GitHub App, OIDC trust, D1 database, Worker or paid service was created or assumed. No secret values were read. The local PR #39/#54 D1 tests remain synthetic/local proof only. Dispatch remains fail-closed.

## Next bounded step

Implement a pure verifier against fixed public test vectors (strict JWS header/Ed25519, canonical digest, issuer/audience/repository/task/SHA/profile/policy binding, key revocation, trusted-time injection and replay denial), then add adversarial tests. Do not integrate live signing or provision hosted resources until key custody and trusted time are approved and evidenced.

## Links

- [Capability contract](https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/agent-browser-ephemeral-worker-2026-11-16/docs/contracts/ISSUER-AUTHENTICATED-CLAIM-CAPABILITY-CONTRACT.md)
- [PR #106](https://github.com/VlDMlNSh/developer-cloud-pool/pull/106)
- [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Canonical MediaHub OS map — separate project](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)