import test from "node:test";
import assert from "node:assert/strict";
import { envelopeDigest } from "../../scripts/pool-finalizer.mjs";
import { finalizeWithTransport } from "../../scripts/pool-finalizer-protocol.mjs";

const body = [
  "### Target SHA",
  "0123456789abcdef0123456789abcdef01234567",
  "",
  "### Worker profile",
  "DSH headless probe"
].join("\n");
const expected = {
  issueNumber: 73,
  envelopeDigest: envelopeDigest(body),
  targetSha: "0123456789abcdef0123456789abcdef01234567",
  runId: "42510000123",
  runAttempt: "2",
  workerResult: "success"
};
const generation = "pool:claim-" + expected.runId + "-" + expected.runAttempt;
const marker = "<!-- pool-finalizer:" + expected.runId + ":" + expected.runAttempt + ":" +
  expected.envelopeDigest + " -->";

class FakeFinalizerTransport {
  constructor() {
    this.issue = {
      number: expected.issueNumber,
      state: "open",
      body,
      labels: ["triage", "pool:claimed", generation]
    };
    this.comments = [];
    this.posts = 0;
    this.patches = 0;
    this.postMode = "success";
    this.patchMode = "success";
    this.pendingComment = null;
    this.concurrentHumanLabel = null;
  }
  async readIssue() {
    return structuredClone(this.issue);
  }
  async listComments() {
    return this.comments.map(comment => ({ ...comment }));
  }
  async createComment(commentBody) {
    this.posts += 1;
    if (this.postMode === "fail-before-commit") throw new Error("POST rejected before commit");
    if (this.postMode === "lost-response") {
      this.comments.push({ body: commentBody });
      throw new Error("POST committed but response was lost");
    }
    if (this.postMode === "delayed-visibility") {
      this.pendingComment = { body: commentBody };
      return;
    }
    this.comments.push({ body: commentBody });
  }
  async replaceLabels(labels) {
    this.patches += 1;
    if (this.concurrentHumanLabel) this.issue.labels.push(this.concurrentHumanLabel);
    this.issue.labels = [...labels];
    if (this.patchMode === "lost-response") throw new Error("PATCH committed but response was lost");
    if (this.patchMode === "fail-before-commit") throw new Error("PATCH rejected before commit");
    return structuredClone(this.issue);
  }
  api() {
    return {
      readIssue: () => this.readIssue(),
      listComments: () => this.listComments(),
      createComment: body => this.createComment(body),
      replaceLabels: labels => this.replaceLabels(labels)
    };
  }
}

test("POST failure before commit leaves task claimed and never writes terminal labels", async () => {
  const transport = new FakeFinalizerTransport();
  transport.postMode = "fail-before-commit";
  const result = await finalizeWithTransport(transport.api(), expected);
  assert.equal(result.decision, "RETRYABLE");
  assert.equal(result.reason, "AUDIT_MARKER_NOT_VISIBLE");
  assert.equal(transport.patches, 0);
  assert.ok(transport.issue.labels.includes("pool:claimed"));
});

test("lost POST response is reconciled by marker read-back without a duplicate POST", async () => {
  const transport = new FakeFinalizerTransport();
  transport.postMode = "lost-response";
  const result = await finalizeWithTransport(transport.api(), expected);
  assert.equal(result.decision, "FINALIZED");
  assert.equal(transport.posts, 1);
  assert.equal(transport.comments.length, 1);
  assert.ok(transport.issue.labels.includes("pool:probe-complete"));
  assert.ok(!transport.issue.labels.includes("pool:claimed"));
});

test("lost PATCH response is resolved by authoritative issue read-back", async () => {
  const transport = new FakeFinalizerTransport();
  transport.patchMode = "lost-response";
  const result = await finalizeWithTransport(transport.api(), expected);
  assert.equal(result.decision, "FINALIZED");
  assert.equal(transport.patches, 1);
  assert.ok(transport.issue.labels.includes("pool:probe-complete"));
});

test("retry after terminalization is idempotent and does not POST or PATCH again", async () => {
  const transport = new FakeFinalizerTransport();
  transport.comments.push({ body: "**POOL_WORKER_COMPLETE**\n" + marker });
  transport.issue.labels = ["triage", "pool:probe-complete"];
  const first = await finalizeWithTransport(transport.api(), expected);
  const second = await finalizeWithTransport(transport.api(), expected);
  assert.equal(first.decision, "ALREADY_FINALIZED");
  assert.equal(second.decision, "ALREADY_FINALIZED");
  assert.equal(transport.posts, 0);
  assert.equal(transport.patches, 0);
});

test("delayed marker visibility is retryable and reconciliation-only retry does not POST again", async () => {
  const transport = new FakeFinalizerTransport();
  transport.postMode = "delayed-visibility";
  const first = await finalizeWithTransport(transport.api(), expected);
  assert.equal(first.decision, "RETRYABLE");
  assert.equal(first.reason, "AUDIT_MARKER_NOT_VISIBLE");
  assert.equal(transport.patches, 0);
  transport.comments.push(transport.pendingComment);
  const second = await finalizeWithTransport(transport.api(), expected);
  assert.equal(second.decision, "FINALIZED");
  assert.equal(transport.posts, 1);
});

test("duplicate deterministic audit markers fail closed", async () => {
  const transport = new FakeFinalizerTransport();
  transport.comments.push({ body: marker }, { body: marker });
  const result = await finalizeWithTransport(transport.api(), expected);
  assert.equal(result.decision, "DENY");
  assert.equal(result.reason, "DUPLICATE_FINALIZER_MARKERS");
  assert.equal(transport.patches, 0);
});

test("documents the unresolved non-CAS race: concurrent human label can be overwritten", async () => {
  const transport = new FakeFinalizerTransport();
  transport.concurrentHumanLabel = "human:concurrent";
  const result = await finalizeWithTransport(transport.api(), expected);
  assert.equal(result.decision, "FINALIZED");
  assert.ok(!transport.issue.labels.includes("human:concurrent"));
  // The test intentionally demonstrates why a successful read-back cannot
  // prove no concurrent label was lost between GET and GitHub's label PATCH.
});
