import { pathToFileURL } from "node:url";

export const AGENT_KEY_ENV = Object.freeze([
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4"
]);

export const AGENT_ROLES = Object.freeze([
  Object.freeze({ id: "researcher", instruction: "Research the task. Identify relevant facts, assumptions, dependencies, and unresolved questions. Do not implement changes." }),
  Object.freeze({ id: "implementer", instruction: "Propose a minimal implementation plan. Identify exact files, interfaces, and acceptance criteria. Do not claim changes were made." }),
  Object.freeze({ id: "tester", instruction: "Design adversarial tests and verification steps. Focus on edge cases, regressions, and measurable acceptance evidence." }),
  Object.freeze({ id: "security_auditor", instruction: "Audit security, permissions, secrets, provenance, and failure modes. Recommend fail-closed controls." })
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

function validateTask(task) {
  if (typeof task !== "string" || task.trim().length < 1 || task.length > 20000) {
    throw new TypeError("Task must be a non-empty string of at most 20000 characters.");
  }
  if (/AIza[0-9A-Za-z_-]{30,}/.test(task)) {
    throw new Error("Task rejected: it appears to contain a Google API key.");
  }
}

export async function runFourAgents({
  task,
  env = process.env,
  createClient = createGoogleClient,
  model = env.GEMINI_MODEL || DEFAULT_MODEL
} = {}) {
  validateTask(task);

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

  // Detect repeated credential values without logging, hashing, or returning them.
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

  // Each account receives one distinct role. No retries or cross-account fallback.
  const results = await Promise.all(AGENT_KEY_ENV.map(async (keyEnv, index) => {
    const apiKey = keys[index];
    const role = AGENT_ROLES[index];
    try {
      const client = await createClient(apiKey, index + 1);
      const contents = role.instruction + "\n\nProject task:\n" + task;
      const response = await client.models.generateContent({ model, contents });
      const output = typeof response?.text === "string" ? response.text : "";
      if (!output.trim()) {
        return { agent: index + 1, role: role.id, keyEnv, status: "EMPTY_RESPONSE", output: null };
      }
      return { agent: index + 1, role: role.id, keyEnv, status: "SUCCESS", output };
    } catch (error) {
      return {
        agent: index + 1,
        role: role.id,
        keyEnv,
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
  const task = process.argv.slice(2).join(" ").trim();
  const report = await runFourAgents({ task });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (report.status !== "SUCCESS") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.stderr.write("Gemini controller failed before completing the request.\n");
    process.exitCode = 1;
  });
}
