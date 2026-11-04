import fs from "node:fs";
import path from "node:path";

const WORKFLOW_DIR = ".github/workflows";
const ALLOWED_RUNNER = /^(ubuntu-(latest|[0-9]{2}\\.[0-9]{2})|windows-(latest|[0-9]{2})|macos-(latest|[0-9]{2}))$/;
const MAX_TIMEOUT_MINUTES = 30;
const MAX_MATRIX_PARALLEL = 4;
const failures = [];

function fail(message) {
  failures.push(message);
}

export function validateWorkflowPolicy(source, file = "<workflow>") {
  const errors = [];
  const lines = source.split(/\\r?\\n/);
  const jobsStart = lines.findIndex((line) => /^jobs:\\s*$/.test(line));
  if (jobsStart < 0) return [file + ": missing jobs section"];

  const jobStarts = [];
  for (let i = jobsStart + 1; i < lines.length; i += 1) {
    if (/^\\S/.test(lines[i]) && lines[i].trim() !== "") break;
    if (/^  [A-Za-z0-9_-]+:\\s*$/.test(lines[i])) jobStarts.push(i);
  }
  if (jobStarts.length === 0) return [file + ": no statically declared jobs found"];

  for (let index = 0; index < jobStarts.length; index += 1) {
    const start = jobStarts[index];
    const end = jobStarts[index + 1] ?? lines.length;
    const block = lines.slice(start, end);
    const name = lines[start].trim().replace(/:$/, "");
    const runnerLine = block.find((line) => /^    runs-on:\\s*/.test(line));
    if (!runnerLine) {
      errors.push(file + " job " + name + ": runs-on must be a literal standard GitHub-hosted runner label");
    } else {
      const runner = runnerLine.replace(/^    runs-on:\\s*/, "").trim().replace(/^["']|["']$/g, "");
      if (!ALLOWED_RUNNER.test(runner)) {
        errors.push(file + " job " + name + ": runner is not an allowed standard GitHub-hosted SKU: " + runner);
      }
    }

    const timeoutLine = block.find((line) => /^    timeout-minutes:\\s*/.test(line));
    const timeout = timeoutLine ? Number(timeoutLine.replace(/^    timeout-minutes:\\s*/, "").trim()) : NaN;
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_TIMEOUT_MINUTES) {
      errors.push(file + " job " + name + ": timeout-minutes must be an integer from 1 to " + MAX_TIMEOUT_MINUTES);
    }

    const jobSource = block.join("\\n");
    if (/^    (container|image):/m.test(jobSource)) {
      errors.push(file + " job " + name + ": custom job containers/images are forbidden by the Free-only policy");
    }
    if (/^    strategy:\\s*$/m.test(jobSource)) {
      const maxParallelMatch = jobSource.match(/^      max-parallel:\\s*(\\d+)\\s*$/m);
      if (!maxParallelMatch || Number(maxParallelMatch[1]) > MAX_MATRIX_PARALLEL || Number(maxParallelMatch[1]) < 1) {
        errors.push(file + " job " + name + ": matrix jobs require max-parallel from 1 to " + MAX_MATRIX_PARALLEL);
      }
    }
  }

  if (/\\b(?:paid|billing|payment)[-_ ]?fallback\\s*:\\s*(?:true|paid|enabled)\\b/i.test(source)) {
    errors.push(file + ": paid fallback configuration is forbidden");
  }
  if (/\\b(?:gpu|larger|xlarge|2xlarge|4xlarge)\\b/i.test(source) && /^\\s*runs-on:/m.test(source)) {
    errors.push(file + ": paid/larger/GPU runner terminology detected in runner configuration");
  }
  return errors;
}

export function validateWorkflowSet(workflows) {
  const errors = [];
  for (const [file, source] of Object.entries(workflows)) {
    errors.push(...validateWorkflowPolicy(source, file));
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("scripts/validate-free-tier-policy.mjs")) {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    console.error("FAIL missing " + WORKFLOW_DIR);
    process.exit(1);
  }
  const workflows = Object.fromEntries(
    fs.readdirSync(WORKFLOW_DIR)
      .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
      .sort()
      .map((name) => {
        const file = path.join(WORKFLOW_DIR, name);
        return [file, fs.readFileSync(file, "utf8")];
      })
  );
  const errors = validateWorkflowSet(workflows);
  if (errors.length) {
    for (const error of errors) console.error("FAIL " + error);
    process.exit(1);
  }
  console.log("PASS " + Object.keys(workflows).length + " workflows comply with GitHub Free-only runner policy");
  console.log("FREE_TIER_POLICY_VALIDATION=PASS");
}
