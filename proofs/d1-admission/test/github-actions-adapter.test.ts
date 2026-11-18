import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { deriveAdmissionEnvelope } from "../src/admission.mjs";
import { admitGitHubActionsEvent, bindGitHubActionsContext } from "../src/github-actions-adapter.mjs";

const NOW = 1_800_000_100;
const SHA = "a".repeat(40);
const WORKFLOW_SHA = "b".repeat(40);

function valid(commentId = 6912000101) {
  return {
    eventName: "issue_comment",
    ref: "refs/heads/Основной",
    sha: SHA,
    runId: "44170001001",
    runAttempt: "1",
    workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/cloud-pool-next-controller.yml@refs/heads/Основной",
    workflowSha: WORKFLOW_SHA,
    event: {
      action: "created",
      repository: {
        id: 1445644538,
        full_name: "VlDMlNSh/developer-cloud-pool",
        default_branch: "Основной",
        owner: { id: 157891068, login: "VlDMlNSh" }
      },
      issue: {
        number: 96,
        state: "open",
        repository_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96"
      },
      comment: {
        id: commentId,
        body: "/next",
        user: { id: 157891068, login: "VlDMlNSh" },
        author_association: "OWNER"
      }
    }
  };
}

async function seedApproval(context, approval) {
  const input = bindGitHubActionsContext(context, approval);
  expect(input.decision).toBeUndefined();
  const binding = await deriveAdmissionEnvelope(input);
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state
    ) VALUES (?, '157891068', '1445644538', 96, ?, ?, ?, ?, 'ready')
  `).bind(approval.approvalId, input.targetSha, input.profile, binding.envelopeDigest, NOW + 300).run();
  return binding;
}

describe("GitHub Actions context -> atomic D1 admission composition", () => {
  it("derives target, workflow code SHA and run identity only from GitHub context", async () => {
    const context = valid();
    const approval = { approvalId: "gha-approval-1", profile: "dsh-headless-probe" };
    const bound = bindGitHubActionsContext(context, approval);
    expect(bound).toMatchObject({
      targetSha: SHA,
      trustedDefaultHeadSha: SHA,
      controllerRunId: "44170001001",
      controllerCodeSha: WORKFLOW_SHA,
      dispatch: undefined
    });
    expect(bound.targetSha).not.toBe("c".repeat(40));
    expect(bound.trustedDefaultHeadSha).toBe(context.sha);
  });

  it("persists one atomic admission from a valid owner Actions context and never dispatches", async () => {
    const context = valid(6912000102);
    const approval = { approvalId: "gha-approval-2", profile: "dsh-headless-probe" };
    const binding = await seedApproval(context, approval);
    const result = await admitGitHubActionsEvent(env.POOL_DB, context, approval, NOW);
    expect(result).toMatchObject({
      decision: "ADMITTED",
      taskKey: binding.taskKey,
      dispatch: false,
      executionAuthorized: false
    });
    const receipt = await env.POOL_DB.prepare(
      "SELECT target_sha, controller_run_id, controller_code_sha FROM pool_admission_receipts WHERE source_comment_id = ?"
    ).bind(String(context.event.comment.id)).first();
    expect(receipt).toEqual({
      target_sha: SHA,
      controller_run_id: "44170001001",
      controller_code_sha: WORKFLOW_SHA
    });
  });

  it("rejects pull-request workflow refs even when event payload is otherwise valid", async () => {
    const context = valid(6912000103);
    context.ref = "refs/pull/114/merge";
    const result = await admitGitHubActionsEvent(env.POOL_DB, context, {
      approvalId: "gha-approval-3", profile: "dsh-headless-probe"
    }, NOW);
    expect(result).toMatchObject({ decision: "DENY", reason: "UNTRUSTED_WORKFLOW_REF", dispatch: false });
  });

  it("rejects a workflow_ref not bound to the default branch", () => {
    const context = valid();
    context.workflowRef = "VlDMlNSh/developer-cloud-pool/.github/workflows/controller.yml@refs/pull/114/merge";
    expect(bindGitHubActionsContext(context, {
      approvalId: "gha-approval-4", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "UNTRUSTED_WORKFLOW_REF_IDENTITY" });
  });

  it("rejects invalid workflow SHA and run identity", () => {
    const badSha = valid();
    badSha.workflowSha = "not-a-sha";
    expect(bindGitHubActionsContext(badSha, {
      approvalId: "gha-approval-5", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_GITHUB_CONTEXT_SHA" });

    const badRun = valid();
    badRun.runId = "0";
    expect(bindGitHubActionsContext(badRun, {
      approvalId: "gha-approval-6", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_WORKFLOW_RUN_IDENTITY" });
  });

  it("does not accept caller-provided target or trusted-head overrides", () => {
    const context = valid();
    context.targetSha = "c".repeat(40);
    context.trustedDefaultHeadSha = "c".repeat(40);
    const result = bindGitHubActionsContext(context, {
      approvalId: "gha-approval-7", profile: "dsh-headless-probe"
    });
    expect(result).toMatchObject({ targetSha: SHA, trustedDefaultHeadSha: SHA });
  });

  it("rejects wrong owner, issue, body and profile before D1 access", async () => {
    const mutations = [
      x => { x.event.repository.owner.id += 1; },
      x => { x.event.issue.number = 95; },
      x => { x.event.comment.body = "/next please"; },
      x => { x.event.comment.author_association = "COLLABORATOR"; }
    ];
    for (const mutate of mutations) {
      const context = valid();
      mutate(context);
      const result = await admitGitHubActionsEvent(env.POOL_DB, context, {
        approvalId: "gha-rejected-" + Math.random(), profile: "dsh-headless-probe"
      }, NOW);
      expect(result.decision).toBe("DENY");
    }
    expect(bindGitHubActionsContext(valid(), {
      approvalId: "gha-approval-8", profile: "unbounded"
    })).toMatchObject({ decision: "DENY", reason: "PROFILE_NOT_ALLOWED" });
  });
});
