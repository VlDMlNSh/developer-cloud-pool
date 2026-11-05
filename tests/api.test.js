import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/index.js";

test("health endpoint reports service health without claiming pool health", async () => {
  const response = await app.request("/api/v1/health");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.service, "jarvis-web-console");
  assert.equal(body.status, "ok");
  assert.equal(body.pool_status, "unknown");
  assert.equal(body.authentication, "not_configured");
  assert.equal(body.dispatch, "disabled");
});

test("protected read routes fail closed before authentication exists", async () => {
  const response = await app.request("/api/v1/repositories");
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).error, "AUTHENTICATION_NOT_CONFIGURED");
});

test("mutation methods are rejected on API routes", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = await app.request("/api/v1/tasks", { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
  }
});

test("unknown API paths do not return application data", async () => {
  const response = await app.request("/api/unknown");
  assert.equal(response.status, 503);
});
