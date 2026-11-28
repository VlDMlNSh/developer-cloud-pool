#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "scripts", "validate-pool-contract.mjs");
const TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 64 * 1024;

function usage() {
  return [
    "poolctl — read-only Developer Cloud Pool operator CLI",
    "",
    "Usage:",
    "  node scripts/poolctl.mjs contract validate [--json]",
    "  node scripts/poolctl.mjs --help",
    "",
    "Commands:",
    "  contract validate   Run the existing pool workflow/security contract validator",
    "",
    "Safety:",
    "  This CLI is read-only. It does not access credentials, call APIs, mutate D1,",
    "  approve tasks, dispatch workers, or authorize execution.",
    ""
  ].join("\n");
}

function emitJson(payload) {
  process.stdout.write(JSON.stringify(payload) + "\n");
}

function fail(code, json) {
  if (json) {
    emitJson({
      schemaVersion: 1,
      command: "contract.validate",
      status: "FAIL",
      code,
      checks: [],
      failures: [code],
      dispatch: false,
      executionAuthorized: false
    });
  } else {
    process.stderr.write("poolctl: " + code + "\n");
    process.stderr.write("Run 'node scripts/poolctl.mjs --help' for usage.\n");
  }
  process.exitCode = 2;
}

function main(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === "--help")) {
    process.stdout.write(usage());
    return;
  }

  const json = args.includes("--json");
  if (args[0] !== "contract" || args[1] !== "validate") {
    fail("CLI_COMMAND_UNSUPPORTED", json);
    return;
  }

  const options = args.slice(2);
  if (options.some((option) => option !== "--json") || options.filter((option) => option === "--json").length > 1) {
    fail("CLI_OPTION_UNSUPPORTED", json);
    return;
  }

  // The child receives only a minimal environment. No GitHub token, provider key,
  // repository secret, or caller-controlled argument is forwarded.
  const childEnv = { PATH: process.env.PATH ?? "" };
  if (process.platform === "win32" && process.env.SystemRoot) {
    childEnv.SystemRoot = process.env.SystemRoot;
  }

  const result = spawnSync(process.execPath, [VALIDATOR], {
    cwd: ROOT,
    encoding: "utf8",
    env: childEnv,
    shell: false,
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true
  });

  if (result.error || result.signal || result.status === null) {
    fail("VALIDATOR_PROCESS_FAILED", json);
    return;
  }

  const lines = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  const checks = lines.filter((line) => line.startsWith("PASS "));
  const failures = [
    ...(result.stderr ?? "").split(/\r?\n/).filter((line) => line.startsWith("FAIL ")),
    ...(result.status === 0 && lines.includes("POOL_CONTRACT_VALIDATION=PASS") ? [] : ["POOL_CONTRACT_VALIDATION_NOT_CONFIRMED"])
  ];

  const passed = result.status === 0 && failures.length === 0 &&
    lines.includes("POOL_CONTRACT_VALIDATION=PASS");

  if (json) {
    emitJson({
      schemaVersion: 1,
      command: "contract.validate",
      status: passed ? "PASS" : "FAIL",
      checks,
      failures: passed ? [] : failures,
      dispatch: false,
      executionAuthorized: false
    });
  } else {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (!passed) process.exitCode = 1;
}

main(process.argv.slice(2));
