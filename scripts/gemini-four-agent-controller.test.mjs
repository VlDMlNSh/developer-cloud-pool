import test from "node:test";
import assert from "node:assert/strict";
import { AGENT_KEY_ENV, AGENT_ROLES, runFourAgents } from "./gemini-four-agent-controller.mjs";

const envWithKeys = Object.fromEntries(AGENT_KEY_ENV.map((name, index) => [name, "test-key-" + (index + 1)]));
const tasks = [
  "Research the current Cloud Pool controller architecture and mature reusable upstream projects.",
  "Specify the smallest implementation boundary for the Cloud Pool native four-agent controller.",
  "Build the contract test matrix for isolated four-agent dispatch, failure handling, and provenance.",
  "Audit dispatch authority, workflow permissions, secret isolation, account separation, and quota handling."
];

test("dispatches four distinct task envelopes through four isolated clients", async () => {
  const calls = [];
  const report = await runFourAgents({
    tasks,
    env: envWithKeys,
    createClient: async (key, agent) => {
      calls.push({ key, agent });
      return { models: { generateContent: async ({ model, contents }) => ({ text: model + ":" + contents }) } };
    }
  });
  assert.equal(report.status, "SUCCESS");
  assert.equal(report.results.length, 4);
  assert.deepEqual(calls.map((call) => call.key), ["test-key-1", "test-key-2", "test-key-3", "test-key-4"]);
  assert.deepEqual(report.results.map((item) => item.role), AGENT_ROLES.map((role) => role.id));
  assert.equal(new Set(calls.map((call) => call.agent)).size, 4);
  for (let i = 0; i < AGENT_ROLES.length; i += 1) {
    assert.ok(report.results[i].output.includes(AGENT_ROLES[i].instruction));
    assert.ok(report.results[i].output.includes(tasks[i]));
    for (let j = 0; j < tasks.length; j += 1) {
      if (j !== i) assert.equal(report.results[i].output.includes(tasks[j]), false);
    }
    assert.equal(report.results[i].taskIndex, i);
  }
});

test("requires exactly four task envelopes", async () => {
  await assert.rejects(runFourAgents({ tasks: tasks.slice(0, 3), env: envWithKeys }), /Exactly four isolated task strings/);
  await assert.rejects(runFourAgents({ tasks: [...tasks, "extra"], env: envWithKeys }), /Exactly four isolated task strings/);
});

test("rejects duplicate task payloads to preserve task isolation", async () => {
  await assert.rejects(runFourAgents({ tasks: [tasks[0], tasks[1], tasks[2], tasks[0]], env: envWithKeys }), /distinct task/);
});

test("fails closed before creating any client when one key is missing", async () => {
  let created = 0;
  const env = { ...envWithKeys };
  delete env.GEMINI_API_KEY_4;
  const report = await runFourAgents({
    tasks,
    env,
    createClient: async () => { created += 1; throw new Error("must not run"); }
  });
  assert.equal(report.status, "CONFIG_BLOCKED");
  assert.equal(created, 0);
  assert.equal(report.results[3].status, "MISSING_CREDENTIAL");
});

test("fails closed when two credential slots contain the same value", async () => {
  let created = 0;
  const env = { ...envWithKeys, GEMINI_API_KEY_4: envWithKeys.GEMINI_API_KEY_1 };
  const report = await runFourAgents({
    tasks,
    env,
    createClient: async () => { created += 1; throw new Error("must not run"); }
  });
  assert.equal(report.status, "CONFIG_BLOCKED");
  assert.equal(created, 0);
  assert.ok(report.results.every((item) => item.status === "DUPLICATE_CREDENTIAL"));
  const serialized = JSON.stringify(report);
  for (const key of Object.values(env)) assert.equal(serialized.includes(key), false);
});

test("keeps per-account quota failures isolated without fallback", async () => {
  const report = await runFourAgents({
    tasks,
    env: envWithKeys,
    createClient: async (key, agent) => ({
      models: { generateContent: async () => {
        if (agent === 4) throw Object.assign(new Error("quota"), { status: 429 });
        return { text: "result-" + agent };
      } }
    })
  });
  assert.equal(report.status, "PARTIAL");
  assert.equal(report.results[3].status, "QUOTA_EXHAUSTED");
});

test("rejects task payloads containing a Google API key-shaped value", async () => {
  const badTasks = [...tasks];
  badTasks[2] = "Do not log this key AIza123456789012345678901234567890123456";
  await assert.rejects(runFourAgents({ tasks: badTasks, env: envWithKeys }), /appears to contain a Google API key/);
});

test("does not include credential values in the returned report", async () => {
  const report = await runFourAgents({
    tasks,
    env: envWithKeys,
    createClient: async () => ({ models: { generateContent: async () => ({ text: "ok" }) } })
  });
  const serialized = JSON.stringify(report);
  for (const key of Object.values(envWithKeys)) assert.equal(serialized.includes(key), false);
});
