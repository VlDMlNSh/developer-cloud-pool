import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { deriveAdmissionEnvelope } from "../src/admission.mjs";
import { admitGitHubActionsEvent, bindGitHubActionsContext } from "../src/github-actions-adapter.mjs";

const NOW = 1_800_000_100;
const SHA = "a".repeat(40);
const WORKFLOW_SHA = "b".repeat(40);

function valid(commentId = 6912000101) {
  const event = {
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
  };
  const environment = {
    GITHUB_ACTIONS: "true",
    GITHUB_SERVER_URL: "https://github.com",
    RUNNER_ENVIRONMENT: "github-hosted",
    GITHUB_EVENT_NAME: "issue_comment",
    GITHUB_REPOSITORY: "VlDMlNSh/developer-cloud-pool",
    GITHUB_REPOSITORY_ID: "1445644538",
    GITHUB_REPOSITORY_OWNER: "VlDMlNSh",
    GITHUB_REPOSITORY_OWNER_ID: "157891068",
    GITHUB_REF: "refs/heads/Основной",
    GITHUB_SHA: SHA,
    GITHUB_RUN_ID: "44170001001",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_WORKFLOW_REF: "VlDMlNSh/developer-cloud-pool/.github/workflows/cloud-pool-next-controller.yml@refs/heads/Основной",
    GITHUB_WORKFLOW_SHA: WORKFLOW_SHA
  };
  return { event, environment };
}

