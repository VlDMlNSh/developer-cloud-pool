# A0 issuer governance correction and Cloud Pool reconciliation crosswalk — 2026-11-08

**Disposition: PRIOR REPORT CORRECTED / GOVERNANCE TARGET ALREADY SELECTED / NORMATIVE CONTRACT STILL DRAFT / RUNTIME AUTHORITY NOT IMPLEMENTED.**

## 1. Why this correction is necessary

The preceding Cloud Pool report `2026-11-08-issuer-capability-contract-source-review.md` correctly identified that PR #51 contains no issuer/capability proof, but its conclusion that the governance-owned contract decision was still outstanding was incomplete. A read of the full MediaHub Issue #301 comment history and the stacked Wave 486–528 artifacts found that owner-directed target decisions and a technology-neutral contract candidate already exist.

This report supersedes only that incomplete conclusion. It does not change Cloud Pool runtime state, accept the MediaHub draft contract, or authorize a reconciliation resolver.

## 2. Existing MediaHub decisions and exact source state

### Wave 486 — owner-directed governance disposition
- [PR #599](https://github.com/VlDMlNSh/mediahub-os/pull/599): OPEN / DRAFT / UNMERGED; head `824bb2568b2ac8bb3dceb3608366668e99bab95e`; base Wave 485 head `37254c9f4ff09c39943f6924534a63dd44b5a431`.
- Decision artifact: [Wave 486 governance disposition](https://github.com/VlDMlNSh/mediahub-os/blob/docs/wave486-a0-owner-directed-governance-disposition-20261030/docs/architecture/MEDIAHUB-A0-ISSUER-GOVERNANCE-DISPOSITION-WAVE-486-2026-10-30.md), blob `13e6745463dbc05a7c188423bb45ffb2b210c789`.
- Selected target: WB-05 Option A — separately governed Security Issuer Authority, separate from Jarvis and ASTRA A0.
- Preserved DEC-DEV-02 Option C: Jarvis coordinates missions; Security Issuer Authority governs issuance; A0 owns its internal queue/lease/retry/cancel/recovery; protected consumers independently verify; MediaHub Product State Authority alone owns canonical product-state mutation.
- Initial target defaults: capability lifetime ≤300 seconds; revocation state ≤30 seconds old; 365-day security evidence and 90-day operational metadata targets, subject to privacy/legal approval.
- Status is explicitly OWNER-DIRECTED TARGET DECISIONS SELECTED / NORMATIVE ACCEPTANCE PENDING / RUNTIME BLOCKED. This is not a deployed issuer or staffed operational team.

### Wave 487 — format-neutral normative candidate, amended Wave 524
- [PR #600](https://github.com/VlDMlNSh/mediahub-os/pull/600): OPEN / DRAFT / UNMERGED; current head `05a873e82760d63c8b26dc496b43d3309f4cfbf9`; base `824bb2568b2ac8bb3dceb3608366668e99bab95e`.
- [Normative contract candidate](https://github.com/VlDMlNSh/mediahub-os/blob/docs/wave487-a0-issuer-verifier-normative-contract-20261030/docs/architecture/MEDIAHUB-A0-ISSUER-VERIFIER-CONTRACT-WAVE-487-2026-10-30.md), blob `1200d343139c8e67a826902b3ade09d4987c537d`.
- [Wave 524 requester-provenance clarification](https://github.com/VlDMlNSh/mediahub-os/blob/05a873e82760d63c8b26dc496b43d3309f4cfbf9/docs/checkpoints/MEDIAHUB-A0-REQUESTER-PROVENANCE-CLARIFICATION-WAVE-524-2026-11-02.md), blob `adc77565e502dd47ccdfa93c96cb237fcc073f5e`.
- The amended contract binds original requester identity/generation, workload authentication context, mission authorization, required approval-evidence disposition, task/correlation/request digest, durable receipt and sanitized audit evidence.
- Acceptance matrix defines AUTH-01…21, IDEM-01…06, LIFE-01…06, AUD-01…05 and VER-01…05.
- The contract remains DRAFT NORMATIVE CANDIDATE / NOT ACCEPTED / NOT IMPLEMENTED. It deliberately leaves concrete identity protocol, wire format, algorithm, trust-anchor product, key rotation, clock-skew tolerance, database/queue, audit sink, endpoint and operational staffing to a separate ADR.

### Wave 528 — ADR preflight already recorded
A bounded preflight comment on PR #600 records the recommended phase-1 direction:
- GitHub Actions OIDC as a short-lived workload-authentication input for GitHub-hosted workers, with strict issuer/audience/subject/repository/workflow/ref allowlists; not requester identity, mission approval or capability.
- JWS as the pragmatic cloud/API proof candidate; COSE remains an alternative, not a second simultaneous v1 format.
- RFC 8785 JCS for immutable semantic request digest after strict I-JSON and duplicate-property rejection; JCS does not replace JWS signature verification.
- Exact algorithm remains subject to a documented KMS/HSM interoperability/security review.
- Non-exportable asymmetric signing keys in a managed KMS/HSM boundary; OpenBao Transit is a candidate adapter, not selected/qualified.
- PostgreSQL as the Baseline 2.0-aligned authoritative principal/receipt/idempotency/revocation/lease store candidate; NATS/JetStream only at-least-once transport, never State Authority.
- Separate tamper-evident audit sink with least-privilege/audited access; R-06 operations, retention approval and concrete sink remain unresolved.
- The 300-second/30-second defaults remain; clock-skew tolerance must be measured and fixed in the ADR.

This is a recommendation/preflight comment, not an accepted ADR or formal A3 review. It is not an invitation to re-ask the already selected WB-05 Option A or DEC-DEV-02 Option C.

## 3. Remaining governance and qualification blockers

The decision target exists, but the following remain open:
1. Independent A3 review of the exact amended Wave 487 contract and Wave 486 parent decision.
2. Separate identity/protocol/trust/audit ADR with threat model, interoperability and operational review.
3. Concrete accountable Security Audit and Privacy/Data Governance operational owners; the draft defines functions but assigns no actual team.
4. Legal/privacy approval or replacement of 365-day / 90-day retention targets.
5. Selection and qualification of actual KMS/HSM, identity source, audit sink, revocation distribution and durable store.
6. Canonical machine-readable schemas and strict parser/canonicalization profile; Draft 2020-12 meta-validation with format assertions and positive/negative fixtures.
7. Executable AUTH/IDEM/LIFE/AUD/VER test suite and source proof that every protected consumer verifies independently.
8. Exact-head CI and independent review evidence. Current PR #600 exact-head workflow lookup returned zero runs; formal review submissions = 0; inline review threads = 0. Thus CI and A3 review are NOT VERIFIED.
9. Issue #301 also retains runner/workspace/network target manifest and other Contour A gates.

## 4. Crosswalk: PR #51 reconciliation queue vs Wave 487 contract

Cloud Pool immutable target:
- [PR #51](https://github.com/VlDMlNSh/developer-cloud-pool/pull/51), head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`, base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- Migration 0005 blob `7a19897f6197c79517170e101e4cbf1db233cac6`.
- Adapter blob `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`.

| Wave 487 requirement | PR #51 current evidence | Gap / disposition |
|---|---|---|
| Security Issuer Authority / trusted issuer and key version | No issuer or key claim in reconciliation row or adapter | NOT IMPLEMENTED; do not infer from worker ID or GitHub run |
| Authenticated requester identity/generation and mission authorization | No requester, workload-authentication context or mission-decision reference | NOT IMPLEMENTED |
| Subject, audience, operation, resource, task binding and constraints | Row contains task key and attempt ID only | NOT IMPLEMENTED; task/attempt linkage is not authorization |
| Immutable request digest | Row contains input digest; adapter also stores execution idempotency key | Partial integrity/idempotency data only; not issuer-authenticated proof or full requester provenance |
| Capability lifetime, 300s maximum and revocation freshness ≤30s | No capability expiry, revocation reference/generation or freshness check | NOT IMPLEMENTED |
| Per-consumer verification | No verifier call or policy decision in migration/adapter | NOT IMPLEMENTED |
| Durable A0 acceptance receipt | Queue row is created after an attempt becomes indeterminate; it is not an ingress acceptance receipt | Different lifecycle boundary; NOT IMPLEMENTED |
| Idempotency and replay | Attempt identity conflict checks and terminal projection replay exist; queue is unique by attempt | Useful local ledger safeguards, but not the contract's issuer-bound ingress receipt or cross-request requester replay defense |
| Lease generation/fencing | Queue captures current lease generation; adapter validates owner/generation/current attempt and expiry in relevant writes | PARTIAL local fencing evidence; not bound to capability/revocation/authority epoch |
| Revocation/cancellation/recovery race | Queue is pending-only; no resolver or authority transition | NOT IMPLEMENTED |
| R-06 audit | Existing attempt event digests/provenance fields are not the required issuer/requester/policy/revocation audit stream | NOT IMPLEMENTED as Wave 487 R-06 |
| Independent acceptance / source provenance | Exact-head CI exists for PR #51, but no formal reviews | CI SUCCESS; independent review NOT RUN |

**Important boundary:** PR #51's own migration comment says the queue does not authorize retries or terminal decisions. Its `dispatch: false` behavior remains correct. It should not be retrofitted with invented issuer fields until the Wave 487 contract and separate ADR have passed their gates.

## 5. Exact verification state

### Cloud Pool
- Default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation branch `docs/github-context-window-2026-11-06`: unmerged/noncanonical.
- PR #25, #51 and #52 remain OPEN / DRAFT / UNMERGED.
- PR #51 exact-head Actions run [42495716401](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495716401): COMPLETED / SUCCESS on exact head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`.
- PR #52 exact-head run [42507524428](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42507524428): COMPLETED / SUCCESS on exact head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.
- PR #51 and #52 formal review submissions = 0. Independent review NOT RUN.
- Ruleset 26550182 is active but requires zero approvals; it does not enforce independent review.
- Gemini controller `.github/workflows/gemini-batch-dispatch-controller.yml` is absent from default branch. Gemini dispatch NOT RUN.
- No secret values accessed, no provider/model calls, remote Cloudflare operation, deployment or merge.

### MediaHub authority sources
- PR #599 OPEN / DRAFT / UNMERGED; PR #600 OPEN / DRAFT / UNMERGED.
- PR #600 exact-head CI lookup: zero runs; formal review submissions 0; review threads 0. A source-preflight issue comment is not a formal review.
- Wave 486 decisions are selected owner-directed targets, but normative acceptance remains pending.
- Wave 487 contract and Wave 528 ADR direction remain draft/preflight only.
- Issue #301 OPEN.

## 6. Corrected next step

Do not create another generic governance matrix or ask the owner to reselect Wave 486 decisions. The next bounded engineering step is to create a separate, source-pinned **A0 Identity / Protocol / Trust / Audit ADR candidate** on a child documentation branch based on current PR #600 head `05a873e82760d63c8b26dc496b43d3309f4cfbf9`, reusing the Wave 528 preflight recommendations and preserving the unresolved R-06 owner/retention and KMS/audit qualification blockers. Then independently review the ADR + amended contract before schema/protocol implementation.

For Cloud Pool PR #51, keep the pending-only queue and `dispatch: false`; do not implement a resolver, retry, lease release, terminalization or provider dispatch. Only after the issuer/verifier contract and ADR are accepted may a separate proof-of-fit bind the Cloud Pool task/attempt to the approved authority envelope.

## Canonical references
- Cloud Pool Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Cloud Pool checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/checkpoints/2026-11-06-cloud-pool-next-checkpoint.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
