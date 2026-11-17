#!/usr/bin/env node
/**
 * Validate repository-relative Markdown links in the current normative
 * architecture surface. Historical Context Window sections are intentionally
 * excluded because they preserve dated snapshots and legacy references.
 */
import fs from "node:fs";
import path from "node:path";

const files = [
  "README.md",
  "docs/architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md",
  "docs/architecture/CLOUD-POOL-UNIFIED-REALIZATION-MAP-1.0.md",
  "docs/decisions/2026-11-17-cloud-pool-architecture-consolidation-adr.md",
  "docs/reports/2026-11-17-cloud-pool-architecture-consolidation.md",
  "docs/checkpoints/2026-11-17-cloud-pool-architecture-consolidation.md",
];

const failures = [];
let checked = 0;
for (const file of files) {
  if (!fs.existsSync(file)) {
    failures.push(`Missing required normative document: ${file}`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of source.matchAll(linkPattern)) {
    const raw = match[1].trim().replace(/^<|>$/g, "");
    const target = raw.split(/[?#]/, 1)[0];
    if (!target || /^(?:https?:|mailto:|#|\/\/)/i.test(target)) continue;
    checked += 1;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) failures.push(`${file}: broken relative link: ${raw}`);
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Normative Markdown link validation passed: ${files.length} files, ${checked} repository-relative links.`);
