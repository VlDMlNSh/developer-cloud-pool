# 2026-11-05 — Cloud Pool launch estimate and readiness baseline

## Executive estimate

As of 2026-11-05, estimate **20–35 active engineering hours** to reach the first controlled cloud execution on a GitHub-hosted ephemeral runner, assuming no major upstream DSH packaging issue and no newly discovered repository-governance restriction.

This target means:
- one approved task;
- one standard GitHub-hosted Linux runner;
- an integrated, fail-closed Supervisor -> reusable Worker path;
- immutable target SHA and auditable run/job provenance;
- DSH headless smoke or equivalent first allowlisted workload;
- no provider credentials and no model call for the first smoke;
- terminal task state and safe ambiguous-outcome handling;
- exact-head CI, zizmor and independent security review before dispatch enablement.

It does **not** mean that all 20 logical profiles are implemented, all 20 slots are load-qualified, or the full Jarvis/model/browser platform is production-ready.

## Current verified baseline

Canonical branch files read from GitHub:
- `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- `.github/workflows/pool-worker.yml`, blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- 20-runner architecture, blob `42ef2f156a028fcc66907c99fb9f05b99fcaef42`.
- Supervisor/recovery architecture, blob `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`.

The canonical Supervisor still has the privileged `workflow_run` trigger, REST `workflow_dispatch`, stale-claim return to `pool:ready`, and dispatch-error return to `pool:ready`. The canonical Worker still exposes direct `workflow_dispatch`, validates a claim label rather than owner-authored approval provenance, installs DSH without the proposed shared lockfile, and has an issue-write report job. The standalone caller/approval/planner helpers on PR #12 are not wired into the canonical Worker/Supervisor path.

Relevant open draft PRs:
- #12 caller validation and single-use approval/planner helpers; production wiring absent.
- #14 pinned zizmor audit; current exact-head success not established.
- #15 removes `workflow_run` in its branch but does not close the direct dispatch bypass or single-use recovery conflict.
- #16 DSH lockfile attempt; no verified lockfile artifact.
- #17 audit lane; exact code head `7bd7234a1840847b602d1527475c35bfda3de94f` failed at zizmor run `42042364242`; diagnostics not retrieved. Current documentation head `260a74326b46a4c93159d2f6aec3fd2639b2e531` has no newer run returned.

No PR was merged in this pass. No Worker, DSH, Resource Probe, browser, model/provider call or paid fallback was executed.

## Work breakdown to first controlled launch

| Work package | Active hours | Acceptance evidence |
|---|---:|---|
| Integrate owner approval, caller/callee validation and reusable Worker boundary; remove direct Worker dispatch and REST dispatch; make Supervisor sole state writer | 7–12 | adversarial tests; no alternate entry point; exact immutable task envelope |
| Fix claim lifecycle: no automatic ready requeue after consumed/ambiguous approval; fail closed to needs-review; define idempotency and race handling | 3–5 | duplicate/replay/race/timeout/dispatch-unknown tests |
| Resolve DSH dependency provenance; obtain authentic lockfile or verified supported install route; use reproducible install in both workflows | 2–5 | lockfile integrity/provenance checks; npm ci reproducibility; no install scripts |
| Resolve zizmor findings and run full exact-head workflow/contract validation | 2–4 | exact-head zizmor PASS; YAML and contract tests PASS; no suppressions |
| Recheck governance and fail-closed configuration, review workflow permissions and task templates | 1–3 | ruleset evidence, dispatch remains false during qualification, explicit owner approval boundary |
| Run isolated Resource Probe and first DSH headless smoke on GitHub-hosted ephemeral Linux | 2–4 | runner facts, install footprint, memory/disk/time, exact SHA, run/job IDs, sanitized artifact digest |
| Verify terminal reconciliation, failure handling, cleanup, reports and update acceptance evidence | 3–4 | ready -> claimed -> terminal state, failure -> needs-review, no secrets, independent review |

**Total: 20–37 hours**, rounded to planning estimate **20–35 hours** with overlap between implementation and tests. If DSH's upstream package cannot be installed reproducibly, add 4–10 hours for a supported alternative investigation; do not fabricate a lockfile.

## Separate work after first controlled launch

These are not blockers for the first single-profile smoke launch, but are required for the broader intended platform:

| Follow-on scope | Additional active hours |
|---|---:|
| Qualify scheduling and bounded concurrency, ramping to the account's actual Free-plan concurrency limit | 4–8 |
| Implement reusable profile packaging and qualify the first useful agent task beyond DSH smoke | 8–14 |
| Add agent-browser + Chromium ephemeral profile, allowlist, artifact sanitization and smoke | 5–9 |
| Implement durable checkpoint/resume, leases and safe continuation across six-hour job limits | 8–14 |
| Jarvis authenticated read-only mobile control plane and evidence-backed status | 6–10 |
| Governed model/provider routing, quotas, secret isolation and provenance | 8–14 |
| Additional independent security/operational qualification and load/failure drills | 5–9 |

Indicative additional work: **44–78 hours**, depending on how much is already reusable and whether the runtime choices remain stable. This is a separate estimate, not included in the first-launch figure.

## GitHub Free constraints checked

GitHub's current official documentation states:
- Free plan standard GitHub-hosted runners: 20 concurrent jobs total; macOS maximum 5.
- Standard GitHub-hosted runner jobs in public repositories are free and unlimited in usage.
- GitHub-hosted job execution limit: 6 hours.
- Standard Linux runner reference: 4 vCPU, 16 GB RAM, 14 GB SSD for the listed standard Ubuntu images.

Sources:
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners

These are platform ceilings, not reserved capacity or a guarantee that this repository alone will receive 20 simultaneous jobs. Other repositories under the account share concurrency. No larger/paid runners or paid fallback are assumed.

## Wall-clock expectation

The 20–35 hours are active engineering time, not continuous elapsed time. CI queueing, repeated exact-head runs, upstream package resolution and independent review may add roughly **1–3 working days** of elapsed time. A newly discovered security defect or unavailable upstream artifact can extend this.

## Launch definition and recommendation

Use a two-stage definition:
1. **First controlled launch:** one approved, no-secret, no-model-call task completes on an ephemeral hosted runner with complete evidence and safe terminal reconciliation.
2. **Operational pool launch:** repeatable task intake, concurrency ramp, agent profile qualification, browser isolation, checkpoint/resume, routing and independent security/operational acceptance.

Do not call stage 1 a production-ready 20-agent workforce. Do not enable `POOL_DISPATCH_ENABLED` until all mandatory security and governance gates are accepted. The first smoke must not depend on owner secrets or model provider keys.

## Status

- Estimate: PLANNING / NOT A DELIVERY PROMISE.
- First controlled launch: NOT READY.
- 20-slot profile pool: DESIGN / NOT QUALIFIED.
- Dispatch: keep disabled.
- No runtime was launched in this assessment.
