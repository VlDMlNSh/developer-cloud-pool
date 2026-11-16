import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkflowPolicy, validateWorkflowSet } from "./validate-free-tier-policy.mjs";

const valid = `name: Valid
on:
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - run: node --version
`;

test("accepts standard Ubuntu runner with bounded timeout", () => {
  assert.deepEqual(validateWorkflowPolicy(valid), []);
});

test("accepts standard macOS runner for on-demand iOS simulator work", () => {
  const workflow = valid.replace("ubuntu-24.04", "macos-15");
  assert.deepEqual(validateWorkflowPolicy(workflow), []);
});

test("rejects larger and GPU runner labels", () => {
  for (const runner of ["ubuntu-24.04-8core", "ubuntu-latest-large", "gpu-linux"]) {
    assert.ok(validateWorkflowPolicy(valid.replace("ubuntu-24.04", runner)).some((item) => item.includes("runner is not an allowed")));
  }
});

test("rejects self-hosted and dynamic runner selectors", () => {
  for (const runner of ["[self-hosted, linux]", "${{ matrix.runner }}", "my-runner-group"]) {
    assert.ok(validateWorkflowPolicy(valid.replace("ubuntu-24.04", runner)).some((item) => item.includes("runner is not an allowed")));
  }
});

test("rejects missing timeout and timeout above 30 minutes", () => {
  assert.ok(validateWorkflowPolicy(valid.replace("    timeout-minutes: 5\n", "")).some((item) => item.includes("timeout-minutes")));
  assert.ok(validateWorkflowPolicy(valid.replace("timeout-minutes: 5", "timeout-minutes: 31")).some((item) => item.includes("timeout-minutes")));
});

test("rejects custom images and containers", () => {
  const workflow = valid.replace("    timeout-minutes: 5", "    timeout-minutes: 5\n    container: node:latest");
  assert.ok(validateWorkflowPolicy(workflow).some((item) => item.includes("custom job containers/images")));
});

test("requires bounded matrix parallelism", () => {
  const unbounded = valid.replace("    steps:", "    strategy:\n      matrix:\n        node: [20, 22]\n    steps:");
  assert.ok(validateWorkflowPolicy(unbounded).some((item) => item.includes("matrix jobs require max-parallel")));
  const bounded = unbounded.replace("      matrix:", "      max-parallel: 2\n      matrix:");
  assert.deepEqual(validateWorkflowPolicy(bounded), []);
});

test("rejects explicit paid fallback", () => {
  const workflow = valid.replace("jobs:", "model:\n  paid-fallback: true\njobs:");
  assert.ok(validateWorkflowPolicy(workflow).some((item) => item.includes("paid fallback")));
});

test("checks every workflow in a set", () => {
  const errors = validateWorkflowSet({ "a.yml": valid, "b.yml": valid.replace("ubuntu-24.04", "ubuntu-24.04-large") });
  assert.equal(errors.length, 1);
});
