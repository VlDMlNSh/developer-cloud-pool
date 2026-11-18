# Runner qualification PATH failure and corrective workflow change — 2026-11-18

## Scope and immutable target
- Contour A / PR #116 first CODE executor qualification only.
- PR base: `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Failed qualification target: `6088a5d1e52191004c3228ed4cf6f3b72dabd116`.
- Corrective workflow commit: `fa4e42f4c2d23f4eedd36cf574e87cf361810972`.
- Workflow blob after read-back: `23ca0d9c472486095c2b7b13b27fbb4229190867`.
- PR #116 remains OPEN / DRAFT / UNMERGED.

## Evidence and failure diagnosis
- Runner Qualification run [44278168889](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889), job [134711549798](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889/job/134711549798): COMPLETED / FAILURE.
- The exact-head checkout and all three focused test suites passed: child environment 10/10, task HOME 9/9, release verifier 7/7.
- Anthropic signed APT install and signed release-manifest/binary verification passed.
- Docker `--network none` primitive passed.
- FCC installation and 15/15 single-credential profile tests passed.
- Failure occurred in step “Start FCC on loopback and verify local readiness and shutdown”. The workflow prepended the runner-owned virtualenv `$UV_PROJECT_ENVIRONMENT/bin` to PATH; the new root-owned PATH policy correctly rejected it with `PATH entries must be owned by root`. The FCC process exited before readiness. Synthetic bridge step was skipped.
- Failed-run artifact [14414274574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889/artifacts/14414274574), 30,250 bytes, SHA-256 `7abf25036bed9a9538c105f21ada775d3b3c6e6bf042158e0de082a49779d7b0`.
- Pool Contract Validation [44278168854](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168854): COMPLETED / SUCCESS on failed-test target `6088a5d1e52191004c3228ed4cf6f3b72dabd116`.

## Corrective change applied
- Both FCC runtime and synthetic bridge now set PATH to `/usr/bin:/bin`, avoiding runner-owned virtualenv/mock directories in executable search.
- FCC server remains invoked by its absolute virtualenv path; Python interpreter is resolved through its script shebang.
- Synthetic mock Claude executable is invoked by absolute path, so it does not need to be added to PATH.
- This preserves the root-owned PATH invariant rather than weakening the security policy.
- Corrective commit `fa4e42f4c2d23f4eedd36cf574e87cf361810972` is now the exact PR #116 head. Workflow file was re-read; blob SHA and both corrected command patterns matched.
- No workflow run was returned for the corrective commit by the commit-associated workflow-runs query. Exact-head requalification is therefore NOT RUN / NOT VERIFIED at report time; do not infer success from the source change.

## Safety boundaries
- No GitHub secret values read; no provider calls; no real Claude session/task; no Gemini dispatch; no production dispatch; no merge or deployment.
- Keep `POOL_DISPATCH_ENABLED=false`.
- Docker proof remains a primitive test only. Actual CODE-in-container, provider-specific egress allowlist, host egress isolation, Claude hosted-use entitlement, FCC AGPL-3.0-only network-use review, free provider identity/quota and production A0/D1 remain NOT VERIFIED.
- Issue [#118](https://github.com/VlDMlNSh/developer-cloud-pool/issues/118) remains OPEN/BLOCKED: no active authorized server #3, no verified Cloudflare Access/Tunnel, and no backup/restore evidence.

## Next step
Obtain exact-head Runner Qualification and Pool Contract Validation on `fa4e42f4c2d23f4eedd36cf574e87cf361810972`; inspect all steps and artifact digests. If the runner test passes, proceed to real CODE-worker container integration while preserving no-provider-call and fail-closed gates.

## Canonical references
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Contour A checkpoint](../checkpoints/2026-11-18-contour-a-broad-pass.md)
- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [PR #126](https://github.com/VlDMlNSh/developer-cloud-pool/pull/126)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
