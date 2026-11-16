# FCC without the Admin UI: GitHub Secrets integration assessment — 2026-11-16

Status: SOURCE-VERIFIED DESIGN / RUNTIME NOT VERIFIED. This report records a source-level assessment only. No FCC installation, process launch, provider call, credential access, workflow dispatch, or deployment was performed.

## Decision

**Yes: FCC can be configured without using its standard Admin UI, and provider API keys can be supplied from GitHub Actions Secrets as process environment variables.** The inspected FCC source uses Pydantic Settings with environment-variable support. Its provider credentials are explicit settings fields with environment aliases, and the configuration loader also supports an optional `FCC_ENV_FILE`.

This does not mean the current Cloud Pool is already integrated or secure enough to dispatch. A production-safe design still needs a secret-isolation boundary between the FCC process and the Claude Code agent process.

## Immutable source reviewed

Repository: https://github.com/Factix/fcc
Observed source commit: `8ae7795961f05f425bd3e7418f85f2ccec7f4600`
Default branch at review: `main`

Reviewed files:
- `.env.example` blob `8f830f1fea3f74de81976dcd555741fd73e63bba`
- `config/settings.py` blob `f11555790aa6c859333949f511d04fd5052b4a92`
- `cli/entrypoints.py` blob `2da2ed31f4bef7756036faee10324724eb4e576f`
- `pyproject.toml` blob `0e823c5ebec237644cfcd7ea9cc29a5e909e4443`
- `README.md` blob `7e72ee4efcbf98155b523b2fe97b57207d746aa3`

## Source evidence

1. `config/settings.py` defines provider credentials as Pydantic Settings fields with environment aliases, including `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`, `CODESTRAL_API_KEY`, `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, `WAFER_API_KEY`, `OPENCODE_API_KEY`, `ZAI_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, and NVIDIA NIM credentials.
2. The same settings class loads dotenv files from `.env`, FCC's managed config path, and the optional path named by `FCC_ENV_FILE`. Pydantic Settings also reads the process environment. Therefore a worker can provide keys as environment variables without creating or editing an FCC-managed dotenv file.
3. `cli/entrypoints.py` starts the server using `get_settings()`; its automatic browser-opening behavior is controlled by `FCC_OPEN_BROWSER`. Set this to `false`/ `0` in headless execution.
4. `fcc-init` merely scaffolds `~/.fcc/.env`; it is not required when configuration is supplied by the process environment.
5. README explicitly recommends the Admin UI for normal managed configuration and describes it as loopback/local-only. This is a documented workflow recommendation, not a technical requirement for environment-based configuration.
6. `.env.example` lists provider keys and model-routing settings, and explicitly labels itself a read-only reference. It also documents that request/response trace logs can include conversation text; raw API/SSE/CLI diagnostics should remain disabled.

## Recommended Cloud Pool design

- GitHub Secrets remain the source of credential material. Store only non-secret references, provider account references, quota-domain identifiers, model IDs and billing classification in version-controlled manifests.
- A trusted, short-lived worker receives only the selected provider secret(s) at runtime. Do not inject the entire provider inventory into every task.
- Supply settings as process environment variables; do not write API keys to Git-tracked files, artifacts, caches, task envelopes, prompts, browser state or logs. Avoid creating persistent `~/.fcc/.env` files.
- Set `FCC_OPEN_BROWSER=false`; keep the Admin UI unused and unreachable. Bind FCC only to loopback/private networking, and do not publish its Admin UI.
- Keep `LOG_RAW_API_PAYLOADS=false`, `LOG_RAW_SSE_EVENTS=false`, `LOG_RAW_CLI_DIAGNOSTICS=false`, `LOG_API_ERROR_TRACEBACKS=false`, `LOG_MESSAGING_ERROR_DETAILS=false`; never enable verbose raw transport logging in production.
- Do not use `secrets: inherit`. Use narrowly scoped job permissions, protected environments where appropriate, pinned third-party Actions, and no secrets for fork-originated or untrusted pull-request code.
- Do not pass provider keys to Gemini/Claude Code agents, task envelopes, or child agent processes.

## Critical isolation finding

