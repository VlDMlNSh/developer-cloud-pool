import fs from "node:fs";

const failures = [];
const pass = (message) => console.log("PASS " + message);
const fail = (message) => failures.push(message);
const read = (path) => {
  try { return fs.readFileSync(path, "utf8"); }
  catch { fail("Required file is missing: " + path); return ""; }
};

const worker = read(".github/workflows/pool-worker.yml");
const contractWorkflow = read(".github/workflows/pool-contract-validation.yml");
const supervisor = read(".github/workflows/pool-supervisor.yml");
const supervisorScript = read("scripts/pool-supervisor.mjs");
const browser = worker.split(/^  browser:\s*$/m)[1]?.split(/^  skills:\s*$/m)[0] || "";
const skillsJob = worker.split(/^  skills:\s*$/m)[1]?.split(/^  report:\s*$/m)[0] || "";
const skillsInstaller = read("scripts/install-agent-skills.mjs");
const skillsManifestText = read("config/agent-skills.lock.json");
let skillsManifest = {};
try { skillsManifest = JSON.parse(skillsManifestText); } catch { fail("Agent skills lock manifest must be valid JSON"); }
const issueForm = read(".github/ISSUE_TEMPLATE/pool-task.yml");
const dsh = read(".github/workflows/dsh-runtime-evaluation.yml");
const resource = read(".github/workflows/runner-resource-probe.yml");

const workflows = [
  ".github/workflows/pool-contract-validation.yml",
  ".github/workflows/pool-supervisor.yml",
  ".github/workflows/pool-worker.yml",
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
if (!/options:\s*\n\s+- dsh-headless-probe\s*\n\s+- agent-browser-headless\s*\n\s+- agent-skills-bootstrap/.test(worker)) fail("Worker profile allowlist must include DSH, browser and agent-skills profiles");
if (!/TASK_ISSUE:\s*\$\{\{\s*inputs\.task_issue\s*\}\}/.test(worker)) fail("Worker must pass task_issue through an environment variable");
if (!/\$TASK_ISSUE/.test(probeJob)) fail("Worker probe summary must use TASK_ISSUE environment variable");
if (!browser) fail("Worker browser job block cannot be isolated");
if (!/if: needs\.validate\.result == 'success' && inputs\.profile == 'agent-browser-headless'/.test(browser)) fail("Browser job must run only for the validated browser profile");
if (!/permissions:\s*\{\s*\}/.test(browser)) fail("Browser job must have no GitHub token permissions");
if (/secrets\./.test(browser)) fail("Browser job must not receive repository secrets");
if (!/agent-browser@0\.43\.0/.test(browser)) fail("Browser CLI must remain exact-pinned");
if (!/timeout-minutes:\s*15/.test(browser)) fail("Browser job must have a bounded 15-minute timeout");
if (/actions\/checkout/.test(browser)) fail("Browser job must not checkout or execute task repository code");
if (!worker.includes("BROWSER_RESULT: ${{ needs.browser.result }}") || !/needs:\s*\[validate, probe, browser, skills\]/.test(worker)) fail("Report job must reconcile browser, DSH and skills job outcomes");
if (!issueForm.includes("- Agent-browser headless")) fail("Task issue form must expose the browser profile");
if (!worker.includes('"agent-browser-headless": "Agent-browser headless"')) fail("Worker must bind the browser profile to the exact issue envelope label");
if (!/agent-browser install/.test(browser) || !/agent-browser skills get core/.test(browser) || !/agent-browser skills get dogfood/.test(browser)) fail("Browser job must install Chromium and load core/dogfood skills");
const browserSmoke = contractWorkflow.split(/^  browser-smoke:\\s*$/m)[1]?.split(/^  validate:\\s*$/m)[0] || "";
if (!browserSmoke) fail("Contract validation must include an executable browser smoke job");
if (!/permissions:\\s*\\{\\s*\\}/.test(browserSmoke)) fail("Browser smoke job must have no GitHub token permissions");
if (/secrets\\./.test(browserSmoke)) fail("Browser smoke job must not receive repository secrets");
if (!/agent-browser@0\\.43\\.0/.test(browserSmoke) || !/agent-browser install --with-deps/.test(browserSmoke)) fail("Browser smoke job must install exact-pinned agent-browser and Chromium");
if (!/agent-browser skills get core/.test(browserSmoke) || !/agent-browser skills get dogfood/.test(browserSmoke)) fail("Browser smoke job must load core and dogfood skill guides");
if (!/https:\\/\\/example\\.com/.test(browserSmoke) || !/agent-browser open/.test(browserSmoke) || !/agent-browser screenshot/.test(browserSmoke)) fail("Browser smoke job must navigate to a harmless public site and capture evidence");
if (!/Session is ephemeral/.test(browserSmoke)) fail("Browser smoke job must document ephemeral session scope");
if (!/https:\/\/example\.com/.test(browser) || !/agent-browser close/.test(browser)) fail("Browser smoke test must use a harmless public target and close its session");
if (!skillsJob) fail("Worker skills job block cannot be isolated");
if (!/if: needs\.validate\.result == 'success' && inputs\.profile == 'agent-skills-bootstrap'/.test(skillsJob)) fail("Skills job must run only for the validated bootstrap profile");
if (!/permissions:\s*\n\s+contents:\s*read/.test(skillsJob)) fail("Skills job must have contents: read only");
if (/secrets\./.test(skillsJob)) fail("Skills job must not receive repository secrets");
if (!/actions\/checkout@[0-9a-f]{40}/.test(skillsJob) || !/persist-credentials:\s*false/.test(skillsJob)) fail("Skills job must checkout the exact target without persisted credentials");
if (!/node scripts\/install-agent-skills\.mjs/.test(skillsJob)) fail("Skills job must use the reviewed installer");
if (!/SKILLS_RESULT: \$\{\{ needs\.skills\.result \}\}/.test(worker) || !/needs:\s*\[validate, probe, browser, skills\]/.test(worker)) fail("Report job must reconcile skills bootstrap result");
if (!/pool:skills-ready/.test(worker)) fail("Report job must use a distinct skills-ready terminal label");
if (skillsManifest.cli?.version !== "1.8.1" || skillsManifest.target_agent !== "gemini-cli" || skillsManifest.install_mode !== "project-copy") fail("Skills manifest must pin CLI and Gemini project-copy install target");
const skillNames = (skillsManifest.sources || []).flatMap(source => (source.skills || []).map(skill => skill.name));
if (skillNames.length !== 11 || new Set(skillNames).size !== skillNames.length || skillNames.includes("*")) fail("Skills manifest must contain exactly 11 unique allowlisted skills");
if (!(skillsManifest.sources || []).every(source => /^[0-9a-f]{40}$/.test(source.ref || ""))) fail("Every skill source must be pinned to a full commit SHA");
if (!skillsInstaller.includes('skills@" + cliVersion') || !skillsInstaller.includes('"--agent", manifest.target_agent, "--copy", "--yes"')) fail("Skills installer must use exact CLI pin and copy into Gemini project skills");
if (!skillsInstaller.includes("DISABLE_TELEMETRY") || !skillsInstaller.includes("SKILL.md") || !skillsInstaller.includes("agent-skills-inventory.sha256")) fail("Skills installer must disable telemetry and verify/hash installed skill content");
if (failures.length === 0) pass("Worker permissions, DSH/browser/skills profile allowlists, isolated no-secret browser and skills bootstrap contracts");

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

if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exitCode = 1;
} else {
  console.log("POOL_CONTRACT_VALIDATION=PASS");
}
