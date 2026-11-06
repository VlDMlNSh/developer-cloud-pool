import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync(".github/workflows/pool-worker.yml", "utf8");
const supervisor = fs.readFileSync(".github/workflows/pool-supervisor.yml", "utf8");
const script = fs.readFileSync("scripts/pool-supervisor.mjs", "utf8");

function eventBlock(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => /^on:\s*$/.test(line));
  if (start < 0) return "";
  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || /^\s*$/.test(lines[end]) || /^#/.test(lines[end]))) end++;
  return lines.slice(start + 1, end).join("\n");
}

test("Worker is reusable-workflow-only", () => {
  const events = eventBlock(worker);
  assert.match(events, /^  workflow_call:/m);
  assert.doesNotMatch(events, /^  workflow_dispatch:/m);
});

test("Worker has no issue-write authority or mutation implementation", () => {
  assert.doesNotMatch(worker, /^\s+issues:\s*write\s*$/m);
  assert.doesNotMatch(worker, /method:\s*["'](?:PATCH|POST)["']/);
  assert.doesNotMatch(worker, /\/issues\/[^\n]*\/comments/);
});

test("Supervisor has no privileged workflow_run or Actions write", () => {
  const events = eventBlock(supervisor);
  assert.doesNotMatch(events, /^  workflow_run:/m);
  assert.doesNotMatch(supervisor, /^\s+actions:\s*write\s*$/m);
});

test("Supervisor statically calls Worker as reusable workflow", () => {
  assert.match(supervisor, /^\s+uses:\s+\.\/\.github\/workflows\/pool-worker\.yml\s*$/m);
  assert.doesNotMatch(supervisor, /\/actions\/workflows\/[^\s"']+\/dispatch/);
  assert.doesNotMatch(script, /workflow_dispatch|\/actions\/workflows\/[^\s"']+\/dispatch/);
});

test("Supervisor requires both dispatch and authorization acceptance gates", () => {
  assert.match(supervisor, /POOL_DISPATCH_ENABLED: \$\{\{ vars\.POOL_DISPATCH_ENABLED \}\}/);
  assert.match(supervisor, /POOL_AUTHORIZATION_CONTRACT_ACCEPTED: \$\{\{ vars\.POOL_AUTHORIZATION_CONTRACT_ACCEPTED \}\}/);
  assert.match(script, /!protectedDefaultRef \\|\\| !dispatchEnabled \\|\\| !authorizationAccepted/);
});

test("Supervisor claims one task and verifies exact read-back before emitting outputs", () => {
  assert.match(script, /const issue = candidates\[0\]/);
  assert.match(script, /await replaceLabels\(issue, \["pool:ready"\], \["pool:claimed"\]\)/);
  assert.match(script, /Claim read-back was ambiguous/);
  assert.match(script, /setOutput\("task_issue"/);
});

test("Failed or ambiguous claims are not automatically requeued", () => {
  assert.doesNotMatch(script, /pool:claimed["'][^\n]*pool:ready/);
  assert.doesNotMatch(script, /POOL_CLAIM_LEASE_EXPIRED/);
  assert.match(supervisor, /pool:needs-review/);
});

test("Worker validates caller and reusable callee identity separately", () => {
  assert.match(worker, /github\.workflow_ref/);
  assert.match(worker, /github\.workflow_sha/);
  assert.match(worker, /job\.workflow_repository/);
  assert.match(worker, /job\.workflow_file_path/);
  assert.match(worker, /job\.workflow_sha/);
});
