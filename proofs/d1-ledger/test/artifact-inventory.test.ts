import { describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { collectArtifactInventory } from "../src/artifact-inventory.mjs";

const taskKey = "d".repeat(64);
const uploadId = "inventory_upload_0001";
const objectKey = `ingest/${taskKey}/${uploadId}`;
const uploaded = new Date("2026-11-01T00:00:00.000Z");

function object(key = objectKey, version = "v1") {
  return { key, version, size: 5, uploaded, customMetadata: { taskKey, uploadId } };
}
function fakeDb(results, success = true) {
  const all = vi.fn(async () => ({ success, results }));
  const bind = vi.fn(() => ({ all }));
  const prepare = vi.fn(() => ({ bind }));
  return { db: { prepare }, prepare, bind, all };
}
function fakeBucket(pages) {
  const calls = [];
  return {
    calls,
    bucket: {
      list: vi.fn(async (options) => {
        calls.push(options);
        const page = pages.shift();
        if (page instanceof Error) throw page;
        return page;
      })
    }
  };
}

describe("read-only R2/D1 artifact inventory", () => {
  it("follows opaque cursors even when a page is short or empty", async () => {
    const { bucket, calls } = fakeBucket([
      { objects: [], truncated: true, cursor: "opaque-1" },
      { objects: [object()], truncated: true, cursor: "opaque-2" },
      { objects: [], truncated: false }
    ]);
    const { db } = fakeDb([{ record_type: "task", task_key: taskKey, task_state: "dead" }]);
    const result = await collectArtifactInventory(bucket, db, { pageLimit: 2 });
    expect(result).toMatchObject({
      decision: "INVENTORY_COMPLETE", objectListingComplete: true,
      referenceSnapshotComplete: true, crossStoreSnapshotConsistent: false,
      deletionPermitted: false, counts: { objects: 1, pagesRequested: 3 }
    });
    expect(calls.map((call) => call.cursor ?? null)).toEqual([null, "opaque-1", "opaque-2"]);
    expect(calls.every((call) => call.prefix === "ingest/" &&
      call.include.includes("customMetadata") && call.limit === 2)).toBe(true);
  });

  it("fails closed when a cursor is missing or repeats", async () => {
    for (const pages of [
      [{ objects: [object()], truncated: true }],
      [
        { objects: [object()], truncated: true, cursor: "same" },
        { objects: [], truncated: true, cursor: "same" }
      ]
    ]) {
      const { bucket } = fakeBucket(pages);
      const { db } = fakeDb([]);
      const result = await collectArtifactInventory(bucket, db);
      expect(result.objectListingComplete).toBe(false);
      expect(result.deletionPermitted).toBe(false);
      expect(result.reasons).toContain("R2_CURSOR_MISSING_OR_REPEATED");
    }
  });

  it("fails closed when the page budget is exhausted", async () => {
    const { bucket } = fakeBucket([
      { objects: [object()], truncated: true, cursor: "p1" },
      { objects: [], truncated: true, cursor: "p2" }
    ]);
    const { db } = fakeDb([]);
    const result = await collectArtifactInventory(bucket, db, { maxPages: 2 });
    expect(result).toMatchObject({
      decision: "INVENTORY_INCOMPLETE", objectListingComplete: false,
      deletionPermitted: false, reasons: ["R2_PAGE_LIMIT_REACHED"]
    });
  });

  it("rejects duplicate keys across pages rather than claiming a complete listing", async () => {
    const { bucket } = fakeBucket([
      { objects: [object()], truncated: true, cursor: "p1" },
      { objects: [object()], truncated: false }
    ]);
    const { db } = fakeDb([]);
    const result = await collectArtifactInventory(bucket, db);
    expect(result.objectListingComplete).toBe(false);
    expect(result.reasons).toContain("R2_DUPLICATE_OBJECT_KEY_ACROSS_PAGES");
    expect(result.objects).toHaveLength(1);
  });

  it("fails closed on invalid R2 object metadata and list exceptions", async () => {
    const invalid = { ...object(), uploaded: "not-a-date" };
    for (const pages of [
      [{ objects: [invalid], truncated: false }],
      [new Error("R2 unavailable")]
    ]) {
      const { bucket } = fakeBucket(pages);
      const { db } = fakeDb([]);
      const result = await collectArtifactInventory(bucket, db);
      expect(result.objectListingComplete).toBe(false);
      expect(result.deletionPermitted).toBe(false);
    }
  });

  it("maps result/outbox/task records from one bounded D1 statement", async () => {
    const rows = [
      { record_type: "result", task_key: taskKey, object_key: objectKey, object_version: "v1" },
      { record_type: "outbox", task_key: taskKey, object_key: objectKey, object_version: "v1" },
      { record_type: "task", task_key: taskKey, task_state: "dead" }
    ];
    const { db, prepare, bind } = fakeDb(rows);
    const { bucket } = fakeBucket([{ objects: [object()], truncated: false }]);
    const result = await collectArtifactInventory(bucket, db);
    expect(result).toMatchObject({
      decision: "INVENTORY_COMPLETE",
      resultReferences: [{ objectKey, objectVersion: "v1", taskKey }],
      outboxReferences: [{ objectKey, objectVersion: "v1", taskKey }],
      tasks: [{ taskKey, state: "dead" }],
      deletionPermitted: false
    });
    expect(prepare.mock.calls[0][0]).toContain("json_each(?)");
    expect(prepare.mock.calls[0][0]).toContain("UNION ALL");
    expect(bind.mock.calls[0][0]).toBe(JSON.stringify([taskKey]));
    expect(bind.mock.calls[0][1]).toBe(2501);
  });

  it("fails closed on oversized, failed, or malformed D1 reference snapshots", async () => {
    const cases = [
      fakeDb(Array.from({ length: 3 }, () => ({}))),
      fakeDb([], false),
      fakeDb([{ record_type: "result", task_key: taskKey, object_key: objectKey, object_version: null }])
    ];
    for (const { db } of cases) {
      const { bucket } = fakeBucket([{ objects: [object()], truncated: false }]);
      const result = await collectArtifactInventory(bucket, db, { maxD1Rows: 2 });
      expect(result.referenceSnapshotComplete).toBe(false);
      expect(result.deletionPermitted).toBe(false);
    }
  });

  it("enforces hard bounds and a fixed namespace", async () => {
    const { db } = fakeDb([]);
    const { bucket } = fakeBucket([]);
    for (const options of [
      { prefix: "other/" }, { pageLimit: 1001 }, { maxPages: 101 },
      { maxObjects: 10001 }, { maxD1Rows: 3001 }
    ]) {
      const result = await collectArtifactInventory(bucket, db, options);
      expect(result).toMatchObject({
        decision: "INVENTORY_INCOMPLETE",
        reasons: ["INVALID_INVENTORY_CONFIGURATION"],
        deletionPermitted: false
      });
    }
  });

  it("executes the inventory query against local D1 and R2 bindings", async () => {
    const now = Math.floor(Date.now() / 1000);
    await env.POOL_DB.prepare(
      "INSERT INTO pool_tasks(task_key,repository_id,issue_number,target_sha,profile,state,created_at,updated_at) VALUES(?,?,?,?,?,'dead',?,?)"
    ).bind(taskKey, "20002", 7001, "a".repeat(40), "dsh-headless-probe", now, now).run();
    await env.ARTIFACTS.put(objectKey, "bytes!", {
      customMetadata: { taskKey, uploadId }
    });
    const result = await collectArtifactInventory(env.ARTIFACTS, env.POOL_DB);
    expect(result).toMatchObject({
      decision: "INVENTORY_COMPLETE",
      objectListingComplete: true,
      referenceSnapshotComplete: true,
      crossStoreSnapshotConsistent: false,
      deletionPermitted: false
    });
    expect(result.objects.some((item) => item.key === objectKey)).toBe(true);
    expect(result.tasks).toContainEqual({ taskKey, state: "dead" });
  });
});