async function seedApproval(event, environment, approval) {
  const input = bindGitHubActionsContext(event, environment, approval);
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

describe("GitHub Actions environment -> atomic D1 admission composition", () => {
  it("derives target, controller SHA and run identity only from runner environment", () => {
    const { event, environment } = valid();
    const approval = { approvalId: "gha-approval-1", profile: "dsh-headless-probe" };
    const bound = bindGitHubActionsContext(event, environment, approval);
    expect(bound).toMatchObject({
      targetSha: SHA,
      trustedDefaultHeadSha: SHA,
      controllerRunId: "44170001001",
      controllerRunAttempt: "1",
      controllerCodeSha: WORKFLOW_SHA,
      workflowRef: environment.GITHUB_WORKFLOW_REF
    });
    expect(bound.targetSha).not.toBe("c".repeat(40));
    expect(bound.trustedDefaultHeadSha).toBe(environment.GITHUB_SHA);
  });

  it("persists one atomic admission from the GitHub-bound context and never dispatches", async () => {
    const { event, environment } = valid(6912000102);
    const approval = { approvalId: "gha-approval-2", profile: "dsh-headless-probe" };
    const binding = await seedApproval(event, environment, approval);
    const result = await admitGitHubActionsEvent(env.POOL_DB, event, environment, approval, NOW);
    expect(result).toMatchObject({
      decision: "ADMITTED",
      taskKey: binding.taskKey,
      dispatch: false,
      executionAuthorized: false
    });
    const receipt = await env.POOL_DB.prepare(
      "SELECT target_sha, controller_run_id, controller_run_attempt, controller_code_sha FROM pool_admission_receipts WHERE source_comment_id = ?"
    ).bind(String(event.comment.id)).first();
    expect(receipt).toEqual({
      target_sha: SHA,
      controller_run_id: "44170001001",
      controller_run_attempt: 1,
      controller_code_sha: WORKFLOW_SHA
    });
  });

  it("rejects pull-request refs even when the event payload is otherwise valid", async () => {
    const { event, environment } = valid(6912000103);
    environment.GITHUB_REF = "refs/pull/114/merge";
    const result = await admitGitHubActionsEvent(env.POOL_DB, event, environment, {
      approvalId: "gha-approval-3", profile: "dsh-headless-probe"
    }, NOW);
    expect(result).toMatchObject({ decision: "DENY", reason: "UNTRUSTED_WORKFLOW_REF", dispatch: false });
  });

  it("requires the exact allowlisted controller workflow on the default branch", () => {
    const { event, environment } = valid();
    environment.GITHUB_WORKFLOW_REF = "VlDMlNSh/developer-cloud-pool/.github/workflows/unapproved.yml@refs/heads/Основной";
    expect(bindGitHubActionsContext(event, environment, {
      approvalId: "gha-approval-4", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "UNTRUSTED_WORKFLOW_REF_IDENTITY" });
  });

  it("rejects malformed SHA values and workflow run identities", () => {
    const first = valid();
    first.environment.GITHUB_WORKFLOW_SHA = "not-a-sha";
    expect(bindGitHubActionsContext(first.event, first.environment, {
      approvalId: "gha-approval-5", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_GITHUB_CONTEXT_SHA" });

    const second = valid();
    second.environment.GITHUB_RUN_ID = "0";
    expect(bindGitHubActionsContext(second.event, second.environment, {
      approvalId: "gha-approval-6", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_WORKFLOW_RUN_IDENTITY" });

    const badAttempt = valid();
    badAttempt.environment.GITHUB_RUN_ATTEMPT = "0";
    expect(bindGitHubActionsContext(badAttempt.event, badAttempt.environment, {
      approvalId: "gha-approval-6b", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_WORKFLOW_RUN_IDENTITY" });
  });

  it("rejects a mismatch between event payload identity and runner repository identity", () => {
    const { event, environment } = valid();
    event.repository.id += 1;
    expect(bindGitHubActionsContext(event, environment, {
      approvalId: "gha-approval-7", profile: "dsh-headless-probe"
    })).toMatchObject({ decision: "DENY", reason: "EVENT_RUN_REPOSITORY_IDENTITY_MISMATCH" });
  });

  it("does not accept caller-provided target SHA overrides", () => {
    const { event, environment } = valid();
    environment.targetSha = "c".repeat(40);
    environment.trustedDefaultHeadSha = "c".repeat(40);
    const result = bindGitHubActionsContext(event, environment, {
      approvalId: "gha-approval-8", profile: "dsh-headless-probe"
    });
    expect(result).toMatchObject({ targetSha: SHA, trustedDefaultHeadSha: SHA });
  });

  it("rejects wrong owner, issue, body, profile and non-GitHub environment", async () => {
    const mutations = [
      x => { x.event.repository.owner.id += 1; },
      x => { x.event.issue.number = 95; },
      x => { x.event.comment.body = "/next please"; },
      x => { x.event.comment.author_association = "COLLABORATOR"; },
      x => { x.environment.GITHUB_ACTIONS = "false"; },
      x => { x.environment.RUNNER_ENVIRONMENT = "self-hosted"; },
      x => { x.environment.GITHUB_REPOSITORY_OWNER_ID = "999"; }
    ];
    for (const mutate of mutations) {
      const pair = valid();
      mutate(pair);
      const result = await admitGitHubActionsEvent(env.POOL_DB, pair.event, pair.environment, {
        approvalId: "gha-rejected-static", profile: "dsh-headless-probe"
      }, NOW);
      expect(result.decision).toBe("DENY");
    }
    const pair = valid();
    expect(bindGitHubActionsContext(pair.event, pair.environment, {
      approvalId: "gha-approval-9", profile: "unbounded"
    })).toMatchObject({ decision: "DENY", reason: "PROFILE_NOT_ALLOWED" });
  });
  it("rejects issue_comment events that are actually pull-request conversation comments", () => {
    const { event, environment } = valid(6912000111);
    event.issue = {
      number: 125,
      state: "open",
      repository_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/125",
      pull_request: {
        url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/pulls/125"
      }
    };

    expect(bindGitHubActionsContext(event, environment, {
      approvalId: "gha-pr-comment-must-deny",
      profile: "dsh-headless-probe"
    })).toMatchObject({
      decision: "DENY",
      reason: "WRONG_CONTROL_ISSUE",
      dispatch: false,
      executionAuthorized: false
    });
  });

  it("replays the same source comment across workflow attempts and preserves the first receipt", async () => {
    const { event, environment } = valid(6912000110);
    const approval = { approvalId: "gha-approval-run-attempt-replay", profile: "dsh-headless-probe" };
    const binding = await seedApproval(event, environment, approval);

    const first = await admitGitHubActionsEvent(env.POOL_DB, event, environment, approval, NOW);
    expect(first).toMatchObject({
      decision: "ADMITTED",
      taskKey: binding.taskKey,
      dispatch: false,
      executionAuthorized: false
    });

    // GitHub reruns retain run_id and increment run_attempt. The original
    // source-comment admission must remain the single durable task identity.
    environment.GITHUB_RUN_ATTEMPT = "2";
    const replay = await admitGitHubActionsEvent(env.POOL_DB, event, environment, approval, NOW + 1);
    expect(replay).toMatchObject({
      decision: "ADMISSION_REPLAY",
      admissionId: first.admissionId,
      taskKey: first.taskKey,
      dispatch: false,
      executionAuthorized: false
    });

    const [receipt, task, taskApproval, outbox] = await Promise.all([
      env.POOL_DB.prepare(
        "SELECT controller_run_id, controller_run_attempt FROM pool_admission_receipts WHERE source_comment_id = ?"
      ).bind(String(event.comment.id)).first(),
      env.POOL_DB.prepare(
        "SELECT COUNT(*) AS n FROM pool_tasks WHERE task_key = ?"
      ).bind(first.taskKey).first(),
      env.POOL_DB.prepare(
        "SELECT COUNT(*) AS n FROM pool_task_approvals WHERE task_key = ?"
      ).bind(first.taskKey).first(),
      env.POOL_DB.prepare(
        "SELECT COUNT(*) AS n FROM pool_task_outbox WHERE task_key = ?"
      ).bind(first.taskKey).first()
    ]);

    expect(receipt).toEqual({ controller_run_id: "44170001001", controller_run_attempt: 1 });
    expect(task.n).toBe(1);
    expect(taskApproval.n).toBe(1);
    expect(outbox.n).toBe(1);
  });

});
