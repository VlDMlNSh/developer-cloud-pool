// Dependency-free static validator for the machine-readable qualification register.
import fs from "node:fs";

const path = "config/component-qualification-matrix.json";
const failures = [];
const pass = (message) => console.log("PASS " + message);
const fail = (message) => failures.push(message);
const allowedDecisions = new Set([
  "SELECTED_BOOTSTRAP", "SELECTED_EXISTING_INTERNAL", "SELECTED_BOOTSTRAP_LIMITED",
  "SELECTED_PROBE_ONLY", "CONDITIONAL_PREVIEW", "CONDITIONAL_CANDIDATE",
  "PRIMARY_UI_CANDIDATE_NOT_ADOPTED", "SELECTIVE_CONDITIONAL", "HOLD_PROVENANCE",
  "CONDITIONAL_LATER", "SELECTED_QA_CANDIDATE", "DEFERRED",
  "DEFERRED_UNTIL_GAP_PROVEN", "OPTIONAL_LATER", "LATER_CONNECTOR",
  "EXTERNAL_NODES_LATER", "INTERNAL_GAP_REQUIRED"
]);

let matrix;
try {
  matrix = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (error) {
  console.error("FAIL Cannot parse " + path + ": " + error.message);
  process.exit(1);
}

if (matrix.schema_version !== "1.0.0") fail("Unsupported matrix schema_version");
if (matrix.matrix_id !== "developer-cloud-pool-component-qualification") fail("Unexpected matrix_id");
if (matrix.repository !== "VlDMlNSh/developer-cloud-pool") fail("Matrix repository identity mismatch");
if (matrix.dispatch_enabled !== false) fail("Matrix must keep dispatch_enabled=false");
if (matrix.secret_values_stored !== false) fail("Matrix must never store secret values");
if (!Array.isArray(matrix.records) || matrix.records.length < 20) fail("Expected at least 20 component records");

const ids = new Set();
const required = ["id", "name", "kind", "source", "decision", "scope", "version_pin", "license", "security", "runtime_qualification", "evidence", "blockers", "next_gate"];
for (const item of matrix.records || []) {
  for (const key of required) {
    if (item[key] === undefined || item[key] === null || item[key] === "") fail((item.id || "unknown") + ": missing " + key);
  }
  if (ids.has(item.id)) fail("Duplicate component id: " + item.id);
  ids.add(item.id);
  if (!allowedDecisions.has(item.decision)) fail(item.id + ": unrecognized decision " + item.decision);
  if (!/^https:\/\//.test(item.source)) fail(item.id + ": source must be an HTTPS URL");
  if (!Array.isArray(item.evidence) || item.evidence.length === 0) fail(item.id + ": evidence must be a non-empty array");
  if (!Array.isArray(item.blockers)) fail(item.id + ": blockers must be an array");
  if (item.runtime_qualification === "PASS" && item.security_qualification !== "PASS") {
    fail(item.id + ": runtime PASS requires a separate security_qualification PASS");
  }
  if (item.decision === "INTERNAL_GAP_REQUIRED" && item.runtime_qualification !== "NOT_IMPLEMENTED") {
    fail(item.id + ": internal required capability must remain NOT_IMPLEMENTED until implemented");
  }
  if (item.decision.includes("CANDIDATE") && item.runtime_qualification === "PASS") {
    fail(item.id + ": candidate cannot be marked runtime-qualified");
  }
  if (item.name.toLowerCase().includes("every cloud code") && item.id === "ecc-toolbox") {
    fail("ECC public toolbox must not be relabelled as the user's Every Cloud Code controller");
  }
}

for (const id of [
  "pool-actions-runner", "pool-supervisor", "github-issues-queue", "pool-worker-dsh",
  "gemini-cli", "claude-code", "codex-cli", "openhands-app", "quota-ledger",
  "tenant-isolation", "task-dag", "a3-verifier"
]) {
  if (!ids.has(id)) fail("Required architecture component missing from matrix: " + id);
}
if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exit(1);
}

const counts = {};
for (const item of matrix.records) counts[item.decision] = (counts[item.decision] || 0) + 1;
pass("matrix JSON schema and required evidence fields");
pass("component IDs are unique; source URLs and evidence arrays are present");
pass("A0, runner, queue, worker, Gemini, Claude, Codex, Jarvis, quota, tenant, DAG and A3 records exist");
pass("dispatch remains disabled and no secret values are stored");
console.log("COMPONENT_MATRIX_RECORDS=" + matrix.records.length);
console.log("COMPONENT_MATRIX_DECISIONS=" + JSON.stringify(counts));

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = matrix.records.map(item =>
    "| " + item.name.replaceAll("|", "\\|") + " | " + item.decision + " | " +
    item.runtime_qualification + " | " + item.next_gate.replaceAll("|", "\\|") + " |"
  );
  const summary = [
    "## Component qualification matrix",
    "",
    "- Records: " + matrix.records.length,
    "- Dispatch enabled: false",
    "- Secret values stored: false",
    "- This is a static integrity/consistency check, not upstream runtime qualification.",
    "",
    "| Component | Decision | Runtime evidence | Next gate |",
    "|---|---|---|---|",
    ...rows,
    "",
    "### Decision counts",
    ...Object.entries(counts).map(([key, value]) => "- " + key + ": " + value)
  ].join("\n");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
}
console.log("COMPONENT_MATRIX_VALIDATION=PASS");
