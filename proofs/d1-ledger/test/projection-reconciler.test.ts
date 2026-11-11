import { describe, expect, it } from "vitest";
import { reconcileTerminalProjection } from "../src/projection-reconciler.mjs";

const envelope = () => ({
  eventId: "attempt-finalized:attempt-7",
  payloadDigest: "a".repeat(64),
  repositoryId: 1445644538,
  issueNumber: 88,
  targetSha: "b".repeat(40),
  claimGeneration: 3,
  terminalOutcome: "succeeded",
  managedLabels: ["pool:probe-complete"]
});

class FakeGitHub {
  constructor() {
    this.comments = [];
    this.labels = ["triage", "pool:claimed"];
    this.postMode = "success";
    this.commentReads = 0;
    this.posts = 0;
  }
  async listComments() {
    this.commentReads += 1;
    return this.comments.map(comment => ({ ...comment }));
  }
  async createComment(_repo, _issue, body) {
    this.posts += 1;
    if (this.postMode === "lost-response") {
      this.comments.push({ body });
      throw new Error("simulated response lost after commit");
    }
    if (this.postMode === "delayed-visibility") {
      this.pendingComment = { body };
      return;
    }
    this.comments.push({ body });
  }
  async listLabels() { return [...this.labels]; }
  async addLabels(_repo, _issue, labels) {
    for (const label of labels) if (!this.labels.includes(label)) this.labels.push(label);
  }
  async removeLabel(_repo, _issue, label) {
    this.labels = this.labels.filter(value => value !== label);
  }
}

describe("fake GitHub terminal projection reconciliation", () => {
  it("recognizes a successful POST whose response was lost without posting twice", async () => {
    const api = new FakeGitHub();
    api.postMode = "lost-response";
    const result = await reconcileTerminalProjection(api, envelope(), { allowPost: true });
    expect(result.decision).toBe("PROJECTION_VERIFIED");
    expect(result.dispatch).toBe(false);
    expect(api.posts).toBe(1);
    expect(api.comments).toHaveLength(1);
    expect(api.labels).toEqual(["triage", "pool:probe-complete"]);
  });

  it("does not blindly repost while a successful marker is not yet visible", async () => {
    const api = new FakeGitHub();
    api.postMode = "delayed-visibility";
    const first = await reconcileTerminalProjection(api, envelope(), { allowPost: true });
    expect(first.decision).toBe("RETRYABLE");
    expect(first.reason).toBe("COMMENT_POST_NOT_YET_VISIBLE");
    expect(api.posts).toBe(1);
    api.comments.push(api.pendingComment);
    const second = await reconcileTerminalProjection(api, envelope(), { allowPost: false });
    expect(second.decision).toBe("PROJECTION_VERIFIED");
    expect(api.posts).toBe(1);
  });

  it("does not POST during reconciliation-only passes when the marker is absent", async () => {
    const api = new FakeGitHub();
    const result = await reconcileTerminalProjection(api, envelope(), { allowPost: false });
    expect(result.reason).toBe("EVENT_MARKER_NOT_VISIBLE");
    expect(api.posts).toBe(0);
  });

  it("rejects a marker with a conflicting payload digest", async () => {
    const api = new FakeGitHub();
    api.comments.push({ body: "<!-- pool-projection:attempt-finalized:attempt-7:" + "c".repeat(64) + " -->" });
    const result = await reconcileTerminalProjection(api, envelope());
    expect(result.decision).toBe("DENY");
    expect(result.reason).toBe("EVENT_MARKER_DIGEST_CONFLICT");
    expect(api.posts).toBe(0);
  });

  it("detects duplicate event markers and never acknowledges them", async () => {
    const api = new FakeGitHub();
    const marker = "<!-- pool-projection:attempt-finalized:attempt-7:" + "a".repeat(64) + " -->";
    api.comments.push({ body: marker }, { body: marker });
    const result = await reconcileTerminalProjection(api, envelope());
    expect(result.reason).toBe("DUPLICATE_EVENT_MARKERS");
    expect(result.projection_verified).toBe(false);
  });

  it("detects repeated markers inside a single comment", async () => {
    const api = new FakeGitHub();
    const marker = "<!-- pool-projection:attempt-finalized:attempt-7:" + "a".repeat(64) + " -->";
    api.comments.push({ body: marker + "\\n" + marker });
    const result = await reconcileTerminalProjection(api, envelope());
    expect(result.reason).toBe("DUPLICATE_EVENT_MARKERS");
    expect(result.projection_verified).toBe(false);
  });

  it("converges only pool:* labels and preserves unrelated human labels", async () => {
    const api = new FakeGitHub();
    api.comments.push({ body: "<!-- pool-projection:attempt-finalized:attempt-7:" + "a".repeat(64) + " -->" });
    api.labels = ["triage", "customer-visible", "pool:claimed", "pool:needs-review"];
    const result = await reconcileTerminalProjection(api, envelope());
    expect(result.decision).toBe("PROJECTION_VERIFIED");
    expect(api.labels.sort()).toEqual(["customer-visible", "pool:probe-complete", "triage"]);
  });

  it("fails closed when a managed-label mutation cannot be confirmed", async () => {
    const api = new FakeGitHub();
    api.comments.push({ body: "<!-- pool-projection:attempt-finalized:attempt-7:" + "a".repeat(64) + " -->" });
    api.removeLabel = async () => { throw new Error("simulated API failure"); };
    api.labels = ["triage", "pool:claimed"];
    const result = await reconcileTerminalProjection(api, envelope());
    expect(result.decision).toBe("RETRYABLE");
    expect(result.projection_verified).toBe(false);
  });

  it("rejects a terminal label inconsistent with the immutable outcome", async () => {
    const api = new FakeGitHub();
    const invalid = { ...envelope(), terminalOutcome: "failed" };
    const result = await reconcileTerminalProjection(api, invalid, { allowPost: true });
    expect(result.decision).toBe("DENY");
    expect(result.reason).toBe("INVALID_PROJECTION_ENVELOPE");
    expect(api.posts).toBe(0);
  });

  it("rejects unsafe labels and malformed immutable envelopes", async () => {
    const api = new FakeGitHub();
    const invalid = { ...envelope(), managedLabels: ["pool:claimed", "other:admin"] };
    const result = await reconcileTerminalProjection(api, invalid, { allowPost: true });
    expect(result.decision).toBe("DENY");
    expect(result.reason).toBe("INVALID_PROJECTION_ENVELOPE");
    expect(api.posts).toBe(0);
  });
});
