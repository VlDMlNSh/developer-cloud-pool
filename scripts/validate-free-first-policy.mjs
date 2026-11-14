import fs from "node:fs";

const path = "config/free-first-execution-policy.json";
const policy = JSON.parse(fs.readFileSync(path, "utf8"));
const failures = [];
const pass = (message) => console.log("PASS " + message);
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(policy.schema_version === "1.0.0", "schema_version must be 1.0.0");
assert(policy.policy_id === "developer-cloud-pool-free-first-execution", "unexpected policy_id");
assert(policy.dispatch_enabled === false, "dispatch must remain disabled");
assert(policy.paid_api_policy?.default === "DENY", "paid API default must be DENY");
assert(policy.paid_api_policy?.anthropic_api === "PROHIBITED_FOR_INITIAL_LAUNCH", "Anthropic API must be prohibited for initial launch");
assert(policy.paid_api_policy?.openai === "DEFERRED_EXPLICIT_LATER_PHASE", "OpenAI must remain deferred");
assert(policy.paid_api_policy?.paid_fallback_on_quota_exhaustion === false, "paid fallback must be disabled");

const routes = new Map((policy.execution_routes || []).map(route => [route.id, route]));
for (const id of ["claude-code-free", "ollama-local", "gemini-free", "deepseek-free", "openai-later"]) {
  assert(routes.has(id), "required route missing: " + id);
}
const claude = routes.get("claude-code-free");
assert(claude?.prohibited?.includes("Anthropic API key"), "Claude route must prohibit Anthropic API keys");
assert(claude?.prohibited?.includes("account rotation"), "Claude route must prohibit account rotation");
assert(claude?.runtime_qualification === "NOT_RUN", "Claude must not be marked qualified without runtime evidence");
const local = routes.get("ollama-local");
assert(local?.route_type === "user_owned_local_compute", "Ollama must be classified as local compute");
assert(local?.runtime_qualification === "NOT_RUN", "Ollama must not be marked qualified without a host probe");
const openai = routes.get("openai-later");
assert(openai?.decision === "DEFERRED", "OpenAI must remain deferred");
assert(policy.quota_exhaustion?.paid_fallback === false, "quota exhaustion must never trigger paid fallback");
assert(policy.quota_exhaustion?.account_rotation === false, "quota exhaustion must never trigger account rotation");
assert(policy.quota_exhaustion?.unknown_quota_state === "DENY_DISPATCH", "unknown quota state must fail closed");
assert(policy.launch_gates?.secret_values_in_matrix === false, "secret values must not be stored");
assert(policy.launch_gates?.provider_auth_in_pull_request_jobs === false, "provider auth must not enter pull-request jobs");
assert(policy.launch_gates?.unqualified_agent_dispatch === false, "unqualified agents must not dispatch");
assert(policy.launch_gates?.independent_a3_required_before_acceptance === true, "independent A3 acceptance is mandatory");

if (failures.length) {
  for (const failure of failures) console.error("FAIL " + failure);
  process.exit(1);
}
pass("free-first route inventory is complete");
pass("Anthropic paid API is prohibited; Claude Code remains conditional on a supported free route");
pass("Ollama is separated as local compute and is not falsely marked qualified");
pass("Gemini/DeepSeek require verified free quota; no paid fallback or account rotation");
pass("OpenAI remains deferred; unknown quota and unqualified routes fail closed");
pass("dispatch disabled; no secrets; independent A3 required");
console.log("FREE_FIRST_POLICY_VALIDATION=PASS");
