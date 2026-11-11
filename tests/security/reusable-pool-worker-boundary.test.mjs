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
  assert.ok(script.includes("!protectedDefaultRef") && script.includes("!dispatchEnabled") && script.includes("!authorizationAccepted"));
});

test("Supervisor claims one task and verifies exact read-back before emitting outputs", () => {
  assert.match(script, /const issue = candidates\[0\]/);
  assert.match(script, /await replaceLabels\(issue, \["pool:ready"\], \["pool:claimed", claimGeneration\]\)/);
  assert.match(script, /Claim read-back was ambiguous/);
  assert.match(script, /setOutput\("task_issue"/);
});

test("Failed or ambiguous claims are not automatically requeued", () => {
  assert.doesNotMatch(script, /replaceLabels\([^,\n]+,\s*\["pool:claimed"\],\s*\["pool:ready"\]\)/);
  assert.doesNotMatch(script, /POOL_CLAIM_LEASE_EXPIRED/);
  assert.match(finalizerPolicy, /pool:needs-review/);
});

test("Worker validates caller and reusable callee identity separately", () => {
  assert.match(worker, /github\.workflow_ref/);
  assert.match(worker, /github\.workflow_sha/);
  assert.match(worker, /job\.workflow_repository/);
  assert.match(worker, /job\.workflow_file_path/);
  assert.match(worker, /job\.workflow_sha/);
  assert.ok(worker.includes("          CALLEE_REPOSITORY: ${{ job.workflow_repository }}"));
  assert.ok(worker.includes("          CALLEE_FILE_PATH: ${{ job.workflow_file_path }}"));
  assert.ok(worker.includes("          CALLEE_WORKFLOW_SHA: ${{ job.workflow_sha }}"));
  assert.doesNotMatch(worker, /^      CALLEE_(?:REPOSITORY|FILE_PATH|WORKFLOW_SHA):/m);
  assert.match(worker, /EXPECTED_REPOSITORY_ID: "1445644538"/);
  assert.match(worker, /CALLER_WORKFLOW_SHA !== e.CALLEE_WORKFLOW_SHA/);
});


test("Worker rejects conflicting or duplicate managed task states", () => {
  assert.match(worker, /const managedStates = \["pool:ready", "pool:claimed", "pool:probe-complete", "pool:needs-review", "pool:invalid"\]/);
  assert.match(worker, /activeStates\.length !== 1 \|\| activeStates\[0\] !== "pool:claimed"/);
});

const finalizerPolicy = fs.readFileSync("scripts/pool-finalizer.mjs", "utf8");
const finalizerRunner = fs.readFileSync("scripts/pool-finalizer-runner.mjs", "utf8");
const finalizerProtocol = fs.readFileSync("scripts/pool-finalizer-protocol.mjs", "utf8");

test("Supervisor exports immutable envelope and unique run-attempt claim generation", () => {
  assert.match(script, /createHash\("sha256"\)/);
  assert.match(script, /pool:claim-.*runId.*runAttempt/);
  assert.match(script, /setOutput\("envelope_digest"/);
  assert.match(script, /setOutput\("claim_generation"/);
});

test("Worker requires the exact claim generation before executing the probe", () => {
  assert.match(worker, /claim_generation:/);
  assert.match(worker, /CLAIM_GENERATION: \$\{\{ inputs\.claim_generation \}\}/);
  assert.match(worker, /generations\[0\] !== e\.CLAIM_GENERATION/);
  assert.match(worker, /createHash\("sha256"\)/);
  assert.match(worker, /digest\("hex"\) !== e\.ENVELOPE_DIGEST/);
  assert.match(supervisor, /envelope_digest: \$\{\{ needs\.reconcile\.outputs\.envelope_digest \}\}/);
  assert.match(supervisor, /claim_generation: \$\{\{ needs\.reconcile\.outputs\.claim_generation \}\}/);
});

test("Finalizer binds issue, body digest, open state, unique claim generation and claimed state", () => {
  assert.match(finalizerPolicy, /issue\.state !== "open"/);
  assert.match(finalizerPolicy, /envelopeDigest\(String\(issue\.body/);
  assert.match(finalizerPolicy, /generations\.length !== 1/);
  assert.match(finalizerPolicy, /states\.length !== 1 \|\| states\[0\] !== "pool:claimed"/);
  assert.match(finalizerProtocol, /buildFinalizationPlan\(issue, expected\)/);
  assert.match(finalizerProtocol, /await api\.replaceLabels\(plan\.labels\)/);
  assert.match(finalizerProtocol, /terminalReadback\(readback, expected, plan, humanLabels\)/);
  assert.match(finalizerProtocol, /does not provide an atomic compare-and-swap/);
  assert.match(finalizerRunner, /finalizeWithTransport\(api, expected\)/);
});
