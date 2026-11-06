# Live governance and dispatch-gate audit — 2026-11-06

## Immutable baseline

- Default branch: `Основной`.
- Default HEAD fetched from GitHub: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Documentation continuation branch HEAD: `f01f2fdb7b9fd6dc5cfa0911d133f68553c8028a`, 50 commits ahead / 0 behind default at audit time.
- Issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1.
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38.

## Live Ruleset read

Fetched the repository Rulesets collection and exact Ruleset ID `26550182` through GitHub GET API.

- Name: `Основной — verified`.
- Enforcement: `active`.
- Scope: exact ref `refs/heads/Основной`.
- Rules: deletion blocked; non-fast-forward blocked; pull request required.
- Required approving review count: **0**.
- CODEOWNERS review: **false**.
- Last-push approval: false.
- Required review-thread resolution: true.
- Bypass actors: empty.
- Current-user bypass: `never`.
- Allowed merge methods: merge, squash, rebase.
- Ruleset update timestamp: `2026-11-04T20:22:47.243+03:00`.

Conclusion: branch deletion/force-push controls are active, but the Ruleset does **not** enforce independent approval. The existence of a pull request requirement is not an independent review gate. This is a material governance blocker.

Classic branch protection status is not substituted for Ruleset state. Issue #1 records a previous `protected:false` classic endpoint; the live Ruleset is the authoritative protection evidence for the configured ref.

## Workflow inventory and Gemini controller boundary

Fetched the default branch `.github/workflows` directory. It contains exactly:
- `dsh-runtime-evaluation.yml`
- `pool-contract-validation.yml`
- `pool-supervisor.yml`
- `pool-worker.yml`
- `runner-resource-probe.yml`

The named `.github/workflows/gemini-batch-dispatch-controller.yml` is absent from this repository's default workflow directory (direct fetch returned 404). Therefore no Gemini controller dispatch was attempted. The project rule remains: Gemini only through the approved controller in its authoritative repository, after its input/secrets/governance gates are verified. Do not infer that controller is present in this repository.

## PR and exact-head CI state

### PR #36 — local D1 proof
- OPEN / DRAFT / UNMERGED.
- Current head: `1e278b1601b8a77131118aa5c627c07d663b0e51`.
- Last code/workflow-tested SHA: `4229d8701f8ee79692619f481cef1d9d9483ff16`.
- D1 workflow run `42276825199`, job `128095160084`: COMPLETED / SUCCESS.
- Pool Contract Validation run `42276825193`, job `128095160288`: COMPLETED / SUCCESS.
- The current head adds only a report outside the D1 workflow's path filter; no fresh D1 run was returned for current report-only head. Do not claim exact-current-head D1 CI.
- Submitted reviews: 0; inline review threads: 0.

### PR #37 — reusable Supervisor/Worker boundary
- OPEN / DRAFT / UNMERGED.
- Exact tested head recorded: `5b45a29ed7869c091741c0037c68bfcd6640de7d`.
- Reusable Pool Worker Boundary Validation run `42280875294`, job `128109201815`: COMPLETED / SUCCESS.
- Pool Contract Validation run `42280875365`, job `128109179508`: COMPLETED / SUCCESS.
- Submitted reviews: 0; inline review threads: 0.
- Independent security review: NOT RUN.

## Dispatch gates

PR #37's recorded exact-head CI read-back states:
- `POOL_DISPATCH_ENABLED=false`.
- `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` empty/unset.

No secret values were read. No gate was modified. No Worker, DSH, Resource Probe, provider/model call, or deployment was run.

## Decision

- Keep Ruleset active, but do not treat it as satisfying independent review.
- Do not merge PR #36 or #37 until independent review and governance are fixed.
- Do not dispatch either workflow or enable either gate.
- The local D1 proof remains non-production.
- Cloudflare account Free/card-free eligibility remains NOT VERIFIED; no live D1/Worker resources exist and no provisioning was performed.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next concrete step

A repository governance change is required to enforce at least one approving review (and preferably CODEOWNERS review) on `Основной`, followed by independent review of PR #36/#37 and exact-head CI on the final commits. Do not change the Ruleset without a separately authorized governance decision.

Canonical context window (working documentation branch, unmerged): https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
