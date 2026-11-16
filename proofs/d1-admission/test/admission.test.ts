import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { admitOwnerNextEvent, deriveAdmissionEnvelope } from "../src/admission.mjs";

const NOW = 1_800_000_000;
const TARGET = "a".repeat(40);
const CODE = "b".repeat(40);

function valid(commentId = 6912000001) {
  return {
    eventName: "issue_comment",
    ref: "refs/heads/Основной",
    targetSha: TARGET,
    trustedDefaultHeadSha: TARGET,
    controllerCodeSha: CODE,
    controllerRunId: "43890000001",
    approvalId: "approval-" + commentId,
    profile: "dsh-headless-probe",
    repository: {
      id: 1445644538,
      full_name: "VlDMlNSh/developer-cloud-pool",
      default_branch: "Основной",
      owner: { id: 157891068, login: "VlDMlNSh" }
    },
    event: {
      action: "created",
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

async function seedApproval(input, { expiresAt = NOW + 300, envelopeDigest } = {}) {
  const binding = await deriveAdmissionEnvelope(input);
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
      profile, envelope_digest, expires_at, state
    ) VALUES (?, '157891068', '1445644538', 96, ?, ?, ?, ?, 'ready')
  `).bind(input.approvalId, input.targetSha, input.profile, envelopeDigest ?? binding.envelopeDigest, expiresAt).run();
  return binding;
}

async function counts(sourceCommentId) {
  const receipt = await env.POOL_DB.prepare(
    "SELECT task_key FROM pool_admission_receipts WHERE source_comment_id = ?"
  ).bind(sourceCommentId).first();
  if (!receipt) return { receipts: 0, tasks: 0, approvals: 0, outbox: 0 };
  const [receipts, tasks, approvals, outbox] = await Promise.all([
    env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_admission_receipts WHERE source_comment_id = ?").bind(sourceCommentId).first(),
    env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_tasks WHERE task_key = ?").bind(receipt.task_key).first(),
    env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_approvals WHERE task_key = ?").bind(receipt.task_key).first(),
    env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_outbox WHERE task_key = ?").bind(receipt.task_key).first()
  ]);
  return { receipts: receipts.n, tasks: tasks.n, approvals: approvals.n, outbox: outbox.n };
}

describe("atomic owner /next D1 admission", () => {
  it("atomically persists the owner receipt, consumes approval and creates task/outbox", async () => {
    const input = valid(6912000001);
    const binding = await seedApproval(input);
    const result = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(result).toMatchObject({ decision: "ADMITTED", dispatch: false, executionAuthorized: false });
    expect(result.taskKey).toBe(binding.taskKey);
    expect(await counts(binding.sourceCommentId)).toEqual({ receipts: 1, tasks: 1, approvals: 1, outbox: 1 });
    const approval = await env.POOL_DB.prepare("SELECT state, task_key, consumed_at FROM pool_approval_ledger WHERE approval_id = ?").bind(input.approvalId).first();
    expect(approval).toEqual({ state: "consumed", task_key: binding.taskKey, consumed_at: NOW });
  });

  it("replays the same source comment idempotently without duplicating task/outbox", async () => {
    const input = valid(6912000002);
    await seedApproval(input);
    const first = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    const replay = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(first.decision).toBe("ADMITTED");
    expect(replay).toMatchObject({ decision: "ADMISSION_REPLAY", admissionId: first.admissionId, taskKey: first.taskKey, dispatch: false });
    expect(await counts(String(input.event.comment.id))).toEqual({ receipts: 1, tasks: 1, approvals: 1, outbox: 1 });
  });

  it("rejects a changed target on the same source comment ID", async () => {
    const input = valid(6912000003);
    await seedApproval(input);
    expect((await admitOwnerNextEvent(env.POOL_DB, input, NOW)).decision).toBe("ADMITTED");
    const changed = valid(6912000003);
    changed.targetSha = "c".repeat(40);
    changed.trustedDefaultHeadSha = changed.targetSha;
    changed.controllerRunId = "43890000002";
    changed.controllerCodeSha = "d".repeat(40);
    const replay = await admitOwnerNextEvent(env.POOL_DB, changed, NOW + 10);
    expect(replay).toMatchObject({
      decision: "ADMISSION_REPLAY",
      admissionId: (await admitOwnerNextEvent(env.POOL_DB, input, NOW)).admissionId,
      taskKey: (await admitOwnerNextEvent(env.POOL_DB, input, NOW)).taskKey,
      dispatch: false
    });
    expect(await counts(String(input.event.comment.id))).toEqual({ receipts: 1, tasks: 1, approvals: 1, outbox: 1 });
  });

  it("rejects wrong issue, wrong body, non-owner, edited event and untrusted ref before storage", async () => {
    const mutations = [
      x => { x.event.issue.number = 95; },
      x => { x.event.comment.body = "/next please"; },
      x => { x.event.comment.author_association = "COLLABORATOR"; },
      x => { x.event.action = "edited"; },
      x => { x.ref = "refs/pull/96/merge"; }
    ];
    for (const mutate of mutations) {
      const input = valid(6912000004);
      mutate(input);
      const result = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
      expect(result.decision).toBe("DENY");
    }
    expect(await counts("6912000004")).toEqual({ receipts: 0, tasks: 0, approvals: 0, outbox: 0 });
  });

  it("rolls back the receipt when approval is absent, expired or envelope-mismatched", async () => {
    const input = valid(6912000005);
    await seedApproval(input, { expiresAt: NOW - 1 });
    const expired = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(expired.decision).toBe("DENY");
    expect(await counts(String(input.event.comment.id))).toEqual({ receipts: 0, tasks: 0, approvals: 0, outbox: 0 });

    const mismatch = valid(6912000006);
    await seedApproval(mismatch, { envelopeDigest: "d".repeat(64) });
    const rejected = await admitOwnerNextEvent(env.POOL_DB, mismatch, NOW);
    expect(rejected.decision).toBe("DENY");
    expect(await counts(String(mismatch.event.comment.id))).toEqual({ receipts: 0, tasks: 0, approvals: 0, outbox: 0 });
  });

  it("admits two distinct source comments as two waves, not one shared task", async () => {
    const one = valid(6912000007);
    const two = valid(6912000008);
    await seedApproval(one);
    await seedApproval(two);
    const a = await admitOwnerNextEvent(env.POOL_DB, one, NOW);
    const b = await admitOwnerNextEvent(env.POOL_DB, two, NOW);
    expect(a.decision).toBe("ADMITTED");
    expect(b.decision).toBe("ADMITTED");
    expect(a.waveId).not.toBe(b.waveId);
    expect(a.taskKey).not.toBe(b.taskKey);
    const [outboxOne, outboxTwo] = await Promise.all([
      env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_outbox WHERE task_key = ?").bind(a.taskKey).first(),
      env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_outbox WHERE task_key = ?").bind(b.taskKey).first()
    ]);
    expect(outboxOne.n).toBe(1);
    expect(outboxTwo.n).toBe(1);
  });

  it("serializes concurrent delivery of one source comment into one durable admission", async () => {
    const input = valid(6912000010);
    await seedApproval(input);
    const [first, second] = await Promise.all([
      admitOwnerNextEvent(env.POOL_DB, input, NOW),
      admitOwnerNextEvent(env.POOL_DB, input, NOW)
    ]);
    expect([first.decision, second.decision].sort()).toEqual(["ADMISSION_REPLAY", "ADMITTED"]);
    expect(first.admissionId).toBe(second.admissionId);
    expect(await counts(String(input.event.comment.id))).toEqual({ receipts: 1, tasks: 1, approvals: 1, outbox: 1 });
  });

  it("keeps admission receipts and logical task identity immutable", async () => {
    const input = valid(6912000011);
    await seedApproval(input);
    const result = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_tasks SET target_sha = ? WHERE task_key = ?"
    ).bind("e".repeat(40), result.taskKey).run()).rejects.toThrow("LOGICAL_TASK_BINDING_IMMUTABLE");
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_admission_receipts SET actor_id = ? WHERE source_comment_id = ?"
    ).bind("1", String(input.event.comment.id)).run()).rejects.toThrow("ADMISSION_RECEIPT_IMMUTABLE");
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_admission_receipts WHERE source_comment_id = ?"
    ).bind(String(input.event.comment.id)).run()).rejects.toThrow("ADMISSION_RECEIPT_APPEND_ONLY");
  });


  it("prevents approval replay by making consumption monotonic and append-only", async () => {
    const input = valid(6912000012);
    await seedApproval(input);
    const admitted = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(admitted.decision).toBe("ADMITTED");
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'ready', consumed_at = NULL, task_key = NULL
       WHERE approval_id = ?
    `).bind(input.approvalId).run()).rejects.toThrow("APPROVAL_STATE_NOT_MONOTONIC");
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approvalId).run()).rejects.toThrow("APPROVAL_LEDGER_APPEND_ONLY");
    const row = await env.POOL_DB.prepare(
      "SELECT state, task_key, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(input.approvalId).first();
    expect(row).toMatchObject({ state: "consumed", task_key: admitted.taskKey, consumed_at: NOW });
  });


  it("rejects a target that is not the trusted default-branch HEAD", async () => {
    const input = valid(6912000013);
    input.targetSha = "c".repeat(40);
    const result = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(result).toMatchObject({ decision: "DENY", reason: "STALE_OR_UNBOUND_TARGET_SHA", dispatch: false });
    expect(await counts(String(input.event.comment.id))).toEqual({ receipts: 0, tasks: 0, approvals: 0, outbox: 0 });
  });

  it("keeps dispatch disabled on every result", async () => {
    const input = valid(6912000009);
    const rejected = await admitOwnerNextEvent(env.POOL_DB, input, NOW);
    expect(rejected.dispatch).toBe(false);
    expect(rejected.executionAuthorized).toBe(false);
  });
});
