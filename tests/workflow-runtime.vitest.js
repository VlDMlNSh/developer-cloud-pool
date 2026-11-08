import { it, expect } from "vitest";
import { env, exports } from "cloudflare:workers";
import { introspectWorkflow } from "cloudflare:test";

async function resetLedger() {
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS pool_attempts (attempt_id TEXT PRIMARY KEY, task_id TEXT NOT NULL, lease_generation INTEGER NOT NULL CHECK (lease_generation > 0), status TEXT NOT NULL CHECK (status IN ('claimed', 'completed', 'needs_review')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS pool_attempt_receipts (attempt_id TEXT NOT NULL, lease_generation INTEGER NOT NULL CHECK (lease_generation > 0), receipt_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (attempt_id, lease_generation), FOREIGN KEY (attempt_id) REFERENCES pool_attempts(attempt_id)); CREATE TABLE IF NOT EXISTS pool_attempt_step_invocations (attempt_id TEXT PRIMARY KEY, invocation_count INTEGER NOT NULL CHECK (invocation_count > 0), FOREIGN KEY (attempt_id) REFERENCES pool_attempts(attempt_id)); CREATE TABLE IF NOT EXISTS pool_test_faults (attempt_id TEXT PRIMARY KEY, remaining_failures INTEGER NOT NULL CHECK (remaining_failures >= 0));`);
  await env.DB.prepare("DELETE FROM pool_test_faults").run();
  await env.DB.prepare("DELETE FROM pool_attempt_step_invocations").run();
  await env.DB.prepare("DELETE FROM pool_attempt_receipts").run();
  await env.DB.prepare("DELETE FROM pool_attempts").run();
}

it("runs a Workflow locally and persists its completed step result", async () => {
  await resetLedger();
  await using introspector = await introspectWorkflow(env.PROOF_WORKFLOW);
  await introspector.modifyAll(async (mock) => {
    await mock.disableSleeps();
  });

  const payload = {
    taskId: "task-runtime",
    attemptId: "attempt-runtime",
    generation: 1,
    receipt: { sideEffectId: "runtime-effect", result: "accepted" }
  };
  const response = await exports.default.fetch(new Request("https://proof-worker.local/create", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
  }));
  expect(response.status).toBe(200);
  const { id } = await response.json();
  const [instance] = await introspector.get();
  await instance.waitForStatus("complete");
  expect(await instance.waitForStepResult({ name: "commit-d1-receipt" })).toEqual({
    outcome: "COMMITTED", receipt: payload.receipt
  });
  expect(await instance.getOutput()).toEqual({
    outcome: "COMMITTED", receipt: payload.receipt
  });
  const invocations = await env.DB.prepare(
    "SELECT invocation_count FROM pool_attempt_step_invocations WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(invocations.invocation_count).toBe(1);
});

it("retries the same Workflow step after D1 commit then timeout and returns the first durable receipt", async () => {
  await resetLedger();
  await using introspector = await introspectWorkflow(env.PROOF_WORKFLOW);
  await introspector.modifyAll(async (mock) => {
    await mock.disableSleeps();
    await mock.disableRetryDelays();
  });

  const payload = {
    taskId: "task-timeout",
    attemptId: "attempt-timeout",
    generation: 4,
    receipt: { sideEffectId: "durable-effect-once", result: "committed-before-timeout" },
    simulateTimeoutAfterCommit: true
  };
  await env.DB.prepare("INSERT INTO pool_test_faults (attempt_id, remaining_failures) VALUES (?, 1)").bind(payload.attemptId).run();
  const response = await exports.default.fetch(new Request("https://proof-worker.local/create", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
  }));
  expect(response.status).toBe(200);
  const { id } = await response.json();
  const [instance] = await introspector.get();
  await instance.waitForStatus("complete");

  const expected = { outcome: "COMMITTED", receipt: payload.receipt };
  expect(await instance.waitForStepResult({ name: "commit-d1-receipt" })).toEqual(expected);
  expect(await instance.getOutput()).toEqual(expected);

  const receiptRows = await env.DB.prepare(
    "SELECT COUNT(*) AS count, MIN(receipt_json) AS receipt_json FROM pool_attempt_receipts WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(receiptRows.count).toBe(1);
  expect(JSON.parse(receiptRows.receipt_json)).toEqual(payload.receipt);

  const attempt = await env.DB.prepare(
    "SELECT status, lease_generation FROM pool_attempts WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(attempt).toEqual({ status: "completed", lease_generation: payload.generation });

  const invocations = await env.DB.prepare(
    "SELECT invocation_count FROM pool_attempt_step_invocations WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(invocations.invocation_count).toBe(2);

  const fault = await env.DB.prepare(
    "SELECT remaining_failures FROM pool_test_faults WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(fault.remaining_failures).toBe(0);
});

it("rejects a duplicate trigger for the same attempt generation", async () => {
  await resetLedger();
  await using introspector = await introspectWorkflow(env.PROOF_WORKFLOW);
  await introspector.modifyAll(async (mock) => {
    await mock.disableSleeps();
  });

  const payload = {
    taskId: "task-duplicate-trigger",
    attemptId: "attempt-duplicate-trigger",
    generation: 9,
    receipt: { sideEffectId: "duplicate-trigger-effect", result: "accepted-once" }
  };
  const request = () => new Request("https://proof-worker.local/create", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
  });

  const firstResponse = await exports.default.fetch(request());
  expect(firstResponse.status).toBe(200);
  const first = await firstResponse.json();
  expect(first.id).toBe(`attempt-${payload.attemptId}-${payload.generation}`);

  await expect(exports.default.fetch(request())).rejects.toThrow();

  const instances = await introspector.get();
  expect(instances).toHaveLength(1);
  await instances[0].waitForStatus("complete");

  const attempts = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM pool_attempts WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  const receipts = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM pool_attempt_receipts WHERE attempt_id = ?"
  ).bind(payload.attemptId).first();
  expect(attempts.count).toBe(1);
  expect(receipts.count).toBe(1);
});
