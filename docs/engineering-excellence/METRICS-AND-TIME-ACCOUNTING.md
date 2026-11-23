# Engineering Metrics and Time Accounting

- Status: **METRIC DEFINITIONS APPROVED FOR PILOT; COLLECTION NOT IMPLEMENTED**
- Baseline date: 2026-11-23.
- Do not fabricate historical values. Start a measured baseline only when timestamps/evidence are available.

## Metric catalogue

| Metric | Definition | Unit | Interpretation / guardrail |
|---|---|---:|---|
| Pass throughput | Passes closed as VERIFIED in a reporting period | passes/week | Never count planned, blocked or documentation-only as code delivery |
| First-pass CI success | Eligible changed-head validation runs passing on first attempt / eligible changed-head runs | % | Report workflow families separately; exclude stale SHA runs |
| Regression rate | Verified regressions attributable to previously changed behavior / verified changes | % | Record severity and detection stage |
| Blocker age | Current UTC minus first evidenced blocked timestamp | hours/days | Pause/resume intervals separately |
| CI latency | Workflow start to completion for the exact relevant run | minutes | Separate queue time from execution time |
| Rework effort | Active engineering time spent correcting a previously attempted change | hours | Do not count passive CI waiting |
| Evidence coverage | Required acceptance evidence items verified / required evidence items applicable | % | Missing evidence is not a zero-risk result |
| Critical-path remaining effort | Sum of active effort ranges along the current dependency chain | hours (range) | Not calendar duration; update after scope changes |
| Change lead time | First accepted task/PR start to verified result | hours/days | Define start/end events consistently |
| Recovery time | Detection of a failed workflow/change to verified recovery | hours | Track only observed incidents |

Use DORA delivery metrics as conceptual reference, but do not transplant deployment frequency or production change-failure rate into a pre-production pool where no production deployment exists. For naming/units, prefer OpenTelemetry semantic conventions when telemetry is introduced.

## Time ledger

For every pass, record separate buckets:

- Active implementation/research/review time.
- Test execution time.
- CI queue time.
- CI execution time.
- External wait / owner approval / provider response.
- Rework time.
- Blocked time.

Only active work contributes to active engineering hours. Calendar elapsed time includes waits and overlaps. Concurrent agent work is recorded per agent and must not be summed as a single person's active time.

Each observation needs source, timestamp, measured/estimated flag, confidence and interval. Historical estimates without source evidence remain **UNVERIFIED ESTIMATE**.

## Forecasting rules

- Forecast remaining effort by decomposing open acceptance criteria into bounded tasks and estimate ranges.
- Keep optimistic / most-likely / pessimistic estimates; state assumptions and confidence.
- Use historical throughput only after enough comparable verified passes exist.
- For parallel tasks, calculate calendar time from the dependency graph's critical path, not the sum of all task hours.
- Add explicit uncertainty for unknown provider/free-tier status, external reviews, hosted infrastructure and runtime qualification.
- Reforecast when a HIGH/CRITICAL finding appears; never reduce remaining time mechanically because a pass was completed.

## Reporting cadence

At each pass closeout, append one row to the pass report and update the Context Window summary:

`pass_id | active_hours | test_hours | ci_queue | ci_runtime | external_wait | rework_hours | status | target_sha`

Do not claim an automated dashboard exists until a real source, collector, persistence path, calculation and validation test are implemented.

## Privacy and cardinality

Do not put secrets, key identifiers, user personal data, full prompts or raw artifact contents into metric labels. Use opaque task/run references, bounded enumerations and redacted structured events. Metrics are not an audit log; retain immutable evidence separately.
