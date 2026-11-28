# Pass 72 — Claude Code-first execution and zero-loss runner lifecycle design

- Date: 2026-11-24
- Target default SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Documentation branch: `docs/engineering-excellence-2026-11-23`
- PR: #169, OPEN/DRAFT/UNMERGED
- Tracking issue: [#172](https://github.com/VlDMlNSh/developer-cloud-pool/issues/172)

## Owner decision captured

The owner approved documenting the runner lifecycle proposal and clarified the intended agent architecture: Claude Code is the primary engineering executor; FCC is the proposed authorization/compatibility path; free provider APIs and local models are additional inference routes; Mac mini nodes and a future remote video server provide separately qualified local capabilities; Microsoft Visual Studio Code is the operator/admin workbench.

## Changes

1. Added `docs/architecture/CLAUDE-CODE-RUNNER-LIFECYCLE-AND-HYBRID-EXECUTION.md`.
2. Extended `docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md` with Claude Code-first executor and automatic slot-refill/recovery policy.
3. Extended `docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md` with FCC/provider/local-model boundaries, Mac mini/video-node placement and VS Code operator role.
4. Created Issue #172 with bounded implementation/qualification gates and explicit non-goals.
5. Updated Context Window and checkpoint to preserve the decision and evidence state.

## Critical design clarifications

- Automatic refill means the scheduler submits the next eligible job after capacity is released; GitHub still allocates a new VM and startup is not instantaneous or guaranteed.
- GitHub-hosted runners remain disposable compute. Task ledger, lease/fencing state, checkpoints, artifact digests and audit must be durable outside the VM.
- “Zero loss” is scoped to committed state under an explicitly tested failure model. Uncheckpointed in-memory work may be replayed from the last durable checkpoint; absolute zero loss is not claimed.
- Claude Code authentication, FCC compatibility, provider inference and GitHub permissions are separate concerns. FCC/ECC identities and terms must be verified from canonical sources. No quota bypass, key rotation to evade limits or paid fallback.
- Local models do not authenticate Claude Code or grant GitHub permissions.
- VS Code is an operator workbench, not scheduler/control plane/identity authority.
- Mac minis and the future video server are candidates, not connected or qualified infrastructure.

## Verification

- Starting PR #169 head: `8198ab29f928429ddd70a43f9361ad741ace96e4`.
- Starting default SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #169 exact-head workflow runs at the starting SHA: none returned; combined status contexts empty (**NOT VERIFIED**).
- PR #171 Pool Contract Validation run `45448087868`: SUCCESS on PR #171 head; its intake workflow is audit-only/non-dispatching.
- PR #170 D1 run `45274455569` and Pool Contract run `45274455577`: historical successes for the previously recorded synthetic merge head; not current proof for this documentation pass.
- No local Markdown/YAML/test validator was run in this pass.
- No runtime code, schema, dependency or workflow was changed.
- No Claude Code execution, FCC/ECC auth test, provider API call, secret read, Gemini dispatch, local host connection, video-server provisioning, VS Code remote session, deployment, merge or production write occurred.

## Status

- Documentation: **SUCCEEDED** (GitHub write acknowledgements; read-back still required).
- Tests: **NOT RUN** (documentation-only).
- PR #169 exact-head CI: **NOT VERIFIED** until refreshed after final documentation commit.
- Claude Code/FCC/ECC runtime: **NOT RUN / NOT QUALIFIED**.
- Runner refill/recovery runtime: **DESIGN / NOT IMPLEMENTED / NOT QUALIFIED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## Next bounded step

Pass 73: read back every changed document and final PR #169 head; validate Markdown/link consistency; refresh exact-head CI and governance/reviews; then begin a separate no-secret Reuse First qualification of Claude Code, FCC and ECC identities and compatibility. Do not dispatch or connect local hosts until the trusted controller and security gates are qualified.
