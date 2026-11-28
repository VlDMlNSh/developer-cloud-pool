import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "poolctl.mjs");

function run(args, extraEnv = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", ...extraEnv },
    shell: false,
    timeout: 15_000,
    maxBuffer: 64 * 1024,
    windowsHide: true
  });
}

test("help documents only the read-only contract validation command", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /contract validate/);
  assert.match(result.stdout, /read-only/);
  assert.doesNotMatch(result.stdout, /(^|\n)\s{2}(dispatch|approve|run|exec)\s{2,}/m);
});

test("contract validation emits a stable machine-readable success result", () => {
  const result = run(["contract", "validate", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.command, "contract.validate");
  assert.equal(payload.status, "PASS");
  assert.ok(payload.checks.length > 0);
  assert.deepEqual(payload.failures, []);
  assert.equal(payload.dispatch, false);
  assert.equal(payload.executionAuthorized, false);
});

test("unsupported command fails closed with a stable JSON error", () => {
  const result = run(["dispatch", "--json"]);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "FAIL");
  assert.equal(payload.code, "CLI_COMMAND_UNSUPPORTED");
  assert.equal(payload.dispatch, false);
  assert.equal(payload.executionAuthorized, false);
});

test("unknown options fail closed", () => {
  const result = run(["contract", "validate", "--json", "--token", "not-accepted"]);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.code, "CLI_OPTION_UNSUPPORTED");
  assert.equal(payload.dispatch, false);
  assert.equal(payload.executionAuthorized, false);
});

test("caller environment values are not echoed by the CLI", () => {
  const sentinel = "POOLCTL_ENV_SENTINEL_DO_NOT_ECHO";
  const result = run(["contract", "validate", "--json"], { POOLCTL_TEST_SECRET_SENTINEL: sentinel });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /(^|\n)\s{2}(dispatch|approve|run|exec)\s{2,}/m);
  assert.doesNotMatch(result.stderr, new RegExp(sentinel));
});
