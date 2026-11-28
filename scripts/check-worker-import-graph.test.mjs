import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectWorkerImportGraph } from "./check-worker-import-graph.mjs";

test("accepts an inert worker entrypoint and returns a bounded graph", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worker-graph-safe-"));
  try {
    const entry = path.join(root, "worker.mjs");
    fs.writeFileSync(entry, "export default { fetch() { return new Response('ok'); } };");
    assert.deepEqual(inspectWorkerImportGraph(entry, root), {
      entry: "worker.mjs", modules: ["worker.mjs"], edges: []
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a forbidden adapter reached through a transitive local import", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worker-graph-forbidden-"));
  try {
    const entry = path.join(root, "worker.mjs");
    fs.writeFileSync(entry, 'import "./bridge.mjs";');
    fs.writeFileSync(path.join(root, "bridge.mjs"), 'export { bindGitHubNextEvent } from "./github-next-event.mjs";');
    fs.writeFileSync(path.join(root, "github-next-event.mjs"), "export function bindGitHubNextEvent() {};");
    assert.throws(() => inspectWorkerImportGraph(entry, root), /WORKER_FORBIDDEN_ADAPTER_REACHABLE/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects dynamic, require and non-relative imports", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worker-graph-import-"));
  try {
    const entry = path.join(root, "worker.mjs");
    for (const source of [
      'const adapter = await import("./adapter.mjs");',
      'const adapter = require("./adapter.mjs");',
      'import "external-runtime";'
    ]) {
      fs.writeFileSync(entry, source);
      assert.throws(() => inspectWorkerImportGraph(entry, root));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


test("rejects a symlink import that resolves outside the Worker source root", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worker-graph-root-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "worker-graph-outside-"));
  try {
    const entry = path.join(root, "worker.mjs");
    const external = path.join(outside, "external.mjs");
    fs.writeFileSync(entry, 'import "./linked.mjs";');
    fs.writeFileSync(external, "export const external = true;");
    fs.symlinkSync(external, path.join(root, "linked.mjs"));
    assert.throws(() => inspectWorkerImportGraph(entry, root), /WORKER_IMPORT_ESCAPES_ROOT/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});
