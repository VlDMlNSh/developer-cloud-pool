import test from "node:test";
import assert from "node:assert/strict";
import {
  consumeOAuthState,
  isAllowedGitHubOwnerId,
  isSessionActive,
  createSessionCookie,
  isTrustedOrigin,
  isAllowedUpstream
} from "./fixtures/auth-policy.js";

test("OAuth state is single-use and cannot be replayed", () => {
  const store = new Map([["state-once", 2_000]]);
  assert.equal(consumeOAuthState(store, "state-once", 1_000), true);
  assert.equal(store.has("state-once"), false);
  assert.equal(consumeOAuthState(store, "state-once", 1_001), false);
});

test("OAuth state rejects mismatch, missing state and expiry", () => {
  const store = new Map([["expected-state", 2_000], ["expired-state", 999]]);
  assert.equal(consumeOAuthState(store, "other-state", 1_000), false);
  assert.equal(store.has("expected-state"), true);
  assert.equal(consumeOAuthState(store, "expired-state", 1_000), false);
  assert.equal(store.has("expired-state"), false);
  assert.equal(consumeOAuthState(store, "", 1_000), false);
});

test("owner allowlist compares canonical GitHub numeric IDs as exact strings", () => {
  const allowlist = ["123456789", "987654321"];
  assert.equal(isAllowedGitHubOwnerId("123456789", allowlist), true);
  for (const rejected of ["0123456789", "123456789 ", "123456788", "0", "-1", "1e8", "9007199254740993", 123456789, null]) {
    assert.equal(isAllowedGitHubOwnerId(rejected, allowlist), false);
  }
});

test("sessions reject expiry, future issue time and revocation", () => {
  const active = { id: "a".repeat(43), issuedAt: 900, expiresAt: 2_000, revokedAt: null };
  assert.equal(isSessionActive(active, 1_000), true);
  assert.equal(isSessionActive({ ...active, expiresAt: 1_000 }, 1_000), false);
  assert.equal(isSessionActive({ ...active, issuedAt: 1_001 }, 1_000), false);
  assert.equal(isSessionActive({ ...active, revokedAt: 999 }, 1_000), false);
  assert.equal(isSessionActive({ ...active, id: "short" }, 1_000), false);
});

test("session cookie uses host-only secure HttpOnly SameSite policy", () => {
  const cookie = createSessionCookie("A".repeat(43), 3_600);
  assert.match(cookie, /^__Host-jarvis_session=/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; Secure(?:;|$)/);
  assert.match(cookie, /; HttpOnly(?:;|$)/);
  assert.match(cookie, /; SameSite=Lax(?:;|$)/);
  assert.doesNotMatch(cookie, /; Domain=/i);
  assert.throws(() => createSessionCookie("short", 3_600), TypeError);
  assert.throws(() => createSessionCookie("A".repeat(43), 0), TypeError);
});

test("CSRF origin policy requires exact HTTPS origin equality", () => {
  assert.equal(isTrustedOrigin("https://pool.example", "https://pool.example"), true);
  assert.equal(isTrustedOrigin("http://pool.example", "https://pool.example"), false);
  assert.equal(isTrustedOrigin("https://evil.example", "https://pool.example"), false);
  assert.equal(isTrustedOrigin("https://pool.example.evil", "https://pool.example"), false);
  assert.equal(isTrustedOrigin("https://pool.example/path", "https://pool.example"), false);
  assert.equal(isTrustedOrigin("null", "https://pool.example"), false);
});

test("upstream policy allows only exact HTTPS origins without credentials or custom ports", () => {
  const allowed = ["https://api.github.com"];
  assert.equal(isAllowedUpstream("https://api.github.com", allowed), true);
  assert.equal(isAllowedUpstream("https://api.github.com/user", allowed), true);
  assert.equal(isAllowedUpstream("http://api.github.com", allowed), false);
  assert.equal(isAllowedUpstream("https://api.github.com.evil.test", allowed), false);
  assert.equal(isAllowedUpstream("https://user:pass@api.github.com", allowed), false);
  assert.equal(isAllowedUpstream("https://api.github.com:8443", allowed), false);
  assert.equal(isAllowedUpstream("https://evil.test", allowed), false);
});
