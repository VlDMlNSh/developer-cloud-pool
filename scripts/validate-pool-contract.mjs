import fs from "node:fs";

const failures = [];
const pass = (message) => console.log("PASS " + message);
const fail = (message) => failures.push(message);
const read = (path) => {
  try { return fs.readFileSync(path, "utf8"); }
  catch { fail("Required file is missing: " + path); return ""; }
};

const worker = read(".github/workflows/pool-worker.yml");
const supervisor = read(".github/workflows/pool-supervisor.yml");
const supervisorScript = read("scripts/pool-supervisor.mjs");
const finalizerPolicy = read("scripts/pool-finalizer.mjs");
const finalizerRunner = read("scripts/pool-finalizer-runner.mjs");
const dsh = read(".github/workflows/dsh-runtime-evaluation.yml");
const resource = read(".github/workflows/runner-resource-probe.yml");
const validation = read(".github/workflows/reusable-pool-worker-boundary-validation.yml");

const workflows = [
  ".github/workflows/pool-contract-validation.yml",
  ".github/workflows/pool-supervisor.yml",
  ".github/workflows/pool-worker.yml",
  ".github/workflows/reusable-pool-worker-boundary-validation.yml",
  ".github/workflows/dsh-runtime-evaluation.yml",
  ".github/workflows/runner-resource-probe.yml"
].map((path) => [path, read(path)]);

for (const [path, source] of workflows) {
  const lines = source.split(/\r?\n/);
  let runIndent = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const indent = (line.match(/^ */) || [""])[0].length;
    if (runIndent !== null && line.trim() !== "" && indent <= runIndent) runIndent = null;
    if (/^\s*run:\s*\|\s*(#.*)?$/.test(line)) {
      runIndent = indent;
      continue;
    }
    if (runIndent !== null && /\$\{\{\s*inputs\./.test(line)) {
      fail(path + ":" + (index + 1) + " interpolates workflow input directly into a shell run block");
    }
  }
  for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)) {
    const target = match[1];
    if (target.startsWith("./.github/workflows/")) {
      if (target !== "./.github/workflows/pool-worker.yml") fail(path + " references an unexpected local reusable workflow: " + target);
      continue;
    }
    if (!/@[0-9a-f]{40}$/.test(target)) fail(path + " uses an action that is not pinned to a full commit SHA: " + target);
  }
}
if (failures.length === 0) pass("workflow inputs are not interpolated into shell run blocks");
if (workflows.every(([, source]) => [...source.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)].every((m) => m[1].startsWith("./.github/workflows/") || /@[0-9a-f]{40}$/.test(m[1])))) {
  pass("all external Actions references are pinned; local reusable workflow is statically declared");
}

