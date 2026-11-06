# Developer Cloud Pool

An independent project for a governed, cloud-first agent platform and Jarvis runtime.

## Current status
- Repository: public.
- 20-slot GitHub-hosted execution architecture: DESIGN.
- GitHub Pool Supervisor and task queue: IMPLEMENTED SCAFFOLD, NOT RUN.
- Pool Worker: IMPLEMENTED for one DSH headless smoke profile only, NOT RUN.
- Scheduled/event-driven wake-up: IMPLEMENTED, NOT VERIFIED; dispatch fail-closed until branch governance is enabled and POOL_DISPATCH_ENABLED=true.
- General-purpose agent execution, checkpoint/resume and automatic task continuation: NOT IMPLEMENTED.
- DeepSeek Harness: selected as candidate task runtime; developer-preview evaluation only.
- DSH headless evaluation: NOT RUN.
- Baseline runner resource probe: IMPLEMENTED, NOT RUN.
- Cloud runtime deployment and profile qualification: NOT RUN.
- Only current local hardware: Mac mini Server 2011, 4 CPU cores, 16 GB RAM, Linux; not yet inventoried.
- Mac mini 2018 and remote GPU server: FUTURE equipment, design only.
- No local deployment is in scope until the cloud-first pool is qualified.

## Architecture
- [20-slot cloud architecture](docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Jarvis hybrid platform reference architecture](docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [DeepSeek Harness adoption and cloud-first build plan](docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md)
- [GitHub Pool Supervisor and recovery architecture](docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)

## Cloud pool control
1. Create a [Cloud Pool Task issue](https://github.com/VlDMlNSh/developer-cloud-pool/issues/new?template=pool-task.yml).
2. Specify an exact 40-character target commit SHA.
3. First enable default-branch governance, then set the repository variable `POOL_DISPATCH_ENABLED=true`.
4. Review the task and apply the `pool:ready` label to approve dispatch.
5. The supervisor claims and dispatches only the currently allowlisted DSH headless probe.
6. Worker completion wakes the supervisor; a five-minute scheduled reconciliation is the fallback.

The supervisor is event-driven and best-effort, not a continuously running daemon. GitHub may delay or drop scheduled events under high load. Dispatch is currently disabled by default because the default branch has not yet been protected. Hosted jobs are ephemeral and subject to a six-hour maximum; general checkpoint/resume is still pending.

## First cloud evaluations
- [Runner Resource Probe](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/runner-resource-probe.yml)
- [DeepSeek Harness Runtime Evaluation](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/dsh-runtime-evaluation.yml)
- [Pool Supervisor](https://github.com/VlDMlNSh/developer-cloud-pool/actions/workflows/pool-supervisor.yml)

The baseline probes require no provider secrets and make no model calls. A passing smoke test is not security qualification.

## Security
- Worker profiles are allowlisted; issue text cannot provide shell commands or arbitrary workflow names.
- Worker execution receives read-only repository permissions and no provider keys.
- The issue-report job has issue-write permission but does not execute DSH.
- Supervisor uses a short-lived job-scoped GITHUB_TOKEN with only the required repository permissions.
- Never print API keys, private keys, tokens or authorization headers. Logs may contain non-secret credential identifiers only.
- DSH is in developer preview and has not undergone a security audit.
- Do not run untrusted public pull-request code on persistent local machines.
- Cross-repository dispatch is deferred until GitHub App allowlisting and scoped credentials are implemented.
- GitHub-hosted runner location and data residency are managed by GitHub; this design does not promise a selected execution country.

## Latest engineering report
- [Cross-chat continuation checkpoint — 2026-11-06](docs/checkpoints/2026-11-06-cross-chat-continuation.md)
- [Cross-chat continuation report — 2026-11-06](docs/reports/2026-11-06-cross-chat-continuation-report.md)
- [DeepSeek Harness evaluation and cloud-first bootstrap — 2026-11-04](docs/reports/2026-11-04-deepseek-harness-cloud-first-bootstrap.md)
- [Pool Supervisor implementation — 2026-11-04](docs/reports/2026-11-04-pool-supervisor-implementation.md)
