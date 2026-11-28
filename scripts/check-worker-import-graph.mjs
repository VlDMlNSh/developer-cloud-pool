import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(ROOT, "proofs/d1-ledger/src/worker.mjs");
const FORBIDDEN = new Set([
  "github-next-event.mjs",
  "owner-next-envelope.mjs",
  "owner-next-api-envelope.mjs",
  "owner-next-api-attestation-envelope.mjs",
  "owner-next-controller.mjs"
]);

export function inspectWorkerImportGraph(entryPath, rootPath = path.dirname(entryPath)) {
  const root = path.resolve(rootPath);
  const entry = path.resolve(entryPath);
  const queue = [entry];
  const visited = new Set();
  const edges = [];

  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    if (!current.startsWith(root + path.sep) && current !== root) {
      throw new Error("WORKER_IMPORT_ESCAPES_ROOT: " + path.relative(root, current));
    }
    visited.add(current);
    const source = fs.readFileSync(current, "utf8");
    if (/\\b(?:import\\s*\\(|require\\s*\\()/.test(source)) {
      throw new Error("WORKER_DYNAMIC_OR_REQUIRE_IMPORT_FORBIDDEN: " + path.relative(root, current));
    }
    const imports = [
      ...source.matchAll(/\\b(?:import|export)\\s+(?:[^;"']*?\\s+from\\s*)?["']([^"']+)["']/g)
    ].map(match => match[1]);
    for (const specifier of imports) {
      if (!specifier.startsWith(".")) {
        throw new Error("WORKER_NONRELATIVE_IMPORT_FORBIDDEN: " + specifier);
      }
      const resolved = path.resolve(path.dirname(current), specifier);
      const candidates = path.extname(resolved)
        ? [resolved]
        : [resolved + ".mjs", resolved + ".js", resolved + ".ts", path.join(resolved, "index.mjs")];
      const target = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error("WORKER_IMPORT_TARGET_MISSING: " + specifier);
      if (FORBIDDEN.has(path.basename(target))) {
        throw new Error("WORKER_FORBIDDEN_ADAPTER_REACHABLE: " + path.relative(root, target));
      }
      edges.push({ from: path.relative(root, current), to: path.relative(root, target) });
      queue.push(target);
    }
  }
  return { entry: path.relative(root, entry), modules: [...visited].map(file => path.relative(root, file)), edges };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const graph = inspectWorkerImportGraph(ENTRY, ROOT);
    process.stdout.write("WORKER_IMPORT_GRAPH=PASS modules=" + graph.modules.length + " edges=" + graph.edges.length + "\\n");
  } catch (error) {
    process.stderr.write((error?.message || "WORKER_IMPORT_GRAPH_FAILED") + "\\n");
    process.exitCode = 1;
  }
}
