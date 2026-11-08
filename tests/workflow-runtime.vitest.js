import { it, expect } from "vitest";
import { env, exports } from "cloudflare:workers";
import { introspectWorkflow } from "cloudflare:test";

it("runs a Workflow locally and persists its completed step result", async () => {
  await using introspector = await introspectWorkflow(env.PROOF_WORKFLOW);
  await introspector.modifyAll(async (mock) => {
    await mock.disableSleeps();
  });

  const response = await exports.default.fetch(
    new Request("https://proof-worker.local/create")
  );
  expect(response.status).toBe(200);
  const { id } = await response.json();
  expect(id).toEqual(expect.any(String));

  const instances = await introspector.get();
  expect(instances).toHaveLength(1);
  await expect(instances[0].waitForStatus("complete")).resolves.not.toThrow();
  await expect(
    instances[0].waitForStepResult({ name: "deterministic-proof-step" })
  ).resolves.toEqual({
    proof: "local-workflow-runtime",
    input: { marker: "synthetic-only" }
  });
  await expect(instances[0].getOutput()).resolves.toEqual({
    proof: "local-workflow-runtime",
    input: { marker: "synthetic-only" }
  });
});
