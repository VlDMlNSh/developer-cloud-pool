# Provider Quota Ledger ↔ A0 integration analysis — 2026-11-15

## Scope and immutable evidence

Read-only architecture/integration pass. No source code, migrations, workflows, secrets, provider accounts, hosted resources, deployment, merge, or dispatch were changed.

- Observed default branch HEAD before this report: `beb92ded640ed8824ab566ae574d9409f26b5ef2`.
- PR #29 quota-ledger head: `e4c8d642bbc054e7c52b391356965b492dad32b4`, OPEN / DRAFT / unmerged. Its base is `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare to current default is DIVERGED, 36 ahead / 66 behind.
- PR #67 D1/A0 head: `a53f6232bd5b50d3e150addf528b8e722002f9dd`, OPEN / DRAFT / unmerged. Compare to current default: DIVERGED, 47 ahead / 2 behind.
- PR #68 architecture/matrix head: `8569d0b368b353beb78e8594509d8492abaec170`, OPEN / DRAFT / unmerged. Compare to current default: DIVERGED, 85 ahead / 2 behind.

## Existing components — do not rewrite

### PR #29 — pure provider quota state machine

Source: `scripts/provider-quota-ledger.mjs`, blob `4ea35b4ee565fc97b7ee437a521170d38c2b46b1`.
Tests: `scripts/provider-quota-ledger.test.mjs`, blob `257efb123f3a9393c04ba64586931733f2648e11`.

Already models distinct credential route IDs, explicitly evidenced shared quota domains, 401/403 auth failure, 402 billing block, 429 cooldown or reconciliation, bounded 5xx cooldown, provider-evidence-only quota reset, and immutable pure transitions.

Important gap: newly created routes start with `quotaEvidence: "unknown"`; `listEligibleRoutes()` does not require verified quota evidence and can return these routes as eligible when the caller permits their billing class. Existing test "does not infer account independence from provider identity" expects four eligible routes including the unknown-account route. This is unsafe if downstream admission treats the result as an authorization decision. Treat this function as a candidate selector only until its contract is corrected and tested fail-closed.

### Provider slot inventory and placement

Inventory blob: `42789e7408ba688b4af323deffe63eb2e15f50b8`.
Placement policy blob: `e11e0fb4058e9bb63c237fa2d0d8395c191210aa`.

The inventory explicitly states 24 cloud slots, 0 verified account identities, 0 verified quota domains; account/quota nulls mean unverified; credential presence is not checked; billing eligibility is not verified; declared cost class is inventory metadata only. Therefore no listed external provider route is currently eligible for free_quota admission.

The pure slot planner requires accepted qualification, available credential status, ready route state, matching model and an allowed billing class, but does not itself prove issuer/account/quota-domain authority. It is a placement planner, not an admission authority.

### PR #67 — A0 and D1 proof

A0 source blob: `14c31d66995d6f99ceb6ea5df060ba8e00848464`.
A0 test blob: `0070fffdf0595b5ebd9edced0b0e92bebf3af38c`.
D1 consume source blob: `f71e559a7c13b9a0242a7f619eba998c5906d95e`.

A0 currently accepts a caller-supplied route ID if the cost class is `free_quota`, the route is not one of three named forbidden IDs, and an injected quota verifier confirms the supplied quotaDomainId. It does not positively resolve route ID against a qualified registry nor bind provider/model/account/issuer/credential-handle/quota-domain/evidence identity as a single immutable route qualification object.

D1 `consumeApproval()` conditionally consumes a matching pre-existing approval row. Migration 0002 creates a legacy claim/outbox from the state transition; migration 0003 adds logical task identity, task approvals and a task delivery outbox; migration 0004 defines immutable attempts and fenced lifecycle. The current A0 module is not wired to this D1 consume path, and no one atomic A0 admission API composes route eligibility, verified quota evidence, approval consumption, task identity, attempt creation and queue intent. The consume adapter is local-only and does not cryptographically verify issuer/owner authority.

## Exact-head CI evidence (not qualification)

- PR #29 head `e4c8d642...`: Pool Contract Validation run `43031920223` COMPLETED / SUCCESS. Combined status contexts empty. This validates the workflow at that historical head only; no independent review, integration or runtime provider evidence.
- PR #67 head `a53f6232...`: Pool Contract Validation `43600901063` and Isolated D1 Ledger Proof `43600901068` COMPLETED / SUCCESS.
- PR #68 head `8569d0b3...`: Pool Contract Validation `43604562851` and Runner Resource Probe `43604562855` COMPLETED / SUCCESS. The runner probe is read-only ephemeral inventory, not agent execution or reserved capacity.
- Required branch ruleset checks remain NOT VERIFIED where combined status contexts are empty.

## Integration decision

Do not cherry-pick the entire PR #29 branch into PR #67: PR #29 is 36 ahead / 66 behind current default and has a divergent baseline. Reconcile its source/test patches against the current base first, retaining provenance and exact file-level review.

Target contract should be a versioned, typed `QualifiedRouteEvidence` record bound to:
- route ID, provider ID, model ID;
- opaque account identity and issuer identity;
- quota-domain ID and authoritative quota evidence reference;
- cost class, allowed capability/profile;
- evidence observed-at and valid-until;
- credential reference handle (never secret material);
- qualification status and revocation/version state.

Admission must reject missing, unknown, stale, revoked, mismatched, ambiguous or unavailable authority evidence before consuming owner approval. A0 then performs one atomic D1 transaction that binds owner/tenant approval, repository/issue/target SHA/profile, route evidence digest, task identity, attempt identity and durable queue intent. If the transaction result is ambiguous, fail closed and resolve by durable read-back; do not dispatch. Keep `dispatch:false`.

## Next bounded engineering step

1. Reconcile PR #29 quota-ledger source/test changes against current default; avoid wholesale branch merge.
2. Correct the quota ledger selector contract so unknown/unverified quota routes cannot be returned as eligible for external free_quota use; add negative tests for unknown account/domain, missing provider reset evidence, stale/revoked evidence and caller-controlled billing-class bypass.
3. Define the A0 route-evidence schema and D1 atomic admission transaction using existing migrations/APIs where safe; do not create a second ledger.
4. Add Workers-runtime adversarial tests for replay, concurrent consume, task-key collision, cross-tenant substitution, route-evidence digest mismatch, unavailable authority, ambiguous commit/read-back and dispatch false.
5. Re-run exact-head CI and inspect artifacts/logs before changing status.

No source changes in this pass. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
