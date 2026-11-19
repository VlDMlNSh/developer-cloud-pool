import { describe, expect, it } from "vitest";
import { projectionEnvelopeFromOutbox } from "../src/projection-envelope.mjs";
import { reconcileTerminalProjection } from "../src/projection-reconciler.mjs";

const outboxRow = () => ({
  outbox_id: "attempt-finalized:attempt-7",
  event_digest: "a".repeat(64),
  repository_id: "1445644538",
  issue_number: 88,
  target_sha: "b".repeat(40),
  profile: "dsh-headless-probe",
  lease_generation: 3,
  terminal_status: "succeeded"
});

class ProjectionApi {
  constructor() { this.comments = []; this.labels = ["triage", "pool:claimed"]; this.posts = 0; this.failLabels = false; }
  async listComments() { return this.comments.map(x => ({...x})); }
  async createComment(_repo, _issue, body) { this.posts++; this.comments.push({body}); }
  async listLabels() { return [...this.labels]; }
  async addLabels(_repo, _issue, labels) { this.labels.push(...labels.filter(x => !this.labels.includes(x))); }
  async removeLabel(_repo, _issue, label) { this.labels = this.labels.filter(x => x !== label); if (this.failLabels) throw new Error("projection unavailable"); }
}

describe("attempt outbox to GitHub projection contract", () => {
  it("maps one immutable terminal outbox row to a non-dispatch projection envelope", () => {
    const mapped = projectionEnvelopeFromOutbox(outboxRow());
    expect(mapped.decision).toBe("PROJECTION_ENVELOPE_READY");
    expect(mapped.dispatch).toBe(false);
    expect(mapped.envelope).toMatchObject({
      eventId: "attempt-finalized:attempt-7",
      payloadDigest: "a".repeat(64),
      repositoryId: 1445644538,
      issueNumber: 88,
      targetSha: "b".repeat(40),
      claimGeneration: 3,
      terminalOutcome: "succeeded",
      profile: "dsh-headless-probe",
      managedLabels: ["pool:probe-complete"]
    });
  });

  it("maps failed and abandoned attempts only to review labels", () => {
    for (const terminal_status of ["failed", "abandoned"]) {
      const mapped = projectionEnvelopeFromOutbox({...outboxRow(), terminal_status});
      expect(mapped.envelope.managedLabels).toEqual(["pool:needs-review"]);
    }
  });

  it("rejects malformed or ambiguous outbox identity without calling GitHub", async () => {
    const mapped = projectionEnvelopeFromOutbox({...outboxRow(), repository_id: "1.5"});
    expect(mapped).toMatchObject({decision: "DENY", dispatch: false});
    const api = new ProjectionApi();
    expect(api.posts).toBe(0);
  });

  it("reconciles the mapped outbox event idempotently without dispatch authority", async () => {
    const mapped = projectionEnvelopeFromOutbox(outboxRow());
    const api = new ProjectionApi();
    const first = await reconcileTerminalProjection(api, mapped.envelope, {allowPost: true});
    const second = await reconcileTerminalProjection(api, mapped.envelope, {allowPost: false});
    expect(first).toMatchObject({decision: "PROJECTION_VERIFIED", dispatch: false});
    expect(second).toMatchObject({decision: "PROJECTION_VERIFIED", dispatch: false});
    expect(api.posts).toBe(1);
    expect(api.labels).toEqual(["triage", "pool:probe-complete"]);
  });

  it("keeps projection failure retryable and does not expose task mutation operations", async () => {
    const mapped = projectionEnvelopeFromOutbox(outboxRow());
    const api = new ProjectionApi();
    api.failLabels = true;
    const result = await reconcileTerminalProjection(api, mapped.envelope, {allowPost: true});
    expect(result).toMatchObject({decision: "RETRYABLE", dispatch: false, projection_verified: false});
    expect(Object.keys(api).sort()).toEqual(["comments", "failLabels", "labels", "posts"]);
  });
});
