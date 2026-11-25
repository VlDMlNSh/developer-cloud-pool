import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkerCallerContext } from "./pool-worker-caller.mjs";

const sha = "a".repeat(40);
const valid = {
  githubRepository: "VlDMlNSh/developer-cloud-pool",
  githubWorkflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/pool-supervisor.yml@refs/heads/Основной",
  githubWorkflowSha: sha,
  jobWorkflowRepository: "VlDMlNSh/developer-cloud-pool",
  jobWorkflowFilePath: ".github/workflows/pool-worker.yml",
  jobWorkflowSha: sha
};

test("accepts exact protected caller and reusable worker", () => {
  assert.equal(validateWorkerCallerContext(valid).authorized, true);
});

test("rejects missing caller context", () => {
  assert.equal(validateWorkerCallerContext({ actor: "github-actions[bot]", approved: true }).authorized, false);
});

for (const [name, patch] of [
  ["wrong caller ref", { githubWorkflowRef: "refs/heads/feature" }],
  ["wrong repository", { githubRepository: "attacker/repo" }],
  ["wrong called workflow path", { jobWorkflowFilePath: ".github/workflows/other.yml" }],
  ["wrong called workflow repository", { jobWorkflowRepository: "attacker/repo" }],
  ["malformed SHA", { githubWorkflowSha: "bad" }],
  ["different revisions", { jobWorkflowSha: "b".repeat(40) }]
]) {
  test("rejects " + name, () => {
    assert.equal(validateWorkerCallerContext({ ...valid, ...patch }).authorized, false);
  });
}
