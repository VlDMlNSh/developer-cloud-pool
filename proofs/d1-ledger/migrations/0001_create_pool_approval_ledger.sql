CREATE TABLE IF NOT EXISTS pool_approval_ledger (
  approval_id TEXT PRIMARY KEY NOT NULL CHECK (length(approval_id) BETWEEN 1 AND 128),
  owner_numeric_id TEXT NOT NULL CHECK (length(owner_numeric_id) > 0 AND owner_numeric_id NOT GLOB '*[^0-9]*'),
  repository_id TEXT NOT NULL CHECK (length(repository_id) > 0 AND repository_id NOT GLOB '*[^0-9]*'),
  issue_number INTEGER NOT NULL CHECK (issue_number > 0),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40 AND target_sha NOT GLOB '*[^0-9a-f]*'),
  profile TEXT NOT NULL CHECK (profile = 'dsh-headless-probe'),
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64 AND envelope_digest NOT GLOB '*[^0-9a-f]*'),
  expires_at INTEGER NOT NULL CHECK (expires_at > 0),
  consumed_at INTEGER,
  state TEXT NOT NULL DEFAULT 'ready' CHECK (state IN ('ready', 'consumed', 'revoked')),
  CHECK (
    (state = 'ready' AND consumed_at IS NULL) OR
    (state = 'consumed' AND consumed_at IS NOT NULL) OR
    state = 'revoked'
  )
);

CREATE INDEX IF NOT EXISTS pool_approval_owner_repository_issue
  ON pool_approval_ledger (owner_numeric_id, repository_id, issue_number);
