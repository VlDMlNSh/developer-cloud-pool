import fs from "node:fs";
import { spawnSync } from "node:child_process";

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
const ownerNextController = read(".github/workflows/next-event-controller.yml");
const ownerNextActivationContract = read("docs/architecture/OWNER-NEXT-ISSUE-COMMENT-ACTIVATION-CONTRACT.md");
const d1ProofWorker = read("proofs/d1-ledger/src/worker.mjs");

const workflows = [
  ".github/workflows/pool-contract-validation.yml",
  ".github/workflows/pool-supervisor.yml",
  ".github/workflows/pool-worker.yml",
  ".github/workflows/dsh-runtime-evaluation.yml",
  ".github/workflows/runner-resource-probe.yml",
  ".github/workflows/next-event-controller.yml"
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

if (!/^  issue_comment:\s*\n    types:\s*\[created\]/m.test(ownerNextController)) {
  fail("Owner /next controller must subscribe only to created issue_comment events");
}
if (!ownerNextActivationContract.includes("unless the workflow file exists on the repository's default branch") ||
    !ownerNextActivationContract.includes("Live `issue_comment` execution: **NOT RUN**")) {
  fail("Owner /next activation contract must document the default-branch prerequisite and current NOT RUN state");
}
if (!ownerNextController.includes("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1") ||
    !ownerNextController.includes("actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1") ||
    !/package-manager-cache:\\s*false/.test(ownerNextController)) {
  fail("Owner /next controller must use the reviewed immutable Node24 action pins with package-manager caching disabled");
}
if (!/^permissions:\s*\n  contents:\s*read\n  issues:\s*read\n  actions:\s*read\s*$/m.test(ownerNextController)) {
  fail("Owner /next controller must have read-only repository/issue/actions permissions");
}
if (/workflow_dispatch:|workflow_run:|workflow_call:|issues:\s*write|actions:\s*write|contents:\s*write|secrets\.|dispatches/i.test(ownerNextController)) {
  fail("Owner /next controller must not expose dispatch, privileged triggers, secret access or write permissions");
}
if (!/github\.event\.comment\.author_association == 'OWNER'/.test(ownerNextController) ||
    !/github\.event\.comment\.user\.id == 157891068/.test(ownerNextController) ||
    !/github\.event\.sender\.id == 157891068/.test(ownerNextController)) {
  fail("Owner /next controller must bind the event to the numeric repository owner identity");
}
if (!/ref:\s*\$\{\{\s*github\.workflow_sha\s*\}\}/.test(ownerNextController) ||
    !/persist-credentials:\s*false/.test(ownerNextController)) {
  fail("Owner /next controller must check out workflow-pinned source without persisted credentials");
}
if (!/node scripts\/owner-next-controller\.mjs/.test(ownerNextController)) {
  fail("Owner /next controller must invoke the bounded API-attested collector CLI");
}
if (failures.length === 0) pass("owner /next controller is owner-bound, workflow-pinned, read-only and non-dispatching");

if (!/^permissions:\s*\{\s*\}/m.test(worker)) fail("Retired worker must default to permissions: {}");
if (!/^  retired:\s*$/m.test(worker)) fail("Legacy worker must contain only the retired guard job");
if (!/Legacy DSH worker is retired/.test(worker) || !/exit 1/.test(worker)) {
  fail("Legacy DSH workflow must fail closed with an explicit retirement message");
}
if (/^\s*uses:\s*/m.test(worker)) fail("Retired DSH workflow must not install or invoke external actions");
if (/secrets\.|GITHUB_TOKEN|npm install|dsh --/i.test(worker)) {
  fail("Retired DSH workflow must not access credentials or execute the legacy runtime");
}
if (/^\s*inputs:/m.test(worker)) fail("Retired DSH workflow must not accept task-controlled inputs");
if (failures.length === 0) pass("legacy DSH worker is inert, credential-free and fail-closed");

if (!supervisor.includes("vars.POOL_DISPATCH_ENABLED")) fail("Supervisor must observe the legacy dispatch variable for fail-closed detection");
if (!/^permissions:\s*\n\s+contents:\s*read\s*$/m.test(supervisor)) {
  fail("Retired Supervisor must have contents: read only at workflow scope");
}
if (/issues:\s*write|actions:\s*write|secrets\.GITHUB_TOKEN|workflow_run:|workflow_dispatch:|^  issues:/m.test(supervisor)) {
  fail("Retired Supervisor must not retain mutation permissions or legacy event triggers");
}
if (!/LEGACY_LABEL_DISPATCH_RETIRED/.test(supervisorScript) ||
    !/POOL_DISPATCH_ENABLED\s*===\s*"true"/.test(supervisorScript)) {
  fail("Supervisor must explicitly reject an attempt to re-enable legacy label dispatch");
}
if (/fetch\s*\(|dispatches|pool:ready|pool:claimed|ensureLabel|replaceIssueLabels|GITHUB_TOKEN/.test(supervisorScript)) {
  fail("Retired Supervisor must contain no API, label mutation, token or worker-dispatch path");
}
if (!/heartbeat only/.test(supervisorScript)) fail("Supervisor must report its heartbeat-only state");
if (failures.length === 0) pass("legacy Supervisor is read-only and cannot dispatch even if the old variable is true");

for (const [name, source] of [["DSH evaluation", dsh], ["Resource Probe", resource]]) {
  if (!/workflow_dispatch:/.test(source)) fail(name + " must remain manually dispatched");
  if (!/permissions:\s*\n\s+contents:\s*read/.test(source)) fail(name + " must have read-only contents permission");
  if (/secrets\./.test(source)) fail(name + " must not reference repository secrets");
}
if (!dsh.includes("@deepseek-ai/dsh@0.2.1-rc.5")) fail("DSH package version must remain exact-pinned");
if (failures.length === 0) pass("standalone DSH and Resource Probe remain manual, read-only and secret-free");

const controllerTests = spawnSync(process.execPath, ["--test", "scripts/owner-next-controller.test.mjs"], {
  encoding: "utf8",
  timeout: 30_000,
  stdio: "inherit",
  env: { PATH: process.env.PATH || "" }
});
if (controllerTests.error || controllerTests.status !== 0) {
  fail("Owner /next controller CLI tests failed or timed out");
} else {
  pass("owner /next controller CLI tests passed");
}

if (/from\s+["'][^"']*github-next-event\.mjs["']/.test(d1ProofWorker) ||
    /from\s+["'][^"']*owner-next-envelope\.mjs["']/.test(d1ProofWorker)) {
  fail("D1 proof Worker entrypoint must not import the legacy synthetic or attested GitHub event adapters");
} else {
  pass("D1 proof Worker entrypoint is isolated from legacy and attested GitHub event adapters");
}

if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exitCode = 1;
} else {
  console.log("POOL_CONTRACT_VALIDATION=PASS");
}
