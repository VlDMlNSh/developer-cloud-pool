# Static security audit — 2026-11-05 PR #7 Worker authorization boundary

**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool  
**PR:** https://github.com/VlDMlNSh/developer-cloud-pool/pull/7  
**Reviewed immutable head:** `d60d26ae647940e702d646e572c861a8f68f523e`  
**Review type:** assistant-performed static source audit; NOT an independent agent review  
**Outcome:** COMMENTED / CHANGE REQUIRED BEFORE QUALIFICATION

## Scope and evidence

Read the PR diff and fetched these files from branch `fix/pool-owner-approval-guard-2026-11-04`:

| File | Blob SHA |
|---|---|
| `.github/workflows/pool-supervisor.yml` | `18e040f95d1d5c2ae5a2cce69d95109bec83947b` |
| `scripts/pool-supervisor.mjs` | `b2046dd9671c6bd5491f63a006d10239fbd3d3b1` |
| `scripts/pool-approval.mjs` | `9442c413c38dc28c67455362e254ff703bcfedd9` |
| `.github/workflows/pool-worker.yml` | `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` |
| `scripts/validate-pool-contract.mjs` | `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def` |

PR #7 exact-head CI run [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327) was reported COMPLETED/SUCCESS in the PR body. This audit did not rerun CI. PR #7 remains OPEN/DRAFT.

## Finding F-01 — Worker can be invoked without Supervisor owner-approval provenance

**Severity:** HIGH for the intended authorization boundary; current probe impact is bounded but still consumes runner resources.

The Supervisor checks that the `pool:ready` label event was sent by the repository owner and writes a bot-authored approval marker. However, `.github/workflows/pool-worker.yml` exposes a separate `workflow_dispatch` entry point. Its `validate` job checks only:
- issue is open and not a pull request;
- issue currently has `pool:claimed`;
- supplied target SHA matches the issue body;
- supplied profile matches the allowlisted DSH profile.

It does not validate the bot-authored `POOL_OWNER_APPROVAL_V1` marker, prove that the claim was created by the Supervisor, or bind the invocation to a Supervisor run. A caller with sufficient Actions dispatch permission can manually dispatch the Worker and, if able to apply `pool:claimed`, bypass the owner-event approval path.

The current Worker probe is read-only, receives no provider credentials, and does not execute arbitrary repository code. Nevertheless, this bypasses the intended issuer/capability boundary and can consume GitHub-hosted runner resources. It must be closed before qualification or enabling dispatch.

### Required remediation

1. Make Worker-side validation independently verify a fresh, matching, unconsumed owner approval and claim provenance, or remove direct dispatchability and use an equivalently strong authenticated caller proof.
2. Add negative tests for manual workflow dispatch without a Supervisor claim, forged `pool:claimed`, missing approval marker, consumed marker, mismatched SHA/profile, and stale/revoked approval.
3. Extend the static contract validator to assert the Worker-side authorization gate, not merely the presence of Supervisor approval helper names.
4. Keep `POOL_DISPATCH_ENABLED=false`; do not run a live Worker or enable dispatch while this finding is open.

## PR comment evidence

A preliminary COMMENT review was submitted to PR #7, review ID `5776343616`, anchored to the reviewed head SHA. It explicitly identifies F-01 and requests remediation. This is not an independent agent review and does not qualify the PR.

## Other live state

- PR #11 remains OPEN/DRAFT at `7b3bd8d8840e122f03326299444a921e3ba5f425`.
- PR #11 exact-head CI run [41918209585](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41918209585) is COMPLETED/SUCCESS.
- PR #11 reviews and review threads are empty: independent review NOT RUN.
- Default branch `Основной` HEAD remains `64d2636d4500127e635c214ccfb722c6b3fcda80` as recorded in the current checkpoint; PR #7 compare against that base reports 15 commits ahead, 1 behind, status diverged.
- No approved Gemini controller was found at `.github/workflows/gemini-batch-dispatch-controller.yml` on `Основной`; Gemini NOT RUN.
- No Worker, DSH, Resource Probe, browser, provider/model call, secret access, or paid fallback was run in this pass.
- No branch merge, dispatch variable mutation, or secret/variable change was made.

## Next bounded step

Repair F-01 in a new narrowly scoped PR or update PR #7 without weakening the existing Supervisor checks. Add Worker-side provenance tests and contract assertions; then run exact-head CI and obtain an independent security review. Re-check PR #11 review state separately. Keep all runtime dispatch disabled.
