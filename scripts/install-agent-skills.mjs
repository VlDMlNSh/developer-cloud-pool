#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const manifestPath = path.join(repoRoot, "config", "agent-skills.lock.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const outputRoot = path.resolve(process.argv[2] || process.env.GITHUB_WORKSPACE || repoRoot);
const env = { ...process.env, CI: "1", DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1", SKILLS_TELEMETRY: "0" };
const cliVersion = manifest.cli?.version;
if (!/^\\d+\\.\\d+\\.\\d+$/.test(cliVersion || "")) throw new Error("Skills CLI version must be exact-pinned.");
if (manifest.target_agent !== "gemini-cli" || manifest.install_mode !== "project-copy") throw new Error("Unexpected agent target or install mode.");
fs.mkdirSync(outputRoot, { recursive: true });
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + " exited with " + result.status);
  return result.stdout || "";
}
const cliPrefix = path.join(os.tmpdir(), "cloud-pool-skills-cli-" + process.pid);
run("npm", ["install", "--prefix", cliPrefix, "--no-audit", "--no-fund", "--save-exact", "skills@" + cliVersion], outputRoot);
const cli = path.join(cliPrefix, "node_modules", ".bin", process.platform === "win32" ? "skills.cmd" : "skills");
if (!fs.existsSync(cli)) throw new Error("Pinned Skills CLI executable is missing.");
const expected = [];
for (const source of manifest.sources) {
  if (!/^[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+$/.test(source.repository || "")) throw new Error("Invalid skill repository.");
  if (!/^[0-9a-f]{40}$/.test(source.ref || "")) throw new Error("Skill source must be pinned to a full commit SHA.");
  const args = ["add", source.repository + "@" + source.ref];
  for (const item of source.skills || []) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.name || "")) throw new Error("Invalid skill name.");
    args.push("--skill", item.name);
    expected.push(item.name);
  }
  args.push("--agent", manifest.target_agent, "--copy", "--yes");
  run(cli, args, outputRoot);
}
const skillsRoot = path.join(outputRoot, ".agents", "skills");
const missing = expected.filter(name => !fs.existsSync(path.join(skillsRoot, name, "SKILL.md")));
if (missing.length) throw new Error("Expected skills not installed: " + missing.join(", "));
const inventory = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      const bytes = fs.readFileSync(full);
      inventory.push(path.relative(outputRoot, full).replaceAll(path.sep, "/") + "  " + crypto.createHash("sha256").update(bytes).digest("hex"));
    }
  }
}
walk(skillsRoot);
const inventoryText = inventory.join("\\n") + "\\n";
const inventoryPath = path.join(outputRoot, "agent-skills-inventory.sha256");
fs.writeFileSync(inventoryPath, inventoryText);
const digest = crypto.createHash("sha256").update(inventoryText).digest("hex");
const summary = ["## Cloud Pool agent skills bootstrap", "", "- Skills CLI: " + cliVersion, "- Agent target: " + manifest.target_agent, "- Install mode: " + manifest.install_mode, "- Skills expected/verified: " + expected.length + "/" + expected.length, "- Files hashed: " + inventory.length, "- Inventory SHA-256: " + digest, "- Sources: pinned full Git commit SHAs", "- Telemetry: disabled", "- Skill scripts executed: no", "- Secrets/provider credentials: none"].join("\\n") + "\\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.stdout.write(summary);
