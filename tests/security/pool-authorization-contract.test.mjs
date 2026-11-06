import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const workerWorkflow = fs.readFileSync(
  path.join(root, ".github/workflows/pool-worker.yml"),
  "utf8"
);
const supervisorWorkflow = fs.readFileSync(
  path.join(root, ".github/workflows/pool-supervisor.yml"),
  "utf8"
);
const supervisorScript = fs.readFileSync(
  path.join(root, "scripts/pool-supervisor.mjs"),
  "utf8"
);

function workflowEventBlock(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => /^on:\s*$/.test(line));
  if (start < 0) return "";
  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || /^\s*$/.test(lines[end]) || /^#/.test(lines[end]))) end += 1;
  return lines.slice(start + 1, end).join("\n");
}

test("Worker is reusable-workflow-only", () => {
  const events = workflowEventBlock(workerWorkflow);
  assert.match(events, /^  workflow_call:\s*$/m);
  assert.doesNotMatch(events, /^  workflow_dispatch:/m);
});

test("Worker has no issue-write authority in any job", () => {
  assert.doesNotMatch(workerWorkflow, /^\s+issues:\s*write\s*$/m);
});

test("Worker has no issue mutation implementation", () => {
  assert.doesNotMatch(workerWorkflow, /\/issues\/\$\{?[^\s}]+\}?["']?\s*,?\s*\{\s*method:\s*["']PATCH["']/);
  assert.doesNotMatch(workerWorkflow, /\/issues\/[^\n]*\/comments["'][^\n]*POST/);
  assert.doesNotMatch(workerWorkflow, /Update task state and append audit comment/);
});

test("Supervisor has no privileged workflow_run trigger", () => {
  const events = workflowEventBlock(supervisorWorkflow);
  assert.doesNotMatch(events, /^  workflow_run:/m);
});

test("Supervisor does not grant Actions write permission", () => {
  assert.doesNotMatch(supervisorWorkflow, /^\s+actions:\s*write\s*$/m);
});

test("Supervisor invokes Worker through a statically declared reusable workflow, not REST dispatch", () => {
  assert.match(supervisorWorkflow, /^\s+uses:\s+\.\/\.github\/workflows\/pool-worker\.yml(?:@[^\s]+)?\s*$/m);
  assert.doesNotMatch(supervisorScript, /\/actions\/workflows\/[^\s"'`]+\/dispatch/);
  assert.doesNotMatch(supervisorScript, /workflow_dispatch/);
});

test("Supervisor never requeues an expired or failed claim using the same approval", () => {
  assert.doesNotMatch(supervisorScript, /pool:claimed["'][^\n]*pool:ready/);
  assert.doesNotMatch(supervisorScript, /pool:ready["'][^\n]*pool:claimed/);
  assert.doesNotMatch(supervisorScript, /POOL_CLAIM_LEASE_EXPIRED[\s\S]{0,500}pool:ready/);
  assert.match(supervisorScript, /pool:needs-review/);
});

test("Worker validates caller and callee identities using their distinct GitHub contexts", () => {
  assert.match(workerWorkflow, /github\.repository/);
  assert.match(workerWorkflow, /github\.repository_id/);
  assert.match(workerWorkflow, /github\.workflow_ref/);
  assert.match(workerWorkflow, /github\.workflow_sha/);
  assert.match(workerWorkflow, /job\.workflow_repository/);
  assert.match(workerWorkflow, /job\.workflow_file_path/);
  assert.match(workerWorkflow, /job\.workflow_sha/);
});