if (!/^permissions:\s*\{\s*\}/m.test(worker)) fail("Worker must default to permissions: {}");
if (!/^on:\s*\n\s+workflow_call:/m.test(worker)) fail("Worker must expose workflow_call");
if (/^\s+workflow_dispatch:/m.test(worker)) fail("Worker must not expose workflow_dispatch");
if (!/  validate:[\s\S]*?permissions:\s*\n\s+issues:\s*read/.test(worker)) fail("Worker validation job must have issues: read");
if (!/  probe:[\s\S]*?permissions:\s*\n\s+contents:\s*read/.test(worker)) fail("Worker probe job must have contents: read");
if (/^\s+issues:\s*write\s*$/m.test(worker)) fail("Worker must not have issues: write");
if (/method:\s*["'](?:PATCH|POST)["']/.test(worker) || /\/issues\/[^\n]*\/comments/.test(worker)) fail("Worker must not mutate issues or post comments");
if (/^  report:/m.test(worker)) fail("Worker must not contain a privileged report job");
if (!worker.includes("persist-credentials: false")) fail("Worker checkout must not persist Git credentials");
if (!/PROFILE !== "dsh-headless-probe"/.test(worker)) fail("Worker must enforce the exact allowlisted DSH profile");
if (!/CALLER_REPOSITORY_ID: \$\{\{ github\.repository_id \}\}/.test(worker)) fail("Worker must inspect caller repository ID");
if (!/EXPECTED_REPOSITORY_ID: "1445644538"/.test(worker)) fail("Worker must pin the expected repository ID");
if (!/CALLER_WORKFLOW_REF: \$\{\{ github\.workflow_ref \}\}/.test(worker)) fail("Worker must inspect caller workflow ref");
if (!/CALLER_WORKFLOW_SHA: \$\{\{ github\.workflow_sha \}\}/.test(worker)) fail("Worker must inspect caller workflow SHA");
if (!/CALLEE_REPOSITORY: \$\{\{ job\.workflow_repository \}\}/.test(worker)) fail("Worker must inspect reusable callee repository");
if (!/CALLEE_FILE_PATH: \$\{\{ job\.workflow_file_path \}\}/.test(worker)) fail("Worker must inspect reusable callee path");
if (!/CALLEE_WORKFLOW_SHA: \$\{\{ job\.workflow_sha \}\}/.test(worker)) fail("Worker must inspect reusable callee SHA");
if (/^      CALLEE_(?:REPOSITORY|FILE_PATH|WORKFLOW_SHA):/m.test(worker)) fail("job.workflow_* contexts must not be referenced in job-level env");
if (!worker.includes("          CALLEE_REPOSITORY: ${{ job.workflow_repository }}") || !worker.includes("          CALLEE_FILE_PATH: ${{ job.workflow_file_path }}") || !worker.includes("          CALLEE_WORKFLOW_SHA: ${{ job.workflow_sha }}")) fail("job.workflow_* contexts must be mapped in step-level env");
if (!/CALLER_WORKFLOW_SHA !== e\.CALLEE_WORKFLOW_SHA/.test(worker)) fail("Worker must require caller and callee to share the immutable invocation SHA");
if (!/pool:claimed/.test(worker)) fail("Worker must require Supervisor claim state");
if (!/createHash\("sha256"\)/.test(worker) || !/digest\("hex"\) !== e\.ENVELOPE_DIGEST/.test(worker)) fail("Worker must verify the immutable task envelope digest");
if (!/generations\[0\] !== e\.CLAIM_GENERATION/.test(worker)) fail("Worker must verify the exact claim generation");
if (!/activeStates\.length !== 1 \|\| activeStates\[0\] !== "pool:claimed"/.test(worker)) fail("Worker must reject conflicting or duplicate managed task states");
if (failures.length === 0) pass("Worker is reusable-only, read-only, identity-bound and has no issue mutation authority");

if (/^\s+workflow_run:/m.test(supervisor)) fail("Supervisor must not use privileged workflow_run");
if (/^\s+actions:\s*write\s*$/m.test(supervisor)) fail("Supervisor must not grant actions: write");
if (!/^\s+uses:\s+\.\/\.github\/workflows\/pool-worker\.yml\s*$/m.test(supervisor)) fail("Supervisor must statically call the reusable Worker");
if (/\/actions\/workflows\/[^\s"']+\/dispatch/.test(supervisor) || /\/actions\/workflows\/[^\s"']+\/dispatch/.test(supervisorScript)) fail("Supervisor must not use REST workflow dispatch");
if (/workflow_dispatch/.test(supervisorScript)) fail("Supervisor script must not use workflow_dispatch");
if (!/POOL_DISPATCH_ENABLED: \$\{\{ vars\.POOL_DISPATCH_ENABLED \}\}/.test(supervisor)) fail("Supervisor must read the dispatch gate");
if (!/POOL_AUTHORIZATION_CONTRACT_ACCEPTED: \$\{\{ vars\.POOL_AUTHORIZATION_CONTRACT_ACCEPTED \}\}/.test(supervisor)) fail("Supervisor must read explicit authorization acceptance gate");
if (!/protectedDefaultRef = process\.env\.GITHUB_REF === "refs\/heads\/Основной"/.test(supervisorScript)) fail("Supervisor must be restricted to the protected default branch");
if (!/dispatchEnabled = process\.env\.POOL_DISPATCH_ENABLED === "true"/.test(supervisorScript)) fail("Supervisor must require literal true for dispatch");
if (!/authorizationAccepted = process\.env\.POOL_AUTHORIZATION_CONTRACT_ACCEPTED === "true"/.test(supervisorScript)) fail("Supervisor must require explicit authorization acceptance");
if (process.env.POOL_AUTHORIZATION_CONTRACT_ACCEPTED === "true") fail("Authorization acceptance gate must remain disabled until independent review and governance acceptance.");
if (!/if \(!protectedDefaultRef \|\| !dispatchEnabled \|\| !authorizationAccepted\)/.test(supervisorScript)) fail("Supervisor must remain heartbeat-only unless every gate passes");
if (!/const issue = candidates\[0\]/.test(supervisorScript)) fail("Supervisor must process at most one task per run");
if (!/Claim read-back was ambiguous/.test(supervisorScript)) fail("Supervisor must fail closed on ambiguous claim read-back");
if (/POOL_CLAIM_LEASE_EXPIRED|replaceLabels\([^,\n]+,\s*\["pool:claimed"\],\s*\["pool:ready"\]\)/.test(supervisorScript)) fail("Supervisor must never auto-requeue a consumed approval");
if (!/needs\.worker\.result/.test(supervisor)) fail("Supervisor finalizer must consume reusable Worker result");
if (!/pool:needs-review/.test(finalizerPolicy)) fail("Finalizer policy must route non-success to needs-review");
if (!/pool:claim-/.test(supervisorScript) || !/envelope_digest/.test(supervisorScript)) fail("Supervisor must bind claims to a unique generation and immutable envelope digest");
if (!/generations\.length !== 1/.test(finalizerPolicy) || !/envelopeDigest\(String\(issue\.body/.test(finalizerPolicy)) fail("Finalizer must verify the unique claim generation and immutable issue envelope");
if (!/buildFinalizationPlan\(issue, expected\)/.test(finalizerProtocol) || !/await api\.replaceLabels\(plan\.labels\)/.test(finalizerProtocol) || !/terminalReadback\(readback, expected, plan, humanLabels\)/.test(finalizerProtocol)) fail("Finalizer protocol must revalidate before terminal write and verify authoritative read-back");
if (!/does not provide an atomic compare-and-swap/.test(finalizerProtocol)) fail("Finalizer must retain the explicit GitHub non-CAS limitation");
if (failures.length === 0) pass("Supervisor uses reusable invocation, dual fail-closed gates and one-task claim/read-back");

for (const [name, source] of [["DSH evaluation", dsh], ["Resource Probe", resource]]) {
  if (!/workflow_dispatch:/.test(source)) fail(name + " must remain manually dispatched");
  if (!/permissions:\s*\n\s+contents:\s*read/.test(source)) fail(name + " must have read-only contents permission");
  if (/secrets\./.test(source)) fail(name + " must not reference repository secrets");
}
if (!dsh.includes("@deepseek-ai/dsh@0.2.1-rc.5")) fail("DSH package version must remain exact-pinned");
if (!validation.includes("node --test tests/security/reusable-pool-worker-boundary.test.mjs")) fail("Dedicated reusable boundary tests must run in CI");
if (!validation.includes("node --test tests/security/pool-finalizer-fencing.test.mjs")) fail("Dedicated finalizer fencing tests must run in CI");
if (failures.length === 0) pass("DSH and Resource Probe remain manual, read-only and secret-free");

if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exitCode = 1;
} else {
  console.log("POOL_CONTRACT_VALIDATION=PASS");
}
