# Pass 97 — canonical controller existence and integration precondition

Date: 2026-11-25  
Scope: bounded repository-tree verification following Pass 96. No implementation changes.

## Frozen inputs

- Default branch SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca` (read from PR #174/#175 base metadata).
- PR #175 D1 branch: `integration/pass92-d1-clean-base-565404f`, head `3d69bc943677dba909792bf4930d4c0aa5d2233f`.
- PR #174 audit branch: `feat/pass88-owner-next-api-audit-proof-2026-11-25`, head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`.
- Documentation branch: `docs/engineering-excellence-2026-11-23`, prior head `f52a1b51aea08a08956e984e711dc0ef5e9b14bf`.

## Finding: canonical workflow file is absent

Read-only GitHub Contents API enumeration of `.github/workflows` at the exact default SHA `565404f84b6b86afb4dc2d8fa939341f42df6eca` returned six workflows:
- `dsh-runtime-evaluation.yml`
- `pool-contract-validation.yml`
- `pool-supervisor.yml`
- `pool-worker.yml`
- `runner-resource-probe.yml`
- `(none named next-event-controller.yml)`

The same enumeration at PR #175 branch `integration/pass92-d1-clean-base-565404f` returned the D1 proof workflow plus those five files; `next-event-controller.yml` is also absent there. Direct fetch of `.github/workflows/next-event-controller.yml` returned 404 at both refs.

This means the workflow identity pinned in D1 source and migration 0017 is currently a **non-existent workflow path** on both the current default and the D1 candidate branch. It is not merely a naming disagreement with PR #174. The PR #174 audit workflow exists only on its feature branch and remains audit-only.

## Related implementation review

- PR #175 binder still accepts normalized flat Actions context and hashes it; it does not make GitHub API calls.
- PR #174 script performs API read-back of repository, issue, comment, workflow run, workflow metadata and default ref, but returns `OBSERVED_ONLY` and explicitly creates no admission.
- PR #174 verifier pins `.github/workflows/owner-next-event-audit.yml`; it rejects run attempts other than 1 pending durable replay reconciliation.
- PR #175 migration 0017 hard-codes `next-event-controller.yml` and a workflow ref that does not exist at the inspected refs.
- PR #174 and #175 remain OPEN / DRAFT / UNMERGED. PR #175's two previously observed CI runs remain SUCCESS; standalone exact-head combined status contexts were empty / NOT VERIFIED. Reviews and review threads remain 0.

## Decision / safe next step

Do not add an attestation module or change migration 0017 in isolation. First define and create the actual canonical controller workflow on a clean branch from current default, then bind its immutable workflow ID/path/ref/code SHA into the API verifier and D1 receipt contract in one coherent change. Preserve least-privilege read-only API permissions. Admission must happen in that same workflow run after API read-back and a second default-ref check. Keep reruns fail-closed until same-comment durable reconciliation is implemented. Keep dispatch and execution authority disabled.

This pass deliberately made no code, schema, workflow, dependency or permission changes because the canonical workflow prerequisite is absent and integrating the verifier into a fictitious path would create misleading provenance.

## Verification and governance

- Default and PR #175 workflow directories enumerated via read-only GitHub Contents API.
- Direct workflow-file fetch: 404 at default SHA and PR #175 branch.
- PR #174 and #175 metadata re-read: both OPEN / DRAFT / UNMERGED; both based on current default SHA.
- PR #175 associated Actions runs: D1 `45690428935` SUCCESS; Pool Contract `45690428805` SUCCESS.
- Exact-head combined status contexts: empty / NOT VERIFIED. Formal reviews / threads: 0 / 0.
- Active ruleset `26550182`: PR required, no bypass actors, zero required approvals, review-thread resolution required.
- No local tests, code changes, D1 writes, live webhook, dispatch, secrets access, provider calls, deployment, merge or production writes. Gemini NOT RUN; Claude Code/ECC/FCC NOT RUN; independent security review NOT RUN.
- Active time NOT MEASURED.

## Status

- Canonical workflow existence: BLOCKED.
- API-attested D1 composition: BLOCKED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: create the canonical controller workflow and its read-only API-attestation path on a clean current-default branch, then connect it to the existing D1 proof with adversarial tests before enabling any dispatch.