The inspected `cli/entrypoints.py` implementation of `_claude_child_env()` starts with a copy of the base process environment, removes only variables beginning with `ANTHROPIC_`, then adds the local FCC endpoint and proxy auth token. Consequently, if `fcc-claude` is launched in a process environment containing provider keys, those provider-key variables are inherited by the Claude Code child process.

**Therefore do not launch `fcc-claude` from the same environment that contains provider API keys unless this inheritance behavior is corrected and regression-tested.** Preferred options:
1. Run FCC in a separate, narrowly privileged process/container/security boundary that owns provider credentials; run Claude Code in a separate process identity with only the FCC endpoint and proxy auth token.
2. Alternatively, maintain a small reviewed launcher patch that constructs an allowlisted child environment and explicitly removes every provider credential variable; add tests proving no provider secret reaches Claude Code. This is weaker than a separate security boundary if both processes share the same OS identity and can inspect one another.
3. Never give the coding agent access to the Docker socket, FCC process control, host process inspection, or the environment-bearing runner context.

GitHub-hosted Actions jobs are ephemeral, but steps in one job share a runner trust boundary. A malicious or compromised agent executing arbitrary shell commands in the same job can potentially inspect same-user processes or other job state. Secret masking in logs is not a security boundary. Thus merely placing the key in GitHub Secrets does not by itself isolate it from untrusted code in that job.

## Security and operational constraints

- A GitHub Secret is injected into a workflow job only when explicitly referenced; FCC does not directly fetch GitHub Secrets itself.
- Keep the provider key in the FCC-side runtime only. Claude Code should receive only the local/private FCC endpoint and a separate, short-lived proxy authentication token.
- If using `FCC_ENV_FILE`, the file must be created at runtime with restrictive permissions, never uploaded/cached, and securely removed; process environment is preferred when feasible.
- No secret values may be printed, serialized into task JSON, attached to artifacts, or included in debug traces.
- Each credential remains tied to its own provider account and quota domain. No automatic paid fallback; quota admission remains Pool Bridge's responsibility.
- The provider account/quota identity and current free entitlement must be qualified independently; presence of a GitHub Secret is not proof that the key is valid or free.
- The current FCC source still has a provenance mismatch in README install links versus the inspected repository identity. Pinning a release/source digest and confirming canonical upstream lineage remain required before deployment.

## Verification status

- Source inspection: VERIFIED for the immutable files listed above.
- Environment-variable configuration path: SOURCE-VERIFIED.
- Admin UI bypass at runtime: NOT VERIFIED (no process launched).
- Secret non-persistence, log redaction, container isolation, and Claude Code child-environment scrubbing: NOT VERIFIED.
- Provider connectivity, quotas, tool-use compatibility, and live coding task: NOT RUN.
- FCC qualification: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded engineering pass

Review the exact FCC config lifecycle and server bind/auth behavior, then design a no-secret synthetic test that proves: environment values override dotenv defaults; Admin UI auto-open is disabled; no key is written to disk/logs/artifacts; and the Claude Code child environment contains no provider credential names or values. Only after the isolation design passes should a single explicitly authorized provider route be qualified.

## Sources

- FCC source at reviewed commit: https://github.com/Factix/fcc/tree/8ae7795961f05f425bd3e7418f85f2ccec7f4600
- Settings: https://github.com/Factix/fcc/blob/8ae7795961f05f425bd3e7418f85f2ccec7f4600/config/settings.py
- CLI entrypoints: https://github.com/Factix/fcc/blob/8ae7795961f05f425bd3e7418f85f2ccec7f4600/cli/entrypoints.py
- Environment template: https://github.com/Factix/fcc/blob/8ae7795961f05f425bd3e7418f85f2ccec7f4600/.env.example
- FCC README: https://github.com/Factix/fcc/blob/8ae7795961f05f425bd3e7418f85f2ccec7f4600/README.md
- Cloud Pool FCC compatibility matrix: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/FCC-PROVIDER-COMPATIBILITY-MATRIX-2026-11-16.md
- Cloud Pool target architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/CLOUD-POOL-TARGET-ARCHITECTURE-2.0.md
