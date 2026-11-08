# PR #37 F2 remediation — implementation and exact-head qualification

Date: 2026-11-08 21:12 Europe/Vilnius

## Scope and immutable target

- Parent PR: #37, source head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Stacked remediation PR: [#53](https://github.com/VlDMlNSh/developer-cloud-pool/pull/53).
- Branch: `fix/pr37-f2-finalizer-fencing-2026-11-08`.
- Exact tested head: `b8a253f06418841d5f0250c9fd550bf3247db040`.
- Base: `feat/reusable-pool-worker-boundary-2026-11-06` at parent PR #37 head.
- PR #53 remains OPEN / DRAFT / UNMERGED; mergeable=true at last readback. Formal PR reviews: 0.

## Implemented

1. Supervisor computes SHA-256 of the complete task Issue body at intake and emits it as `envelope_digest`.
2. Supervisor creates a unique claim-generation label `pool:claim-<run_id>-<run_attempt>`, attaches it alongside `pool:claimed`, and verifies exact label/body/state readback before emitting Worker inputs.
3. Reusable Worker now requires the claim-generation label and envelope digest as inputs. Before the probe, it checks issue open state, exactly one managed state, exactly one matching generation, exact digest, target SHA, profile and existing caller/callee workflow identities.
4. Finalizer policy checks Issue number, open state, SHA-256 of the complete body, exactly one managed state equal to `pool:claimed`, and exactly one generation matching this Supervisor run/attempt. It removes the generation label when transitioning to a terminal state.
5. Finalizer runner re-reads the issue immediately before mutation and verifies terminal labels, issue state and unchanged body before posting provenance.
6. Added nine adversarial policy tests and static cross-workflow boundary assertions. Extended the pool contract validator and CI workflows to cover the remediation branch.

## Exact-head CI evidence

At exact head `b8a253f06418841d5f0250c9fd550bf3247db040`:

- Pool Contract Validation — run `42513724707`, COMPLETED / SUCCESS. YAML parse, dispatch-gate assertion and pool security contract validator all passed.
- Reusable Pool Worker Boundary Validation — run `42513724733`, COMPLETED / SUCCESS. Supervisor syntax, authorization boundary tests and finalizer fencing adversarial tests all passed.
- Exact commit check-runs: `contract` SUCCESS and `Validate workflow syntax and security invariants` SUCCESS.
- Earlier failed iterations were corrected; only the final exact-head results above qualify this head.

## Residual limitation — F2 is not fully closed

GitHub Issues' labels PATCH endpoint in this implementation does not provide an atomic compare-and-swap. The runner performs two reads, revalidates immediately before mutation and checks readback, but a narrow external concurrent mutation between the last read and PATCH cannot be excluded. This implementation materially fences stale/duplicate runs but does not prove race-free atomic finalization.

Do not describe F2 as fully resolved, do not merge PR #53, and do not enable dispatch. The remaining decision is to qualify and integrate an atomic durable fencing authority (candidate: D1 conditional transaction/unique claim ledger from the separate Cloudflare Workflows + D1 proof line), or obtain a documented governance acceptance of the residual risk. Local D1 proof is not hosted qualification.

## Governance and runtime

- PR #53 independent authorized review: NOT RUN / NOT VERIFIED (0 reviews).
- Current ruleset still does not require approving reviews; governance gate remains insufficient.
- No dispatch, Worker/DSH execution, provider/model calls, secret reads, deployment, remote D1 operation or production resource creation occurred.
- Cloud Pool runtime: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Qualify the D1 fencing transaction as a compare-and-swap authority using transaction-level tests for stale generation, duplicate finalizer, body mutation, replay and rollback. Keep GitHub labels as a read-only projection until remote D1 semantics and independent review are verified. Then integrate the authority into Supervisor/Worker/Finalizer and rerun exact-head CI plus authorized independent security review.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
