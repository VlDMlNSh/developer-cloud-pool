# Pass 32 current snapshot — 2026-11-20

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Pass 32 implementation branch `feat/pass32-d1-ambiguous-batch-readback-2026-11-20` HEAD: `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a`.
- Parent: Pass 31 HEAD `b90f386814436552f9e4b0c2b54050731cb9859e`.
- PR #157 implementation OPEN/DRAFT/UNMERGED; PR #158 validation-only OPEN/DRAFT/UNMERGED; do not merge.
- Official reuse assessment: Cloudflare `workers-sdk` D1 Vitest fixture and existing `@cloudflare/vitest-plugin@1.4.7` retained; Temporal SDK patterns reviewed only, no dependency added.
- D1 admission pre-read, replay and post-write verification use primary-first sessions. Ambiguous batch acknowledgement triggers primary-first durable tuple readback. Unconfirmed state is never mislabeled rollback.
- Final adapter blob `9943d6dc8ba5602eec48bc9edf121c1db9d189d2`; test blob `4a8184a5fd08fd3bcbb43920aa7a57270d301524`; README blob `08a67c701dc07ee89e2416401bf526bdc68503b1`.
- Final D1 run [44703757450](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703757450): SUCCESS; 4 files / 39 tests passed. Final contract run [44703757544](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703757544): SUCCESS; dispatch false; six workflow YAMLs parsed; security validation PASS.
- Initial failed D1 run 44703493347 was a stale test assertion, corrected; intermediate run 44703595383 passed 39/39.
- Live hosted D1 read replication/network ambiguity NOT VERIFIED. Hosted D1 writes, secrets, provider calls, dispatch, executor, deployment, merge and production writes NOT RUN. Independent review NOT VERIFIED.
- Active ruleset #26550182 unchanged; Gemini controller missing from default; Gemini/Claude NOT RUN.
- Issue #140 OPEN; Issue #151 OPEN/PLANNED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: Pass 33 full SQL/trigger audit; independent review remains outstanding.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
