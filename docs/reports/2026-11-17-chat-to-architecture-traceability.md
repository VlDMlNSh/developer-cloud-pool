# Chat-to-architecture traceability — Cloud Development Pool — 2026-11-17

**Scope:** decisions and operating constraints expressed in the 2026-11-16/17 Cloud Pool architecture chat.
**Status:** documented in PR #120 candidate branch; NOT merged to default branch; NOT deployed; Contour A NOT ACCEPTED.

| Chat requirement / decision | Normative location | Disposition |
|---|---|---|
| Cloud Pool Contour A first; no MediaHub OS Contour B before acceptance | Reference Architecture §§1–2, 17, 21.7 | PRESENT / binding |
| One Jarvis interface for phone and desktop | §§1, 3, 21.1–21.2 | PRESENT |
| First delivery GitHub-only, free, static/read-only PWA; no secrets in browser | §21.1; Issue #22 | PRESENT / launch boundary |
| Later authenticated server-side API; UI never grants authority | §§3, 8, 21.1–21.2 | PRESENT / not deployed |
| Persistent Engineering Workspace, distinct from ephemeral Actions runners | §§1, 10, 21.2 | PRESENT / BLOCKED |
| Workspace mandatory before Contour A acceptance, but not required for first static PWA milestone | §§17, 21.1–21.4; ADR-0015 | PRESENT / corrected in this pass |
| Official VS Code Desktop + Remote SSH, verified host key, no public SSH | §21.3 | PRESENT / not qualified |
| Browser code-server + Open VSX, auth on, loopback behind qualified ingress | §21.3 | PRESENT / not deployed |
| Browser and desktop use same persistent filesystem | §21.3 | PRESENT / acceptance gate |
| Per-task branch/worktree; no concurrent shared mutable checkout | §21.4 | PRESENT |
| Single-writer lease, heartbeat, expiry, monotonic fencing and stale writer rejection | §§6, 21.4 | PRESENT / production gate |
| Cloudflare Access/Tunnel only after zone, IdP, policy, JWT, WebSocket, free-tier and recovery qualification | §§10, 21.3 | PRESENT / BLOCKED |
| VS Code Remote Tunnels is a distinct trust path, not Cloudflare Tunnel | §21.3 | PRESENT |
| Claude Code + ECC + FCC as first CODE profile, pinned source/versions | §21.5; Issue #115; PR #116 | PRESENT / install + loopback + mock proof only |
| Claude Code on server #3 only after exact host/capability/free route/security qualification | §§10, 21.5; Issue #118 | PRESENT / NOT AUTHORIZED, BLOCKED |
| Gemini only through approved controller, never direct IDE/terminal; optional not mandatory each /next | §21.6; Issues #94/#96 | PRESENT / dispatch NOT RUN |
| Four Gemini credential slots do not prove four accounts/quotas; isolate identity/quota, no silent failover | §21.6; quota/route contracts | PRESENT |
| Copilot optional and free entitlement/spend-control gated | §21.5 and executor profile matrix | PRESENT / not enabled |
| No paid fallback; no unverified free-tier assumption | §§2, 8, 14, ADR-014 | PRESENT |
| Separate Jarvis, ASTRA A0, provider issuer and MediaHub Product State Authority | §§2–4, 21.7 | PRESENT |
| Durable state, audit, secret isolation, backup/restore and independent acceptance | §§8–9, 17, 21.4 | PRESENT / not qualified |
| No claims of live provider route, deployment or acceptance without evidence | §§17–18, 21.7 | PRESENT |

## Evidence read during this audit

- PR #120: OPEN/DRAFT/UNMERGED; current head at start of this traceability pass: 9fd572398afe2ceb438edb959fd0b6cb52de2752.
- Exact-head documentation validation and Pool Contract Validation were queued at that head (runs 44087404561 and 44087404593); results pending at time of writing.
- Earlier exact-head PR #120 CI at f016247a9886df904042000a26f17beabfbb8727: Architecture Documentation Validation run 44087131961 SUCCESS; Pool Contract Validation run 44087131986 SUCCESS. Newer commits require their own exact-head checks.
- PR #116 current head observed: 6d4a4c518d44aa4a79d8396390623f424499011a; install/runtime/mock proof is not a real Claude provider route or task session.
- Issue #117 CLOSED; Issue #115 OPEN; Issue #118 OPEN/BLOCKED; Issues #22 and #26 OPEN.
- Default branch Основной remains at 35208f0ef28f0ac031a7acdf35fc90ccc9b16845 at last read. PR #120 remains unmerged.

## Gaps — explicitly not lost, but not yet completed

1. Real free provider/account/quota route and production Claude task execution: NOT VERIFIED (Issue #115).
2. Hosted A0/D1 authority, durable lease/recovery and end-to-end supervisor path: NOT QUALIFIED.
3. Persistent Workspace host #3, identity/ingress, storage, backup/restore and browser/desktop same-filesystem test: BLOCKED (Issue #118).
4. Authenticated Jarvis live API: NOT DEPLOYED; first static PWA is a separate read-only milestone.
5. Independent architecture/security review and default-branch merge of PR #120: NOT DONE.
6. Default branch governance currently has zero required approving reviews and no required status-check contexts; ruleset details beyond the visible ruleset remain NOT VERIFIED.

## Conclusion

No chat-specific target requirement in the table was found missing from the consolidated architecture. One ambiguity was found and corrected: Workspace is a later staged capability but mandatory for final Contour A acceptance, not optional for the completed pool. The candidate branch is the only location containing these current amendments until PR #120 is independently reviewed and merged. No deployment, provider call, secret read, Gemini dispatch or Contour A acceptance occurred.

## Historical artifact preservation check

The PR #120 candidate branch also contains the earlier chat-session Engineering Workspace report, PR #116 independent mock bridge review report, runner checkpoint, owner architecture freeze and Workspace integration record. The detailed implementation roadmap has been copied into this candidate branch with a supersession notice pointing to the single normative reference architecture. These records remain available as evidence; they are not silently dropped when PR #120 becomes the consolidated architecture candidate.
