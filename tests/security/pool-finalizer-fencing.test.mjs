import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  claimGenerationLabel,
  envelopeDigest,
  extractTargetSha,
  buildFinalizationPlan
} from "../../scripts/pool-finalizer.mjs";

const body = [
  "### Target SHA",
  "0123456789abcdef0123456789abcdef01234567",
  "",
  "### Worker profile",
  "DSH headless probe"
].join("\n");
const runId = "42510000123";
const runAttempt = "2";
const generation = claimGenerationLabel(runId, runAttempt);
const expected = {
  issueNumber: 73,
  envelopeDigest: envelopeDigest(body),
  targetSha: "0123456789abcdef0123456789abcdef01234567",
  runId,
  runAttempt,
  workerResult: "success"
};
function issue(overrides = {}) {
  return {
    number: 73,
    state: "open",
    body,
    labels: [
      { name: "triage" },
      { name: "pool:claimed" },
      { name: generation }
    ],
    ...overrides
  };
}

test("finalizer accepts only the exact open issue envelope and current claim generation", () => {
  const plan = buildFinalizationPlan(issue(), expected);
  assert.equal(plan.terminalLabel, "pool:probe-complete");
  assert.deepEqual(plan.labels, ["triage", "pool:probe-complete"]);
});

test("finalizer independently binds target SHA to the immutable task envelope", () => {
  assert.throws(() => buildFinalizationPlan(issue(), {
    ...expected,
    targetSha: "1123456789abcdef0123456789abcdef01234567"
  }), /target sha/i);
  assert.equal(extractTargetSha(body), expected.targetSha);
});

test("missing, duplicate, or malformed Target SHA fields fail closed", () => {
  assert.throws(() => extractTargetSha("### Worker profile\nDSH headless probe"), /exactly one/i);
  assert.throws(() => extractTargetSha(body + "\n\n### Target SHA\n" + expected.targetSha), /exactly one/i);
  assert.throws(() => extractTargetSha(body.replace(expected.targetSha, "bad")), /invalid/i);
});

test("body mutation invalidates the immutable task envelope", () => {
  assert.throws(() => buildFinalizationPlan(issue({ body: body + "\nchanged" }), expected), /envelope/i);
});

test("closed issue cannot be finalized", () => {
  assert.throws(() => buildFinalizationPlan(issue({ state: "closed" }), expected), /open/i);
});

test("a different Supervisor run or attempt cannot finalize a newer claim", () => {
  const stale = { ...expected, runId: "42510000122" };
  assert.throws(() => buildFinalizationPlan(issue(), stale), /generation/i);
  const staleAttempt = { ...expected, runAttempt: "1" };
  assert.throws(() => buildFinalizationPlan(issue(), staleAttempt), /generation/i);
});

test("stale claim without the expected generation is rejected", () => {
  assert.throws(() => buildFinalizationPlan(issue({
    labels: [{ name: "pool:claimed" }, { name: "pool:claim-42509999999-1" }]
  }), expected), /generation/i);
});

test("duplicate or conflicting claim generations are rejected", () => {
  assert.throws(() => buildFinalizationPlan(issue({
    labels: [{ name: "pool:claimed" }, { name: generation }, { name: "pool:claim-42510000124-1" }]
  }), expected), /generation/i);
});

test("duplicate finalization is rejected after the claim state has been consumed", () => {
  assert.throws(() => buildFinalizationPlan(issue({
    labels: [{ name: "pool:probe-complete" }, { name: generation }]
  }), expected), /claimed/i);
});

test("ambiguous issue identity and invalid expected digest fail closed", () => {
  assert.throws(() => buildFinalizationPlan(issue({ number: 74 }), expected), /issue/i);
  assert.throws(() => buildFinalizationPlan(issue(), { ...expected, envelopeDigest: "bad" }), /digest/i);
});

test("envelope digest is deterministic SHA-256", () => {
  assert.equal(envelopeDigest(body), createHash("sha256").update(body, "utf8").digest("hex"));
});
