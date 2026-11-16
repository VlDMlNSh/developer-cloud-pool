import { pathToFileURL } from "node:url";

export const AGENT_KEY_ENV = Object.freeze([
  "GEMINI_API_KEY_1",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4"
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
        keyEnv,
        status: env[keyEnv] ? "NOT_RUN" : "MISSING_CREDENTIAL",
        output: null
      }))
    };
  }

  // Each agent receives only its own account credential. No retries or cross-account
  // fallback: quota and authentication failures remain attributable to that account.
  const results = await Promise.all(AGENT_KEY_ENV.map(async (keyEnv, index) => {
    const apiKey = keys[index];
    try {
      const client = await createClient(apiKey, index + 1);
      const response = await client.models.generateContent({ model, contents: task });
      const output = typeof response?.text === "string" ? response.text : "";
      if (!output.trim()) {
        return { agent: index + 1, keyEnv, status: "EMPTY_RESPONSE", output: null };
      }
      return { agent: index + 1, keyEnv, status: "SUCCESS", output };
    } catch (error) {
      return {
        agent: index + 1,
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
    // Deliberately avoid printing exception messages that could contain request data.
    process.stderr.write("Gemini controller failed before completing the request.\n");
    process.exitCode = 1;
  });
}
