import test from "node:test";
import assert from "node:assert/strict";
import { AGENT_KEY_ENV, AGENT_ROLES, runFourAgents } from "./gemini-four-agent-controller.mjs";

const envWithKeys = Object.fromEntries(AGENT_KEY_ENV.map((name, index) => [name, "test-key-" + (index + 1)]));

test("dispatches four distinct role tasks through four isolated clients", async () => {
  const calls = [];
  const report = await runFourAgents({
    task: "Review the Cloud Pool task and report risks.",
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
  for (const role of AGENT_ROLES) {
    const result = report.results.find((item) => item.role === role.id);
    assert.ok(result.output.includes(role.instruction));
    assert.ok(result.output.includes("Review the Cloud Pool task"));
  }
});

test("fails closed before creating any client when one key is missing", async () => {
  let created = 0;
  const env = { ...envWithKeys };
  delete env.GEMINI_API_KEY_4;
  const report = await runFourAgents({
    task: "Independent review",
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
    task: "Independent review",
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
  const created = [];
  const report = await runFourAgents({
    task: "Independent review",
    env: envWithKeys,
    createClient: async (key, agent) => {
      created.push(agent);
      return { models: { generateContent: async () => {
        if (agent === 4) throw Object.assign(new Error("quota"), { status: 429 });
        return { text: "result-" + agent };
      } } };
    }
  });
  assert.equal(report.status, "PARTIAL");
  assert.deepEqual(created, [1, 2, 3, 4]);
  assert.equal(report.results[3].status, "QUOTA_EXHAUSTED");
});

test("rejects a task that contains a Google API key-shaped value", async () => {
  let created = 0;
  await assert.rejects(
    runFourAgents({
      task: "Do not log this key AIza123456789012345678901234567890123456",
      env: envWithKeys,
      createClient: async () => { created += 1; }
    }),
    /appears to contain a Google API key/
  );
  assert.equal(created, 0);
});

test("does not include credential values in the returned report", async () => {
  const report = await runFourAgents({
    task: "Review",
    env: envWithKeys,
    createClient: async () => ({ models: { generateContent: async () => ({ text: "ok" }) } })
  });
  const serialized = JSON.stringify(report);
  for (const key of Object.values(envWithKeys)) assert.equal(serialized.includes(key), false);
});
