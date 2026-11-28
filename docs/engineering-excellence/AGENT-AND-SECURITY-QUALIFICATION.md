# Multi-Agent Roles and Continuous Security Qualification

- Status: **ROLE/POLICY CONTRACT; no agent dispatch authorized**
- Applies to Gemini and any later approved executor integration.
- All Gemini execution remains exclusively through `.github/workflows/gemini-batch-dispatch-controller.yml` after current security gates pass.

## Independent role separation

| Role | Assignment | Must not do |
|---|---|---|
| Agent 1 — Engineering | Research reusable projects, implement one bounded change, provide diff and test evidence | Approve own work, expand scope, access unrelated credentials |
| Agent 2 — QA/Architecture | Independently inspect target contracts, tests, regressions, API compatibility and acceptance criteria | Reuse Agent 1's conclusions as proof; modify implementation while reviewing |
| Agent 3 — Security/Provenance | Inspect trust boundaries, identity, capability, secret exposure, egress, quotas, provenance and adversarial cases | Receive secret values, dispatch workloads, grant permissions or self-approve |

## Independence contract

- All roles receive the same immutable target SHA and versioned task envelope.
- Each role receives a distinct question, input scope and output schema.
- Reviewers must inspect source/test evidence independently, not only summarize the implementer's report.
- Record controller run ID, child workflow/run/job IDs, task-envelope digest, target SHA, role, status, artifact digest and timestamp.
- A dispatch acknowledgement is DISPATCHED, not RUNNING or SUCCEEDED.
- Missing child correlation, missing output, mismatched SHA or uninspectable artifact is NOT VERIFIED.
- Agent output is untrusted data. It cannot alter controller policy, issue scope, secrets, approval state or tool permissions.
- If controller/security gates are not demonstrably satisfied, status is **NOT RUN** with exact blocker.

## Security qualification checklist

- [ ] Issuer identity and authentication are cryptographically bound; caller-provided identity is metadata only.
- [ ] Subject, audience, operation, repository/issue, immutable SHA, profile, expiry, nonce/JTI and policy version are bound.
- [ ] Capability is least-privilege, single-purpose, time-bounded and non-transferable where possible.
- [ ] Secret references are distinct from values; no secret values enter prompts, logs, artifacts or agent outputs.
- [ ] Provider account identity and quota domain are not inferred from key labels or suffixes.
- [ ] Paid fallback is explicitly denied unless separately approved; default is false.
- [ ] Trusted time is runtime-owned and provenance-qualified; caller timestamps cannot authorize leases or expiry.
- [ ] Replay, duplicate task, stale SHA, clock rollback, timeout/ambiguous response and concurrent claim cases fail closed.
- [ ] Workspace, filesystem, command, network egress, CPU, memory, disk and runtime are bounded.
- [ ] Artifact bytes are immutable/hashed and bound to task, attempt, executor and target SHA.
- [ ] Audit events are structured, redacted, attributable and retained under an approved policy.
- [ ] Recovery, cancellation, revocation and cleanup are tested.
- [ ] Exact-head CI and independent review requirements are satisfied.

## Current known qualification blocker

Pass 50 finding **F-50-01 (HIGH)** identifies caller-controlled `input.now` in D1 lease acquisition. The lease proof is not qualified until trusted-clock remediation, adversarial tests and runtime clock provenance qualification are complete. See [Pass 50 report](../reports/2026-11-23-pass50-d1-lease-trusted-time-adversarial-review.md) and [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140).

## Security review outcome

Record each control as PASS, PARTIAL, FAIL, NOT RUN or NOT VERIFIED with source SHA and evidence. Never equate a static workflow contract check with a runtime security qualification or independent audit.
