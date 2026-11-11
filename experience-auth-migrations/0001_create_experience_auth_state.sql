CREATE TABLE IF NOT EXISTS oauth_transactions (
  state_hash TEXT PRIMARY KEY NOT NULL
    CHECK (length(state_hash) = 64 AND state_hash NOT GLOB '*[^0-9a-f]*'),
  browser_binding_hash TEXT NOT NULL
    CHECK (length(browser_binding_hash) = 64 AND browser_binding_hash NOT GLOB '*[^0-9a-f]*'),
  pkce_verifier_envelope TEXT NOT NULL
    CHECK (length(pkce_verifier_envelope) BETWEEN 32 AND 2048),
  encryption_key_version TEXT NOT NULL
    CHECK (length(encryption_key_version) BETWEEN 1 AND 32),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at),
  consumed_at INTEGER,
  CHECK (consumed_at IS NULL OR (consumed_at >= created_at AND consumed_at < expires_at))
) STRICT;

CREATE INDEX IF NOT EXISTS oauth_transactions_expiry_idx
  ON oauth_transactions (expires_at);

CREATE TABLE IF NOT EXISTS application_sessions (
  session_hash TEXT PRIMARY KEY NOT NULL
    CHECK (length(session_hash) = 64 AND session_hash NOT GLOB '*[^0-9a-f]*'),
  github_user_id TEXT NOT NULL
    CHECK (
      length(github_user_id) BETWEEN 1 AND 20
      AND github_user_id NOT GLOB '*[^0-9]*'
      AND substr(github_user_id, 1, 1) BETWEEN '1' AND '9'
    ),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at),
  revoked_at INTEGER,
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
) STRICT;

CREATE INDEX IF NOT EXISTS application_sessions_expiry_idx
  ON application_sessions (expires_at);
