import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import {
  issueOAuthTransaction,
  consumeOAuthTransaction,
  createApplicationSession,
  lookupApplicationSession,
  revokeApplicationSession
} from "../src/experience-auth-session.js";

const NOW = 1_800_000_000;
const stateHash = "a".repeat(64);
const bindingHash = "b".repeat(64);
const sessionHash = "c".repeat(64);
const envelope = "E".repeat(48);
const db = () => env.EXPERIENCE_AUTH_DB;

async function reset() {
  await applyD1Migrations(db(), env.TEST_EXPERIENCE_AUTH_MIGRATIONS);
  await db().prepare("DELETE FROM oauth_transactions").run();
  await db().prepare("DELETE FROM application_sessions").run();
}

beforeEach(reset);

describe("isolated Experience auth D1 schema", () => {
  it("consumes one OAuth state across concurrent callbacks", async () => {
    expect(await issueOAuthTransaction(db(), {
      stateHash, browserBindingHash: bindingHash,
      pkceVerifierEnvelope: envelope, encryptionKeyVersion: "k1",
      createdAt: NOW, expiresAt: NOW + 600
    })).toEqual({ outcome: "ISSUED" });

    const results = await Promise.all(Array.from({ length: 50 }, () =>
      consumeOAuthTransaction(db(), { stateHash, browserBindingHash: bindingHash, now: NOW + 1 })
    ));
    expect(results.filter(x => x.outcome === "CONSUMED_ONCE")).toHaveLength(1);
    expect(results.filter(x => x.outcome === "DENY")).toHaveLength(49);
    const stored = await db().prepare(
      "SELECT consumed_at FROM oauth_transactions WHERE state_hash = ?"
    ).bind(stateHash).first();
    expect(stored.consumed_at).toBe(NOW + 1);
  });

  it("rejects OAuth binding mismatch, expiry and replay", async () => {
    await issueOAuthTransaction(db(), {
      stateHash, browserBindingHash: bindingHash,
      pkceVerifierEnvelope: envelope, encryptionKeyVersion: "k1",
      createdAt: NOW, expiresAt: NOW + 10
    });
    expect((await consumeOAuthTransaction(db(), {
      stateHash, browserBindingHash: "d".repeat(64), now: NOW + 1
    })).outcome).toBe("DENY");
    expect((await consumeOAuthTransaction(db(), {
      stateHash, browserBindingHash: bindingHash, now: NOW + 10
    })).outcome).toBe("DENY");
    expect((await consumeOAuthTransaction(db(), {
      stateHash, browserBindingHash: bindingHash, now: NOW + 2
    })).outcome).toBe("CONSUMED_ONCE");
    expect((await consumeOAuthTransaction(db(), {
      stateHash, browserBindingHash: bindingHash, now: NOW + 3
    })).outcome).toBe("DENY");
  });

  it("rejects malformed hashes, noncanonical GitHub IDs and invalid lifetimes", async () => {
    expect((await issueOAuthTransaction(db(), {
      stateHash: "not-a-digest", browserBindingHash: bindingHash,
      pkceVerifierEnvelope: envelope, encryptionKeyVersion: "k1",
      createdAt: NOW, expiresAt: NOW + 600
    })).outcome).toBe("DENY");
    for (const githubUserId of ["0", "01", "-1", "1e9", "900719925474099312345", 12345]) {
      expect((await createApplicationSession(db(), {
        sessionHash, githubUserId, createdAt: NOW, expiresAt: NOW + 3600
      })).outcome).toBe("DENY");
    }
    expect((await createApplicationSession(db(), {
      sessionHash, githubUserId: "12345", createdAt: NOW, expiresAt: NOW
    })).outcome).toBe("DENY");
  });

  it("creates, looks up, expires and revokes a server-side session", async () => {
    expect(await createApplicationSession(db(), {
      sessionHash, githubUserId: "12345678901234567890",
      createdAt: NOW, expiresAt: NOW + 3600
    })).toEqual({ outcome: "CREATED" });
    expect(await lookupApplicationSession(db(), { sessionHash, now: NOW + 1 }))
      .toEqual({ outcome: "ACTIVE", githubUserId: "12345678901234567890" });
    expect((await lookupApplicationSession(db(), { sessionHash, now: NOW + 3600 })).outcome)
      .toBe("DENY");
    expect(await revokeApplicationSession(db(), { sessionHash, now: NOW + 2 }))
      .toEqual({ outcome: "REVOKED" });
    expect((await lookupApplicationSession(db(), { sessionHash, now: NOW + 3 })).outcome)
      .toBe("DENY");
    expect((await revokeApplicationSession(db(), { sessionHash, now: NOW + 4 })).outcome)
      .toBe("DENY");
  });

  it("fails closed on missing storage and storage exceptions", async () => {
    expect((await revokeApplicationSession(db(), {
      sessionHash: { toString: () => sessionHash }, now: NOW
    })).outcome).toBe("DENY");
    expect((await lookupApplicationSession(undefined, { sessionHash, now: NOW })).outcome)
      .toBe("DENY");
    const broken = { prepare() { throw new Error("synthetic unavailable"); } };
    expect((await lookupApplicationSession(broken, { sessionHash, now: NOW })).outcome)
      .toBe("DENY");
    expect((await revokeApplicationSession(broken, { sessionHash, now: NOW })).outcome)
      .toBe("DENY");
  });

  it("database constraints reject malformed direct writes", async () => {
    await expect(db().prepare(`
      INSERT INTO application_sessions (session_hash, github_user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind("x", "01", NOW, NOW + 10).run()).rejects.toThrow();
    for (const [invalidEnvelope, keyVersion] of [
      ["tiny", "k1"],
      ["!".repeat(48), "k1"],
      [envelope, "bad/key"]
    ]) {
      await expect(db().prepare(`
        INSERT INTO oauth_transactions (
          state_hash, browser_binding_hash, pkce_verifier_envelope,
          encryption_key_version, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(stateHash, bindingHash, invalidEnvelope, keyVersion, NOW, NOW + 10).run()).rejects.toThrow();
    }
  });
});
