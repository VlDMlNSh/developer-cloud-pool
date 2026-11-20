# Pass 8 — Contour A safety integration and Jarvis technology leads

Date: 2026-11-19
Default baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
Documentation branch: `docs/next-2026-11-19-integrated-contour-pass`

## 1. Completed safety integration

Merged PR #139 (squash) after source/diff inspection and exact-head CI verification.

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/139
- Base: `68183828cf7934e89109310c8f99281be4eb7ed8`
- Exact PR head: `4b35f949fa9bd0f924582f9eb47008c191c061ee`
- Compare: 6 commits ahead, 0 behind; exactly six files changed.
- Exact-head Pool Contract Validation run `44349941243`: COMPLETED / SUCCESS; job `134962504024`. Steps included workflow syntax, legacy dispatch guard and Pool Contract Validation.
- Merge commit: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

The merged change retires the old label-driven DSH dispatch path: removes Supervisor event triggers and write permissions, makes Supervisor a read-only heartbeat that fails if the legacy dispatch flag is true, turns the old DSH Worker into an inert fail-closed guard, and adds regression assertions. This removes an unsafe legacy route; it does NOT create a replacement live executor or make the pool operational.

## 2. Existing CODE runner qualification evidence

PR #116 was inspected as a current candidate:

- PR head: `2e944f13818f434cf135602c1c0e82051f1d3fa8`.
- Exact-head Runner Qualification run `44286955337`: SUCCESS.
- Exact-head Pool Contract Validation run `44286955360`: SUCCESS.
- The PR reports signed Claude Code distribution provenance, isolated HOME/XDG, synthetic FCC policy tests and a Docker `--network none` capability proof.
- Important limits: the actual CODE executor was not run inside the tested container; FCC-to-Claude was a synthetic mock; provider egress allowlisting, live provider route/account/quota, hosted-use entitlement and persistent worker are NOT VERIFIED. The Docker proof is a sandbox capability test, not proof of the complete executor isolation boundary.
- The FCC guard reports `.fcc` as a configuration directory. It is not the immutable D1 capability/profile identifier.
- Executor IDs recorded by PR #142 (`claude-code-1`, `codex-1`, `gemini-1`) are executor instance identities, not capability profile IDs. Do not conflate these namespaces.

## 3. Jarvis technology leads captured from the owner's spoken summary

The following is a faithful capture of the spoken notes, not an endorsement or implementation decision:

1. A three-part AI platform was described. Its first component sounded like “Open Charger” (exact product spelling/identity uncertain).
2. DeepSeek was said to be connected inside that component.
3. A control/plugin layer was described, including a name transcribed as “QADrive” (exact product and spelling unverified).
4. A separate configuration was described as Hermes Agent/Engine with a component called “Strata”, a model referred to as “Flash Next”, and a Mac-based deployment. Exact model/runtime names need confirmation.
5. A private MCP search/tool service was mentioned (transcribed as “MCP Pro”; exact service identity unverified).
6. The presenter reportedly routed requests through Tor and claimed very low refusal rates. These performance/privacy claims are unverified and must not be repeated as facts.

### Initial technical assessment

- Hermes Agent is a real, documented agent framework. Its official integration documentation describes multiple inference providers, model/provider routing, fallback providers, and MCP tool-server integration. It can therefore be evaluated as an orchestration candidate or a separately sandboxed tool runtime.
- Hermes' flexibility does not by itself provide Cloud Pool's owner-only admission, durable task authority, lease fencing, executor provenance, quota isolation or acceptance evidence. It must not bypass those boundaries.
- Tor is a transport/routing choice, not proof of end-to-end privacy, anonymity, provider confidentiality or policy compliance. A Tor route also introduces availability, latency, egress-governance and abuse-control questions. Do not route Cloud Pool execution through it without a dedicated threat-model and policy review.
- A claim such as “zero refusals” is not a quality or safety metric. Do not optimize the platform for bypassing model safeguards. Evaluate task success, factuality, tool correctness, latency, cost, safe refusal behavior and reproducibility instead.
- Do not mix provider accounts, credentials or quotas. Every route needs explicit provider/account identity, limits, reset semantics, telemetry and fail-closed budget controls.
- Do not replace the already owner-frozen Claude Code + ECC + FCC first executor based only on a spoken demonstration. The new stack is a research candidate, outside the current Contour A critical path until exact names, licenses, provenance, resource needs and no-secret sandbox compatibility are established.

### Verification status of spoken technology leads

| Lead | Status |
|---|---|
| Hermes Agent existence and MCP/provider integrations | VERIFIED from official docs |
| “Open Charger” exact product | NOT VERIFIED |
| “QADrive” exact plugin | NOT VERIFIED |
| “Strata” exact runtime | NOT VERIFIED |
| “Flash Next” exact model ID | NOT VERIFIED |
| “MCP Pro” exact service | NOT VERIFIED |
| Tor route and actual request path in the demonstration | NOT VERIFIED |
| “zero refusals” / “817” performance claim | NOT VERIFIED; benchmark definition absent |

Official Hermes references:
- https://hermes-agent.nousresearch.com/docs/integrations
- https://hermes-agent.nousresearch.com/docs/integrations/providers

## 4. Current integration state and remaining critical path

- PR #143 remains an isolated D1 task/lease proof, not wired to the production Supervisor/Worker.
- PR #140 remains the controlling open issue for current-base D1 admission and lease integration.
- PR #141 records schema conflicts. PR #142 records executor identity/profile separation. PR #144 records the missing owner-authored immutable CODE capability profile.
- PR #116 runner qualification is a useful no-secret starting point, but not a live executor qualification.
- Existing Jarvis web UI prototype from PR #25 is a static/demo shell. Its own UI labels say API is not connected, protected reads are unavailable and mutations are disabled. It is not a working remote console.
- The default-branch `.github/workflows/pool-worker.yml` was found to be the legacy manual DSH worker. PR #139 now retires that path on the default branch. Do not confuse the old worker with the future D1-bound CODE worker.
- The web console must be built as a secure, authenticated experience API + responsive UI. GitHub Pages/static assets alone do not supply a persistent authenticated task API. Hosted D1 and storage must be qualified before any live state is shown.

## 5. Next bounded implementation pass

1. Re-read the post-merge default HEAD and exact PR #140–#144 state.
2. Resolve the immutable CODE capability/profile ID through the owner-authored architecture contract; preserve executor IDs as a separate namespace.
3. Build one clean-base D1 integration branch: canonical PR #67/#72 lineage, lease/attempt guard reconciled as migration 0012, one logical task/outbox authority, approval identity immutability, suspension state, no caller-boolean takeover.
4. Integrate trusted admission and exact replay verification; negative-first tests before any executor call.
5. Qualify the actual CODE executor inside the sandbox, not merely the container primitive. Keep provider credentials absent.
6. Reuse the existing Hono/Jarvis UI prototype only after the backend contract and authentication boundary are explicit; then connect real read-only state.
7. Keep live dispatch, provider calls, hosted production writes and deployment disabled until separately authorized and qualified.

## 6. Safety and status

- PR #139 legacy DSH dispatch retirement: MERGED, exact-head CI verified.
- PR #116 runner qualification: exact-head CI VERIFIED, full CODE runtime NOT QUALIFIED.
- PR #143 D1 ledger: isolated proof VERIFIED, integration NOT VERIFIED.
- Jarvis demonstration technology leads: partially documented; exact product/model names mostly NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No secret values inspected; no provider calls; no dispatch; no hosted D1 writes; no deployment in this pass.

Canonical MediaHub map (out of scope until Contour A acceptance): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
