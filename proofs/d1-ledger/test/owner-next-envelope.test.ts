import { describe, expect, it } from "vitest";
import { mapGitHubActionsContext } from "../src/github-actions-context.mjs";
import { digestOwnerNextEnvelope, verifyOwnerNextEnvelopeForActions } from "../src/owner-next-envelope.mjs";

const sha = (char) => char.repeat(40);
const context = {
  githubActions: "true", serverUrl: "https://github.com",
  eventName: "issue_comment", eventAction: "created",
  repository: "VlDMlNSh/developer-cloud-pool", repositoryId: "1445644538",
  ownerNumericId: "157891068", ownerLogin: "VlDMlNSh",
  actorId: "157891068", actorLogin: "VlDMlNSh",
  ref: "refs/heads/Основной", sha: sha("a"),
  workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
  workflowSha: sha("b"), runId: 123456, runAttempt: 1,
  issueNumber: 96, isPullRequest: false, commentId: 987654,
  commentBody: "/next", commentUserId: "157891068",
  commentUserLogin: "VlDMlNSh", commentAuthorAssociation: "OWNER"
};
const envelope = () => ({
  schema: "cloud-pool.owner-next.api-attestation", version: 1,
  event: {
    name: "issue_comment", action: "created", body: "/next",
    bodySha256: "65e2c8aed83c729f4663f27dceb83ec1b5abe5c0717eb156934fcce9658df2e3",
    repositoryId: "1445644538", repository: "VlDMlNSh/developer-cloud-pool",
    ownerId: "157891068", issueNumber: 96, issueNodeId: "I_kwDOExample",
    commentId: "987654", commentNodeId: "IC_kwDOExample",
    actorId: "157891068", actorLogin: "VlDMlNSh", authorAssociation: "OWNER"
  },
  ref: { name: "refs/heads/Основной", defaultBranch: "Основной", observedDefaultHeadSha: sha("a") },
  run: {
    id: "123456", attempt: 1, event: "issue_comment", headBranch: "Основной",
    headSha: sha("a"), workflowId: "98765",
    workflowPath: ".github/workflows/next-event-controller.yml", workflowState: "active",
    workflowCommitSha: sha("b"), workflowFileBlobSha: sha("c"), workflowFileRefSha: sha("a")
  },
  policy: { profile: "jarvis-code-sandbox-v1", dispatch: false, executionAuthorized: false }
});

describe("Workers-native owner /next API envelope", () => {
  it("verifies canonical digest and cross-checks trusted Actions context", async () => {
    const value = envelope();
    const digest = await digestOwnerNextEnvelope(value);
    const result = await verifyOwnerNextEnvelopeForActions(JSON.stringify(value), digest, context);
    expect(result).toMatchObject({ decision: "VERIFIED", digest, dispatch: false, executionAuthorized: false });
  });

  it("rejects duplicate JSON keys before JSON.parse ambiguity", async () => {
    await expect(verifyOwnerNextEnvelopeForActions('{"schema":"x","schema":"y"}', "0".repeat(64), context))
      .rejects.toThrow("DUPLICATE_JSON_KEY");
  });

  it("rejects unknown top-level fields", async () => {
    const value = envelope(); value.extra = true;
    await expect(verifyOwnerNextEnvelopeForActions(JSON.stringify(value), "0".repeat(64), context))
      .rejects.toThrow("ENVELOPE_SCHEMA_KEYS_INVALID");
  });

  it("rejects a tampered canonical digest", async () => {
    const value = envelope();
    await expect(verifyOwnerNextEnvelopeForActions(JSON.stringify(value), "0".repeat(64), context))
      .rejects.toThrow("ENVELOPE_DIGEST_MISMATCH");
  });

  it("rejects mismatched comment identity against trusted Actions context", async () => {
    const value = envelope(); value.event.commentId = "987655";
    const digest = await digestOwnerNextEnvelope(value);
    await expect(verifyOwnerNextEnvelopeForActions(JSON.stringify(value), digest, context))
      .rejects.toThrow("ACTIONS_EVENT_CROSSCHECK_FAILED");
  });

  it("rejects mismatched workflow and run provenance", async () => {
    const value = envelope(); value.run.workflowCommitSha = sha("d");
    const digest = await digestOwnerNextEnvelope(value);
    await expect(verifyOwnerNextEnvelopeForActions(JSON.stringify(value), digest, context))
      .rejects.toThrow("ACTIONS_RUN_CROSSCHECK_FAILED");
  });

  it("rejects a non-read-only policy", async () => {
    const value = envelope(); value.policy.dispatch = true;
    await expect(digestOwnerNextEnvelope(value)).rejects.toThrow("POLICY_NOT_READ_ONLY");
  });

  it("rejects mismatched run head and observed default head", async () => {
    const value = envelope(); value.run.headSha = sha("d");
    await expect(digestOwnerNextEnvelope(value)).rejects.toThrow("RUN_REF_PROVENANCE_MISMATCH");
  });

  it("rejects malformed and oversized serialized input", async () => {
    await expect(verifyOwnerNextEnvelopeForActions("{", "0".repeat(64), context)).rejects.toThrow("INVALID_JSON");
    await expect(verifyOwnerNextEnvelopeForActions("x".repeat(16_385), "0".repeat(64), context)).rejects.toThrow("ENVELOPE_JSON_SIZE_INVALID");
  });

  it("maps the runner event using the existing trusted context adapter", () => {
    const github = {
      event_name: "issue_comment",
      event: { action: "created", issue: { number: 96 }, comment: {
        id: 987654, body: "/next", user: { id: 157891068, login: "VlDMlNSh", author_association: "OWNER" }
      }},
      repository: "VlDMlNSh/developer-cloud-pool", repository_id: "1445644538",
      repository_owner: "VlDMlNSh", repository_owner_id: "157891068",
      actor: "VlDMlNSh", actor_id: "157891068", ref: "refs/heads/Основной",
      sha: sha("a"),
      workflow_ref: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
      workflow_sha: sha("b"), run_id: "123456", run_attempt: "1"
    };
    const mapped = mapGitHubActionsContext(github, { GITHUB_ACTIONS: "true", GITHUB_SERVER_URL: "https://github.com" });
    expect(mapped).toMatchObject({ commentId: 987654, runId: 123456, runAttempt: 1, sha: sha("a"), workflowSha: sha("b") });
  });
});
