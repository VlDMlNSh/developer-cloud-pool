# Pass 124 report — read-only owner /next controller (2026-11-28)

## Result

Implemented a read-only GitHub issue-comment controller and CLI bridge on the existing Pass 118 collector / Pass 110–111 attested envelope and D1 receipt lineage. This closes the missing controller-to-collector invocation step, but it does not yet compose the same runtime-produced envelope through the Workers verifier into the local D1 adapter.

## Code changes

1. Added .github/workflows/next-event-controller.yml.
   - Accepts only created issue comments for repository owner /next on Issue #96.
   - Numeric owner ID must match comment author and sender; OWNER association required; PR conversation comments excluded.
   - Read-only contents/issues/actions permissions; no dispatch, workflow_run, workflow_call or write scopes.
   - Checks out the workflow-pinned source at github.workflow_sha; checkout credentials are not persisted.
   - All Actions pinned by full SHA.
2. Added scripts/owner-next-controller.mjs.
   - Reads the runner event payload.
   - Calls the existing fixed-origin bounded GitHub API collector using the ephemeral read-only Actions token.
   - Maps trusted GitHub Actions context.
   - Recomputes canonical Envelope v1 digest before output.
   - Writes only base64-safe GitHub outputs for serialized envelope, digest and trusted context; authorization outputs remain false.
3. Added scripts/owner-next-controller.test.mjs.
   - Exact serialized envelope round-trip.
   - Digest substitution rejection.
   - Dispatch/execution escalation rejection.
   - Trusted-context origin rejection.
   - GitHub output injection rejection.
4. Extended Pool Contract Validation to statically enforce owner identity, read-only permissions, workflow SHA checkout, pinned actions and no privileged triggers; the validator executes the new CLI tests.

No runtime dependency, new ledger or provider route added.

## Frozen SHA and CI

- Default base SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca.
- Implementation/test head: 359302ea4082b36b5c5be7af4bdb03d5037daeed.
- PR #188 merge-result SHA: 4731e2d21fde8a328ec6dbbc14791da40980f0e7.
- Pool Contract Validation run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46170933384
- Job: 141058959300, SUCCESS.
- Job log confirms workflow YAML parse, Pool Contract security validator and 32/32 Node tests passed.
- PR #188: OPEN / DRAFT / UNMERGED; 170 commits, 83 files, +11,425/-4 against default due the cumulative D1 proof + Pass 120–124 stack.
- PR #188 reviews: 0; inline threads: 0.
- D1 local integration tests on the Pass 124 merge-result: NOT RUN. This default-base run executed Pool Contract Validation only; do not infer D1 composition from it.
- Independent security review: NOT RUN.

## Daily OSS intelligence — 2026-11-28

- Bifrost official advisory page lists high/critical findings: unauthenticated RCE in custom plugin HTTP path for dynamically linked builds, critical MCP stdio RCE, and SSRF deny-list gaps. Previous PILOT candidate is downgraded to DEFER until affected/fixed versions, SBOM, threat model and independent review are verified. Sources: https://github.com/maximhq/bifrost/security/advisories and https://github.com/maximhq/bifrost/security
- agentgateway v1.7 release describes model capability/context metadata, service-tier cost accounting and tool-output prompt guards. Adapt metadata/policy ideas only; tool-output guardrails may send user tool output to vendor APIs. Source: https://github.com/agentgateway/agentgateway/releases
- LiteLLM remains undeployed for current Contour A pending security review of its 2026 advisory/incident history. Sources: https://github.com/BerriAI/litellm/security/advisories and https://docs.litellm.ai/blog/trail-of-bits-patch-the-planet

## Safety and limits

No secret values read, provider calls, hosted D1 writes, controller event execution, dispatch, executor launch, deployment, merge or production mutation. No Gemini or Claude dispatch. No new paid resource. CI uses read-only permissions. Runtime deployment and phone/desktop UI qualification remain NOT VERIFIED. Time and performance benefit NOT MEASURED.

## Next

Pass 125: pass the exact collector serialized JSON/digest and trusted Actions context through the Workers verifier into the local D1 attested adapter; prove receipt persistence/replay and legacy import isolation. Keep dispatch=false and executionAuthorized=false.
