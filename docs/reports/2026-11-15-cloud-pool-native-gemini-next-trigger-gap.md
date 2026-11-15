# Cloud Pool-native Gemini /next trigger gap — 2026-11-15

## Status

The previous fixed-roster proposal has been rejected. PR #89 is CLOSED / UNMERGED. No fixed worker count or named role topology is approved.

The immediate requirement is exactly three supplementary Gemini executions per explicit ChatGPT `/next`, but the current Cloud Pool default branch does not yet contain a trusted trigger/dispatch integration.

## Immutable source observations

- Cloud Pool default branch: `Основной`, observed HEAD `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Pool Supervisor blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`. Triggers are schedule, workflow_dispatch, issues opened/reopened/labeled and Pool Worker workflow_run. No issue_comment trigger exists.
- Pool Worker blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`. Only the `dsh-headless-probe` profile is allowlisted; it makes no provider/model call and does not implement Gemini.
- Cloud Pool `.github/workflows/gemini-batch-dispatch-controller.yml` on `Основной`: NOT FOUND.
- MediaHub controller on `main`, blob `7799f0fc713c5bd772ce6820df40a926a83445c8`, is a separate repository's controller. It accepts OWNER-authored `/next` only on MediaHub Issue #301 and dispatches three fixed MediaHub workflows using `github.repository`. It is not a Cloud Pool-native controller and must not be treated as one.
- MediaHub controller's `/probe` and `/next` paths are distinct. A `/probe` comment is non-launching; it does not qualify the three-child dispatch path or prove Cloud Pool integration.
- Cloud Pool issue [#94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94) now tracks the native trigger implementation and acceptance contract.

## Required architecture boundary

The Cloud Pool controller must be implemented in this repository, with a dedicated control issue and owner-only exact-comment trigger. It must:
- accept only the dedicated issue ID, exact body `/next`, OWNER author association and trusted default-branch workflow;
- bind one immutable Cloud Pool SHA and source comment ID to a signed, fixed task envelope;
- dispatch exactly three child workflows without caller-controlled workflow names, arbitrary shell, refs or permissions;
- deduplicate by source comment ID and reconcile ambiguous POST outcomes before retry;
- reconcile exact child run/job IDs, terminal conclusions and artifact digests;
- fail closed on missing configuration, untrusted context, invalid signatures, replay, partial dispatch or missing evidence;
- avoid paid fallback and quota-evasion credential rotation;
- keep Gemini supplementary so primary ChatGPT work never waits on child completion.

Do not repurpose the MediaHub Issue #301 bridge or change its fixed repository/workflow target as a shortcut. A separate cross-repository contract would require independent authorization and review.

## Gate status

- Cloud Pool-native controller: NOT IMPLEMENTED.
- Dedicated control issue: CREATED (#94).
- Three Gemini child workflows in Cloud Pool: NOT IMPLEMENTED.
- Secrets/Variables metadata and scope: NOT VERIFIED; secret values must never be read.
- Trusted-main no-secret probe: NOT RUN for a Cloud Pool controller (none exists).
- Live dispatch: NOT RUN.
- Repeatable 3/3 qualification: NOT RUN.
- Contour A: NOT ACCEPTED; Contour B remains deferred.

## Next bounded implementation pass

Start from the default-branch SHA recorded above. Inspect governance and the current Pool Supervisor/Worker authorization contracts. Implement a separate least-privilege Cloud Pool controller plus non-launching probe and adversarial tests on a new branch. Do not enable dispatch or invoke model providers until exact-head CI, governance, owner identity, secret/variable presence/scope metadata and no-secret trusted-main probe all pass.

Canonical MediaHub map (reference only, not Cloud Pool control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
