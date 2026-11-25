import { pathToFileURL } from "node:url";

export const AGENT_KEY_ENV = Object.freeze([
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4"
]);

export const AGENT_ROLES = Object.freeze([
  Object.freeze({ id: "researcher", instruction: "Research the assigned work item. Identify facts, assumptions, dependencies, upstream components, and unresolved questions. Do not implement changes." }),
  Object.freeze({ id: "implementer", instruction: "Produce a minimal, bounded implementation proposal for the assigned work item. Identify exact interfaces, files, acceptance criteria, and risks. Do not claim changes were made." }),
  Object.freeze({ id: "tester", instruction: "Create an adversarial verification plan for the assigned work item. Specify tests, edge cases, expected results, and evidence required." }),
  Object.freeze({ id: "security_auditor", instruction: "Independently audit the assigned work item for authority, permissions, secret isolation, provenance, quota boundaries, and fail-closed behavior." })
]);

const DEFAULT_MODEL = "gemini-2.5-flash";

function classifyError(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
  if (status === 429) return "QUOTA_EXHAUSTED";
  if (status === 401 || status === 403) return "AUTH_FAILED";
  return "FAILED";
}

async function createGoogleClient(apiKey) {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length !== 4) {
    throw new TypeError("Exactly four isolated task strings are required.");
  }
  for (const [index, task] of tasks.entries()) {
    if (typeof task !== "string" || task.trim().length < 1 || task.length > 12000) {
      throw new TypeError(`Task ${index + 1} must be a non-empty string of at most 12000 characters.`);
    }
    if (/AIza[0-9A-Za-z_-]{30,}/.test(task)) {
      throw new Error(`Task ${index + 1} rejected: it appears to contain a Google API key.`);
    }
  }
  if (new Set(tasks.map((task) => task.trim())).size !== 4) {
    throw new Error("Each agent must receive a distinct task; duplicate task payloads are rejected.");
  }
}

export async function runFourAgents({
  tasks,
  env = process.env,
  createClient = createGoogleClient,
  model = env.GEMINI_MODEL || DEFAULT_MODEL
} = {}) {
  validateTasks(tasks);

  const keys = AGENT_KEY_ENV.map((name) => env[name]);
  if (keys.some((key) => typeof key !== "string" || key.trim() === "")) {
    return {
      status: "CONFIG_BLOCKED",
      model,
      results: AGENT_KEY_ENV.map((keyEnv, index) => ({
        agent: index + 1,
        role: AGENT_ROLES[index].id,
        keyEnv,
        status: typeof env[keyEnv] === "string" && env[keyEnv].trim() ? "NOT_RUN" : "MISSING_CREDENTIAL",
        output: null
      }))
    };
  }

  // Compare credentials in memory only; never log, hash, return, or persist them.
  const normalizedKeys = keys.map((key) => key.trim());
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return {
      status: "CONFIG_BLOCKED",
      model,
      results: AGENT_KEY_ENV.map((keyEnv, index) => ({
        agent: index + 1,
        role: AGENT_ROLES[index].id,
        keyEnv,
        status: "DUPLICATE_CREDENTIAL",
        output: null
      }))
    };
  }

  // One credential, one role, one unique task envelope. No fallback or retries.
  const results = await Promise.all(AGENT_KEY_ENV.map(async (keyEnv, index) => {
    const role = AGENT_ROLES[index];
    try {
      const client = await createClient(keys[index], index + 1);
      const contents = [
        "Role: " + role.id,
        "Role constraints: " + role.instruction,
        "独立 work item (do not assume other agents' task payloads or results):",
        tasks[index]
      ].join("\n\n");
      const response = await client.models.generateContent({ model, contents });
      const output = typeof response?.text === "string" ? response.text : "";
      if (!output.trim()) {
        return { agent: index + 1, role: role.id, keyEnv, taskIndex: index, status: "EMPTY_RESPONSE", output: null };
      }
      return { agent: index + 1, role: role.id, keyEnv, taskIndex: index, status: "SUCCESS", output };
    } catch (error) {
      return {
        agent: index + 1,
        role: role.id,
        keyEnv,
        taskIndex: index,
        status: classifyError(error),
        output: null
      };
    }
  }));

  const succeeded = results.filter((item) => item.status === "SUCCESS").length;
  return {
    status: succeeded === 4 ? "SUCCESS" : succeeded > 0 ? "PARTIAL" : "FAILED",
    model,
    results
  };
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const payload = JSON.parse(input);
  const report = await runFourAgents({ tasks: payload.tasks });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (report.status !== "SUCCESS") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write("Gemini controller failed before completing the request.\n");
    process.exitCode = 1;
  });
}
