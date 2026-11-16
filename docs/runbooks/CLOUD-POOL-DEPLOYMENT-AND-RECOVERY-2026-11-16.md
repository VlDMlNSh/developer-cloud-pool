# Cloud Pool deployment and recovery runbook

Date: 2026-11-16  
Status: PRE-DEPLOYMENT / DO NOT EXECUTE ENABLEMENT STEPS UNTIL GATES PASS

## 0. Safety invariants
- Default all profiles, routes, workers and dispatch to disabled.
- Never paste secrets into chat, task prompts, GitHub issues, logs or artifacts.
- Never expose provider keys to Claude Code, ECC hooks, arbitrary shell commands or browser workers.
- No paid fallback. Unknown billing/quota is a deny.
- Never export browser cookies or session storage to a worker.
- Never enable Profile B cloud fallback.
- Never expose FCC/OmniRouter admin endpoints publicly.
- Keep Contour B deferred.

## 1. Preflight: repository and governance
1. Confirm target repository and branch.
2. Record immutable default-branch and deployment-manifest SHA.
3. Confirm ruleset, required checks and exact-head CI.
4. Confirm PR provenance and review status.
5. Confirm no unreviewed workflow can read secrets or dispatch workers.
6. Confirm runner/host identity and capability allowlist.

Expected evidence: signed/immutable preflight record with repository ID, target SHA, ruleset ID, workflow run IDs and reviewer.

## 2. Host and runtime inventory
For every authorized host record:
- stable host ID and connection state;
- OS/kernel/architecture;
- CPU/RAM/disk and available GPU/VRAM;
- container runtime and version;
- network egress controls;
- persistent storage and backup behavior;
- agent-browser runtime only if it is an in-pool runtime;
- local model server, model digest and inference runtime;
- separate media runtime and model digest.

Do not infer hardware or runtime availability from a registered host name. If host is offline, stop and mark NOT VERIFIED.

## 3. Build immutable runtime images
- Pin base images by digest.
- Pin Claude Code version and ECC commit/release independently in both profiles.
- Generate SBOM and dependency lockfiles.
- Verify licenses and provenance.
- Run static security scans and image vulnerability checks.
- Do not include provider keys in images, build args, image layers or test fixtures.

## 4. Configure isolated gateways
Profile A:
- Resolve FCC provenance and secret inheritance first, or select a reviewed alternative.
- Run gateway under separate identity/container from Claude Code.
- Inject provider credentials only into gateway process.
- Issue a short-lived per-task gateway token.
- Disable raw request/SSE/prompt logging.
- Bind admin UI to loopback/private network.
- Verify Claude Code child env has no provider-key names or values.

Profile B:
- Verify OmniRouter source/version and Anthropic Messages endpoint semantics.
- Run local model endpoint separately; pin model digest.
- Verify Profile B cannot resolve/reach Profile A gateway or secrets.
- Deny public provider egress; do not configure cloud fallback.
- Treat local inference as unavailable if host/runtime/model check fails.

## 5. Route qualification
For each route independently:
1. Verify provider, account/project and quota domain without reading secret values.
2. Establish free/paid status and model-specific quotas from official account/provider metadata.
3. Verify endpoint, auth mechanism and exact model ID.
4. Run synthetic protocol tests without credentials.
5. After security gates pass, owner-authorized controlled smoke test may be performed.
6. Capture request ID, route ID, model ID, usage/quota delta, response digest and audit event.
7. Disable route if quota, billing, identity or protocol is ambiguous.

No route becomes enabled merely because an environment variable or GitHub secret name exists.

## 6. Control-plane qualification
Synthetic tests must prove:
- duplicate source event produces one task;
- ambiguous dispatch is reconciled before retry;
- expired lease cannot commit;
- stale fencing generation cannot mutate state;
- worker cannot mint capabilities or self-authorize terminal state;
- audit write failure prevents task acceptance/finalization;
- quota reservation is atomic and per quota domain;
- worker termination and cleanup happen after completion/cancellation;
- cross-profile file/network/credential access is denied.

## 7. Browser plane qualification
- Use ChatGPT Agent Browser/TinyFish only for operator-requested browser tasks.
- Select the exact browser profile; do not assume a sign-in exists because a profile name looks familiar.
- For a new sign-in, use the browser's secure setup flow; never request password/OTP in chat.
- Verify only visible website state and task outcome. Do not extract cookies, local storage, auth headers or session tokens.
- A consumer web session is not an API route and does not prove API quota.
- For DeepSeek/Gemini/Alice web UIs, keep tasks to user-authorized navigation and non-sensitive test prompts. Do not submit project secrets or private source code.

## 8. Release sequence
1. Pool Bridge synthetic admission + durable ledger.
2. Authenticated responsive UI.
3. Profile B local-only tests.
4. Profile A gateway isolation tests.
5. One provider route at a time.
6. On-demand worker integration.
7. Independent security/governance review.
8. Independent Contour A acceptance.

No parallel rollout of all providers.

## 9. Rollback
- Stop admission; do not delete audit/state.
- Revoke task-scoped gateway tokens and worker capabilities.
- Drain/cancel workers and verify process termination.
- Disable affected route and preserve redacted evidence.
- Restore last known-good immutable runtime image and config.
- Reconcile leases and reservations before reopening admission.
- Record incident, affected target SHA, route and account aliases (never key values).

## 10. New-chat /next restore
Start with:
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Latest dated checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/tree/docs/cross-chat-continuation-2026-11-06/docs/checkpoints
- Reference architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/CLOUD-POOL-DEPLOYABLE-REFERENCE-ARCHITECTURE-2026-11-16.md
- Deployment manifest: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/config/deployment/cloud-pool-deployment-manifest.v1.json
- This runbook: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/runbooks/CLOUD-POOL-DEPLOYMENT-AND-RECOVERY-2026-11-16.md

Then revalidate refs, SHA, PR, issues, ruleset and CI. Continue only from the next open gate in the Context Window. Treat all stale facts as NOT VERIFIED until refreshed.
