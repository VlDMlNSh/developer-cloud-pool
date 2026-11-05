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
const dsh = read(".github/workflows/dsh-runtime-evaluation.yml");
const resource = read(".github/workflows/runner-resource-probe.yml");
const fixtureCaller = read(".github/workflows/reusable-worker-context-fixture-caller.yml");
const fixtureReusable = read(".github/workflows/reusable-worker-context-fixture.yml");

const workflows = [
  ".github/workflows/pool-contract-validation.yml",
  ".github/workflows/pool-supervisor.yml",
  ".github/workflows/pool-worker.yml",
  ".github/workflows/dsh-runtime-evaluation.yml",
  ".github/workflows/runner-resource-probe.yml",
  ".github/workflows/reusable-worker-context-fixture-caller.yml",
  ".github/workflows/reusable-worker-context-fixture.yml"
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
      fail(path + ":" + (index + 1) + " interpolates a workflow input inside a shell run block");
    }
  }

  for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)) {
    if (!/@[0-9a-f]{40}$/.test(match[1])) {
      fail(path + " uses an action that is not pinned to a full commit SHA: " + match[1]);
    }
  }
}
if (failures.length === 0) pass("workflow inputs are not interpolated into shell run blocks");
if (workflows.every(([, source]) => [...source.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)].every((m) => /@[0-9a-f]{40}$/.test(m[1])))) {
  pass("all external Actions references are pinned to 40-character commit SHAs");
}

if (!/^permissions:\s*\{\s*\}/m.test(worker)) fail("Worker must default to permissions: {}");
if (!/  validate:[\s\S]*?permissions:\s*\n\s+issues:\s*read/.test(worker)) fail("Worker validation job must have issues: read");
if (!/  probe:[\s\S]*?permissions:\s*\n\s+contents:\s*read/.test(worker)) fail("Worker probe job must have contents: read");
if (!/  report:[\s\S]*?permissions:\s*\n\s+issues:\s*write/.test(worker)) fail("Worker report job must have issues: write");
const probeJob = worker.split(/^  probe:\s*$/m)[1]?.split(/^  report:\s*$/m)[0] || "";
if (!probeJob) fail("Worker probe job block cannot be isolated");
if (/secrets\./.test(probeJob)) fail("Worker probe job must not receive repository secrets");
if (!worker.includes("persist-credentials: false")) fail("Worker checkout must not persist Git credentials");
if (!/options:\s*\n\s+- dsh-headless-probe/.test(worker)) fail("Worker profile allowlist must include the exact DSH probe profile");
if (!/TASK_ISSUE:\s*\$\{\{\s*inputs\.task_issue\s*\}\}/.test(worker)) fail("Worker must pass task_issue through an environment variable");
if (!/\$TASK_ISSUE/.test(probeJob)) fail("Worker probe summary must use TASK_ISSUE environment variable");
if (failures.length === 0) pass("Worker permissions, profile allowlist, checkout and no-secret probe invariants");

if (!supervisor.includes('vars.POOL_DISPATCH_ENABLED')) fail("Supervisor workflow must read the repository dispatch variable");
if (!/process\.env\.POOL_DISPATCH_ENABLED\s*===\s*"true"/.test(supervisorScript)) fail("Supervisor must fail closed unless dispatch variable is literal true");
if (!/if\s*\(!dispatchEnabled\)[\s\S]*?process\.exit\(0\)/.test(supervisorScript)) fail("Supervisor must exit heartbeat-only when dispatch is disabled");
if (failures.length === 0) pass("Supervisor dispatch is fail-closed and variable-controlled");

for (const [name, source] of [["DSH evaluation", dsh], ["Resource Probe", resource]]) {
  if (!/workflow_dispatch:/.test(source)) fail(name + " must remain manually dispatched");
  if (!/permissions:\s*\n\s+contents:\s*read/.test(source)) fail(name + " must have read-only contents permission");
  if (/secrets\./.test(source)) fail(name + " must not reference repository secrets");
}
if (!dsh.includes("@deepseek-ai/dsh@0.2.1-rc.5")) fail("DSH package version must remain exact-pinned");
if (failures.length === 0) pass("DSH and Resource Probe remain manual, read-only and secret-free");

if (!fixtureCaller.includes("uses: ./.github/workflows/reusable-worker-context-fixture.yml")) {
  fail("Reusable context fixture caller must use a static local job-level workflow reference");
}
if (!fixtureReusable.includes("workflow_call:")) {
  fail("Reusable context fixture must expose workflow_call");
}
if (/workflow_dispatch:/.test(fixtureCaller + fixtureReusable)) {
  fail("Reusable context fixture must not expose workflow_dispatch");
}
if (/secrets\./.test(fixtureCaller + fixtureReusable)) {
  fail("Reusable context fixture must not reference secrets");
}
for (const field of ["github.workflow_ref", "github.workflow_sha", "job.workflow_ref", "job.workflow_sha", "job.workflow_repository", "job.workflow_file_path"]) {
  if (!fixtureReusable.includes(field)) fail("Reusable context fixture must record " + field);
}
if (!fixtureReusable.includes("timeout-minutes: 2")) fail("Reusable context fixture must have a two-minute timeout");
if (!fixtureCaller.includes("contents: read") || !fixtureReusable.includes("contents: read")) {
  fail("Reusable context fixture caller and callee must be read-only");
}
if (failures.length === 0) pass("reusable workflow fixture is static, read-only, secret-free and records caller/callee identity");

if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exitCode = 1;
} else {
  console.log("POOL_CONTRACT_VALIDATION=PASS");
}
