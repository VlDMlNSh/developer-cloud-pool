const HEX_256 = /^[0-9a-f]{64}$/;
const KEY_VERSION = /^[A-Za-z0-9._-]{1,32}$/;
const ENVELOPE = /^[A-Za-z0-9_-]{32,2048}$/;
const GITHUB_ID = /^[1-9][0-9]{0,19}$/;

function validDb(db) {
  return Boolean(db && typeof db.prepare === "function");
}

function deny(reason) {
  return { outcome: "DENY", reason };
}

export async function issueOAuthTransaction(db, input) {
  if (!validDb(db)) return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.stateHash !== "string" || !HEX_256.test(input.stateHash) ||
      typeof input.browserBindingHash !== "string" || !HEX_256.test(input.browserBindingHash) ||
      typeof input.pkceVerifierEnvelope !== "string" || !ENVELOPE.test(input.pkceVerifierEnvelope) ||
      typeof input.encryptionKeyVersion !== "string" || !KEY_VERSION.test(input.encryptionKeyVersion) ||
      !Number.isSafeInteger(input.createdAt) || input.createdAt <= 0 ||
      !Number.isSafeInteger(input.expiresAt) || input.expiresAt <= input.createdAt) {
    return deny("INVALID_OAUTH_TRANSACTION");
  }

  try {
    await db.prepare(`
      INSERT INTO oauth_transactions (
        state_hash, browser_binding_hash, pkce_verifier_envelope,
        encryption_key_version, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      input.stateHash, input.browserBindingHash, input.pkceVerifierEnvelope,
      input.encryptionKeyVersion, input.createdAt, input.expiresAt
    ).run();
    return { outcome: "ISSUED" };
  } catch {
    return deny("OAUTH_TRANSACTION_WRITE_FAILED");
  }
}

export async function consumeOAuthTransaction(db, input) {
  if (!validDb(db)) return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.stateHash !== "string" || !HEX_256.test(input.stateHash) ||
      typeof input.browserBindingHash !== "string" || !HEX_256.test(input.browserBindingHash) ||
      !Number.isSafeInteger(input.now) || input.now <= 0) {
    return deny("INVALID_OAUTH_CALLBACK");
  }

  try {
    const row = await db.prepare(`
      UPDATE oauth_transactions
         SET consumed_at = ?
       WHERE state_hash = ?
         AND browser_binding_hash = ?
         AND consumed_at IS NULL
         AND expires_at > ?
      RETURNING pkce_verifier_envelope, encryption_key_version
    `).bind(input.now, input.stateHash, input.browserBindingHash, input.now).first();

    if (!row) return deny("OAUTH_STATE_MISMATCH_EXPIRED_OR_REPLAYED");
    return {
      outcome: "CONSUMED_ONCE",
      pkceVerifierEnvelope: row.pkce_verifier_envelope,
      encryptionKeyVersion: row.encryption_key_version
    };
  } catch {
    return deny("OAUTH_STATE_STORAGE_AMBIGUOUS");
  }
}

export async function createApplicationSession(db, input) {
  if (!validDb(db)) return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.sessionHash !== "string" || !HEX_256.test(input.sessionHash) ||
      typeof input.githubUserId !== "string" || !GITHUB_ID.test(input.githubUserId) ||
      !Number.isSafeInteger(input.createdAt) || input.createdAt <= 0 ||
      !Number.isSafeInteger(input.expiresAt) || input.expiresAt <= input.createdAt) {
    return deny("INVALID_SESSION");
  }

  try {
    await db.prepare(`
      INSERT INTO application_sessions (session_hash, github_user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(input.sessionHash, input.githubUserId, input.createdAt, input.expiresAt).run();
    return { outcome: "CREATED" };
  } catch {
    return deny("SESSION_WRITE_FAILED");
  }
}

export async function lookupApplicationSession(db, input) {
  if (!validDb(db)) return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.sessionHash !== "string" || !HEX_256.test(input.sessionHash) ||
      !Number.isSafeInteger(input.now) || input.now <= 0) {
    return deny("INVALID_SESSION_LOOKUP");
  }

  try {
    const row = await db.prepare(`
      SELECT github_user_id
        FROM application_sessions
       WHERE session_hash = ?
         AND revoked_at IS NULL
         AND created_at <= ?
         AND expires_at > ?
       LIMIT 1
    `).bind(input.sessionHash, input.now, input.now).first();

    return row ? { outcome: "ACTIVE", githubUserId: row.github_user_id } : deny("SESSION_INACTIVE");
  } catch {
    return deny("SESSION_LOOKUP_AMBIGUOUS");
  }
}

export async function revokeApplicationSession(db, input) {
  if (!validDb(db)) return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.sessionHash !== "string" || !HEX_256.test(input.sessionHash) ||
      !Number.isSafeInteger(input.now) || input.now <= 0) {
    return deny("INVALID_SESSION_REVOCATION");
  }

  try {
    const result = await db.prepare(`
      UPDATE application_sessions
         SET revoked_at = ?
       WHERE session_hash = ?
         AND revoked_at IS NULL
    `).bind(input.now, input.sessionHash).run();

    if (result?.success === true && result?.meta?.changes === 1) {
      return { outcome: "REVOKED" };
    }
    return deny("SESSION_NOT_ACTIVE_OR_ALREADY_REVOKED");
  } catch {
    return deny("SESSION_REVOCATION_AMBIGUOUS");
  }
}
